import api from '../../../utils/api'

export const usuarioController = {
  getAll: async (params = {}) => {
    try {
      const { data } = await api.get('/usuarios', { params })
      return { success: true, data: data.data || data }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error al obtener usuarios' }
    }
  },

  getById: async (id) => {
    try {
      const { data } = await api.get(`/usuarios/${id}`)
      return { success: true, data: data.data || data }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error al obtener usuario' }
    }
  },

  create: async (payload) => {
    try {
      const { data } = await api.post('/usuarios', payload)
      return { success: true, data: data.data || data }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error al crear usuario' }
    }
  },

  update: async (id, payload) => {
    try {
      const { data } = await api.put(`/usuarios/${id}`, payload)
      return { success: true, data: data.data || data }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error al actualizar usuario' }
    }
  },

  delete: async (id) => {
    try {
      const { data } = await api.delete(`/usuarios/${id}`)
      return { success: true, data: data.data || data }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error al eliminar usuario' }
    }
  },

  // --- Accesos (usuario_accesos) ---

  getAccesos: async (userId) => {
    try {
      const { data } = await api.get(`/usuarios/${userId}/accesos`)
      return { success: true, data: data.data || data }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error al obtener accesos' }
    }
  },

  addAcceso: async (userId, payload) => {
    try {
      const { data } = await api.post(`/usuarios/${userId}/accesos`, payload)
      return { success: true, data: data.data || data }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error al asignar acceso' }
    }
  },

  updateAcceso: async (userId, accesoId, payload) => {
    try {
      const { data } = await api.put(`/usuarios/${userId}/accesos/${accesoId}`, payload)
      return { success: true, data: data.data || data }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error al actualizar acceso' }
    }
  },

  deleteAcceso: async (userId, accesoId) => {
    try {
      const { data } = await api.delete(`/usuarios/${userId}/accesos/${accesoId}`)
      return { success: true, data: data.data || data }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error al remover acceso' }
    }
  }
}
