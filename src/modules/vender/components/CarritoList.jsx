import React from 'react'
import {
  TrashIcon,
  ShoppingCartIcon,
  TagIcon
} from '@heroicons/react/24/outline'

export default function CarritoList({
  cartItems = [],
  onUpdateCantidad,
  onUpdatePrecio,
  onUpdateTarifa,
  onRemoveItem,
  onClearCart
}) {
  return (
    <div className="flex flex-col h-full dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Cabecera del Carrito como en el Mockup */}
      <div className="bg-[#01a59c] text-white px-4 py-3 flex items-center justify-between text-sm font-bold tracking-wider uppercase select-none shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <span>CANTIDAD</span>
          <span>/ PRECIO</span>
          <span>/ TOTAL</span>
        </div>

        {cartItems.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="text-[12px] font-semibold text-white hover:text-white hover:underline flex items-center gap-1.5"
          >
            Vaciar ({cartItems.length})
          </button>
        )}
      </div>

      {/* Lista de Items en Carrito */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2.5">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-300 dark:text-slate-600">
              <ShoppingCartIcon className="h-8 w-8" />
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              El carrito está vacío
            </p>
            <p className="text-sm text-slate-400 mt-1 max-w-xs">
              Haga clic en los productos del panel izquierdo o escanee un código de barras para comenzar la venta.
            </p>
          </div>
        ) : (
          cartItems.map((item) => {
            const subtotal = Number(item.cantidad) * Number(item.precio_unitario)
            const costo = Number(item.precio_costo || 0)

            return (
              <div
                key={item.uniqueId}
                className="dark:bg-slate-800/90 rounded-bl-xl border-b-2 border-l-2 p-2 dark:border-slate-700/80 shadow-xs hover:border-[#01a59c]/50 transition-all"
              >
                {/* Fila superior: Nombre de producto + Selector de tarifa y Precio Costo */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate">
                      {item.nombre_completo}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Selector de Tarifa / Precio */}
                    {/* <select
                      value={item.tarifa || 'menor'}
                      onChange={(e) => onUpdateTarifa(item.uniqueId, e.target.value)}
                      className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-[10px] rounded px-1.5 py-0.5 font-medium outline-none cursor-pointer"
                    >
                      <option value="menor">Menor/Lista</option>
                      {item.precio_mayor > 0 && <option value="mayor">Mayorista</option>}
                      {item.precio_especial > 0 && <option value="especial">Especial</option>}
                    </select> */}

                    {/* Indicador de Precio Costo como en la imagen */}
                    {costo > 0 && (
                      <span className="text-[12px] text-white font-semibold bg-[#01a59c] px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-1 shrink-0">
                        Precio Costo:{costo.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Fila inferior: Inputs de Cantidad, Precio, Total y Botones de Acción */}
                <div className="flex items-center gap-1.5">
                  {/* Input Cantidad */}
                  <div className="">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      value={item.cantidad}
                      onChange={(e) => onUpdateCantidad(item.uniqueId, parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-center font-mono font-bold text-sm text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-[#01a59c]"
                    />
                  </div>

                  {/* Input Precio Unitario */}
                  <div className="flex-1">
                    <div className="relative">
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-600 font-mono">
                        S/
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.precio_unitario}
                        onChange={(e) => onUpdatePrecio(item.uniqueId, parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#018e86]/10 dark:bg-[#018e86]/20 border border-[#01a59c]/30 rounded-lg pl-5 pr-2 py-1 text-center font-bold text-sm text-teal-900 dark:text-teal-200 outline-none focus:ring-1 focus:ring-[#01a59c]"
                      />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="relative">
                      {/* Total de Línea (destacado) */}
                      <div className="flex-1 bg-[#01473d] text-white rounded-lg py-1 px-2 text-center font-bold text-sm shadow-inner">
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-200 font-semibold">
                          S/
                        </span>
                        {subtotal.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Botón Eliminar (Trash) */}
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.uniqueId)}
                    className="w-7 h-7 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center transition-colors shadow-xs shrink-0"
                    title="Eliminar del carrito"
                  >
                    <TrashIcon className="h-3.5 w-3.5" strokeWidth={4} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
