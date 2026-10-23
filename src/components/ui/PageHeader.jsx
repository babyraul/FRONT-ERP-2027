import DateRangeFilter from './DateRangeFilter.jsx'

/**
 * Encabezado modular y global para vistas principales (listados, reportes, gestiones).
 *
 * Estructura de 3 zonas equilibradas:
 * - Izquierda: Título principal, subtítulo o iconografía.
 * - Centro: Filtros principales (por ejemplo DateRangeFilter o controles de consulta).
 * - Derecha: Botones de acción principales (Nuevo, Exportar, Actualizar, etc.).
 *
 * @param {string|React.ReactNode} title - Título de la página
 * @param {string|React.ReactNode} subtitle - Subtítulo / descripción breve (opcional)
 * @param {React.ElementType} icon - Componente de ícono de cabecera (opcional)
 * @param {object} dateRange - Configuración opcional { from, to, onChange, label, showPresets } para auto-renderizar DateRangeFilter
 * @param {React.ReactNode} centerContent - Contenido personalizado para el centro (si no se usa dateRange o junto con él)
 * @param {React.ReactNode} actions - Botones o acciones del lado derecho
 * @param {React.ReactNode} leftActions - Elementos o botones auxiliares pegados al título
 * @param {string} className - Clases adicionales de contenedor
 */
export default function PageHeader({
  title,
  subtitle,
  icon: Icon,
  dateRange,
  centerContent,
  actions,
  leftActions,
  className = ''
}) {
  return (
    <div
      className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${className}`}
    >
      {/* ── LADO IZQUIERDO: Título, Ícono y Acciones adyacentes ── */}
      <div className="flex items-center gap-3">
        {leftActions && <div className="flex items-center gap-2">{leftActions}</div>}
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="p-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[#01a59c] shrink-0">
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── CENTRO: Filtro de fechas o filtros generales ── */}
      {(dateRange || centerContent) && (
        <div className="flex items-center justify-center">
          {dateRange && (
            <DateRangeFilter
              from={dateRange.from}
              to={dateRange.to}
              onChange={dateRange.onChange}
              label={dateRange.label}
              showPresets={dateRange.showPresets}
            />
          )}
          {centerContent}
        </div>
      )}

      {/* ── LADO DERECHO: Acciones / Botones auxiliares ── */}
      {actions && (
        <div className="flex items-center gap-2 justify-end flex-wrap">
          {actions}
        </div>
      )}
    </div>
  )
}
