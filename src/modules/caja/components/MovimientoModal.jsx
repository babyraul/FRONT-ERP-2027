import { useState } from 'react'
import Modal from '../../../components/ui/Modal.jsx'
import { toast } from '../../../utils/toast.js'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

export default function MovimientoModal({
  isOpen,
  onClose,
  onSave,
  turno,
  isProcessing = false
}) {
  const [tipoMovimiento, setTipoMovimiento] = useState('EGRESO')
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState('')
  const [observacion, setObservacion] = useState('')

  if (!isOpen || !turno) return null

  const handleSubmit = (e) => {
    e.preventDefault()

    const montoNum = parseFloat(monto) || 0
    if (montoNum <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }

    if (!concepto.trim()) {
      toast.error('Debe ingresar un concepto claro')
      return
    }

    onSave({
      tipo_movimiento: tipoMovimiento,
      concepto: concepto.trim(),
      monto: montoNum,
      observacion: observacion.trim()
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Movimiento de Caja"
      subtitle={`Turno activo en ${turno.identificador_caja} — Ingreso o egreso directo de efectivo`}
      confirmButtonId="movimiento-form"
      confirmText="Guardar Movimiento"
      isProcessing={isProcessing}
      maxWidth="max-w-md"
    >
      <form id="movimiento-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Tipo de Movimiento <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTipoMovimiento('INGRESO')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                tipoMovimiento === 'INGRESO'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <ArrowTrendingUpIcon className="h-4 w-4" /> Ingreso de Dinero
            </button>
            <button
              type="button"
              onClick={() => setTipoMovimiento('EGRESO')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                tipoMovimiento === 'EGRESO'
                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <ArrowTrendingDownIcon className="h-4 w-4" /> Egreso / Retiro
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Monto en Efectivo (S/) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
              S/
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
              className="input-field pl-9 text-sm font-mono font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Concepto del Movimiento <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            placeholder="Ej. Pago a proveedor de delivery, compra de insumos, etc."
            className="input-field text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Observación adicional
          </label>
          <textarea
            rows="2"
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Detalles sobre el destinatario o comprobante físico..."
            className="input-field text-xs resize-none"
          />
        </div>
      </form>
    </Modal>
  )
}
