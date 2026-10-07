import api from '../../../utils/api'

export const empresaController = {
  // Obtener todas las empresas
  getAll: async () => {
    try {
      const response = await api.get('/empresas')
      // Devuelve la data o array vacío en caso de error en la estructura
      return { success: true, data: response.data?.data || response.data || [] }
    } catch (error) {
      console.error('Error al obtener empresas:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Obtener una empresa por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/empresas/${id}`)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error al obtener empresa:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Crear una nueva empresa
  create: async (empresaData) => {
    try {
      const response = await api.post('/empresas', empresaData)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error al crear empresa:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Actualizar empresa existente
  update: async (id, empresaData) => {
    try {
      const response = await api.put(`/empresas/${id}`, empresaData)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error al actualizar empresa:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Eliminar empresa
  delete: async (id) => {
    try {
      await api.delete(`/empresas/${id}`)
      return { success: true }
    } catch (error) {
      console.error('Error al eliminar empresa:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Obtener modulos asignados a una empresa
  getModulos: async (id) => {
    try {
      const response = await api.get(`/empresas/${id}/modulos`)
      return { success: true, data: response.data?.data || [] }
    } catch (error) {
      console.error('Error al obtener modulos de la empresa:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  },

  // Asignar modulos a una empresa
  assignModulos: async (id, modulosIds) => {
    try {
      const response = await api.post(`/empresas/${id}/modulos`, { modulosIds })
      return { success: true, message: response.data?.message }
    } catch (error) {
      console.error('Error al asignar modulos a la empresa:', error)
      return { success: false, message: error.response?.data?.message || error.message }
    }
  }
}
