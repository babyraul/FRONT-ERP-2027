import { useState, useEffect, useMemo } from 'react'
import Modal from '../../../components/ui/Modal.jsx'
import { toast } from '../../../utils/toast.js'
import {
  BanknotesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'

const DENOMINACIONES_BILLETES = [
  { valor: 200, label: 'S/ 200' },
  { valor: 100, label: 'S/ 100' },
  { valor: 50, label: 'S/ 50' },
  { valor: 20, label: 'S/ 20' },
  { valor: 10, label: 'S/ 10' }
]

const DENOMINACIONES_MONEDAS = [
  { valor: 5, label: 'S/ 5.00' },
  { valor: 2, label: 'S/ 2.00' },
  { valor: 1, label: 'S/ 1.00' },
  { valor: 0.5, label: 'S/ 0.50' },
  { valor: 0.2, label: 'S/ 0.20' },
  { valor: 0.1, label: 'S/ 0.10' }
]

const DENOMINACIONES_ESTANDAR = [...DENOMINACIONES_BILLETES, ...DENOMINACIONES_MONEDAS]

export default function CierreTurnoModal({
  isOpen,
  onClose,
  onSave,
  turno,
  metodosPago = [],
  isProcessing = false,
  variant = 'drawer'
}) {
  const [declarados, setDeclarados] = useState({})
  const [observacion, setObservacion] = useState('')
  const [cantidadesArqueo, setCantidadesArqueo] = useState({})
  const [mostrarArqueoEfectivo, setMostrarArqueoEfectivo] = useState(true)
  const [imgErrors, setImgErrors] = useState({})

  useEffect(() => {
    if (isOpen && turno) {
      const mapa = {}
      if (Array.isArray(turno.totales) && turno.totales.length > 0) {
        turno.totales.forEach(t => {
          const esEfectivo = String(t.metodo_pago_id) === '1' || String(t.metodo_pago_id) === '01'
          if (esEfectivo && turno.efectivo_total_en_caja !== undefined) {
            mapa[t.metodo_pago_id] = turno.efectivo_total_en_caja
          } else {
            mapa[t.metodo_pago_id] = t.monto_sistema || 0
          }
        })
      } else {
        mapa['1'] = turno.efectivo_total_en_caja || 0
      }
      setDeclarados(mapa)
      setObservacion('Cierre regular de operaciones del turno')
      setCantidadesArqueo({})
      setMostrarArqueoEfectivo(true)
    }
  }, [isOpen, turno])

  // Desglose reactivo de billetes y monedas
  const desgloseEfectivo = useMemo(() => {
    return DENOMINACIONES_ESTANDAR.map(d => {
      const cant = cantidadesArqueo[d.valor] || 0
      const subtotal = Math.round(d.valor * cant * 100) / 100
      return {
        ...d,
        cantidad: cant,
        subtotal
      }
    })
  }, [cantidadesArqueo])

  // Total acumulado por el desglose físico de billetes y monedas
  const totalArqueoEfectivo = useMemo(() => {
    return Math.round(desgloseEfectivo.reduce((acc, curr) => acc + curr.subtotal, 0) * 100) / 100
  }, [desgloseEfectivo])

  // Actualizar cantidades del conteo físico
  const handleCantidadArqueoChange = (valorDenom, cantidad) => {
    const cantNum = cantidad === '' ? '' : Math.max(0, parseInt(cantidad, 10) || 0)
    setCantidadesArqueo(prev => {
      const next = { ...prev, [valorDenom]: cantNum }
      // Recalcular y enlazar inmediatamente con el monto declarado de efectivo ('1')
      const nuevoTotal = DENOMINACIONES_ESTANDAR.reduce((acc, d) => {
        const c = next[d.valor] || 0
        return acc + Math.round(d.valor * c * 100) / 100
      }, 0)
      setDeclarados(decPrev => ({
        ...decPrev,
        '1': Math.round(nuevoTotal * 100) / 100
      }))
      return next
    })
  }

  if (!isOpen || !turno) return null

  const handleMontoChange = (metodoId, valor) => {
    setDeclarados(prev => ({
      ...prev,
      [metodoId]: valor === '' ? '' : Number(valor)
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const listaCierre = Object.entries(declarados).map(([metodoId, monto]) => ({
      metodo_pago_id: metodoId,
      monto_declarado: Number(monto || 0)
    }))

    // Regla de Negocio VAL-DUR-02 (Opción B acordada):
    // Se valida que el monto físico de efectivo no sea 0 únicamente si el sistema esperaba efectivo
    const efectivoDeclarado = Number(declarados['1'] || declarados['01'] || 0)
    const efectivoEsperado = Number(turno.efectivo_total_en_caja ?? turno.monto_apertura ?? 0)

    if (efectivoDeclarado <= 0 && efectivoEsperado > 0) {
      toast.error('El monto físico no puede ser cero, por favor ingresar la cantidad solicitada')
      return
    }

    const conteos = desgloseEfectivo
      .filter(d => d.cantidad > 0)
      .map(d => ({
        denominacion: d.valor,
        cantidad: d.cantidad,
        subtotal: d.subtotal
      }))

    const arqueo = {
      billete_200: cantidadesArqueo[200] || 0,
      billete_100: cantidadesArqueo[100] || 0,
      billete_50: cantidadesArqueo[50] || 0,
      billete_20: cantidadesArqueo[20] || 0,
      billete_10: cantidadesArqueo[10] || 0,
      moneda_5: cantidadesArqueo[5] || 0,
      moneda_2: cantidadesArqueo[2] || 0,
      moneda_1: cantidadesArqueo[1] || 0,
      moneda_050: cantidadesArqueo[0.5] || 0,
      moneda_020: cantidadesArqueo[0.2] || 0,
      moneda_010: cantidadesArqueo[0.1] || 0
    }

    onSave({
      totales_cierre: listaCierre,
      observacion_general: observacion,
      conteos,
      arqueo
    })
  }

  const metodosParaCierre = metodosPago.length > 0 ? metodosPago : [
    { id: '1', nombre: 'EFECTIVO', color: '#10b981', orden: 1 },
    { id: '2', nombre: 'YAPE', color: '#742384', orden: 2 },
    { id: '3', nombre: 'TRANSFERENCIA', color: '#0284c7', orden: 3 },
    { id: '4', nombre: 'CREDITO', color: '#d97706', orden: 4 }
  ]

  // Filtrar activos y ordenar según la columna 'orden' de la base de datos (igual a MetodosPagoCarrusel)
  const metodosOrdenados = useMemo(() => {
    return [...metodosParaCierre]
      .filter((m) => m.activo !== false)
      .sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0))
  }, [metodosParaCierre])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant={variant}
      title={`Cierre de Caja — ${turno.identificador_caja}`}
      confirmButtonId="cierre-turno-form"
      confirmText="Confirmar y Cerrar Caja"
      isProcessing={isProcessing}
      maxWidth="max-w-2xl"
    >
      <form id="cierre-turno-form" onSubmit={handleSubmit} className="space-y-4">
        
        {/* Desglose Interactivo de Billetes y Monedas (Opción 1) */}
        <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden">
          <button
            type="button"
            onClick={() => setMostrarArqueoEfectivo(prev => !prev)}
            className="w-full p-3 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BanknotesIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Arqueo Físico de Billetes y Monedas en Efectivo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">
                S/ {totalArqueoEfectivo.toFixed(2)}
              </span>
              {mostrarArqueoEfectivo ? <ChevronUpIcon className="h-4 w-4 text-slate-400" /> : <ChevronDownIcon className="h-4 w-4 text-slate-400" />}
            </div>
          </button>

          {mostrarArqueoEfectivo && (
            <div className="p-3 border-t border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Billetes */}
              <div className="border border-slate-200/70 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-100/70 dark:bg-slate-800/60 px-3 py-1 font-bold text-[10px] uppercase text-slate-600 dark:text-slate-300">
                  Billetes
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {DENOMINACIONES_BILLETES.map((b) => {
                    const item = desgloseEfectivo.find(d => d.valor === b.valor) || { cantidad: 0, subtotal: 0 }
                    return (
                      <div key={b.valor} className="px-2.5 py-1 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 w-16">{b.label}</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          value={cantidadesArqueo[b.valor] ?? ''}
                          onChange={(e) => handleCantidadArqueoChange(b.valor, e.target.value)}
                          className="w-16 px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-center font-mono font-bold text-xs bg-slate-50 dark:bg-slate-800 focus:bg-white outline-none"
                        />
                        <span className="w-16 text-right font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                          S/ {item.subtotal.toFixed(2)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Monedas */}
              <div className="border border-slate-200/70 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-100/70 dark:bg-slate-800/60 px-3 py-1 font-bold text-[10px] uppercase text-slate-600 dark:text-slate-300">
                  Monedas
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {DENOMINACIONES_MONEDAS.map((m) => {
                    const item = desgloseEfectivo.find(d => d.valor === m.valor) || { cantidad: 0, subtotal: 0 }
                    return (
                      <div key={m.valor} className="px-2.5 py-1 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 w-16">{m.label}</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          value={cantidadesArqueo[m.valor] ?? ''}
                          onChange={(e) => handleCantidadArqueoChange(m.valor, e.target.value)}
                          className="w-16 px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-center font-mono font-bold text-xs bg-slate-50 dark:bg-slate-800 focus:bg-white outline-none"
                        />
                        <span className="w-16 text-right font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                          S/ {item.subtotal.toFixed(2)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Declaración Consolidada por Medio de Pago */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Montos Declarados por Método de Pago
            </label>
            <span className="text-[11px] text-slate-400 font-medium">
              Especifique el arqueo por cada método
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {metodosOrdenados.map((m) => {
              const valorActual = declarados[m.id] ?? ''
              const esEfectivo = String(m.id) === '1' || String(m.id) === '01'
              const color = m.color || (esEfectivo ? '#10b981' : '#01a59c')
              const hasImgError = imgErrors[m.id]
              const valorNum = Number(valorActual || 0)

              // Buscar monto esperado del sistema para dar contexto visual
              const totalTurnoItem = Array.isArray(turno.totales) 
                ? turno.totales.find(t => String(t.metodo_pago_id) === String(m.id))
                : null
              const montoSistemaEsperado = esEfectivo 
                ? (turno.efectivo_total_en_caja ?? totalTurnoItem?.monto_sistema ?? 0)
                : (totalTurnoItem?.monto_sistema ?? 0)
              const diferenciaPreliminar = valorNum - montoSistemaEsperado

              return (
                <div
                  key={m.id}
                  style={{
                    borderLeftColor: color,
                    borderLeftWidth: '4px'
                  }}
                  className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Contenedor del ícono o imagen del método con su color temático */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform p-1.5"
                      style={{
                        backgroundColor: `${color}15`,
                        borderColor: `${color}35`
                      }}
                    >
                      {m.imagen_url && !hasImgError ? (
                        <img
                          src={m.imagen_url}
                          alt={m.nombre}
                          onError={() => setImgErrors((prev) => ({ ...prev, [m.id]: true }))}
                          className="h-7 w-7 object-contain drop-shadow-2xs"
                        />
                      ) : (
                        <CreditCardIcon
                          className="h-6 w-6"
                          style={{ color: color }}
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs uppercase tracking-tight text-slate-800 dark:text-slate-100 truncate">
                          {m.nombre}
                        </span>
                        {esEfectivo && totalArqueoEfectivo > 0 && (
                          <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 rounded-full font-bold">
                            Arqueo S/ {totalArqueoEfectivo.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        <span>Sistema: <strong className="font-mono text-slate-600 dark:text-slate-300">S/ {montoSistemaEsperado.toFixed(2)}</strong></span>
                        {valorActual !== '' && (
                          <span className={`font-mono text-[10px] font-bold ${
                            Math.abs(diferenciaPreliminar) < 0.01 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : diferenciaPreliminar > 0 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            ({diferenciaPreliminar >= 0 ? `+${diferenciaPreliminar.toFixed(2)}` : diferenciaPreliminar.toFixed(2)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Input de monto declarado con estilo destacado */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                        S/
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={valorActual}
                        onChange={(e) => handleMontoChange(m.id, e.target.value)}
                        placeholder="0.00"
                        style={{
                          focusBorderColor: color
                        }}
                        className="w-32 sm:w-36 pl-8 pr-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-mono font-bold text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Observaciones del Cierre
          </label>
          <textarea
            rows="2"
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Observación o justificación sobre el balance del turno..."
            className="input-field text-sm resize-none"
          />
        </div>
      </form>
    </Modal>
  )
}
