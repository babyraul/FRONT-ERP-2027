import { useState, useEffect, useCallback, useRef } from 'react'
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline'
import notificacionesController from '../controllers/notificaciones'
import { useAuthStore } from '../../../store/useAuthStore'

const TIPO_BADGE = {
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  error: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  info: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
}

export default function NotificacionesBell({ className = '' }) {
  const { user, isAuthenticated } = useAuthStore()
  const branchId = user?.active_acceso?.branch_id

  const [open, setOpen] = useState(false)
  const [noLeidas, setNoLeidas] = useState(0)
  const [ultimas, setUltimas] = useState([])
  const [dropDirection, setDropDirection] = useState('down')
  const containerRef = useRef(null)

  const cargarResumen = useCallback(async () => {
    if (!isAuthenticated) return
    const res = await notificacionesController.resumen()
    if (res.success && res.data) {
      setNoLeidas(Number(res.data.no_leidas || 0))
      setUltimas(Array.isArray(res.data.ultimas) ? res.data.ultimas : [])
    }
  }, [isAuthenticated, branchId])

  useEffect(() => {
    cargarResumen()
    const timer = setInterval(cargarResumen, 45000)
    return () => clearInterval(timer)
  }, [cargarResumen])

  useEffect(() => {
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleClickNotif = async (notif) => {
    if (!notif.leido) {
      const res = await notificacionesController.marcarLeida(notif.id)
      if (res.success) {
        setNoLeidas((prev) => Math.max(0, prev - 1))
        setUltimas((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, leido: true } : n))
        )
      }
    }
    setOpen(false)
  }

  const handleMarcarTodas = async () => {
    const res = await notificacionesController.marcarTodasLeidas()
    if (res.success) {
      setNoLeidas(0)
      setUltimas((prev) => prev.map((n) => ({ ...n, leido: true })))
    }
  }

  const toggleOpen = () => {
    if (!open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      setDropDirection(spaceBelow < 380 && spaceAbove > spaceBelow ? 'up' : 'down')
      cargarResumen()
    }
    setOpen((v) => !v)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        id="navbar-notifications"
        type="button"
        onClick={toggleOpen}
        title="Notificaciones"
        aria-label="Notificaciones"
        className={`relative p-2 rounded-xl transition-colors cursor-pointer ${
          className || 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <BellIcon className="w-5 h-5" />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-black shadow-sm ring-2 ring-[#01a59c]">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute right-0 ${
            dropDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
          } w-[calc(100vw-2rem)] sm:w-96 max-w-sm sm:max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-hidden`}
        >
          <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Notificaciones ({noLeidas} sin leer)
            </span>
            {noLeidas > 0 && (
              <button
                type="button"
                onClick={handleMarcarTodas}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#01a59c] hover:underline cursor-pointer"
              >
                <CheckIcon className="w-3.5 h-3.5" />
                Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {ultimas.length === 0 ? (
              <div className="py-10 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                No tienes notificaciones recientes.
              </div>
            ) : (
              ultimas.map((n) => {
                const badgeCls = TIPO_BADGE[n.tipo] || TIPO_BADGE.info
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleClickNotif(n)}
                    className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${
                      !n.leido
                        ? 'bg-teal-50/70 dark:bg-teal-950/30 border-l-4 border-l-[#01a59c] hover:bg-teal-100/60 dark:hover:bg-teal-950/50'
                        : 'border-l-4 border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {n.titulo}
                      </span>
                      {!n.leido && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#01a59c] ring-2 ring-teal-200 dark:ring-teal-900 shrink-0 mt-0.5" />
                      )}
                    </div>
                    <p className="text-[11.5px] text-slate-700 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      {n.mensaje}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                      <span className={`px-2 py-0.5 rounded-md border font-bold uppercase ${badgeCls}`}>
                        {n.tipo || 'info'}
                      </span>
                      <span className="shrink-0 font-medium">
                        {n.created_at ? new Date(n.created_at).toLocaleString('es-PE') : ''}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
