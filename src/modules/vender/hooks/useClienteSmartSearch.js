import { useState, useRef, useCallback, useEffect } from 'react'
import { venderController } from '../controllers/venderController.js'
import { toast } from '../../../utils/toast.js'

const MIN_SEARCH_CHARS = 5
const DEBOUNCE_MS = 400

/**
 * Hook para búsqueda inteligente híbrida de clientes:
 * 1. DNI (8 dígitos) o RUC (11 dígitos):
 *    - Primero busca en BD Local (coincidencia exacta).
 *    - Si no existe, consulta API Externa (SUNAT/RENIEC) con flag isNuevo: true.
 * 2. Texto >= 5 caracteres (Razón Social / Nombre):
 *    - Despliega sugerencias predictivas filtradas desde la BD local.
 * 3. Prevención de condiciones de carrera mediante lastQueryRef.
 * 4. Lazy Registration: los clientes nuevos quedan marcados con isNuevo=true y temp id.
 */
export function useClienteSmartSearch({
  cliente,
  setCliente,
  tipoDocumento,
  setTipoDocumento
}) {
  const [docInput, setDocInput] = useState(cliente?.numero_documento || '')
  const [sugerencias, setSugerencias] = useState([])
  const [showSugerencias, setShowSugerencias] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchStatus, setSearchStatus] = useState('idle') // 'idle' | 'searching' | 'success' | 'not_found' | 'error'

  const debounceRef = useRef(null)
  const lastQueryRef = useRef('')
  const containerRef = useRef(null)
  const isInternalSelectionRef = useRef(false)

  // Auto-ajustar comprobante según el documento
  const sincronizarTipoComprobante = useCallback((docTipo) => {
    if (!setTipoDocumento) return
    if (docTipo === 'ruc') {
      setTipoDocumento('factura')
    } else if (docTipo === 'dni') {
      setTipoDocumento('boleta')
    }
  }, [setTipoDocumento])

  // Sincronizar input si el cliente cambia externamente (ej: desde modal de búsqueda)
  useEffect(() => {
    if (isInternalSelectionRef.current) return
    const numDoc = cliente?.numero_documento || ''
    setDocInput(numDoc)
    if (numDoc && numDoc !== '99999999') {
      setSearchStatus('success')
      const docTipo = numDoc.length === 11 ? 'ruc' : numDoc.length === 8 ? 'dni' : null
      if (docTipo) {
        sincronizarTipoComprobante(docTipo)
      }
    } else {
      setSearchStatus('idle')
    }
  }, [cliente, sincronizarTipoComprobante])

  // Click outside para cerrar sugerencias
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSugerencias(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Seleccionar cliente (de sugerencia, local o API)
  const seleccionarCliente = useCallback((clienteData, options = {}) => {
    isInternalSelectionRef.current = true
    setCliente(clienteData)
    setDocInput(clienteData.numero_documento || clienteData.ruc || '')
    setSugerencias([])
    setShowSugerencias(false)
    setSearchStatus('success')

    const numDoc = clienteData.numero_documento || clienteData.ruc || ''
    const docTipo = numDoc.length === 11 ? 'ruc' : numDoc.length === 8 ? 'dni' : null
    if (docTipo) {
      sincronizarTipoComprobante(docTipo)
    }

    if (!options.silent) {
      toast.success(
        clienteData.isNuevo ? 'Datos de SUNAT / RENIEC obtenidos' : 'Cliente seleccionado',
        clienteData.nombre_razon_social || clienteData.razonSocial
      )
    }

    setTimeout(() => {
      isInternalSelectionRef.current = false
    }, 300)
  }, [setCliente, sincronizarTipoComprobante])

  // Búsqueda directa / ejecución de la consulta
  const ejecutarBusqueda = useCallback(async (query) => {
    const normalized = query.trim()
    const queryLower = normalized.toLowerCase()
    lastQueryRef.current = queryLower

    if (!normalized) {
      setSugerencias([])
      setShowSugerencias(false)
      setLoading(false)
      setSearchStatus('idle')
      return
    }

    // Caso cliente VARIOS rápido
    if (normalized === '99999999') {
      seleccionarCliente({
        id: '00000000-0000-0000-0000-000000000000',
        tipo_documento_id: '1',
        numero_documento: '99999999',
        nombre_razon_social: 'VARIOS',
        isNuevo: false
      }, { silent: true })
      return
    }

    // Control de longitud mínima
    if (normalized.length < MIN_SEARCH_CHARS) {
      setSugerencias([])
      setShowSugerencias(false)
      setLoading(false)
      setSearchStatus('idle')
      return
    }

    setLoading(true)
    setSearchStatus('searching')

    const esRuc = /^\d{11}$/.test(normalized)
    const esDni = /^\d{8}$/.test(normalized)

    try {
      if (esRuc || esDni) {
        // === CASO A: DOCUMENTO NUMÉRICO EXACTO (RUC o DNI) ===
        const tipoDoc = esRuc ? 'ruc' : 'dni'

        // Nivel 1: Buscar en BD Local
        const resLocal = await venderController.buscarClientes(normalized)
        if (lastQueryRef.current !== queryLower) return // Race condition check

        if (resLocal.success && Array.isArray(resLocal.data) && resLocal.data.length > 0) {
          const matchExacto = resLocal.data.find(
            (c) => String(c.numero_documento).trim() === normalized
          )
          if (matchExacto) {
            seleccionarCliente({
              ...matchExacto,
              isNuevo: false,
              source: 'local'
            })
            return
          }
        }

        // Nivel 2: Consulta Externa (Fallback SUNAT / RENIEC)
        const resApi = await venderController.consultarDocumento(tipoDoc, normalized)
        if (lastQueryRef.current !== queryLower) return // Race condition check

        if (resApi.success && resApi.data) {
          const d = resApi.data
          const nombre =
            d.name ||
            d.razon_social ||
            d.razonSocial ||
            d.nombre_o_razon_social ||
            d.nombre_completo ||
            `${d.nombres || ''} ${d.apellido_paterno || ''} ${d.apellido_materno || ''}`.trim()

          const direccion = d.address || d.direccion_completa || d.direccion || ''
          const estado = d.status || d.estado || null
          const condicion = d.condition || d.condicion || null

          const clienteExterno = {
            id: `temp_${normalized}`,
            tipo_documento_id: esRuc ? '6' : '1',
            numero_documento: d.doc_number || normalized,
            nombre_razon_social: nombre || (esRuc ? `EMPRESA ${normalized}` : `PERSONA ${normalized}`),
            direccion_1: direccion,
            direccion: direccion,
            ubigeo: d.ubigeo || null,
            estado_sunat: estado,
            condicion_sunat: condicion,
            source: 'externo',
            isNuevo: true
          }

          seleccionarCliente(clienteExterno)
        } else {
          setSugerencias([])
          setShowSugerencias(false)
          setSearchStatus('not_found')
          toast.error('No encontrado', resApi.message || 'No se obtuvieron datos en SUNAT/RENIEC ni en local.')
        }
      } else {
        // === CASO B: BÚSQUEDA POR RAZÓN SOCIAL / NOMBRE (Predictivo) ===
        const resLocal = await venderController.buscarClientes(normalized)
        if (lastQueryRef.current !== queryLower) return

        if (resLocal.success && Array.isArray(resLocal.data)) {
          const filtrados = resLocal.data
            .filter((c) =>
              (c.nombre_razon_social || c.razonSocial || '')
                .toLowerCase()
                .includes(queryLower)
            )
            .slice(0, 6)

          setSugerencias(filtrados)
          setShowSugerencias(filtrados.length > 0)
          setSearchStatus(filtrados.length > 0 ? 'idle' : 'not_found')
        } else {
          setSugerencias([])
          setShowSugerencias(false)
          setSearchStatus('not_found')
        }
      }
    } catch (error) {
      if (lastQueryRef.current !== queryLower) return
      console.error('Error en búsqueda inteligente:', error)
      setSugerencias([])
      setShowSugerencias(false)
      setSearchStatus('error')
    } finally {
      if (lastQueryRef.current === queryLower) {
        setLoading(false)
      }
    }
  }, [seleccionarCliente])

  // Manejar cambio en input con debounce
  const handleInputChange = (e) => {
    const val = e.target.value
    setDocInput(val)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    const trimmed = val.trim()
    if (!trimmed) {
      setSugerencias([])
      setShowSugerencias(false)
      setLoading(false)
      setSearchStatus('idle')
      return
    }

    if (trimmed.length < MIN_SEARCH_CHARS) {
      setSugerencias([])
      setShowSugerencias(false)
      setLoading(false)
      setSearchStatus('idle')
      return
    }

    debounceRef.current = setTimeout(() => {
      ejecutarBusqueda(trimmed)
    }, DEBOUNCE_MS)
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      ejecutarBusqueda(docInput)
    }
  }

  return {
    docInput,
    setDocInput,
    sugerencias,
    showSugerencias,
    setShowSugerencias,
    loading,
    searchStatus,
    containerRef,
    handleInputChange,
    handleKeyDown,
    seleccionarCliente,
    ejecutarBusqueda
  }
}
