import api from '../../../utils/api.js'

export const ventaController = {
  // Obtener listado de ventas con filtros (fecha_inicio, fecha_fin, cliente_id, estado, tipo_documento, q)
  getVentas: async (params = {}) => {
    try {
      const response = await api.get('/listventas', { params }).catch(() => api.get('/ventas', { params }))
      return {
        success: true,
        data: response.data?.data || response.data || [],
        total: response.data?.total
      }
    } catch (error) {
      console.error('Error al obtener ventas:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al obtener ventas',
        data: []
      }
    }
  },

  // Obtener detalle de una venta por ID
  getVentaById: async (id) => {
    try {
      const response = await api.get(`/listventas/${id}`).catch(() => api.get(`/ventas/${id}`))
      return {
        success: true,
        data: response.data?.data || response.data
      }
    } catch (error) {
      console.error(`Error al obtener venta ${id}:`, error)
      return {
        success: false,
        message: error.response?.data?.message || error.message
      }
    }
  },

  // Obtener listado de preventas (tabla pre_ventas)
  getPreventas: async (params = {}) => {
    try {
      const response = await api.get('/gespreventas', { params })
      return {
        success: true,
        data: response.data?.data || response.data || [],
        total: response.data?.total
      }
    } catch (error) {
      console.error('Error al obtener preventas:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al obtener preventas',
        data: []
      }
    }
  },

  // Obtener detalle de preventa por ID
  getPreventaById: async (id) => {
    try {
      const response = await api.get(`/gespreventas/${id}`)
      return {
        success: true,
        data: response.data?.data || response.data
      }
    } catch (error) {
      console.error(`Error al obtener preventa ${id}:`, error)
      return {
        success: false,
        message: error.response?.data?.message || error.message
      }
    }
  },

  // Anular pre-venta
  anularPreventa: async (id) => {
    try {
      const response = await api.delete(`/gespreventas/${id}`)
      return {
        success: true,
        message: response.data?.message || 'Pre-venta anulada correctamente'
      }
    } catch (error) {
      console.error(`Error al anular preventa ${id}:`, error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al anular pre-venta'
      }
    }
  },

  // Anular venta
  anularVenta: async (id, motivo = '') => {
    try {
      const response = await api.post(`/ventas/${id}/anular`, { motivo })
      return {
        success: true,
        message: response.data?.message || 'Venta anulada correctamente'
      }
    } catch (error) {
      console.error(`Error al anular venta ${id}:`, error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al anular venta'
      }
    }
  }
}
