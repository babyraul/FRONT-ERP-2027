import { create } from 'zustand'
import { productoController } from '../modules/productos/controllers/producto'

export const useProductosStore = create((set, get) => ({
  productos: [],
  loading: false,
  error: null,
  busqueda: '',
  categoriaFiltro: '',

  setBusqueda: (busqueda) => set({ busqueda }),
  setCategoriaFiltro: (categoriaFiltro) => set({ categoriaFiltro }),

  fetchProductos: async () => {
    set({ loading: true, error: null })
    const res = await productoController.getAll()
    if (res.success) {
      set({ productos: res.data, loading: false })
    } else {
      set({ error: res.error, loading: false })
    }
  },

  getFiltered: () => {
    const { productos, busqueda, categoriaFiltro } = get()
    return productos.filter((p) => {
      const matchBusq =
        p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.codigo_barra?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.palabra_clave?.toLowerCase().includes(busqueda.toLowerCase())

      const matchCat = categoriaFiltro ? p.categoria_id === categoriaFiltro : true
      return matchBusq && matchCat
    })
  },

  addProducto: async (data) => {
    const res = await productoController.create(data)
    if (res.success) {
      await get().fetchProductos()
      return { success: true, data: res.data }
    }
    return { success: false, error: res.error }
  },

  updateProducto: async (id, data) => {
    const res = await productoController.update(id, data)
    if (res.success) {
      await get().fetchProductos()
      return { success: true, data: res.data }
    }
    return { success: false, error: res.error }
  },

  deleteProducto: async (id) => {
    const res = await productoController.delete(id)
    if (res.success) {
      set((s) => ({ productos: s.productos.filter((p) => p.id !== id) }))
      return { success: true }
    }
    return { success: false, error: res.error }
  }
}))
