import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import {
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import PageHeader from '../../../components/ui/PageHeader.jsx'
import { ExportExcelButton, RefreshButton } from '../../../components/ui/ActionButtons.jsx'
import { productoController } from '../controllers/producto.js'
import { exportToExcel } from '../../../utils/exportExcel.js'
import { toast } from '../../../utils/toast.js'

const CAMPOS_PRECIO = [
  { key: 'precio_costo', label: 'P. Costo' },
  { key: 'precio_venta', label: 'P. Venta' },
  { key: 'precio_mayor', label: 'P. Mayor' },
  { key: 'precio_especial', label: 'P. Especial' },
  { key: 'precio_otros', label: 'P. Otros' },
  { key: 'descuento_predefinido', label: 'Descuento' }
]

const round2 = (n) => Math.max(0, Math.round((Number(n) + Number.EPSILON) * 100) / 100)

export default function PreciosMasivos() {
  const [rows, setRows] = useState([])
  const [drafts, setDrafts] = useState({}) // { [presentacion_id]: { precio_venta: ..., ... } }
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Filtros
  const [busq, setBusq] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')

  // Calculadora de ajuste masivo
  const [campoDestino, setCampoDestino] = useState('precio_venta')
  const [tipoAjuste, setTipoAjuste] = useState('PORCENTAJE') // PORCENTAJE | MONTO_FIJO | MARGEN_COSTO
  const [valorAjuste, setValorAjuste] = useState('')

  const fileInputRef = useRef(null)

  const cargarPrecios = async () => {
    setLoading(true)
    const res = await productoController.getPrecios({ activo: true, limit: 2000 })
    if (res.success) {
      setRows(res.data)
      setDrafts({})
      setSelectedIds(new Set())
    } else {
      toast.error('Error al cargar precios', res.error)
    }
    setLoading(false)
  }

  useEffect(() => {
    cargarPrecios()
  }, [])

  const categorias = useMemo(() => {
    const map = new Map()
    rows.forEach((r) => {
      if (r.categoria_id && r.categoria_nombre) {
        map.set(r.categoria_id, r.categoria_nombre)
      }
    })
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }))
  }, [rows])

  const filtered = useMemo(() => {
    const q = busq.toLowerCase().trim()
    return rows.filter((r) => {
      if (categoriaFiltro && String(r.categoria_id) !== String(categoriaFiltro)) return false
      if (!q) return true
      return (
        r.producto_nombre?.toLowerCase().includes(q) ||
        r.producto_codigo?.toLowerCase().includes(q) ||
        r.presentacion_nombre?.toLowerCase().includes(q) ||
        r.cod_barra?.toLowerCase().includes(q)
      )
    })
  }, [rows, busq, categoriaFiltro])

  const dirtyIds = useMemo(() => Object.keys(drafts), [drafts])

  const getCurrentVal = (row, field) => {
    const draft = drafts[row.presentacion_id]
    return draft && draft[field] !== undefined ? draft[field] : row[field]
  }

  const updateCell = (row, field, rawValue) => {
    const parsed = rawValue === '' ? 0 : Number(rawValue)
    if (!Number.isFinite(parsed) || parsed < 0) return

    setDrafts((prev) => {
      const currentRowDraft = { ...(prev[row.presentacion_id] || {}) }
      if (round2(parsed) === round2(row[field])) {
        delete currentRowDraft[field]
      } else {
        currentRowDraft[field] = round2(parsed)
      }
      const next = { ...prev }
      if (Object.keys(currentRowDraft).length === 0) {
        delete next[row.presentacion_id]
      } else {
        next[row.presentacion_id] = currentRowDraft
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (filtered.length > 0 && filtered.every((r) => selectedIds.has(r.presentacion_id))) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((r) => r.presentacion_id)))
    }
  }

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const aplicarAjusteMasivo = () => {
    const num = Number(valorAjuste)
    if (valorAjuste === '' || !Number.isFinite(num)) {
      return toast.info('Valor inválido', 'Ingresa un valor numérico para aplicar el ajuste.')
    }

    const targets = selectedIds.size > 0
      ? filtered.filter((r) => selectedIds.has(r.presentacion_id))
      : filtered

    if (targets.length === 0) {
      return toast.info('Sin filas', 'No hay presentaciones visibles para ajustar.')
    }

    setDrafts((prev) => {
      const next = { ...prev }
      targets.forEach((row) => {
        const baseActual = Number(getCurrentVal(row, campoDestino) || 0)
        const costoActual = Number(getCurrentVal(row, 'precio_costo') || 0)
        let nuevoValor = baseActual

        if (tipoAjuste === 'PORCENTAJE') {
          nuevoValor = round2(baseActual * (1 + num / 100))
        } else if (tipoAjuste === 'MONTO_FIJO') {
          nuevoValor = round2(baseActual + num)
        } else if (tipoAjuste === 'MARGEN_COSTO') {
          nuevoValor = round2(costoActual * (1 + num / 100))
        }

        const rowDraft = { ...(next[row.presentacion_id] || {}) }
        if (nuevoValor === round2(row[campoDestino])) {
          delete rowDraft[campoDestino]
        } else {
          rowDraft[campoDestino] = nuevoValor
        }

        if (Object.keys(rowDraft).length === 0) {
          delete next[row.presentacion_id]
        } else {
          next[row.presentacion_id] = rowDraft
        }
      })
      return next
    })

    toast.success('Vista previa aplicada', `Se pre-calcularon ${targets.length} presentaciones. Revisa y guarda los cambios.`)
  }

  const handleGuardar = async () => {
    if (dirtyIds.length === 0) {
      return toast.info('Sin cambios', 'No hay precios modificados para guardar.')
    }

    setSaving(true)
    const items = dirtyIds.map((id) => ({
      presentacion_id: id,
      ...drafts[id]
    }))

    const res = await productoController.updatePreciosMasivo(items)
    setSaving(false)

    if (res.success) {
      toast.success('Precios actualizados', `Se actualizaron ${res.data?.actualizados ?? items.length} presentaciones.`)
      await cargarPrecios()
    } else {
      toast.error('Error al guardar', res.error)
    }
  }

  const handleExportExcel = () => {
    if (filtered.length === 0) {
      return toast.info('Sin datos', 'No hay filas para exportar.')
    }
    const data = filtered.map((r) => ({
      presentacion_id: r.presentacion_id,
      Código: r.producto_codigo || '-',
      Producto: r.producto_nombre,
      Presentación: r.presentacion_nombre,
      Categoría: r.categoria_nombre || '-',
      'P. Costo': Number(getCurrentVal(r, 'precio_costo') || 0),
      'P. Venta': Number(getCurrentVal(r, 'precio_venta') || 0),
      'P. Mayor': Number(getCurrentVal(r, 'precio_mayor') || 0),
      'P. Especial': Number(getCurrentVal(r, 'precio_especial') || 0),
      'P. Otros': Number(getCurrentVal(r, 'precio_otros') || 0),
      Descuento: Number(getCurrentVal(r, 'descuento_predefinido') || 0)
    }))
    exportToExcel(data, 'Plantilla_Precios_Masivos')
  }

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const imported = XLSX.utils.sheet_to_json(sheet)

      const rowMap = new Map(rows.map((r) => [r.presentacion_id, r]))
      let matched = 0

      setDrafts((prev) => {
        const next = { ...prev }
        imported.forEach((imp) => {
          const id = imp.presentacion_id
          const orig = rowMap.get(id)
          if (!orig) return
          matched++

          const colMap = {
            precio_costo: imp['P. Costo'] ?? imp.precio_costo,
            precio_venta: imp['P. Venta'] ?? imp.precio_venta,
            precio_mayor: imp['P. Mayor'] ?? imp.precio_mayor,
            precio_especial: imp['P. Especial'] ?? imp.precio_especial,
            precio_otros: imp['P. Otros'] ?? imp.precio_otros,
            descuento_predefinido: imp['Descuento'] ?? imp.descuento_predefinido
          }

          const rowDraft = { ...(next[id] || {}) }
          Object.entries(colMap).forEach(([field, val]) => {
            if (val !== undefined && val !== '') {
              const num = Number(val)
              if (Number.isFinite(num) && num >= 0) {
                const rounded = round2(num)
                if (rounded === round2(orig[field])) delete rowDraft[field]
                else rowDraft[field] = rounded
              }
            }
          })

          if (Object.keys(rowDraft).length === 0) delete next[id]
          else next[id] = rowDraft
        })
        return next
      })

      toast.success('Archivo cargado', `Se procesaron ${matched} presentaciones en vista previa. Revisa y guarda los cambios.`)
    } catch (err) {
      toast.error('Error al leer archivo', err.message)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Gestión Masiva de Precios"
        subtitle="Edita tarifas por presentación, aplica ajustes por porcentaje/margen o importa desde Excel."
        icon={TagIcon}
        actions={
          <>
            <Link
              to="/productos"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Volver a Productos
            </Link>

            <RefreshButton onClick={cargarPrecios} loading={loading} title="Recargar precios" />

            <ExportExcelButton
              onClick={handleExportExcel}
              disabled={loading || filtered.length === 0}
              label="Plantilla Excel"
              title="Descargar plantilla editable con los precios actuales"
            />

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImportExcel}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              Importar Excel
            </button>

            <button
              type="button"
              disabled={saving || dirtyIds.length === 0}
              onClick={handleGuardar}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-xs transition-colors cursor-pointer"
            >
              <CheckIcon className="h-4 w-4" />
              {saving ? 'Guardando...' : `Guardar Cambios (${dirtyIds.length})`}
            </button>
          </>
        }
      />

      {/* Filtros y Calculadora de Ajuste Masivo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="lg:col-span-5 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={busq}
              onChange={(e) => setBusq(e.target.value)}
              placeholder="Buscar producto, presentación o código..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
            />
          </div>
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-7 flex flex-wrap items-center justify-end gap-2">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <SparklesIcon className="h-3.5 w-3.5 text-indigo-500" />
            Ajuste ({selectedIds.size > 0 ? `${selectedIds.size} sel.` : `${filtered.length} visibles`}):
          </span>

          <select
            value={campoDestino}
            onChange={(e) => setCampoDestino(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            {CAMPOS_PRECIO.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>

          <select
            value={tipoAjuste}
            onChange={(e) => setTipoAjuste(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <option value="PORCENTAJE">% Variación (+/-)</option>
            <option value="MONTO_FIJO">Monto Fijo S/ (+/-)</option>
            <option value="MARGEN_COSTO">% Margen sobre Costo</option>
          </select>

          <input
            type="number"
            step="0.01"
            value={valorAjuste}
            onChange={(e) => setValorAjuste(e.target.value)}
            placeholder="Ej: 10 o -5"
            className="w-28 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
          />

          <button
            type="button"
            onClick={aplicarAjusteMasivo}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
          >
            Aplicar Vista Previa
          </button>
        </div>
      </div>

      {/* Tabla Editable */}
      <div className="table-container">
        <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="table-thead">
            <tr>
              <th className="p-3 w-8">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && filtered.every((r) => selectedIds.has(r.presentacion_id))}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="p-3">Producto / Presentación</th>
              {CAMPOS_PRECIO.map((c) => (
                <th key={c.key} className="p-3 text-right min-w-[105px]">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">Cargando presentaciones...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">No se encontraron presentaciones.</td>
              </tr>
            ) : (
              filtered.map((row) => {
                const isDirty = Boolean(drafts[row.presentacion_id])
                return (
                  <tr
                    key={row.presentacion_id}
                    className={isDirty ? 'bg-amber-50/60 dark:bg-amber-950/20' : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/30'}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.presentacion_id)}
                        onChange={() => toggleSelectRow(row.presentacion_id)}
                      />
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800 dark:text-white">{row.producto_nombre}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span className="font-mono">{row.producto_codigo || '-'}</span>
                        <span>•</span>
                        <span className="font-semibold uppercase text-indigo-600 dark:text-indigo-400">
                          {row.presentacion_nombre} (x{row.multiplica_por})
                        </span>
                        {row.categoria_nombre && (
                          <>
                            <span>•</span>
                            <span>{row.categoria_nombre}</span>
                          </>
                        )}
                      </div>
                    </td>
                    {CAMPOS_PRECIO.map((c) => {
                      const val = getCurrentVal(row, c.key)
                      const fieldChanged = drafts[row.presentacion_id]?.[c.key] !== undefined
                      return (
                        <td key={c.key} className="p-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={val}
                            onChange={(e) => updateCell(row, c.key, e.target.value)}
                            className={`w-24 text-right px-2 py-1 rounded-lg border font-mono text-xs ${
                              fieldChanged
                                ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                            }`}
                          />
                        </td>
                      )
                    })}
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
}
