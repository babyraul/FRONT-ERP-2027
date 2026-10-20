/**
 * Utilidades para clasificación y validación de unidades de medida (SUNAT y catálogo comercial).
 */

// Códigos SUNAT y abreviaciones comunes de unidades de medida continuas (que permiten decimales: peso, volumen, longitud, área)
export const UNIDADES_DECIMALES = new Set([
  'KGM', // Kilogramo
  'GRM', // Gramo
  'MGM', // Miligramo
  'LBR', // Libra
  'ONZ', // Onza
  'TNE', // Tonelada métrica
  'STN', // Tonelada corta
  'LTN', // Tonelada larga
  'LTR', // Litro
  'MLT', // Mililitro
  'GLI', // Galón inglés
  'GLL', // US Galón
  'HLT', // Hectolitro
  'MTR', // Metro
  'CMT', // Centímetro
  'MMT', // Milímetro
  'KTM', // Kilómetro
  'MTK', // Metro cuadrado
  'MTQ', // Metro cúbico
  'CMK', // Centímetro cuadrado
  'CMQ', // Centímetro cúbico
  'MMK', // Milímetro cuadrado
  'MMQ', // Milímetro cúbico
  'FTK', // Pie cuadrado
  'FTQ', // Pie cúbico
  'FOT', // Pie lineal
  'INH', // Pulgada
  'KWH', // Kilovatio hora
  'MWH'  // Megawatt hora
])

// Códigos conocidos de unidades discretas / indivisibles (solo enteros)
export const UNIDADES_ENTERAS = new Set([
  'NIU', // Unidad
  'ZZ',  // Unidad (servicios)
  'C62', // Pieza
  'DZN', // Docena
  'DZP', // Docena por 10**6
  'CEN', // Ciento
  'MIL', // Millar
  'UM',  // Millón de unidades
  'BX',  // Caja
  'PK',  // Paquete
  'PR',  // Par
  'SET', // Juego
  'KT',  // Kit
  'CJ',  // Conos
  'CT',  // Cartones
  'PF',  // Paletas
  'RM',  // Resma
  'TU',  // Tubos
  'BO',  // Botellas
  'CA',  // Latas
  'CY',  // Cilindro
  'DR',  // Tambor
  'BE',  // Fardo
  'BJ',  // Balde
  'BG',  // Bolsa
  'BLL', // Barriles
  '4A',  // Bobinas
  'LEF', // Hoja
  'PG',  // Placas
  'ST'   // Pliego
])

/**
 * Determina si un producto o ítem permite cantidades fraccionarias/decimales.
 * @param {Object|string} itemOrCodigo - Ítem del carrito, producto o código de unidad de medida.
 * @returns {boolean} true si la unidad admite decimales (ej. KGM, LTR, MTR), false si es unidad entera (ej. NIU, UNIDAD, PIEZA).
 */
export function permiteDecimales(itemOrCodigo) {
  if (!itemOrCodigo) return false

  // Caso: string directo (ej. 'KGM', 'NIU', 'KILOGRAMO')
  if (typeof itemOrCodigo === 'string') {
    const code = itemOrCodigo.trim().toUpperCase()
    if (UNIDADES_DECIMALES.has(code)) return true
    if (UNIDADES_ENTERAS.has(code)) return false
    return /KILO|KG|GRAM|LITR|LTR|METR|MTR|GALON|TONELAD|LIBRA|ONZA|MILILITR|ML/i.test(code)
  }

  // Caso: objeto (ítem del carrito, presentación o producto)
  const unidadCodigo = String(itemOrCodigo.unidad_medida_id || itemOrCodigo.unidad_medida || '').trim().toUpperCase()
  if (UNIDADES_DECIMALES.has(unidadCodigo)) return true
  if (UNIDADES_ENTERAS.has(unidadCodigo)) return false

  const pres = String(itemOrCodigo.nombre_presentacion || '').trim().toUpperCase()
  if (/KILO|KG|GRAM|LITR|METR|MTR|GALON|TONELAD|LIBRA|ONZA|MILILITR/i.test(pres)) return true
  if (/UNIDAD|PIEZA|DOCENA|CAJA|PAQUETE|CIENTO|MILLAR|LATA|BOTELLA|BLISTER/i.test(pres)) return false

  const nombreCompleto = String(itemOrCodigo.nombre_completo || itemOrCodigo.nombre || '').trim().toUpperCase()
  if (/\b(KGM|KG|KILO|KILOS|KILOGRAMO|KILOGRAMOS|LTR|LT|LITRO|LITROS|MTR|METRO|METROS|GRAMO|GRAMOS|GRM)\b/i.test(nombreCompleto)) {
    return true
  }

  // Por defecto en ventas comerciales, si no es una unidad continua explícita, se trata como entera
  return false
}

export default {
  UNIDADES_DECIMALES,
  UNIDADES_ENTERAS,
  permiteDecimales
}
