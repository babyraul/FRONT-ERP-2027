import api from '../../../utils/api'

export const rolController = {
  getAll: async () => {
    try {
      const response = await api.get('/roles')
      return { success: true, data: response.data?.data || response.data || [] }
    } catch (error) {
      console.error('Error al obtener roles:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/roles/${id}`)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error al obtener rol:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  create: async (data) => {
    try {
      const response = await api.post('/roles', data)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error al crear rol:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/roles/${id}`, data)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error al actualizar rol:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  delete: async (id) => {
    try {
      await api.delete(`/roles/${id}`)
      return { success: true }
    } catch (error) {
      console.error('Error al eliminar rol:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  getPermisos: async (id) => {
    try {
      const response = await api.get(`/roles/${id}/permisos`)
      return { success: true, data: response.data?.data || [] }
    } catch (error) {
      console.error('Error al obtener permisos del rol:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  assignPermisos: async (id, permisosIds) => {
    try {
      const response = await api.post(`/roles/${id}/permisos`, { permisosIds })
      return { success: true, message: response.data?.message }
    } catch (error) {
      console.error('Error al asignar permisos al rol:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  }
}
