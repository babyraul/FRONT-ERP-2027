import React from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

export default function VentaFooter({
  gravado = 0,
  igv = 0,
  total = 0,
  onGenerarVenta,
  itemCount = 0,
  disabled = false
}) {
  return (
    <div className="bg-slate-300/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-300/70 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 shrink-0 shadow-lg z-20">
      {/* ── Desglose de Totales a la Izquierda ── */}
      <div className="flex-1 flex items-center gap-4 sm:gap-8 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 min-w-0">
        <div>
          <span className="text-slate-600 font-semibold dark:text-slate-500 mr-1">Gravado</span>
          <strong className="font-bold text-slate-900 dark:text-white">{gravado.toFixed(2)}</strong>
        </div>

        <div>
          <span className="text-slate-600 font-semibold dark:text-slate-500 mr-1">IGV</span>
          <strong className="font-bold text-slate-900 dark:text-white">{igv.toFixed(2)}</strong>
        </div>
      </div>

      {/* ── Centro: Total Destacado (Caja Verde Aqua con ancho fijo) ── */}
      <div className="flex items-center justify-center shrink-0">
        <div className="bg-[#01a59c] text-white w-48 sm:w-64 py-3 rounded-2xl shadow-md flex items-center justify-center gap-1.5 transition-transform">
          <span className="text-base sm:text-lg font-bold opacity-80">S/</span>
          <span className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            {total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* ── Derecha: Botón de Acción Principal "Generar Venta" con ancho fijo ── */}
      <div className="flex-1 flex justify-end shrink-0">
        <button
          type="button"
          onClick={onGenerarVenta}
          disabled={disabled || itemCount === 0}
          className="w-44 sm:w-64 justify-center bg-[#01473d] hover:bg-[#025a4d] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 sm:py-3.5 rounded-2xl text-lg sm:text-3xl font-black tracking-wide shadow-[0_6px_16px_rgba(1,71,61,0.35)] hover:shadow-[0_10px_24px_rgba(1,71,61,0.45)] transition-all duration-200 flex items-center gap-2 transform active:scale-95"
          title="Generar Venta (F4 o Ctrl+Enter)"
        >
          <span>GENERAR</span>
        </button>
      </div>
    </div>
  )
}
