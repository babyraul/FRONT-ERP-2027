import api from '../../../utils/api'

export const cajaController = {
  // ── 1. GESTIÓN DE TURNOS (caja_turnos) Y TOTALES (caja_totales) ──

  // Obtener historial de turnos con filtros
  getTurnos: async (params = {}) => {
    try {
      const response = await api.get('/cajas/turnos', { params })
      return { success: true, data: response.data?.data || [] }
    } catch (error) {
      console.error('Error al obtener turnos:', error)
      return { success: false, error: error.response?.data?.message || 'Error al obtener turnos' }
    }
  },

  // Obtener el turno actualmente ABIERTO
  getTurnoActivo: async () => {
    try {
      const response = await api.get('/cajas/turnos/activo')
      return { success: true, data: response.data?.data || null, message: response.data?.message }
    } catch (error) {
      console.error('Error al obtener turno activo:', error)
      return { success: false, error: error.response?.data?.message || 'Error al obtener turno activo' }
    }
  },

  // Detalle de un turno por ID
  getTurnoDetalle: async (id) => {
    try {
      const response = await api.get(`/cajas/turnos/${id}`)
      return { success: true, data: response.data?.data }
    } catch (error) {
      console.error(`Error al obtener turno ${id}:`, error)
      return { success: false, error: error.response?.data?.message || 'Error al obtener turno' }
    }
  },

  // Aperturar nuevo turno
  aperturarTurno: async (data) => {
    try {
      const response = await api.post('/cajas/turnos/apertura', data)
      return { success: true, data: response.data?.data, message: response.data?.message }
    } catch (error) {
      console.error('Error al aperturar turno:', error)
      return { success: false, error: error.response?.data?.message || 'Error al aperturar turno' }
    }
  },

  // Cerrar turno
  cerrarTurno: async (id, data) => {
    try {
      const response = await api.post(`/cajas/turnos/${id}/cierre`, data)
      return { success: true, data: response.data?.data, message: response.data?.message }
    } catch (error) {
      console.error(`Error al cerrar turno ${id}:`, error)
      return { success: false, error: error.response?.data?.message || 'Error al cerrar turno' }
    }
  },

  // ── 2. CAJAS FÍSICAS Y SERIES (caja_serie_correlativo) ──

  // Obtiene cajas agrupadas por identificador_caja con disponibilidad
  getCajasConfiguradas: async () => {
    try {
      const response = await api.get('/cajas/configuradas')
      return { success: true, data: response.data?.data || [] }
    } catch (error) {
      console.error('Error al obtener cajas configuradas:', error)
      return { success: false, data: [] }
    }
  },

  // Obtiene lista plana de series y correlativos
  getSeriesCajas: async () => {
    try {
      const response = await api.get('/cajas')
      return { success: true, data: response.data?.data || response.data || [] }
    } catch (error) {
      console.error('Error al obtener series de cajas:', error)
      return { success: false, error: error.response?.data?.message || 'Error de conexión' }
    }
  },

  // ── 3. MOVIMIENTOS DE CAJA (caja_movimientos) ──
  getMovimientos: async (turnoId) => {
    try {
      const response = await api.get(`/cajas/turnos/${turnoId}/movimientos`)
      return { success: true, data: response.data?.data || [] }
    } catch (error) {
      console.error('Error al obtener movimientos:', error)
      return { success: false, data: [] }
    }
  },

  createMovimiento: async (turnoId, data) => {
    try {
      const response = await api.post(`/cajas/turnos/${turnoId}/movimientos`, data)
      return { success: true, data: response.data?.data, message: response.data?.message }
    } catch (error) {
      console.error('Error al crear movimiento:', error)
      return { success: false, error: error.response?.data?.message || 'Error al registrar movimiento' }
    }
  },

  // ── 4. ARQUEOS DE CAJA POR DENOMINACIÓN (caja_arqueos) ──
  getArqueo: async (turnoId) => {
    try {
      const response = await api.get(`/cajas/turnos/${turnoId}/arqueos`)
      return { success: true, data: response.data?.data || { detalles: [], total_arqueo: 0 } }
    } catch (error) {
      console.error('Error al obtener arqueo:', error)
      return { success: false, data: { detalles: [], total_arqueo: 0 } }
    }
  },

  saveArqueo: async (turnoId, data) => {
    try {
      const response = await api.post(`/cajas/turnos/${turnoId}/arqueos`, data)
      return { success: true, data: response.data?.data, message: response.data?.message }
    } catch (error) {
      console.error('Error al guardar arqueo:', error)
      return { success: false, error: error.response?.data?.message || 'Error al guardar arqueo' }
    }
  },

  // ── 5. CATÁLOGOS AUXILIARES ──
  getMetodosPago: async () => {
    try {
      const response = await api.get('/tipos-metodo-pago')
      return { success: true, data: response.data?.data || response.data || [] }
    } catch (error) {
      console.error('Error al obtener métodos de pago:', error)
      return { success: false, data: [] }
    }
  }
}
