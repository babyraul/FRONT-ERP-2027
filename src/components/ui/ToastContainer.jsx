import { useState, useEffect, useRef } from 'react'
import { useNotificationStore } from '../../store/useNotificationStore'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

const toastStyles = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-100',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    progressBg: 'bg-emerald-500 dark:bg-emerald-400',
    icon: CheckCircleIcon,
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
  },
  error: {
    bg: 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-100',
    iconColor: 'text-rose-600 dark:text-rose-400',
    progressBg: 'bg-rose-500 dark:bg-rose-400',
    icon: ExclamationCircleIcon,
    badgeBg: 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-100',
    iconColor: 'text-amber-600 dark:text-amber-400',
    progressBg: 'bg-amber-500 dark:bg-amber-400',
    icon: ExclamationTriangleIcon,
    badgeBg: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
  },
  info: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/80 border-cyan-200 dark:border-cyan-800/80 text-cyan-900 dark:text-cyan-100',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    progressBg: 'bg-cyan-500 dark:bg-cyan-400',
    icon: InformationCircleIcon,
    badgeBg: 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300'
  }
}

function ToastItem({ toast, onRemove }) {
  const duration = toast.duration || 3500
  const [remainingTime, setRemainingTime] = useState(duration)
  const [isPaused, setIsPaused] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const config = toastStyles[toast.type] || toastStyles.info
  const Icon = config.icon

  // Referencias para control de tiempo exacto y pausa
  const lastTickRef = useRef(Date.now())

  useEffect(() => {
    if (isPaused || isClosing) return

    lastTickRef.current = Date.now()
    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = now - lastTickRef.current
      lastTickRef.current = now

      setRemainingTime((prev) => {
        const next = prev - elapsed
        if (next <= 0) {
          clearInterval(interval)
          handleClose()
          return 0
        }
        return next
      })
    }, 40)

    return () => clearInterval(interval)
  }, [isPaused, isClosing])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onRemove(toast.id)
    }, 250)
  }

  const progressPercent = Math.max(0, Math.min(100, (remainingTime / duration) * 100))

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        lastTickRef.current = Date.now()
        setIsPaused(false)
      }}
      className={`pointer-events-auto relative overflow-hidden w-full max-w-md rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 transform ${
        isClosing
          ? 'opacity-0 -translate-y-4 scale-95'
          : 'opacity-100 translate-y-0 scale-100 animate-in fade-in slide-in-from-top-4'
      } ${config.bg}`}
      role="alert"
    >
      <div className="p-3.5 sm:p-4 flex items-start gap-3">
        {/* Ícono de incidencia */}
        <div className={`p-1.5 rounded-xl shrink-0 ${config.badgeBg}`}>
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
        </div>

        {/* Contenido del Toast */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs sm:text-sm font-bold tracking-tight">
              {toast.title}
            </h4>
            {isPaused && (
              <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 opacity-75">
                Pausado
              </span>
            )}
          </div>
          {toast.message && (
            <p className="mt-1 text-xs opacity-90 leading-relaxed break-words font-medium">
              {toast.message}
            </p>
          )}
        </div>

        {/* Botón cerrar */}
        <button
          type="button"
          onClick={handleClose}
          className="p-1 rounded-lg text-current opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer shrink-0"
          title="Cerrar notificación"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Barra de progreso de tiempo animada */}
      <div className="w-full h-1 bg-black/5 dark:bg-white/10">
        <div
          className={`h-full transition-all ease-linear ${config.progressBg}`}
          style={{
            width: `${progressPercent}%`,
            transitionDuration: isPaused ? '0ms' : '50ms'
          }}
        />
      </div>
    </div>
  )
}

export default function ToastContainer() {
  const { notifications, removeNotification } = useNotificationStore()

  return (
    <div className="fixed top-4 inset-x-0 z-[9999] flex flex-col items-center gap-2.5 px-4 pointer-events-none">
      {notifications.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeNotification} />
      ))}
    </div>
  )
}
