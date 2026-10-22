import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  CubeIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArchiveBoxXMarkIcon,
  BuildingStorefrontIcon,
  PlusCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowPathRoundedSquareIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline'
import PageHeader from '../../../components/ui/PageHeader.jsx'
import { ExportExcelButton, RefreshButton } from '../../../components/ui/ActionButtons.jsx'
import Button from '../../../components/ui/Button.jsx'
import { DataTable } from '../../../components/ui/DataTable.jsx'
import Can from '../../../components/ui/Can.jsx'
import { usePermission } from '../../../hooks/usePermission.js'
import { stockController } from '../controllers/stock.js'
import StockKardexModal from '../components/StockKardexModal.jsx'
import StockReinicioModal from '../components/StockReinicioModal.jsx'
import StockCargaMasivaModal from '../components/StockCargaMasivaModal.jsx'
import { exportToExcel, formatCurrency } from '../../../utils/exportExcel.js'
import { toast } from '../../../utils/toast.js'

/**
 * Página Principal del Módulo de Control de Stock (`stock_actual`) y Kárdex (`stock`)
 * Agrupa primero por producto base y permite desglosar sus presentaciones y consultar
 * el Kárdex personal individual de cada presentación o a nivel general de producto.
 */
export default function Stock() {
  const { hasPermission } = usePermission()

  // Validaciones de permisos según DOCUMENTACION_SEGURIDAD.md
  const canViewKardex = hasPermission('kardexprod.ver') || hasPermission('stock.ver')
  const canAdjustStock =
    hasPermission('stock.crear') ||
    hasPermission('stock.editar') ||
    hasPermission('kardexprod.crear') ||
    hasPermission('kardexprod.editar')

  // Estado de datos
  const [items, setItems] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [almacenes, setAlmacenes] = useState([])
  const [resumen, setResumen] = useState({
    totalItems: 0,
    conStockPositivo: 0,
    sinStock: 0,
    conStockNegativo: 0,
    bajoStockMinimo: 0
  })
  const [loading, setLoading] = useState(false)

  // Filtros superiores
  const [almacenId, setAlmacenId] = useState('')
  const [estadoStock, setEstadoStock] = useState('todos') // 'todos' | 'negativo' | 'bajo_minimo' | 'sin_stock' | 'positivo'
  const [filtroActivo, setFiltroActivo] = useState('activos') // 'todos' | 'activos' | 'inactivos'

  // Estado de filas expandidas (desglose de presentaciones)
  const [expanded, setExpanded] = useState({})

  // Estado del Modal de Kárdex Personal
  const [selectedItem, setSelectedItem] = useState(null)
  const [isKardexOpen, setIsKardexOpen] = useState(false)

  // Estado del Modal / Panel Inline de Reinicio Masivo de Stock
  const [isResetOpen, setIsResetOpen] = useState(false)

  // Estado del Modal / Panel Inline de Carga Masiva de Stock
  const [isCargaMasivaOpen, setIsCargaMasivaOpen] = useState(false)

  // Cargar datos desde stock_actual a través de stockController
  const loadStock = useCallback(async () => {
    setLoading(true)
    const activoParam = filtroActivo === 'activos' ? true : filtroActivo === 'inactivos' ? false : undefined
    const res = await stockController.getStockActual({
      almacen_id: almacenId || undefined,
      estado_stock: estadoStock !== 'todos' ? estadoStock : undefined,
      activo: activoParam
    })

    if (res.success) {
      setItems(res.data)
      setAlmacenes(res.almacenes || [])
      setResumen(res.resumen)
    } else {
      toast.error('Error al cargar stock', res.message)
    }
    setLoading(false)
  }, [almacenId, estadoStock, filtroActivo])

  useEffect(() => {
    loadStock()
  }, [loadStock])

  // Agrupar filas recibidas por Producto
  const productosAgrupados = useMemo(() => {
    const map = new Map()

    for (const item of items) {
      const prodId = item.producto_id
      if (!map.has(prodId)) {
        map.set(prodId, {
          id: String(prodId),
          producto_id: prodId,
          codigo: item.codigo || '-',
          codigo_barra: item.codigo_barra || '',
          producto_nombre: item.producto_nombre,
          activo: item.activo !== false,
          es_combo: Boolean(item.es_combo),
          categoria_id: item.categoria_id,
          categoria_nombre: item.categoria_nombre || 'General',
          sub_categoria_nombre: item.sub_categoria_nombre || '',
          unidad_medida_id: item.unidad_medida_id || 'NIU',
          stock_minimo: Number(item.stock_minimo || 0),
          saldo_producto_total: Number(
            item.saldo_producto_total !== undefined
              ? item.saldo_producto_total
              : item.saldo_actual || 0
          ),
          almacen_nombre: item.almacen_nombre || 'ALMACÉN PRINCIPAL',
          almacen_id: item.almacen_id,
          updated_at: item.updated_at,
          presentaciones: []
        })
      }

      const prod = map.get(prodId)

      // Guardar presentación
      prod.presentaciones.push(item)

      // Conservar la fecha de actualización más reciente
      if (item.updated_at && (!prod.updated_at || new Date(item.updated_at) > new Date(prod.updated_at))) {
        prod.updated_at = item.updated_at
      }
    }

    return Array.from(map.values())
  }, [items])

  // Abrir Kárdex general para el producto completo
  const handleAbrirKardexProducto = useCallback((prod) => {
    if (!canViewKardex) {
      toast.error('Acceso restringido', 'No cuenta con el permiso para consultar el Kárdex del producto.')
      return
    }
    setSelectedItem({
      producto_id: prod.producto_id,
      codigo: prod.codigo,
      codigo_barra: prod.codigo_barra,
      producto_nombre: prod.producto_nombre,
      presentacion_id: '',
      presentacion_nombre: 'Todas las Presentaciones',
      unidad_medida_id: prod.unidad_medida_id,
      multiplica_por: 1,
      almacen_id: almacenId || prod.almacen_id,
      almacen_nombre: prod.almacen_nombre,
      saldo_actual: prod.saldo_producto_total,
      stock_minimo: prod.stock_minimo
    })
    setIsKardexOpen(true)
  }, [canViewKardex, almacenId])

  // Abrir Kárdex específico para una presentación seleccionada
  const handleAbrirKardexPresentacion = useCallback((pres, prod) => {
    if (!canViewKardex) {
      toast.error('Acceso restringido', 'No cuenta con el permiso para consultar el Kárdex de la presentación.')
      return
    }
    setSelectedItem({
      ...pres,
      producto_id: prod.producto_id,
      codigo: pres.codigo || prod.codigo,
      producto_nombre: prod.producto_nombre,
      presentacion_id: pres.presentacion_id,
      presentacion_nombre: pres.presentacion_nombre,
      unidad_medida_id: prod.unidad_medida_id,
      multiplica_por: pres.multiplica_por || 1,
      almacen_id: pres.almacen_id || almacenId || prod.almacen_id,
      almacen_nombre: pres.almacen_nombre || prod.almacen_nombre,
      saldo_actual: pres.saldo_actual,
      stock_minimo: prod.stock_minimo
    })
    setIsKardexOpen(true)
  }, [canViewKardex, almacenId])

  // Obtener todas las presentaciones del producto actualmente seleccionado en el modal
  const presentacionesDelProductoActivo = useMemo(() => {
    if (!selectedItem?.producto_id) return []
    return items.filter((i) => i.producto_id === selectedItem.producto_id)
  }, [items, selectedItem])

  // Control de expandir todos / colapsar todos
  const hasAnyExpanded = useMemo(() => {
    return Object.values(expanded).some(Boolean)
  }, [expanded])

  const handleToggleExpandAll = () => {
    if (hasAnyExpanded) {
      setExpanded({})
    } else {
      const all = {}
      productosAgrupados.forEach((_, idx) => {
        all[idx] = true
      })
      setExpanded(all)
    }
  }

  // Exportar listado de Stock a Excel (desglosado por presentación)
  const handleExportExcel = () => {
    const dataset = filteredProducts.length > 0 ? filteredProducts : productosAgrupados
    if (dataset.length === 0) {
      toast.info('Sin datos', 'No hay registros de stock para exportar.')
      return
    }

    const rows = []
    dataset.forEach((prod) => {
      const lista = prod.presentaciones?.length > 0 ? prod.presentaciones : [{
        codigo: prod.codigo,
        codigo_barra: prod.codigo_barra,
        producto_nombre: prod.producto_nombre,
        presentacion_nombre: 'UNIDAD',
        multiplica_por: 1,
        categoria_nombre: prod.categoria_nombre,
        almacen_nombre: prod.almacen_nombre,
        unidad_medida_id: prod.unidad_medida_id,
        precio_costo: 0,
        precio_venta: 0,
        stock_minimo: prod.stock_minimo,
        saldo_actual: prod.saldo_producto_total,
        updated_at: prod.updated_at
      }]

      lista.forEach((r) => {
        const saldo = Number(r.saldo_actual || 0)
        const min = Number(prod.stock_minimo || r.stock_minimo || 0)
        const estadoLabel =
          saldo < 0
            ? 'STOCK NEGATIVO'
            : saldo === 0
              ? 'SIN STOCK'
              : saldo <= min
                ? 'BAJO MÍNIMO'
                : 'NORMAL'

        rows.push({
          'Código': r.codigo || prod.codigo || '-',
          'Cód. Barras': r.codigo_barra || '-',
          'Producto': prod.producto_nombre,
          'Presentación': r.presentacion_nombre || 'UNIDAD',
          'Factor (Multiplica Por)': Number(r.multiplica_por || 1),
          'Categoría': prod.categoria_nombre || 'General',
          'Almacén': r.almacen_nombre || prod.almacen_nombre || 'ALMACÉN PRINCIPAL',
          'Unidad Medida': prod.unidad_medida_id || 'NIU',
          'Precio Costo (S/)': Number(r.precio_costo || 0).toFixed(2),
          'Precio Venta (S/)': Number(r.precio_venta || 0).toFixed(2),
          'Stock Mínimo': min,
          'Saldo en Presentación': saldo,
          'Stock Total Base Producto': Number(prod.saldo_producto_total || 0),
          'Estado Stock': estadoLabel,
          'Última Actualización': r.updated_at ? new Date(r.updated_at).toLocaleString('es-PE') : '-'
        })
      })
    })

    exportToExcel(rows, 'Reporte_Stock_Control_Kardex', 'StockActual')
  }

  // Abrir Modal / Panel Inline de Reinicio Masivo
  const handleAbrirReinicio = () => {
    setIsKardexOpen(false)
    setIsResetOpen(true)
  }

  // Columnas principales de la tabla de Productos
  const columns = useMemo(
    () => [
      // 1. Botón de Desglose / Expansor
      {
        id: 'expander',
        header: () => (
          <div className="flex items-center justify-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Desglose</span>
          </div>
        ),
        size: 90,
        enableColumnFilter: false,
        cell: ({ row }) => {
          const prod = row.original
          const cantPres = prod.presentaciones?.length || 0
          const isExpanded = row.getIsExpanded()

          return (
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={row.getToggleExpandedHandler()}
                className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${isExpanded
                  ? 'bg-[#01a59c] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                title={isExpanded ? 'Colapsar desglose' : 'Desglosar presentaciones'}
              >
                {isExpanded ? (
                  <ChevronDownIcon className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                )}
                <span className="text-[11px]">{cantPres}</span>
              </button>
            </div>
          )
        }
      },
      // 2. Kárdex General del Producto
      {
        id: 'acciones',
        header: 'Kárdex',
        size: 100,
        enableColumnFilter: false,
        cell: ({ row }) => {
          const prod = row.original
          return (
            <div className="flex items-center justify-center">
              {canViewKardex && (
                <button
                  type="button"
                  onClick={() => handleAbrirKardexProducto(prod)}
                  className="px-3 py-1.5 rounded-lg bg-[#01a59c] hover:bg-[#018e86] text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-all shadow-xs hover:shadow-md"
                  title="Ver Kárdex general consolidado de este producto"
                >
                  <ClipboardDocumentListIcon className="h-3.5 w-3.5" />
                  <span>Kárdex</span>
                </button>
              )}
            </div>
          )
        }
      },
      // 3. Código
      {
        accessorKey: 'codigo',
        header: 'Código',
        size: 95,
        cell: ({ row }) => (
          <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/70 px-2 py-0.5 rounded-md inline-block">
            {row.original.codigo || '-'}
          </span>
        )
      },
      // 4. Producto y Categoría
      {
        accessorKey: 'producto_nombre',
        header: 'Producto',
        size: 260,
        cell: ({ row }) => {
          const prod = row.original
          return (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate" title={prod.producto_nombre}>
                  {prod.producto_nombre}
                </span>
                {!prod.activo && (
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400 border border-rose-300 dark:border-rose-800 shrink-0">
                    Inactivo
                  </span>
                )}
              </div>
              {/* <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span>{prod.categoria_nombre || 'General'}</span>
                {prod.sub_categoria_nombre && <span>· {prod.sub_categoria_nombre}</span>}
                {prod.codigo_barra && <span className="font-mono">· SKU: {prod.codigo_barra}</span>}
              </div> */}
            </div>
          )
        }
      },
      // 5. Presentaciones Disponibles (resumen de etiquetas)
      {
        id: 'presentaciones_pills',
        header: 'Presentaciones',
        size: 200,
        enableColumnFilter: false,
        cell: ({ row }) => {
          const presentaciones = row.original.presentaciones || []
          if (presentaciones.length === 0) {
            return <span className="text-[11px] text-slate-400 italic">Base: UNIDAD</span>
          }

          return (
            <div
              onClick={row.getToggleExpandedHandler()}
              className="flex flex-wrap items-center gap-1 cursor-pointer"
              title="Clic para desglosar detalles de cada presentación"
            >
              {presentaciones.slice(0, 3).map((p) => (
                <span
                  key={p.presentacion_id || p.id}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-semibold border border-slate-200/80 dark:border-slate-700"
                >
                  <span className="uppercase">{p.presentacion_nombre}</span>
                  {/* <span className="text-teal-600 dark:text-teal-400 font-mono font-bold">x{p.multiplica_por || 1}</span> */}
                </span>
              ))}
              {presentaciones.length > 3 && (
                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">
                  +{presentaciones.length - 3} más
                </span>
              )}
            </div>
          )
        }
      },
      // 6. Almacén
      {
        accessorKey: 'almacen_nombre',
        header: 'Almacén',
        size: 150,
        cell: ({ row }) => (
          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            {row.original.almacen_nombre || 'ALMACÉN PRINCIPAL'}
          </span>
        )
      },
      // 7. Stock Mínimo
      {
        accessorKey: 'stock_minimo',
        header: 'Mínimo',
        size: 85,
        cell: ({ row }) => (
          <span className="block text-center font-mono text-xs text-slate-500 dark:text-slate-400">
            {Number(row.original.stock_minimo || 0)}
          </span>
        )
      },
      // 8. Saldo Total Base del Producto
      {
        accessorKey: 'saldo_producto_total',
        header: 'Stock Total',
        size: 130,
        cell: ({ row }) => {
          const prod = row.original
          const saldo = Number(prod.saldo_producto_total || 0)
          const min = Number(prod.stock_minimo || 0)

          const badgeCls =
            saldo < 0
              ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800'
              : saldo === 0
                ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                : saldo <= min
                  ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'

          return (
            <div className="flex justify-end">
              <span
                className={`px-2.5 py-1 rounded-lg border font-mono text-xs font-black transition-transform hover:scale-105 cursor-pointer ${badgeCls}`}
                title="Stock total base del producto."
              >
                {saldo} {prod.unidad_medida_id || 'NIU'}
              </span>
            </div>
          )
        }
      },
      // 9. Estado General del Stock
      {
        id: 'estado_stock',
        header: 'Estado',
        size: 130,
        enableColumnFilter: false,
        cell: ({ row }) => {
          const prod = row.original
          const saldo = Number(prod.saldo_producto_total || 0)
          const min = Number(prod.stock_minimo || 0)

          if (saldo < 0) {
            return (
              <div className="text-center">
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                  Stock Negativo
                </span>
              </div>
            )
          }

          if (saldo === 0) {
            return (
              <div className="text-center">
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  Sin Stock
                </span>
              </div>
            )
          }

          if (saldo <= min) {
            return (
              <div className="text-center">
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
                  Bajo Mínimo
                </span>
              </div>
            )
          }

          return (
            <div className="text-center">
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                Disponible
              </span>
            </div>
          )
        }
      },
      // 10. Última Actualización
      {
        accessorKey: 'updated_at',
        header: 'Última Act.',
        size: 135,
        enableColumnFilter: false,
        cell: ({ row }) => {
          const f = row.original.updated_at
          if (!f) return <span className="text-slate-400 text-xs block text-center">-</span>
          const d = new Date(f)
          return (
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 block text-center">
              {d.toLocaleDateString('es-PE')} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )
        }
      }
    ],
    [canViewKardex, handleAbrirKardexProducto]
  )

  // Resaltado de filas en stock negativo
  const getRowClassName = useCallback((rowData) => {
    if (Number(rowData.saldo_producto_total || 0) < 0) {
      return 'bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/60 dark:hover:bg-rose-950/40'
    }
    return ''
  }, [])

  // Desglose de Presentaciones para la Fila Expandida
  const renderExpandedRow = useCallback(
    ({ row }) => {
      const prod = row.original
      const presentaciones = prod.presentaciones || []

      return (
        <div className="p-2 sm:p-2 bg-gradient-to-b from-slate-100/90 to-slate-50/70 dark:from-slate-900 dark:to-slate-950/80 border-y-2 border-teal-500/30 dark:border-teal-500/20 shadow-inner space-y-3.5">
          {/* Cabecera del Desglose con identidad visual marcada */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg border border-teal-500 dark:border-teal-500 text-teal-500 dark:text-teal-500 shadow-xs">
                <CubeIcon className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    Desglose de Presentaciones
                  </span>
                  <span className="text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700/70 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-600">
                    {prod.producto_nombre}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Grid de Cards de Presentaciones con diferenciación visual absoluta */}
          {presentaciones.length === 0 ? (
            <div className="p-5 text-center text-slate-400 dark:text-slate-500 text-xs italic bg-white dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              Este producto no cuenta con presentaciones adicionales. Se maneja exclusivamente en su unidad base ({prod.unidad_medida_id}).
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-1">
              {presentaciones.map((pres) => {
                const saldoPres = Number(pres.saldo_actual || 0)
                const min = Number(prod.stock_minimo || 0)
                const isNeg = saldoPres < 0
                const isZero = saldoPres === 0
                const isLow = saldoPres > 0 && saldoPres <= min

                const statusBorder = isNeg
                  ? 'border-l-rose-500'
                  : isZero
                    ? 'border-l-slate-400'
                    : isLow
                      ? 'border-l-amber-500'
                      : 'border-l-emerald-500'

                const statusBadge = isNeg
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  : isZero
                    ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    : isLow
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'

                const statusLabel = isNeg
                  ? 'Negativo'
                  : isZero
                    ? 'Sin Stock'
                    : isLow
                      ? 'Bajo Mínimo'
                      : 'Disponible'

                return (
                  <div
                    key={pres.id || `${prod.producto_id}-${pres.presentacion_id}`}
                    className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200/90 dark:border-slate-700 p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all border-l-4 ${statusBorder}`}
                  >
                    <div>
                      {/* Top: Nombre de Presentación y Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-xs font-black uppercase text-slate-900 dark:text-white block truncate tracking-tight">
                            {pres.presentacion_nombre || 'UNIDAD'} - {pres.codigo_barra || 'Sin Cód.'}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 ${statusBadge}`}>
                          {statusLabel}
                        </span>
                      </div>

                      {/* Factor de conversión */}
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-lg text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold">
                        <span>Factor:</span>
                        <strong className="font-mono">x{pres.multiplica_por || 1} {pres.unidad_medida_id || prod.unidad_medida_id}</strong>
                      </div>

                      {/* Precios: Costo y Venta */}
                      {/* <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 border border-slate-300 dark:border-slate-700/60 rounded-lg">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">P. Costo</span>
                          <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {formatCurrency(Number(pres.precio_costo || 0))}
                          </span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 border border-slate-300 dark:border-slate-700/60 rounded-lg">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">P. Venta</span>
                          <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                            {formatCurrency(Number(pres.precio_venta || 0))}
                          </span>
                        </div>
                      </div> */}
                    </div>

                    {/* Stock y Botón Kárdex */}
                    <div className="mt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Stock Disponible</span>
                        <span className={`font-mono text-sm font-black ${isNeg
                          ? 'text-rose-600 dark:text-rose-400'
                          : isZero
                            ? 'text-slate-400'
                            : isLow
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                          {saldoPres} <span className="text-[10px] font-sans font-bold uppercase">{pres.presentacion_nombre}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )
    },
    [canViewKardex, handleAbrirKardexPresentacion, handleAbrirKardexProducto]
  )

  return (
    <div className="space-y-4">
      {/* ── ENCABEZADO PRINCIPAL ── */}
      <PageHeader
        title="Control de Stock y Kárdex"
        actions={
          <>
            <RefreshButton onClick={loadStock} loading={loading} title="Actualizar stock actual" />
            <Can I="ver" a="stock">
              <ExportExcelButton
                onClick={handleExportExcel}
                disabled={loading || productosAgrupados.length === 0}
                label="Descargar Excel"
                title="Exportar reporte de Stock y Kárdex a Excel"
              />
            </Can>
            {canAdjustStock && (
              <>
                <Button
                  variant="secondary"
                  size="md"
                  icon={ArrowUpTrayIcon}
                  onClick={() => setIsCargaMasivaOpen(true)}
                  disabled={loading}
                  title="Carga o ajuste masivo de stock para presentaciones principales"
                >
                  Ingreso Masivo
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  icon={ArrowPathRoundedSquareIcon}
                  onClick={handleAbrirReinicio}
                  disabled={loading}
                  title="Poner en 0 el stock actual y generar ajuste en kardex"
                >
                  Reiniciar Stock
                </Button>
              </>
            )}
          </>
        }
      />

      {/* ── TARJETAS DE RESUMEN DE INVENTARIO ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          onClick={() => setEstadoStock('todos')}
          className={`p-3.5 bg-white dark:bg-slate-900 rounded-xl border shadow-xs flex items-center gap-3 cursor-pointer transition-all ${estadoStock === 'todos'
            ? 'border-[#01a59c] ring-1 ring-[#01a59c]/40'
            : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
            }`}
        >
          <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-[#01a59c]">
            <CubeIcon className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Productos
            </span>
            <p className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {productosAgrupados.length}{' '}
            </p>
          </div>
        </div>
        <div
          onClick={() => setEstadoStock('negativo')}
          className={`p-3.5 bg-white dark:bg-slate-900 rounded-xl border shadow-xs flex items-center gap-3 cursor-pointer transition-all ${estadoStock === 'negativo'
            ? 'border-rose-500 ring-1 ring-rose-500/40'
            : 'border-slate-200/80 dark:border-slate-800 hover:border-rose-300'
            }`}
        >
          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
            <ExclamationTriangleIcon className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              En Stock Negativo
            </span>
            <p className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">
              {resumen.conStockNegativo}
            </p>
          </div>
        </div>
        <div
          onClick={() => setEstadoStock('sin_stock')}
          className={`p-3.5 bg-white dark:bg-slate-900 rounded-xl border shadow-xs flex items-center gap-3 cursor-pointer transition-all ${estadoStock === 'sin_stock'
            ? 'border-amber-500 ring-1 ring-amber-500/40'
            : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
            }`}
        >
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <ArchiveBoxXMarkIcon className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Sin Stock (= 0) / Bajo Mín.
            </span>
            <p className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">
              {resumen.sinStock} <span className="text-xs font-normal text-slate-400">({resumen.bajoStockMinimo} bajo mín.)</span>
            </p>
          </div>
        </div>
        <div
          onClick={() => setEstadoStock('positivo')}
          className={`p-3.5 bg-white dark:bg-slate-900 rounded-xl border shadow-xs flex items-center gap-3 cursor-pointer transition-all ${estadoStock === 'positivo'
            ? 'border-emerald-500 ring-1 ring-emerald-500/40'
            : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
            }`}
        >
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <CheckCircleIcon className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Con Stock Positivo
            </span>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {resumen.conStockPositivo}
            </p>
          </div>
        </div>
      </div>

      {/* ── FILTROS RÁPIDOS DE ESTADO, DESGLOSE Y ALMACÉN ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'negativo', label: `Stock Negativo (${resumen.conStockNegativo})` },
            { id: 'bajo_minimo', label: `Bajo Mínimo (${resumen.bajoStockMinimo})` },
            { id: 'sin_stock', label: `Sin Stock (${resumen.sinStock})` },
            { id: 'positivo', label: `Disponible (${resumen.conStockPositivo})` }
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setEstadoStock(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${estadoStock === f.id
                ? f.id === 'negativo'
                  ? 'bg-rose-600 text-white'
                  : 'bg-[#01a59c] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Acciones de Desglose, Filtro de Activo/Inactivo y Selector de Almacén */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Activos / Inactivos */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            {[
              { id: 'activos', label: 'Activos' },
              { id: 'inactivos', label: 'Inactivos' },
              { id: 'todos', label: 'Todos' }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltroActivo(f.id)}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${filtroActivo === f.id
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

          {/* Botón para expandir o colapsar todos */}
          <button
            type="button"
            onClick={handleToggleExpandAll}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title={hasAnyExpanded ? 'Colapsar todas las presentaciones' : 'Desglosar todas las presentaciones'}
          >
            {hasAnyExpanded ? (
              <>
                <ChevronDownIcon className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>Colapsar Todos</span>
              </>
            ) : (
              <>
                <ChevronRightIcon className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>Desglosar Todos</span>
              </>
            )}
          </button>

          {/* Selector de Almacén */}
          <div className="flex items-center gap-2">
            <BuildingStorefrontIcon className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Almacén:</span>
            <select
              value={almacenId}
              onChange={(e) => setAlmacenId(e.target.value)}
              className="text-xs font-semibold py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-[#01a59c]"
            >
              <option value="">Todos los almacenes de la sede</option>
              {almacenes.map((alm) => (
                <option key={alm.id} value={alm.id}>
                  {alm.nombre} {alm.es_principal ? '(Principal)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── PANEL IN-PLACE CON TRANSICIÓN ANIMADA O TABLA PRINCIPAL ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        {isKardexOpen ? (
          <StockKardexModal
            isOpen={isKardexOpen}
            onClose={() => setIsKardexOpen(false)}
            itemSeleccionado={selectedItem}
            presentacionesProducto={presentacionesDelProductoActivo}
            almacenes={almacenes}
            onStockUpdated={loadStock}
            variant="inline"
          />
        ) : isResetOpen ? (
          <StockReinicioModal
            isOpen={isResetOpen}
            onClose={() => setIsResetOpen(false)}
            almacenes={almacenes}
            almacenInicial={almacenId}
            variant="inline"
            onReinicioCompletado={loadStock}
          />
        ) : isCargaMasivaOpen ? (
          <StockCargaMasivaModal
            isOpen={isCargaMasivaOpen}
            onClose={() => setIsCargaMasivaOpen(false)}
            productosAgrupados={productosAgrupados}
            almacenes={almacenes}
            almacenInicial={almacenId}
            variant="inline"
            onCargaCompletada={loadStock}
          />
        ) : (
          <div className="transition-all duration-300 ease-in-out opacity-100 translate-y-0">
            {/* ── TABLA PRINCIPAL AGRUPADA POR PRODUCTO CON DESGLOSE DE PRESENTACIONES ── */}
            <DataTable
              data={productosAgrupados}
              columns={columns}
              pagination={true}
              getRowClassName={getRowClassName}
              onFilteredData={setFilteredProducts}
              renderExpandedRow={renderExpandedRow}
              expanded={expanded}
              onExpandedChange={setExpanded}
            />
          </div>
        )}
      </div>
    </div>
  )
}
