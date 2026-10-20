import React from 'react'
import {
  TrashIcon,
  ShoppingCartIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { permiteDecimales } from '../../../utils/unidades.js'
import { toast } from '../../../utils/toast.js'

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
            className="text-[12px] font-semibold text-white hover:text-white hover:underline flex items-center gap-1.5 cursor-pointer"
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
            const subtotal = Number(item.cantidad || 0) * Number(item.precio_unitario || 0)
            const costo = Number(item.precio_costo || 0)
            const precio = Number(item.precio_unitario || 0)
            const esDecimal = permiteDecimales(item)
            const esBajoCosto = costo > 0 && precio < costo

            // Manejo de eventos de teclado en Cantidad
            const handleKeyDownCantidad = (e) => {
              if (!esDecimal && (e.key === '.' || e.key === ',')) {
                e.preventDefault()
                toast.warning(
                  'Unidad no divisible',
                  `El producto "${item.nombre_completo}" se vende por ${item.unidad_medida_id || 'UNIDAD'} y solo permite cantidades enteras.`
                )
              }
              if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                e.preventDefault()
              }
            }

            // Manejo de cambio en Cantidad
            const handleChangeCantidad = (e) => {
              const valStr = e.target.value
              if (valStr === '') {
                onUpdateCantidad(item.uniqueId, '')
                return
              }
              const parsed = parseFloat(valStr)
              if (isNaN(parsed)) return

              if (!esDecimal) {
                if (valStr.includes('.') || valStr.includes(',') || parsed % 1 !== 0) {
                  toast.warning(
                    'Unidad no divisible',
                    `El producto se vende por ${item.unidad_medida_id || 'UNIDAD'}. Solo se permiten enteros.`
                  )
                  onUpdateCantidad(item.uniqueId, Math.max(1, Math.round(parsed)))
                  return
                }
                onUpdateCantidad(item.uniqueId, Math.max(1, Math.floor(parsed)))
              } else {
                onUpdateCantidad(item.uniqueId, Math.max(0.001, parsed))
              }
            }

            // Manejo de desenfoque en Cantidad
            const handleBlurCantidad = () => {
              const num = Number(item.cantidad)
              if (isNaN(num) || num <= 0) {
                onUpdateCantidad(item.uniqueId, esDecimal ? 0.01 : 1)
              } else if (!esDecimal && num % 1 !== 0) {
                onUpdateCantidad(item.uniqueId, Math.max(1, Math.round(num)))
              }
            }

            // Manejo de cambio en Precio
            const handleChangePrecio = (e) => {
              const valStr = e.target.value
              if (valStr === '') {
                onUpdatePrecio(item.uniqueId, '')
                return
              }
              const parsed = parseFloat(valStr)
              if (isNaN(parsed)) return
              onUpdatePrecio(item.uniqueId, parsed)
            }

            // Manejo de desenfoque en Precio (Validación Estricta: Precio >= Precio Costo)
            const handleBlurPrecio = () => {
              const num = Number(item.precio_unitario)
              if (costo > 0 && (isNaN(num) || num < costo)) {
                toast.error(
                  'Restricción de Precio Costo',
                  `El precio de venta no puede ser menor al precio costo (S/ ${costo.toFixed(2)}). Se ajustó automáticamente.`
                )
                onUpdatePrecio(item.uniqueId, costo)
              } else if (isNaN(num) || num < 0) {
                onUpdatePrecio(item.uniqueId, 0)
              }
            }

            // Manejo de teclas en Precio
            const handleKeyDownPrecio = (e) => {
              if (e.key === 'Enter') {
                e.target.blur()
              }
              if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                e.preventDefault()
              }
            }

            return (
              <div
                key={item.uniqueId}
                className={`dark:bg-slate-800/90 rounded-bl-xl border-b-2 border-l-2 p-2 shadow-xs transition-all ${
                  esBajoCosto
                    ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20'
                    : 'dark:border-slate-700/80 hover:border-[#01a59c]/50'
                }`}
              >
                {/* Fila superior: Nombre de producto + Indicadores */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate">
                      {item.nombre_completo}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Indicador de Tipo de Unidad (Permite decimales vs Entero) */}
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        esDecimal
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                      title={esDecimal ? 'Unidad de medida continua: permite decimales' : 'Unidad entera: solo cantidades enteras'}
                    >
                      {item.unidad_medida_id || (esDecimal ? 'KGM' : 'NIU')}
                    </span>

                    {/* Indicador de Precio Costo */}
                    {costo > 0 && (
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-1 shrink-0 ${
                          esBajoCosto
                            ? 'bg-red-600 text-white animate-pulse'
                            : 'bg-[#01a59c] text-white'
                        }`}
                        title={esBajoCosto ? `El precio no puede ser menor a S/ ${costo.toFixed(2)}` : 'Precio de costo referencial'}
                      >
                        {esBajoCosto && <ExclamationTriangleIcon className="h-3.5 w-3.5 inline" />}
                        {esBajoCosto ? `Bajo Costo (Mín: ${costo.toFixed(2)})` : `Costo: ${costo.toFixed(2)}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Fila inferior: Inputs de Cantidad, Precio, Total y Botones de Acción */}
                <div className="flex items-center gap-1.5">
                  {/* Input Cantidad */}
                  <div className="w-24 relative">
                    <input
                      type="number"
                      step={esDecimal ? 'any' : '1'}
                      min={esDecimal ? '0.001' : '1'}
                      value={item.cantidad}
                      onChange={handleChangeCantidad}
                      onBlur={handleBlurCantidad}
                      onKeyDown={handleKeyDownCantidad}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-center font-mono font-bold text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#01a59c]"
                      title={esDecimal ? 'Permite cantidades decimales' : 'Solo cantidades enteras (1, 2, 3...)'}
                    />
                  </div>

                  {/* Input Precio Unitario */}
                  <div className="flex-1 relative">
                    <div className="relative">
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-600 dark:text-slate-400 font-mono">
                        S/
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min={costo > 0 ? costo : 0}
                        value={item.precio_unitario}
                        onChange={handleChangePrecio}
                        onBlur={handleBlurPrecio}
                        onKeyDown={handleKeyDownPrecio}
                        className={`w-full rounded-lg pl-5 pr-2 py-1 text-center font-bold text-sm outline-none transition-colors ${
                          esBajoCosto
                            ? 'bg-red-100/50 dark:bg-red-950/40 border-2 border-red-500 text-red-700 dark:text-red-300 focus:ring-2 focus:ring-red-500'
                            : 'bg-[#018e86]/10 dark:bg-[#018e86]/20 border border-[#01a59c]/30 text-teal-900 dark:text-teal-200 focus:ring-1 focus:ring-[#01a59c]'
                        }`}
                        title={costo > 0 ? `Precio mínimo permitido: S/ ${costo.toFixed(2)}` : 'Precio de venta'}
                      />
                    </div>
                  </div>

                  {/* Total de Línea (destacado) */}
                  <div className="flex-1">
                    <div className="relative">
                      <div className="flex-1 bg-[#01473d] text-white rounded-lg py-1 px-2 text-center font-bold text-sm shadow-inner truncate">
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
                    className="w-7 h-7 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center transition-colors shadow-xs shrink-0 cursor-pointer"
                    title="Eliminar del carrito"
                  >
                    <TrashIcon className="h-3.5 w-3.5" strokeWidth={4} />
                  </button>
                </div>

                {/* Alerta visible si el precio ingresado está por debajo del costo */}
                {esBajoCosto && (
                  <p className="text-[10px] text-red-600 dark:text-red-400 font-bold mt-1.5 flex items-center gap-1">
                    <ExclamationTriangleIcon className="h-3.5 w-3.5 inline shrink-0" />
                    El precio no puede ser menor al costo (S/ {costo.toFixed(2)}). Se corregirá al salir del campo.
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
