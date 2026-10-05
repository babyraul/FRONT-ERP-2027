import { create } from 'zustand'

// Mock data for development
const mockProductos = [
  { id: 1, codigo: 'P001', nombre: 'Arroz Extra', categoria: 'Abarrotes', precio: 3.50, stock: 150, estado: 'activo' },
  { id: 2, codigo: 'P002', nombre: 'Aceite Vegetal 1L', categoria: 'Abarrotes', precio: 8.90, stock: 80, estado: 'activo' },
  { id: 3, codigo: 'P003', nombre: 'Leche Gloria 1L', categoria: 'Lácteos', precio: 4.20, stock: 200, estado: 'activo' },
  { id: 4, codigo: 'P004', nombre: 'Jabón Bolívar', categoria: 'Limpieza', precio: 2.50, stock: 120, estado: 'activo' },
  { id: 5, codigo: 'P005', nombre: 'Pan de Molde', categoria: 'Panadería', precio: 6.50, stock: 0, estado: 'inactivo' },
  { id: 6, codigo: 'P006', nombre: 'Detergente Ariel 1kg', categoria: 'Limpieza', precio: 12.50, stock: 60, estado: 'activo' },
  { id: 7, codigo: 'P007', nombre: 'Azúcar Blanca 1kg', categoria: 'Abarrotes', precio: 3.80, stock: 300, estado: 'activo' },
  { id: 8, codigo: 'P008', nombre: 'Fideos Tallarin', categoria: 'Abarrotes', precio: 2.20, stock: 180, estado: 'activo' },
]

export const useProductosStore = create((set, get) => ({
  productos: mockProductos,
  loading: false,
  busqueda: '',
  categoriaFiltro: '',

  setBusqueda: (busqueda) => set({ busqueda }),
  setCategoriaFiltro: (categoriaFiltro) => set({ categoriaFiltro }),

  getFiltered: () => {
    const { productos, busqueda, categoriaFiltro } = get()
    return productos.filter((p) => {
      const matchBusq = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                        p.codigo.toLowerCase().includes(busqueda.toLowerCase())
      const matchCat  = categoriaFiltro ? p.categoria === categoriaFiltro : true
      return matchBusq && matchCat
    })
  },

  addProducto: (producto) =>
    set((s) => ({
      productos: [...s.productos, { ...producto, id: Date.now() }],
    })),

  updateProducto: (id, data) =>
    set((s) => ({
      productos: s.productos.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),

  deleteProducto: (id) =>
    set((s) => ({ productos: s.productos.filter((p) => p.id !== id) })),
}))
