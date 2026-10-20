/**
 * Utilidad global de cálculos matemáticos de facturación y ventas (Operaciones.js).
 * Centraliza las fórmulas de cálculo de subtotal, IGV (18%) y total.
 * Sin redondeo de ajuste (descarta redondeos arbitrarios).
 */

export const TASA_IGV = 0.18
export const MONTO_ICBPER = 0.30
export const FACTOR_MONETARIO = 1000

/**
 * Determina el tipo de clasificación fiscal a partir del código de afectación SUNAT.
 * 10-17: Gravadas
 * 20: Exonerada onerosa
 * 21: Exonerada gratuita
 * 30: Inafecta onerosa
 * 31-37: Inafecta gratuita
 * 40: Exportación
 * ICBPER: impuesto a bolsas plásticas
 */
export function getGrupoAfectacion(codigoAfectacion = '10') {
  const cod = String(codigoAfectacion || '10').trim()
  const num = parseInt(cod, 10)

  if (cod === '19' || cod === 'ICBPER') {
    return 'ICBPER'
  }
  if (num >= 11 && num <= 16) {
    return 'GRAVADA_GRATUITA'
  }
  if (num === 17) {
    return 'IVAP'
  }
  if (num === 10) {
    return 'GRAVADA'
  }
  if (num === 20) {
    return 'EXONERADA'
  }
  if (num === 21) {
    return 'EXONERADA_GRATUITA'
  }
  if (num === 30) {
    return 'INAFECTA'
  }
  if (num >= 31 && num <= 37) {
    return 'INAFECTA_GRATUITA'
  }
  if (num === 40) {
    return 'EXPORTACION'
  }
  return 'GRAVADA'
}

/**
 * Calcula los totales de una lista de ítems de venta / preventa separando bases fiscales.
 * Utiliza factor monetario 1000 para evitar micro-ruido de punto flotante sin redondeo tipo floor.
 * @param {Array} items - Lista de ítems con { cantidad, precio_unitario, descuento, tipo_afectacion_igv, es_gratuito, es_icbper }
 * @returns {{ subtotal: number, gravado: number, exonerado: number, inafecto: number, gratuito: number, icbper: number, igv: number, total: number }}
 */
export function calcularTotalesVenta(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      subtotal: 0.00,
      gravado: 0.00,
      exonerado: 0.00,
      inafecto: 0.00,
      gratuito: 0.00,
      icbper: 0.00,
      igv: 0.00,
      total: 0.00
    }
  }

  let gravadoTotalScaled = 0
  let exoneradoTotalScaled = 0
  let inafectoTotalScaled = 0
  let gratuitoTotalScaled = 0
  let icbperTotalScaled = 0

  items.forEach((item) => {
    const cant = Number(item.cantidad || 0)
    const precio = Number(item.precio_unitario || item.precio || 0)
    const isGratuito = Boolean(item.gratuito || item.es_gratuito)
    const desc = isGratuito ? 0 : Number(item.descuento || 0)

    const afectacion = String(item.tipo_afectacion_igv || item.tipo_tributo_id || '10')
    const grupo = getGrupoAfectacion(afectacion)

    if (isGratuito || grupo === 'GRAVADA_GRATUITA' || grupo === 'EXONERADA_GRATUITA' || grupo === 'INAFECTA_GRATUITA') {
      // Ítems gratuitos: no suman al total a cobrar; valor referencial
      const valorRefScaled = Math.round(cant * precio * FACTOR_MONETARIO)
      gratuitoTotalScaled += valorRefScaled
      return
    }

    if (grupo === 'ICBPER' || Boolean(item.es_icbper)) {
      const icbperItemScaled = Math.round(cant * MONTO_ICBPER * FACTOR_MONETARIO)
      icbperTotalScaled += icbperItemScaled
      return
    }

    if (grupo === 'EXONERADA') {
      // Exonerada: Base íntegra tasa 0%, sin desglose 1.18. Descuento directo en soles a la base
      const totalItemScaled = Math.max(0, Math.round((cant * precio - desc) * FACTOR_MONETARIO))
      exoneradoTotalScaled += totalItemScaled
      return
    }

    if (grupo === 'INAFECTA' || grupo === 'EXPORTACION') {
      // Inafecta: Base íntegra tasa 0%, sin desglose 1.18. Casillero independiente
      const totalItemScaled = Math.max(0, Math.round((cant * precio - desc) * FACTOR_MONETARIO))
      inafectoTotalScaled += totalItemScaled
      return
    }

    // Gravados (10, 17, etc.): Precio incluye IGV (1.18)
    const totalItemConIgv = Math.max(0, cant * precio - desc)
    const baseItem = totalItemConIgv / (1 + TASA_IGV)
    gravadoTotalScaled += Math.round(baseItem * FACTOR_MONETARIO)
  })

  // Conversión exacta desde la escala del factor monetario (sin truncamiento floor)
  const gravado = Number((gravadoTotalScaled / FACTOR_MONETARIO).toFixed(2))
  const igv = Number((gravado * TASA_IGV).toFixed(2))
  const exonerado = Number((exoneradoTotalScaled / FACTOR_MONETARIO).toFixed(2))
  const inafecto = Number((inafectoTotalScaled / FACTOR_MONETARIO).toFixed(2))
  const gratuito = Number((gratuitoTotalScaled / FACTOR_MONETARIO).toFixed(2))
  const icbper = Number((icbperTotalScaled / FACTOR_MONETARIO).toFixed(2))

  // Total final exacto: Base Gravada + IGV + Exonerado + Inafecto + ICBPER
  const total = Number((gravado + igv + exonerado + inafecto + icbper).toFixed(2))

  return {
    subtotal: Number((gravado + exonerado + inafecto).toFixed(2)),
    gravado,
    exonerado,
    inafecto,
    gratuito,
    icbper,
    igv,
    total
  }
}

/**
 * Calcula el importe de un ítem individual respetando gratuidad y factor monetario.
 * @param {number} cantidad
 * @param {number} precioUnitario
 * @param {number} descuento
 * @param {boolean} esGratuito
 * @returns {number}
 */
export function calcularSubtotalItem(cantidad = 0, precioUnitario = 0, descuento = 0, esGratuito = false) {
  if (esGratuito) return 0.00
  const cant = Number(cantidad || 0)
  const precio = Number(precioUnitario || 0)
  const desc = Number(descuento || 0)
  const totalScaled = Math.max(0, Math.round((cant * precio - desc) * FACTOR_MONETARIO))
  return Number((totalScaled / FACTOR_MONETARIO).toFixed(2))
}

export default {
  TASA_IGV,
  MONTO_ICBPER,
  FACTOR_MONETARIO,
  getGrupoAfectacion,
  calcularTotalesVenta,
  calcularSubtotalItem
}
