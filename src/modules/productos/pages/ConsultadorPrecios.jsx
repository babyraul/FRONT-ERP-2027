import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeftIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  MagnifyingGlassIcon,
  QrCodeIcon,
  TagIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { productoController } from '../controllers/producto.js'
import { formatCurrency } from '../../../utils/exportExcel.js'
import { toast } from '../../../utils/toast.js'
import { RefreshButton } from '../../../components/ui/ActionButtons.jsx'

export default function ConsultadorPrecios() {
  const [query, setQuery] = useState('')
  const [catalogo, setCatalogo] = useState([])
  const [resultados, setResultados] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [autoLimpiar, setAutoLimpiar] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const inputRef = useRef(null)
  const timerRef = useRef(null)
  const containerRef = useRef(null)

  const focusInput = () => {
    setTimeout(() => inputRef.current?.focus(), 20)
  }

  const cargarCatalogo = async () => {
    setLoading(true)
    const res = await productoController.getPrecios({ activo: true, limit: 500 })
    setLoading(false)
    if (res.success) {
      setCatalogo(res.data || [])
    } else {
      toast.error('Error al cargar lista de precios', res.error)
    }
    focusInput()
  }

  useEffect(() => {
    cargarCatalogo()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
      focusInput()
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const programarAutoLimpieza = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!autoLimpiar) return
    timerRef.current = setTimeout(() => {
      setResultados([])
      setHasSearched(false)
      setQuery('')
      focusInput()
    }, 6000)
  }

  const buscar = async (texto) => {
    const term = texto.trim()
    if (!term) {
      setResultados([])
      setHasSearched(false)
      focusInput()
      return
    }

    setLoading(true)
    const res = await productoController.getPrecios({ q: term, activo: true, limit: 50 })
    setLoading(false)
    setHasSearched(true)

    if (res.success) {
      setResultados(res.data || [])
      setQuery('')
      programarAutoLimpieza()
    } else {
      toast.error('Error al consultar', res.error)
    }
    focusInput()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    buscar(query)
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && containerRef.current) {
        await containerRef.current.requestFullscreen()
      } else if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch {
      // Ignorar si el navegador bloquea fullscreen
    }
  }

  const destacado = hasSearched ? (resultados[0] || null) : null
  const tablaItems = hasSearched ? resultados.slice(1) : catalogo

  return (
    <div
      ref={containerRef}
      className={`min-h-[calc(100vh-5rem)] flex flex-col gap-5 p-6 ${
        isFullscreen ? 'bg-slate-100 dark:bg-slate-950 overflow-y-auto' : ''
      }`}
    >
      {/* Barra superior */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {!isFullscreen && (
            <Link
              to="/productos"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Productos
            </Link>
          )}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#01a59c]/15 text-[#01a59c] flex items-center justify-center">
              <QrCodeIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-800 dark:text-white leading-tight">
                Lista y Consultador de Precios
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Escanea el código de barras o consulta la lista completa de productos ({catalogo.length})
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <RefreshButton onClick={cargarCatalogo} loading={loading} title="Recargar lista de precios" />

          <button
            type="button"
            onClick={() => {
              setAutoLimpiar((v) => !v)
              focusInput()
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
              autoLimpiar
                ? 'border-teal-300 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 text-[#01a59c]'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500'
            }`}
            title="Vuelve a la lista general automáticamente después de 6 segundos"
          >
            <ClockIcon className="h-4 w-4" />
            Auto-limpiar (6s): {autoLimpiar ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isFullscreen ? (
              <>
                <ArrowsPointingInIcon className="h-4 w-4" /> Salir Tótem
              </>
            ) : (
              <>
                <ArrowsPointingOutIcon className="h-4 w-4" /> Modo Tótem
              </>
            )}
          </button>
        </div>
      </div>

      {/* Buscador principal */}
      <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-4 border border-white/70 dark:border-slate-800/80">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#01a59c]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escanea el código de barras o escribe nombre/código y presiona Enter..."
              className="w-full pl-11 pr-4 py-3 text-sm sm:text-base font-semibold rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#01a59c] transition-colors"
              autoFocus
            />
          </div>
          {hasSearched && (
            <button
              type="button"
              onClick={() => {
                setResultados([])
                setHasSearched(false)
                setQuery('')
                focusInput()
              }}
              className="px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 cursor-pointer shrink-0"
            >
              Ver Todos
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-[#01a59c] hover:bg-[#018f87] disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0"
          >
            {loading ? 'Buscando...' : 'Consultar'}
          </button>
        </div>
      </form>

      {/* Resultado destacado tras escanear o seleccionar */}
      {hasSearched && (
        destacado ? (
          <div className="glass-card rounded-3xl p-6 border-2 border-[#01a59c]/40 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-teal-50 dark:bg-teal-950/50 text-[#01a59c] border border-teal-200/70 dark:border-teal-800">
                    {destacado.presentacion_nombre} ({destacado.unidad_medida_id} x{destacado.multiplica_por})
                  </span>
                  {destacado.cod_barra && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      SKU: {destacado.cod_barra}
                    </span>
                  )}
                  {destacado.categoria_nombre && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      • {destacado.categoria_nombre}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {destacado.producto_nombre}
                </h2>
              </div>

              <div className="text-left md:text-right shrink-0 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl px-6 py-4">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Precio de Venta
                </span>
                <span className="text-4xl sm:text-5xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(Number(destacado.precio_venta || 0))}
                </span>
              </div>
            </div>

            {(Number(destacado.precio_mayor || 0) > 0 || Number(destacado.precio_especial || 0) > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-200/70 dark:border-slate-800">
                {Number(destacado.precio_mayor || 0) > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                      Precio Por Mayor
                    </span>
                    <span className="text-lg font-black font-mono text-slate-800 dark:text-white">
                      {formatCurrency(Number(destacado.precio_mayor))}
                    </span>
                  </div>
                )}
                {Number(destacado.precio_especial || 0) > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                      Precio Especial
                    </span>
                    <span className="text-lg font-black font-mono text-slate-800 dark:text-white">
                      {formatCurrency(Number(destacado.precio_especial))}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : !loading ? (
          <div className="glass-card rounded-3xl p-8 text-center border border-white/70 dark:border-slate-800/80">
            <TagIcon className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Producto no encontrado
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Intenta escanear nuevamente o buscar con otro nombre/código.
            </p>
          </div>
        ) : null
      )}

      {/* Tabla completa de productos / coincidencias adicionales */}
      {tablaItems.length > 0 && (
        <div className="table-container">
          <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="table-thead">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Presentación</th>
                  <th className="px-4 py-3">Cód. Barras</th>
                  <th className="px-4 py-3 text-right">P. Venta</th>
                  <th className="px-4 py-3 text-right">P. Mayor</th>
                  <th className="px-4 py-3 text-right">P. Especial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {tablaItems.map((item) => (
                  <tr
                    key={item.presentacion_id}
                    onClick={() => {
                      setResultados([item])
                      setHasSearched(true)
                      programarAutoLimpieza()
                      focusInput()
                    }}
                    className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-2.5 font-mono text-slate-500">
                      {item.producto_codigo || '—'}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-white">
                      {item.producto_nombre}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                      {item.presentacion_nombre} ({item.unidad_medida_id} x{item.multiplica_por})
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-500">
                      {item.cod_barra || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(Number(item.precio_venta || 0))}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-600 dark:text-slate-300">
                      {Number(item.precio_mayor || 0) > 0 ? formatCurrency(Number(item.precio_mayor)) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-600 dark:text-slate-300">
                      {Number(item.precio_especial || 0) > 0 ? formatCurrency(Number(item.precio_especial)) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
