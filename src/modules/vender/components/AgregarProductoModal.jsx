import React, { useState, useMemo, useEffect } from 'react'
import { MagnifyingGlassIcon, PlusIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'
import Modal from '../../../components/ui/Modal.jsx'
import { useProductosStore } from '../../../store/useProductosStore.js'

export default function AgregarProductoModal({
  isOpen,
  onClose,
  onAgregarItem
}) {
  const { productos, loading, fetchProductos } = useProductosStore()
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (!productos || productos.length === 0) {
        fetchProductos()
      }
      setBusqueda('')
    }
  }, [isOpen, fetchProductos, productos])

  // Aplanar productos con sus presentaciones
  const itemsDisponibles = useMemo(() => {
    const list = []
    productos.forEach((prod) => {
      if (prod.presentaciones && prod.presentaciones.length > 0) {
        prod.presentaciones.forEach((pres) => {
          list.push({
            uniqueId: `${prod.id}-${pres.id}`,
            producto_id: prod.id,
            presentacion_id: pres.id,
            nombre_producto: prod.nombre,
            nombre_presentacion: pres.nombre,
            nombre_completo: `${prod.nombre} ${pres.nombre}`.trim().toUpperCase(),
            precio: Number(pres.precio_venta || prod.precio_venta || 0),
            precio_costo: Number(pres.precio_costo || prod.precio_costo || 0),
            precio_mayor: Number(pres.precio_mayor || 0),
            precio_especial: Number(pres.precio_especial || 0),
            stock: Number(prod.stock_actual ?? prod.stock ?? 0),
            codigo: prod.codigo || '',
            codigo_barra: pres.cod_barra || prod.codigo_barra || '',
            unidad_medida: prod.unidad_medida_id || 'NIU',
            es_facturable: prod.es_facturable !== false
          })
        })
      } else {
        list.push({
          uniqueId: `${prod.id}-base`,
          producto_id: prod.id,
          presentacion_id: null,
          nombre_producto: prod.nombre,
          nombre_presentacion: 'UNIDAD',
          nombre_completo: `${prod.nombre} UNIDAD`.trim().toUpperCase(),
          precio: Number(prod.precio_venta || 0),
          precio_costo: Number(prod.precio_costo || 0),
          precio_mayor: Number(prod.precio_mayor || 0),
          precio_especial: Number(prod.precio_especial || 0),
          stock: Number(prod.stock_actual ?? prod.stock ?? 0),
          codigo: prod.codigo || '',
          codigo_barra: prod.codigo_barra || '',
          unidad_medida: prod.unidad_medida_id || 'NIU',
          es_facturable: prod.es_facturable !== false
        })
      }
    })
    return list
  }, [productos])

  // Filtrado reactivo por texto o código de barras
  const itemsFiltrados = useMemo(() => {
    if (!busqueda.trim()) return itemsDisponibles.slice(0, 50)
    const term = busqueda.toLowerCase().trim()
    return itemsDisponibles.filter((item) => {
      const matchNombre = item.nombre_completo.toLowerCase().includes(term)
      const matchCodigo = item.codigo.toLowerCase().includes(term)
      const matchBarra = item.codigo_barra.toLowerCase().includes(term)
      return matchNombre || matchCodigo || matchBarra
    })
  }, [itemsDisponibles, busqueda])

  const handleSelect = (item) => {
    onAgregarItem(item)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar Producto a la Venta"
      maxWidth="max-w-3xl"
      showFooter={false}
    >
      <div className="space-y-3">
        {/* Input Buscador */}
        <div className="relative">
          <input
            type="text"
            autoFocus
            placeholder="Buscar por nombre, código o código de barras..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#01a59c] text-slate-800 dark:text-white shadow-xs"
          />
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        </div>

        {/* Cabecera de la tabla */}
        <div className="grid grid-cols-[1fr_100px_90px_60px] bg-[#01473d] text-white px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider select-none">
          <div>Producto / Presentación</div>
          <div className="text-right">Precio</div>
          <div className="text-right">Stock</div>
          <div className="text-center">Acción</div>
        </div>

        {/* Listado de resultados */}
        <div className="max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-b-xl divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Cargando catálogo de productos...
            </div>
          ) : itemsFiltrados.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center">
              <ShoppingBagIcon className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
              <span>No se encontraron productos coincidentes</span>
            </div>
          ) : (
            itemsFiltrados.map((item) => (
              <div
                key={item.uniqueId}
                className="grid grid-cols-[1fr_100px_90px_60px] items-center px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-100 truncate pr-2">
                  {item.nombre_completo}
                </div>
                <div className="text-right font-bold text-slate-900 dark:text-emerald-400">
                  S/. {item.precio.toFixed(2)}
                </div>
                <div className="text-right text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {item.stock} {item.unidad_medida}
                </div>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="p-1.5 bg-[#01a59c] hover:bg-[#008f87] text-white rounded-lg shadow-sm transition-transform active:scale-95"
                    title="Agregar al carrito"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}
