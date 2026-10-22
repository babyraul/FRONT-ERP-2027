import api from '../../../utils/api.js'

/**
 * Controlador de peticiones HTTP para el Módulo de Control de Stock y Kárdex
 * Consume los endpoints protegidos bajo /api/stock
 */
export const stockController = {
  /**
   * Obtiene el listado de productos con presentaciones desde stock_actual
   * @param {Object} params - Filtros opcionales: { almacen_id, categoria_id, estado_stock, q }
   */
  getStockActual: async (params = {}) => {
    try {
      const response = await api.get('/stock', { params })
      return {
        success: true,
        data: response.data?.data || [],
        almacenes: response.data?.almacenes || [],
        resumen: response.data?.resumen || {
          totalItems: 0,
          conStockPositivo: 0,
          sinStock: 0,
          conStockNegativo: 0,
          bajoStockMinimo: 0
        }
      }
    } catch (error) {
      console.error('Error al obtener stock actual:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al obtener el stock actual',
        data: [],
        almacenes: [],
        resumen: {
          totalItems: 0,
          conStockPositivo: 0,
          sinStock: 0,
          conStockNegativo: 0,
          bajoStockMinimo: 0
        }
      }
    }
  },

  /**
   * Obtiene el Kárdex histórico (tabla stock) de un producto y/o presentación
   * @param {Object} params - { producto_id, presentacion_id, almacen_id, tipo_mov, fecha_inicio, fecha_fin }
   */
  getKardex: async (params = {}) => {
    try {
      const response = await api.get('/stock/kardex', { params })
      return {
        success: true,
        data: response.data?.data || [],
        resumen: response.data?.resumen || {
          totalMovimientos: 0,
          totalEntradas: 0,
          totalSalidas: 0,
          saldoActual: 0
        }
      }
    } catch (error) {
      console.error('Error al obtener Kárdex del producto:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al consultar el Kárdex',
        data: [],
        resumen: {
          totalMovimientos: 0,
          totalEntradas: 0,
          totalSalidas: 0,
          saldoActual: 0
        }
      }
    }
  },

  /**
   * Registra un ajuste o movimiento manual en stock_actual y en la tabla histórica stock
   * @param {Object} payload - { producto_id, presentacion_id, almacen_id, tipo_mov (1=Entrada, 2=Salida), cantidad, documento, concepto }
   */
  registrarAjuste: async (payload) => {
    try {
      const response = await api.post('/stock/ajuste', payload)
      return {
        success: true,
        message: response.data?.message || 'Movimiento de stock registrado correctamente',
        data: response.data?.data
      }
    } catch (error) {
      console.error('Error al registrar movimiento de stock:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al registrar movimiento de stock'
      }
    }
  },

  /**
   * Reinicia masivamente a 0 el stock_actual y registra la regularización en la tabla stock
   * @param {Object} payload - { almacen_id, motivo, tipo_saldo }
   */
  reiniciarStockMasivo: async (payload = {}) => {
    try {
      const response = await api.post('/stock/reiniciar-masivo', payload)
      return {
        success: true,
        message: response.data?.message || 'Stock reiniciado correctamente',
        data: response.data?.data
      }
    } catch (error) {
      console.error('Error al reiniciar stock masivamente:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al reiniciar stock masivamente'
      }
    }
  },

  /**
   * Carga masiva de stock para presentaciones principales con cálculo de diferencias en kárdex
   * @param {Object} payload - { almacen_id, modo, motivo, items: [{ producto_id, presentacion_id, cantidad }] }
   */
  cargaMasivaStock: async (payload = {}) => {
    try {
      const response = await api.post('/stock/carga-masiva', payload)
      return {
        success: true,
        message: response.data?.message || 'Carga masiva completada exitosamente',
        data: response.data?.data
      }
    } catch (error) {
      console.error('Error al procesar carga masiva de stock:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al procesar la carga masiva de stock'
      }
    }
  }
}

export default stockController
