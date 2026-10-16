import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useVentaActivaStore } from '../store/useVentaActivaStore.js'
import ResumenProductosTabla from '../components/ResumenProductosTabla.jsx'
import MetodosPagoCarrusel from '../components/MetodosPagoCarrusel.jsx'
import DetallePagosList from '../components/DetallePagosList.jsx'
import InfoComplementaria from '../components/InfoComplementaria.jsx'
import { venderController } from '../controllers/venderController.js'
import { clienteController } from '../../clientes/controllers/cliente.js'
import tablasFijasService from '../../../utils/tablasFijas.js'
import { calcularTotalesVenta } from '../../../utils/Operaciones.js'
import { toast } from '../../../utils/toast.js'

export default function Pagar() {
  const navigate = useNavigate()
  const location = useLocation()

  // Estado global de la venta en curso
  const store = useVentaActivaStore()
  const {
    preventaId: storePreventaId,
    tipoDocumento: storeTipoDoc,
    cliente: storeCliente,
    placa: storePlaca,
    cartItems: storeCartItems,
    clearVenta,
    getTotales
  } = store

  // Si se pasaron datos por navigation state, priorizarlos o sincronizar
  const initialData = location.state || {}
  const preventaId = initialData.preventaId || storePreventaId || null
  const tipoDocumento = initialData.tipoDocumento || storeTipoDoc || 'vale'
  const cliente = initialData.cliente || storeCliente || {
    id: '00000000-0000-0000-0000-000000000000',
    tipo_documento_id: '1',
    numero_documento: '99999999',
    nombre_razon_social: 'VARIOS'
  }
  const placa = initialData.placa || storePlaca || ''

  // Productos en preventa
  const cartItems = useMemo(() => {
    if (initialData.cartItems && initialData.cartItems.length > 0) return initialData.cartItems
    if (storeCartItems && storeCartItems.length > 0) return storeCartItems
    return []
  }, [initialData.cartItems, storeCartItems])

  // Totales calculados con Operaciones.js (sin redondeo)
  const totales = useMemo(() => {
    return calcularTotalesVenta(cartItems)
  }, [cartItems])

  // ── Métodos de Pago Disponibles desde Tablas Fijas (SUNAT / BD) ──
  const [metodosDisponibles, setMetodosDisponibles] = useState([])
  const [loadingMetodos, setLoadingMetodos] = useState(false)

  // ── Métodos de Pago Activos (Pagos Mixtos) ──
  const [pagos, setPagos] = useState(() => {
    return [
      {
        id: 'pago-1',
        metodo_id: '1',
        metodo_nombre: 'EFECTIVO',
        imagen_url: '/images/efectivo.png',
        color: '#28a745',
        monto: totales.total,
        referencia: ''
      }
    ]
  })

  // Cargar lista de métodos de pago desde Tablas Fijas
  useEffect(() => {
    const fetchMetodos = async () => {
      setLoadingMetodos(true)
      const res = await tablasFijasService.getTiposMetodoPago()
      if (res.success && res.data.length > 0) {
        setMetodosDisponibles(res.data)
        // Sincronizar IDs, imagen y color con la BD para los métodos activos
        setPagos((prevPagos) =>
          prevPagos.map((p) => {
            const match = res.data.find(
              (m) =>
                String(m.id) === String(p.metodo_id) ||
                m.nombre.toUpperCase() === (p.metodo_nombre || '').toUpperCase()
            )
            return {
              ...p,
              metodo_id: match ? match.id : p.metodo_id,
              metodo_nombre: match ? match.nombre : p.metodo_nombre,
              imagen_url: match ? match.imagen_url : p.imagen_url,
              color: match ? match.color : p.color
            }
          })
        )
      }
      setLoadingMetodos(false)
    }
    fetchMetodos()
  }, [])

  // Información complementaria
  const [observaciones, setObservaciones] = useState('')
  const [ordenCompra, setOrdenCompra] = useState('')
  const [guiaRemision, setGuiaRemision] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Cálculos de Pagos y Vuelto
  const totalPagado = useMemo(() => {
    return pagos.reduce((sum, p) => sum + Number(p.monto || 0), 0)
  }, [pagos])

  const vuelto = useMemo(() => {
    return Math.max(0, Number((totalPagado - totales.total).toFixed(2)))
  }, [totalPagado, totales.total])

  const saldoPendiente = useMemo(() => {
    return Math.max(0, Number((totales.total - totalPagado).toFixed(2)))
  }, [totalPagado, totales.total])

  // Manejadores de pagos
  const handleSelectMetodoCarrusel = (metodo) => {
    const yaExiste = pagos.some(
      (p) =>
        String(p.metodo_id) === String(metodo.id) ||
        String(p.metodo_nombre).toUpperCase() === String(metodo.nombre).toUpperCase()
    )
    if (yaExiste) {
      toast.info('Método ya agregado', `El método ${metodo.nombre} ya está en la lista de pagos.`)
      return
    }

    // Validar si el pago ingresado ya está completo en comparación con la venta total
    if (totalPagado >= totales.total && totales.total > 0) {
      toast.warning(
        'Pago completo',
        'El total de la venta ya ha sido cubierto. Modifique los montos existentes si desea agregar otro método.'
      )
      return
    }

    // El monto por defecto del nuevo método será el saldo pendiente
    const montoInicial = saldoPendiente > 0 ? saldoPendiente : 0

    setPagos((prev) => [
      ...prev,
      {
        id: `pago-${Date.now()}`,
        metodo_id: metodo.id,
        metodo_nombre: metodo.nombre,
        imagen_url: metodo.imagen_url,
        color: metodo.color,
        monto: montoInicial,
        referencia: ''
      }
    ])
  }

  const handleUpdateMontoPago = (index, nuevoMonto) => {
    setPagos((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, monto: Math.max(0, nuevoMonto) } : p))
    )
  }

  const handleUpdateReferenciaPago = (index, nuevaRef) => {
    setPagos((prev) =>
      prev.map((p, idx) => {
        if (idx !== index) return p
        const esEfectivo = (p.metodo_nombre || '').toUpperCase().includes('EFECTIVO')
        return { ...p, referencia: esEfectivo ? '' : nuevaRef }
      })
    )
  }

  const handleRemovePago = (index) => {
    setPagos((prev) => prev.filter((_, idx) => idx !== index))
  }

  // Confirmar y Procesar el Pago
  const handlePagar = async () => {
    // Validar si es crédito o contado
    const tieneCredito = pagos.some((p) =>
      (p.metodo_nombre || '').toUpperCase().includes('CREDITO')
    )

    if (!tieneCredito && totalPagado < totales.total) {
      toast.error(
        'Pago insuficiente',
        `Faltan S/. ${saldoPendiente.toFixed(2)} para cubrir el total de la venta.`
      )
      return
    }

    if (pagos.length === 0) {
      toast.error('Seleccione un método de pago', 'Debe agregar al menos un método de pago.')
      return
    }

    setIsProcessing(true)

    // Lazy Registration: Si el cliente es nuevo (proviene de SUNAT/RENIEC temporal), registrarlo antes de emitir la venta
    let finalClienteId = cliente?.id || null
    const esClienteNuevo =
      cliente?.isNuevo ||
      cliente?.source === 'externo' ||
      (cliente?.id && String(cliente.id).startsWith('temp_'))

    if (esClienteNuevo && cliente?.numero_documento && cliente?.numero_documento !== '99999999') {
      try {
        const payloadCliente = {
          tipo_documento_id: cliente.tipo_documento_id || (cliente.numero_documento.length === 11 ? '6' : '1'),
          numero_documento: cliente.numero_documento,
          nombre_razon_social: cliente.nombre_razon_social || cliente.razonSocial,
          direccion_1: cliente.direccion_1 || cliente.direccion || '',
          direccion: cliente.direccion_1 || cliente.direccion || '',
          estado_sunat: cliente.estado_sunat || null,
          condicion_sunat: cliente.condicion_sunat || null
        }

        const resCliente = await clienteController.create(payloadCliente)
        if (resCliente.success && resCliente.data?.id) {
          finalClienteId = resCliente.data.id
        } else {
          // Mecanismo de autorecuperación si ya se registró concurrentemente
          const resLocal = await venderController.buscarClientes(cliente.numero_documento)
          const existente = resLocal.data?.find(
            (c) => String(c.numero_documento).trim() === String(cliente.numero_documento).trim()
          )
          if (existente?.id) {
            finalClienteId = existente.id
          }
        }
      } catch (err) {
        console.warn('Error en lazy registration del cliente:', err)
      }
    }

    const payload = {
      preventa_id: preventaId || null,
      tipo_documento: tipoDocumento,
      cliente_id: finalClienteId,
      placa: placa || null,
      observaciones,
      orden_compra: ordenCompra,
      guia_remision: guiaRemision,
      pagos: pagos.map((p) => {
        const esEfectivo = (p.metodo_nombre || '').toUpperCase().includes('EFECTIVO')
        return {
          tipo_metodo_pago_id: p.metodo_id,
          metodo: p.metodo_nombre,
          monto: p.monto,
          referencia: esEfectivo ? null : (p.referencia || null)
        }
      }),
      total: totales.total,
      vuelto: vuelto,
      items: cartItems.map((item) => ({
        producto_id: item.producto_id,
        nombre: item.nombre_completo,
        cantidad: Number(item.cantidad),
        precio_unitario: Number(item.precio_unitario),
        descuento: Number(item.descuento || 0)
      }))
    }

    const res = await venderController.registrarVenta(payload)
    setIsProcessing(false)

    if (res.success) {
      toast.success(
        'Venta procesada con éxito',
        `Comprobante emitido correctamente por S/. ${totales.total.toFixed(2)}`
      )
      clearVenta()
      navigate('/vender')
    } else {
      toast.error('Error al procesar pago', res.message || 'No se pudo registrar la venta.')
    }
  }

  // Regresar a la pantalla de Vender
  const handleEditarVenta = () => {
    navigate('/vender', {
      state: {
        preventaId,
        tipoDocumento,
        cliente,
        placa,
        cartItems
      }
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4.25rem)] -m-4 sm:-m-6 overflow-hidden">
      {/* ── CUERPO PRINCIPAL: 2 PANELES (RESUMEN IZQ, PAGOS DER) ── */}
      <div className="flex-1 p-3 sm:p-4 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        {/* PANEL IZQUIERDO: Resumen de Productos Seleccionados */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-0 overflow-hidden">
          <ResumenProductosTabla
            cartItems={cartItems}
            cliente={cliente}
            onEditarVenta={handleEditarVenta}
          />
        </div>

        {/* PANEL DERECHO: Detalle de Pagos + Carrusel de Métodos + Info Complementaria */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 overflow-hidden dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border  dark:border-slate-800 shadow-sm p-4 justify-between gap-3">
          {/* 1. Detalle de Pagos Mixtos y Banner de Tipo Comprobante */}
          <div className="overflow-y-auto">
            <DetallePagosList
              pagos={pagos}
              tipoDocumento={tipoDocumento}
              onUpdateMontoPago={handleUpdateMontoPago}
              onUpdateReferenciaPago={handleUpdateReferenciaPago}
              onRemovePago={handleRemovePago}
            />
          </div>

          {/* 2. Carrusel Horizontal de Métodos de Pago */}
          <div className="shrink-0 pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Métodos Disponibles (Haga clic para agregar)
              </span>
              {totalPagado >= totales.total && totales.total > 0 && (
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                  Pago completo
                </span>
              )}
            </div>
            <MetodosPagoCarrusel
              metodos={metodosDisponibles}
              loading={loadingMetodos}
              onSelectMetodo={handleSelectMetodoCarrusel}
              selectedMetodos={pagos}
              isPagoCompleto={totalPagado >= totales.total && totales.total > 0}
            />
          </div>

          {/* 3. Información Complementaria (Vuelto, Observaciones, O/C, Guía) */}
          <div className="shrink-0">
            <InfoComplementaria
              vuelto={vuelto}
              saldoPendiente={saldoPendiente}
              observaciones={observaciones}
              setObservaciones={setObservaciones}
              ordenCompra={ordenCompra}
              setOrdenCompra={setOrdenCompra}
              guiaRemision={guiaRemision}
              setGuiaRemision={setGuiaRemision}
            />
          </div>
        </div>
      </div>

      {/* ── FOOTER TOTALIZADOR (IDÉNTICO AL DISEÑO DE VENTAFOOTER) ── */}
      <div className="bg-slate-300/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-300/70 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 shrink-0 shadow-lg z-20">
        {/* Desglose de Totales a la Izquierda */}
        <div className="flex-1 flex items-center gap-4 sm:gap-8 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 min-w-0">
          <div>
            <span className="text-slate-600 font-semibold dark:text-slate-500 mr-1">Gravado</span>
            <strong className="font-bold text-slate-900 dark:text-white">{totales.gravado.toFixed(2)}</strong>
          </div>

          <div>
            <span className="text-slate-600 font-semibold dark:text-slate-500 mr-1">IGV</span>
            <strong className="font-bold text-slate-900 dark:text-white">{totales.igv.toFixed(2)}</strong>
          </div>
        </div>

        {/* Centro: Total Destacado (Caja Verde Aqua con ancho fijo) */}
        <div className="flex items-center justify-center shrink-0">
          <div className="bg-[#01a59c] text-white w-48 sm:w-64 py-3 rounded-2xl shadow-md flex items-center justify-center gap-1.5 transition-transform">
            <span className="text-base sm:text-lg font-bold opacity-80">S/</span>
            <span className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {totales.total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Derecha: Botón de Acción Principal "PAGAR" con ancho fijo */}
        <div className="flex-1 flex justify-end shrink-0">
          <button
            type="button"
            onClick={handlePagar}
            disabled={isProcessing}
            className="w-44 sm:w-64 justify-center bg-[#01473d] hover:bg-[#025a4d] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 sm:py-3.5 rounded-2xl text-lg sm:text-3xl font-black tracking-wide shadow-[0_6px_16px_rgba(1,71,61,0.35)] hover:shadow-[0_10px_24px_rgba(1,71,61,0.45)] transition-all duration-200 flex items-center gap-2 transform active:scale-95"
            title="Confirmar y Registrar Pago"
          >
            {isProcessing ? 'Procesando...' : 'PAGAR'}
          </button>
        </div>
      </div>
    </div>
  )
}
