import React, { useState } from 'react'
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { venderController } from '../controllers/venderController.js'
import { toast } from '../../../utils/toast.js'

export default function ClienteSection({
  cliente,
  setCliente,
  placa,
  setPlaca,
  onOpenBuscarModal,
  onOpenNuevoModal
}) {
  const [docInput, setDocInput] = useState(cliente?.numero_documento || '')
  const [isConsulting, setIsConsulting] = useState(false)
  const [modoVarios, setModoVarios] = useState(false)

  // Sincronizar docInput cuando cambie el cliente externamente
  React.useEffect(() => {
    setDocInput(cliente?.numero_documento || '')
  }, [cliente])

  // Buscar DNI/RUC local o con API Perú al presionar Enter o botón buscar
  const handleConsultarDoc = async () => {
    const doc = docInput.trim()
    if (!doc) {
      toast.info('Ingrese un DNI o RUC', 'Escriba un número de 8 o 11 dígitos para buscar.')
      return
    }

    setIsConsulting(true)

    // 1. Intentar buscar primero en la base de datos local
    const resLocal = await venderController.buscarClientes(doc)
    if (resLocal.success && resLocal.data.length > 0) {
      const match = resLocal.data.find((c) => c.numero_documento === doc) || resLocal.data[0]
      setCliente(match)
      setIsConsulting(false)
      toast.success('Cliente encontrado', match.nombre_razon_social)
      return
    }

    // 2. Si tiene 8 u 11 dígitos, consultar RENIEC / SUNAT
    const tipo = doc.length === 11 ? 'ruc' : doc.length === 8 ? 'dni' : null
    if (tipo) {
      const resApi = await venderController.consultarDocumento(tipo, doc)
      if (resApi.success && resApi.data) {
        const d = resApi.data
        const nombre =
          d.razon_social ||
          d.nombre_o_razon_social ||
          d.nombre_completo ||
          `${d.nombres || ''} ${d.apellido_paterno || ''} ${d.apellido_materno || ''}`.trim()

        const direccion = d.direccion_completa || d.direccion || ''
        const nuevoCliente = {
          id: 'temp-' + Date.now(),
          tipo_documento_id: tipo === 'ruc' ? '6' : '1',
          numero_documento: doc,
          nombre_razon_social: nombre || 'CLIENTE ' + doc,
          direccion_1: direccion
        }
        setCliente(nuevoCliente)
        toast.success('Consulta exitosa', nombre || 'Datos obtenidos')
      } else {
        toast.error('No encontrado', resApi.message || 'No se obtuvieron datos para este documento.')
      }
    } else {
      toast.error('Documento inválido', 'El documento debe tener 8 dígitos (DNI) o 11 dígitos (RUC).')
    }

    setIsConsulting(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConsultarDoc()
    }
  }

  const handleToggleVarios = () => {
    const next = !modoVarios
    setModoVarios(next)
    if (next) {
      setCliente({
        id: 'varios',
        tipo_documento_id: '0',
        numero_documento: '99999999',
        nombre_razon_social: 'VARIOS'
      })
      setDocInput('99999999')
    }
  }

  return (
    <div className="space-y-2">
      {/* Fila de Controles: Botones + Inputs + Toggle */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Botón Agregar Cliente */}
        <button
          type="button"
          onClick={onOpenNuevoModal}
          className="bg-[#01a59c] hover:bg-[#008f87] text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-1 shrink-0"
        >
          <UserPlusIcon className="h-4 w-4" />
          <span>Agregar cliente</span>
        </button>

        {/* Botón Buscar Cliente */}
        <button
          type="button"
          onClick={onOpenBuscarModal}
          className="bg-[#01a59c] hover:bg-[#008f87] text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-1 shrink-0"
        >
          <MagnifyingGlassIcon className="h-4 w-4" />
          <span>Buscar cliente</span>
        </button>

        {/* Input DNI/RUC con botón de consulta rápida */}
        <div className="relative min-w-[140px] max-w-[170px] flex-1">
          <input
            type="text"
            placeholder="DNI/RUC"
            value={docInput}
            onChange={(e) => setDocInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-darck font-semibold dark:text-white outline-none focus:ring-2 focus:ring-[#01a59c]"
          />
          <button
            type="button"
            onClick={handleConsultarDoc}
            disabled={isConsulting}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#01a59c] disabled:opacity-50"
            title="Consultar DNI/RUC"
          >
            {isConsulting ? (
              <ArrowPathIcon className="h-3.5 w-3.5 animate-spin text-[#01a59c]" />
            ) : (
              <MagnifyingGlassIcon className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Input Placa (opcional) */}
        {/* <div className="min-w-[110px] max-w-[140px] flex-1">
          <input
            type="text"
            placeholder="Placa (opcional)"
            value={placa}
            onChange={(e) => setPlaca(e.target.value.toUpperCase())}
            maxLength={10}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white font-mono uppercase outline-none focus:ring-2 focus:ring-[#01a59c]"
          />
        </div> */}
      <div className="flex items-center gap-2 px-1 text-xs">
        <span className="font-bold text-slate-700 dark:text-slate-200 truncate">
          {cliente?.nombre_razon_social || 'VARIOS'}
        </span>
        {/* {cliente?.numero_documento && cliente.numero_documento !== '99999999' && (
          <span className="text-[11px] font-mono text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-1.5 py-0.2 rounded font-medium">
            {cliente.numero_documento}
          </span>
        )} */}
        {cliente?.direccion_1 && (
          <span className="text-slate-400 truncate text-[11px] max-w-xs">
            • {cliente.direccion_1}
          </span>
        )}
      </div>
        
      </div>

      {/* Datos del Cliente Seleccionado */}

    </div>
  )
}
