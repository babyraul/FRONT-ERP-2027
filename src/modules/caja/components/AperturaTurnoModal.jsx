import { useState, useEffect, useMemo } from 'react'
import Modal from '../../../components/ui/Modal.jsx'
import {
  BanknotesIcon,
  DocumentDuplicateIcon,
  ShieldCheckIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  BuildingStorefrontIcon,
  UserIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { toast } from '../../../utils/toast.js'
import { useAuthStore } from '../../../store/useAuthStore.js'

export default function AperturaTurnoModal({
  isOpen,
  onClose,
  onSave,
  cajasConfiguradas = [],
  metodosPago = [],
  isProcessing = false,
  variant = 'drawer'
}) {
  const { user } = useAuthStore()
  const [selectedIden, setSelectedIden] = useState('')
  const [montoApertura, setMontoApertura] = useState(0)
  const [observacion, setObservacion] = useState('')

  // Caja seleccionada actualmente
  const selectedCaja = useMemo(() => {
    return cajasConfiguradas.find(c => c.identificador_caja === selectedIden) || null
  }, [cajasConfiguradas, selectedIden])

  useEffect(() => {
    if (isOpen) {
      // Auto-seleccionar la primera caja disponible
      const primeraDisponible = cajasConfiguradas.find(c => c.disponible)
      if (primeraDisponible) {
        setSelectedIden(primeraDisponible.identificador_caja)
      } else if (cajasConfiguradas.length > 0) {
        setSelectedIden(cajasConfiguradas[0].identificador_caja)
      } else {
        setSelectedIden('')
      }
      setMontoApertura(0)
      setObservacion('Apertura con fondo de cambio en efectivo')
    }
  }, [isOpen, cajasConfiguradas])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!selectedIden) {
      toast.error('Debe seleccionar una caja física para operar')
      return
    }

    if (selectedCaja && !selectedCaja.disponible) {
      toast.error(`La caja ${selectedIden} ya está ocupada por otro usuario. Seleccione una caja disponible.`)
      return
    }

    const montoNum = parseFloat(montoApertura) || 0
    if (montoNum < 0) {
      toast.error('El fondo inicial no puede ser negativo')
      return
    }

    onSave({
      identificador_caja: selectedIden,
      monto_apertura: montoNum,
      observacion: observacion.trim()
    })
  }

  const sucursalNombre = user?.active_acceso?.sucursal_nombre || 'Sucursal Principal'
  const usuarioNombre = user?.nombre || user?.usuario || 'Cajero'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant={variant}
      title="Apertura de Turno de Caja"
      subtitle="Identifica la caja física, verifica sus series fiscales e inicializa el fondo de efectivo"
      confirmButtonId="apertura-turno-form"
      confirmText="Confirmar Apertura"
      isProcessing={isProcessing}
      maxWidth="max-w-2xl"
    >
      <form id="apertura-turno-form" onSubmit={handleSubmit} className="space-y-5">
        
        {/* Banner Informativo de Sesión Operativa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2.5">
            <BuildingStorefrontIcon className="h-5 w-5 text-blue-500 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Sucursal / Sede</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{sucursalNombre}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <UserIcon className="h-5 w-5 text-emerald-500 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Cajero Responsable</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{usuarioNombre}</span>
            </div>
          </div>
        </div>

        {/* 1. SELECCIÓN E IDENTIFICACIÓN PRINCIPAL DE CAJA */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            1. Seleccione la Caja Física a Operar <span className="text-red-500">*</span>
          </label>

          {cajasConfiguradas.length === 0 ? (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2.5">
              <ExclamationCircleIcon className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-bold">No hay cajas físicas configuradas</p>
                <p className="mt-0.5">
                  Debes dar de alta una caja en la sección de administración de Series y Correlativos antes de aperturar un turno.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cajasConfiguradas.map((c) => {
                const isSelected = c.identificador_caja === selectedIden
                const isAvailable = c.disponible

                return (
                  <button
                    type="button"
                    key={c.identificador_caja}
                    onClick={() => setSelectedIden(c.identificador_caja)}
                    className={`text-left p-3.5 rounded-xl border-2 transition-all relative ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-500 shadow-sm'
                        : isAvailable
                          ? 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                          : 'border-slate-200/50 dark:border-slate-800/50 bg-slate-100/60 dark:bg-slate-800/30 opacity-70 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                          {c.identificador_caja}
                        </span>
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {c.tipo_caja}
                        </span>
                      </div>
                      
                      {isAvailable ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircleIcon className="h-4 w-4" /> Disponible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-500">
                          <ExclamationCircleIcon className="h-4 w-4" /> En uso
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-2 truncate">
                      {c.nombre}
                    </p>

                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      {c.series?.length || 0} {(c.series?.length === 1 ? 'serie vinculada' : 'series vinculadas')}
                    </p>

                    {!isAvailable && c.ocupada_por && (
                      <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1.5 font-medium">
                        Abierta por: {c.ocupada_por.usuario_nombre || 'Otro usuario'}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        
        {/* 3. FONDO INICIAL DE APERTURA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Fondo Inicial en Efectivo (S/) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                S/
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={montoApertura}
                onChange={(e) => setMontoApertura(e.target.value)}
                placeholder="0.00"
                className="input-field pl-9 text-base font-bold font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Observación / Justificación
            </label>
            <textarea
              rows="2"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Nota o detalle de la apertura..."
              className="input-field text-xs resize-none"
            />
          </div>
        </div>

      </form>
    </Modal>
  )
}
