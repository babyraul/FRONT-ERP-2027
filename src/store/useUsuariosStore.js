import { create } from 'zustand'

const mockUsuarios = [
  { id: 1, nombre: 'Carlos Mendoza', email: 'carlos@sistemmarket.pe', rol: 'admin', estado: 'activo', ultimoAcceso: '2026-09-17' },
  { id: 2, nombre: 'Ana Flores', email: 'ana@sistemmarket.pe', rol: 'vendedor', estado: 'activo', ultimoAcceso: '2026-09-16' },
  { id: 3, nombre: 'Pedro Ramírez', email: 'pedro@sistemmarket.pe', rol: 'almacenero', estado: 'activo', ultimoAcceso: '2026-09-15' },
  { id: 4, nombre: 'Lucía Castro', email: 'lucia@sistemmarket.pe', rol: 'contador', estado: 'inactivo', ultimoAcceso: '2026-08-30' },
]

export const useUsuariosStore = create((set, get) => ({
  usuarios: mockUsuarios,
  busqueda: '',

  setBusqueda: (busqueda) => set({ busqueda }),

  getFiltered: () => {
    const { usuarios, busqueda } = get()
    return usuarios.filter((u) =>
      u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.rol.toLowerCase().includes(busqueda.toLowerCase())
    )
  },

  addUsuario: (usuario) =>
    set((s) => ({ usuarios: [...s.usuarios, { ...usuario, id: Date.now() }] })),

  updateUsuario: (id, data) =>
    set((s) => ({ usuarios: s.usuarios.map((u) => (u.id === id ? { ...u, ...data } : u)) })),

  deleteUsuario: (id) =>
    set((s) => ({ usuarios: s.usuarios.filter((u) => u.id !== id) })),
}))
