import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const TONE_STYLES = {
  blue: {
    hover: 'hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400',
    icon: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
  },
  teal: {
    hover: 'hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-[#01a59c]',
    icon: 'bg-teal-50 dark:bg-teal-900/30 text-[#01a59c]'
  },
  amber: {
    hover: 'hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 dark:hover:text-amber-400',
    icon: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
  },
  emerald: {
    hover: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400',
    icon: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
  },
  rose: {
    hover: 'hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400',
    icon: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
  }
}

/**
 * Botón desplegable de acciones de fila con menú flotante en Portal (estilo EmpresasPage de pControl2027).
 *
 * @param {string} title - Tooltip del botón disparador
 * @param {string} menuTitle - Título de cabecera del menú desplegable
 * @param {Array<{ label: string, icon: Component, tone?: string, onClick: Function, badge?: string|number, visible?: boolean }>} items
 */
export default function RowActionMenu({
  title = 'Acciones',
  menuTitle = 'Opciones',
  items = []
}) {
  const [coords, setCoords] = useState(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const visibleItems = items.filter((item) => item && item.visible !== false)
  const isOpen = Boolean(coords)

  const handleToggle = (e) => {
    e.stopPropagation()
    if (isOpen) {
      setCoords(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const dropdownHeight = Math.max(120, visibleItems.length * 42 + 40)
    const openUp = rect.bottom + dropdownHeight > window.innerHeight
    const top = openUp ? Math.max(10, rect.top - dropdownHeight - 6) : rect.bottom + 6
    const left = Math.min(Math.max(10, rect.left), window.innerWidth - 235)
    setCoords({ top, left })
  }

  useEffect(() => {
    if (!isOpen) return

    const close = () => setCoords(null)
    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        close()
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') close()
    }

    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  if (visibleItems.length === 0) return null

  return (
    <div className="flex items-center justify-center">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={`w-7 h-7 rounded-lg flex flex-col justify-between p-1.5 cursor-pointer bg-white dark:bg-zinc-900/40 hover:bg-slate-50 dark:hover:bg-white/10 border ${
          isOpen
            ? 'border-[#01a59c] ring-2 ring-[#01a59c]/30'
            : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
        } transition-all relative active:scale-90`}
        title={title}
      >
        <div className="h-[2px] w-full rounded bg-orange-400" />
        <div className="h-[2px] w-full rounded bg-cyan-400" />
        <div className="h-[2px] w-full rounded bg-emerald-400" />
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 99999
          }}
          className="w-56 p-1.5 bg-white dark:bg-[var(--panel)] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col gap-1 text-left backdrop-blur-md ring-1 ring-black/10 dark:ring-white/10"
        >
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/80">
            {menuTitle}
          </div>

          {visibleItems.map((item, idx) => {
            const tone = TONE_STYLES[item.tone] || TONE_STYLES.blue
            const Icon = item.icon
            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setCoords(null)
                  item.onClick?.()
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 ${tone.hover} transition-colors cursor-pointer text-left`}
              >
                {Icon && (
                  <div className={`w-6 h-6 rounded-lg ${tone.icon} flex items-center justify-center shrink-0`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                )}
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>,
        document.body
      )}
    </div>
  )
}
