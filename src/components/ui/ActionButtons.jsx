import {
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
  PlusIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  CreditCardIcon
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

/* ───────────── Botones de fila (acciones en tablas) ───────────── */

export function ViewRowButton({ title = 'Ver detalle', ...props }) {
  return <Button variant="soft" size="xs" icon={EyeIcon} title={title} {...props} />
}

export function EditRowButton({ label = 'Editar', title = 'Editar', ...props }) {
  return (
    <Button variant="warning" size="xs" icon={PencilSquareIcon} title={title} hideLabelOnMobile {...props}>
      {label}
    </Button>
  )
}

export function DeleteRowButton({ label = 'Eliminar', title = 'Eliminar', ...props }) {
  return (
    <Button variant="danger" size="xs" icon={TrashIcon} title={title} hideLabelOnMobile {...props}>
      {label}
    </Button>
  )
}

export function PayRowButton({ label = 'Cobrar', title = 'Cobrar', ...props }) {
  return (
    <Button variant="dark" size="xs" icon={CreditCardIcon} title={title} hideLabelOnMobile {...props}>
      {label}
    </Button>
  )
}
