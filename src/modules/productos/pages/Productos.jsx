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
      p.codigo?.toLowerCase().includes(busq.toLowerCase()) ||
      p.codigo_barra?.toLowerCase().includes(busq.toLowerCase()) ||
      p.palabra_clave?.toLowerCase().includes(busq.toLowerCase())
    )
  }, [productos, busq])

  const handleExport = () => {
    if (filtered.length === 0) {
      return toast.info('Exportación vacía', 'No hay productos para exportar.')
    }
    const data = filtered.map((p) => ({
      Código: p.codigo || '-',
      Nombre: p.nombre,
      'Código de Barras': p.codigo_barra || '-',
      'Unidad Medida': p.unidad_medida_id || 'NIU',
      'Precio Venta': Number(p.precio_venta || 0),
      'Precio Costo': Number(p.precio_costo || 0),
      'Precio Mayor': Number(p.precio_mayor || 0),
      'Stock Mínimo': Number(p.stock_minimo || 0),
      Facturable: p.es_facturable ? 'Sí' : 'No'
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

  const [expandedRows, setExpandedRows] = useState({})

  const toggleExpandPrices = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const columns = useMemo(() => [
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
    },
    {
      header: 'Código',
      accessorKey: 'codigo',
      cell: (info) => {
        const codigo = info.getValue()
        return codigo ? (
          <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-md inline-block tracking-wide">
            {codigo}
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 text-xs italic font-mono">—</span>
        )
      },
      size: 80
    },
    {
      header: 'Cód. Barras',
      accessorKey: 'codigo_barra',
      cell: (info) => {
        const cod = info.getValue()
        return cod ? (
          <span className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700 inline-block">
            {cod}
          </span>
        ) : (
          <span className="text-slate-400 text-xs italic">Sin SKU</span>
        )
      },
      size: 120
    },
    {
      header: 'Producto / Descripción',
      accessorKey: 'nombre',
      cell: (info) => {
        const p = info.row.original
        return (
          <div className="space-y-0.5 max-w-xs">
            <div className="font-semibold text-slate-800 dark:text-white flex items-center gap-1.5 flex-wrap">
              <span>{p.nombre}</span>
              {p.unidad_medida_id && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700">
                  {p.unidad_medida_id}
                </span>
              )}
            </div>
            {p.descripcion && (
              <p className="text-xs text-slate-400 dark:text-slate-400 line-clamp-1 truncate" title={p.descripcion}>
                {p.descripcion}
              </p>
            )}
            {p.palabra_clave && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 italic truncate" title={p.palabra_clave}>
                Tags: {p.palabra_clave}
              </p>
            )}
          </div>
        )
      }
    },
    {
      header: 'Presentaciones & Tarifas',
      id: 'presentaciones_tarifas',
      cell: (info) => {
        const p = info.row.original
        const presList = Array.isArray(p.presentaciones) && p.presentaciones.length > 0
          ? p.presentaciones
          : [{
              nombre: 'PRINCIPAL',
              multiplica_por: 1,
              precio_costo: p.precio_costo,
              precio_venta: p.precio_venta,
              precio_mayor: p.precio_mayor,
              precio_especial: p.precio_especial
            }]

        const isExpanded = Boolean(expandedRows[p.id])
        const hasExtraPrices = presList.some(
          pres => Number(pres.precio_mayor || 0) > 0 || Number(pres.precio_especial || 0) > 0
        )

        return (
          <div className="space-y-1.5 py-1 min-w-[280px]">
            {presList.map((pres, i) => (
              <div
                key={i}
                className="p-1.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-lg text-xs"
              >
                <div className="flex items-center justify-between gap-2 font-mono">
                  {/* Nombre y factor de conversión */}
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-700 dark:text-slate-200 uppercase text-[11px]">
                      {pres.nombre}
                    </span>
                    <span
                      className="text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded font-semibold border border-indigo-200/60 dark:border-indigo-800"
                      title="Factor de conversión por empaque o unidad base"
                    >
                      x{pres.multiplica_por || 1}
                    </span>
                  </div>

                  {/* Precios Principales: Costo y Venta */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]" title="Precio de Costo">
                      C: <strong className="text-slate-600 dark:text-slate-300 font-semibold">{formatCurrency(Number(pres.precio_costo || 0))}</strong>
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400 text-[11px] font-bold" title="Precio de Venta">
                      V: {formatCurrency(Number(pres.precio_venta || 0))}
                    </span>
                  </div>
                </div>

                {/* Precios adicionales desplegables (Mayor / Especial) */}
                {isExpanded && (
                  <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {Number(pres.precio_mayor || 0) > 0 && (
                      <span>
                        Mayor: <strong className="text-blue-600 dark:text-blue-400">{formatCurrency(Number(pres.precio_mayor))}</strong>
                      </span>
                    )}
                    {Number(pres.precio_especial || 0) > 0 && (
                      <span>
                        Especial: <strong className="text-purple-600 dark:text-purple-400">{formatCurrency(Number(pres.precio_especial))}</strong>
                      </span>
                    )}
                    {Number(pres.precio_mayor || 0) === 0 && Number(pres.precio_especial || 0) === 0 && (
                      <span className="italic text-slate-400 text-[10px]">Sin tarifas alternativas</span>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Toggle para ver más precios si existen */}
            {hasExtraPrices && (
              <button
                type="button"
                onClick={() => toggleExpandPrices(p.id)}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1 mt-0.5"
              >
                {isExpanded ? '▲ Ocultar tarifas adicionales' : '▼ Ver más precios (Mayor / Especial)'}
              </button>
            )}
          </div>
        )
      }
    },
    {
      header: 'Información & Clasificación',
      id: 'info_producto',
      cell: (info) => {
        const p = info.row.original
        return (
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              {p.categoria_nombre && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {p.categoria_nombre}
                </span>
              )}
              {p.sub_categoria_nombre && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {p.sub_categoria_nombre}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {p.es_facturable && (
                <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
                  FE (Facturable)
                </span>
              )}
              {p.es_combo && (
                <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40">
                  Combo
                </span>
              )}
              {p.es_producido && (
                <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
                  Producido
                </span>
              )}
              {p.es_insumo && (
                <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40">
                  Insumo
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
              <span>Stock Mín: <strong className="text-slate-700 dark:text-slate-300">{p.stock_minimo ?? 0}</strong></span>
              {p.codigo_sunat && <span>• SUNAT: {p.codigo_sunat}</span>}
            </div>
          </div>
        )
      }
    }
  ], [expandedRows])

  return (
    <div className="space-y-6 p-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
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
