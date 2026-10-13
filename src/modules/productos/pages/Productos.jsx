import { useEffect, useState, useMemo } from 'react'
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArchiveBoxIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import { useProductosStore } from '../../../store/useProductosStore.js'
import { exportToExcel, formatCurrency } from '../../../utils/exportExcel.js'
import ProductoModal from '../components/ProductoModal.jsx'
import { DataTable } from '../../../components/ui/DataTable.jsx'
import Can from '../../../components/ui/Can.jsx'
import { toast } from '../../../utils/toast.js'

export default function Productos() {
  const { productos, loading, fetchProductos, deleteProducto } = useProductosStore()

  const [busq, setBusq] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [productoEdit, setProductoEdit] = useState(null)

  useEffect(() => {
    fetchProductos()
  }, [fetchProductos])

  const filtered = useMemo(() => {
    return productos.filter(p =>
      p.nombre?.toLowerCase().includes(busq.toLowerCase()) ||
      p.codigo_barra?.toLowerCase().includes(busq.toLowerCase()) ||
      p.palabra_clave?.toLowerCase().includes(busq.toLowerCase())
    )
  }, [productos, busq])

  const handleExport = () => {
    if (filtered.length === 0) {
      return toast.info('Exportación vacía', 'No hay productos para exportar.')
    }
    const data = filtered.map((p) => ({
      Nombre: p.nombre,
      'Código de Barras': p.codigo_barra || '-',
      'Unidad Medida': p.unidad_medida_id || 'NIU',
      'Precio Venta': Number(p.precio_venta || 0),
      'Precio Costo': Number(p.precio_costo || 0),
      'Precio Mayor': Number(p.precio_mayor || 0),
      'Stock Mínimo': Number(p.stock_minimo || 0),
      Facturable: p.es_facturable ? 'Sí' : 'No',
      Estado: p.activo ? 'Activo' : 'Inactivo'
    }))
    exportToExcel(data, 'catalogo_productos', 'Productos')
    toast.success('Archivo descargado', 'El catálogo de productos se ha exportado correctamente a Excel.')
  }

  const handleOpenNew = () => {
    setProductoEdit(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (p) => {
    setProductoEdit(p)
    setIsModalOpen(true)
  }

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Desea dar de baja el producto "${nombre || 'seleccionado'}"?`)) return
    const res = await deleteProducto(id)
    if (res.success) {
      toast.success('Producto inactivado', 'El producto ha sido dado de baja del catálogo.')
    } else {
      toast.error('Error al inactivar', res.error || 'No se pudo dar de baja el producto.')
    }
  }

  const columns = useMemo(() => [
    {
      header: 'Producto / Descripción',
      accessorKey: 'nombre',
      cell: (info) => {
        const p = info.row.original
        const cantPres = Array.isArray(p.presentaciones) ? p.presentaciones.length : 1
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs tracking-wider border border-blue-100 dark:border-blue-800/40">
              <TagIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                {p.nombre}
                {p.es_facturable && (
                  <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    FE
                  </span>
                )}
                {p.categoria_nombre && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {p.categoria_nombre}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="font-mono">{p.codigo_barra || 'Sin SKU'}</span>
                <span>•</span>
                <span>{p.unidad_medida_id || 'NIU'}</span>
                <span>•</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {cantPres} {cantPres === 1 ? 'presentación' : 'presentaciones'}
                </span>
              </div>
            </div>
          </div>
        )
      }
    },
    {
      header: 'Tarifas / Presentaciones',
      id: 'precios_pres',
      cell: (info) => {
        const p = info.row.original
        const presList = Array.isArray(p.presentaciones) && p.presentaciones.length > 0
          ? p.presentaciones
          : [{ nombre: 'UNIDAD', precio_venta: p.precio_venta, precio_mayor: p.precio_mayor }]

        return (
          <div className="space-y-1 py-0.5">
            {presList.map((pres, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-mono">
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase">
                  {pres.nombre}
                </span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(Number(pres.precio_venta || 0))}
                </span>
                {Number(pres.precio_mayor) > 0 && (
                  <span className="text-slate-400 text-[10px]">
                    (Mayor: {formatCurrency(Number(pres.precio_mayor))})
                  </span>
                )}
              </div>
            ))}
          </div>
        )
      }
    },
    {
      header: 'Stock Mín.',
      accessorKey: 'stock_minimo',
      cell: (info) => (
        <span className="font-mono text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {info.getValue() ?? 0} unid.
        </span>
      )
    },
    {
      header: 'Estado',
      accessorKey: 'activo',
      cell: (info) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            info.getValue()
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400'
              : 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400'
          }`}
        >
          {info.getValue() ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: (info) => {
        const p = info.row.original
        return (
          <div className="flex justify-end gap-1">
            <Can I="editar" a="productos">
              <button
                onClick={() => handleOpenEdit(p)}
                className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                title="Editar producto"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            </Can>
            <Can I="eliminar" a="productos">
              <button
                onClick={() => handleDelete(p.id, p.nombre)}
                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                title="Inactivar producto"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </Can>
          </div>
        )
      },
      className: 'text-right'
    }
  ], [])

  return (
    <div className="space-y-6 p-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ArchiveBoxIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            Catálogo de Productos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestión de artículos, unidades de medida SUNAT, afectaciones de IGV y tarifas de venta.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={busq}
              onChange={(e) => setBusq(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white transition-all"
            />
          </div>

          <Can I="ver" a="productos">
            <button onClick={handleExport} className="btn-primary flex items-center gap-2">
              <ArrowDownTrayIcon className="h-4 w-4" />
              Exportar
            </button>
          </Can>

          <Can I="crear" a="productos">
            <button onClick={handleOpenNew} className="btn-primary flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              Nuevo Producto
            </button>
          </Can>
        </div>
      </div>

      {/* Tabla con TanStack Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs overflow-hidden">
        <DataTable
          data={filtered}
          columns={columns}
          loading={loading}
          emptyMessage="No se encontraron productos registrados en esta sucursal."
        />
      </div>

      {/* Modal Crear / Editar */}
      <ProductoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        producto={productoEdit}
        onSave={fetchProductos}
      />
    </div>
  )
}
