import React from 'react'
import { DocumentTextIcon, ReceiptPercentIcon, TicketIcon } from '@heroicons/react/24/outline'

const TIPOS_DOC = [
  { id: 'factura', label: 'Factura', icon: DocumentTextIcon },
  { id: 'boleta', label: 'Boleta', icon: ReceiptPercentIcon },
  { id: 'vale', label: 'Vale', icon: TicketIcon }
]

export default function TipoDocumentoSelector({ tipoDocumento, onChange }) {
  return (
    <div className="flex items-center rounded-xl overflow-hidden border border-[#017871] bg-[#01473d] shadow-inner">
      {TIPOS_DOC.map((tipo) => {
        const isActive = tipoDocumento === tipo.id
        return (
          <button
            key={tipo.id}
            type="button"
            onClick={() => onChange(tipo.id)}
            className={`flex-1 py-4 px-4 text-sm font-bold tracking-wide transition-all duration-200 rounded-lg flex items-center justify-center gap-1.5 ${
              isActive
                ? 'bg-[#018e86] text-white border-white border-2 shadow-md scale-[1.02]'
                : 'bg-transparent text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>{tipo.label}</span>
          </button>
        )
      })}
    </div>
  )
}
