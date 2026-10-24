import api from '../../../utils/api'

export const venderController = {
  // Consultar RENIEC / SUNAT por DNI o RUC
  consultarDocumento: async (tipo, numero) => {
    try {
      const docTipo = tipo.toLowerCase() === '6' || tipo.toLowerCase() === 'ruc' ? 'ruc' : 'dni'
      const response = await api.get(`/utils/consulta-documento/${docTipo}/${numero}`)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error al consultar documento:', error)
      return {
        success: false,
        message: error.response?.data?.error || error.response?.data?.message || 'No se encontró información del documento'
      }
    }
  },

  // Buscar clientes en la base de datos local
  buscarClientes: async (q = '') => {
    try {
      const response = await api.get('/clientes', { params: { q: q.trim() } })
      return { success: true, data: response.data?.data || response.data || [] }
    } catch (error) {
      console.error('Error al buscar clientes:', error)
      return { success: false, data: [] }
    }
  },

  // Crear preventa
  crearPreventa: async (preventaData) => {
    try {
      const response = await api.post('/gespreventas', preventaData)
      return { success: true, data: response.data?.data || response.data }
    } catch (error) {
      console.error('Error al crear preventa:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al registrar pre-venta'
      }
    }
  },

  // Actualizar preventa
  actualizarPreventa: async (id, preventaData) => {
    try {
      const response = await api.put(`/gespreventas/${id}`, preventaData)
      return { success: true, data: response.data?.data || response.data }
    } catch (error) {
      console.error('Error al actualizar preventa:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al actualizar pre-venta'
      }
    }
  },

  // Registrar venta
  registrarVenta: async (ventaData) => {
    try {
      const response = await api.post('/vender', ventaData)
      return { success: true, data: response.data?.data || response.data }
    } catch (error) {
      console.error('Error al registrar venta:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al procesar la venta'
      }
    }
  }
}
