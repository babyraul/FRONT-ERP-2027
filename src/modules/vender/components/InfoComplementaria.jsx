import React from 'react'

export default function InfoComplementaria({
  vuelto = 0,
  saldoPendiente = 0,
  observaciones = '',
  setObservaciones,
  ordenCompra = '',
  setOrdenCompra,
  guiaRemision = '',
  setGuiaRemision
}) {
  return (
    <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs">
      {/* Vuelto / Saldo Pendiente */}
      <div className="flex items-center justify-between pb-1">
        <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
          {saldoPendiente > 0 ? 'Saldo Pendiente:' : 'Vuelto:'}
        </span>
        <span
          className={`font-mono text-base font-black ${
            saldoPendiente > 0
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-emerald-700 dark:text-emerald-400'
          }`}
        >
          {saldoPendiente > 0
            ? `S/. ${saldoPendiente.toFixed(2)}`
            : `S/. ${vuelto.toFixed(2)}`}
        </span>
      </div>

      {/* Input Observaciones */}
      <div className="flex items-center gap-3">
        <label className="w-28 text-slate-500 font-medium shrink-0">Observaciones</label>
        <input
          type="text"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Comentarios o notas de la venta..."
          className="flex-1 bg-transparent border-b border-slate-300 dark:border-slate-700 focus:border-[#01a59c] py-1 text-slate-800 dark:text-slate-200 outline-none transition-colors"
        />
      </div>

      {/* Input Orden de Compra */}
      <div className="flex items-center gap-3">
        <label className="w-28 text-slate-500 font-medium shrink-0">Orden Compra</label>
        <input
          type="text"
          value={ordenCompra}
          onChange={(e) => setOrdenCompra(e.target.value)}
          placeholder="N° O/C del cliente..."
          className="flex-1 bg-transparent border-b border-slate-300 dark:border-slate-700 focus:border-[#01a59c] py-1 text-slate-800 dark:text-slate-200 outline-none transition-colors font-mono"
        />
      </div>

      {/* Input Guía de Remisión */}
      <div className="flex items-center gap-3">
        <label className="w-28 text-slate-500 font-medium shrink-0">Guía Remisión</label>
        <input
          type="text"
          value={guiaRemision}
          onChange={(e) => setGuiaRemision(e.target.value)}
          placeholder="T001-0001234..."
          className="flex-1 bg-transparent border-b border-slate-300 dark:border-slate-700 focus:border-[#01a59c] py-1 text-slate-800 dark:text-slate-200 outline-none transition-colors font-mono"
        />
      </div>
    </div>
  )
}
