import React, { useRef, useState } from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CreditCardIcon
} from '@heroicons/react/24/solid'

export default function MetodosPagoCarrusel({
  metodos = [],
  loading = false,
  onSelectMetodo,
  selectedMetodos = []
}) {
  const scrollRef = useRef(null)
  const [imgErrors, setImgErrors] = useState({})

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -180, behavior: 'smooth' })
    }
  }

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 180, behavior: 'smooth' })
    }
  }

  // Filtrar activos y ordenar según la columna 'orden' de la base de datos
  const metodosOrdenados = [...metodos]
    .filter((m) => m.activo !== false)
    .sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0))

  return (
    <div className="flex items-center gap-2 select-none">
      {/* Flecha Izquierda */}
      <button
        type="button"
        onClick={handleScrollLeft}
        className="w-8 h-8 rounded-full bg-[#01a59c]/15 text-[#01a59c] hover:bg-[#01a59c] hover:text-white flex items-center justify-center transition-colors shrink-0"
        title="Ver métodos anteriores"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>

      {/* Carrusel Horizontal de Métodos */}
      <div
        ref={scrollRef}
        className="flex-1 flex items-center gap-2.5 overflow-x-auto py-1 scrollbar-none scroll-smooth px-1"
      >
        {loading ? (
          <div className="text-xs text-slate-400 py-3 px-4">Cargando métodos de pago...</div>
        ) : metodosOrdenados.length === 0 ? (
          <div className="text-xs text-slate-400 py-3 px-4">No hay métodos de pago configurados.</div>
        ) : (
          metodosOrdenados.map((m) => {
            const isActivo = selectedMetodos.some(
              (p) =>
                String(p.metodo_id) === String(m.id) ||
                String(p.metodo_nombre).toUpperCase() === String(m.nombre).toUpperCase()
            )
            const color = m.color || '#01a59c'
            const hasImgError = imgErrors[m.id]

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectMetodo(m)}
                style={{
                  borderColor: isActivo ? color : undefined,
                  boxShadow: isActivo ? `0 0 0 2px ${color}` : undefined
                }}
                className={`flex flex-col items-center justify-center min-w-[76px] h-[70px] rounded-xl border-2 transition-all p-1.5 shrink-0 bg-white dark:bg-slate-800 ${
                  isActivo
                    ? 'scale-105 shadow-md font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:scale-102 hover:shadow-xs'
                }`}
                title={`Agregar pago con ${m.nombre}`}
              >
                {m.imagen_url && !hasImgError ? (
                  <img
                    src={m.imagen_url}
                    alt={m.nombre}
                    onError={() => setImgErrors((prev) => ({ ...prev, [m.id]: true }))}
                    className="h-8 w-8 object-contain mb-1 shrink-0 drop-shadow-2xs"
                  />
                ) : (
                  <CreditCardIcon
                    className="h-8 w-8 mb-1 shrink-0"
                    style={{ color: color }}
                  />
                )}
                <span
                  style={{ color: isActivo ? color : undefined }}
                  className="text-[10px] font-extrabold uppercase tracking-tight truncate max-w-[70px] text-center text-slate-700 dark:text-slate-200"
                >
                  {m.nombre}
                </span>
              </button>
            )
          })
        )}
      </div>

      {/* Flecha Derecha */}
      <button
        type="button"
        onClick={handleScrollRight}
        className="w-8 h-8 rounded-full bg-[#01a59c]/15 text-[#01a59c] hover:bg-[#01a59c] hover:text-white flex items-center justify-center transition-colors shrink-0"
        title="Ver métodos siguientes"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  )
}

