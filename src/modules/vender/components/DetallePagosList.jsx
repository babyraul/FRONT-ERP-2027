import React, { useState } from 'react'
import { TrashIcon } from '@heroicons/react/24/outline'
import { CreditCardIcon } from '@heroicons/react/24/solid'

export default function DetallePagosList({
  pagos = [],
  tipoDocumento = 'vale',
  onUpdateMontoPago,
  onUpdateReferenciaPago,
  onRemovePago
}) {
  const [imgErrors, setImgErrors] = useState({})

  return (
    <div className="space-y-3">
      {/* Cabecera: Tipo de Comprobante en Banner Verde Azulado */}
      <div>
        <div className="flex items-center justify-between mb-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span>PAGOS</span>
          <span>{pagos.length} Método(s)</span>
        </div>

        <div className="bg-[#01a59c] text-white py-2 px-4 rounded-xl text-center font-black text-sm uppercase tracking-wider shadow-sm">
          {tipoDocumento}
        </div>
      </div>

      {/* Lista de Métodos de Pago Activos */}
      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
        {pagos.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            Seleccione uno o varios métodos del carrusel inferior para registrar el pago.
          </div>
        ) : (
          pagos.map((pago, index) => {
            const color = pago.color || '#01a59c'
            const hasImgError = imgErrors[pago.id || index]

            return (
              <div
                key={pago.id || index}
                className="flex items-center gap-3 p-2 bg-white/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 rounded-xl shadow-2xs"
              >
                {/* Ícono / Imagen del método */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border bg-slate-50 dark:bg-slate-900/60 p-1"
                  style={{ borderColor: color }}
                  title={pago.metodo_nombre}
                >
                  {pago.imagen_url && !hasImgError ? (
                    <img
                      src={pago.imagen_url}
                      alt={pago.metodo_nombre}
                      onError={() => setImgErrors((prev) => ({ ...prev, [pago.id || index]: true }))}
                      className="h-7 w-7 object-contain"
                    />
                  ) : (
                    <CreditCardIcon className="h-6 w-6" style={{ color }} />
                  )}
                </div>

                {/* Input de Monto */}
                <div className="flex-1 min-w-[100px]">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                      S/.
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pago.monto}
                      onChange={(e) => onUpdateMontoPago(index, parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full pl-9 pr-3 py-1.5 text-right bg-slate-50 dark:bg-slate-900 border-b-2 border-slate-300 dark:border-slate-600 focus:border-[#01a59c] outline-none font-mono font-black text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Input de Referencia */}
                <div className="flex-1 min-w-[90px]">
                  <input
                    type="text"
                    value={pago.referencia || ''}
                    onChange={(e) => onUpdateReferenciaPago(index, e.target.value)}
                    placeholder="Ref. / N° Op."
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border-b-2 border-slate-300 dark:border-slate-600 focus:border-[#01a59c] outline-none text-slate-700 dark:text-slate-200"
                  />
                </div>

                {/* Botón Eliminar Método */}
                <button
                  type="button"
                  onClick={() => onRemovePago(index)}
                  className="w-8 h-8 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors shrink-0"
                  title="Eliminar método de pago"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
