import Modal from '../../../components/ui/Modal.jsx'
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UserCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

export default function DetalleTurnoModal({ isOpen, onClose, turno }) {
  if (!isOpen || !turno) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Resumen de Turno — ${turno.identificador_caja}`}
      subtitle={`Estado: ${turno.estado}`}
      maxWidth="max-w-2xl"
      hideConfirm={true}
      cancelText="Cerrar"
    >
      <div className="space-y-5">
        {/* Datos Principales */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Responsable</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <UserCircleIcon className="h-3.5 w-3.5 text-blue-500" />
              {turno.usuario_nombre || 'Usuario'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Apertura</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5 text-emerald-500" />
              {new Date(turno.fecha_apertura).toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Fondo Inicial en Efectivo</span>
            <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
              S/ {Number(turno.monto_apertura || 0).toFixed(2)}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Cierre</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {turno.fecha_cierre_f ? new Date(turno.fecha_cierre_f).toLocaleString() : 'En curso...'}
            </span>
          </div>
        </div>

        {/* Resumen Analítico del Turno (si ya fue cerrado) */}
        {turno.resumen && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200/70 dark:border-slate-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Ventas Brutas</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">S/ {Number(turno.resumen.total_ventas_brutas || 0).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Comprobantes</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{turno.resumen.cantidad_documentos_emitidos || 0} emitidos</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Facturas / Boletas</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{turno.resumen.cantidad_facturas || 0} F / {turno.resumen.cantidad_boletas || 0} B</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Ingresos / Egresos</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">+S/ {Number(turno.resumen.total_ingresos || 0).toFixed(2)} / -S/ {Number(turno.resumen.total_egresos || 0).toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Desglose de Totales por Método de Pago */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <CurrencyDollarIcon className="h-4 w-4" />
            Balance por Métodos de Pago
          </h4>

          <div className="overflow-x-auto border border-slate-200/70 dark:border-slate-800 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 border-b border-slate-200/70 dark:border-slate-800">
                <tr>
                  <th className="px-3.5 py-2.5 font-semibold">Método de Pago</th>
                  <th className="px-3.5 py-2.5 font-semibold text-right">Ventas Sistema (S/)</th>
                  <th className="px-3.5 py-2.5 font-semibold text-right">Declarado (S/)</th>
                  <th className="px-3.5 py-2.5 font-semibold text-right">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {Array.isArray(turno.totales) && turno.totales.length > 0 ? (
                  turno.totales.map((t) => {
                    const dif = Number(t.diferencia || 0)
                    return (
                      <tr key={t.id || t.metodo_pago_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="px-3.5 py-2 font-sans font-medium text-slate-800 dark:text-slate-200">
                          {t.metodo_pago_nombre || `Método ${t.metodo_pago_id}`}
                        </td>
                        <td className="px-3.5 py-2 text-right text-blue-600 dark:text-blue-400 font-semibold">
                          {Number(t.monto_sistema || 0).toFixed(2)}
                        </td>
                        <td className="px-3.5 py-2 text-right font-semibold">
                          {Number(t.monto_declarado || 0).toFixed(2)}
                        </td>
                        <td className={`px-3.5 py-2 text-right font-bold ${
                          dif === 0 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : dif > 0 
                              ? 'text-blue-600' 
                              : 'text-rose-600'
                        }`}>
                          {dif >= 0 ? `+${dif.toFixed(2)}` : dif.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="px-3.5 py-4 text-center text-slate-400 font-sans italic">
                      Sin movimientos registrados aún en este turno.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ventas Registradas en el Turno */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <ShoppingBagIcon className="h-4 w-4" />
              Comprobantes Emitidos ({turno.resumen_ventas?.cantidad || (turno.ventas?.length || 0)})
            </h4>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono">
              Total: S/ {Number(turno.resumen_ventas?.total || 0).toFixed(2)}
            </span>
          </div>

          <div className="max-h-48 overflow-y-auto border border-slate-200/70 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
            {Array.isArray(turno.ventas) && turno.ventas.length > 0 ? (
              turno.ventas.map((v) => (
                <div key={v.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                      {v.serie}-{String(v.correlativo || 0).padStart(8, '0')}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {v.tipo_comprobante_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-sans text-[11px]">
                      {v.fecha_emision ? new Date(v.fecha_emision).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      S/ {Number(v.total_venta || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs italic">
                No se registraron ventas en este turno.
              </div>
            )}
          </div>
        </div>

      </div>
    </Modal>
  )
}
