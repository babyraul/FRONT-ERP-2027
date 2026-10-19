import { CalendarIcon } from '@heroicons/react/24/outline'

/** Fecha local en formato YYYY-MM-DD (evita desfase UTC de toISOString). */
export const toDateStr = (d = new Date()) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const getTodayStr = () => toDateStr(new Date())

const buildPresets = () => {
  const today = new Date()
  const ayer = new Date(today); ayer.setDate(today.getDate() - 1)
  const hace7 = new Date(today); hace7.setDate(today.getDate() - 6)
  const inicioMes = new Date(today.getFullYear(), today.getMonth(), 1)
  return [
    { key: 'hoy', label: 'Hoy', from: toDateStr(today), to: toDateStr(today) },
    { key: 'ayer', label: 'Ayer', from: toDateStr(ayer), to: toDateStr(ayer) },
    { key: '7d', label: '7 días', from: toDateStr(hace7), to: toDateStr(today) },
    { key: 'mes', label: 'Mes', from: toDateStr(inicioMes), to: toDateStr(today) }
  ]
}

const inputCls =
  'text-xs font-semibold py-1 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-[#01a59c] cursor-pointer'

/**
 * Filtro global de rango de fechas.
 *
 * @param {string}   from          Fecha inicio (YYYY-MM-DD)
 * @param {string}   to            Fecha fin (YYYY-MM-DD)
 * @param {Function} onChange      ({ from, to }) => void
 * @param {string}   label         Texto de la etiqueta (default "Fecha:")
 * @param {boolean}  showPresets   Muestra accesos rápidos (Hoy, Ayer, 7 días, Mes)
 */
export default function DateRangeFilter({
  from,
  to,
  onChange,
  label = 'Fecha:',
  showPresets = true,
  className = ''
}) {
  const presets = showPresets ? buildPresets() : []
  const activeKey = presets.find((p) => p.from === from && p.to === to)?.key

  const update = (next) => {
    let { from: f, to: t } = { from, to, ...next }
    // Mantener rango válido
    if (f && t && f > t) {
      if (next.from !== undefined) t = f
      else f = t
    }
    onChange?.({ from: f, to: t })
  }

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-2 p-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs ${className}`}
    >
      <CalendarIcon className="h-4 w-4 text-[#01a59c] shrink-0" />
      {label && (
        <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">{label}</span>
      )}
      <input type="date" value={from || ''} max={to || undefined} onChange={(e) => update({ from: e.target.value })} className={inputCls} />
      <span className="text-xs text-slate-400 font-bold">-</span>
      <input type="date" value={to || ''} min={from || undefined} onChange={(e) => update({ to: e.target.value })} className={inputCls} />

      {presets.length > 0 && (
        <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-slate-700">
          {presets.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => onChange?.({ from: p.from, to: p.to })}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                activeKey === p.key
                  ? 'bg-[#01a59c] text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
