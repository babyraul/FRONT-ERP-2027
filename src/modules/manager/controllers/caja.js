import api from '../../../utils/api'

export const cajaController = {
  getAll: async () => {
    try {
      const response = await api.get('/cajas')
      return { success: true, data: response.data?.data || response.data || [] }
    } catch (error) {
      console.error('Error al obtener cajas:', error)
      return { success: false, error: error.response?.data?.message || 'Error de conexión' }
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/cajas/${id}`)
      return { success: true, data: response.data?.data || response.data }
    } catch (error) {
      console.error(`Error al obtener caja ${id}:`, error)
      return { success: false, error: error.response?.data?.message || 'Error de conexión' }
    }
  },

  create: async (data) => {
    try {
      const response = await api.post('/cajas', data)
      return { success: true, data: response.data?.data || response.data }
    } catch (error) {
      console.error('Error al crear caja:', error)
      return { success: false, error: error.response?.data?.message || 'Error de conexión' }
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/cajas/${id}`, data)
      return { success: true, data: response.data?.data || response.data }
    } catch (error) {
      console.error(`Error al actualizar caja ${id}:`, error)
      return { success: false, error: error.response?.data?.message || 'Error de conexión' }
    }
  },

  delete: async (id) => {
    try {
      await api.delete(`/cajas/${id}`)
      return { success: true }
    } catch (error) {
      console.error(`Error al eliminar caja ${id}:`, error)
      return { success: false, error: error.response?.data?.message || 'Error de conexión' }
    }
  },

  getTiposComprobante: async () => {
    try {
      const response = await api.get('/tipos-comprobante')
      return { success: true, data: response.data?.data || response.data || [] }
    } catch (error) {
      console.error('Error al obtener tipos de comprobante:', error)
      return { success: false, data: [] }
    }
  }
}
