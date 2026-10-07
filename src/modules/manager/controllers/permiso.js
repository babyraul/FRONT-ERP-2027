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
  }
}
