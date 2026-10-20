import React, { useState, useMemo } from 'react'
import {
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import ClienteSection from './ClienteSection.jsx'

export default function ResumenProductosTabla({
  cartItems = [],
  cliente,
  setCliente,
  tipoDocumento = 'boleta',
  setTipoDocumento,
  placa = '',
  setPlaca,
  onOpenBuscarCliente,
  onOpenAgregarProducto,
  onUpdateCantidad,
  onUpdatePrecio,
  onUpdateDescuento,
  onRemoveItem
}) {
  // Filtros por columna
  const [filtroDesc, setFiltroDesc] = useState('')
  const [filtroCant, setFiltroCant] = useState('')
  const [filtroPrecio, setFiltroPrecio] = useState('')
  const [filtroDescMonto, setFiltroDescMonto] = useState('')
  const [filtroTotal, setFiltroTotal] = useState('')

  // Filtrado
  const itemsFiltrados = useMemo(() => {
    return cartItems.filter((item) => {
      const matchDesc = !filtroDesc || item.nombre_completo?.toLowerCase().includes(filtroDesc.toLowerCase())
      const matchCant = !filtroCant || String(item.cantidad).includes(filtroCant)
      const matchPrecio = !filtroPrecio || String(item.precio_unitario).includes(filtroPrecio)
      const matchDescMonto = !filtroDescMonto || String(item.descuento || 0).includes(filtroDescMonto)
      const totalItem = (Number(item.cantidad) * Number(item.precio_unitario) - Number(item.descuento || 0)).toFixed(2)
      const matchTotal = !filtroTotal || String(totalItem).includes(filtroTotal)

      return matchDesc && matchCant && matchPrecio && matchDescMonto && matchTotal
    })
  }, [cartItems, filtroDesc, filtroCant, filtroPrecio, filtroDescMonto, filtroTotal])

  return (
    <div className="flex flex-col h-full dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border dark:border-slate-800 shadow-sm p-3 sm:p-4 overflow-hidden">
      {/* ── Cabecera: Diseño Idéntico de ClienteSection para Mantener Orden y Consistencia ── */}
      <div className="pb-2 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
        <ClienteSection
          cliente={cliente}
          setCliente={setCliente}
          tipoDocumento={tipoDocumento}
          setTipoDocumento={setTipoDocumento}
          placa={placa}
          setPlaca={setPlaca}
          onOpenBuscarModal={onOpenBuscarCliente}
        />
      </div>

      {/* ── Barra de Acciones: Botón Agregar Producto y Contador ── */}
      <div className="flex items-center justify-between mt-2.5 mb-1 shrink-0">
        <button
          type="button"
          onClick={onOpenAgregarProducto}
          className="inline-flex items-center gap-1.5 bg-[#01a59c] hover:bg-[#008f87] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
          title="Agregar producto a esta preventa"
        >
          <PlusIcon className="h-4 w-4 stroke-[2.5]" />
          <span>Agregar Producto</span>
        </button>

        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'} en total
        </span>
      </div>

      {/* ── Tabla de Resumen de Productos con Edición En Línea ── */}
      <div className="flex-1 overflow-y-auto mt-1 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-xs text-left border-collapse">
            {/* Headers */}
            <thead className="bg-[#01473d] text-xs text-white dark:text-slate-200 uppercase font-bold sticky top-0 backdrop-blur-sm z-10">
              <tr>
                <th className="py-2.5 px-3 border-b border-slate-200 dark:border-slate-700">Producto / Presentación</th>
                <th className="py-2.5 px-3 border-b border-slate-200 dark:border-slate-700 text-center w-24">Cantidad</th>
                <th className="py-2.5 px-3 border-b border-slate-200 dark:border-slate-700 text-right w-24">Precio</th>
                <th className="py-2.5 px-3 border-b border-slate-200 dark:border-slate-700 text-right w-20">Desc.</th>
                <th className="py-2.5 px-3 border-b border-slate-200 dark:border-slate-700 text-right w-24">Total</th>
                <th className="py-2.5 px-2 border-b border-slate-200 dark:border-slate-700 text-center w-12">Acción</th>
              </tr>
              {/* Fila de Filtros */}
              <tr className="bg-slate-50/90 dark:bg-slate-800/80">
                <th className="p-1 border-b border-slate-200 dark:border-slate-700">
                  <input
                    type="text"
                    value={filtroDesc}
                    onChange={(e) => setFiltroDesc(e.target.value)}
                    placeholder="Filtrar..."
                    className="w-full px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-normal outline-none focus:ring-1 focus:ring-[#01a59c]"
                  />
                </th>
                <th className="p-1 border-b border-slate-200 dark:border-slate-700">
                  <input
                    type="text"
                    value={filtroCant}
                    onChange={(e) => setFiltroCant(e.target.value)}
                    className="w-full px-1 py-0.5 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-normal outline-none focus:ring-1 focus:ring-[#01a59c]"
                  />
                </th>
                <th className="p-1 border-b border-slate-200 dark:border-slate-700">
                  <input
                    type="text"
                    value={filtroPrecio}
                    onChange={(e) => setFiltroPrecio(e.target.value)}
                    className="w-full px-1 py-0.5 text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-normal outline-none focus:ring-1 focus:ring-[#01a59c]"
                  />
                </th>
                <th className="p-1 border-b border-slate-200 dark:border-slate-700">
                  <input
                    type="text"
                    value={filtroDescMonto}
                    onChange={(e) => setFiltroDescMonto(e.target.value)}
                    className="w-full px-1 py-0.5 text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-normal outline-none focus:ring-1 focus:ring-[#01a59c]"
                  />
                </th>
                <th className="p-1 border-b border-slate-200 dark:border-slate-700">
                  <input
                    type="text"
                    value={filtroTotal}
                    onChange={(e) => setFiltroTotal(e.target.value)}
                    className="w-full px-1 py-0.5 text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-normal outline-none focus:ring-1 focus:ring-[#01a59c]"
                  />
                </th>
                <th className="p-1 border-b border-slate-200 dark:border-slate-700"></th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {itemsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No hay productos en esta preventa. Haga clic en "+ Agregar Producto" para añadir ítems.
                  </td>
                </tr>
              ) : (
                itemsFiltrados.map((item) => {
                  const subtotal = Number(item.cantidad) * Number(item.precio_unitario) - Number(item.descuento || 0)
                  return (
                    <tr
                      key={item.uniqueId}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Nombre del Producto + Badges de Afectación */}
                      <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-100" title={item.nombre_completo}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="truncate max-w-[200px] font-medium">{item.nombre_completo}</span>
                          {item.tipo_afectacion_igv === '20' && (
                            <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300">
                              EXO
                            </span>
                          )}
                          {item.tipo_afectacion_igv === '30' && (
                            <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                              INA
                            </span>
                          )}
                          {(item.gratuito || ['11', '12', '13', '14', '15', '16', '21', '31', '32', '37'].includes(item.tipo_afectacion_igv)) && (
                            <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300">
                              GRAT
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cantidad Editable */}
                      <td className="py-1 px-1.5 text-center">
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          value={item.cantidad}
                          onChange={(e) => onUpdateCantidad && onUpdateCantidad(item.uniqueId, parseFloat(e.target.value) || 0)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md py-1 text-center font-bold text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-[#01a59c]"
                        />
                      </td>

                      {/* Precio Editable */}
                      <td className="py-1 px-1.5 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.precio_unitario}
                          onChange={(e) => onUpdatePrecio && onUpdatePrecio(item.uniqueId, parseFloat(e.target.value) || 0)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md py-1 text-right font-bold text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-[#01a59c]"
                        />
                      </td>

                      {/* Descuento Editable */}
                      <td className="py-1 px-1.5 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.descuento || 0}
                          onChange={(e) => onUpdateDescuento && onUpdateDescuento(item.uniqueId, parseFloat(e.target.value) || 0)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md py-1 text-right text-xs text-slate-600 dark:text-slate-300 outline-none focus:ring-1 focus:ring-[#01a59c]"
                        />
                      </td>

                      {/* Total */}
                      <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                        S/. {subtotal.toFixed(2)}
                      </td>

                      {/* Botón Eliminar Producto */}
                      <td className="py-2 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => onRemoveItem && onRemoveItem(item.uniqueId)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors cursor-pointer"
                          title="Eliminar producto"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
