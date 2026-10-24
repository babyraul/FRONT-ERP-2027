import api from '../../../utils/api'

export const configuracionController = {
  // Obtener catálogo maestro de configuraciones
  getAll: async () => {
    try {
      const response = await api.get('/configuraciones')
      return { success: true, data: response.data?.data || response.data || [] }
    } catch (error) {
      console.error('Error al obtener configuraciones maestras:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Crear una nueva configuración maestra
  create: async (payload) => {
    try {
      const response = await api.post('/configuraciones', payload)
      return { success: true, data: response.data?.data || response.data }
    } catch (error) {
      console.error('Error al crear configuración:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Actualizar una configuración maestra
  update: async (id, payload) => {
    try {
      const response = await api.put(`/configuraciones/${id}`, payload)
      return { success: true, data: response.data?.data || response.data }
    } catch (error) {
      console.error('Error al actualizar configuración:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Eliminar una configuración maestra
  delete: async (id) => {
    try {
      await api.delete(`/configuraciones/${id}`)
      return { success: true }
    } catch (error) {
      console.error('Error al eliminar configuración:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  }
}
