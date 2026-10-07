import { useNotificationStore } from '../../store/useNotificationStore'
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'

const iconMap = {
  success: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
  error: <ExclamationCircleIcon className="h-6 w-6 text-red-500" />,
  info: <InformationCircleIcon className="h-6 w-6 text-blue-500" />,
  warning: <ExclamationCircleIcon className="h-6 w-6 text-yellow-500" />,
}

export default function ToastContainer() {
  const { notifications, removeNotification } = useNotificationStore()

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {notifications.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg bg-white p-4 shadow-lg ring-1 ring-black/5 dark:bg-slate-800 dark:ring-white/10 animate-slide-up"
        >
          <div className="flex-shrink-0">
            {iconMap[toast.type] || iconMap.info}
          </div>
          <div className="flex-1 pt-0.5">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {toast.title}
            </p>
            {toast.message && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {toast.message}
              </p>
            )}
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              type="button"
              className="inline-flex rounded-md text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:text-slate-300"
              onClick={() => removeNotification(toast.id)}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
