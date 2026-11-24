import api from '../../../utils/api'

const notificacionesController = {
  listar: async (params = {}) => {
    try {
      const res = await api.get('/notificaciones', { params })
      return { success: true, data: res.data?.data || [] }
    } catch (error) {
      return { success: false, data: [], error: error.response?.data?.message || 'Error al listar notificaciones' }
    }
  },

  resumen: async () => {
    try {
      const res = await api.get('/notificaciones/resumen')
      return { success: true, data: res.data?.data || { no_leidas: 0, ultimas: [] } }
    } catch (error) {
      return { success: false, data: { no_leidas: 0, ultimas: [] }, error: error.response?.data?.message }
    }
  },

  marcarLeida: async (id) => {
    try {
      const res = await api.post(`/notificaciones/${id}/marcar-leida`)
      return { success: true, data: res.data?.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Error al marcar notificación' }
    }
  },

  marcarTodasLeidas: async () => {
    try {
      const res = await api.post('/notificaciones/marcar-todas-leidas')
      return { success: true, data: res.data?.data }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Error al marcar notificaciones' }
    }
  }
}

export default notificacionesController
