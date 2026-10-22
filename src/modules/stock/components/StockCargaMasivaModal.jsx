import { useState, useMemo, useEffect, useRef } from 'react'
import {
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  SparklesIcon,
  XMarkIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline'
import ActionSection from '../../../components/ui/ActionSection.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import Button from '../../../components/ui/Button.jsx'
import { stockController } from '../controllers/stock.js'
import { toast } from '../../../utils/toast.js'

/**
 * Componente Empresarial StockCargaMasivaModal
 * Permite la toma de inventario físico y carga masiva de stock para presentaciones principales
 * respetando el Enfoque 1 (Unidad Base y derivación a otras presentaciones).
 */
export default function StockCargaMasivaModal({
  isOpen,
  onClose,
  productosAgrupados = [],
  almacenes = [],
  almacenInicial = '',
  variant = 'inline',
  onCargaCompletada
}) {
  const [almacenId, setAlmacenId] = useState(almacenInicial || '')
  const [modo, setModo] = useState('conteo_fisico') // 'conteo_fisico' (nuevo stock exacto) | 'incremento' (sumar)
  const [motivo, setMotivo] = useState('CARGA MASIVA STOCK')
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos') // 'todos' | 'editados' | 'sin_stock' | 'negativos'
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Diccionario de valores editados: { [producto_id]: string | number }
  const [valoresEditados, setValoresEditados] = useState({})

  // Extraer las presentaciones principales de cada producto agrupado
  // (la de multiplica_por = 1 o la primera en la lista), excluyendo productos tipo combo
  const productosPrincipales = useMemo(() => {
    return productosAgrupados
      .filter((prod) => {
        // Excluir si la bandera es_combo viene en true
        if (prod.es_combo) return false

        // Excluir si alguna presentación indica es_combo
        if (prod.presentaciones?.some((p) => p.es_combo)) return false

        // Detección de respaldo por nombre de presentación o producto
        const tienePresentacionCombo = prod.presentaciones?.some(
          (p) => String(p.presentacion_nombre || '').toUpperCase().trim() === 'COMBO'
        )
        if (tienePresentacionCombo) return false

        const nombreProd = String(prod.producto_nombre || '').toUpperCase().trim()
        if (nombreProd.startsWith('COMBO ') || nombreProd === 'COMBO') return false

        return true
      })
      .map((prod) => {
        const presentaciones = prod.presentaciones || []
        const principal =
          presentaciones.find((p) => Number(p.multiplica_por || 1) === 1) ||
          presentaciones[0] || {
            id: null,
            presentacion_id: null,
            presentacion_nombre: 'UNIDAD',
            multiplica_por: 1,
            saldo_actual: prod.saldo_producto_total || 0,
            codigo_barra: prod.codigo_barra
          }

        const saldoBase = Number(prod.saldo_producto_total ?? principal.saldo_actual ?? 0)

        return {
          producto_id: prod.producto_id,
          codigo: prod.codigo || '-',
          codigo_barra: principal.codigo_barra || prod.codigo_barra || '-',
          producto_nombre: prod.producto_nombre,
          categoria_nombre: prod.categoria_nombre || 'General',
          unidad_medida: principal.unidad_medida_id || prod.unidad_medida_id || 'NIU',
          presentacion_id: principal.id || principal.presentacion_id,
          presentacion_nombre: principal.presentacion_nombre || 'UNIDAD',
          multiplica_por: Math.max(1, Number(principal.multiplica_por || 1)),
          saldo_actual: saldoBase
        }
      })
  }, [productosAgrupados])

  // Filtrado de la lista en memoria
  const productosFiltrados = useMemo(() => {
    let list = productosPrincipales

    if (filtroEstado === 'editados') {
      list = list.filter((p) => valoresEditados[p.producto_id] !== undefined && valoresEditados[p.producto_id] !== '')
    } else if (filtroEstado === 'sin_stock') {
      list = list.filter((p) => Number(p.saldo_actual || 0) === 0)
    } else if (filtroEstado === 'negativos') {
      list = list.filter((p) => Number(p.saldo_actual || 0) < 0)
    }

    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase()
      list = list.filter(
        (p) =>
          p.producto_nombre.toLowerCase().includes(q) ||
          p.codigo.toLowerCase().includes(q) ||
          p.codigo_barra.toLowerCase().includes(q) ||
          p.categoria_nombre.toLowerCase().includes(q)
      )
    }

    return list
  }, [productosPrincipales, busqueda, filtroEstado, valoresEditados])

  // Cantidad de items editados actualmente
  const totalEditados = useMemo(() => {
    return Object.values(valoresEditados).filter((v) => v !== '' && v !== null && v !== undefined && !isNaN(Number(v))).length
  }, [valoresEditados])

  // Modificar valor de un producto (solo números positivos >= 0)
  const handleChangeCantidad = (prodId, val) => {
    // Si se limpia el input
    if (val === '' || val === null || val === undefined) {
      setValoresEditados((prev) => ({
        ...prev,
        [prodId]: ''
      }))
      return
    }

    // Rechazar inmediatamente valores que contengan signos negativos
    if (typeof val === 'string' && val.includes('-')) return

    const num = Number(val)
    if (isNaN(num) || num < 0) return

    setValoresEditados((prev) => ({
      ...prev,
      [prodId]: val
    }))
  }

  // Limpiar ediciones
  const handleLimpiarEdiciones = () => {
    setValoresEditados({})
  }

  // Rellenar todos los visibles con 0 (útil para inventarios en blanco)
  const handlePonerTodosEnCero = () => {
    const nuevos = { ...valoresEditados }
    productosFiltrados.forEach((p) => {
      nuevos[p.producto_id] = 0
    })
    setValoresEditados(nuevos)
    toast.info('Valores asignados', `Se asignó 0 a ${productosFiltrados.length} productos visibles.`)
  }

  // Copiar saldo actual al campo nuevo (para solo modificar excepciones, asegurando valores positivos)
  const handleCopiarSaldoActual = () => {
    const nuevos = { ...valoresEditados }
    productosFiltrados.forEach((p) => {
      nuevos[p.producto_id] = Math.max(0, Number(p.saldo_actual || 0))
    })
    setValoresEditados(nuevos)
    toast.info('Valores copiados', `Se asignó el stock en ${productosFiltrados.length} productos (mínimo 0).`)
  }

  // Guardar / Confirmar Carga Masiva
  const handleSubmit = async (e) => {
    if (e) e.preventDefault()

    const itemsToSend = []
    Object.entries(valoresEditados).forEach(([prodId, val]) => {
      if (val === '' || val === null || val === undefined) return
      const cant = Number(val)
      if (isNaN(cant) || cant < 0) return

      const prod = productosPrincipales.find((p) => p.producto_id === prodId)
      if (prod) {
        itemsToSend.push({
          producto_id: prod.producto_id,
          presentacion_id: prod.presentacion_id,
          cantidad: cant
        })
      }
    })

    if (itemsToSend.length === 0) {
      toast.info('Sin cambios', 'No ha ingresado cantidades para ningún producto.')
      return
    }

    console.log('[StockCargaMasivaModal] Enviando Carga Masiva:', {
      almacen_id: almacenId || undefined,
      modo,
      motivo: motivo || 'CARGA MASIVA STOCK',
      total_items: itemsToSend.length,
      items: itemsToSend
    })

    setIsSubmitting(true)
    try {
      const res = await stockController.cargaMasivaStock({
        almacen_id: almacenId || undefined,
        modo,
        motivo: motivo || 'CARGA MASIVA STOCK',
        items: itemsToSend
      })

      console.log('[StockCargaMasivaModal] Respuesta servidor:', res)

      if (res.success) {
        toast.success('Inventario Actualizado', res.message || 'Se procesó la carga masiva correctamente.')
        if (onCargaCompletada) {
          onCargaCompletada()
        }
        if (onClose) {
          onClose()
        }
      } else {
        toast.error('Error al procesar inventario', res.message || 'No se pudo guardar la carga masiva.')
      }
    } catch (err) {
      console.error('Error en carga masiva:', err)
      toast.error('Error inesperado', err.message || 'Ocurrió un error en la carga masiva.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const content = (
    <div className="space-y-4">
      {/* ── BARRA SUPERIOR DE PARÁMETROS ── */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Almacén */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
              Almacén de Ingreso
            </label>
            <select
              value={almacenId}
              onChange={(e) => setAlmacenId(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-1 focus:ring-[#01a59c] focus:outline-none"
            >
              <option value="">ALMACÉN PRINCIPAL (POR DEFECTO)</option>
              {almacenes.map((alm) => (
                <option key={alm.id} value={alm.id}>
                  {alm.nombre} {alm.es_principal ? '(Principal)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Modo de Operación */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
              Modo de Operación
            </label>
            <select
              value={modo}
              onChange={(e) => setModo(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-[#01a59c] focus:ring-1 focus:ring-[#01a59c] focus:outline-none"
            >
              <option value="conteo_fisico">Stock Final</option>
              <option value="incremento">Sumar al stock existente</option>
            </select>
          </div>

          {/* Concepto / Motivo */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
              Concepto Kárdex
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value.toUpperCase())}
              disabled={isSubmitting}
              placeholder="Ej. CARGA MASIVA STOCK"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-1 focus:ring-[#01a59c] focus:outline-none"
            />
          </div>
        </div>

      </div>

      {/* ── BARRA DE BÚSQUEDA Y ACCIONES RÁPIDAS ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value.toUpperCase())}
              placeholder="Buscar por código, barras, producto o categoría..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-[#01a59c] focus:outline-none"
            />
          </div>

          {/* Filtros de estado */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setFiltroEstado('todos')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${filtroEstado === 'todos' ? 'bg-white dark:bg-slate-900 text-[#01a59c] shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
            >
              Todos ({productosPrincipales.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado('editados')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${filtroEstado === 'editados' ? 'bg-white dark:bg-slate-900 text-[#01a59c] shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
            >
              Editados ({totalEditados})
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado('sin_stock')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${filtroEstado === 'sin_stock' ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
            >
              Sin Stock
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado('negativos')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${filtroEstado === 'negativos' ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
            >
              Negativos
            </button>
          </div>
        </div>

        {/* Botones de conveniencia */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopiarSaldoActual}
            title="Copiar el stock actual en los campos editables para solo modificar diferencias"
          >
            Copiar Stock Actual
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePonerTodosEnCero}
            title="Poner en cero todos los productos visibles"
          >
            Poner en 0 Visibles
          </Button>
          {totalEditados > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLimpiarEdiciones}
              className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title="Borrar los valores ingresados"
            >
              Limpiar Edición ({totalEditados})
            </Button>
          )}
        </div>
      </div>

      {/* ── TABLA DE CAPTURA RÁPIDA DE INVENTARIO ── */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs bg-white dark:bg-slate-900">
        <div className="max-h-[55vh] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 uppercase font-black tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3">Cód. Barras</th>
                <th className="py-2.5 px-3">Producto (Presentación Principal)</th>
                <th className="py-2.5 px-3 text-right">Stock Actual</th>
                <th className="py-2.5 px-3 text-center w-48">
                  {modo === 'incremento' ? 'Cantidad a Ingresar (+)' : 'Nuevo Stock Físico'}
                </th>
                <th className="py-2.5 px-3 text-right">Saldo Resultante (Kárdex)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No se encontraron productos que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((prod) => {
                  const valorEditado = valoresEditados[prod.producto_id]
                  const tieneValor = valorEditado !== undefined && valorEditado !== ''
                  const cantIngresada = tieneValor ? Number(valorEditado) : null

                  const saldoActual = Number(prod.saldo_actual || 0)
                  let saldoFinal = saldoActual

                  if (tieneValor && !isNaN(cantIngresada)) {
                    if (modo === 'incremento') {
                      // Modo incremento: suma al stock existente
                      saldoFinal = saldoActual + cantIngresada
                    } else {
                      // Modo conteo físico: el valor ingresado es el nuevo saldo final exacto
                      saldoFinal = cantIngresada
                    }
                  }

                  const isModified = tieneValor && saldoFinal !== saldoActual

                  return (
                    <tr
                      key={prod.producto_id}
                      className={`transition-colors ${isModified
                        ? 'bg-teal-50/40 dark:bg-teal-950/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                    >
                      <td className="py-2 px-3 font-mono text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                        {prod.codigo}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {prod.codigo_barra}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-bold text-slate-900 dark:text-white uppercase truncate max-w-sm">
                          {prod.producto_nombre}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md ${prod.saldo_actual < 0
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : prod.saldo_actual === 0
                              ? 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            }`}
                        >
                          {Number(prod.saldo_actual || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={valorEditado !== undefined ? valorEditado : ''}
                            onChange={(e) => handleChangeCantidad(prod.producto_id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                                e.preventDefault()
                              }
                            }}
                            placeholder={modo === 'incremento' ? '+0.00' : '0.00'}
                            className={`w-28 px-2.5 py-1 text-xs text-right font-bold rounded-lg border transition-all focus:outline-none focus:ring-2 ${isModified
                              ? 'border-[#01a59c] bg-white dark:bg-slate-950 text-[#01a59c] focus:ring-[#01a59c]/30'
                              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:ring-slate-300'
                              }`}
                          />
                          {tieneValor && (
                            <button
                              type="button"
                              onClick={() => handleChangeCantidad(prod.producto_id, '')}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Descartar edición"
                            >
                              <XMarkIcon className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-bold whitespace-nowrap">
                        {tieneValor ? (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[12px] ${saldoFinal > 0
                              ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : saldoFinal < 0
                                ? 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300'
                                : 'text-slate-500 bg-slate-100 dark:bg-slate-800'
                              }`}
                          >
                            {saldoFinal.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  if (variant === 'inline') {
    return (
      <ActionSection
        isOpen={isOpen}
        onClose={onClose}
        title="Ingreso Masivo de Stock / Toma de Inventario"
        confirmText={`Guardar Inventario (${totalEditados} Productos)`}
        onConfirm={handleSubmit}
        isProcessing={isSubmitting}
        confirmDisabled={totalEditados === 0 || isSubmitting}
        maxWidth="max-w-6xl"
        confirmVariant="primary"
        extraHeader={
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-500">
              Total Catálogo: {productosPrincipales.length}
            </span>
          </div>
        }
      >
        {content}
      </ActionSection>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ingreso Masivo de Stock / Toma de Inventario"
      subtitle="Actualiza el inventario físico en la presentación principal y registra la compensación en el Kárdex histórico."
      confirmText={`Guardar Inventario (${totalEditados})`}
      onConfirm={handleSubmit}
      isProcessing={isSubmitting}
      size="6xl"
      variant="modal"
      hideConfirm={totalEditados === 0}
    >
      {content}
    </Modal>
  )
}
