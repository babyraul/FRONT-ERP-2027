import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ChevronDownIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

export default function ProductosList({ productos = [], loading = false, onAgregarItem }) {
  const [busqueda, setBusqueda] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)

  // Aplanar productos con sus presentaciones para el listado rápido
  // como se aprecia en el mockup ("PASPAS LAYS UNIDAD", "CABLE 14 METRO", etc.)
  const itemsDisponibles = useMemo(() => {
    const list = []

    productos.forEach((prod) => {
      // Si el producto tiene presentaciones
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
            stock: Number(pres.stock_actual ?? prod.stock_actual ?? prod.stock ?? 0),
            codigo: prod.codigo || '',
            codigo_barra: pres.cod_barra || prod.codigo_barra || '',
            unidad_medida: prod.unidad_medida_id || 'NIU',
            es_facturable: prod.es_facturable !== false,
            presentaciones_disponibles: prod.presentaciones
          })
        })
      } else {
        // Sin presentaciones explícitas: usar producto base
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
          es_facturable: prod.es_facturable !== false,
          presentaciones_disponibles: []
        })
      }
    })

    return list
  }, [productos])

  // Filtrado de items
  const itemsFiltrados = useMemo(() => {
    if (!busqueda.trim()) return itemsDisponibles

    const q = busqueda.toLowerCase().trim()
    return itemsDisponibles.filter(
      (item) =>
        item.nombre_completo.toLowerCase().includes(q) ||
        item.codigo.toLowerCase().includes(q) ||
        item.codigo_barra.toLowerCase().includes(q)
    )
  }, [itemsDisponibles, busqueda])

  // Manejo de atajos de teclado en el buscador (Enter para agregar, Flechas para navegar)
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < itemsFiltrados.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (itemsFiltrados[selectedIndex]) {
        onAgregarItem(itemsFiltrados[selectedIndex])
      }
    }
  }

  // Atajo global F2 para enfocar el buscador
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if (e.key === 'F2') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleGlobalKey)
    return () => window.removeEventListener('keydown', handleGlobalKey)
  }, [])

  return (
    <div className="flex flex-col h-full dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Buscador de Producto */}
      <div className="my-2 mx-1 border-b border-slate-200/60 dark:border-slate-800">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar Producto... (F2)"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#01a59c] shadow-xs"
          />
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        </div>
      </div>
      {/* Cabecera de la tabla */}
      <div className="grid grid-cols-[1fr_90px_70px] bg-[#01473d] text-white px-4 py-3 text-sm border rounded-t-xl font-bold tracking-wider uppercase select-none shrink-0">
        <div>Producto / Presentación</div>
        <div className="text-right">Precio</div>
        <div className="text-right">Stock</div>
      </div>

      {/* Listado de Productos con scroll independiente */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-[12px]">
            Cargando productos...
          </div>
        ) : itemsFiltrados.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-[14px]">
            No se encontraron productos disponibles.
          </div>
        ) : (
          itemsFiltrados.map((item, index) => {
            const isSelected = index === selectedIndex
            const stock = item.stock
            const stockBadgeCls =
              stock > 5
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                : stock > 0
                  ? 'text-amber-600 dark:text-amber-400 font-semibold'
                  : stock === 0
                    ? 'text-slate-500 dark:text-slate-400 font-semibold'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 px-1.5 py-0.5 rounded-md font-mono font-bold'

            return (
              <div
                key={item.uniqueId}
                onClick={() => onAgregarItem(item)}
                className={`grid grid-cols-[1fr_90px_70px] items-center px-4 py-2.5 text-sm cursor-pointer transition-colors select-none ${isSelected
                  ? 'dark:bg-teal-950/40 ring-1 ring-[#01a59c]/50'
                  : 'hover:bg-slate-200/80 dark:hover:bg-slate-800/40'
                  }`}
              >
                {/* Nombre de producto con presentación */}
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="w-5 h-5 rounded bg-[#01a59c] text-white flex items-center justify-center shrink-0">
                    <ChevronDownIcon className="h-4 w-4" />
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                    {item.nombre_completo}
                  </span>
                </div>

                {/* Precio */}
                <div className="text-right font-bold text-black dark:text-slate-200">
                  <span className="text-sm text-gray-600 mr-0.5">S/</span>
                  {item.precio.toFixed(2)}
                </div>

                {/* Stock disponible (soporta stock negativo) */}
                <div className="text-right">
                  <span className={stockBadgeCls}>{stock}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
