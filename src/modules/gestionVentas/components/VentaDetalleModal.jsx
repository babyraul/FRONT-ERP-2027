import React from 'react'
import Modal from '../../../components/ui/Modal.jsx'

export default function VentaDetalleModal({ isOpen, onClose, venta }) {
  if (!venta) return null

  const items = venta.detalles || venta.items || []
  const pagos = venta.pagos || []
  const isAnulado = String(venta.estado || '').toUpperCase().includes('ANULAD')

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalle de Venta: ${venta.numero || `${venta.serie || ''}-${String(venta.correlativo || '').padStart(8, '0')}`}`}
      size="2xl"
    >
      <div className="space-y-4">
        {/* Resumen Principal de la Cabecera */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl text-xs border border-slate-200/60 dark:border-slate-800">
          <div>
            <span className="text-slate-400 block font-medium">Cliente:</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">
              {venta.cliente_nombre || 'VARIOS'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Documento:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
              {venta.cliente_numero_documento || '-'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Fecha Emisión:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {venta.fecha_emision ? new Date(venta.fecha_emision).toLocaleString('es-PE') : '-'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Modalidad:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {venta.modalidad_pago || (venta.tipo_pago_id === '2' ? 'Crédito' : 'Contado')}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Estado:</span>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isAnulado
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
              }`}
            >
              {venta.estado || 'EMITIDO'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Total Venta:</span>
            <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
              S/ {Number(venta.total || venta.total_venta || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Desglose de Medios de Pago si aplica */}
        {pagos.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Medios de Pago Aplicados
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {pagos.map((p, idx) => (
                <div key={p.id || idx} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs shadow-2xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">{p.metodo_nombre || 'Pago'}</span>
                  <span className="font-mono font-bold text-[#01a59c] text-sm">S/ {Number(p.monto || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ítems / Productos del Comprobante */}
        <div>
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Productos / Servicios
          </h3>
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs">
              <thead className="bg-slate-100/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-left">
                <tr>
                  <th className="p-2.5 font-bold uppercase text-[11px]">Producto</th>
                  <th className="p-2.5 text-center font-bold uppercase text-[11px]">Cant.</th>
                  <th className="p-2.5 text-right font-bold uppercase text-[11px]">P. Unitario</th>
                  <th className="p-2.5 text-right font-bold uppercase text-[11px]">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.length > 0 ? (
                  items.map((it, idx) => (
                    <tr key={it.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                      <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                        {it.producto_nombre || it.descripcion || it.nombre}
                      </td>
                      <td className="p-2.5 text-center font-mono font-medium">{Number(it.cantidad || 1).toFixed(2)}</td>
                      <td className="p-2.5 text-right font-mono">S/ {Number(it.precio_unitario || 0).toFixed(2)}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                        S/ {(Number(it.cantidad || 1) * Number(it.precio_unitario || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-400">
                      Detalle consolidado registrado por importe total.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subtotales Tributarios */}
        <div className="flex justify-end pt-2">
          <div className="w-full sm:w-64 space-y-1.5 text-xs bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 font-mono">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Op. Gravadas:</span>
              <span>S/ {Number(venta.gravadas || 0).toFixed(2)}</span>
            </div>
            {Number(venta.exoneradas || 0) > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Op. Exoneradas:</span>
                <span>S/ {Number(venta.exoneradas).toFixed(2)}</span>
              </div>
            )}
            {Number(venta.inafectas || 0) > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Op. Inafectas:</span>
                <span>S/ {Number(venta.inafectas).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>IGV (18%):</span>
              <span>S/ {Number(venta.igv || 0).toFixed(2)}</span>
            </div>
            {Number(venta.descuento || 0) > 0 && (
              <div className="flex justify-between text-rose-600 font-semibold">
                <span>Descuento:</span>
                <span>-S/ {Number(venta.descuento).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-900 dark:text-white font-bold text-sm pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>Total:</span>
              <span>S/ {Number(venta.total || venta.total_venta || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
