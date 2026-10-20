import api from '../../../utils/api'

export const productoController = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/productos', { params })
      return { success: true, data: response.data?.data || response.data || [] }
    } catch (error) {
      console.error('Error al obtener productos:', error)
      return { success: false, error: error.response?.data?.message || 'Error al obtener productos' }
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/productos/${id}`)
      return { success: true, data: response.data?.data || response.data }
    } catch (error) {
      console.error(`Error al obtener producto ${id}:`, error)
      return { success: false, error: error.response?.data?.message || 'Error al obtener producto' }
    }
  },

  create: async (data) => {
    try {
      const response = await api.post('/productos', data)
      return { success: true, data: response.data?.data || response.data }
    } catch (error) {
      console.error('Error al crear producto:', error)
      return { success: false, error: error.response?.data?.message || 'Error al crear producto' }
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/productos/${id}`, data)
      return { success: true, data: response.data?.data || response.data }
    } catch (error) {
      console.error(`Error al actualizar producto ${id}:`, error)
      return { success: false, error: error.response?.data?.message || 'Error al actualizar producto' }
    }
  },

  delete: async (id) => {
    try {
      await api.delete(`/productos/${id}`)
      return { success: true }
    } catch (error) {
      console.error(`Error al eliminar producto ${id}:`, error)
      return { success: false, error: error.response?.data?.message || 'Error al eliminar producto' }
    }
  },

  getKardex: async (id) => {
    try {
      const response = await api.get(`/productos/${id}/kardex`)
      return { success: true, data: response.data?.data || response.data || [] }
    } catch (error) {
      console.error(`Error al obtener kardex del producto ${id}:`, error)
      return { success: false, data: [], error: error.response?.data?.message || 'Error al obtener kárdex' }
    }
  }
}
