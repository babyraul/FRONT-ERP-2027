import { useState } from 'react'
import { MagnifyingGlassIcon, ArrowDownTrayIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useProductosStore } from '../../store/useProductosStore.js'
import { exportToExcel, formatCurrency } from '../../utils/exportExcel.js'

const CATEGORIAS = ['Abarrotes', 'Lácteos', 'Limpieza', 'Panadería', 'Bebidas', 'Frutas y Verduras']

export default function Productos() {
  const { setBusqueda, setCategoriaFiltro, getFiltered, deleteProducto } = useProductosStore()
  const productos = getFiltered()

  const [busq, setBusq] = useState('')
  const [cat, setCat]   = useState('')

  const handleBusq = (e) => { setBusq(e.target.value); setBusqueda(e.target.value) }
  const handleCat  = (e) => { setCat(e.target.value);  setCategoriaFiltro(e.target.value) }

  const handleExport = () => {
    const data = productos.map((p) => ({
      Código:    p.codigo,
      Nombre:    p.nombre,
      Categoría: p.categoria,
      Precio:    p.precio,
      Stock:     p.stock,
      Estado:    p.estado,
    }))
    exportToExcel(data, 'productos', 'Productos')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{productos.length} productos encontrados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary">
            <ArrowDownTrayIcon className="h-4 w-4" /> Exportar Excel
          </button>
          <button className="btn-primary">
            <PlusIcon className="h-4 w-4" /> Nuevo Producto
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={busq}
            onChange={handleBusq}
            className="input-field pl-9"
          />
        </div>
        <select value={cat} onChange={handleCat} className="input-field w-48">
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium text-right">Precio</th>
                <th className="px-4 py-3 font-medium text-center">Stock</th>
                <th className="px-4 py-3 font-medium text-center">Estado</th>
                <th className="px-4 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.codigo}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{p.categoria}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.precio)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={p.stock < 30 ? 'badge-red' : p.stock < 80 ? 'badge-yellow' : 'badge-green'}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={p.estado === 'activo' ? 'badge-green' : 'badge-gray'}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteProducto(p.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {productos.length === 0 && (
            <div className="py-16 text-center text-gray-400">No se encontraron productos.</div>
          )}
        </div>
      </div>
    </div>
  )
}
