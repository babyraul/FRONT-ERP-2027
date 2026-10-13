import api from './api'

/**
 * Cliente centralizado para Tablas Fijas y Catálogos Maestros (SUNAT / Sistema)
 * 
 * Endpoints públicos para usuarios autenticados sin requerir permisos RBAC dinámicos.
 */
export const tablasFijasService = {
  // Tipos de Comprobante (Factura: 01, Boleta: 03, Nota Crédito: 07, etc.)
  getTiposComprobante: async () => {
    try {
      const { data } = await api.get('/tipos-comprobante')
      return { success: true, data: data.data || data || [] }
    } catch (error) {
      console.error('Error al obtener tipos de comprobante:', error)
      return { success: false, data: [] }
    }
  },

  // Tipos de Documento de Identidad (DNI: 1, RUC: 6, Pasaporte: 7, etc.)
  getTiposDocumento: async () => {
    try {
      const { data } = await api.get('/tipos-documento')
      return { success: true, data: data.data || data || [] }
    } catch (error) {
      console.error('Error al obtener tipos de documento:', error)
      return { success: false, data: [] }
    }
  },

  // Tipos de Afectación al IGV (Gravado: 10, Exonerado: 20, Inafecto: 30, etc.)
  getTiposAfectacionIgv: async () => {
    try {
      const { data } = await api.get('/tipos-afectacion-igv')
      return { success: true, data: data.data || data || [] }
    } catch (error) {
      console.error('Error al obtener tipos de afectación IGV:', error)
      return { success: false, data: [] }
    }
  },

  // Unidades de Medida SUNAT (NIU: Unidad, KGM: Kilogramos, LTR: Litros, etc.)
  getTiposUnidadesMedida: async () => {
    try {
      const { data } = await api.get('/tipos-unidades-medida')
      return { success: true, data: data.data || data || [] }
    } catch (error) {
      console.error('Error al obtener unidades de medida:', error)
      return { success: false, data: [] }
    }
  },

  // Monedas (PEN: Soles, USD: Dólares, EUR: Euros)
  getTiposMoneda: async () => {
    try {
      const { data } = await api.get('/tipos-moneda')
      return { success: true, data: data.data || data || [] }
    } catch (error) {
      console.error('Error al obtener tipos de moneda:', error)
      return { success: false, data: [] }
    }
  },

  // Métodos de Pago (Efectivo, Yape, Plin, Transferencia, Tarjeta, etc.)
  getTiposMetodoPago: async () => {
    try {
      const { data } = await api.get('/tipos-metodo-pago')
      return { success: true, data: data.data || data || [] }
    } catch (error) {
      console.error('Error al obtener métodos de pago:', error)
      return { success: false, data: [] }
    }
  },

  // Condición / Tipo de Pago (1: Contado, 2: Crédito)
  getTiposPago: async () => {
    try {
      const { data } = await api.get('/tipos-pago')
      return { success: true, data: data.data || data || [] }
    } catch (error) {
      console.error('Error al obtener tipos de pago:', error)
      return { success: false, data: [] }
    }
  },

  // Tipos de Operación SUNAT (0101: Venta interna, Exportación, etc.)
  getTiposOperacion: async () => {
    try {
      const { data } = await api.get('/tipos-operacion')
      return { success: true, data: data.data || data || [] }
    } catch (error) {
      console.error('Error al obtener tipos de operación:', error)
      return { success: false, data: [] }
    }
  },

  // Tipos de Tributos (1000: IGV, 2000: ISC, etc.)
  getTiposTributos: async () => {
    try {
      const { data } = await api.get('/tipos-tributos')
      return { success: true, data: data.data || data || [] }
    } catch (error) {
      console.error('Error al obtener tipos de tributos:', error)
      return { success: false, data: [] }
    }
  },

  // Tipos de Existencia (01: Mercaderías, 02: Materias Primas, etc.)
  getTiposExistencia: async () => {
    try {
      const { data } = await api.get('/tipos-existencia')
      return { success: true, data: data.data || data || [] }
    } catch (error) {
      console.error('Error al obtener tipos de existencia:', error)
      return { success: false, data: [] }
    }
  },

  // Impuestos del Sistema (IGV 18%, ICBPER, etc.)
  getTiposImpuesto: async () => {
    try {
      const { data } = await api.get('/tipos-impuesto')
      return { success: true, data: data.data || data || [] }
    } catch (error) {
      console.error('Error al obtener impuestos:', error)
      return { success: false, data: [] }
    }
  },

  // Factores y porcentajes configurados
  getTiposFactores: async () => {
    try {
      const { data } = await api.get('/tipos-factores')
      return { success: true, data: data.data || data || [] }
    } catch (error) {
      console.error('Error al obtener factores:', error)
      return { success: false, data: [] }
    }
  },

  // Tipos de Stock
  getTiposStock: async () => {
    try {
      const { data } = await api.get('/tipos-stock')
      return { success: true, data: data.data || data || [] }
    } catch (error) {
      console.error('Error al obtener tipos de stock:', error)
      return { success: false, data: [] }
    }
  },

  // Motivos de Traslado (01: Venta, 02: Compra, 04: Traslado entre almacenes, etc.)
  getTiposMotivoTraslado: async () => {
    try {
      const { data } = await api.get('/tipos-motivo-traslado')
      return { success: true, data: data.data || data || [] }
    } catch (error) {
      console.error('Error al obtener motivos de traslado:', error)
      return { success: false, data: [] }
    }
  },

  // Códigos de Detracción SUNAT
  getTiposDetraccion: async () => {
    try {
      const { data } = await api.get('/tipos-detraccion')
      return { success: true, data: data.data || data || [] }
    } catch (error) {
      console.error('Error al obtener tipos de detracción:', error)
      return { success: false, data: [] }
    }
  },

  // Tipo de Cambio
  getTiposCambio: async () => {
    try {
      const { data } = await api.get('/tipos-cambio')
      return { success: true, data: data.data || data || [] }
    } catch (error) {
      console.error('Error al obtener tipos de cambio:', error)
      return { success: false, data: [] }
    }
  },

  // Categorías de productos (por sucursal/empresa)
  getCategorias: async () => {
    try {
      const { data } = await api.get('/categorias')
      return { success: true, data: data.data || data || [] }
    } catch (error) {
      console.error('Error al obtener categorías:', error)
      return { success: false, data: [] }
    }
  },

  // Subcategorías de productos
  getSubcategorias: async () => {
    try {
      const { data } = await api.get('/subcategorias')
      return { success: true, data: data.data || data || [] }
    } catch (error) {
      console.error('Error al obtener subcategorías:', error)
      return { success: false, data: [] }
    }
  }
}

export default tablasFijasService
