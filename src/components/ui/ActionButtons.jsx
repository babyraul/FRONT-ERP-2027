import {
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CreditCardIcon,
  ClipboardDocumentListIcon,
  PrinterIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'
import Button from './Button.jsx'

/* ───────────── Botones de cabecera / toolbar ───────────── */

export function ExportExcelButton({ label = 'Exportar Excel', title = 'Exportar a Excel', ...props }) {
  return (
    <Button variant="secondary" icon={ArrowDownTrayIcon} iconClassName="text-emerald-600" title={title} {...props}>
      {label}
    </Button>
  )
}

export function ExportPdfButton({ label = 'Exportar PDF', title = 'Exportar a PDF', ...props }) {
  return (
    <Button variant="secondary" icon={DocumentArrowDownIcon} iconClassName="text-rose-600" title={title} {...props}>
      {label}
    </Button>
  )
}

export function RefreshButton({ loading = false, title = 'Actualizar', label, ...props }) {
  return (
    <Button
      variant="outline"
      size={label ? 'md' : 'icon'}
      icon={ArrowPathIcon}
      iconClassName={loading ? 'animate-spin text-[#01a59c]' : ''}
      disabled={loading}
      title={title}
      {...props}
    >
      {label}
    </Button>
  )
}

export function NewButton({ label = 'Nuevo', ...props }) {
  return (
    <Button variant="primary" size="sm" icon={PlusIcon} {...props}>
      {label}
    </Button>
  )
}

/* ───────────── Botones de fila estandarizados (acciones en tablas) ─────────────
 * Estilo unificado según Proveedores.jsx:
 * Botones cuadrados compactos (p-1.5 rounded-lg transition-colors) con fondos tintados sutiles:
 * - Editar:      Azul (bg-blue-50 text-blue-600 hover:bg-blue-100)
 * - Eliminar:    Rojo (bg-red-50 text-red-600 hover:bg-red-100)
 * - Ver/Detalle: Verde/Teal (bg-teal-50 text-[#01a59c] hover:bg-teal-100)
 * - Activar:     Esmeralda (bg-emerald-50 text-emerald-600 hover:bg-emerald-100)
 * - Imprimir:    Slate neutro (bg-slate-100 text-slate-700 hover:bg-slate-200)
 * - Kárdex:      Ámbar/Teal sutil (bg-teal-50 text-[#01a59c] hover:bg-teal-100)
 * ───────────────────────────────────────────────────────────────────────────── */

export function ActionCell({ children, align = 'center', className = '' }) {
  const alignClass = align === 'right' ? 'justify-end' : align === 'left' ? 'justify-start' : 'justify-center'
  return (
    <div className={`flex items-center ${alignClass} gap-1.5 whitespace-nowrap ${className}`}>
      {children}
    </div>
  )
}

const BASE_ROW_BTN = "p-1.5 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"

// Editar (Azul, estándar de Proveedores/Clientes)
export function EditRowButton({ title = 'Editar', className = '', ...props }) {
  return (
    <button
      type="button"
      title={title}
      className={`${BASE_ROW_BTN} bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 ${className}`}
      {...props}
    >
      <PencilIcon className="h-4 w-4" />
    </button>
  )
}

// Eliminar / Inactivar / Anular (Rojo, estándar de Proveedores/Clientes)
export function DeleteRowButton({ title = 'Eliminar', className = '', ...props }) {
  return (
    <button
      type="button"
      title={title}
      className={`${BASE_ROW_BTN} bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 ${className}`}
      {...props}
    >
      <TrashIcon className="h-4 w-4" />
    </button>
  )
}

// Ver / Detalle (Verde / Teal según requerimiento del usuario)
export function ViewRowButton({ title = 'Ver detalle', className = '', ...props }) {
  return (
    <button
      type="button"
      title={title}
      className={`${BASE_ROW_BTN} bg-teal-50 dark:bg-teal-900/30 text-[#01a59c] hover:bg-teal-100 dark:hover:bg-teal-900/50 ${className}`}
      {...props}
    >
      <EyeIcon className="h-4 w-4" />
    </button>
  )
}

// Reactivar (Esmeralda / Verde)
export function ReactivateRowButton({ title = 'Reactivar', className = '', ...props }) {
  return (
    <button
      type="button"
      title={title}
      className={`${BASE_ROW_BTN} bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 ${className}`}
      {...props}
    >
      <ArrowPathIcon className="h-4 w-4" />
    </button>
  )
}

// Kárdex (Verde / Teal suave)
export function KardexRowButton({ title = 'Ver Kárdex / Movimientos de Stock', className = '', ...props }) {
  return (
    <button
      type="button"
      title={title}
      className={`${BASE_ROW_BTN} bg-teal-50 dark:bg-teal-900/30 text-[#01a59c] hover:bg-teal-100 dark:hover:bg-teal-900/50 ${className}`}
      {...props}
    >
      <ClipboardDocumentListIcon className="h-4 w-4" />
    </button>
  )
}

// Reimprimir (Gris / Slate neutro)
export function PrintRowButton({ title = 'Reimprimir Ticket', className = '', ...props }) {
  return (
    <button
      type="button"
      title={title}
      className={`${BASE_ROW_BTN} bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 ${className}`}
      {...props}
    >
      <PrinterIcon className="h-4 w-4" />
    </button>
  )
}

// Duplicar (Azul suave)
export function DuplicateRowButton({ title = 'Duplicar a Pre-Venta', className = '', ...props }) {
  return (
    <button
      type="button"
      title={title}
      className={`${BASE_ROW_BTN} bg-blue-50 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 ${className}`}
      {...props}
    >
      <DocumentDuplicateIcon className="h-4 w-4" />
    </button>
  )
}

// Cobrar / Pagar (Verde/Oscuro o Teal)
export function PayRowButton({ title = 'Cobrar', className = '', ...props }) {
  return (
    <button
      type="button"
      title={title}
      className={`${BASE_ROW_BTN} bg-[#01a59c]/10 dark:bg-teal-900/40 text-[#01a59c] hover:bg-[#01a59c]/20 transition-colors ${className}`}
      {...props}
    >
      <CreditCardIcon className="h-4 w-4" />
    </button>
  )
}
