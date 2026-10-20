import { useEffect, useState, useCallback } from 'react'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  PlusCircleIcon,
  CubeIcon
} from '@heroicons/react/24/outline'
import Modal from '../../../components/ui/Modal.jsx'
import Can from '../../../components/ui/Can.jsx'
import { usePermission } from '../../../hooks/usePermission.js'
import { stockController } from '../controllers/stock.js'
import { exportToExcel } from '../../../utils/exportExcel.js'
import { toast } from '../../../utils/toast.js'

/**
 * Modal de Kárdex Personal por Producto o Presentación
 * Muestra el historial de la tabla `stock` (1 = Entrada, 2 = Salida) y el saldo vigente en `stock_actual`,
 * permitiendo filtrar por presentación, tipo de movimiento, rango de fechas y registrar ajustes autorizados.
 */
export default function StockKardexModal({
  isOpen,
  onClose,
  itemSeleccionado,
  presentacionesProducto = [],
  almacenes = [],
  onStockUpdated
}) {
  const { hasPermission } = usePermission()

  const canRegistrarAjuste =
    hasPermission('stock.crear') ||
    hasPermission('stock.editar') ||
    hasPermission('kardexprod.crear') ||
    hasPermission('kardexprod.editar')

  // Filtros del Kárdex
  const [presentacionFiltro, setPresentacionFiltro] = useState('')
  const [almacenFiltro, setAlmacenFiltro] = useState('')
  const [tipoMovFiltro, setTipoMovFiltro] = useState('') // '' | '1' | '2'
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  // Datos del Kárdex
  const [movimientos, setMovimientos] = useState([])
  const [resumen, setResumen] = useState({
    totalMovimientos: 0,
    totalEntradas: 0,
    totalSalidas: 0,
    saldoActual: 0
  })
  const [loading, setLoading] = useState(false)

  // Panel de ajuste rápido de stock
  const [showAjusteForm, setShowAjusteForm] = useState(false)
  const [tipoMovAjuste, setTipoMovAjuste] = useState('1') // '1' = Entrada, '2' = Salida
  const [cantidadAjuste, setCantidadAjuste] = useState('1')
  const [documentoAjuste, setDocumentoAjuste] = useState('')
  const [conceptoAjuste, setConceptoAjuste] = useState('')
  const [guardandoAjuste, setGuardandoAjuste] = useState(false)

  // Sincronizar filtros iniciales cuando cambia el item seleccionado
  useEffect(() => {
    if (isOpen && itemSeleccionado) {
      setPresentacionFiltro(itemSeleccionado.presentacion_id || '')
      setAlmacenFiltro(itemSeleccionado.almacen_id || '')
      setTipoMovFiltro('')
      setShowAjusteForm(false)
      setCantidadAjuste('1')
      setDocumentoAjuste('')
      setConceptoAjuste('')
    }
  }, [isOpen, itemSeleccionado])

  const loadKardex = useCallback(async () => {
    if (!isOpen || !itemSeleccionado?.producto_id) return
    setLoading(true)

    const res = await stockController.getKardex({
      producto_id: itemSeleccionado.producto_id,
      presentacion_id: presentacionFiltro || undefined,
      almacen_id: almacenFiltro || undefined,
      tipo_mov: tipoMovFiltro || undefined,
      fecha_inicio: fechaInicio || undefined,
      fecha_fin: fechaFin || undefined
    })

    if (res.success) {
      setMovimientos(res.data)
      setResumen(res.resumen)
    } else {
      toast.error('Error al cargar Kárdex', res.message)
    }
    setLoading(false)
  }, [isOpen, itemSeleccionado, presentacionFiltro, almacenFiltro, tipoMovFiltro, fechaInicio, fechaFin])

  useEffect(() => {
    loadKardex()
  }, [loadKardex])

  // Registrar ajuste manual (Entrada = 1 / Salida = 2)
  const handleGuardarAjuste = async (e) => {
    e.preventDefault()
    const targetPresId = presentacionFiltro || itemSeleccionado?.presentacion_id
    if (!itemSeleccionado?.producto_id || !targetPresId) {
      toast.error('Presentación requerida', 'Seleccione una presentación específica para registrar el movimiento.')
      return
    }

    const cant = Number(cantidadAjuste || 0)
    if (!Number.isFinite(cant) || cant <= 0) {
      toast.error('Cantidad inválida', 'Ingrese una cantidad mayor a 0.')
      return
    }

    setGuardandoAjuste(true)
    const res = await stockController.registrarAjuste({
      producto_id: itemSeleccionado.producto_id,
      presentacion_id: targetPresId,
      almacen_id: almacenFiltro || itemSeleccionado.almacen_id || undefined,
      tipo_mov: Number(tipoMovAjuste),
      cantidad: cant,
      documento: documentoAjuste.trim() || undefined,
      concepto: conceptoAjuste.trim() || undefined
    })
    setGuardandoAjuste(false)

    if (res.success) {
      toast.success('Stock actualizado', res.message)
      setShowAjusteForm(false)
      setCantidadAjuste('1')
      setDocumentoAjuste('')
      setConceptoAjuste('')
      await loadKardex()
      onStockUpdated?.()
    } else {
      toast.error('No se pudo registrar', res.message)
    }
  }

  // Exportar Kárdex a Excel
  const handleExportarKardex = () => {
    if (movimientos.length === 0) {
      toast.info('Sin movimientos', 'No hay registros en el Kárdex para exportar.')
      return
    }

    const rows = movimientos.map((m) => ({
      'Fecha y Hora': m.created_at ? new Date(m.created_at).toLocaleString('es-PE') : '',
      'Código': m.producto_codigo || itemSeleccionado?.codigo || '-',
      'Producto': m.producto_nombre || itemSeleccionado?.producto_nombre || '',
      'Presentación': m.presentacion_nombre || itemSeleccionado?.presentacion_nombre || 'UNIDAD',
      'Almacén': m.almacen_nombre || 'ALMACÉN PRINCIPAL',
      'Documento': m.documento || '-',
      'Concepto': m.concepto || '-',
      'Tipo Movimiento': Number(m.tipo_mov) === 1 ? '1 - ENTRADA' : '2 - SALIDA',
      'Cantidad': Number(m.cantidad || 0),
      'Multiplica Por': Number(m.multiplica_por || 1),
      'Cantidad Base': Number(m.tipo_mov) === 1 ? Number(m.cantidad_base || 0) : -Number(m.cantidad_base || 0),
      'Saldo Resultante': Number(m.saldo || 0),
      'Usuario': m.usuario_nombre || '-'
    }))

    const nombreArchivo = `Kardex_${(itemSeleccionado?.producto_nombre || 'Producto').replace(/\s+/g, '_')}`
    exportToExcel(rows, nombreArchivo, 'Kardex')
  }

  if (!itemSeleccionado) return null

  const tituloModal =
    itemSeleccionado.presentacion_nombre && itemSeleccionado.presentacion_nombre !== 'Todas las Presentaciones'
      ? `Kárdex Personal: ${itemSeleccionado.producto_nombre} (${itemSeleccionado.presentacion_nombre})`
      : `Kárdex General de Producto: ${itemSeleccionado.producto_nombre}`

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tituloModal}
      maxWidth="max-w-6xl w-full"
      size="5xl"
    >
      <div className="space-y-4 text-xs min-h-[520px] flex flex-col justify-between">
        {/* ── RESUMEN SUPERIOR DEL PRODUCTO / PRESENTACIÓN ── */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              <CubeIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Código / UM</span>
              <p className="font-mono font-bold text-slate-800 dark:text-white truncate">
                {itemSeleccionado.codigo || 'S/C'} · {itemSeleccionado.unidad_medida_id || 'NIU'} (x{itemSeleccionado.multiplica_por || 1})
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50 flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400">
              <ArrowUpCircleIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-emerald-700/70 dark:text-emerald-400/80 block">
                Total Entradas (1)
              </span>
              <p className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-400">
                +{resumen.totalEntradas}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-800/50 flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400">
              <ArrowDownCircleIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-rose-700/70 dark:text-rose-400/80 block">
                Total Salidas (2)
              </span>
              <p className="text-sm font-black font-mono text-rose-700 dark:text-rose-400">
                -{resumen.totalSalidas}
              </p>
            </div>
          </div>

          <div
            className={`p-3 rounded-xl border flex items-center justify-between ${
              resumen.saldoActual < 0
                ? 'bg-rose-100/80 border-rose-300 dark:bg-rose-950/60 dark:border-rose-800'
                : 'bg-teal-50/70 border-teal-200 dark:bg-teal-950/30 dark:border-teal-800/60'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-300 block">
                Saldo Vigente (`stock_actual`)
              </span>
              <p
                className={`text-base font-black font-mono ${
                  resumen.saldoActual < 0
                    ? 'text-rose-700 dark:text-rose-400'
                    : 'text-[#01a59c] dark:text-teal-400'
                }`}
              >
                {resumen.saldoActual} {itemSeleccionado.unidad_medida_id || 'NIU'}
              </p>
            </div>
            {resumen.saldoActual < 0 && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-rose-600 text-white">
                Negativo
              </span>
            )}
          </div>
        </div>

        {/* ── BARRA DE FILTROS DEL KÁRDEX Y ACCIONES ── */}
        <div className="flex flex-wrap items-end justify-between gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-wrap items-end gap-2.5">
            {/* Filtro por Presentación del Producto */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Vista por Presentación
              </label>
              <select
                value={presentacionFiltro}
                onChange={(e) => setPresentacionFiltro(e.target.value)}
                className="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium outline-none focus:ring-1 focus:ring-[#01a59c]"
              >
                <option value="">Todas las presentaciones del producto</option>
                {presentacionesProducto.length > 0 ? (
                  presentacionesProducto.map((p) => (
                    <option key={p.presentacion_id} value={p.presentacion_id}>
                      {p.presentacion_nombre} (x{p.multiplica_por || 1} {p.unidad_medida_id || itemSeleccionado.unidad_medida_id})
                    </option>
                  ))
                ) : (
                  itemSeleccionado.presentacion_id && (
                    <option value={itemSeleccionado.presentacion_id}>
                      {itemSeleccionado.presentacion_nombre} (x{itemSeleccionado.multiplica_por || 1} {itemSeleccionado.unidad_medida_id})
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Filtro por Almacén */}
            {almacenes.length > 0 && (
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Almacén
                </label>
                <select
                  value={almacenFiltro}
                  onChange={(e) => setAlmacenFiltro(e.target.value)}
                  className="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium outline-none focus:ring-1 focus:ring-[#01a59c]"
                >
                  <option value="">Todos los almacenes</option>
                  {almacenes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtro por Tipo de Movimiento (1 = Entrada, 2 = Salida) */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Tipo Mov.
              </label>
              <select
                value={tipoMovFiltro}
                onChange={(e) => setTipoMovFiltro(e.target.value)}
                className="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium outline-none focus:ring-1 focus:ring-[#01a59c]"
              >
                <option value="">Todos (1 y 2)</option>
                <option value="1">1 · Solo Entradas (+)</option>
                <option value="2">2 · Solo Salidas (-)</option>
              </select>
            </div>

            {/* Rango de Fechas */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={fechaInicio}
                max={fechaFin || undefined}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs outline-none focus:ring-1 focus:ring-[#01a59c]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={fechaFin}
                min={fechaInicio || undefined}
                onChange={(e) => setFechaFin(e.target.value)}
                className="py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs outline-none focus:ring-1 focus:ring-[#01a59c]"
              />
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadKardex}
              disabled={loading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Refrescar Kárdex"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleExportarKardex}
              disabled={movimientos.length === 0}
              className="px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors disabled:opacity-40"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Excel</span>
            </button>

            {canRegistrarAjuste && (
              <button
                type="button"
                onClick={() => setShowAjusteForm((prev) => !prev)}
                className="px-3 py-1.5 rounded-lg bg-[#01a59c] hover:bg-[#018e86] text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <PlusCircleIcon className="h-4 w-4" />
                <span>{showAjusteForm ? 'Ocultar Ajuste' : 'Registrar Movimiento'}</span>
              </button>
            )}
          </div>
        </div>

        {/* ── FORMULARIO DESPLEGABLE DE MOVIMIENTO / REGULARIZACIÓN DE STOCK ── */}
        <Can I="crear" a="stock" fallback={null}>
          {showAjusteForm && (
            <form
              onSubmit={handleGuardarAjuste}
              className="p-3.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-100 uppercase text-[11px]">
                  Nuevo Movimiento Manual de Inventario (Afecta `stock_actual` y Kárdex `stock`)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Tipo de Movimiento
                  </label>
                  <select
                    value={tipoMovAjuste}
                    onChange={(e) => setTipoMovAjuste(e.target.value)}
                    className="w-full py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-xs"
                  >
                    <option value="1">1 · ENTRADA (Ingreso / Regularizar)</option>
                    <option value="2">2 · SALIDA (Descargo / Merma)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Cantidad ({itemSeleccionado.presentacion_nombre})
                  </label>
                  <input
                    type="number"
                    min="0.001"
                    step="any"
                    required
                    value={cantidadAjuste}
                    onChange={(e) => setCantidadAjuste(e.target.value)}
                    className="w-full py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Documento Referencia
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: GUIA-001 / INV-2026"
                    value={documentoAjuste}
                    onChange={(e) => setDocumentoAjuste(e.target.value)}
                    className="w-full py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Concepto / Motivo
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Inventario inicial / Regularización"
                    value={conceptoAjuste}
                    onChange={(e) => setConceptoAjuste(e.target.value)}
                    className="w-full py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAjusteForm(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoAjuste}
                  className="px-4 py-1.5 rounded-lg bg-[#01a59c] hover:bg-[#018e86] text-white font-bold disabled:opacity-50"
                >
                  {guardandoAjuste ? 'Guardando...' : 'Aplicar Movimiento'}
                </button>
              </div>
            </form>
          )}
        </Can>

        {/* ── TABLA DE MOVIMIENTOS DEL KÁRDEX (`stock`) ── */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="max-h-[480px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="px-3 py-2.5">Fecha / Hora</th>
                  <th className="px-3 py-2.5">Presentación</th>
                  <th className="px-3 py-2.5">Documento</th>
                  <th className="px-3 py-2.5">Concepto</th>
                  <th className="px-3 py-2.5 text-center">Tipo Mov.</th>
                  <th className="px-3 py-2.5 text-right">Cant.</th>
                  <th className="px-3 py-2.5 text-right">Factor</th>
                  <th className="px-3 py-2.5 text-right">Cant. Base</th>
                  <th className="px-3 py-2.5 text-right">Saldo</th>
                  <th className="px-3 py-2.5">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center font-sans text-slate-400">
                      Consultando historial de Kárdex...
                    </td>
                  </tr>
                ) : movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center font-sans text-slate-400">
                      No se encontraron movimientos en la tabla `stock` para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  movimientos.map((m) => {
                    const esEntrada = Number(m.tipo_mov) === 1
                    const saldoNum = Number(m.saldo || 0)

                    return (
                      <tr
                        key={m.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {m.created_at ? new Date(m.created_at).toLocaleString('es-PE') : '-'}
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                          {m.presentacion_nombre || 'UNIDAD'}
                        </td>
                        <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                          {m.documento || '-'}
                        </td>
                        <td className="px-3 py-2 font-sans text-slate-600 dark:text-slate-300 max-w-[220px] truncate" title={m.concepto}>
                          {m.concepto || '-'}
                        </td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              esEntrada
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                            }`}
                          >
                            {esEntrada ? '1 · Entrada' : '2 · Salida'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">{m.cantidad}</td>
                        <td className="px-3 py-2 text-right text-slate-400">x{m.multiplica_por || 1}</td>
                        <td
                          className={`px-3 py-2 text-right font-bold ${
                            esEntrada
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {esEntrada ? `+${m.cantidad_base}` : `-${m.cantidad_base}`}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span
                            className={`font-bold px-2 py-0.5 rounded ${
                              saldoNum < 0
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {saldoNum}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-sans text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {m.usuario_nombre || '-'}
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
    </Modal>
  )
}
