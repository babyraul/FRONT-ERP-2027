import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { useVentasStore } from '../../../store/useVentasStore.js'
import { useProductosStore } from '../../../store/useProductosStore.js'
import { useClientesStore } from '../../../store/useClientesStore.js'
import { formatCurrency } from '../../../utils/exportExcel.js'

const ventasMensuales = [
  { mes: 'Abr', ventas: 18400, meta: 20000 },
  { mes: 'May', ventas: 22100, meta: 20000 },
  { mes: 'Jun', ventas: 19800, meta: 21000 },
  { mes: 'Jul', ventas: 25600, meta: 22000 },
  { mes: 'Ago', ventas: 21300, meta: 22000 },
  { mes: 'Sep', ventas: 8012,  meta: 23000 },
]

function KpiCard({ title, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-700',
    green:  'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    red:    'bg-red-50 text-red-700',
  }
  return (
    <div className="card">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className={`mt-1 text-2xl font-bold ${colors[color]}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const ventas    = useVentasStore((s) => s.ventas)
  const productos = useProductosStore((s) => s.productos)
  const clientes  = useClientesStore((s) => s.clientes)

  const totalVentas     = ventas.filter((v) => v.estado !== 'anulado').reduce((a, v) => a + v.total, 0)
  const ventasPendiente = ventas.filter((v) => v.estado === 'pendiente').length
  const stockBajo       = productos.filter((p) => p.stock < 30).length
  const clientesActivos = clientes.filter((c) => c.estado === 'activo').length

  const dailyData = useVentasStore.getState().getTotalesPorDia()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Resumen general del negocio — Septiembre 2026</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Ventas del mes"     value={formatCurrency(totalVentas)} sub={`${ventas.length} comprobantes`} color="blue" />
        <KpiCard title="Ventas pendientes"  value={ventasPendiente}             sub="por cobrar"                       color="yellow" />
        <KpiCard title="Productos stock bajo" value={stockBajo}                 sub="revisar inventario"              color="red" />
        <KpiCard title="Clientes activos"   value={clientesActivos}             sub={`de ${clientes.length} total`}   color="green" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Barras mensuales */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Ventas vs Meta mensual</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={ventasMensuales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `S/ ${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="ventas" name="Ventas" fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="meta"   name="Meta"   fill="#e2e8f0" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Línea diaria */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Ventas diarias — Septiembre</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `S/ ${v.toFixed(0)}`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Line
                type="monotone" dataKey="total" name="Total"
                stroke="#2563eb" strokeWidth={2}
                dot={{ r: 4 }} activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Últimas ventas */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Últimas ventas</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium">Comprobante</th>
                <th className="pb-2 font-medium">Cliente</th>
                <th className="pb-2 font-medium">Fecha</th>
                <th className="pb-2 font-medium text-right">Total</th>
                <th className="pb-2 font-medium text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ventas.slice(0, 5).map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="py-2.5 font-mono text-xs text-gray-600">{v.numero}</td>
                  <td className="py-2.5 text-gray-800">{v.cliente}</td>
                  <td className="py-2.5 text-gray-500">{v.fecha}</td>
                  <td className="py-2.5 text-right font-medium">{formatCurrency(v.total)}</td>
                  <td className="py-2.5 text-center">
                    <span className={
                      v.estado === 'pagado'   ? 'badge-green' :
                      v.estado === 'pendiente'? 'badge-yellow' : 'badge-red'
                    }>
                      {v.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
