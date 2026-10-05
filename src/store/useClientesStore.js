import { create } from 'zustand'

const mockClientes = [
  { id: 1, ruc: '20100130492', nombre: 'Comercial López SAC', email: 'ventas@lopez.pe', telefono: '945123456', tipo: 'empresa', estado: 'activo' },
  { id: 2, ruc: '10456789012', nombre: 'Juan Carlos Ríos', email: 'jcrios@gmail.com', telefono: '987654321', tipo: 'persona', estado: 'activo' },
  { id: 3, ruc: '20567890123', nombre: 'Distribuciones Norte EIRL', email: 'info@norte.pe', telefono: '976543210', tipo: 'empresa', estado: 'activo' },
  { id: 4, ruc: '10123456789', nombre: 'María Torres García', email: 'mtorres@hotmail.com', telefono: '912345678', tipo: 'persona', estado: 'inactivo' },
  { id: 5, ruc: '20234567890', nombre: 'Inversiones Andina SA', email: 'admin@andina.pe', telefono: '998877665', tipo: 'empresa', estado: 'activo' },
]

export const useClientesStore = create((set, get) => ({
  clientes: mockClientes,
  loading: false,
  busqueda: '',

  setBusqueda: (busqueda) => set({ busqueda }),

  getFiltered: () => {
    const { clientes, busqueda } = get()
    return clientes.filter((c) =>
      c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.ruc.includes(busqueda) ||
      c.email.toLowerCase().includes(busqueda.toLowerCase())
    )
  },

  addCliente: (cliente) =>
    set((s) => ({ clientes: [...s.clientes, { ...cliente, id: Date.now() }] })),

  updateCliente: (id, data) =>
    set((s) => ({ clientes: s.clientes.map((c) => (c.id === id ? { ...c, ...data } : c)) })),

  deleteCliente: (id) =>
    set((s) => ({ clientes: s.clientes.filter((c) => c.id !== id) })),
}))
