import { create } from 'zustand'

const mockVentas = [
  { id: 1, numero: 'F001-000001', fecha: '2026-09-01', cliente: 'Comercial López SAC', total: 450.00, estado: 'pagado', tipo: 'factura' },
  { id: 2, numero: 'B001-000001', fecha: '2026-09-02', cliente: 'Juan Carlos Ríos', total: 89.50, estado: 'pagado', tipo: 'boleta' },
  { id: 3, numero: 'F001-000002', fecha: '2026-09-05', cliente: 'Distribuciones Norte EIRL', total: 1250.00, estado: 'pendiente', tipo: 'factura' },
  { id: 4, numero: 'B001-000002', fecha: '2026-09-08', cliente: 'María Torres García', total: 35.80, estado: 'pagado', tipo: 'boleta' },
  { id: 5, numero: 'F001-000003', fecha: '2026-09-10', cliente: 'Inversiones Andina SA', total: 3200.00, estado: 'pagado', tipo: 'factura' },
  { id: 6, numero: 'B001-000003', fecha: '2026-09-12', cliente: 'Juan Carlos Ríos', total: 125.40, estado: 'anulado', tipo: 'boleta' },
  { id: 7, numero: 'F001-000004', fecha: '2026-09-14', cliente: 'Comercial López SAC', total: 780.00, estado: 'pendiente', tipo: 'factura' },
  { id: 8, numero: 'F001-000005', fecha: '2026-09-15', cliente: 'Distribuciones Norte EIRL', total: 2100.00, estado: 'pagado', tipo: 'factura' },
]

export const useVentasStore = create((set, get) => ({
  ventas: mockVentas,
  loading: false,
  busqueda: '',
  estadoFiltro: '',

  setBusqueda: (busqueda) => set({ busqueda }),
  setEstadoFiltro: (estadoFiltro) => set({ estadoFiltro }),

  getFiltered: () => {
    const { ventas, busqueda, estadoFiltro } = get()
    return ventas.filter((v) => {
      const matchBusq = v.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
                        v.cliente.toLowerCase().includes(busqueda.toLowerCase())
      const matchEst  = estadoFiltro ? v.estado === estadoFiltro : true
      return matchBusq && matchEst
    })
  },

  getTotalesPorDia: () => {
    const { ventas } = get()
    const grouped = {}
    ventas.forEach((v) => {
      if (v.estado === 'anulado') return
      const day = v.fecha.slice(8, 10) + '/' + v.fecha.slice(5, 7)
      grouped[day] = (grouped[day] ?? 0) + v.total
    })
    return Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([fecha, total]) => ({ fecha, total }))
  },
}))
