import * as XLSX from 'xlsx'

/**
 * Exporta un array de objetos a un archivo .xlsx
 * @param {Object[]} data - Array de filas
 * @param {string} filename - Nombre del archivo (sin extensión)
 * @param {string} sheetName - Nombre de la hoja
 */
export function exportToExcel(data, filename = 'exportacion', sheetName = 'Datos') {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook  = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // Auto-ancho de columnas
  const colWidths = Object.keys(data[0] ?? {}).map((key) => ({
    wch: Math.max(
      key.length,
      ...data.map((row) => String(row[key] ?? '').length)
    ) + 2,
  }))
  worksheet['!cols'] = colWidths

  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

/**
 * Formatea número como moneda peruana
 */
export const formatCurrency = (value) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)

/**
 * Formatea fecha a locale español
 */
export const formatDate = (dateStr) =>
  new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateStr))
