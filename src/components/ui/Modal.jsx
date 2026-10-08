import { useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

/**
 * Componente Global Modal
 * Unifica el diseño de todas las ventanas modales del sistema.
 * 
 * @param {boolean} isOpen - Estado de apertura del modal
 * @param {function} onClose - Función para cerrar el modal
 * @param {string|ReactNode} title - Título del modal
 * @param {string|ReactNode} subtitle - Subtítulo opcional (puede incluir JSX)
 * @param {function} onConfirm - Función al pulsar el botón principal (si se omite, se asume que el body maneja su propio form/submit)
 * @param {string} confirmText - Texto del botón principal
 * @param {string} cancelText - Texto del botón de cancelar
 * @param {boolean} isProcessing - Estado de carga para el botón principal
 * @param {string} maxWidth - Clase de ancho máximo (ej: max-w-lg, max-w-2xl, max-w-3xl)
 * @param {ReactNode} children - Contenido del cuerpo del modal
 * @param {string} confirmButtonId - ID del form a hacer submit si se usa el botón principal como tipo "submit" (opcional)
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  onConfirm,
  confirmText = 'Guardar',
  cancelText = 'Cancelar',
  isProcessing = false,
  maxWidth = 'max-w-lg',
  children,
  confirmButtonId,
  showFooter = true,
  hideConfirm = false,
  noPadding = false
}) {
  // Prevenir scroll en el body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-2xl w-full ${maxWidth} overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200`}
        role="dialog"
        aria-modal="true"
      >
        
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
              {title}
            </h2>
            {subtitle && (
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {subtitle}
              </div>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="p-2 -mr-2 -mt-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Cerrar modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className={`overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900/50 ${noPadding ? '' : 'p-6'}`}>
          {children}
        </div>

        {/* Footer */}
        {showFooter && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 shrink-0">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              {cancelText}
            </button>
            {!hideConfirm && (
              <button 
                type={confirmButtonId ? "submit" : "button"}
                form={confirmButtonId}
                onClick={!confirmButtonId && onConfirm ? onConfirm : undefined} 
                disabled={isProcessing}
                className="btn-primary px-6 py-2.5 rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                {isProcessing ? 'Procesando...' : confirmText}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
