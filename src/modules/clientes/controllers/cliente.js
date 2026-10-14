import api from '../../../utils/api'

export const clienteController = {
  // Obtener todos los clientes (con filtros opcionales q, tipo_documento_id, estado_credito)
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/clientes', { params })
      return { success: true, data: response.data?.data || response.data || [] }
    } catch (error) {
      console.error('Error al obtener clientes:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Obtener un cliente por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/clientes/${id}`)
      return { success: true, data: response.data?.data || response.data }
    } catch (error) {
      console.error(`Error al obtener cliente ${id}:`, error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Crear un nuevo cliente
  create: async (data) => {
    try {
      const response = await api.post('/clientes', data)
      return { success: true, data: response.data?.data || response.data, message: response.data?.message }
    } catch (error) {
      console.error('Error al crear cliente:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Actualizar un cliente existente
  update: async (id, data) => {
    try {
      const response = await api.put(`/clientes/${id}`, data)
      return { success: true, data: response.data?.data || response.data, message: response.data?.message }
    } catch (error) {
      console.error(`Error al actualizar cliente ${id}:`, error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Eliminar un cliente
  delete: async (id) => {
    try {
      const response = await api.delete(`/clientes/${id}`)
      return { success: true, message: response.data?.message }
    } catch (error) {
      console.error(`Error al eliminar cliente ${id}:`, error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  }
}
