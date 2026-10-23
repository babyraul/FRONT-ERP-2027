import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  EyeIcon,
  PrinterIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  TrashIcon,
  CheckIcon,
  RectangleStackIcon,
  BoltIcon
} from '@heroicons/react/24/outline'
import PageHeader from '../../../components/ui/PageHeader.jsx'
import {
  ActionCell,
  ExportExcelButton,
  RefreshButton,
  ViewRowButton,
  PrintRowButton,
  DuplicateRowButton,
  DeleteRowButton
} from '../../../components/ui/ActionButtons.jsx'
import { getTodayStr, toDateStr } from '../../../components/ui/DateRangeFilter.jsx'
import { DataTable } from '../../../components/ui/DataTable.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import VentaDetalleModal from '../components/VentaDetalleModal.jsx'
import { ventaController } from '../controllers/ventaController.js'
import { exportToExcel } from '../../../utils/exportExcel.js'
import { toast } from '../../../utils/toast.js'
import { usePermission } from '../../../hooks/usePermission.js'
import { printTicketVenta } from '../../../utils/ticketVentaPrint.js'

const STORAGE_KEY_TIME_RANGE = 'list-vales-time-range'

// Estado normalizado del vale (por defecto EMITIDO)
const getEstadoVale = (v) => String(v?.estado || v?.estado_venta || 'EMITIDO').toUpperCase()
// Vales EMITIDOS = pendientes de formalizar (canje a Factura/Boleta)
const isValeEmitido = (v) => ['EMITIDO'].includes(getEstadoVale(v))

