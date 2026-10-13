import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../utils/api'

/**
 * Store global de Factores de Conversión (tipo_factores)
 * 
 * Gestiona factores globales del sistema para manejo de enteros (centimos / submúltiplos):
 * - PRECIO: Factor para multiplicar/dividir el precio unitario (default: 100)
 * - VOLUMEN: Factor para multiplicar/dividir el volumen o cantidad (default: 1000000)
 */
export const useFactoresStore = create(
  persist(
    (set, get) => ({
      factores: [],
      factorPrecio: 100,      // Factor default PRECIO
      factorVolumen: 1000000, // Factor default VOLUMEN
      loading: false,
      loaded: false,
      error: null,

      fetchFactores: async () => {
        set({ loading: true, error: null })
        try {
          const res = await api.get('/tipos-factores')
          const data = res.data?.data || res.data || []
          
          let factorPrecio = 100
          let factorVolumen = 1000000

          if (Array.isArray(data)) {
            const rowPrecio = data.find(f => f.codigo === 'PRECIO')
            const rowVolumen = data.find(f => f.codigo === 'VOLUMEN')
            if (rowPrecio?.valor) factorPrecio = Number(rowPrecio.valor)
            if (rowVolumen?.valor) factorVolumen = Number(rowVolumen.valor)
          }

          set({
            factores: data,
            factorPrecio,
            factorVolumen,
            loading: false,
            loaded: true
          })
          return { success: true, factorPrecio, factorVolumen }
        } catch (err) {
          console.error('Error al cargar factores del sistema:', err)
          set({
            error: err.response?.data?.message || err.message,
            loading: false
          })
          return { success: false, factorPrecio: get().factorPrecio, factorVolumen: get().factorVolumen }
        }
      },

      // Helpers para conversión de Precios
      // De visual (decimal, ej. S/ 10.50) a BD (entero/céntimos, ej. 1050)
      toPrecioInt: (valVisual) => {
        const factor = get().factorPrecio || 100
        const num = parseFloat(valVisual) || 0
        return Math.round(num * factor)
      },

      // De BD (entero/céntimos, ej. 1050) a visual (decimal, ej. 10.50)
      toPrecioVisual: (valInt) => {
        const factor = get().factorPrecio || 100
        const num = parseFloat(valInt) || 0
        return num / factor
      },

      // Helpers para conversión de Cantidad / Volumen
      // De visual (ej. 1.5 unidades/kg) a BD (ej. 1500000)
      toVolumenInt: (valVisual) => {
        const factor = get().factorVolumen || 1000000
        const num = parseFloat(valVisual) || 0
        return Math.round(num * factor)
      },

      // De BD (ej. 1500000) a visual (ej. 1.5)
      toVolumenVisual: (valInt) => {
        const factor = get().factorVolumen || 1000000
        const num = parseFloat(valInt) || 0
        return num / factor
      }
    }),
    {
      name: 'erp-factores-storage',
      partialize: (state) => ({
        factores: state.factores,
        factorPrecio: state.factorPrecio,
        factorVolumen: state.factorVolumen,
        loaded: state.loaded
      })
    }
  )
)

export default useFactoresStore
