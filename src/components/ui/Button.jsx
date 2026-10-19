import { ArrowPathIcon } from '@heroicons/react/24/outline'

/**
 * Botón base global del sistema.
 *
 * Variantes: primary | secondary | outline | ghost | danger | warning | dark | soft
 * Tamaños:   xs | sm | md | icon
 */
const VARIANTS = {
  primary: 'bg-[#01a59c] hover:bg-[#018f86] text-white shadow-xs border border-transparent',
  dark: 'bg-[#01473d] hover:bg-[#025a4d] text-white shadow-2xs border border-transparent',
  secondary: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs',
  outline: 'bg-transparent border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800',
  ghost: 'bg-transparent border border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
  soft: 'bg-teal-50 dark:bg-teal-900/20 text-[#01a59c] hover:bg-teal-100 dark:hover:bg-teal-900/40 border border-transparent',
  danger: 'bg-red-500 hover:bg-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-white border border-transparent',
  warning: 'bg-orange-400 hover:bg-orange-500 dark:bg-amber-900/20 dark:hover:bg-orange-900/40 text-white border border-transparent'
}

const SIZES = {
  xs: 'p-1.5 text-[11px] gap-1 rounded-lg',
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-xl',
  md: 'px-3.5 py-2 text-xs gap-1.5 rounded-xl',
  icon: 'p-2 rounded-xl'
}

export default function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconClassName = '',
  loading = false,
  disabled = false,
  hideLabelOnMobile = false,
  className = '',
  type = 'button',
  children,
  ...props
}) {
  const isDisabled = disabled || loading
  const iconSize = size === 'xs' ? 'h-4 w-4' : 'h-4 w-4'

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANTS[variant] || VARIANTS.secondary} ${SIZES[size] || SIZES.md} ${className}`}
      {...props}
    >
      {loading && !Icon ? (
        <ArrowPathIcon className={`${iconSize} animate-spin`} />
      ) : Icon ? (
        <Icon className={`${iconSize} shrink-0 ${iconClassName}`} />
      ) : null}
      {children && (
        <span className={hideLabelOnMobile ? 'hidden sm:inline' : ''}>{children}</span>
      )}
    </button>
  )
}
