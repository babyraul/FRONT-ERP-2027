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
  }
}
