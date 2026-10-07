import api from '../../../utils/api'

export const almacenController = {
  // Obtener todos los almacenes
  getAll: async () => {
    try {
      const response = await api.get('/almacenes')
      return { success: true, data: response.data?.data || response.data || [] }
    } catch (error) {
      console.error('Error al obtener almacenes:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Obtener almacen por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/almacenes/${id}`)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error al obtener almacen:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Crear almacen
  create: async (almacenData) => {
    try {
      const response = await api.post('/almacenes', almacenData)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error al crear almacen:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Actualizar almacen
  update: async (id, almacenData) => {
    try {
      const response = await api.put(`/almacenes/${id}`, almacenData)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error al actualizar almacen:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Eliminar almacen
  delete: async (id) => {
    try {
      await api.delete(`/almacenes/${id}`)
      return { success: true }
    } catch (error) {
      console.error('Error al eliminar almacen:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  }
}
