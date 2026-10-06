import { useState } from 'react'
import { ArrowDownTrayIcon, DocumentChartBarIcon } from '@heroicons/react/24/outline'
import { useVentasStore } from '../../store/useVentasStore.js'
import { useProductosStore } from '../../store/useProductosStore.js'
import { useClientesStore } from '../../store/useClientesStore.js'
import { exportToExcel, formatCurrency } from '../../utils/exportExcel.js'

const REPORTES = [
  { id: 'ventas',    label: 'Reporte de Ventas',    desc: 'Todas las ventas del período seleccionado.' },
  { id: 'productos', label: 'Reporte de Inventario', desc: 'Stock actual y valorización de productos.' },
  { id: 'clientes',  label: 'Reporte de Clientes',   desc: 'Listado completo de clientes registrados.' },
]

export default function Reportes() {
  const ventas    = useVentasStore((s) => s.ventas)
  const productos = useProductosStore((s) => s.productos)
  const clientes  = useClientesStore((s) => s.clientes)

  const [fechaDesde, setFechaDesde] = useState('2026-09-01')
  const [fechaHasta, setFechaHasta] = useState('2026-09-30')
  const [selected, setSelected]     = useState('ventas')

  const handleExport = () => {
    if (selected === 'ventas') {
      const data = ventas
        .filter((v) => v.fecha >= fechaDesde && v.fecha <= fechaHasta)
        .map((v) => ({
          Número: v.numero, Fecha: v.fecha, Cliente: v.cliente,
          Total: v.total, Estado: v.estado, Tipo: v.tipo,
        }))
      exportToExcel(data, `ventas_${fechaDesde}_${fechaHasta}`, 'Ventas')
    } else if (selected === 'productos') {
      const data = productos.map((p) => ({
        Código: p.codigo, Nombre: p.nombre, Categoría: p.categoria,
        Precio: p.precio, Stock: p.stock,
        Valorización: (p.precio * p.stock).toFixed(2),
        Estado: p.estado,
      }))
      exportToExcel(data, 'inventario', 'Inventario')
    } else {
      const data = clientes.map((c) => ({
        RUC: c.ruc, Nombre: c.nombre, Email: c.email,
        Teléfono: c.telefono, Tipo: c.tipo, Estado: c.estado,
      }))
      exportToExcel(data, 'clientes', 'Clientes')
    }
  }

  const totalVentasPeriodo = ventas
    .filter((v) => v.fecha >= fechaDesde && v.fecha <= fechaHasta && v.estado !== 'anulado')
    .reduce((a, v) => a + v.total, 0)

  const valorizacionInventario = productos.reduce((a, p) => a + p.precio * p.stock, 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Genera y exporta reportes a Excel</p>
      </div>

      {/* Selector de reporte */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {REPORTES.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelected(r.id)}
            className={`card text-left transition-all ${
              selected === r.id
                ? 'ring-2 ring-primary-500 border-primary-500'
                : 'hover:border-gray-300'
            }`}
          >
            <DocumentChartBarIcon className={`h-6 w-6 mb-2 ${selected === r.id ? 'text-primary-600' : 'text-gray-400'}`} />
            <p className="font-semibold text-gray-900 text-sm">{r.label}</p>
            <p className="text-xs text-gray-500 mt-1">{r.desc}</p>
          </button>
        ))}
      </div>

      {/* Filtros de período (solo ventas) */}
      {selected === 'ventas' && (
        <div className="card p-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="input-field w-44" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="input-field w-44" />
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-500">Total del período</p>
            <p className="text-xl font-bold text-primary-700">{formatCurrency(totalVentasPeriodo)}</p>
          </div>
        </div>
      )}

      {selected === 'productos' && (
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total de productos</p>
              <p className="text-xl font-bold text-gray-900">{productos.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Valorización inventario</p>
              <p className="text-xl font-bold text-primary-700">{formatCurrency(valorizacionInventario)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Stock bajo (&lt; 30)</p>
              <p className="text-xl font-bold text-red-600">{productos.filter((p) => p.stock < 30).length}</p>
            </div>
          </div>
        </div>
      )}

      <button onClick={handleExport} className="btn-primary text-base px-6 py-3">
        <ArrowDownTrayIcon className="h-5 w-5" />
        Exportar a Excel
      </button>
    </div>
  )
}
