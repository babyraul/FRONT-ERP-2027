import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: { nombre: 'Admin', rol: 'admin', email: 'admin@sistemmarket.pe' },
      token: null,
      isAuthenticated: true, // set to false in production

      login: (userData, token) =>
        set({ user: userData, token, isAuthenticated: true }),

      logout: () =>
        set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)
