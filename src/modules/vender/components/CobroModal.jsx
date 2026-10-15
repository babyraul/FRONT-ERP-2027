import React, { useState, useEffect } from 'react'
import {
  BanknotesIcon,
  CreditCardIcon,
  QrCodeIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'
import Modal from '../../../components/ui/Modal.jsx'
import { toast } from '../../../utils/toast.js'

const METODOS_PAGO = [
  { id: 'efectivo', label: 'Efectivo', icon: BanknotesIcon },
  { id: 'yape', label: 'Yape / Plin', icon: QrCodeIcon },
  { id: 'tarjeta', label: 'Tarjeta', icon: CreditCardIcon },
  { id: 'transferencia', label: 'Transferencia', icon: ArrowPathIcon },
  { id: 'credito', label: 'Crédito', icon: CalendarDaysIcon }
]

const BILLETES_RAPIDOS = [10, 20, 50, 100, 200]

export default function CobroModal({
  isOpen,
  onClose,
  total = 0,
  tipoDocumento = 'boleta',
  cliente,
  placa = '',
  cartItems = [],
  onConfirmarVenta,
  isProcessing = false
}) {
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [montoRecibido, setMontoRecibido] = useState(total)
  const [referenciaPago, setReferenciaPago] = useState('')
  const [diasCredito, setDiasCredito] = useState(30)

  // Al abrir el modal, resetear el monto recibido con el total actual
  useEffect(() => {
    if (isOpen) {
      setMontoRecibido(total)
      setMetodoPago('efectivo')
      setReferenciaPago('')
    }
  }, [isOpen, total])

  const vuelto = Math.max(0, Number(montoRecibido) - total)
  const faltaPagar = Math.max(0, total - Number(montoRecibido))

  const handleBotonBillete = (monto) => {
    setMontoRecibido(monto)
  }

  const handleExacto = () => {
    setMontoRecibido(total)
  }

  const handleConfirmar = () => {
    if (metodoPago === 'efectivo' && Number(montoRecibido) < total) {
      toast.error('Monto insuficiente', `Faltan S/ ${faltaPagar.toFixed(2)} para completar el total.`)
      return
    }

    if (tipoDocumento === 'factura' && (!cliente?.numero_documento || cliente.numero_documento.length !== 11)) {
      toast.error('RUC Requerido', 'Para emitir Factura se debe seleccionar un cliente con RUC válido de 11 dígitos.')
      return
    }

    const payload = {
      cliente_id: cliente?.id || null,
      tipo_documento: tipoDocumento,
      placa: placa.trim() || null,
      metodo_pago: metodoPago,
      monto_recibido: Number(montoRecibido),
      vuelto: vuelto,
      referencia_pago: referenciaPago,
      dias_credito: metodoPago === 'credito' ? diasCredito : null,
      items: cartItems.map((item) => ({
        producto_id: item.producto_id,
        presentacion_id: item.presentacion_id,
        nombre: item.nombre_completo,
        cantidad: Number(item.cantidad),
        precio_unitario: Number(item.precio_unitario),
        subtotal: Number(item.cantidad) * Number(item.precio_unitario)
      })),
      total: total
    }

    onConfirmarVenta(payload)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Finalizar Venta / Cobro" size="lg">
      <div className="space-y-5">
        {/* Resumen Superior de la Venta */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#01473d] text-white">
                {tipoDocumento}
              </span>
              <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                {cliente?.nombre_razon_social || 'VARIOS'}
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 font-mono">
              {cliente?.numero_documento && <span>Doc: {cliente.numero_documento}</span>}
              {placa && <span>• Placa: {placa}</span>}
              <span>• Items: {cartItems.length}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium block">Total a Pagar</span>
            <span className="text-2xl font-black text-[#01a59c] font-mono">
              S/ {total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Métodos de Pago */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
            Método de Pago
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {METODOS_PAGO.map((m) => {
              const Icon = m.icon
              const isSelected = metodoPago === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMetodoPago(m.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                    isSelected
                      ? 'border-[#01a59c] bg-[#01a59c]/10 text-[#01a59c] shadow-xs ring-1 ring-[#01a59c]'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{m.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Detalle según método de pago */}
        {metodoPago === 'efectivo' && (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Monto Recibido (S/):
              </label>
              <input
                type="number"
                step="0.10"
                min={total}
                value={montoRecibido}
                onChange={(e) => setMontoRecibido(parseFloat(e.target.value) || 0)}
                className="w-40 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-right font-mono font-bold text-base text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#01a59c]"
              />
            </div>

            {/* Billetes rápidos */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 mr-1">Rápidos:</span>
              <button
                type="button"
                onClick={handleExacto}
                className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-[#01a59c] hover:text-white rounded text-xs font-medium font-mono transition-colors"
              >
                Exacto
              </button>
              {BILLETES_RAPIDOS.map((billete) => (
                <button
                  key={billete}
                  type="button"
                  onClick={() => handleBotonBillete(billete)}
                  className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-[#01a59c] hover:text-white rounded text-xs font-medium font-mono transition-colors"
                >
                  S/ {billete}
                </button>
              ))}
            </div>

            {/* Cálculo de Vuelto / Cambio */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Vuelto a Entregar:
              </span>
              <span className={`text-xl font-black font-mono ${faltaPagar > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                S/ {vuelto.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {(metodoPago === 'yape' || metodoPago === 'tarjeta' || metodoPago === 'transferencia') && (
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              N° de Operación / Referencia (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: 148291"
              value={referenciaPago}
              onChange={(e) => setReferenciaPago(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#01a59c]"
            />
          </div>
        )}

        {metodoPago === 'credito' && (
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Días de Crédito
            </label>
            <input
              type="number"
              min={1}
              value={diasCredito}
              onChange={(e) => setDiasCredito(parseInt(e.target.value) || 30)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#01a59c]"
            />
          </div>
        )}

        {/* Botones de Cancelar y Confirmar */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmar}
            disabled={isProcessing}
            className="btn-primary py-2.5 px-6 text-base font-bold shadow-md hover:shadow-lg flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <CheckBadgeIcon className="h-5 w-5" />
                <span>Confirmar y Emitir</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
