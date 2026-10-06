import api from '../../../utils/api'

export const moduloController = {
  // Obtener todos los módulos
  getAll: async () => {
    try {
      const response = await api.get('/modulos')
      return { success: true, data: response.data?.data || response.data || [] }
    } catch (error) {
      console.error('Error al obtener módulos:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Obtener módulo por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/modulos/${id}`)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error al obtener módulo:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Crear módulo
  create: async (moduloData) => {
    try {
      const response = await api.post('/modulos', moduloData)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error al crear módulo:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Actualizar módulo
  update: async (id, moduloData) => {
    try {
      const response = await api.put(`/modulos/${id}`, moduloData)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error al actualizar módulo:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Eliminar módulo
  delete: async (id) => {
    try {
      await api.delete(`/modulos/${id}`)
      return { success: true }
    } catch (error) {
      console.error('Error al eliminar módulo:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  }
}
