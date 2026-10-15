import { create } from 'zustand'

export const useVentaActivaStore = create((set, get) => ({
  tipoDocumento: 'boleta', // 'factura', 'boleta', 'vale'
  cliente: {
    id: 'varios',
    tipo_documento_id: '0',
    numero_documento: '99999999',
    nombre_razon_social: 'VARIOS'
  },
  placa: '',
  cartItems: [],

  setTipoDocumento: (tipoDocumento) => set({ tipoDocumento }),
  setCliente: (cliente) => set({ cliente }),
  setPlaca: (placa) => set({ placa }),
  setCartItems: (cartItems) => set({ cartItems }),

  agregarItem: (item) => {
    const current = get().cartItems
    const idx = current.findIndex((i) => i.uniqueId === item.uniqueId)
    if (idx >= 0) {
      const updated = [...current]
      updated[idx].cantidad = Number((updated[idx].cantidad + 1).toFixed(2))
      set({ cartItems: updated })
    } else {
      set({
        cartItems: [
          ...current,
          {
            ...item,
            cantidad: 1,
            descuento: 0,
            precio_unitario: item.precio,
            tarifa: 'menor'
          }
        ]
      })
    }
  },

  updateCantidad: (uniqueId, cantidad) => {
    set({
      cartItems: get().cartItems.map((item) =>
        item.uniqueId === uniqueId ? { ...item, cantidad: Math.max(0.01, cantidad) } : item
      )
    })
  },

  updatePrecio: (uniqueId, precio_unitario) => {
    set({
      cartItems: get().cartItems.map((item) =>
        item.uniqueId === uniqueId ? { ...item, precio_unitario: Math.max(0, precio_unitario) } : item
      )
    })
  },

  updateDescuento: (uniqueId, descuento) => {
    set({
      cartItems: get().cartItems.map((item) =>
        item.uniqueId === uniqueId ? { ...item, descuento: Math.max(0, descuento) } : item
      )
    })
  },

  updateTarifa: (uniqueId, tarifa) => {
    set({
      cartItems: get().cartItems.map((item) => {
        if (item.uniqueId !== uniqueId) return item
        let nuevoPrecio = item.precio
        if (tarifa === 'mayor' && item.precio_mayor > 0) {
          nuevoPrecio = item.precio_mayor
        } else if (tarifa === 'especial' && item.precio_especial > 0) {
          nuevoPrecio = item.precio_especial
        }
        return { ...item, tarifa, precio_unitario: nuevoPrecio }
      })
    })
  },

  removeItem: (uniqueId) => {
    set({ cartItems: get().cartItems.filter((item) => item.uniqueId !== uniqueId) })
  },

  clearVenta: () => {
    set({
      cartItems: [],
      placa: '',
      cliente: {
        id: 'varios',
        tipo_documento_id: '0',
        numero_documento: '99999999',
        nombre_razon_social: 'VARIOS'
      }
    })
  },

  getTotales: () => {
    const items = get().cartItems
    const rawTotal = items.reduce((sum, item) => {
      const lineSub = Number(item.cantidad) * Number(item.precio_unitario) - Number(item.descuento || 0)
      return sum + Math.max(0, lineSub)
    }, 0)

    const total = Math.round(rawTotal * 100) / 100
    const gravado = Math.round((total / 1.18) * 100) / 100
    const igv = Math.round((total - gravado) * 100) / 100
    const redondeo = Math.round((rawTotal - total) * 100) / 100

    return {
      gravado,
      igv,
      redondeo: Math.abs(redondeo),
      total
    }
  }
}))
