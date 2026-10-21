import { useEffect, useState } from 'react'
import { XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

/**
 * Componente Empresarial ActionSection
 * Encapsula la transición fluida in-place para paneles, formularios y sub-vistas del ERP.
 * 
 * Reemplaza o superpone contextualmente una sección asignada (tablas, tarjetas, pestañas)
 * sin abrir modales flotantes invasivos ni perder el layout principal.
 * 
 * @param {boolean} isOpen - Control de visibilidad/activación
 * @param {function} onClose - Callback al cancelar o retroceder
 * @param {string|ReactNode} title - Título del panel/formulario
 * @param {string|ReactNode} subtitle - Subtítulo descriptivo opcional
 * @param {function} onConfirm - Acción al pulsar el botón principal (si no se usa form submit)
 * @param {string} confirmText - Texto del botón primario (default: 'Guardar')
 * @param {string} cancelText - Texto del botón cancelar/volver (default: 'Volver')
 * @param {boolean} isProcessing - Estado de carga del botón principal
 * @param {string} confirmButtonId - ID del form asociado a type="submit"
 * @param {boolean} showFooter - Si muestra la barra de acciones inferior
 * @param {boolean} hideConfirm - Oculta el botón de confirmar (ej. paneles de solo lectura)
 * @param {boolean} noPadding - Remueve el padding interno del cuerpo
 * @param {string} backIcon - 'arrow' (flecha retroceder) o 'x' (cerrar)
 * @param {ReactNode} extraHeader - Componentes extra a la derecha de la cabecera (badges, tags)
 * @param {ReactNode} children - Contenido o formulario renderizado
 */
export default function ActionSection({
  isOpen,
  onClose,
  title,
  subtitle,
  onConfirm,
  confirmText = 'Guardar',
  cancelText = 'Volver',
  isProcessing = false,
  confirmButtonId,
  showFooter = true,
  hideConfirm = false,
  noPadding = false,
  backIcon = 'arrow',
  extraHeader = null,
  children
}) {
  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState(false)

  useEffect(() => {
    let timer
    if (isOpen) {
      setMounted(true)
      timer = setTimeout(() => {
        setActive(true)
      }, 20)
    } else {
      setActive(false)
      timer = setTimeout(() => {
        setMounted(false)
      }, 250)
    }
    return () => clearTimeout(timer)
  }, [isOpen])

  const handleClose = () => {
    if (!active) return
    setActive(false)
    setTimeout(() => {
      onClose?.()
    }, 250)
  }

  // Soporte de tecla Escape para regresar con animación
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, active])

  if (!mounted) return null

  return (
    <div 
      className={`w-full bg-white dark:bg-slate-900 rounded-2xl flex flex-col transition-all duration-300 ease-in-out transform ${
        active 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 -translate-y-2 scale-[0.99] pointer-events-none'
      }`}
      role="region"
      aria-label={typeof title === 'string' ? title : 'Panel de acción'}
    >
      {/* Cabecera Estilizada con botón de retorno contextual */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleClose} 
            className="p-1.5 -ml-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Volver atrás"
            title="Volver atrás (Esc)"
          >
            {backIcon === 'arrow' ? (
              <ArrowLeftIcon className="h-5 w-5" />
            ) : (
              <XMarkIcon className="h-5 w-5" />
            )}
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {title}
            </h2>
            {subtitle && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {extraHeader && (
          <div className="flex items-center gap-2">
            {extraHeader}
          </div>
        )}
      </div>

      {/* Cuerpo del Formulario / Vista */}
      <div className={`flex-1 ${noPadding ? '' : 'p-6'}`}>
        {children}
      </div>

      {/* Footer de Acciones Sticky */}
      {showFooter && (
        <div className="px-6 py-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end items-center gap-3 shrink-0">
          <button 
            type="button" 
            onClick={handleClose} 
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 dark:bg-red-600/90 dark:hover:bg-red-600 rounded-lg transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 dark:focus:ring-offset-slate-900 cursor-pointer"
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
  )
}
