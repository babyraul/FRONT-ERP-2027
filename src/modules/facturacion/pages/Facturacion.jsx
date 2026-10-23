import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  ClockIcon
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
import VentaDetalleModal from '../../gestionVentas/components/VentaDetalleModal.jsx'
import { ventaController } from '../../gestionVentas/controllers/ventaController.js'
import { exportToExcel } from '../../../utils/exportExcel.js'
import { toast } from '../../../utils/toast.js'
import { usePermission } from '../../../hooks/usePermission.js'
import { printTicketVenta } from '../../../utils/ticketVentaPrint.js'

export default function Facturacion() {
  const navigate = useNavigate()
  const { hasPermission } = usePermission()

  // Control de permisos RBAC para Facturación Electrónica
  const canSeeTotalOnVentas = hasPermission('facturacion.ver_totales') || hasPermission('ventas.ver_totales') || true
  const canSeeTotalColumnVentas = hasPermission('facturacion.ver_columna_total') || hasPermission('ventas.ver_columna_total') || true
  const canShowPaymentInfo = hasPermission('facturacion.ver_info_pagos') || hasPermission('ventas.ver_info_pagos') || true

  const [documentos, setDocumentos] = useState([])
  const [filteredDocumentos, setFilteredDocumentos] = useState([])
  const [loading, setLoading] = useState(false)

  // Filtros de fecha (por defecto fecha actual local)
  const [fechaInicio, setFechaInicio] = useState(getTodayStr)
  const [fechaFin, setFechaFin] = useState(getTodayStr)

  // Modal de Detalle
  const [selectedVenta, setSelectedVenta] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Cargar comprobantes electrónicos (Facturas y Boletas)
  const loadDocumentos = useCallback(async () => {
    setLoading(true)
    const params = {
      fecha_inicio: fechaInicio || undefined,
      fecha_fin: fechaFin || undefined
    }

    const res = await ventaController.getVentas(params)
    if (res.success && Array.isArray(res.data)) {
      // Filtrar únicamente comprobantes electrónicos de venta (Facturas '01' y Boletas '03')
      const electronicos = res.data.filter((v) => {
        const tipoComp = String(v.tipo_comprobante_id || '')
        const tipoDoc = String(v.tipo_documento || '').toLowerCase()
        return (
          tipoComp === '01' ||
          tipoComp === '03' ||
          tipoDoc === 'factura' ||
          tipoDoc === 'boleta'
        )
      })
      setDocumentos(electronicos)
      setFilteredDocumentos(electronicos)
    } else {
      toast.error('Error al cargar comprobantes', res.message || 'No se pudieron obtener los comprobantes de facturación.')
    }
    setLoading(false)
  }, [fechaInicio, fechaFin])

  useEffect(() => {
    loadDocumentos()
  }, [loadDocumentos])

  // Métricas y totales de comprobantes electrónicos
  const resumen = useMemo(() => {
    const dataset = filteredDocumentos.length > 0 || documentos.length === 0 ? filteredDocumentos : documentos

    let totalAceptados = 0
    let totalAnulados = 0
    let totalMonto = 0
    let cantidadFacturas = 0
    let cantidadBoletas = 0

    dataset.forEach((v) => {
      const estado = String(v.estado || v.estado_venta || '').toUpperCase()
      const totalNum = Number(v.total || v.total_venta || 0)
      const tipo = String(v.tipo_documento || '').toLowerCase()

      if (tipo === 'factura' || v.tipo_comprobante_id === '01') {
        cantidadFacturas++
      } else {
        cantidadBoletas++
      }

      if (estado === 'ANULADA' || estado === 'ANULADO') {
        totalAnulados += totalNum
      } else {
        totalAceptados += totalNum
        totalMonto += totalNum
      }
    })

    return {
      totalAceptadosStr: totalAceptados.toFixed(2),
      totalAnuladosStr: totalAnulados.toFixed(2),
      totalMontoStr: totalMonto.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      cantidadTotal: dataset.length,
      cantidadFacturas,
      cantidadBoletas
    }
  }, [filteredDocumentos, documentos])

  // Ver Detalle
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

  // Reimprimir Ticket / Comprobante
  const handleReimprimir = async (venta) => {
    try {
      const res = await ventaController.getVentaById(venta.id)
      const dataCompleta = res.success && res.data ? res.data : venta
      printTicketVenta(dataCompleta)
    } catch (err) {
      console.error('Error al reimprimir comprobante:', err)
      toast.error('Error al preparar impresión del comprobante')
    }
  }

  // Duplicar comprobante hacia el punto de venta
  const handleDuplicar = async (venta) => {
    try {
      setLoading(true)
      const res = await ventaController.getVentaById(venta.id)
      const ventaData = res.success && res.data ? res.data : venta

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
          stock: 9999,
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
      toast.success('Comprobante cargado', 'Los productos se han cargado en el punto de venta para duplicar.')
    } catch (err) {
      setLoading(false)
      console.error('Error al duplicar comprobante:', err)
      toast.error('Error al duplicar', 'No se pudieron recuperar los productos del comprobante.')
    }
  }

  // Exportar a Excel
  const handleExportExcel = () => {
    const dataset = filteredDocumentos.length > 0 || documentos.length === 0 ? filteredDocumentos : documentos

    if (dataset.length === 0) {
      toast.error('No hay comprobantes electrónicos para exportar')
      return
    }

    const data = dataset.map((v) => {
      let tiposPagoExcel = ''
      let montosPagoExcel = ''

      if (canShowPaymentInfo) {
        if (v.tipos_pago) {
          tiposPagoExcel = v.tipos_pago.split(',').map((t) => t.trim()).join(' - ')
        } else {
          tiposPagoExcel = 'Efectivo'
        }

        if (v.montos_pago) {
          montosPagoExcel = v.montos_pago.split(',').map((m) => `S/ ${parseFloat(m.trim()).toFixed(2)}`).join(' - ')
        } else {
          montosPagoExcel = `S/ ${Number(v.total || v.total_venta || 0).toFixed(2)}`
        }
      }

      return {
        'Fecha Emisión': v.fecha_emision ? new Date(v.fecha_emision).toLocaleString('es-PE') : (v.created_at || ''),
        'Tipo Comprobante': (v.tipo_documento || v.tipo || '').toUpperCase(),
        'Serie': v.serie || '',
        'Número': v.correlativo ? String(v.correlativo).padStart(8, '0') : '',
        'Doc. Cliente': v.cliente_numero_documento || '',
        'Razón Social / Cliente': v.cliente_nombre || 'VARIOS',
        'Estado': (v.estado || 'EMITIDO').toUpperCase(),
        'Estado SUNAT': v.observacion_sunat || (v.facturado ? 'ACEPTADO' : 'PENDIENTE'),
        'Medios de Pago': tiposPagoExcel,
        'Montos de Pago': montosPagoExcel,
        'Modalidad': v.modalidad_pago || (v.tipo_pago_id === '2' ? 'Crédito' : 'Contado'),
        'Gravadas': Number(v.gravadas || 0).toFixed(2),
        'Exoneradas': Number(v.exoneradas || 0).toFixed(2),
        'Inafectas': Number(v.inafectas || 0).toFixed(2),
        'IGV': Number(v.igv || 0).toFixed(2),
        'Descuento': Number(v.descuento || 0).toFixed(2),
        'Total': canSeeTotalColumnVentas ? Number(v.total || v.total_venta || 0).toFixed(2) : '',
        'Moneda': v.moneda || 'PEN'
      }
    })

    exportToExcel(data, `Facturacion_Electronica_${fechaInicio}_al_${fechaFin}`, 'Facturacion')
  }

  // Columnas para DataTable
  const columns = useMemo(() => {
    const cols = [
      {
        id: 'acciones',
        header: 'Acciones',
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
                  title="Reimprimir Comprobante"
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
                title="Duplicar a Pre-Venta"
              />
            </ActionCell>
          )
        },
        enableColumnFilter: false,
        enableSorting: false
      },
      {
        accessorKey: 'tipo_documento',
        header: 'Tipo',
        cell: ({ row }) => {
          const t = String(row.original.tipo_documento || 'boleta').toUpperCase()
          const isFactura = t === 'FACTURA' || row.original.tipo_comprobante_id === '01'
          return (
            <div className="flex justify-center">
              <span
                className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide ${
                  isFactura
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                }`}
              >
                {isFactura ? 'Factura' : 'Boleta'}
              </span>
            </div>
          )
        },
        size: 100
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
        header: 'Serie / Correlativo',
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true
          const filtros = filterValue.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
          if (filtros.length === 0) return true
          const rowValue = String(row.getValue(columnId) || '').toLowerCase()
          return filtros.some((f) => rowValue.includes(f))
        },
        cell: ({ row }) => {
          const serie = row.original.serie ? String(row.original.serie).toUpperCase() : ''
          const correlativo = row.original.correlativo
            ? String(row.original.correlativo).padStart(8, '0')
            : ''

          if (!serie && !correlativo) {
            return <span className="font-mono text-xs text-slate-400 text-center block">-</span>
          }

          return (
            <span className="font-mono text-xs text-slate-800 dark:text-slate-200 text-center block whitespace-nowrap">
              {serie && <span className="font-bold text-[#01a59c]">{serie}</span>}
              {serie && correlativo && <span className="text-slate-400 font-bold mx-0.5">-</span>}
              {correlativo && <span className="font-semibold">{correlativo}</span>}
            </span>
          )
        },
        size: 150
      },
      {
        accessorKey: 'cliente_nombre',
        header: 'Cliente / Receptor',
        cell: ({ row }) => (
          <div className="flex flex-col min-w-0">
            <span
              className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate"
              title={row.original.cliente_nombre}
            >
              {row.original.cliente_nombre || 'VARIOS'}
            </span>
            {row.original.cliente_numero_documento && (
              <span className="text-[10px] font-mono text-slate-400">
                {row.original.cliente_numero_documento}
              </span>
            )}
          </div>
        ),
        size: 220
      },
      {
        accessorKey: 'fecha_emision',
        header: 'Fecha Emisión',
        cell: ({ row }) => {
          const fechaVal = row.original.fecha_emision || row.original.created_at
          if (!fechaVal) return <span className="text-slate-400">-</span>
          const d = new Date(fechaVal)
          return (
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap block text-center">
              {d.toLocaleDateString('es-PE')} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )
        },
        size: 140
      },
      {
        id: 'estado_sunat',
        header: 'Estado SUNAT',
        cell: ({ row }) => {
          const obs = row.original.observacion_sunat || ''
          const facturado = row.original.facturado
          const esAnulado = String(row.original.estado || '').toUpperCase().includes('ANULAD')

          if (esAnulado) {
            return (
              <div className="flex justify-center">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400">
                  <XCircleIcon className="h-3 w-3" /> Anulado
                </span>
              </div>
            )
          }

          if (obs.toLowerCase().includes('rechazad')) {
            return (
              <div className="flex justify-center" title={obs}>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400">
                  <ExclamationTriangleIcon className="h-3 w-3" /> Rechazado
                </span>
              </div>
            )
          }

          if (obs.toLowerCase().includes('observad')) {
            return (
              <div className="flex justify-center" title={obs}>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
                  <ExclamationTriangleIcon className="h-3 w-3" /> Observado
                </span>
              </div>
            )
          }

          if (facturado) {
            return (
              <div className="flex justify-center" title={obs || 'Comprobante aceptado por SUNAT'}>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <CheckCircleIcon className="h-3 w-3" /> Aceptado
                </span>
              </div>
            )
          }

          return (
            <div className="flex justify-center" title="Pendiente de sincronización SUNAT">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <ClockIcon className="h-3 w-3" /> Pendiente
              </span>
            </div>
          )
        },
        size: 120
      },
      {
        id: 'archivos_sunat',
        header: 'Archivos',
        cell: ({ row }) => {
          const { xml_url, cdr_url, pdf_url } = row.original
          return (
            <div className="flex items-center justify-center gap-1">
              {xml_url ? (
                <a
                  href={xml_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-teal-50 hover:bg-teal-100 text-[#01a59c] border border-teal-200 transition-colors"
                  title="Descargar XML"
                >
                  XML
                </a>
              ) : (
                <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">XML</span>
              )}

              {cdr_url ? (
                <a
                  href={cdr_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-colors"
                  title="Descargar CDR (Constancia de Recepción)"
                >
                  CDR
                </a>
              ) : (
                <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">CDR</span>
              )}

              {pdf_url ? (
                <a
                  href={pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                  title="Descargar PDF"
                >
                  PDF
                </a>
              ) : null}
            </div>
          )
        },
        size: 110,
        enableColumnFilter: false,
        enableSorting: false
      }
    ]

    // Columna Total
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
        accessorKey: 'modalidad_pago',
        header: 'Modalidad',
        cell: ({ row }) => (
          <span className="text-xs text-slate-700 dark:text-slate-300 block text-center whitespace-nowrap">
            {row.original.modalidad_pago || (row.original.tipo_pago_id === '2' ? 'Crédito' : 'Contado')}
          </span>
        ),
        size: 110
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
      }
    )

    return cols
  }, [canSeeTotalColumnVentas])

  // Resaltado de filas anuladas
  const getRowClassName = useCallback((rowData) => {
    const est = String(rowData.estado || rowData.estado_venta || '').toUpperCase()
    if (est === 'ANULADA' || est === 'ANULADO') {
      return 'bg-[#ffcccc] dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 hover:bg-[#ffb3b3] dark:hover:bg-rose-950/60 font-medium'
    }
    return ''
  }, [])

  return (
    <div className="space-y-6 p-6">
      {/* ── ENCABEZADO Y FILTROS GLOBALES (PageHeader) ── */}
      <PageHeader
        title="Facturación Electrónica"
        subtitle="Emisión y seguimiento de comprobantes tributarios (Facturas y Boletas) ante SUNAT"
        icon={DocumentTextIcon}
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
              onClick={loadDocumentos}
              loading={loading}
              title="Actualizar comprobantes de facturación"
            />
            {canSeeTotalOnVentas && (
              <ExportExcelButton
                onClick={handleExportExcel}
                disabled={loading || documentos.length === 0}
                label="Descargar Excel"
                title="Descargar reporte de Facturación Electrónica en EXCEL"
              />
            )}
          </>
        }
      />

      {/* ── TARJETAS DE RESUMEN TRIBUTARIO Y TOTALES ── */}
      {canSeeTotalOnVentas && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-100/40 shadow-sm dark:bg-slate-900 rounded-xl border-[1px] border-teal-700 dark:border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircleIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Aceptados
              </span>
              <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                S/ {resumen.totalAceptadosStr}
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <XCircleIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Anulados
              </span>
              <p className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                S/ {resumen.totalAnuladosStr}
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-[#01a59c]">
              <CurrencyDollarIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Emitido
              </span>
              <p className="text-base sm:text-lg font-black text-teal-600 dark:text-teal-400 font-mono mt-0.5">
                S/ {resumen.totalMontoStr}
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <DocumentTextIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Documentos ({resumen.cantidadTotal})
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {resumen.cantidadFacturas} Fact. · {resumen.cantidadBoletas} Bol.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TABLA PRINCIPAL DE COMPROBANTES DE FACTURACIÓN ── */}
      <DataTable
        data={documentos}
        columns={columns}
        pagination={true}
        getRowClassName={getRowClassName}
        onFilteredData={setFilteredDocumentos}
      />

      {/* ── MODAL DETALLE DE COMPROBANTE ── */}
      <VentaDetalleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        venta={selectedVenta}
      />
    </div>
  )
}
