import React from 'react'
import {
  UserCircleIcon,
  DocumentTextIcon,
  ReceiptPercentIcon,
  TicketIcon,
  CreditCardIcon,
  ClockIcon,
  TagIcon,
  CalendarDaysIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline'
import Modal from '../../../components/ui/Modal.jsx'

export default function DetallePreventaModal({
  isOpen,
  onClose,
  preventa,
  onCobrar,
  onEditar
}) {
  if (!preventa) return null

  const codigo = preventa.codigo || (preventa.id ? `PV-${String(preventa.id).slice(0, 4)}` : 'PV-0001')
  const tipoDoc = (preventa.tipo_documento || 'boleta').toLowerCase()
  const fechaStr = preventa.created_at ? new Date(preventa.created_at).toLocaleString() : (preventa.fecha || '-')
  const total = Number(preventa.total || preventa.total_preventa || 0)
  const gravado = Number(preventa.gravadas || (total / 1.18).toFixed(2))
  const igv = Number(preventa.igv || (total - gravado).toFixed(2))
  const items = preventa.detalles || preventa.items || []

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalle de Pre-Venta: ${codigo}`}
      subtitle="Información completa de la reserva y productos"
      maxWidth="max-w-3xl"
      showFooter={false}
    >
      <div className="space-y-4">
        {/* Banner de Cabecera con Datos Clave */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Cliente */}
          <div className="col-span-2">
            <span className="text-slate-400 block font-semibold uppercase text-[10px] tracking-wider">Cliente</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate" title={preventa.cliente_nombre}>
                {preventa.cliente_nombre || preventa.nombre_razon_social || preventa.cliente || 'VARIOS'}
              </span>
              <span className="font-mono text-slate-500 bg-slate-200/70 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                {preventa.cliente_numero_documento || preventa.numero_documento || '99999999'}
              </span>
            </div>
            {preventa.cliente_direccion && (
              <p className="text-[11px] text-slate-400 truncate mt-0.5">{preventa.cliente_direccion}</p>
            )}
          </div>

          {/* Alias */}
          <div>
            <span className="text-slate-400 block font-semibold uppercase text-[10px] tracking-wider">Alias / Placa</span>
            <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 mt-0.5 inline-block bg-teal-50 dark:bg-teal-950/40 text-[#01a59c] px-2 py-0.5 rounded-lg border border-teal-200/50 dark:border-teal-800/50">
              {preventa.alias || preventa.placa || '-'}
            </span>
          </div>

          {/* Usuario Responsable */}
          <div>
            <span className="text-slate-400 block font-semibold uppercase text-[10px] tracking-wider">Registrado por</span>
            <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 mt-0.5 block truncate" title={preventa.usuario_nombre}>
              {preventa.usuario_nombre || preventa.usuario || 'Sistema'}
            </span>
          </div>

          {/* Fecha / Hora */}
          <div>
            <span className="text-slate-400 block font-semibold uppercase text-[10px] tracking-wider">Fecha de Emisión</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 mt-0.5 block text-xs">
              {fechaStr}
            </span>
          </div>

          {/* Comprobante */}
          <div>
            <span className="text-slate-400 block font-semibold uppercase text-[10px] tracking-wider">Tipo Documento</span>
            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase ${
              tipoDoc.includes('factura')
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
            }`}>
              {tipoDoc}
            </span>
          </div>

          {/* Estado */}
          <div>
            <span className="text-slate-400 block font-semibold uppercase text-[10px] tracking-wider">Estado</span>
            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              {preventa.estado || 'PENDIENTE'}
            </span>
          </div>

          {/* Total Venta */}
          <div>
            <span className="text-slate-400 block font-semibold uppercase text-[10px] tracking-wider">Total Preventa</span>
            <span className="font-black text-base text-[#01a59c] mt-0.5 block font-mono">
              S/. {total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Tabla de Productos / Ítems */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Productos en Preventa ({items.length})
            </h4>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#01473d] text-white uppercase text-[11px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Producto / Presentación</th>
                  <th className="py-2.5 px-3 text-center w-20">Cant.</th>
                  <th className="py-2.5 px-3 text-right w-24">P. Unitario</th>
                  <th className="py-2.5 px-3 text-right w-24">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No hay detalles registrados para esta preventa.
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => {
                    const cant = Number(it.cantidad || 1)
                    const pUnit = Number(it.precio_unitario || it.precio || 0)
                    const sub = Number(it.subtotal || it.total || (cant * pUnit))
                    return (
                      <tr key={it.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          {it.nombre_completo || it.producto_nombre || it.nombre || it.descripcion || 'PRODUCTO'}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                          {cant}
                        </td>
                        <td className="py-2 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                          S/. {pUnit.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                          S/. {sub.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/60 font-semibold border-t border-slate-200 dark:border-slate-700 text-xs">
                <tr>
                  <td colSpan={3} className="py-1.5 px-3 text-right text-slate-500">Op. Gravada:</td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-800 dark:text-slate-200">S/. {gravado.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-1.5 px-3 text-right text-slate-500">IGV (18%):</td>
                  <td className="py-1.5 px-3 text-right font-mono text-slate-800 dark:text-slate-200">S/. {igv.toFixed(2)}</td>
                </tr>
                <tr className="border-t border-slate-200 dark:border-slate-700 font-bold text-sm">
                  <td colSpan={3} className="py-2 px-3 text-right text-slate-900 dark:text-white">TOTAL:</td>
                  <td className="py-2 px-3 text-right font-mono font-black text-[#01a59c]">S/. {total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer del Modal con Acción de Cobro y Edición */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2">
            {onEditar && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onEditar(preventa)
                }}
                className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <PencilSquareIcon className="h-4 w-4" />
                <span>Editar Pre-Venta</span>
              </button>
            )}

            {onCobrar && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onCobrar(preventa)
                }}
                className="px-5 py-2.5 bg-[#01473d] hover:bg-[#025a4d] text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
              >
                <CreditCardIcon className="h-4 w-4" />
                <span>Proceder a Cobrar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
