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
  InformationCircleIcon,
  PrinterIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import AperturaTurnoModal from '../components/AperturaTurnoModal.jsx'
import CierreTurnoModal from '../components/CierreTurnoModal.jsx'
import MovimientoModal from '../components/MovimientoModal.jsx'
import { cajaController } from '../controllers/caja.js'
import { toast } from '../../../utils/toast.js'
import Can from '../../../components/ui/Can.jsx'
import PageHeader from '../../../components/ui/PageHeader.jsx'
import { RefreshButton } from '../../../components/ui/ActionButtons.jsx'
import { useAuthStore } from '../../../store/useAuthStore.js'
import { imprimirTicketMovimiento, imprimirTicketCierre } from '../../../utils/ticketPrint.js'

export default function Caja() {
  const [turnoActivo, setTurnoActivo] = useState(null)
  const [cajasConfiguradas, setCajasConfiguradas] = useState([])
  const [metodosPago, setMetodosPago] = useState([])
  const [movimientosTurno, setMovimientosTurno] = useState([])
  const [ventasTurno, setVentasTurno] = useState([])
  const [loading, setLoading] = useState(true)

  // Pestaña activa en la gestión del turno
  const [activeTab, setActiveTab] = useState('movimientos') // 'movimientos' | 'ventas'

  // Modales
  const [isAperturaOpen, setAperturaOpen] = useState(false)
  const [isCierreOpen, setCierreOpen] = useState(false)
  const [isMovimientoOpen, setMovimientoOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Estado para ver arqueo por movimiento
  const [expandedMovimientoId, setExpandedMovimientoId] = useState(null)
  const [arqueosMap, setArqueosMap] = useState({})
  const [loadingArqueoId, setLoadingArqueoId] = useState(null)

  const toggleVerArqueo = async (movimientoId) => {
    if (expandedMovimientoId === movimientoId) {
      setExpandedMovimientoId(null)
      return
    }

    setExpandedMovimientoId(movimientoId)

    if (!arqueosMap[movimientoId]) {
      setLoadingArqueoId(movimientoId)
      const res = await cajaController.getArqueoPorMovimiento(movimientoId)
      if (res.success && res.data) {
        setArqueosMap(prev => ({ ...prev, [movimientoId]: res.data }))
      }
      setLoadingArqueoId(null)
    }
  }

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

      // Impresión de Ticket de Cierre / Arqueo 80mm
      const infoEmpresa = {
        razon_social: user?.empresa_nombre || user?.active_acceso?.empresa_nombre || 'EMPRESA',
        ruc: user?.empresa_ruc || user?.active_acceso?.empresa_ruc || '',
        direccion: user?.sucursal_direccion || user?.active_acceso?.sucursal_nombre || ''
      }
      imprimirTicketCierre({
        ...turnoActivo,
        ...(res.data || {}),
        totales: formData.totales_cierre || turnoActivo.totales
      }, infoEmpresa)

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

      // Impresión automática de Ticket Térmico de Movimiento 80mm
      const infoEmpresa = {
        razon_social: user?.empresa_nombre || user?.active_acceso?.empresa_nombre || 'EMPRESA',
        ruc: user?.empresa_ruc || user?.active_acceso?.empresa_ruc || '',
        direccion: user?.sucursal_direccion || user?.active_acceso?.sucursal_nombre || '',
        identificador_caja: turnoActivo.identificador_caja
      }
      imprimirTicketMovimiento(res.data, infoEmpresa)

      loadData()
    } else {
      toast.error(res.error || 'Error al registrar movimiento')
    }
    setIsProcessing(false)
  }

  // Cálculo de Efectivo en Caja reuniendo pagos de ventas_pagos en efectivo, fondo de apertura y movimientos
  const totalEfectivoSistema = useMemo(() => {
    if (!turnoActivo) return 0
    if (turnoActivo.efectivo_total_en_caja !== undefined) {
      return Number(turnoActivo.efectivo_total_en_caja || 0)
    }
    if (!Array.isArray(turnoActivo.totales)) return 0
    const totEfectivo = turnoActivo.totales.find(t => String(t.metodo_pago_id) === '1' || String(t.metodo_pago_id) === '01')
    return totEfectivo ? (Number(totEfectivo.monto_apertura || 0) + Number(totEfectivo.monto_sistema || 0)) : 0
  }, [turnoActivo])

  // Total acumulado de ventas
  const totalVentasMonto = useMemo(() => {
    return ventasTurno.reduce((acc, v) => acc + (Number(v.total_venta || 0)), 0)
  }, [ventasTurno])

  return (
    <div className="space-y-6 p-6 mx-auto">
      {/* ── ENCABEZADO MODULAR GLOBAL ── */}
      <PageHeader
        title="Gestión de Caja"
        subtitle={
          turnoActivo
            ? `Turno Abierto: ${turnoActivo.identificador_caja} • Cajero: ${turnoActivo.usuario_nombre || user?.nombre || 'Usuario'}`
            : 'Control de turnos, arqueos y movimientos de gaveta'
        }
        actions={
          <div className="flex items-center gap-2">
            <RefreshButton
              onClick={loadData}
              loading={loading}
              title="Actualizar estado de caja"
            />

            {turnoActivo ? (
              <>
                <button
                  onClick={() => {
                    setCierreOpen(false)
                    setMovimientoOpen(true)
                  }}
                  className="btn-primary text-xs flex items-center gap-1.5 py-2 px-3.5 rounded-xl shadow-xs font-semibold cursor-pointer"
                  title="Registrar entrada o retiro de dinero en gaveta"
                >
                  <PlusIcon className="h-4 w-4 text-white" /> Nuevo Movimiento
                </button>

                <Can I="editar" a="cajas">
                  <button
                    onClick={() => {
                      setMovimientoOpen(false)
                      setCierreOpen(true)
                    }}
                    className="btn-danger text-xs flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl shadow-xs font-semibold cursor-pointer"
                    title="Realizar arqueo y cierre de turno"
                  >
                    <LockClosedIcon className="h-4 w-4" /> Cerrar Turno
                  </button>
                </Can>
              </>
            ) : (
              !isAperturaOpen && (
                <Can I="crear" a="cajas">
                  <button
                    onClick={() => setAperturaOpen(true)}
                    className="btn-primary text-xs flex items-center gap-1.5 py-2 px-3.5 rounded-xl shadow-xs font-semibold cursor-pointer"
                    title="Aperturar turno de caja"
                  >
                    <PlusIcon className="h-4 w-4 text-white" /> Aperturar Turno
                  </button>
                </Can>
              )
            )}
          </div>
        }
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-medium">Verificando estado de tu turno...</p>
        </div>
      ) : turnoActivo ? (
        <div className="space-y-6">
          {/* Banner de Turno Activo */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                  <LockOpenIcon className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-extrabold text-slate-900 dark:text-white text-lg">
                      Turno Activo: {turnoActivo.identificador_caja}
                    </span>
                    <span className="badge-green text-xs">Abierto</span>
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
                  onClick={() => {
                    setCierreOpen(false)
                    setMovimientoOpen(true)
                  }}
                  className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
                  title="Registrar entrada o retiro de dinero en gaveta"
                >
                  <PlusIcon className="h-4 w-4 text-white" /> Nuevo Movimiento
                </button>

                <Can I="editar" a="cajas">
                  <button
                    onClick={() => {
                      setMovimientoOpen(false)
                      setCierreOpen(true)
                    }}
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

          {/* Navegación por Pestañas del Turno O Panel de Acción con Transición Animada In-Place */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
            {isMovimientoOpen ? (
              <MovimientoModal
                isOpen={isMovimientoOpen}
                onClose={() => setMovimientoOpen(false)}
                onSave={handleSaveMovimiento}
                turno={turnoActivo}
                saldoDisponible={totalEfectivoSistema}
                isProcessing={isProcessing}
                variant="inline"
              />
            ) : isCierreOpen ? (
              <CierreTurnoModal
                isOpen={isCierreOpen}
                onClose={() => setCierreOpen(false)}
                onSave={handleSaveCierre}
                turno={turnoActivo}
                metodosPago={metodosPago}
                isProcessing={isProcessing}
                variant="inline"
              />
            ) : (
              <div className="transition-all duration-300 ease-in-out opacity-100 translate-y-0">
                <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 px-5 pt-3">
                  <button
                    onClick={() => setActiveTab('movimientos')}
                    className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${activeTab === 'movimientos'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                      }`}
                  >
                    <ArrowTrendingUpIcon className="h-4 w-4" />
                    Movimientos de Gaveta ({movimientosTurno.length})
                  </button>

                  <button
                    onClick={() => setActiveTab('ventas')}
                    className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${activeTab === 'ventas'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                      }`}
                  >
                    <ShoppingBagIcon className="h-4 w-4" />
                    Comprobantes del Turno ({ventasTurno.length})
                  </button>
                </div>

                <div className="p-5">

                  {/* TAB 2: MOVIMIENTOS MANUALES */}
                  {activeTab === 'movimientos' && (
                    <div className="space-y-4">
                      {movimientosTurno.length === 0 ? (
                        <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                          No hay movimientos manuales registrados en este turno.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
                          {movimientosTurno.map((m) => {
                            const isExpanded = expandedMovimientoId === m.id
                            const arq = arqueosMap[m.id]
                            const isLoadingArq = loadingArqueoId === m.id

                            return (
                              <div key={m.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                <div className="p-3.5 flex items-center justify-between gap-4 text-xs">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl shrink-0 ${m.tipo_movimiento === 'INGRESO' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'}`}>
                                      {m.tipo_movimiento === 'INGRESO' ? (
                                        <ArrowTrendingUpIcon className="h-5 w-5" />
                                      ) : (
                                        <ArrowTrendingDownIcon className="h-5 w-5" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-900 dark:text-white">{m.concepto}</p>
                                      <p className="text-[11px] text-slate-600 mt-0.5">
                                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Registrado por: {m.usuario_nombre || 'Usuario'}
                                      </p>
                                      {m.observacion && <p className="text-[11px] text-slate-500 mt-0.5">{m.observacion}</p>}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div className={`font-mono text-sm font-black ${m.tipo_movimiento === 'INGRESO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                      {m.tipo_movimiento === 'INGRESO' ? '+' : '-'} S/ {Number(m.monto_total || 0).toFixed(2)}
                                    </div>

                                    {/* Botón Ver Arqueo Desglosado */}
                                    <button
                                      type="button"
                                      onClick={() => toggleVerArqueo(m.id)}
                                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 ${isExpanded
                                        ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300'
                                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
                                        }`}
                                      title="Ver desglose del arqueo registrado en este movimiento"
                                    >
                                      <EyeIcon className="h-3.5 w-3.5" />
                                      <span>{isExpanded ? 'Ocultar' : 'Ver'}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const infoEmpresa = {
                                          razon_social: user?.empresa_nombre || user?.active_acceso?.empresa_nombre || 'EMPRESA',
                                          ruc: user?.empresa_ruc || user?.active_acceso?.empresa_ruc || '',
                                          direccion: user?.sucursal_direccion || user?.active_acceso?.sucursal_nombre || '',
                                          identificador_caja: turnoActivo?.identificador_caja
                                        }
                                        imprimirTicketMovimiento(m, infoEmpresa)
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                      title="Reimprimir Ticket de Movimiento (80mm)"
                                    >
                                      <PrinterIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Desglose del Arqueo en acordeón / panel desplegable */}
                                {isExpanded && (
                                  <div className="bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 p-4">
                                    {isLoadingArq ? (
                                      <div className="text-center py-3 text-xs text-slate-400">
                                        Cargando desglose de arqueo...
                                      </div>
                                    ) : arq ? (
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                            Desglose de Efectivo por Denominación
                                          </span>
                                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                            Total: S/ {Number(arq.subtotal || m.monto_total || 0).toFixed(2)}
                                          </span>
                                        </div>

                                        {(() => {
                                          const billetesRegistrados = [
                                            { label: 'S/ 200', cant: arq.billete_200, val: 200 },
                                            { label: 'S/ 100', cant: arq.billete_100, val: 100 },
                                            { label: 'S/ 50', cant: arq.billete_50, val: 50 },
                                            { label: 'S/ 20', cant: arq.billete_20, val: 20 },
                                            { label: 'S/ 10', cant: arq.billete_10, val: 10 }
                                          ].filter(item => Number(item.cant || 0) > 0)

                                          const monedasRegistradas = [
                                            { label: 'S/ 5.00', cant: arq.moneda_5, val: 5 },
                                            { label: 'S/ 2.00', cant: arq.moneda_2, val: 2 },
                                            { label: 'S/ 1.00', cant: arq.moneda_1, val: 1 },
                                            { label: 'S/ 0.50', cant: arq.moneda_050, val: 0.5 },
                                            { label: 'S/ 0.20', cant: arq.moneda_020, val: 0.2 },
                                            { label: 'S/ 0.10', cant: arq.moneda_010, val: 0.1 }
                                          ].filter(item => Number(item.cant || 0) > 0)

                                          const tieneRegistros = billetesRegistrados.length > 0 || monedasRegistradas.length > 0

                                          if (!tieneRegistros) {
                                            return (
                                              <div className="text-center py-2 text-xs text-slate-400">
                                                No hay denominaciones registradas para este movimiento.
                                              </div>
                                            )
                                          }

                                          return (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                              {/* Columna Billetes (solo si tiene registrados) */}
                                              {billetesRegistrados.length > 0 && (
                                                <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
                                                  <div className="bg-slate-100/60 dark:bg-slate-800/60 px-3 py-1 font-bold text-[10px] uppercase text-slate-500">
                                                    Billetes
                                                  </div>
                                                  <div className="divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-1">
                                                    {billetesRegistrados.map(item => (
                                                      <div key={item.label} className="flex justify-between items-center text-[12px]">
                                                        <span className="text-slate-500 dark:text-slate-300 font-semibold">{item.label}</span>
                                                        <span className="text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] font-bold">x{item.cant}</span>
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                                          S/ {(item.cant * item.val).toFixed(2)}
                                                        </span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}

                                              {/* Columna Monedas (solo si tiene registradas) */}
                                              {monedasRegistradas.length > 0 && (
                                                <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
                                                  <div className="bg-slate-100/60 dark:bg-slate-800/60 px-3 py-1 font-bold text-[10px] uppercase text-slate-500">
                                                    Monedas
                                                  </div>
                                                  <div className="divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-1">
                                                    {monedasRegistradas.map(item => (
                                                      <div key={item.label} className="flex justify-between items-center text-[12px]">
                                                        <span className="text-slate-600 dark:text-slate-300 font-semibold">{item.label}</span>
                                                        <span className="text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-bold">x{item.cant}</span>
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                                          S/ {(item.cant * item.val).toFixed(2)}
                                                        </span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          )
                                        })()}
                                      </div>
                                    ) : (
                                      <div className="text-center py-2 text-xs text-slate-400">
                                        No se encontró registro de arqueo para este movimiento.
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
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
            )}
          </div>
        </div>
      ) : (
        /* ═════════════════════════════════════════════════════════════════════
           ESTADO B: EL USUARIO NO TIENE TURNO ABIERTO (APERTURA IN-PLACE)
           ═════════════════════════════════════════════════════════════════════ */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
          {isAperturaOpen ? (
            <AperturaTurnoModal
              isOpen={isAperturaOpen}
              onClose={() => setAperturaOpen(false)}
              onSave={handleSaveApertura}
              cajasConfiguradas={cajasConfiguradas}
              metodosPago={metodosPago}
              isProcessing={isProcessing}
              variant="inline"
            />
          ) : (
            <div className="p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5 transition-all duration-300 ease-in-out opacity-100 translate-y-0">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-sm border border-blue-100 dark:border-blue-900/40">
                <LockClosedIcon className="h-8 w-8" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  No tienes un turno de caja abierto
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Para poder emitir comprobantes y cobrar ventas es indispensable contar con una sesión de caja activa.
                </p>
              </div>

              <div className="pt-2">
                <Can I="crear" a="cajas">
                  <button
                    onClick={() => setAperturaOpen(true)}
                    className="btn-primary py-3 px-6 text-sm font-bold flex items-center gap-2 mx-auto rounded-xl shadow-md shadow-blue-500/20 cursor-pointer"
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
        </div>
      )}
    </div>
  )
}
