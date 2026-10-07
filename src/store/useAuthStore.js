import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../utils/api'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      menu: [],

      login: async (usuario, password) => {
        try {
          const response = await api.post('/auth/login', { usuario, password })
          const { access_token, user } = response.data
          set({ user, token: access_token, isAuthenticated: true })
          return { success: true }
        } catch (error) {
          console.error('Error de login:', error)
          const errorMsg = error.response?.data?.message || 'Error de conexión'
          return { success: false, message: errorMsg }
        }
      },

      fetchMenu: async () => {
        try {
          const response = await api.get('/auth/menu')
          set({ menu: response.data || [] })
          return { success: true, data: response.data }
        } catch (error) {
          console.error('Error fetching menu:', error)
          return { success: false }
        }
      },

      logout: () => {
        // Opcional: podrías hacer un api.post('/auth/logout') aquí
        set({ user: null, token: null, isAuthenticated: false, menu: [] })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)
