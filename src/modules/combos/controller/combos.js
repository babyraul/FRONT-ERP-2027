import api from '../../../utils/api'

export const combosService = {
  fetchAll: async (params = {}) => {
    try {
      const response = await api.get('/combos', { params })
      const data = response.data?.data || response.data || []
      return { success: true, data }
    } catch (error) {
      console.error('Error al obtener combos:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'No se pudo obtener el listado de combos.',
        data: []
      }
    }
  },

  fetchDetail: async (id) => {
    try {
      const response = await api.get(`/combos/${id}`)
      return { success: true, data: response.data?.data || response.data }
    } catch (error) {
      console.error(`Error al obtener detalle del combo ${id}:`, error)
      return {
        success: false,
        error: error.response?.data?.message || 'No se pudo obtener el detalle del combo.'
      }
    }
  },

  create: async (payload) => {
    try {
      const response = await api.post('/combos', payload)
      return { success: true, data: response.data?.data || response.data, message: response.data?.message }
    } catch (error) {
      console.error('Error al crear combo:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'No se pudo registrar el combo. Inténtalo otra vez.'
      }
    }
  },

  update: async (id, payload) => {
    try {
      const response = await api.put(`/combos/${id}`, payload)
      return { success: true, data: response.data?.data || response.data, message: response.data?.message }
    } catch (error) {
      console.error(`Error al actualizar combo ${id}:`, error)
      return {
        success: false,
        error: error.response?.data?.message || 'No se pudo registrar el combo. Inténtalo otra vez.'
      }
    }
  },

  toggleState: async (id, nuevoEstado) => {
    try {
      const response = await api.patch(`/combos/${id}`, { Estado: nuevoEstado })
      return { success: true, data: response.data, message: response.data?.message }
    } catch (error) {
      console.error(`Error al alternar estado del combo ${id}:`, error)
      return {
        success: false,
        error: error.response?.data?.message || 'Error al cambiar estado del combo.'
      }
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/combos/${id}`)
      return { success: true, message: response.data?.message }
    } catch (error) {
      console.error(`Error al eliminar combo ${id}:`, error)
      return {
        success: false,
        error: error.response?.data?.message || 'Error al eliminar el combo.'
      }
    }
  },

  buscarProductos: async (query) => {
    try {
      const response = await api.get('/productos', { params: { q: query, activo: true } })
      const prods = response.data?.data || response.data || []
      // Desglosar por presentaciones seleccionables (excluyendo otros combos)
      const options = []
      prods.forEach((prod) => {
        if (prod.es_combo) return // No permitir anidar combos en combos según contrato legacy
        if (Array.isArray(prod.presentaciones) && prod.presentaciones.length > 0) {
          prod.presentaciones.forEach((pres) => {
            if (pres.activo !== false) {
              options.push({
                ...pres,
                IdPresentacion: pres.id,
                label: `${prod.nombre} - ${pres.nombre} (Stock: ${pres.stock_actual ?? 0})`,
                value: pres.id,
                producto_id: prod.id,
                producto_nombre: prod.nombre,
                presentacion_nombre: pres.nombre,
                precio: Number(pres.precio_venta || 0),
                precio_costo: Number(pres.precio_costo || 0),
                PrecioCosto: Number(pres.precio_costo || 0),
                stock: pres.stock_actual ?? 0
              })
            }
          })
        }
      })
      return { success: true, data: options }
    } catch (error) {
      console.error('Error al buscar productos para combo:', error)
      return { success: false, data: [], error: 'No se puede buscar el producto.' }
    }
  }
}
