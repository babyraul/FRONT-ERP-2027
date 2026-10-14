import { useState, useEffect, useMemo } from 'react'
import Modal from '../../../components/ui/Modal.jsx'
import { toast } from '../../../utils/toast.js'
import {
  CalculatorIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline'

const DENOMINACIONES_ESTANDAR = [
  { valor: 200, label: 'Billete S/ 200' },
  { valor: 100, label: 'Billete S/ 100' },
  { valor: 50, label: 'Billete S/ 50' },
  { valor: 20, label: 'Billete S/ 20' },
  { valor: 10, label: 'Billete S/ 10' },
  { valor: 5, label: 'Moneda S/ 5.00' },
  { valor: 2, label: 'Moneda S/ 2.00' },
  { valor: 1, label: 'Moneda S/ 1.00' },
  { valor: 0.5, label: 'Moneda S/ 0.50' },
  { valor: 0.2, label: 'Moneda S/ 0.20' },
  { valor: 0.1, label: 'Moneda S/ 0.10' }
]

export default function ArqueoModal({
  isOpen,
  onClose,
  onSave,
  turno,
  montoSistemaEfectivo = 0,
  isProcessing = false
}) {
  const [cantidades, setCantidades] = useState({})

  useEffect(() => {
    if (isOpen) {
      setCantidades({})
    }
  }, [isOpen])

  if (!isOpen || !turno) return null

  const handleCantidadChange = (valorDenom, cantidad) => {
    setCantidades(prev => ({
      ...prev,
      [valorDenom]: cantidad === '' ? '' : Math.max(0, parseInt(cantidad, 10) || 0)
    }))
  }

  // Cálculos de subtotales y total
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

  const totalFisicoDeclarado = useMemo(() => {
    return desglose.reduce((acc, curr) => acc + curr.subtotal, 0)
  }, [desglose])

  // Fórmula arquitectónica: diferencia = monto_declarado - monto_sistema
  const diferencia = Math.round((totalFisicoDeclarado - montoSistemaEfectivo) * 100) / 100

  const handleSubmit = (e) => {
    e.preventDefault()

    const conteos = desglose.map(d => ({
      denominacion: d.valor,
      cantidad: d.cantidad,
      subtotal: d.subtotal
    }))

    onSave({
      conteos,
      total_fisico: totalFisicoDeclarado,
      diferencia
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Arqueo Físico de Caja"
      subtitle={`Conteo por denominación para ${turno.identificador_caja}`}
      confirmButtonId="arqueo-form"
      confirmText="Guardar Arqueo"
      isProcessing={isProcessing}
      maxWidth="max-w-xl"
    >
      <form id="arqueo-form" onSubmit={handleSubmit} className="space-y-4">
        
        {/* Comparativa Sistema vs Conteo Físico */}
        <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-center">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sistema</span>
            <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200">
              S/ {montoSistemaEfectivo.toFixed(2)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Conteo Físico</span>
            <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
              S/ {totalFisicoDeclarado.toFixed(2)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Diferencia</span>
            <span className={`font-mono font-bold text-sm ${
              diferencia === 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : diferencia > 0
                  ? 'text-blue-600'
                  : 'text-rose-600'
            }`}>
              {diferencia >= 0 ? `+${diferencia.toFixed(2)}` : diferencia.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Tabla de Conteo */}
        <div className="max-h-72 overflow-y-auto border border-slate-200/80 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
          {desglose.map((d) => (
            <div key={d.valor} className="px-3.5 py-2 flex items-center justify-between gap-3 text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300 w-36">
                {d.label}
              </span>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[10px]">Cant:</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={cantidades[d.valor] ?? ''}
                  onChange={(e) => handleCantidadChange(d.valor, e.target.value)}
                  placeholder="0"
                  className="input-field py-1 px-2 w-20 text-center font-mono font-bold text-xs"
                />
              </div>

              <div className="w-24 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                S/ {d.subtotal.toFixed(2)}
              </div>
            </div>
          ))}
        </div>

      </form>
    </Modal>
  )
}
