import { useEffect, useState, useMemo } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Modal from '../../../components/ui/Modal.jsx'
import SearchableSelect from '../../../components/ui/SearchableSelect.jsx'
import api from '../../../utils/api'
import { toast } from '../../../utils/toast'

export default function ClienteModal({
  isOpen,
  onClose,
  onSave,
  cliente,
  tiposDocumento = [],
  isProcessing = false,
  variant = 'drawer'
}) {
  const [formData, setFormData] = useState({
    tipo_documento_id: '1',
    numero_documento: '',
    nombre_razon_social: '',
    direccion_1: '',
    email_1: '',
    telefono_1: '',
    limite_credito: 0,
    dias_credito_pactado: 30,
    cantidad_cuotas: 1,
    estado_credito: 'NORMAL'
  })
  const [isSearching, setIsSearching] = useState(false)

  // Mapear tiposDocumento para las opciones de SearchableSelect
  const tiposDocumentoOptions = useMemo(() => {
    if (tiposDocumento.length > 0) {
      return tiposDocumento.map((td) => ({
        value: String(td.id),
        label: td.abreviatura ? `${td.abreviatura} - ${td.descripcion}` : td.descripcion,
        sublabel: td.abreviatura || td.codigo || td.id
      }))
    }
    return [
      { value: '1', label: 'DNI - Doc. Nacional de Identidad', sublabel: 'DNI' },
      { value: '6', label: 'RUC - Reg. Único de Contribuyentes', sublabel: 'RUC' },
      { value: '4', label: 'CE - Carnet de Extranjería', sublabel: 'CE' },
      { value: '7', label: 'PAS - Pasaporte', sublabel: 'PAS' }
    ]
  }, [tiposDocumento])

  useEffect(() => {
    if (cliente) {
      setFormData({
        tipo_documento_id: String(cliente.tipo_documento_id || '1'),
        numero_documento: cliente.numero_documento || '',
        nombre_razon_social: cliente.nombre_razon_social || '',
        direccion_1: cliente.direccion_1 || '',
        email_1: cliente.email_1 || '',
        telefono_1: cliente.telefono_1 || '',
        limite_credito: cliente.limite_credito ?? (Number(cliente.limite_credito_int || 0) / 100),
        dias_credito_pactado: cliente.dias_credito_pactado ?? 30,
        cantidad_cuotas: cliente.cantidad_cuotas ?? 1,
        estado_credito: cliente.estado_credito || 'NORMAL'
      })
    } else {
      setFormData({
        tipo_documento_id: '1',
        numero_documento: '',
        nombre_razon_social: '',
        direccion_1: '',
        email_1: '',
        telefono_1: '',
        limite_credito: 0,
        dias_credito_pactado: 30,
        cantidad_cuotas: 1,
        estado_credito: 'NORMAL'
      })
    }
  }, [cliente, isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }))
  }

  const handleTipoDocChange = (val) => {
    setFormData(prev => ({
      ...prev,
      tipo_documento_id: String(val || '1')
    }))
  }

  const handleSearchDocumento = async () => {
    const numDoc = formData.numero_documento?.trim()
    const tipo = formData.tipo_documento_id

    if (!numDoc) {
      toast.error('Ingrese el número de documento a consultar')
      return
    }

    // Identificar tipo para la API de utils (RUC o DNI)
    let tipoBusqueda = ''
    if (tipo === '6' || numDoc.length === 11) {
      tipoBusqueda = 'RUC'
    } else if (tipo === '1' || numDoc.length === 8) {
      tipoBusqueda = 'DNI'
    } else {
      toast.error('La consulta en línea solo está disponible para DNI y RUC')
      return
    }

    setIsSearching(true)
    try {
      const response = await api.get(`/utils/consulta-documento/${tipoBusqueda}/${numDoc}`)
      const data = response.data

      if (data && !data.error) {
        // Soporta todas las variantes de nombres según la fuente (name, razonSocial, nombre_completo, etc.)
        const nombreEncontrado = 
          data.name || 
          data.razonSocial || 
          data.nombre_completo || 
          data.nombreCompleto || 
          (data.nombres ? `${data.nombres} ${data.apellidoPaterno || data.apellido_paterno || ''} ${data.apellidoMaterno || data.apellido_materno || ''}`.trim() : '')

        const direccionEncontrada = data.address || data.direccion || ''

        setFormData(prev => ({
          ...prev,
          tipo_documento_id: tipoBusqueda === 'RUC' ? '6' : '1',
          nombre_razon_social: nombreEncontrado || prev.nombre_razon_social,
          direccion_1: direccionEncontrada || prev.direccion_1
        }))
        toast.success(`Datos de ${tipoBusqueda} obtenidos correctamente`)
      } else {
        toast.error('No se encontraron datos para este documento')
      }
    } catch (error) {
      toast.error('Error al consultar el documento en el padrón oficial')
      console.error(error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.numero_documento || formData.numero_documento.trim() === '') {
      toast.error('El número de documento es requerido')
      return
    }
    if (!formData.nombre_razon_social || formData.nombre_razon_social.trim() === '') {
      toast.error('El nombre o razón social es requerido')
      return
    }
    onSave(formData)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant={variant}
      title={cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
      subtitle={cliente ? 'Modifique la información y condiciones comerciales del cliente' : 'Complete el formulario para registrar un nuevo cliente'}
      confirmButtonId="cliente-form"
      confirmText={cliente ? 'Actualizar' : 'Guardar'}
      isProcessing={isProcessing}
      maxWidth="max-w-2xl"
    >
      <form id="cliente-form" onSubmit={handleSubmit} className="space-y-5">
        
        {/* Identificación */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Identificación del Cliente
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div>
              <SearchableSelect
                label={<span>Tipo Doc. <span className="text-red-500">*</span></span>}
                options={tiposDocumentoOptions}
                value={formData.tipo_documento_id}
                onChange={handleTipoDocChange}
                placeholder="Seleccione tipo doc..."
                allowEmpty={false}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Número de Documento <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-1.5">
                <input
                  required
                  type="text"
                  name="numero_documento"
                  maxLength="20"
                  value={formData.numero_documento}
                  onChange={handleChange}
                  placeholder="Número de DNI / RUC"
                  className="input-field flex-1 font-mono text-sm"
                />
                {(formData.tipo_documento_id === '1' || formData.tipo_documento_id === '6') && (
                  <button
                    type="button"
                    onClick={handleSearchDocumento}
                    disabled={isSearching}
                    className="btn-secondary px-3 flex items-center justify-center shrink-0 disabled:opacity-50"
                    title="Consultar en RENIEC / SUNAT"
                  >
                    <MagnifyingGlassIcon className={`h-4 w-4 ${isSearching ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline ml-1 text-xs font-medium">Consultar</span>
                  </button>
                )}
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nombre / Razón Social <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                name="nombre_razon_social"
                value={formData.nombre_razon_social}
                onChange={handleChange}
                placeholder="Nombres completos o razón social fiscal"
                className="input-field text-sm"
              />
            </div>
          </div>
        </div>

        {/* Ubicación y Contacto */}
        <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Contacto y Dirección
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Dirección
              </label>
              <input
                type="text"
                name="direccion_1"
                value={formData.direccion_1}
                onChange={handleChange}
                placeholder="Av. / Jr. / Calle, Número, Distrito"
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Teléfono / Celular
              </label>
              <input
                type="text"
                name="telefono_1"
                value={formData.telefono_1}
                onChange={handleChange}
                placeholder="999 999 999"
                className="input-field text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email_1"
                value={formData.email_1}
                onChange={handleChange}
                placeholder="cliente@ejemplo.com"
                className="input-field text-sm"
              />
            </div>
          </div>
        </div>

        {/* Condiciones Comerciales y Crédito */}
        {/* <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Condiciones de Crédito
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 bg-white dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/80">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Límite Crédito (S/)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="limite_credito"
                value={formData.limite_credito}
                onChange={handleChange}
                placeholder="0.00"
                className="input-field text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Días Pactados
              </label>
              <input
                type="number"
                min="0"
                name="dias_credito_pactado"
                value={formData.dias_credito_pactado}
                onChange={handleChange}
                placeholder="30"
                className="input-field text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Cuotas
              </label>
              <input
                type="number"
                min="1"
                name="cantidad_cuotas"
                value={formData.cantidad_cuotas}
                onChange={handleChange}
                placeholder="1"
                className="input-field text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Estado Crédito
              </label>
              <select
                name="estado_credito"
                value={formData.estado_credito}
                onChange={handleChange}
                className="input-field text-sm"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="OBSERVADO">OBSERVADO</option>
                <option value="BLOQUEADO">BLOQUEADO</option>
              </select>
            </div>
          </div>
        </div> */}

      </form>
    </Modal>
  )
}
