import { useState, useMemo, useEffect } from 'react'
import Modal from '../../../components/ui/Modal.jsx'
import { toast } from '../../../utils/toast.js'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'

const DENOMINACIONES_BILLETES = [
  { valor: 200, label: 'S/ 200' },
  { valor: 100, label: 'S/ 100' },
  { valor: 50, label: 'S/ 50' },
  { valor: 20, label: 'S/ 20' },
  { valor: 10, label: 'S/ 10' }
]

const DENOMINACIONES_MONEDAS = [
  { valor: 5, label: 'S/ 5.00' },
  { valor: 2, label: 'S/ 2.00' },
  { valor: 1, label: 'S/ 1.00' },
  { valor: 0.5, label: 'S/ 0.50' },
  { valor: 0.2, label: 'S/ 0.20' },
  { valor: 0.1, label: 'S/ 0.10' }
]

const DENOMINACIONES_ESTANDAR = [...DENOMINACIONES_BILLETES, ...DENOMINACIONES_MONEDAS]

export default function MovimientoModal({
  isOpen,
  onClose,
  onSave,
  turno,
  isProcessing = false,
  variant = 'drawer'
}) {
  const [tipoMovimiento, setTipoMovimiento] = useState('EGRESO')
  const [concepto, setConcepto] = useState('')
  const [observacion, setObservacion] = useState('')
  const [cantidades, setCantidades] = useState({})

  // Resetear formulario al abrir
  useEffect(() => {
    if (isOpen) {
      setCantidades({})
      setConcepto('')
      setObservacion('')
      setTipoMovimiento('EGRESO')
    }
  }, [isOpen])

  const handleCantidadChange = (valorDenom, cantidad) => {
    setCantidades(prev => ({
      ...prev,
      [valorDenom]: cantidad === '' ? '' : Math.max(0, parseInt(cantidad, 10) || 0)
    }))
  }

  // Cálculos de subtotales y total por denominación
  const desglose = useMemo(() => {
    return DENOMINACIONES_ESTANDAR.map(d => {
      const cant = cantidades[d.valor] || 0
      const subtotal = Math.round(d.valor * cant * 100) / 100
      return {
        ...d,
        cantidad: cant,
        subtotal
      }
    })
  }, [cantidades])

  // Total acumulado calculado automáticamente desde el arqueo
  const totalCalculado = useMemo(() => {
    return Math.round(desglose.reduce((acc, curr) => acc + curr.subtotal, 0) * 100) / 100
  }, [desglose])

  if (!isOpen || !turno) return null

  const handleSubmit = (e) => {
    e.preventDefault()

    if (totalCalculado <= 0) {
      toast.error('Debe ingresar al menos una denominación con cantidad mayor a 0')
      return
    }

    if (!concepto.trim()) {
      toast.error('Debe ingresar un concepto claro')
      return
    }

    const conteos = desglose
      .filter(d => d.cantidad > 0)
      .map(d => ({
        denominacion: d.valor,
        cantidad: d.cantidad,
        subtotal: d.subtotal
      }))

    onSave({
      tipo_movimiento: tipoMovimiento,
      concepto: concepto.trim(),
      monto: totalCalculado,
      observacion: observacion.trim(),
      conteos
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant={variant}
      title="Registrar Movimiento con Arqueo de Caja"
      confirmButtonId="movimiento-form"
      confirmText={`Registrar ${tipoMovimiento === 'INGRESO' ? 'Ingreso' : 'Egreso'} (S/ ${totalCalculado.toFixed(2)})`}
      isProcessing={isProcessing}
      maxWidth="max-w-xl"
    >
      <form id="movimiento-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Selector de Tipo de Movimiento */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Tipo de Movimiento <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTipoMovimiento('INGRESO')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${tipoMovimiento === 'INGRESO'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
            >
              <ArrowTrendingUpIcon className="h-4 w-4" /> Ingreso de Dinero
            </button>
            <button
              type="button"
              onClick={() => setTipoMovimiento('EGRESO')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${tipoMovimiento === 'EGRESO'
                ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
            >
              <ArrowTrendingDownIcon className="h-4 w-4" /> Egreso / Retiro
            </button>
          </div>
        </div>

        {/* Panel del Monto Total Efectivo Calculado y Solo Visible */}
        <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${tipoMovimiento === 'INGRESO'
          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
          : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
          }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${tipoMovimiento === 'INGRESO'
              ? 'bg-emerald-500 text-white'
              : 'bg-rose-500 text-white'
              }`}>
              <BanknotesIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-100 block">
                Total Efectivo Calculado
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-300">
                Determinado por el arqueo de billetes y monedas
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className={`text-2xl font-black font-mono tracking-tight ${tipoMovimiento === 'INGRESO'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
              }`}>
              {tipoMovimiento === 'INGRESO' ? '+' : '-'} S/ {totalCalculado.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Desglose de Arqueo en Dos Columnas: Billetes (Izq) y Monedas (Der) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Desglose de Efectivo por Denominación <span className="text-red-500">*</span>
            </label>
            <span className="text-[10px] text-slate-400">
              {desglose.filter(d => d.cantidad > 0).length} de {DENOMINACIONES_ESTANDAR.length} denominaciones
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Columna Izquierda: Billetes */}
            <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              <div className="bg-slate-50/80 dark:bg-slate-800/60 px-3 py-1.5 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Billetes
                </span>
                <span className="text-[14px] font-bold text-slate-500 dark:text-slate-100">
                  S/ {desglose.filter(d => DENOMINACIONES_BILLETES.some(b => b.valor === d.valor)).reduce((acc, c) => acc + c.subtotal, 0).toFixed(2)}
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {DENOMINACIONES_BILLETES.map((b) => {
                  const item = desglose.find(d => d.valor === b.valor) || { cantidad: 0, subtotal: 0 }
                  return (
                    <div key={b.valor} className="px-3 py-1.5 flex items-center justify-between gap-2 text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <span className="font-semibold text-slate-700 dark:text-slate-200 w-16">
                        {b.label}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          value={cantidades[b.valor] ?? ''}
                          onChange={(e) => handleCantidadChange(b.valor, e.target.value)}
                          className="w-16 px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded-md text-center font-mono font-bold text-xs bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                      </div>

                      <div className="w-20 text-right font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                        S/ {item.subtotal.toFixed(2)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Columna Derecha: Monedas */}
            <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              <div className="bg-slate-50/80 dark:bg-slate-800/60 px-3 py-1.5 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Monedas
                </span>
                <span className="text-[14px] font-bold text-slate-500 dark:text-slate-100">
                  S/ {desglose.filter(d => DENOMINACIONES_MONEDAS.some(m => m.valor === d.valor)).reduce((acc, c) => acc + c.subtotal, 0).toFixed(2)}
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {DENOMINACIONES_MONEDAS.map((m) => {
                  const item = desglose.find(d => d.valor === m.valor) || { cantidad: 0, subtotal: 0 }
                  return (
                    <div key={m.valor} className="px-3 py-1.5 flex items-center justify-between gap-2 text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <span className="font-semibold text-slate-700 dark:text-slate-200 w-16">
                        {m.label}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          value={cantidades[m.valor] ?? ''}
                          onChange={(e) => handleCantidadChange(m.valor, e.target.value)}
                          className="w-16 px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded-md text-center font-mono font-bold text-xs bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                      </div>

                      <div className="w-20 text-right font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                        S/ {item.subtotal.toFixed(2)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Concepto del Movimiento */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Concepto del Movimiento <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            placeholder="Ej. Pago a proveedor de delivery, compra de insumos, sencillo, etc."
            className="input-field text-sm"
          />
        </div>

        {/* Observación adicional */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Observación adicional
          </label>
          <textarea
            rows="2"
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Detalles sobre el destinatario, comprobante físico o justificante..."
            className="input-field text-sm resize-none"
          />
        </div>
      </form>
    </Modal>
  )
}
