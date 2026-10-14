import api from '../../../utils/api'

export const proveedorController = {
  // Obtener todos los proveedores
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/proveedores', { params })
      return { success: true, data: response.data?.data || response.data || [] }
    } catch (error) {
      console.error('Error al obtener proveedores:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Obtener un proveedor por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/proveedores/${id}`)
      return { success: true, data: response.data?.data || response.data }
    } catch (error) {
      console.error('Error al obtener proveedor:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Crear un nuevo proveedor
  create: async (data) => {
    try {
      const response = await api.post('/proveedores', data)
      return { success: true, data: response.data?.data || response.data, message: response.data?.message }
    } catch (error) {
      console.error('Error al crear proveedor:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Actualizar un proveedor existente
  update: async (id, data) => {
    try {
      const response = await api.put(`/proveedores/${id}`, data)
      return { success: true, data: response.data?.data || response.data, message: response.data?.message }
    } catch (error) {
      console.error('Error al actualizar proveedor:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Eliminar (inactivar) un proveedor
  delete: async (id) => {
    try {
      const response = await api.delete(`/proveedores/${id}`)
      return { success: true, message: response.data?.message }
    } catch (error) {
      console.error('Error al eliminar proveedor:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  }
}
