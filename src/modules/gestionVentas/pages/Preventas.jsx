import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserIcon } from '@heroicons/react/24/outline'
import {
  ActionCell,
  ExportExcelButton,
  RefreshButton,
  NewButton,
  ViewRowButton,
  EditRowButton,
  DeleteRowButton,
  PayRowButton
} from '../../../components/ui/ActionButtons.jsx'
import DateRangeFilter, { getTodayStr } from '../../../components/ui/DateRangeFilter.jsx'
import PageHeader from '../../../components/ui/PageHeader.jsx'
import { DataTable } from '../../../components/ui/DataTable.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import DetallePreventaModal from '../components/DetallePreventaModal.jsx'
import { ventaController } from '../controllers/ventaController.js'
import { exportToExcel } from '../../../utils/exportExcel.js'
import { toast } from '../../../utils/toast.js'
import { usePermission } from '../../../hooks/usePermission.js'
import { useBarcodeScanner } from '../hooks/useBarcodeScanner.js'

export default function Preventas() {
  const navigate = useNavigate()
  const { hasPermission } = usePermission()

  const [preventas, setPreventas] = useState([])
  const [loading, setLoading] = useState(true)

  // RN-02: Fecha por defecto = hoy (YYYY-MM-DD)
  const [fechaInicio, setFechaInicio] = useState(getTodayStr)
  const [fechaFin, setFechaFin] = useState(getTodayStr)
  const [busqueda, setBusqueda] = useState('')

  // Modales
  const [selectedPreventa, setSelectedPreventa] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [preventaParaAnular, setPreventaParaAnular] = useState(null)
  const [isAnularModalOpen, setIsAnularModalOpen] = useState(false)
  const [anulando, setAnulando] = useState(false)

  // Permisos según especificación
  // RN-05 / RN-06: tienePermisoCaja permite procesar / cobrar.
  const tienePermisoCaja = hasPermission('caja.editar') || hasPermission('cajas.editar') || hasPermission('ventas.crear') || hasPermission('caja.ver')
  const canUpdate = hasPermission('gespreventas.editar') || hasPermission('preventas.editar') || hasPermission('vender.crear')
  const canDelete = hasPermission('gespreventas.eliminar') || hasPermission('preventas.eliminar')

  // Cargar preventas desde el backend (RN-01, RN-03)
  const loadPreventas = useCallback(async () => {
    setLoading(true)
    const params = {
      fecha_inicio: fechaInicio || undefined,
      fecha_fin: fechaFin || undefined,
      estado: 'PENDIENTE',
      q: busqueda.trim() || undefined
    }

    const res = await ventaController.getPreventas(params)
    if (res.success && Array.isArray(res.data)) {
      // Filtrar adicionalmente en frontend para garantizar solo PENDIENTE
      const soloPendientes = res.data.filter(
        (p) => String(p.estado || '').toUpperCase() === 'PENDIENTE'
      )
      setPreventas(soloPendientes)
    } else {
      toast.error('Error al cargar preventas', res.message || 'No se pudieron obtener las preventas.')
    }
    setLoading(false)
  }, [fechaInicio, fechaFin, busqueda])

  useEffect(() => {
    loadPreventas()
  }, [loadPreventas])

  // RN-16: Escaneo global de código de barras PV-<n>
  const handleBarcodeScan = useCallback((rawCode) => {
    const found = preventas.find((p) => {
      const cod = (p.codigo || '').toUpperCase()
      const formatted = `PV-${String(p.id).slice(0, 4)}`.toUpperCase()
      return cod === rawCode || formatted === rawCode
    })

    if (found) {
      toast.info('Código detectado', `Abriendo pre-venta ${rawCode}`)
      handleEditar(found)
    } else {
      toast.warning('Código no encontrado', `No se encontró una preventa activa con código ${rawCode}`)
    }
  }, [preventas])

  useBarcodeScanner(handleBarcodeScan, true)

  // Métricas rápidas
  const metricas = useMemo(() => {
    let totalMonto = 0
    let totalItems = preventas.length

    preventas.forEach((p) => {
      const monto = Number(p.total || p.total_preventa || p.monto_total || 0)
      totalMonto += monto
    })

    return { totalMonto, totalItems }
  }, [preventas])

  // Exportar a Excel
  const handleExport = () => {
    if (preventas.length === 0) {
      toast.error('No hay preventas para exportar')
      return
    }

    const data = preventas.map((p) => {
      const codigo = p.codigo || (p.id ? `PV-${String(p.id).slice(0, 4)}` : 'PV-0001')
      return {
        'Código / N°': codigo,
        'Fecha Creación': p.created_at ? new Date(p.created_at).toLocaleString() : (p.fecha || ''),
        'Tipo Doc': (p.tipo_documento || 'BOLETA').toUpperCase(),
        'Cliente': p.cliente_nombre || p.nombre_razon_social || p.cliente || 'VARIOS',
        'Doc. Cliente': p.cliente_numero_documento || p.numero_documento || '99999999',
        'Alias': p.alias || p.placa || '-',
        'Usuario': p.usuario_nombre || p.usuario || 'Sistema',
        'Total (S/)': Number(p.total || p.total_preventa || 0).toFixed(2),
        'Estado': (p.estado || 'PENDIENTE').toUpperCase()
      }
    })

    exportToExcel(data, `preventas_pendientes_${fechaInicio}_al_${fechaFin}`, 'Preventas Pendientes')
  }

  // Cobrar preventa en el módulo de ventas (RN-05)
  const handleCobrar = async (preventa) => {
    let preventaCompleta = preventa
    if (!preventaCompleta.detalles && !preventaCompleta.items) {
      const res = await ventaController.getPreventaById(preventa.id)
      if (res.success && res.data) {
        preventaCompleta = res.data
      }
    }

    const items = preventaCompleta.detalles || preventaCompleta.items || []

    navigate('/vender/pagar', {
      state: {
        preventaId: preventaCompleta.id,
        tipoDocumento: preventaCompleta.tipo_documento || 'boleta',
        cliente: {
          id: preventaCompleta.cliente_id || '00000000-0000-0000-0000-000000000000',
          tipo_documento_id: preventaCompleta.cliente_numero_documento?.length === 11 ? '6' : '1',
          numero_documento: preventaCompleta.cliente_numero_documento || preventaCompleta.numero_documento || '99999999',
          nombre_razon_social: preventaCompleta.cliente_nombre || preventaCompleta.nombre_razon_social || 'VARIOS',
          direccion_1: preventaCompleta.cliente_direccion || ''
        },
        placa: preventaCompleta.alias || preventaCompleta.placa || '',
        alias: preventaCompleta.alias || preventaCompleta.placa || '',
        cartItems: items.map((it, idx) => ({
          uniqueId: it.uniqueId || `it-${it.id || idx}`,
          producto_id: it.producto_id,
          presentacion_id: it.presentacion_id || null,
          unidad_medida_id: it.unidad_medida_id || 'NIU',
          nombre_completo: `${it.producto_nombre || it.nombre || it.descripcion || ''} ${it.nombre_completo || 'UNIDAD'} ${it.unidad_medida_id || 'NIU'}`.trim().toUpperCase(),
          cantidad: Number(it.cantidad || 1),
          precio_unitario: Number(it.precio_unitario || it.precio || 0),
          precio_costo: Number(it.precio_costo || 0),
          descuento: Number(it.descuento || 0)
        }))
      }
    })
  }

  // Editar preventa en /vender
  const handleEditar = async (preventa) => {
    let preventaCompleta = preventa
    if (!preventaCompleta.detalles && !preventaCompleta.items) {
      const res = await ventaController.getPreventaById(preventa.id)
      if (res.success && res.data) {
        preventaCompleta = res.data
      }
    }

    const items = preventaCompleta.detalles || preventaCompleta.items || []

    navigate('/vender', {
      state: {
        preventaId: preventaCompleta.id,
        tipoDocumento: preventaCompleta.tipo_documento || 'boleta',
        cliente: {
          id: preventaCompleta.cliente_id || '00000000-0000-0000-0000-000000000000',
          tipo_documento_id: preventaCompleta.cliente_numero_documento?.length === 11 ? '6' : '1',
          numero_documento: preventaCompleta.cliente_numero_documento || preventaCompleta.numero_documento || '99999999',
          nombre_razon_social: preventaCompleta.cliente_nombre || preventaCompleta.nombre_razon_social || 'VARIOS',
          direccion_1: preventaCompleta.cliente_direccion || ''
        },
        placa: preventaCompleta.alias || preventaCompleta.placa || '',
        cartItems: items.map((it, idx) => ({
          uniqueId: it.uniqueId || `it-${it.id || idx}`,
          producto_id: it.producto_id,
          presentacion_id: it.presentacion_id || null,
          unidad_medida_id: it.unidad_medida_id || 'NIU',
          nombre_completo: `${it.producto_nombre || it.nombre || it.descripcion || ''} ${it.nombre_completo || 'UNIDAD'} ${it.unidad_medida_id || 'NIU'}`.trim().toUpperCase(),
          cantidad: Number(it.cantidad || 1),
          precio_unitario: Number(it.precio_unitario || it.precio || 0),
          precio_costo: Number(it.precio_costo || 0),
          descuento: Number(it.descuento || 0)
        }))
      }
    })
  }

  // Solicitar anulación (abre modal de confirmación)
  const handleSolicitarAnulacion = (preventa) => {
    setPreventaParaAnular(preventa)
    setIsAnularModalOpen(true)
  }

  // Confirmar Anulación lógica (RN-07, RN-08)
  const handleConfirmarAnulacion = async () => {
    if (!preventaParaAnular) return
    setAnulando(true)

    const res = await ventaController.anularPreventa(preventaParaAnular.id)
    if (res.success) {
      toast.success('Pre-venta Anulada', 'La pre-venta fue anulada correctamente.')
      setIsAnularModalOpen(false)
      setPreventaParaAnular(null)
      loadPreventas()
    } else {
      toast.error('Error al anular', res.message || 'No se pudo anular la pre-venta.')
    }
    setAnulando(false)
  }

  // Ver Detalle (consulta API para traer items/detalles completos)
  const handleVerDetalle = async (preventa) => {
    setSelectedPreventa(preventa)
    setIsModalOpen(true)

    // Si ya trae items, los usamos; si no, consultamos por ID
    if (!preventa.detalles && !preventa.items) {
      const res = await ventaController.getPreventaById(preventa.id)
      if (res.success && res.data) {
        setSelectedPreventa(res.data)
      }
    }
  }

  // Columnas para DataTable
  const columns = useMemo(() => [
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => {
        const p = row.original
        return (
          <ActionCell>
            <ViewRowButton onClick={() => handleVerDetalle(p)} title="Ver detalle de preventa" />
            {tienePermisoCaja && (
              <PayRowButton onClick={() => handleCobrar(p)} title="Cobrar / Procesar Preventa" />
            )}
            {canUpdate && (
              <EditRowButton onClick={() => handleEditar(p)} title="Editar Pre-venta" />
            )}
            {canDelete && (
              <DeleteRowButton onClick={() => handleSolicitarAnulacion(p)} title="Anular pre-venta" />
            )}
          </ActionCell>
        )
      },
      enableColumnFilter: false,
      enableSorting: false
    },
    {
      accessorKey: 'codigo',
      header: 'Código',
      cell: ({ row }) => {
        const p = row.original
        const codigo = p.codigo && p.codigo.startsWith('PV-')
          ? p.codigo
          : (p.id ? `PV-${String(p.id).slice(0, 4)}` : 'PV-0001')
        const tipo = (p.tipo_documento || 'boleta').toLowerCase()

        return (
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${tipo.includes('factura')
                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                }`}
            >
              {tipo.includes('factura') ? 'FAC' : tipo.includes('boleta') ? 'BOL' : 'VAL'}
            </span>
            <span className="font-mono text-xs font-black text-slate-800 dark:text-slate-100 tracking-tight">
              {codigo}
            </span>
          </div>
        )
      },
      size: 140
    },
    {
      accessorKey: 'created_at',
      header: 'Fecha / Hora',
      cell: ({ row }) => {
        const p = row.original
        const fechaVal = p.created_at || p.fecha
        if (!fechaVal) return <span className="text-slate-400">-</span>
        const d = new Date(fechaVal)
        return (
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {d.toLocaleDateString()}
            </span>
            <span className="text-[10px] text-slate-400">
              {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )
      },
      size: 110
    },
    {
      accessorKey: 'cliente_nombre',
      header: 'Cliente',
      cell: ({ row }) => {
        const p = row.original
        const nombre = p.cliente_nombre || p.nombre_razon_social || p.cliente || 'VARIOS'
        const doc = p.cliente_numero_documento || p.numero_documento || ''

        return (
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate max-w-[200px]" title={nombre}>
              {nombre}
            </span>
            {doc && (
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-medium">
                {doc}
              </span>
            )}
          </div>
        )
      },
      size: 200
    },
    {
      accessorKey: 'alias',
      header: 'Alias',
      cell: ({ row }) => {
        const val = row.original.alias || row.original.placa
        return (
          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
            {val || '-'}
          </span>
        )
      },
      size: 110
    },
    {
      accessorKey: 'usuario_nombre',
      header: 'Usuario',
      cell: ({ row }) => {
        const u = row.original.usuario_nombre || row.original.usuario || 'Sistema'
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
            <UserIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate max-w-[120px] font-medium" title={u}>
              {u}
            </span>
          </div>
        )
      },
      size: 140
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => {
        const total = Number(row.original.total || row.original.total_preventa || 0)
        return (
          <div className="text-right">
            <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
              S/ {total.toFixed(2)}
            </span>
          </div>
        )
      },
      size: 110
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => {
        const est = String(row.original.estado || 'PENDIENTE').toUpperCase()
        return (
          <div className="text-center">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
              {est}
            </span>
          </div>
        )
      },
      size: 100
    }
  ], [tienePermisoCaja, canUpdate, canDelete, navigate])

  return (
    <div className="space-y-4">
      {/* ── ENCABEZADO CON WIDGET DE FECHAS EN EL CENTRO ── */}
      <PageHeader
        title="Gestion Pre Ventas"
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
            <RefreshButton onClick={loadPreventas} loading={loading} title="Refrescar preventas pendientes" />
            <ExportExcelButton onClick={handleExport} />
            <NewButton label="Nueva Pre-Venta" onClick={() => navigate('/vender')} className="hidden sm:inline-flex" />
          </>
        }
      />

      {/* ── TARJETAS DE RESUMEN DE PREVENTAS PENDIENTES ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl">
        <div className="p-3 bg-zinc-100/50 dark:bg-slate-900 rounded-xl border border-slate-100/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Pendiente</span>
          <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5 font-mono">
            S/ {metricas.totalMonto.toFixed(2)}
          </p>
        </div>
        <div className="p-3 bg-zinc-100/50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Reservas Activas</span>
          <p className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
            {metricas.totalItems}
          </p>
        </div>
      </div>

      {/* ── TABLA PRINCIPAL DE PREVENTAS CON TANSTACK DATATABLE Y FILTROS INTEGRADOS ── */}
      <DataTable data={preventas} columns={columns} pagination={true} />

      {/* ── MODAL ESPECIALIZADO DE DETALLE DE PREVENTA ── */}
      <DetallePreventaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        preventa={selectedPreventa}
        onCobrar={tienePermisoCaja ? handleCobrar : undefined}
        onEditar={canUpdate ? handleEditar : undefined}
      />

      {/* ── MODAL DE CONFIRMACIÓN DE ANULACIÓN (RN-08) ── */}
      <Modal
        isOpen={isAnularModalOpen}
        onClose={() => {
          if (!anulando) {
            setIsAnularModalOpen(false)
            setPreventaParaAnular(null)
          }
        }}
        title="¿Desea anular esta pre-venta?"
        subtitle={
          preventaParaAnular
            ? `Código: ${preventaParaAnular.codigo || `PV-${String(preventaParaAnular.id).slice(0, 4)}`} · Cliente: ${preventaParaAnular.cliente_nombre || 'VARIOS'}`
            : ''
        }
        confirmText={anulando ? 'Anulando...' : 'Sí, anular'}
        cancelText="Cancelar"
        isProcessing={anulando}
        onConfirm={handleConfirmarAnulacion}
        maxWidth="max-w-md"
      >
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Esta acción marcará la pre-venta como <strong className="text-rose-600 dark:text-rose-400">ANULADA</strong> y ya no estará disponible para facturación ni cobro.
        </p>
      </Modal>
    </div>
  )
}
