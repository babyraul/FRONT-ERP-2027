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
  TrashIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline'
import { DataTable } from '../../../components/ui/DataTable.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import { ventaController } from '../controllers/ventaController.js'
import { exportToExcel } from '../../../utils/exportExcel.js'
import { toast } from '../../../utils/toast.js'

export default function Preventas() {
  const navigate = useNavigate()
  const [preventas, setPreventas] = useState([])
  const [loading, setLoading] = useState(true)

  // Filtros de fecha y búsqueda
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date()
    d.setDate(1) // Primer día del mes actual
    return d.toISOString().split('T')[0]
  })
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0])
  const [busqueda, setBusqueda] = useState('')

  // Modal de Detalle
  const [selectedPreventa, setSelectedPreventa] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Cargar preventas desde el backend
  const loadPreventas = useCallback(async () => {
    setLoading(true)
    const params = {
      fecha_inicio: fechaInicio || undefined,
      fecha_fin: fechaFin || undefined,
      q: busqueda.trim() || undefined
    }

    const res = await ventaController.getPreventas(params)
    if (res.success && Array.isArray(res.data)) {
      setPreventas(res.data)
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

    const data = preventas.map((p) => ({
      'Código / N°': p.codigo || p.id,
      'Fecha Creación': p.created_at ? new Date(p.created_at).toLocaleString() : (p.fecha || ''),
      'Tipo Doc': (p.tipo_documento || 'BOLETA').toUpperCase(),
      'Cliente': p.cliente_nombre || p.nombre_razon_social || p.cliente || 'VARIOS',
      'Placa': p.placa || '-',
      'Total (S/)': Number(p.total || p.total_preventa || 0).toFixed(2),
      'Estado': (p.estado || 'PENDIENTE').toUpperCase()
    }))

    exportToExcel(data, `preventas_${fechaInicio}_al_${fechaFin}`, 'Preventas')
  }

  // Cobrar preventa en el módulo de ventas
  const handleCobrar = (preventa) => {
    // Redirigir a /vender/pagar con los datos precargados de la preventa
    navigate('/vender/pagar', {
      state: {
        tipoDocumento: preventa.tipo_documento || 'boleta',
        cliente: {
          id: preventa.cliente_id || 'varios',
          numero_documento: preventa.cliente_numero_documento || '99999999',
          nombre_razon_social: preventa.cliente_nombre || preventa.nombre_razon_social || 'VARIOS',
          direccion_1: preventa.cliente_direccion || ''
        },
        placa: preventa.placa || '',
        cartItems: (preventa.detalles || preventa.items || []).map((it, idx) => ({
          uniqueId: it.uniqueId || `it-${it.id || idx}`,
          producto_id: it.producto_id,
          nombre_completo: it.nombre || it.producto_nombre || it.descripcion,
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
            className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors"
            title="Ver detalle de preventa"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleCobrar(row.original)}
            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex items-center gap-1"
            title="Cobrar / Convertir a Venta"
          >
            <CreditCardIcon className="h-4 w-4" />
            <span className="text-[11px] font-bold hidden sm:inline">Cobrar</span>
          </button>
        </div>
      ),
      size: 130,
      enableColumnFilter: false
    },
    {
      accessorKey: 'codigo',
      header: 'Código / Preventa',
      cell: ({ row }) => {
        const p = row.original
        const codigo = p.codigo || (p.id ? `PRE-${String(p.id).slice(0, 8)}` : 'PRE-0001')
        const tipo = (p.tipo_documento || 'boleta').toLowerCase()

        return (
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                tipo.includes('factura')
                  ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
              }`}
            >
              {tipo.includes('factura') ? 'FAC' : 'BOL'}
            </span>
            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
              {codigo}
            </span>
          </div>
        )
      },
      size: 160
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
      size: 120
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
            <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate" title={nombre}>
              {nombre}
            </span>
            {doc && (
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                {doc}
              </span>
            )}
          </div>
        )
      },
      size: 240
    },
    {
      accessorKey: 'placa',
      header: 'Placa',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
          {row.original.placa || '-'}
        </span>
      ),
      size: 100
    },
    {
      accessorKey: 'total',
      header: 'Total Preventa',
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
      size: 130
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => {
        const est = String(row.original.estado || 'PENDIENTE').toUpperCase()
        return (
          <div className="text-center">
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                est === 'PROCESADA' || est === 'COBRADA'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
              }`}
            >
              {est}
            </span>
          </div>
        )
      },
      size: 120
    }
  ], [navigate])

  return (
    <div className="space-y-4">
      {/* ── ENCABEZADO ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ClockIcon className="h-6 w-6 text-amber-500" />
            Listado de Pre-Ventas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Pedidos y cotizaciones en espera de liquidación o cobro en caja
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadPreventas}
            disabled={loading}
            className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refrescar lista"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin text-[#01a59c]' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 shadow-sm transition-all"
          >
            <ArrowDownTrayIcon className="h-4 w-4 text-emerald-600" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* ── TARJETAS DE RESUMEN DE PREVENTAS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Pendiente</span>
          <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
            S/ {metricas.totalMonto.toFixed(2)}
          </p>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Pre-Ventas Activas</span>
          <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
            {metricas.totalItems}
          </p>
        </div>
      </div>

      {/* ── BARRA DE FILTROS ── */}
      <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-[#01a59c] shrink-0" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Rango:</span>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[#01a59c]"
          />
          <span className="text-xs text-slate-400">al</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[#01a59c]"
          />
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, documento o código de preventa..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full text-xs py-1.5 pl-8 pr-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[#01a59c]"
          />
        </div>
      </div>

      {/* ── TABLA PRINCIPAL DE PREVENTAS CON TANSTACK DATATABLE ── */}
      <DataTable data={preventas} columns={columns} pagination={true} />

      {/* ── MODAL DETALLE DE PREVENTA ── */}
      {selectedPreventa && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Detalle de Pre-Venta: ${selectedPreventa.codigo || selectedPreventa.id}`}
          size="2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Cliente:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {selectedPreventa.cliente_nombre || selectedPreventa.nombre_razon_social || selectedPreventa.cliente || 'VARIOS'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Documento:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {selectedPreventa.cliente_numero_documento || selectedPreventa.numero_documento || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Fecha:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {selectedPreventa.created_at ? new Date(selectedPreventa.created_at).toLocaleString() : selectedPreventa.fecha}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Placa:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {selectedPreventa.placa || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Estado:</span>
                <span className="font-bold text-amber-600 uppercase">
                  {selectedPreventa.estado || 'PENDIENTE'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Total:</span>
                <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                  S/ {Number(selectedPreventa.total || selectedPreventa.total_preventa || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Ítems de la Preventa */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Productos Seleccionados
              </h3>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-left">
                    <tr>
                      <th className="p-2.5">Producto</th>
                      <th className="p-2.5 text-center">Cant.</th>
                      <th className="p-2.5 text-right">P. Unitario</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(selectedPreventa.detalles || selectedPreventa.items || []).map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                          {it.nombre || it.producto_nombre || it.descripcion}
                        </td>
                        <td className="p-2.5 text-center font-mono">{Number(it.cantidad || 1).toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono">S/ {Number(it.precio_unitario || it.precio || 0).toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono font-bold">
                          S/ {(Number(it.cantidad || 1) * Number(it.precio_unitario || it.precio || 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Botón de Acción rápida dentro del modal */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false)
                  handleCobrar(selectedPreventa)
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <CreditCardIcon className="h-4 w-4" />
                <span>Proceder al Cobro</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
