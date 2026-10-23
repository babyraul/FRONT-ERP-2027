import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArchiveBoxIcon,
  TagIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { useProductosStore } from '../../../store/useProductosStore.js'
import { productoController } from '../controllers/producto.js'
import { exportToExcel, formatCurrency } from '../../../utils/exportExcel.js'
import PageHeader from '../../../components/ui/PageHeader.jsx'
import ProductoModal from '../components/ProductoModal.jsx'
import StockKardexModal from '../../stock/components/StockKardexModal.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import { DataTable } from '../../../components/ui/DataTable.jsx'
import Can from '../../../components/ui/Can.jsx'
import {
  ActionCell,
  EditRowButton,
  DeleteRowButton,
  ReactivateRowButton,
  KardexRowButton,
  ExportExcelButton,
  RefreshButton,
  NewButton
} from '../../../components/ui/ActionButtons.jsx'
import { toast } from '../../../utils/toast.js'

export default function Productos() {
  const { productos, loading, fetchProductos, deleteProducto, activarProducto } = useProductosStore()

  const [busq, setBusq] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('activos') // 'activos' | 'inactivos' | 'todos'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [productoEdit, setProductoEdit] = useState(null)
  const [kardexModalOpen, setKardexModalOpen] = useState(false)
  const [kardexProducto, setKardexProducto] = useState(null)

  // Estado para el Modal de confirmación de Baja / Inactivación
  const [bajaModalOpen, setBajaModalOpen] = useState(false)
  const [productoABajar, setProductoABajar] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleOpenKardex = (prod) => {
    setKardexProducto({
      ...prod,
      producto_id: prod.id,
      producto_nombre: prod.nombre,
      codigo: prod.codigo,
      unidad_medida_id: prod.unidad_medida_id || 'NIU',
      saldo_actual: Number(prod.stock_actual ?? prod.stock ?? 0)
    })
    setKardexModalOpen(true)
  }

  useEffect(() => {
    fetchProductos()
  }, [fetchProductos])

  const filtered = useMemo(() => {
    return productos.filter(p => {
      // Filtro por Estado (Activo / Inactivo / Todos)
      const isActivo = p.activo !== false
      if (estadoFiltro === 'activos' && !isActivo) return false
      if (estadoFiltro === 'inactivos' && isActivo) return false

      // Filtro de Búsqueda
      const query = busq.toLowerCase().trim()
      if (!query) return true

      return (
        p.nombre?.toLowerCase().includes(query) ||
        p.codigo?.toLowerCase().includes(query) ||
        p.codigo_barra?.toLowerCase().includes(query) ||
        p.palabra_clave?.toLowerCase().includes(query) ||
        p.descripcion?.toLowerCase().includes(query)
      )
    })
  }, [productos, busq, estadoFiltro])

  const handleExport = () => {
    if (filtered.length === 0) {
      return toast.info('Exportación vacía', 'No hay productos para exportar.')
    }
    const data = filtered.map((p) => {
      const tributoId = String(p.tipo_tributo_id || '10')
      const afectacionLabel = tributoId === '10' ? 'Gravado (10)' : tributoId === '20' ? 'Exonerado (20)' : tributoId === '30' ? 'Inafecto (30)' : tributoId
      return {
        Código: p.codigo || '-',
        Nombre: p.nombre,
        Descripción: p.descripcion || '-',
        'Código de Barras': p.codigo_barra || '-',
        'Unidad Medida': p.unidad_medida_id || 'NIU',
        'Stock Actual': Number(p.stock_actual ?? p.stock ?? 0),
        'Stock Mínimo': Number(p.stock_minimo || 0),
        'Afectación IGV': afectacionLabel,
        'Precio Venta': Number(p.precio_venta || 0),
        'Precio Costo': Number(p.precio_costo || 0),
        'Precio Mayor': Number(p.precio_mayor || 0),
        Facturable: p.es_facturable ? 'Sí' : 'No',
        Estado: p.activo !== false ? 'Activo' : 'Inactivo / Baja'
      }
    })
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

  const handleSolicitarBaja = (prod) => {
    setProductoABajar(prod)
    setBajaModalOpen(true)
  }

  const handleConfirmarBaja = async () => {
    if (!productoABajar?.id) return
    setIsDeleting(true)
    const res = await deleteProducto(productoABajar.id)
    setIsDeleting(false)
    if (res.success) {
      toast.success('Producto inactivado', `"${productoABajar.nombre}" ha sido dado de baja del catálogo.`)
      setBajaModalOpen(false)
      setProductoABajar(null)
    } else {
      toast.error('Error al inactivar', res.error || 'No se pudo dar de baja el producto.')
    }
  }

  const handleReactivar = async (prod) => {
    const res = await activarProducto(prod.id)
    if (res.success) {
      toast.success('Producto reactivado', `"${prod.nombre}" vuelve a estar activo en el catálogo.`)
    } else {
      toast.error('Error al reactivar', res.error || 'No se pudo reactivar el producto.')
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
        const isActivo = p.activo !== false
        return (
          <ActionCell>
            <Can I="editar" a="productos">
              <EditRowButton
                onClick={() => handleOpenEdit(p)}
                title="Editar producto"
              />
            </Can>
            <Can I="eliminar" a="productos">
              {isActivo ? (
                <DeleteRowButton
                  onClick={() => handleSolicitarBaja(p)}
                  title="Dar de baja / Inactivar producto"
                />
              ) : (
                <ReactivateRowButton
                  onClick={() => handleReactivar(p)}
                  title="Reactivar producto"
                />
              )}
            </Can>
          </ActionCell>
        )
      },
      enableColumnFilter: false,
      enableSorting: false
    },
    {
      header: 'Código',
      accessorKey: 'codigo',
      cell: (info) => {
        const codigo = info.getValue()
        return codigo ? (
          <span className="text-xs font-bold text-slate-800 dark:text-slate-300 inline-block tracking-wide">
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
          <span className="text-slate-600 text-xs italic">Sin SKU</span>
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
          <div className="space-y-1 max-w-sm">
            <div className="font-semibold text-slate-800 dark:text-white flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-bold">{p.nombre}</span>
              {p.activo === false && (
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400 border border-rose-300 dark:border-rose-800 shrink-0">
                  Inactivo / Baja
                </span>
              )}
              {p.unidad_medida_id && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700">
                  {p.unidad_medida_id}
                </span>
              )}
            </div>
            {p.descripcion ? (
              <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded border border-slate-200/50 dark:border-slate-700/50 line-clamp-2" title={p.descripcion}>
                {p.descripcion}
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 italic">Sin descripción adicional</p>
            )}
            {p.palabra_clave && (
              <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium truncate" title={p.palabra_clave}>
                🏷️ {p.palabra_clave}
              </p>
            )}
          </div>
        )
      }
    },
    {
      header: 'Presentaciones & Precios',
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
      header: 'Stock Actual',
      accessorKey: 'stock_actual',
      cell: (info) => {
        const p = info.row.original
        const stock = Number(p.stock_actual ?? p.stock ?? 0)
        const min = Number(p.stock_minimo ?? 0)
        const badgeCls =
          stock < 0
            ? 'text-rose-700 border-rose-200 dark:text-rose-400 dark:border-rose-800/60'
            : stock <= min
              ? 'text-amber-800 border-amber-200 dark:text-amber-400 dark:border-amber-800/60'
              : 'text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800/60'

        return (
          <div className="flex flex-col items-center gap-1">
            <span
              className={`font-mono text-xs font-bold ${badgeCls}`}
            >
              {stock} {p.unidad_medida_id || 'NIU'}
            </span>
            {stock < 0 ? (
              <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-mono">
                Mín: {min}
              </span>
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

        // Mapeo amigable de Tipo de Afectación al IGV (SUNAT)
        const tributoId = String(p.tipo_tributo_id || '10')
        const afectacionLabel = tributoId === '10'
          ? 'Gravado'
          : tributoId === '20'
            ? 'Exonerado'
            : tributoId === '30'
              ? 'Inafecto'
              : tributoId === '40'
                ? 'Exportación'
                : `Afect. ${tributoId}`

        const afectacionBadgeCls = tributoId === '10'
          ? 'text-emerald-700 dark:text-emerald-400'
          : tributoId === '20'
            ? 'text-sky-700 dark:text-sky-400'
            : tributoId === '30'
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-purple-700 dark:text-purple-400'

        return (
          <div className="space-y-1.5 text-xs">
            {/* Categorías y Afectación al IGV */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[10px] font-bold tracking-tight uppercase shadow-2xs ${afectacionBadgeCls}`}
                title={`Afectación al IGV código ${tributoId}`}
              >
                {afectacionLabel}
              </span>
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

            {/* Badges de atributos operativos */}
            <div className="flex items-center gap-1 flex-wrap">
              {p.es_facturable && (
                <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
                  FE
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
              {p.codigo_sunat && (
                <span className="text-[10px] text-slate-500 font-mono">
                  SUNAT: {p.codigo_sunat}
                </span>
              )}
            </div>
          </div>
        )
      }
    }
  ], [expandedRows])

  return (
    <div className="space-y-6 p-6">
      {/* ── ENCABEZADO MODULAR GLOBAL ── */}
      <PageHeader
        title="Catálogo de Productos"
        actions={
          <>
            <RefreshButton
              onClick={fetchProductos}
              loading={loading}
              title="Actualizar catálogo de productos"
            />

            <Can I="ver" a="productos">
              <ExportExcelButton
                onClick={handleExport}
                disabled={loading || filtered.length === 0}
                label="Excel"
                title="Exportar catálogo de productos a Excel"
              />
            </Can>

            <Can I="crear" a="productos">
              <NewButton
                onClick={handleOpenNew}
                label="Nuevo Producto"
                title="Registrar nuevo producto y presentaciones"
              />
            </Can>
          </>
        }
      />

      {/* ── BARRA DE BÚSQUEDA Y FILTROS RÁPIDOS ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Selector de Estado: Activos, Inactivos, Todos */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
          {[
            { id: 'activos', label: 'Activos' },
            { id: 'inactivos', label: 'Dados de Baja' },
            { id: 'todos', label: 'Todos' }
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setEstadoFiltro(f.id)}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${estadoFiltro === f.id
                ? f.id === 'inactivos'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Input Buscador */}
        <div className="relative w-full sm:w-80">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, código o SKU..."
            value={busq}
            onChange={(e) => setBusq(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#01a59c] focus:bg-white dark:focus:bg-slate-900 outline-none text-xs dark:text-white transition-all"
          />
        </div>
      </div>

      {/* ── CONTENEDOR IN-PLACE CON TRANSICIÓN ANIMADA ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        {isModalOpen ? (
          <ProductoModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            producto={productoEdit}
            onSave={fetchProductos}
            variant="inline"
          />
        ) : kardexModalOpen ? (
          <StockKardexModal
            isOpen={kardexModalOpen}
            onClose={() => setKardexModalOpen(false)}
            itemSeleccionado={kardexProducto}
            onStockUpdated={fetchProductos}
            variant="inline"
          />
        ) : (
          <div className="transition-all duration-300 ease-in-out opacity-100 translate-y-0">
            {/* Tabla con TanStack Table */}
            <DataTable
              data={filtered}
              columns={columns}
              pagination={true}
              loading={loading}
              emptyMessage={
                estadoFiltro === 'inactivos'
                  ? 'No hay productos dados de baja en el catálogo.'
                  : 'No se encontraron productos registrados en esta sucursal.'
              }
            />
          </div>
        )}
      </div>

      {/* Modal Confirmación de Baja / Inactivación (Modal flotante contextual) */}
      <Modal
        isOpen={bajaModalOpen}
        onClose={() => {
          if (!isDeleting) {
            setBajaModalOpen(false)
            setProductoABajar(null)
          }
        }}
        title="Confirmar Baja de Producto"
        size="md"
        confirmText={isDeleting ? 'Inactivando...' : 'Sí, dar de baja'}
        cancelText="Cancelar"
        isProcessing={isDeleting}
        onConfirm={handleConfirmarBaja}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50">
            <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              <p className="font-bold">¿Está seguro de dar de baja este producto?</p>
              <p className="mt-1">
                El producto dejará de estar disponible para nuevas ventas en caja y catálogo activo, pero su historial de kárdex, stock y comprobantes pasados se preservarán intactos.
              </p>
            </div>
          </div>

          {productoABajar && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 font-mono">
              <div>
                <span className="text-slate-400 font-sans">Producto:</span>{' '}
                <strong className="text-slate-800 dark:text-white font-sans">{productoABajar.nombre}</strong>
              </div>
              {productoABajar.codigo && (
                <div>
                  <span className="text-slate-400 font-sans">Código:</span>{' '}
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{productoABajar.codigo}</span>
                </div>
              )}
              <div>
                <span className="text-slate-400 font-sans">Stock Base Actual:</span>{' '}
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {Number(productoABajar.stock_actual ?? productoABajar.stock ?? 0)} {productoABajar.unidad_medida_id || 'NIU'}
                </span>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
