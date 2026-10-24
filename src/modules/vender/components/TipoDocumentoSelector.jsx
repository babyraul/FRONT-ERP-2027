import React from 'react'
import { DocumentTextIcon, ReceiptPercentIcon, TicketIcon, StarIcon } from '@heroicons/react/24/outline'

const TIPOS_DOC = [
  { id: 'factura', label: 'Factura', icon: DocumentTextIcon },
  { id: 'boleta', label: 'Boleta', icon: ReceiptPercentIcon },
  { id: 'vale', label: 'Vale', icon: TicketIcon }
]

export default function TipoDocumentoSelector({ tipoDocumento, onChange, tipoDefecto }) {
  return (
    <div className="flex items-center rounded-xl overflow-hidden border border-[#017871] bg-[#01473d] shadow-inner p-0.5 gap-0.5">
      {TIPOS_DOC.map((tipo) => {
        const isActive = tipoDocumento === tipo.id
        const isDefault = tipoDefecto === tipo.id

        return (
          <button
            key={tipo.id}
            type="button"
            onClick={() => onChange(tipo.id)}
            className={`flex-1 py-2 px-3 text-sm font-bold tracking-wide transition-all duration-200 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer relative ${isActive
              ? 'bg-[#018e86] text-white border-white border-2 shadow-md scale-[1.02]'
              : 'bg-transparent text-white/80 hover:text-white hover:bg-white/10'
              }`}
            title={isDefault ? `${tipo.label} (Predeterminado por la empresa)` : tipo.label}
          >
            <span>{tipo.label}</span>
            {/* {isDefault && (
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-amber-400 text-slate-900 font-extrabold uppercase shrink-0 shadow-2xs">
                Defecto
              </span>
            )} */}
          </button>
        )
      })}
    </div>
  )
}
