import React, { useState, useMemo } from 'react'
import { PencilSquareIcon, UserCircleIcon } from '@heroicons/react/24/solid'

export default function ResumenProductosTabla({
  cartItems = [],
  cliente,
  onEditarVenta
}) {
  // Filtros por columna como en el mockup
  const [filtroDesc, setFiltroDesc] = useState('')
  const [filtroCant, setFiltroCant] = useState('')
  const [filtroPrecio, setFiltroPrecio] = useState('')
  const [filtroDescMonto, setFiltroDescMonto] = useState('')
  const [filtroTotal, setFiltroTotal] = useState('')

  // Paginación
  const [pageSize, setPageSize] = useState(8)
  const [currentPage, setCurrentPage] = useState(1)

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

  // Paginación calculada
  const totalPages = Math.max(1, Math.ceil(itemsFiltrados.length / pageSize))
  const pageActual = Math.min(currentPage, totalPages)
  const itemsPaginados = useMemo(() => {
    const start = (pageActual - 1) * pageSize
    return itemsFiltrados.slice(start, start + pageSize)
  }, [itemsFiltrados, pageActual, pageSize])

  return (
    <div className="flex flex-col h-full dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border dark:border-slate-800 shadow-sm p-4 overflow-hidden">
      {/* ── Cabecera: Botón Editar y Datos de Cliente ── */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
        <button
          type="button"
          onClick={onEditarVenta}
          className="w-10 h-10 rounded-xl bg-amber-600 hover:bg-amber-600 text-white flex items-center justify-center shadow-md transition-transform active:scale-95"
          title="Regresar a editar productos / cliente"
        >
          <PencilSquareIcon className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-2.5 text-right">
          <div className="flex flex-col items-end">
            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
              {cliente?.numero_documento || '99999999'}
            </span>
            <span className="text-xs uppercase font-extrabold text-slate-600 dark:text-slate-300 tracking-wider">
              {cliente?.nombre_razon_social || 'VARIOS'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#01a59c]/20 text-[#01a59c] flex items-center justify-center">
            <UserCircleIcon className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* ── Tabla de Resumen de Productos ── */}
      <div className="flex-1 overflow-y-auto mt-3 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-xs text-left border-collapse">
            {/* Headers */}
            <thead className="bg-[#01473d] text-sm text-white dark:text-slate-200 uppercase font-bold sticky top-0 backdrop-blur-sm z-10">
              <tr>
                <th className="py-2.5 px-3 border-b border-slate-200 dark:border-slate-700">Producto / Presentación</th>
                <th className="py-2.5 px-3 border-b border-slate-200 dark:border-slate-700 text-center w-28">Cantidad</th>
                <th className="py-2.5 px-3 border-b border-slate-200 dark:border-slate-700 text-right w-28">Precio</th>
                <th className="py-2.5 px-3 border-b border-slate-200 dark:border-slate-700 text-right w-28">Descuento</th>
                <th className="py-2.5 px-3 border-b border-slate-200 dark:border-slate-700 text-right w-28">Total</th>
              </tr>
              {/* Fila de Filtros por columna como en la imagen */}
              <tr className="bg-slate-50/90 dark:bg-slate-800/80">
                <th className="p-1 border-b border-slate-200 dark:border-slate-700">
                  <input
                    type="text"
                    value={filtroDesc}
                    onChange={(e) => setFiltroDesc(e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-normal outline-none focus:ring-1 focus:ring-[#01a59c]"
                  />
                </th>
                <th className="p-1 border-b border-slate-200 dark:border-slate-700">
                  <input
                    type="text"
                    value={filtroCant}
                    onChange={(e) => setFiltroCant(e.target.value)}
                    className="w-full px-1.5 py-1 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-normal outline-none focus:ring-1 focus:ring-[#01a59c]"
                  />
                </th>
                <th className="p-1 border-b border-slate-200 dark:border-slate-700">
                  <input
                    type="text"
                    value={filtroPrecio}
                    onChange={(e) => setFiltroPrecio(e.target.value)}
                    className="w-full px-1.5 py-1 text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-normal outline-none focus:ring-1 focus:ring-[#01a59c]"
                  />
                </th>
                <th className="p-1 border-b border-slate-200 dark:border-slate-700">
                  <input
                    type="text"
                    value={filtroDescMonto}
                    onChange={(e) => setFiltroDescMonto(e.target.value)}
                    className="w-full px-1.5 py-1 text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-normal outline-none focus:ring-1 focus:ring-[#01a59c]"
                  />
                </th>
                <th className="p-1 border-b border-slate-200 dark:border-slate-700">
                  <input
                    type="text"
                    value={filtroTotal}
                    onChange={(e) => setFiltroTotal(e.target.value)}
                    className="w-full px-1.5 py-1 text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-normal outline-none focus:ring-1 focus:ring-[#01a59c]"
                  />
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {itemsPaginados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No hay productos en esta preventa.
                  </td>
                </tr>
              ) : (
                itemsPaginados.map((item) => {
                  const subtotal = Number(item.cantidad) * Number(item.precio_unitario) - Number(item.descuento || 0)
                  return (
                    <tr
                      key={item.uniqueId}
                      className="hover:bg-slate-200/80 text-sm dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[200px]" title={item.nombre_completo}>
                        {item.nombre_completo}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {item.cantidad}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-700 dark:text-slate-300">
                        S/. {Number(item.precio_unitario).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-700 dark:text-slate-300">
                        S/. {Number(item.descuento || 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-700 dark:text-white">
                        S/. {subtotal.toFixed(2)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Paginación Inferior idéntica al Mockup ── */}
        {/* <div className="bg-slate-100/70 dark:bg-slate-800/70 p-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={pageActual <= 1}
            className="bg-[#01a59c] hover:bg-[#008f87] disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Anterior
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span>Página</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={pageActual}
              onChange={(e) => setCurrentPage(Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1)))}
              className="w-12 text-center py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold font-mono text-xs outline-none"
            />
            <span>de {totalPages}</span>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="ml-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-medium cursor-pointer"
            >
              <option value={8}>8 filas</option>
              <option value={15}>15 filas</option>
              <option value={25}>25 filas</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={pageActual >= totalPages}
            className="bg-[#01a59c] hover:bg-[#008f87] disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Siguiente
          </button>
        </div> */}
      </div>
    </div>
  )
}
