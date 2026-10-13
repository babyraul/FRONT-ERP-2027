import { useState, useRef, useEffect } from 'react'
import { ChevronUpDownIcon, CheckIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'

/**
 * Componente SearchableSelect
 * Selector con caja de búsqueda en tiempo real, scroll optimizado y soporte dark mode.
 */
export default function SearchableSelect({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Seleccione una opción...',
  emptyOptionLabel = '-- Ninguno / Vacío --',
  allowEmpty = true,
  disabled = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtrar opciones
  const filteredOptions = options.filter(opt => {
    const text = (opt.label || opt.nombre || opt.descripcion || '').toLowerCase()
    const sub = (opt.sublabel || opt.codigo || '').toLowerCase()
    const q = search.toLowerCase()
    return text.includes(q) || sub.includes(q)
  })

  // Encontrar la opción activa
  const selectedOption = options.find(opt => String(opt.value) === String(value))

  const handleSelect = (val) => {
    onChange(val)
    setIsOpen(false)
    setSearch('')
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}

      {/* Botón Disparador */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-left text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
      >
        <span className="truncate block font-normal">
          {selectedOption ? (
            <span>
              {selectedOption.label || selectedOption.nombre || selectedOption.descripcion}
              {selectedOption.sublabel && (
                <span className="text-xs text-slate-400 ml-1.5 font-mono">
                  ({selectedOption.sublabel})
                </span>
              )}
            </span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>
        <ChevronUpDownIcon className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
      </button>

      {/* Menú Desplegable */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Caja de Búsqueda Escrita */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 relative">
            <MagnifyingGlassIcon className="h-3.5 w-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Escribe para buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white rounded-md border border-slate-200 dark:border-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Lista de Resultados */}
          <div className="max-h-52 overflow-y-auto p-1 custom-scrollbar">
            {allowEmpty && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`w-full text-left px-3 py-1.5 text-xs rounded-md flex items-center justify-between transition-colors italic ${
                  !value ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{emptyOptionLabel}</span>
                {!value && <CheckIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
              </button>
            )}

            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-md flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">
                      {opt.label || opt.nombre || opt.descripcion}
                      {opt.sublabel && (
                        <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                          [{opt.sublabel}]
                        </span>
                      )}
                    </span>
                    {isSelected && <CheckIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0 ml-2" />}
                  </button>
                )
              })
            ) : (
              <div className="px-3 py-3 text-center text-xs text-slate-400">
                No se encontraron opciones.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
