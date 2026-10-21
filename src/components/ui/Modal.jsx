import { useEffect, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import ActionSection from './ActionSection.jsx'

/**
 * Componente Global Modal / Drawer
 * Unifica las ventanas y paneles de edición/creación del sistema con animación fluida.
 * 
 * @param {boolean} isOpen - Estado de apertura
 * @param {function} onClose - Función para cerrar
 * @param {string|ReactNode} title - Título principal
 * @param {string|ReactNode} subtitle - Subtítulo opcional
 * @param {function} onConfirm - Función al pulsar el botón principal
 * @param {string} confirmText - Texto del botón principal (def: 'Guardar')
 * @param {string} cancelText - Texto del botón de cancelar (def: 'Cancelar')
 * @param {boolean} isProcessing - Estado de carga para el botón principal
 * @param {string} maxWidth - Clase de ancho máximo personalizada
 * @param {string} size - Atajo de tamaño (sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, full)
 * @param {'drawer'|'modal'|'inline'} variant - Tipo de animación: 'drawer' (panel lateral deslizante), 'modal' (centrado con zoom) o 'inline' (reemplaza/cubre con animación fluida la sección contenedora asignada)
 * @param {ReactNode} children - Contenido del cuerpo
 * @param {string} confirmButtonId - ID del form a hacer submit
 * @param {boolean} showFooter - Si muestra la barra inferior de botones
 * @param {boolean} hideConfirm - Ocultar el botón confirmar
 * @param {boolean} noPadding - Quitar el padding por defecto del cuerpo
 */
const sizeMapDrawer = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-xl',
  xl: 'max-w-2xl',
  '2xl': 'max-w-3xl',
  '3xl': 'max-w-4xl',
  '4xl': 'max-w-5xl',
  '5xl': 'max-w-6xl',
  '6xl': 'max-w-7xl',
  '7xl': 'max-w-[90vw]',
  full: 'max-w-[94vw]'
}

const sizeMapModal = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-4xl',
  '3xl': 'max-w-5xl',
  '4xl': 'max-w-6xl',
  '5xl': 'max-w-7xl',
  '6xl': 'max-w-[92vw]',
  '7xl': 'max-w-[96vw]',
  full: 'max-w-[98vw]'
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  onConfirm,
  confirmText = 'Guardar',
  cancelText = 'Cancelar',
  isProcessing = false,
  maxWidth,
  size,
  variant = 'drawer', // 'drawer' | 'modal' | 'inline'
  children,
  confirmButtonId,
  showFooter = true,
  hideConfirm = false,
  noPadding = false,
  backIcon = 'arrow',
  extraHeader = null
}) {
  // Manejo de montaje y animación de salida
  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState(false)

  const isInline = variant === 'inline'
  const isDrawer = variant === 'drawer'

  useEffect(() => {
    let timer
    if (isOpen) {
      setMounted(true)
      // Activar la transición en el siguiente frame
      timer = setTimeout(() => {
        setActive(true)
      }, 20)
      if (!isInline) {
        document.body.style.overflow = 'hidden'
      }
    } else {
      setActive(false)
      // Esperar a que concluya la animación de salida (300ms) para desmontar
      timer = setTimeout(() => {
        setMounted(false)
      }, 300)
      if (!isInline) {
        document.body.style.overflow = 'unset'
      }
    }
    return () => {
      clearTimeout(timer)
      if (!isInline) {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen, isInline])

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!mounted) return null

  const resolvedMaxWidth = maxWidth || (size && (isDrawer ? sizeMapDrawer[size] : sizeMapModal[size])) || (isDrawer ? 'max-w-2xl' : 'max-w-lg')

  // Reenviar a ActionSection si se usa variant="inline" para máxima compatibilidad
  if (variant === 'inline') {
    return (
      <ActionSection
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        subtitle={subtitle}
        onConfirm={onConfirm}
        confirmText={confirmText}
        cancelText={cancelText}
        isProcessing={isProcessing}
        confirmButtonId={confirmButtonId}
        showFooter={showFooter}
        hideConfirm={hideConfirm}
        noPadding={noPadding}
        backIcon={backIcon}
        extraHeader={extraHeader}
      >
        {children}
      </ActionSection>
    )
  }

  // VARIANTE DRAWER / MODAL
  return (
    <div 
      className={`fixed inset-0 z-[100] transition-colors duration-300 ${
        isDrawer 
          ? 'overflow-hidden flex justify-end bg-slate-900/30 dark:bg-black/40 backdrop-blur-[2px]' 
          : 'flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs'
      } ${active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={(e) => {
        // Cierra si se hace clic en el backdrop directamente
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className={
          isDrawer
            ? `bg-slate-50 dark:bg-slate-900 h-full w-full ${resolvedMaxWidth} shadow-2xl flex flex-col border-l border-slate-200/80 dark:border-slate-800 transform transition-all duration-300 ease-out ${
                active ? 'translate-x-0' : 'translate-x-full'
              }`
            : `bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-2xl w-full ${resolvedMaxWidth} overflow-hidden flex flex-col max-h-[90vh] transform transition-all duration-300 ease-out ${
                active ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
              }`
        }
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4.5 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
              {title}
            </h2>
            {subtitle && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal">
                {subtitle}
              </div>
            )}
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 -mr-1 -mt-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Cerrar panel"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className={`overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900/50 ${noPadding ? '' : 'p-6'}`}>
          {children}
        </div>

        {/* Footer */}
        {showFooter && (
          <div className="px-6 py-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex justify-end items-center gap-3 shrink-0">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              {cancelText}
            </button>
            {!hideConfirm && (
              <button 
                type={confirmButtonId ? "submit" : "button"}
                form={confirmButtonId}
                onClick={!confirmButtonId && onConfirm ? onConfirm : undefined} 
                disabled={isProcessing}
                className="btn-primary px-5 py-2 text-sm rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
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

