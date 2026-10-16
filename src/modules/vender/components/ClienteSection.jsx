import React from 'react'
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'
import { useClienteSmartSearch } from '../hooks/useClienteSmartSearch.js'

export default function ClienteSection({
  cliente,
  setCliente,
  tipoDocumento,
  setTipoDocumento,
  placa,
  setPlaca,
  onOpenBuscarModal,
  onOpenNuevoModal
}) {
  const {
    docInput,
    sugerencias,
    showSugerencias,
    setShowSugerencias,
    loading,
    searchStatus,
    containerRef,
    handleInputChange,
    handleKeyDown,
    seleccionarCliente
  } = useClienteSmartSearch({
    cliente,
    setCliente,
    tipoDocumento,
    setTipoDocumento
  })

  const isClienteNuevo =
    cliente?.isNuevo ||
    cliente?.source === 'externo' ||
    (cliente?.id && String(cliente.id).startsWith('temp_'))

  return (
    <div className="space-y-1">
      {/* Fila Principal de Control: Input Maestro Dinámico + Info Cliente */}
      <div className="p-2 flex flex-wrap items-center gap-2">
        {/* Contenedor del Input Master y Dropdown de Sugerencias */}
        <div className="relative min-w-[210px] max-w-[270px] flex-1" ref={containerRef}>
          <div className="relative">
            <input
              id="input-master-cliente"
              type="text"
              name="docInput"
              placeholder="DNI/RUC o Razón Social (mín. 5)..."
              value={docInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => sugerencias.length > 0 && setShowSugerencias(true)}
              autoComplete="off"
              className={`w-full bg-white dark:bg-slate-900 border rounded-lg pl-3 pr-14 py-2 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#01a59c] placeholder-slate-400 ${searchStatus === 'error' || searchStatus === 'not_found'
                ? 'border-red-400 dark:border-red-500'
                : 'border-slate-300 dark:border-slate-700'
                }`}
            />

            {/* Indicadores de Estado Visuales */}
            <div className="absolute right-7 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              {loading && (
                <ArrowPathIcon className="h-4 w-4 animate-spin text-[#01a59c]" />
              )}
              {searchStatus === 'success' && !loading && (
                <CheckCircleIcon className="h-4 w-4 text-emerald-500" title="Cliente verificado" />
              )}
              {searchStatus === 'not_found' && !loading && (
                <XCircleIcon className="h-4 w-4 text-red-500" title="No encontrado" />
              )}
            </div>

            {/* Botón que abre el modal general de búsqueda (F3) */}
            <button
              type="button"
              onClick={onOpenBuscarModal}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#01a59c] transition-colors rounded-md"
              title="Abrir catálogo completo de clientes (F3)"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Menú Desplegable Flotante de Sugerencias Predictivas */}
          {showSugerencias && sugerencias.length > 0 && (
            <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {sugerencias.map((item, idx) => {
                const esExt = item.source === 'externo' || item.isNuevo
                return (
                  <li
                    key={item.id || idx}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      seleccionarCliente(item)
                    }}
                    className={`px-3 py-2 cursor-pointer transition-colors text-left flex items-start justify-between ${esExt
                      ? 'bg-amber-50 hover:bg-amber-100/70 dark:bg-amber-950/30 dark:hover:bg-amber-950/60'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {item.nombre_razon_social || item.razonSocial}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                        {item.numero_documento || item.ruc}
                      </p>
                    </div>
                    {esExt && (
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded shrink-0">
                        NUEVO
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Información del Cliente Seleccionado y Etiquetas */}
        <div className="flex items-center gap-2 px-1 text-xs flex-wrap min-w-0">
          <span
            className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[260px] sm:max-w-md"
            title={cliente?.nombre_razon_social}
          >
            {cliente?.nombre_razon_social || 'VARIOS'}
          </span>

          {/* Badge informativo de Cliente Nuevo (Lazy Registration al facturar) */}
          {isClienteNuevo && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
              <UserPlusIcon className="h-3 w-3" />
              <span>Cliente nuevo</span>
            </span>
          )}

        </div>
      </div>

      {/* Feedback contextual de búsqueda no encontrada */}
      {searchStatus === 'not_found' && !loading && (
        <p className="text-[11px] font-medium text-red-500">
          No se encontró en SUNAT/RENIEC ni en la base local. Puede ingresar los datos o buscar con F3.
        </p>
      )}
    </div>
  )
}
