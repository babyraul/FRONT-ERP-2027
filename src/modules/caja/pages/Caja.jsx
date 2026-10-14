import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  PlusIcon,
  BanknotesIcon,
  LockOpenIcon,
  LockClosedIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalculatorIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ReceiptPercentIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import AperturaTurnoModal from '../components/AperturaTurnoModal.jsx'
import CierreTurnoModal from '../components/CierreTurnoModal.jsx'
import MovimientoModal from '../components/MovimientoModal.jsx'
import ArqueoModal from '../components/ArqueoModal.jsx'
import { cajaController } from '../controllers/caja.js'
import { toast } from '../../../utils/toast.js'
import Can from '../../../components/ui/Can.jsx'
import { useAuthStore } from '../../../store/useAuthStore.js'

export default function Caja() {
  const [turnoActivo, setTurnoActivo] = useState(null)
  const [cajasConfiguradas, setCajasConfiguradas] = useState([])
  const [metodosPago, setMetodosPago] = useState([])
  const [movimientosTurno, setMovimientosTurno] = useState([])
  const [ventasTurno, setVentasTurno] = useState([])
  const [loading, setLoading] = useState(true)

  // Pestaña activa en la gestión del turno
  const [activeTab, setActiveTab] = useState('metodos') // 'metodos' | 'movimientos' | 'ventas'

  // Modales
  const [isAperturaOpen, setAperturaOpen] = useState(false)
  const [isCierreOpen, setCierreOpen] = useState(false)
  const [isMovimientoOpen, setMovimientoOpen] = useState(false)
  const [isArqueoOpen, setArqueoOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const { user } = useAuthStore()
  const branchId = user?.active_acceso?.branch_id

  // Cargar turno activo del usuario y sus datos operativos
  const loadData = useCallback(async () => {
    setLoading(true)
    const [resActivo, resConfig, resMetodos] = await Promise.all([
      cajaController.getTurnoActivo(),
      cajaController.getCajasConfiguradas(),
      cajaController.getMetodosPago()
    ])

    if (resConfig.success) setCajasConfiguradas(resConfig.data)
    if (resMetodos.success) setMetodosPago(resMetodos.data)

    if (resActivo.success && resActivo.data?.id) {
      // Cargar detalle completo del turno (totales y ventas)
      const resDetalle = await cajaController.getTurnoDetalle(resActivo.data.id)
      if (resDetalle.success && resDetalle.data) {
        setTurnoActivo(resDetalle.data)
        setVentasTurno(resDetalle.data.ventas || [])
      } else {
        setTurnoActivo(resActivo.data)
      }

      // Cargar movimientos manuales
      const resMov = await cajaController.getMovimientos(resActivo.data.id)
      if (resMov.success) setMovimientosTurno(resMov.data)
    } else {
      setTurnoActivo(null)
      setMovimientosTurno([])
      setVentasTurno([])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData, branchId])

  // Aperturar Turno
  const handleSaveApertura = async (formData) => {
    setIsProcessing(true)
    const res = await cajaController.aperturarTurno(formData)
    if (res.success) {
      toast.success(res.message || 'Turno aperturado exitosamente')
      setAperturaOpen(false)
      loadData()
    } else {
      toast.error(res.error || res.message || 'Error al aperturar turno')
    }
    setIsProcessing(false)
  }

  // Cerrar Turno
  const handleSaveCierre = async (formData) => {
    if (!turnoActivo) return
    setIsProcessing(true)
    const res = await cajaController.cerrarTurno(turnoActivo.id, formData)
    if (res.success) {
      toast.success(res.message || 'Turno cerrado exitosamente')
      setCierreOpen(false)
      loadData()
    } else {
      toast.error(res.error || res.message || 'Error al cerrar turno')
    }
    setIsProcessing(false)
  }

  // Registrar Movimiento
  const handleSaveMovimiento = async (formData) => {
    if (!turnoActivo) return
    setIsProcessing(true)
    const res = await cajaController.createMovimiento(turnoActivo.id, formData)
    if (res.success) {
      toast.success(res.message || 'Movimiento registrado')
      setMovimientoOpen(false)
      loadData()
    } else {
      toast.error(res.error || 'Error al registrar movimiento')
    }
    setIsProcessing(false)
  }

  // Guardar Arqueo Físico
  const handleSaveArqueo = async (formData) => {
    if (!turnoActivo) return
    setIsProcessing(true)
    const res = await cajaController.saveArqueo(turnoActivo.id, formData)
    if (res.success) {
      toast.success('Conteo de arqueo guardado correctamente')
      setArqueoOpen(false)
    } else {
      toast.error(res.error || 'Error al guardar arqueo')
    }
    setIsProcessing(false)
  }

  // Cálculo de totales en efectivo
  const totalEfectivoSistema = useMemo(() => {
    if (!turnoActivo || !Array.isArray(turnoActivo.totales)) return 0
    const totEfectivo = turnoActivo.totales.find(t => String(t.metodo_pago_id) === '1' || String(t.metodo_pago_id) === '01')
    return totEfectivo ? (Number(totEfectivo.monto_apertura || 0) + Number(totEfectivo.monto_sistema || 0)) : 0
  }, [turnoActivo])

  // Total acumulado de ventas
  const totalVentasMonto = useMemo(() => {
    return ventasTurno.reduce((acc, v) => acc + (Number(v.total_venta || 0)), 0)
  }, [ventasTurno])

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-medium">Verificando estado de tu turno...</p>
        </div>
      ) : turnoActivo ? (
        <div className="space-y-6">
          {/* Banner de Turno Activo */}
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/30 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                  <LockOpenIcon className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-extrabold text-slate-900 dark:text-white text-lg">
                      Turno Abierto: {turnoActivo.identificador_caja}
                    </span>

                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                    <span>Apertura: {new Date(turnoActivo.fecha_apertura).toLocaleString()}</span>
                    <span>•</span>
                    <span>Cajero: <strong>{turnoActivo.usuario_nombre || user?.nombre || 'Usuario'}</strong></span>
                  </p>
                </div>
              </div>

              {/* Acciones del Turno */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                <button
                  onClick={() => setMovimientoOpen(true)}
                  className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
                  title="Registrar entrada o retiro de dinero en gaveta"
                >
                  <PlusIcon className="h-4 w-4 text-white" /> Nuevo Movimiento
                </button>

                <button
                  onClick={() => setArqueoOpen(true)}
                  className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
                  title="Conteo de monedas y billetes por denominación"
                >
                  <CalculatorIcon className="h-4 w-4 text-white" /> Arqueo Físico
                </button>

                <Can I="editar" a="cajas">
                  <button
                    onClick={() => setCierreOpen(true)}
                    className="btn-danger text-xs flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl shadow-sm font-semibold"
                  >
                    <LockClosedIcon className="h-4 w-4" /> Cerrar Turno
                  </button>
                </Can>
              </div>
            </div>
          </div>

          {/* Tarjetas de Métricas Rápidas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <BanknotesIcon className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Efectivo en Caja</span>
                <p className="text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                  S/ {totalEfectivoSistema.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <ShoppingBagIcon className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ventas del Turno</span>
                <p className="text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                  S/ {totalVentasMonto.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <ClockIcon className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Comprobantes Emitidos</span>
                <p className="text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                  {ventasTurno.length} tickets
                </p>
              </div>
            </div>
          </div>

          {/* Navegación por Pestañas del Turno: Métodos de Pago / Movimientos / Ventas */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 px-5 pt-3">
              <button
                onClick={() => setActiveTab('metodos')}
                className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'metodos'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                <CurrencyDollarIcon className="h-4 w-4" />
                Métodos de Pago y Balance ({turnoActivo.totales?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('movimientos')}
                className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'movimientos'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                <ArrowTrendingUpIcon className="h-4 w-4" />
                Movimientos de Gaveta ({movimientosTurno.length})
              </button>

              <button
                onClick={() => setActiveTab('ventas')}
                className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'ventas'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                <ShoppingBagIcon className="h-4 w-4" />
                Comprobantes del Turno ({ventasTurno.length})
              </button>
            </div>

            <div className="p-5">
              {/* TAB 1: MÉTODOS DE PAGO Y BALANCE */}
              {activeTab === 'metodos' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200/80 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Método de Pago</th>
                          <th className="px-4 py-3 text-right">Fondo Apertura</th>
                          <th className="px-4 py-3 text-right">Ventas del Sistema</th>
                          <th className="px-4 py-3 text-right">Total Sistema</th>
                          <th className="px-4 py-3">Estado / Observación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                        {Array.isArray(turnoActivo.totales) && turnoActivo.totales.length > 0 ? (
                          turnoActivo.totales.map((t) => {
                            const apertura = Number(t.monto_apertura || 0)
                            const sistema = Number(t.monto_sistema || 0)
                            const total = apertura + sistema
                            return (
                              <tr key={t.id || t.metodo_pago_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                                <td className="px-4 py-3 font-sans font-bold text-slate-800 dark:text-slate-200">
                                  {t.metodo_pago_nombre || `Método ${t.metodo_pago_id}`}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                                  S/ {apertura.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                                  S/ {sistema.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-white">
                                  S/ {total.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 font-sans text-slate-400 truncate max-w-xs">
                                  {t.observacion || '-'}
                                </td>
                              </tr>
                            )
                          })
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-4 py-6 text-center text-slate-400 font-sans italic">
                              Inicializando registros de balance para este turno...
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: MOVIMIENTOS MANUALES */}
              {activeTab === 'movimientos' && (
                <div className="space-y-4">
                  {/* <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Entradas y salidas extraordinarias de efectivo registradas manualmente durante la jornada
                    </p>
                    <button
                      onClick={() => setMovimientoOpen(true)}
                      className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
                    >
                      <PlusIcon className="h-3.5 w-3.5" /> Registrar Movimiento
                    </button>
                  </div> */}

                  {movimientosTurno.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                      No hay movimientos manuales registrados en este turno.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
                      {movimientosTurno.map((m) => (
                        <div key={m.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 text-xs">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${m.tipo_movimiento === 'INGRESO' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                              {m.tipo_movimiento === 'INGRESO' ? (
                                <ArrowTrendingUpIcon className="h-5 w-5" />
                              ) : (
                                <ArrowTrendingDownIcon className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{m.concepto}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Registrado por: {m.usuario_nombre || 'Usuario'}
                              </p>
                              {m.observacion && <p className="text-[11px] text-slate-500 mt-0.5">{m.observacion}</p>}
                            </div>
                          </div>

                          <div className={`font-mono text-sm font-black ${m.tipo_movimiento === 'INGRESO' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {m.tipo_movimiento === 'INGRESO' ? '+' : '-'} S/ {Number(m.monto_total || 0).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: COMPROBANTES DE VENTA DEL TURNO */}
              {activeTab === 'ventas' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Comprobantes emitidos desde este punto de venta durante el turno activo
                  </p>

                  {ventasTurno.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                      Aún no se han emitido comprobantes en este turno.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
                      {ventasTurno.map((v) => (
                        <div key={v.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                              {v.serie}-{String(v.correlativo || 0).padStart(8, '0')}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                              Tipo: {v.tipo_comprobante_id}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {v.fecha_emision ? new Date(v.fecha_emision).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>

                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            S/ {Number(v.total_venta || 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ═════════════════════════════════════════════════════════════════════
           ESTADO B: EL USUARIO NO TIENE TURNO ABIERTO (UN SOLO BOTÓN DE APERTURA)
           ═════════════════════════════════════════════════════════════════════ */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm text-center max-w-2xl mx-auto space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-sm border border-blue-100 dark:border-blue-900/40">
            <LockClosedIcon className="h-8 w-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              No tienes un turno de caja abierto
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Para registrar ventas, emitir comprobantes fiscales y gestionar cobros de efectivo, debes aperturar tu turno seleccionando tu caja física.
            </p>
          </div>

          <div className="pt-2">
            <Can I="crear" a="cajas">
              <button
                onClick={() => setAperturaOpen(true)}
                className="btn-primary py-3 px-6 text-sm font-bold flex items-center gap-2 mx-auto rounded-xl shadow-md shadow-blue-500/20"
              >
                <PlusIcon className="h-5 w-5" /> Aperturar Mi Turno Ahora
              </button>
            </Can>
          </div>

          {cajasConfiguradas.length > 0 && (
            <p className="text-xs text-slate-400 pt-2">
              {cajasConfiguradas.filter(c => c.disponible).length} de {cajasConfiguradas.length} cajas físicas disponibles en esta sucursal.
            </p>
          )}
        </div>
      )}

      {/* Modales de Gestión de Turno */}
      <AperturaTurnoModal
        isOpen={isAperturaOpen}
        onClose={() => setAperturaOpen(false)}
        onSave={handleSaveApertura}
        cajasConfiguradas={cajasConfiguradas}
        metodosPago={metodosPago}
        isProcessing={isProcessing}
      />

      <CierreTurnoModal
        isOpen={isCierreOpen}
        onClose={() => setCierreOpen(false)}
        onSave={handleSaveCierre}
        turno={turnoActivo}
        metodosPago={metodosPago}
        isProcessing={isProcessing}
      />

      <MovimientoModal
        isOpen={isMovimientoOpen}
        onClose={() => setMovimientoOpen(false)}
        onSave={handleSaveMovimiento}
        turno={turnoActivo}
        isProcessing={isProcessing}
      />

      <ArqueoModal
        isOpen={isArqueoOpen}
        onClose={() => setArqueoOpen(false)}
        onSave={handleSaveArqueo}
        turno={turnoActivo}
        montoSistemaEfectivo={totalEfectivoSistema}
        isProcessing={isProcessing}
      />
    </div>
  )
}
