import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  FunnelIcon,
  EyeIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ReceiptPercentIcon,
  TicketIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline'
import { DataTable } from '../../../components/ui/DataTable.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import { ventaController } from '../controllers/ventaController.js'
import { exportToExcel, formatCurrency } from '../../../utils/exportExcel.js'
import { toast } from '../../../utils/toast.js'

export default function Ventas() {
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)

  // Filtros de fecha y búsqueda
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date()
    d.setDate(1) // Primer día del mes actual
    return d.toISOString().split('T')[0]
  })
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0])
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [busqueda, setBusqueda] = useState('')

  // Modal de Detalle de Venta
  const [selectedVenta, setSelectedVenta] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Cargar ventas desde el backend
  const loadVentas = useCallback(async () => {
    setLoading(true)
    const params = {
      fecha_inicio: fechaInicio || undefined,
      fecha_fin: fechaFin || undefined,
      estado: estadoFiltro || undefined,
      tipo_documento: tipoFiltro || undefined,
      q: busqueda.trim() || undefined
    }

    const res = await ventaController.getVentas(params)
    if (res.success && Array.isArray(res.data)) {
      setVentas(res.data)
    } else {
      toast.error('Error al cargar ventas', res.message || 'No se pudieron obtener las ventas.')
    }
    setLoading(false)
  }, [fechaInicio, fechaFin, estadoFiltro, tipoFiltro, busqueda])

  useEffect(() => {
    loadVentas()
  }, [loadVentas])

  // Métricas rápidas de los comprobantes
  const metricas = useMemo(() => {
    let totalMonto = 0
    let totalComprobantes = 0
    let totalFacturas = 0
    let totalBoletas = 0

    ventas.forEach((v) => {
      const estado = String(v.estado || v.estado_venta || '').toUpperCase()
      if (estado !== 'ANULADO') {
        const monto = Number(v.total || v.total_venta || v.monto_total || 0)
        totalMonto += monto
        totalComprobantes++
        const tipo = String(v.tipo_documento || v.tipo || v.tipo_comprobante || '').toLowerCase()
        if (tipo.includes('factura') || v.tipo_comprobante_id === '01') totalFacturas++
        if (tipo.includes('boleta') || v.tipo_comprobante_id === '03') totalBoletas++
      }
    })

    return { totalMonto, totalComprobantes, totalFacturas, totalBoletas }
  }, [ventas])

  // Exportar a Excel
  const handleExport = () => {
    if (ventas.length === 0) {
      toast.error('No hay ventas registradas para exportar')
      return
    }

    const data = ventas.map((v) => ({
      'Serie - Correlativo': v.numero || `${v.serie || ''}-${String(v.correlativo || '').padStart(8, '0')}`,
      'Fecha Emisión': v.fecha_emision ? new Date(v.fecha_emision).toLocaleString() : (v.fecha || ''),
      'Tipo Comprobante': (v.tipo_documento || v.tipo || '').toUpperCase(),
      'N° Doc Cliente': v.cliente_numero_documento || v.numero_documento || '',
      'Cliente / Razón Social': v.cliente_nombre || v.nombre_razon_social || v.cliente || 'VARIOS',
      'Placa': v.placa || '-',
      'Total (S/)': Number(v.total || v.total_venta || 0).toFixed(2),
      'Estado': (v.estado || v.estado_venta || 'EMITIDO').toUpperCase()
    }))

    exportToExcel(data, `ventas_${fechaInicio}_al_${fechaFin}`, 'Ventas')
  }

  // Ver Detalle
  const handleVerDetalle = (venta) => {
    setSelectedVenta(venta)
    setIsModalOpen(true)
  }

  // Columnas para DataTable
  const columns = useMemo(() => [
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <button
            onClick={() => handleVerDetalle(row.original)}
            className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors"
            title="Ver detalle del comprobante"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
        </div>
      ),
      size: 80,
      enableColumnFilter: false
    },
    {
      accessorKey: 'numero',
      header: 'Comprobante',
      cell: ({ row }) => {
        const v = row.original
        const numero = v.numero || (v.serie ? `${v.serie}-${String(v.correlativo || 0).padStart(8, '0')}` : 'S/N')
        const tipo = String(v.tipo_documento || v.tipo || (v.tipo_comprobante_id === '01' ? 'factura' : 'boleta')).toLowerCase()

        const isFactura = tipo.includes('factura')
        const isBoleta = tipo.includes('boleta')

        return (
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                isFactura
                  ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800'
                  : isBoleta
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
              }`}
            >
              {isFactura ? 'FAC' : isBoleta ? 'BOL' : 'VALE'}
            </span>
            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
              {numero}
            </span>
          </div>
        )
      },
      size: 160
    },
    {
      accessorKey: 'fecha_emision',
      header: 'Fecha / Hora',
      cell: ({ row }) => {
        const v = row.original
        const fechaVal = v.fecha_emision || v.fecha || v.created_at
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
        const v = row.original
        const nombre = v.cliente_nombre || v.nombre_razon_social || v.cliente || 'VARIOS'
        const doc = v.cliente_numero_documento || v.numero_documento || ''

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
      header: 'Total Venta',
      cell: ({ row }) => {
        const total = Number(row.original.total || row.original.total_venta || 0)
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
        const est = String(row.original.estado || row.original.estado_venta || 'EMITIDO').toUpperCase()
        const isAnulado = est === 'ANULADO'
        const isPagado = est === 'PAGADO' || est === 'EMITIDO'

        return (
          <div className="text-center">
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isAnulado
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                  : isPagado
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
  ], [])

  return (
    <div className="space-y-4">
      {/* ── ENCABEZADO ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShoppingBagIcon className="h-6 w-6 text-[#01a59c]" />
            Listado de Ventas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Registro y trazabilidad de comprobantes de venta emitidos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadVentas}
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

      {/* ── TARJETAS DE RESUMEN DE VENTAS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Ventas</span>
          <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
            S/ {metricas.totalMonto.toFixed(2)}
          </p>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Comprobantes</span>
          <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
            {metricas.totalComprobantes}
          </p>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Facturas</span>
          <p className="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5">
            {metricas.totalFacturas}
          </p>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Boletas</span>
          <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">
            {metricas.totalBoletas}
          </p>
        </div>
      </div>

      {/* ── BARRA DE FILTROS DE FECHA Y CRITERIOS ── */}
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

        <div className="flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[#01a59c]"
          >
            <option value="">Todos los Comprobantes</option>
            <option value="factura">Factura</option>
            <option value="boleta">Boleta</option>
            <option value="vale">Vale</option>
          </select>

          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[#01a59c]"
          >
            <option value="">Todos los Estados</option>
            <option value="EMITIDO">Emitido / Pagado</option>
            <option value="ANULADO">Anulado</option>
          </select>
        </div>

        <div className="relative flex-1 min-w-[180px]">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, documento o correlativo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full text-xs py-1.5 pl-8 pr-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-[#01a59c]"
          />
        </div>
      </div>

      {/* ── TABLA PRINCIPAL DE VENTAS CON TANSTACK DATATABLE ── */}
      <DataTable data={ventas} columns={columns} pagination={true} />

      {/* ── MODAL DETALLE DE VENTA ── */}
      {selectedVenta && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Detalle de Venta: ${selectedVenta.numero || selectedVenta.serie + '-' + selectedVenta.correlativo}`}
          size="2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Cliente:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {selectedVenta.cliente_nombre || selectedVenta.nombre_razon_social || selectedVenta.cliente || 'VARIOS'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Documento:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {selectedVenta.cliente_numero_documento || selectedVenta.numero_documento || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Fecha Emisión:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {selectedVenta.fecha_emision ? new Date(selectedVenta.fecha_emision).toLocaleString() : selectedVenta.fecha}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Placa:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {selectedVenta.placa || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Estado:</span>
                <span className="font-bold text-emerald-600 uppercase">
                  {selectedVenta.estado || selectedVenta.estado_venta || 'EMITIDO'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Total:</span>
                <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                  S/ {Number(selectedVenta.total || selectedVenta.total_venta || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Ítems del Comprobante */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Productos / Servicios
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
                    {(selectedVenta.detalles || selectedVenta.items || []).map((it, idx) => (
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
                    {(!selectedVenta.detalles && !selectedVenta.items) && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">
                          Detalle consolidado registrado por importe total.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
