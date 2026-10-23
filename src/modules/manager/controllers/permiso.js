import api from '../../../utils/api'

export const permisoController = {
  getAll: async () => {
    try {
      const response = await api.get('/permisos')
      return { success: true, data: response.data?.data || response.data || [] }
    } catch (error) {
      console.error('Error al obtener permisos:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  create: async (payload) => {
    try {
      const response = await api.post('/permisos', payload)
      return { success: true, data: response.data?.data || response.data }
    } catch (error) {
      console.error('Error al crear permiso:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  update: async (id, payload) => {
    try {
      const response = await api.put(`/permisos/${id}`, payload)
      return { success: true, data: response.data?.data || response.data }
    } catch (error) {
      console.error('Error al actualizar permiso:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  delete: async (id) => {
    try {
      await api.delete(`/permisos/${id}`)
      return { success: true }
    } catch (error) {
      console.error('Error al eliminar permiso:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  }
}
