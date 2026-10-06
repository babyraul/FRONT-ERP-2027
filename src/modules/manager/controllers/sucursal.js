import api from '../../../utils/api'

export const sucursalController = {
  // Obtener todas las sucursales
  getAll: async () => {
    try {
      const response = await api.get('/sucursales')
      return { success: true, data: response.data?.data || response.data || [] }
    } catch (error) {
      console.error('Error al obtener sucursales:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Obtener sucursal por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/sucursales/${id}`)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error al obtener sucursal:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Crear sucursal
  create: async (sucursalData) => {
    try {
      const response = await api.post('/sucursales', sucursalData)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error al crear sucursal:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Actualizar sucursal
  update: async (id, sucursalData) => {
    try {
      const response = await api.put(`/sucursales/${id}`, sucursalData)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error al actualizar sucursal:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Eliminar sucursal
  delete: async (id) => {
    try {
      await api.delete(`/sucursales/${id}`)
      return { success: true }
    } catch (error) {
      console.error('Error al eliminar sucursal:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  }
}
