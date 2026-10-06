import { useState } from 'react'
import { MagnifyingGlassIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useVentasStore } from '../../../store/useVentasStore.js'
import { exportToExcel, formatCurrency } from '../../../utils/exportExcel.js'

const ESTADOS = ['pagado', 'pendiente', 'anulado']

export default function Ventas() {
  const { setBusqueda, setEstadoFiltro, getFiltered, getTotalesPorDia } = useVentasStore()
  const ventas   = getFiltered()
  const dailyData = getTotalesPorDia()

  const [busq, setBusq] = useState('')
  const [est,  setEst]  = useState('')

  const handleBusq = (e) => { setBusq(e.target.value); setBusqueda(e.target.value) }
  const handleEst  = (e) => { setEst(e.target.value);  setEstadoFiltro(e.target.value) }

  const handleExport = () => {
    const data = ventas.map((v) => ({
      Número: v.numero, Fecha: v.fecha, Cliente: v.cliente,
      Total: v.total, Estado: v.estado, Tipo: v.tipo,
    }))
    exportToExcel(data, 'ventas', 'Ventas')
  }

  const totalFiltrado = ventas
    .filter((v) => v.estado !== 'anulado')
    .reduce((a, v) => a + v.total, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{ventas.length} comprobantes — Total: {formatCurrency(totalFiltrado)}</p>
        </div>
        <button onClick={handleExport} className="btn-secondary">
          <ArrowDownTrayIcon className="h-4 w-4" /> Exportar Excel
        </button>
      </div>

      {/* Gráfica */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Ventas diarias — Septiembre 2026</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={dailyData}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `S/ ${v}`} />
            <Tooltip formatter={(v) => formatCurrency(v)} />
            <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="url(#colorTotal)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Filtros */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text" placeholder="Buscar por número o cliente..."
            value={busq} onChange={handleBusq}
            className="input-field pl-9"
          />
        </div>
        <select value={est} onChange={handleEst} className="input-field w-40">
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Número</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium text-center">Tipo</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ventas.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-primary-600 font-medium">{v.numero}</td>
                  <td className="px-4 py-3 text-gray-500">{v.fecha}</td>
                  <td className="px-4 py-3 text-gray-900">{v.cliente}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={v.tipo === 'factura' ? 'badge-blue' : 'badge-gray'}>{v.tipo}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(v.total)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={
                      v.estado === 'pagado'    ? 'badge-green' :
                      v.estado === 'pendiente' ? 'badge-yellow' : 'badge-red'
                    }>{v.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {ventas.length === 0 && (
            <div className="py-16 text-center text-gray-400">No se encontraron ventas.</div>
          )}
        </div>
      </div>
    </div>
  )
}
