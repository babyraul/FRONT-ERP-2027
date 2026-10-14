import { useState, useEffect } from 'react'
import Modal from '../../../components/ui/Modal.jsx'
import { toast } from '../../../utils/toast.js'

export default function CierreTurnoModal({
  isOpen,
  onClose,
  onSave,
  turno,
  metodosPago = [],
  isProcessing = false
}) {
  const [declarados, setDeclarados] = useState({})
  const [observacion, setObservacion] = useState('')

  useEffect(() => {
    if (isOpen && turno) {
      const mapa = {}
      if (Array.isArray(turno.totales) && turno.totales.length > 0) {
        turno.totales.forEach(t => {
          mapa[t.metodo_pago_id] = t.monto_sistema || t.monto_apertura || 0
        })
      } else {
        mapa['1'] = 0 // Efectivo por defecto
      }
      setDeclarados(mapa)
      setObservacion('Cierre regular de operaciones del turno')
    }
  }, [isOpen, turno])

  if (!isOpen || !turno) return null

  const handleMontoChange = (metodoId, valor) => {
    setDeclarados(prev => ({
      ...prev,
      [metodoId]: valor === '' ? '' : Number(valor)
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const listaCierre = Object.entries(declarados).map(([metodoId, monto]) => ({
      metodo_pago_id: metodoId,
      monto_declarado: Number(monto || 0)
    }))

    onSave({
      totales_cierre: listaCierre,
      observacion_general: observacion
    })
  }

  const metodosParaCierre = metodosPago.length > 0 ? metodosPago : [
    { id: '1', nombre: 'EFECTIVO' },
    { id: '2', nombre: 'YAPE' },
    { id: '3', nombre: 'TRANSFERENCIA' },
    { id: '4', nombre: 'CREDITO' }
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cierre de Caja — ${turno.identificador_caja}`}
      subtitle={`Turno abierto el ${new Date(turno.fecha_apertura).toLocaleString()} por ${turno.usuario_nombre || 'Usuario'}`}
      confirmButtonId="cierre-turno-form"
      confirmText="Confirmar y Cerrar Caja"
      isProcessing={isProcessing}
      maxWidth="max-w-xl"
    >
      <form id="cierre-turno-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-3 rounded-xl text-xs text-amber-800 dark:text-amber-300">
          <p className="font-semibold mb-0.5">Arqueo y Declaración de Montos</p>
          Ingrese los montos reales arqueados físicamente en caja por cada medio de pago para calcular posibles faltantes o sobrantes.
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Montos Declarados por Medio de Pago
          </label>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/70 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            {metodosParaCierre.map((m) => {
              const valorActual = declarados[m.id] ?? ''
              return (
                <div key={m.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div>
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                      {m.nombre}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      Código: {m.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 w-40">
                    <span className="text-xs text-slate-400 font-mono">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={valorActual}
                      onChange={(e) => handleMontoChange(m.id, e.target.value)}
                      placeholder="0.00"
                      className="input-field py-1 text-sm font-mono text-right font-semibold"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Observaciones del Cierre
          </label>
          <textarea
            rows="2"
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Observación o justificación sobre el balance del turno..."
            className="input-field text-sm resize-none"
          />
        </div>
      </form>
    </Modal>
  )
}
