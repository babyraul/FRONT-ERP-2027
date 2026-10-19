import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClockIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  EyeIcon,
  ArrowPathIcon,
  CreditCardIcon,
  UserIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import { DataTable } from '../../../components/ui/DataTable.jsx'
import DetallePreventaModal from '../components/DetallePreventaModal.jsx'
import { ventaController } from '../controllers/ventaController.js'
import { exportToExcel } from '../../../utils/exportExcel.js'
import { toast } from '../../../utils/toast.js'

export default function Preventas() {
  const navigate = useNavigate()
  const [preventas, setPreventas] = useState([])
  const [loading, setLoading] = useState(true)

  // Filtros de fecha y búsqueda (Widget centrado)
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date()
    d.setDate(1) // Primer día del mes actual
    return d.toISOString().split('T')[0]
  })
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0])
  const [busqueda, setBusqueda] = useState('')

  // Modal especializado de Detalle
  const [selectedPreventa, setSelectedPreventa] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Cargar preventas desde el backend (solo PENDIENTE)
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
      // Filtrar adicionalmente en frontend para garantizar solo preventas PENDIENTE
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

  // Cobrar preventa en el módulo de ventas
  const handleCobrar = (preventa) => {
    navigate('/vender/pagar', {
      state: {
        preventaId: preventa.id,
        tipoDocumento: preventa.tipo_documento || 'boleta',
        cliente: {
          id: preventa.cliente_id || '00000000-0000-0000-0000-000000000000',
          tipo_documento_id: preventa.cliente_numero_documento?.length === 11 ? '6' : '1',
          numero_documento: preventa.cliente_numero_documento || preventa.numero_documento || '99999999',
          nombre_razon_social: preventa.cliente_nombre || preventa.nombre_razon_social || 'VARIOS',
          direccion_1: preventa.cliente_direccion || ''
        },
        placa: preventa.alias || preventa.placa || '',
        alias: preventa.alias || preventa.placa || '',
        cartItems: (preventa.detalles || preventa.items || []).map((it, idx) => ({
          uniqueId: it.uniqueId || `it-${it.id || idx}`,
          producto_id: it.producto_id,
          nombre_completo: it.nombre_completo || it.producto_nombre || it.nombre || it.descripcion,
          cantidad: Number(it.cantidad || 1),
          precio_unitario: Number(it.precio_unitario || it.precio || 0),
          descuento: Number(it.descuento || 0)
        }))
      }
    })
  }

  // Ver Detalle
  const handleVerDetalle = (preventa) => {
    setSelectedPreventa(preventa)
    setIsModalOpen(true)
  }

  // Columnas para DataTable
  const columns = useMemo(() => [
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => handleVerDetalle(row.original)}
            className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-[#01a59c] hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors cursor-pointer"
            title="Ver detalle de preventa"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleCobrar(row.original)}
            className="p-1.5 rounded-lg bg-[#01473d] hover:bg-[#025a4d] text-white transition-all flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
            title="Cobrar / Proceder a Pagar"
          >
            <CreditCardIcon className="h-4 w-4" />
            <span className="text-[11px] font-bold hidden sm:inline">Cobrar</span>
          </button>
        </div>
      ),
      size: 110,
      enableColumnFilter: false
    },
    {
      accessorKey: 'codigo',
      header: 'Código',
      cell: ({ row }) => {
        const p = row.original
        // Código formateado a 4 caracteres del id: PV-XXXX
        const codigo = p.codigo && p.codigo.startsWith('PV-')
          ? p.codigo
          : (p.id ? `PV-${String(p.id).slice(0, 4)}` : 'PV-0001')
        const tipo = (p.tipo_documento || 'boleta').toLowerCase()

        return (
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${
                tipo.includes('factura')
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
      size: 130
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
  ], [navigate])

  return (
    <div className="space-y-4">
      {/* ── ENCABEZADO CON WIDGET DE FECHAS EN EL CENTRO ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Lado Izquierdo: Título y Totalizador */}
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Pre-Ventas Pendientes
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Reservas activas listas para facturar o cobrar
            </p>
          </div>
        </div>

        {/* CENTRO: Widget General de Filtro de Fechas */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2 p-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs">
            <CalendarIcon className="h-4 w-4 text-[#01a59c] shrink-0" />
            <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">Fecha:</span>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="text-xs font-semibold py-1 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-[#01a59c] cursor-pointer"
            />
            <span className="text-xs text-slate-400 font-bold">-</span>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="text-xs font-semibold py-1 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-[#01a59c] cursor-pointer"
            />
          </div>
        </div>

        {/* Lado Derecho: Acciones (Refrescar y Exportar) */}
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={loadPreventas}
            disabled={loading}
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Refrescar preventas pendientes"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin text-[#01a59c]' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <ArrowDownTrayIcon className="h-4 w-4 text-emerald-600" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* ── TARJETAS DE RESUMEN DE PREVENTAS PENDIENTES ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Pendiente</span>
          <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5 font-mono">
            S/ {metricas.totalMonto.toFixed(2)}
          </p>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
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
        onCobrar={handleCobrar}
      />
    </div>
  )
}
