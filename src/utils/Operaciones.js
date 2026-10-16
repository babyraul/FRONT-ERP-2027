/**
 * Utilidad global de cálculos matemáticos de facturación y ventas (Operaciones.js).
 * Centraliza las fórmulas de cálculo de subtotal, IGV (18%) y total.
 * Sin redondeo de ajuste (descarta redondeos arbitrarios).
 */

export const TASA_IGV = 0.18

/**
 * Calcula los totales de una lista de ítems de venta / preventa.
 * @param {Array} items - Lista de ítems con { cantidad, precio_unitario, descuento }
 * @returns {{ subtotal: number, gravado: number, igv: number, total: number }}
 */
export function calcularTotalesVenta(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      subtotal: 0.00,
      gravado: 0.00,
      igv: 0.00,
      total: 0.00
    }
  }

  // Sumatoria directa de ítems: (cantidad * precio_unitario) - descuento
  const rawTotal = items.reduce((sum, item) => {
    const cant = Number(item.cantidad || 0)
    const precio = Number(item.precio_unitario || item.precio || 0)
    const desc = Number(item.descuento || 0)
    const sub = cant * precio - desc
    return sum + Math.max(0, sub)
  }, 0)

  // Total exacto a 2 decimales sin redondeo adicional
  const total = Number(rawTotal.toFixed(2))

  // Base imponible (gravado) = total / (1 + TASA_IGV)
  const gravado = Number((total / (1 + TASA_IGV)).toFixed(2))

  // IGV = total - gravado (exacto)
  const igv = Number((total - gravado).toFixed(2))

  return {
    subtotal: gravado,
    gravado,
    igv,
    total
  }
}

/**
 * Calcula el importe de un ítem individual.
 * @param {number} cantidad
 * @param {number} precioUnitario
 * @param {number} descuento
 * @returns {number}
 */
export function calcularSubtotalItem(cantidad = 0, precioUnitario = 0, descuento = 0) {
  const cant = Number(cantidad || 0)
  const precio = Number(precioUnitario || 0)
  const desc = Number(descuento || 0)
  const subtotal = Math.max(0, cant * precio - desc)
  return Number(subtotal.toFixed(2))
}

export default {
  TASA_IGV,
  calcularTotalesVenta,
  calcularSubtotalItem
}
