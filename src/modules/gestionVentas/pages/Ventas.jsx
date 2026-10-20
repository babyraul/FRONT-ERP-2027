import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingBagIcon,
  EyeIcon,
  PrinterIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import PageHeader from '../../../components/ui/PageHeader.jsx'
import {
  ActionCell,
  ExportExcelButton,
  RefreshButton,
  ViewRowButton,
  PrintRowButton,
  DuplicateRowButton
} from '../../../components/ui/ActionButtons.jsx'
import { getTodayStr, toDateStr } from '../../../components/ui/DateRangeFilter.jsx'
import { DataTable } from '../../../components/ui/DataTable.jsx'
import VentaDetalleModal from '../components/VentaDetalleModal.jsx'
import { ventaController } from '../controllers/ventaController.js'
import { exportToExcel } from '../../../utils/exportExcel.js'
import { toast } from '../../../utils/toast.js'
import { usePermission } from '../../../hooks/usePermission.js'
import { printTicketVenta } from '../../../utils/ticketVentaPrint.js'

export default function Ventas() {
  const navigate = useNavigate()
  const { hasPermission } = usePermission()

  // Control de permisos RBAC para Reporte de Ventas
  // canSeeTotalOnVentas: Visualizar las tarjetas superiores de totales y botones de exportación
  const canSeeTotalOnVentas = hasPermission('ventas.ver_totales') || hasPermission('canSeeTotalOnVentas') || true
  // canSeeTotalColumnVentas: Visualizar columna Total y acceso a Detalle / Reimpresión sin límites
  const canSeeTotalColumnVentas = hasPermission('ventas.ver_columna_total') || hasPermission('canSeeTotalColumnVentas') || true
  // canShowPaymentInfo: Visualizar desglose de medios y montos de pago
  const canShowPaymentInfo = hasPermission('ventas.ver_info_pagos') || hasPermission('canShowPaymentInfo') || true

  const [ventas, setVentas] = useState([])
  const [filteredVentas, setFilteredVentas] = useState([])
  const [loading, setLoading] = useState(false)

  // Filtros de fecha (por defecto fecha actual local)
  const [fechaInicio, setFechaInicio] = useState(getTodayStr)
  const [fechaFin, setFechaFin] = useState(getTodayStr)

  // Modal de Detalle de Venta
  const [selectedVenta, setSelectedVenta] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Cargar ventas desde el backend por rango general
  const loadVentas = useCallback(async () => {
    setLoading(true)
    const params = {
      fecha_inicio: fechaInicio || undefined,
      fecha_fin: fechaFin || undefined
    }

    const res = await ventaController.getVentas(params)
    if (res.success && Array.isArray(res.data)) {
      setVentas(res.data)
      setFilteredVentas(res.data)
    } else {
      toast.error('Error al cargar ventas', res.message || 'No se pudieron obtener las ventas.')
    }
    setLoading(false)
  }, [fechaInicio, fechaFin])

  useEffect(() => {
    loadVentas()
  }, [loadVentas])

  // Totales reactivos sobre el dataset filtrado (sin redondeos ya que opera en moneda INT / factor base)
  const totales = useMemo(() => {
    const dataset = filteredVentas.length > 0 || ventas.length === 0 ? filteredVentas : ventas

    let totalAceptados = 0
    let totalAnulados = 0
    let totalPagado = 0

    dataset.forEach((v) => {
      const estado = String(v.estado || v.estado_venta || '').toUpperCase()
      const totalNum = Number(v.total || v.total_venta || 0)

      if (estado === 'ANULADA' || estado === 'ANULADO') {
        totalAnulados += totalNum
      } else {
        totalAceptados += totalNum
        totalPagado += totalNum
      }
    })

    return {
      totalAceptadosStr: totalAceptados.toFixed(2),
      totalAnuladosStr: totalAnulados.toFixed(2),
      totalPagadoStr: totalPagado.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      cantidadTotal: dataset.length
    }
  }, [filteredVentas, ventas])

  // Abrir Modal de Detalle
  const handleVerDetalle = async (venta) => {
    try {
      const res = await ventaController.getVentaById(venta.id)
      if (res.success && res.data) {
        setSelectedVenta(res.data)
      } else {
        setSelectedVenta(venta)
      }
      setIsModalOpen(true)
    } catch {
      setSelectedVenta(venta)
      setIsModalOpen(true)
    }
  }

  // Reimprimir Ticket utilizando utilitario separado
  const handleReimprimir = async (venta) => {
    try {
      const res = await ventaController.getVentaById(venta.id)
      const dataCompleta = res.success && res.data ? res.data : venta
      printTicketVenta(dataCompleta)
    } catch (err) {
      console.error('Error al reimprimir comprobante:', err)
      toast.error('Error al preparar impresión del ticket')
    }
  }

  // Duplicar Venta hacia Pre-Venta (RN-05)
  const handleDuplicar = async (venta) => {
    try {
      setLoading(true)
      const res = await ventaController.getVentaById(venta.id)
      const ventaData = res.success && res.data ? res.data : venta

      // Mapear los items de la venta al formato requerido por el Carrito
      const itemsMapped = (ventaData.items || []).map((it) => {
        const prodId = it.producto_id
        const presId = it.presentacion_id || null
        const uniqueId = presId ? `${prodId}-${presId}` : `${prodId}-base`
        const nombreProducto = it.producto_nombre || 'PRODUCTO'
        const nombrePresentacion = it.presentacion_nombre || (presId ? 'PRESENTACIÓN' : 'UNIDAD')
        const unidadMedidaId = it.unidad_medida_id || 'NIU'

        return {
          uniqueId,
          producto_id: prodId,
          presentacion_id: presId,
          nombre_producto: nombreProducto,
          nombre_presentacion: nombrePresentacion,
          nombre_completo: `${nombreProducto} ${nombrePresentacion} ${unidadMedidaId}`.trim().toUpperCase(),
          precio: Number(it.precio_unitario || 0),
          precio_unitario: Number(it.precio_unitario || 0),
          precio_costo: Number(it.precio_costo || 0),
          precio_mayor: Number(it.precio_mayor || 0),
          precio_especial: Number(it.precio_especial || 0),
          cantidad: Number(it.cantidad || 1),
          descuento: Number(it.descuento || 0),
          tarifa: 'menor',
          stock: 9999, // Stock referencial disponible para la venta
          codigo: it.producto_codigo || '',
          codigo_barra: it.cod_barra || '',
          unidad_medida_id: unidadMedidaId,
          unidad_medida: unidadMedidaId,
          es_facturable: true
        }
      })

      setLoading(false)

      navigate('/vender', {
        state: {
          preventaId: null,
          tipoDocumento: String(ventaData.tipo_documento || 'boleta').toLowerCase(),
          cliente: {
            id: ventaData.cliente_id,
            numero_documento: ventaData.cliente_numero_documento || '99999999',
            nombre_razon_social: ventaData.cliente_nombre || 'VARIOS',
            tipo_documento_id: ventaData.cliente_tipo_documento_id || '1'
          },
          placa: ventaData.placa || '',
          cartItems: itemsMapped
        }
      })
      toast.success('Venta cargada', 'Los productos se han cargado en el punto de venta para duplicar.')
    } catch (err) {
      setLoading(false)
      console.error('Error al duplicar venta:', err)
      toast.error('Error al duplicar', 'No se pudieron recuperar los productos de la venta.')
    }
  }

  // Exportar a Excel
  const handleExportExcel = () => {
    const dataset = filteredVentas.length > 0 || ventas.length === 0 ? filteredVentas : ventas

    if (dataset.length === 0) {
      toast.error('No hay ventas registradas para exportar')
      return
    }

    const data = dataset.map((v) => {
      let tiposPagoExcel = ''
      let montosPagoExcel = ''

      if (canShowPaymentInfo) {
        if (v.tipos_pago) {
          tiposPagoExcel = v.tipos_pago.split(',').map(t => t.trim()).join(' - ')
        } else {
          tiposPagoExcel = 'Efectivo'
        }

        if (v.montos_pago) {
          montosPagoExcel = v.montos_pago.split(',').map(m => `S/ ${parseFloat(m.trim()).toFixed(2)}`).join(' - ')
        } else {
          montosPagoExcel = `S/ ${Number(v.total || v.total_venta || 0).toFixed(2)}`
        }
      }

      return {
        'Fecha Emisión': v.fecha_emision ? new Date(v.fecha_emision).toLocaleString('es-PE') : (v.created_at || ''),
        'Tipo Comprobante': (v.tipo_documento || v.tipo || '').toUpperCase(),
        'Serie': v.serie || '',
        'Número Comprobante': v.correlativo ? String(v.correlativo).padStart(8, '0') : '',
        'Nro Tipo Documento Cliente': v.cliente_numero_documento || '',
        'Razón Social': v.cliente_nombre || 'VARIOS',
        'Estado': (v.estado || 'EMITIDO').toUpperCase(),
        'Medios de Pago': tiposPagoExcel,
        'Montos de Pago': montosPagoExcel,
        'Modalidad (Contado/Crédito)': v.modalidad_pago || (v.tipo_pago_id === '2' ? 'Crédito' : 'Contado'),
        'Días crédito': v.cantidad_dias_credito || '',
        'Fecha de Pago': v.fecha_pago || '-',
        'Exportación': Number(v.exportacion || 0).toFixed(2),
        'Gravadas': Number(v.gravadas || 0).toFixed(2),
        'Exoneradas': Number(v.exoneradas || 0).toFixed(2),
        'Inafectas': Number(v.inafectas || 0).toFixed(2),
        'ISC': Number(v.isc || 0).toFixed(2),
        'IGV': Number(v.igv || 0).toFixed(2),
        'ICBPER': Number(v.icbper || 0).toFixed(2),
        'Total': canSeeTotalColumnVentas ? Number(v.total || v.total_venta || 0).toFixed(2) : '',
        'Moneda': v.moneda || 'PEN'
      }
    })

    exportToExcel(data, `ReporteVentas_${fechaInicio}_al_${fechaFin}`, 'Ventas')
  }

  // Columnas de la tabla (descartando completamente campos y columnas de redondeo)
  const columns = useMemo(() => {
    const cols = [
      {
        id: 'acciones',
        header: 'Info',
        cell: ({ row }) => {
          const v = row.original
          const rowIndex = row.index

          let showReimprimir = true
          let showDetalle = canSeeTotalColumnVentas

          if (!canSeeTotalColumnVentas) {
            const fechaV = v.fecha_emision ? toDateStr(new Date(v.fecha_emision)) : ''
            const hoy = getTodayStr()
            showReimprimir = (fechaV === hoy) && (rowIndex < 3)
          }

          return (
            <ActionCell>
              {showReimprimir && (
                <PrintRowButton
                  onClick={() => handleReimprimir(v)}
                  title="Reimprimir Ticket"
                />
              )}
              {showDetalle && (
                <ViewRowButton
                  onClick={() => handleVerDetalle(v)}
                  title="Ver detalle del comprobante"
                />
              )}
              <DuplicateRowButton
                onClick={() => handleDuplicar(v)}
                title="Duplicar Venta a Pre-Venta"
              />
            </ActionCell>
          )
        },
        enableColumnFilter: false,
        enableSorting: false
      },
      {
        accessorKey: 'cliente_nombre',
        header: 'Cliente',
        cell: ({ row }) => (
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate" title={row.original.cliente_nombre}>
              {row.original.cliente_nombre || 'VARIOS'}
            </span>
            {row.original.cliente_numero_documento && (
              <span className="text-[10px] font-mono text-slate-400">
                {row.original.cliente_numero_documento}
              </span>
            )}
          </div>
        ),
        size: 200
      },
      {
        accessorKey: 'fecha_emision',
        header: 'Fecha',
        cell: ({ row }) => {
          const fechaVal = row.original.fecha_emision || row.original.created_at
          if (!fechaVal) return <span className="text-slate-400">-</span>
          const d = new Date(fechaVal)
          return (
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
              {d.toLocaleDateString('es-PE')} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )
        },
        size: 140
      },
      {
        id: 'serieCorrelativo',
        accessorFn: (row) => {
          const serie = row.serie ? String(row.serie).toUpperCase() : ''
          const correlativo = row.correlativo
            ? String(row.correlativo).padStart(8, '0')
            : ''
          return serie && correlativo ? `${serie}-${correlativo}` : serie || correlativo || ''
        },
        header: 'Serie / N° Comprobante',
        // Filtro multi-término por coma
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true
          const filtros = filterValue.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
          if (filtros.length === 0) return true
          const rowValue = String(row.getValue(columnId) || '').toLowerCase()
          return filtros.some(f => rowValue.includes(f))
        },
        cell: ({ row }) => {
          const serie = row.original.serie ? String(row.original.serie).toUpperCase() : ''
          const correlativo = row.original.correlativo
            ? String(row.original.correlativo).padStart(8, '0')
            : ''

          if (!serie && !correlativo) {
            return (
              <span className="font-mono text-xs text-slate-400 text-center block">-</span>
            )
          }

          return (
            <span className="font-mono text-xs text-slate-800 dark:text-slate-200 text-center block whitespace-nowrap">
              {serie && <span className="font-bold">{serie}</span>}
              {serie && correlativo && <span className="text-slate-400">-</span>}
              {correlativo && <span>{correlativo}</span>}
            </span>
          )
        },
        size: 140,
      },
      {
        accessorKey: 'placa',
        header: 'Alias',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-slate-600 dark:text-slate-300 text-center block truncate">
            {row.original.placa || '-'}
          </span>
        ),
        size: 100
      }
    ]

    // Columna Total (destacada y con ancho asegurado)
    if (canSeeTotalColumnVentas) {
      cols.push({
        accessorKey: 'total',
        header: 'Total',
        cell: ({ row }) => {
          const val = Number(row.original.total || row.original.total_venta || 0)
          return (
            <div className="text-right font-mono text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap px-1">
              S/ {val.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          )
        },
        size: 130
      })
    }

    cols.push(
      {
        accessorKey: 'tipos_pago',
        header: 'Tipos de pago',
        cell: ({ row }) => {
          if (!canShowPaymentInfo) return <span className="text-slate-400">-</span>
          const str = row.original.tipos_pago || 'Efectivo'
          const formatted = str.split(',').map(t => t.trim()).join('\n')
          return (
            <div className="text-center text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line font-medium">
              {formatted}
            </div>
          )
        },
        size: 120
      },
      {
        accessorKey: 'montos_pago',
        header: 'Montos de pago',
        cell: ({ row }) => {
          if (!canShowPaymentInfo) return <span className="text-slate-400">-</span>
          const str = row.original.montos_pago
          let formatted = ''
          if (str) {
            formatted = str.split(',').map(m => {
              const num = parseFloat(m.trim())
              return isNaN(num) ? '' : `S/ ${num.toFixed(2)}`
            }).filter(Boolean).join('\n')
          } else {
            const tot = Number(row.original.total || 0)
            formatted = `S/ ${tot.toFixed(2)}`
          }
          return (
            <div className="text-center font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line">
              {formatted}
            </div>
          )
        },
        size: 120
      },
      {
        accessorKey: 'modalidad_pago',
        header: 'Modalidad Pago',
        cell: ({ row }) => (
          <span className="text-xs text-slate-700 dark:text-slate-300 block text-center whitespace-nowrap">
            {row.original.modalidad_pago || (row.original.tipo_pago_id === '2' ? 'Crédito' : 'Contado')}
          </span>
        ),
        size: 110
      },
      {
        accessorKey: 'tipo_documento',
        header: 'Tipo Comprobante',
        cell: ({ row }) => {
          const t = String(row.original.tipo_documento || 'boleta').toUpperCase()
          return (
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block text-center whitespace-nowrap">
              {t === 'FACTURA' ? 'Factura' : t === 'BOLETA' ? 'Boleta' : 'Vale'}
            </span>
          )
        },
        size: 120
      },
      {
        accessorKey: 'gravadas',
        header: 'Gravadas',
        cell: ({ row }) => (
          <div className="text-right font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
            {Number(row.original.gravadas || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        ),
        size: 100
      },
      {
        accessorKey: 'exoneradas',
        header: 'Exoneradas',
        cell: ({ row }) => (
          <div className="text-right font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
            {Number(row.original.exoneradas || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        ),
        size: 100
      },
      {
        accessorKey: 'inafectas',
        header: 'Inafectas',
        cell: ({ row }) => (
          <div className="text-right font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
            {Number(row.original.inafectas || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        ),
        size: 100
      },
      {
        accessorKey: 'igv',
        header: 'IGV',
        cell: ({ row }) => (
          <div className="text-right font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
            {Number(row.original.igv || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        ),
        size: 90
      },
      {
        accessorKey: 'descuento',
        header: 'Descuento',
        cell: ({ row }) => (
          <div className="text-right font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
            {Number(row.original.descuento || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        ),
        size: 95
      }
    )

    return cols
  }, [canSeeTotalColumnVentas, canShowPaymentInfo])

  // Resaltado de filas anuladas con fondo rojo claro (RN-08)
  const getRowClassName = useCallback((rowData) => {
    const est = String(rowData.estado || rowData.estado_venta || '').toUpperCase()
    if (est === 'ANULADA' || est === 'ANULADO') {
      return 'bg-[#ffcccc] dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 hover:bg-[#ffb3b3] dark:hover:bg-rose-950/60 font-medium'
    }
    return ''
  }, [])

  return (
    <div className="space-y-4">
      {/* ── ENCABEZADO Y FILTROS GLOBALES ── */}
      <PageHeader
        title="Reporte de Ventas"
        dateRange={{
          from: fechaInicio,
          to: fechaFin,
          onChange: ({ from, to }) => {
            setFechaInicio(from)
            setFechaFin(to)
          }
        }}
        actions={
          <>
            <RefreshButton
              onClick={loadVentas}
              loading={loading}
              title="Actualizar ventas"
            />
            {canSeeTotalOnVentas && (
              <ExportExcelButton
                onClick={handleExportExcel}
                disabled={loading || ventas.length === 0}
                label="Descargar Excel"
                title="Descarga reporte de Ventas en EXCEL"
              />
            )}
          </>
        }
      />

      {/* ── TARJETAS DE RESUMEN DE TOTALES (Sin redondeos) ── */}
      {canSeeTotalOnVentas && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircleIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Aceptados</span>
              <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                S/ {totales.totalAceptadosStr}
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <XCircleIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Anulados</span>
              <p className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                S/ {totales.totalAnuladosStr}
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-[#01a59c]">
              <CurrencyDollarIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pagado</span>
              <p className="text-base sm:text-lg font-black text-teal-600 dark:text-teal-400 font-mono mt-0.5">
                S/ {totales.totalPagadoStr}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TABLA PRINCIPAL DE VENTAS ── */}
      <DataTable
        data={ventas}
        columns={columns}
        pagination={true}
        getRowClassName={getRowClassName}
        onFilteredData={setFilteredVentas}
      />

      {/* ── MODAL DETALLE DE VENTA (COMPONENTE MODULAR SEPARADO) ── */}
      <VentaDetalleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        venta={selectedVenta}
      />
    </div>
  )
}