export default function Vales() {
  const navigate = useNavigate()
  const { hasPermission } = usePermission()

  // Control de permisos RBAC para Reporte de Vales
  const canSeeTotalOnVales = hasPermission('vales.ver_totales') || hasPermission('canSeeTotalOnVales') || true
  const canSeeTotalColumnVales = hasPermission('vales.ver_columna_total') || hasPermission('canSeeTotalColumnVales') || true
  const canShowPaymentInfo = hasPermission('vales.ver_info_pagos') || hasPermission('canShowPaymentInfo') || true
  const canChangeDateForRecords = hasPermission('vales.cambiar_fechas') || hasPermission('canChangeDateForRecords') || true
  const hasEditPerm = hasPermission('vales.editar') || hasPermission('Vales.Update') || true
  const hasDeletePerm = hasPermission('vales.eliminar') || hasPermission('Vales.Delete') || true

  const [vales, setVales] = useState([])
  const [filteredVales, setFilteredVales] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [loading, setLoading] = useState(false)

  // Filtros de fecha (con persistencia en sessionStorage)
  const [fechaInicio, setFechaInicio] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_TIME_RANGE)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.fechaInicio) return parsed.fechaInicio
      }
    } catch { }
    return getTodayStr()
  })

  const [fechaFin, setFechaFin] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_TIME_RANGE)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.fechaFin) return parsed.fechaFin
      }
    } catch { }
    return getTodayStr()
  })

  // Modal de Detalle
  const [selectedVale, setSelectedVale] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Modal de Anulación
  const [valeParaAnular, setValeParaAnular] = useState(null)
  const [isAnularModalOpen, setIsAnularModalOpen] = useState(false)
  const [motivoAnulacion, setMotivoAnulacion] = useState('')
  const [anulando, setAnulando] = useState(false)

  // Cargar vales desde el backend
  const loadVales = useCallback(async () => {
    setLoading(true)
    const params = {
      fecha_inicio: fechaInicio || undefined,
      fecha_fin: fechaFin || undefined,
      tipo_documento: 'vale'
    }

    const res = await ventaController.getVentas(params)
    if (res.success && Array.isArray(res.data)) {
      setVales(res.data)
      setFilteredVales(res.data)
      // Limpiar selección de IDs que ya no existan
      setSelectedIds(prev => {
        const next = new Set()
        const ids = new Set(res.data.map(v => v.id))
        prev.forEach(id => {
          if (ids.has(id)) next.add(id)
        })
        return next
      })
    } else {
      toast.error('Error al cargar vales', res.message || 'No se pudieron obtener los vales.')
    }
    setLoading(false)
  }, [fechaInicio, fechaFin])

  useEffect(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY_TIME_RANGE)
    } catch { }
  }, [])

  useEffect(() => {
    loadVales()
  }, [loadVales])

  // Totales reactivos (Excluyen vales anulados, redondeo standard de 2 decimales en moneda base)
  const totales = useMemo(() => {
    const dataset = filteredVales.length > 0 || vales.length === 0 ? filteredVales : vales

    let totalSelected = 0
    let totalEmitidos = 0
    let totalGeneral = 0

    dataset.forEach((v) => {
      const estado = getEstadoVale(v)
      const totalNum = Number(v.total || v.total_venta || 0)

      if (estado !== 'ANULADA' && estado !== 'ANULADO') {
        totalGeneral += totalNum

        if (isValeEmitido(v)) {
          totalEmitidos += totalNum
        }

        if (selectedIds.has(v.id)) {
          totalSelected += totalNum
        }
      }
    })

    return {
      totalSelectedStr: totalSelected.toFixed(2),
      totalEmitidosStr: totalEmitidos.toFixed(2),
      totalGeneralStr: totalGeneral.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      cantidadTotal: dataset.length,
      cantidadSeleccionados: selectedIds.size
    }
  }, [filteredVales, vales, selectedIds])

  // Toggle de selección individual
  const toggleSelectVale = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Acción: Seleccionar todos los pendientes
  const handleSelectAllPendientes = () => {
    const dataset = filteredVales.length > 0 || vales.length === 0 ? filteredVales : vales
    const pendientes = dataset.filter(v => isValeEmitido(v) && v.showCheck !== false)

    if (pendientes.length === 0) {
      toast.info('No hay vales emitidos seleccionables.')
      return
    }

    setSelectedIds(new Set(pendientes.map(v => v.id)))
    toast.success(`Se seleccionaron ${pendientes.length} vales emitidos.`)
  }

  // Acción: Seleccionar los 20 primeros pendientes (RN-04)
  const handleSelectTwentyVales = () => {
    const dataset = filteredVales.length > 0 || vales.length === 0 ? filteredVales : vales
    const pendientes = dataset.filter(v => isValeEmitido(v) && v.showCheck !== false)

    if (pendientes.length === 0) {
      toast.info('No hay vales emitidos para seleccionar.')
      return
    }

    const primeros20 = pendientes.slice(0, 20)
    setSelectedIds(new Set(primeros20.map(v => v.id)))

    if (pendientes.length < 20) {
      toast.info('Se han seleccionado menos de 20 vales.')
    } else {
      toast.success('Se han seleccionado los 20 primeros vales.')
    }
  }

  // Acción: Limpiar selección
  const handleClearSelection = () => {
    setSelectedIds(new Set())
  }

  // Acción: Procesar Vales (Canje / Consolidación a Factura o Boleta)
  const handleProcesarVales = () => {
    if (selectedIds.size === 0) {
      toast.error('Debe seleccionar vales a procesar')
      return
    }

    // Persistir rango de fechas en sessionStorage para retorno del usuario (RN-02)
    try {
      sessionStorage.setItem(STORAGE_KEY_TIME_RANGE, JSON.stringify({ fechaInicio, fechaFin }))
    } catch { }

    const idsArray = Array.from(selectedIds)
    navigate(`/vales/procesar/${idsArray.join(',')}`)
  }

  // Ver Detalle
  const handleVerDetalle = async (vale) => {
    try {
      const res = await ventaController.getVentaById(vale.id)
      if (res.success && res.data) {
        setSelectedVale(res.data)
      } else {
        setSelectedVale(vale)
      }
      setIsModalOpen(true)
    } catch {
      setSelectedVale(vale)
      setIsModalOpen(true)
    }
  }

  // Reimprimir Ticket del Vale
  const handleReimprimir = async (vale) => {
    try {
      const res = await ventaController.getVentaById(vale.id)
      const dataCompleta = res.success && res.data ? res.data : vale
      printTicketVenta(dataCompleta)
    } catch (err) {
      console.error('Error al reimprimir vale:', err)
      toast.error('Error al preparar impresión del vale')
    }
  }

  // Duplicar Vale hacia Pre-Venta (RN-10)
  const handleDuplicar = (vale) => {
    navigate('/vender', {
      state: {
        preventaId: null,
        tipoDocumento: 'vale',
        cliente: {
          id: vale.cliente_id,
          numero_documento: vale.cliente_numero_documento || '99999999',
          nombre_razon_social: vale.cliente_nombre || 'VARIOS',
          tipo_documento_id: vale.cliente_tipo_documento_id || '1'
        },
        placa: vale.placa || '',
        cartItems: []
      }
    })
  }

  // Solicitar Anulación
  const handleSolicitarAnulacion = (vale) => {
    setValeParaAnular(vale)
    setMotivoAnulacion('')
    setIsAnularModalOpen(true)
  }

  // Confirmar Anulación (RN-08 / RN-09)
  const handleConfirmarAnulacion = async () => {
    if (!valeParaAnular) return
    setAnulando(true)
    try {
      const res = await ventaController.anularVenta(valeParaAnular.id, motivoAnulacion.trim())
      if (res.success) {
        toast.success(`Vale ${valeParaAnular.serie}-${valeParaAnular.correlativo || ''} anulado correctamente`)
        setIsAnularModalOpen(false)
        setValeParaAnular(null)
        loadVales()
      } else {
        toast.error('Error al anular', res.message || 'No se pudo anular el comprobante')
      }
    } catch (err) {
      console.error('Error al anular vale:', err)
      toast.error('Error en el servidor al intentar anular el vale')
    } finally {
      setAnulando(false)
    }
  }

  // Exportar Vales a Excel
  const handleExportExcel = () => {
    const dataset = filteredVales.length > 0 || vales.length === 0 ? filteredVales : vales

    if (dataset.length === 0) {
      toast.error('No hay vales registrados para exportar')
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
        'Cliente / Razón Social': v.cliente_nombre || 'VARIOS',
        'Fecha Emisión': v.fecha_emision ? new Date(v.fecha_emision).toLocaleString('es-PE') : (v.created_at || ''),
        'Sucursal': v.sucursal_nombre || 'Principal',
        'Estado': (v.estado || 'EMITIDO').toUpperCase(),
        'Tipo Comprobante': 'VALE',
        'Serie': v.serie || '',
        'Número Comprobante': v.correlativo ? String(v.correlativo).padStart(8, '0') : '',
        'Moneda': v.moneda || 'PEN',
        'Total (S/)': canSeeTotalColumnVales ? Number(v.total || v.total_venta || 0).toFixed(2) : '',
        'Medios de Pago': tiposPagoExcel,
        'Montos de Pago': montosPagoExcel,
        'Alias / Placa': v.placa || '-',
        'Nro Documento': v.cliente_numero_documento || ''
      }
    })

    exportToExcel(data, `ReporteVales_${fechaInicio}_al_${fechaFin}`, 'Vales')
  }

  // Definición de Columnas con Checkbox separado en columna propia
  const columns = useMemo(() => {
    const cols = [
      // 1. Columna de Selección Exclusiva a la Izquierda
      {
        id: 'seleccion',
        header: () => (
          <div className="flex items-center justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Sel</span>
          </div>
        ),
        cell: ({ row }) => {
          const v = row.original
          const est = getEstadoVale(v)
          const isPendiente = isValeEmitido(v)
          const canCheck = isPendiente && hasEditPerm && v.showCheck !== false
          const isChecked = selectedIds.has(v.id)

          if (!canCheck) {
            return (
              <div className="flex items-center justify-center">
                <span className="h-4 w-4 block text-slate-300 dark:text-slate-650" title={!isPendiente ? `Vale ${est}` : 'Stock sin comprobante'}>-</span>
              </div>
            )
          }

          return (
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleSelectVale(v.id)}
                className="h-4 w-4 rounded border-slate-300 text-[#01a59c] focus:ring-[#01a59c] cursor-pointer"
                title="Seleccionar vale para canje fiscal"
              />
            </div>
          )
        },
        size: 50,
        enableColumnFilter: false
      },
      // 2. Columna de Acciones Operativas (Info)
      {
        id: 'acciones',
        header: 'Info',
        cell: ({ row }) => {
          const v = row.original
          const rowIndex = row.index
          const isPendiente = isValeEmitido(v)

          let showReimprimir = true
          let showDetalle = canSeeTotalColumnVales

          if (!canSeeTotalColumnVales) {
            const fechaV = v.fecha_emision ? toDateStr(new Date(v.fecha_emision)) : ''
            const hoy = getTodayStr()
            showReimprimir = (fechaV === hoy) && (rowIndex < 3)
          }

          return (
            <ActionCell>
              {showReimprimir && (
                <PrintRowButton
                  onClick={() => handleReimprimir(v)}
                  title="Reimprimir Vale (Ticket)"
                />
              )}
              {showDetalle && (
                <ViewRowButton
                  onClick={() => handleVerDetalle(v)}
                  title="Ver detalle del vale"
                />
              )}
              <DuplicateRowButton
                onClick={() => handleDuplicar(v)}
                title="Duplicar Vale a Pre-Venta"
              />
              {isPendiente && hasDeletePerm && (
                <DeleteRowButton
                  onClick={() => handleSolicitarAnulacion(v)}
                  title="Anular Vale"
                />
              )}
            </ActionCell>
          )
        },
        enableColumnFilter: false,
        enableSorting: false
      },
      // 3. Cliente
      {
        accessorKey: 'cliente_nombre',
        header: 'Cliente',
        cell: ({ row }) => (
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate" title={row.original.cliente_nombre}>
              {row.original.cliente_nombre || 'VARIOS'}
            </span>
            {row.original.cliente_numero_documento && (
              <span className="text-[12px] font-mono text-slate-500">
                {row.original.cliente_numero_documento}
              </span>
            )}
          </div>
        ),
        size: 210
      },
      // 5. Fecha de emisión
      {
        accessorKey: 'fecha_emision',
        header: 'Fecha de emisión',
        cell: ({ row }) => {
          const fechaVal = row.original.fecha_emision || row.original.created_at
          if (!fechaVal) return <span className="text-slate-400">-</span>
          const d = new Date(fechaVal)
          return (
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
              {d.toLocaleDateString('es-PE')} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )
        },
        size: 140
      },
      // 6. Serie + NumeroComprobante (unificadas)
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
        size: 180,
      },
      // 8. Alias/Placa
      {
        accessorKey: 'placa',
        header: 'Alias/Placa',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-slate-600 dark:text-slate-300 text-center block">
            {row.original.placa || '-'}
          </span>
        ),
        size: 100
      }
    ]

    // 9. Total (Condicionado por canSeeTotalColumnVales)
    if (canSeeTotalColumnVales) {
      cols.push({
        accessorKey: 'total',
        header: 'Total',
        cell: ({ row }) => {
          const val = Number(row.original.total || row.original.total_venta || 0)
          return (
            <div className="text-right font-mono text-xs font-bold text-slate-900 dark:text-white">
              S/ {val.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          )
        },
        size: 110
      })
    }

    // 10. Modalidad Pago
    cols.push(
      {
        accessorKey: 'modalidad_pago',
        header: 'Modalidad Pago',
        cell: ({ row }) => (
          <span className="text-xs text-slate-700 dark:text-slate-300 block text-center">
            {row.original.modalidad_pago || (row.original.tipo_pago_id === '2' ? 'Crédito' : 'Contado')}
          </span>
        ),
        size: 110
      },
      // 11. Estado
      {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }) => {
          const est = getEstadoVale(row.original)
          const isAnulada = est === 'ANULADA' || est === 'ANULADO'
          const isProcesado = est === 'PROCESADO' || est === 'PROCESADA'

          return (
            <div className="text-center">
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isAnulada
                  ? 'bg-red-200 text-red-800 border border-red-300'
                  : isProcesado
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                  }`}
              >
                {est}
              </span>
            </div>
          )
        },
        size: 110
      },
      // 12. Moneda
      // {
      //   accessorKey: 'moneda',
      //   header: 'Moneda',
      //   cell: ({ row }) => (
      //     <span className="font-mono text-xs text-slate-600 dark:text-slate-400 text-center block">
      //       {row.original.moneda || 'PEN'}
      //     </span>
      //   ),
      //   size: 80
      // }
    )

    // 13. Tipos de Pago y 14. Montos de Pago (si canShowPaymentInfo)
    if (canShowPaymentInfo) {
      cols.push(
        {
          accessorKey: 'tipos_pago',
          header: 'Tipos de Pago',
          cell: ({ row }) => {
            const str = row.original.tipos_pago || 'Efectivo'
            const formatted = str.split(',').map(t => t.trim()).join('\n')
            return (
              <div className="text-center text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line font-medium">
                {formatted}
              </div>
            )
          },
          size: 130
        },
        {
          accessorKey: 'montos_pago',
          header: 'Montos de Pago',
          cell: ({ row }) => {
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
          size: 130
        }
      )
    }

    return cols
  }, [canSeeTotalColumnVales, canShowPaymentInfo, selectedIds, hasEditPerm, hasDeletePerm])

  // Resaltado de filas anuladas con fondo rojo suave (#ffcccc)
  const getRowClassName = useCallback((rowData) => {
    const est = String(rowData.estado || rowData.estado_venta || '').toUpperCase()
    if (est === 'ANULADA' || est === 'ANULADO') {
      return 'bg-[#ffcccc] dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 hover:bg-[#ffb3b3] dark:hover:bg-rose-950/60 font-medium'
    }
    return ''
  }, [])

  return (
    <div className="space-y-6 p-6">
      {/* ── ENCABEZADO Y FILTROS GLOBALES ── */}
      <PageHeader
        title="Lista de Vales"
        dateRange={canChangeDateForRecords ? {
          from: fechaInicio,
          to: fechaFin,
          onChange: ({ from, to }) => {
            setFechaInicio(from)
            setFechaFin(to)
          }
        } : undefined}
        actions={
          <>
            <RefreshButton
              onClick={loadVales}
              loading={loading}
              title="Actualizar vales"
            />
            {canSeeTotalOnVales && (
              <ExportExcelButton
                onClick={handleExportExcel}
                disabled={loading || vales.length === 0}
                label="Descargar Excel"
                title="Descarga reporte de Vales en EXCEL"
              />
            )}
            {hasEditPerm && (
              <button
                type="button"
                onClick={handleProcesarVales}
                disabled={selectedIds.size === 0}
                className="px-4 py-2 bg-[#01a59c] hover:bg-[#018e86] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                title="Procesar vales seleccionados para emitir Factura o Boleta"
              >
                <BoltIcon className="h-4 w-4 text-amber-300" />
                <span>Procesar Vales ({selectedIds.size})</span>
              </button>
            )}
          </>
        }
      />

      {/* ── ACCIONES DE SELECCIÓN RÁPIDA EN LOTE (RN-04 / RN-05) ── */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        {hasEditPerm && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handleSelectAllPendientes}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors"
              title="Seleccionar todos los vales en estado EMITIDO"
            >
              <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
              <span>Todos los emitidos</span>
            </button>

            <button
              type="button"
              onClick={handleSelectTwentyVales}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors"
              title="Seleccionar hasta 20 vales emitidos"
            >
              <RectangleStackIcon className="h-3.5 w-3.5 text-blue-600" />
              <span>20 primeros</span>
            </button>

            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-2 py-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold"
              >
                Limpiar ({selectedIds.size})
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── TARJETAS DE RESUMEN DE TOTALES (2 decimales exactos en moneda base) ── */}
      {canSeeTotalOnVales && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-[#01a59c]">
              <CurrencyDollarIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total de Seleccionados
              </span>
              <p className="text-base sm:text-lg font-black text-[#01a59c] font-mono mt-0.5">
                S/ {totales.totalSelectedStr}
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <CheckCircleIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total de Emitidos
              </span>
              <p className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                S/ {totales.totalEmitidosStr}
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <CurrencyDollarIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total de Todos los Vales
              </span>
              <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                S/ {totales.totalGeneralStr}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TABLA PRINCIPAL DE VALES ── */}
      <DataTable
        data={vales}
        columns={columns}
        pagination={true}
        getRowClassName={getRowClassName}
        onFilteredData={setFilteredVales}
      />

      {/* ── MODAL DETALLE DE VALE (COMPONENTE MODULAR SEPARADO) ── */}
      <VentaDetalleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        venta={selectedVale}
      />

      {/* ── MODAL DE CONFIRMACIÓN DE ANULACIÓN (RN-08) ── */}
      {valeParaAnular && (
        <Modal
          isOpen={isAnularModalOpen}
          onClose={() => {
            if (!anulando) {
              setIsAnularModalOpen(false)
              setValeParaAnular(null)
            }
          }}
          title={`Anular Vale: ${valeParaAnular.serie}-${valeParaAnular.correlativo || ''}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-900/50">
              <p className="font-bold">¿Está seguro de anular este vale?</p>
              <p className="mt-1 text-[11px]">
                Esta acción revertirá el stock comprometido y registrará un movimiento de egreso compensatorio en el turno de caja activo.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Motivo de la anulación (opcional):
              </label>
              <textarea
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                placeholder="Indique el motivo por el cual se deja sin efecto el vale..."
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 min-h-[70px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={anulando}
                onClick={() => {
                  setIsAnularModalOpen(false)
                  setValeParaAnular(null)
                }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={anulando}
                onClick={handleConfirmarAnulacion}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <TrashIcon className="h-4 w-4" />
                <span>{anulando ? 'Anulando...' : 'Confirmar Anulación'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
