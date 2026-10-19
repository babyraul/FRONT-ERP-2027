import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useVentaActivaStore } from '../store/useVentaActivaStore.js'
import ResumenProductosTabla from '../components/ResumenProductosTabla.jsx'
import MetodosPagoCarrusel from '../components/MetodosPagoCarrusel.jsx'
import DetallePagosList from '../components/DetallePagosList.jsx'
import InfoComplementaria from '../components/InfoComplementaria.jsx'
import BuscarClienteModal from '../components/BuscarClienteModal.jsx'
import AgregarProductoModal from '../components/AgregarProductoModal.jsx'
import { venderController } from '../controllers/venderController.js'
import { clienteController } from '../../clientes/controllers/cliente.js'
import tablasFijasService from '../../../utils/tablasFijas.js'
import { calcularTotalesVenta } from '../../../utils/Operaciones.js'
import { toast } from '../../../utils/toast.js'

export default function Pagar() {
  const navigate = useNavigate()
  const location = useLocation()

  // Store global de la venta en curso
  const store = useVentaActivaStore()
  const {
    preventaId: storePreventaId,
    tipoDocumento: storeTipoDoc,
    cliente: storeCliente,
    placa: storePlaca,
    cartItems: storeCartItems,
    clearVenta
  } = store

  // Priorizar location.state o store global
  const initialData = location.state || {}
  const [preventaId, setPreventaId] = useState(initialData.preventaId || storePreventaId || null)
  const [tipoDocumento, setTipoDocumento] = useState(initialData.tipoDocumento || storeTipoDoc || 'boleta')
  const [cliente, setCliente] = useState(
    initialData.cliente || storeCliente || {
      id: '00000000-0000-0000-0000-000000000000',
      tipo_documento_id: '1',
      numero_documento: '99999999',
      nombre_razon_social: 'VARIOS'
    }
  )
  const [placa, setPlaca] = useState(initialData.alias || initialData.placa || storePlaca || '')

  // Productos en el carrito (estado local editable)
  const [cartItems, setCartItems] = useState(() => {
    if (initialData.cartItems && initialData.cartItems.length > 0) return initialData.cartItems
    if (storeCartItems && storeCartItems.length > 0) return storeCartItems
    return []
  })

  // Modales auxiliares para edición en este panel
  const [isBuscarClienteOpen, setIsBuscarClienteOpen] = useState(false)
  const [isAgregarProductoOpen, setIsAgregarProductoOpen] = useState(false)

  // Totales calculados con Operaciones.js (sin redondeo)
  const totales = useMemo(() => {
    return calcularTotalesVenta(cartItems)
  }, [cartItems])

  // ── Métodos de Pago Disponibles desde Tablas Fijas (SUNAT / BD) ──
  const [metodosDisponibles, setMetodosDisponibles] = useState([])
  const [loadingMetodos, setLoadingMetodos] = useState(false)

  // ── Métodos de Pago Activos (Pagos Mixtos) ──
  const [pagos, setPagos] = useState(() => [
    {
      id: 'pago-1',
      metodo_id: '1',
      metodo_nombre: 'EFECTIVO',
      imagen_url: '/images/efectivo.png',
      color: '#28a745',
      monto: totales.total,
      referencia: ''
    }
  ])

  // Cargar lista de métodos de pago desde Tablas Fijas
  useEffect(() => {
    const fetchMetodos = async () => {
      setLoadingMetodos(true)
      const res = await tablasFijasService.getTiposMetodoPago()
      if (res.success && res.data.length > 0) {
        setMetodosDisponibles(res.data)
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

  // Si solo hay un método de pago en la lista, actualizar automáticamente su monto al total
  const prevTotalRef = useRef(totales.total)
  useEffect(() => {
    if (pagos.length === 1 && prevTotalRef.current !== totales.total) {
      setPagos((prev) => [
        {
          ...prev[0],
          monto: totales.total
        }
      ])
    }
    prevTotalRef.current = totales.total
  }, [totales.total, pagos.length])

  // Sincronizar en background con store global ante cualquier edición
  useEffect(() => {
    store.setCartItems(cartItems)
    store.setCliente(cliente)
    store.setTipoDocumento(tipoDocumento)
    store.setPlaca(placa)
    if (preventaId) store.setPreventaId(preventaId)
  }, [cartItems, cliente, tipoDocumento, placa, preventaId])

  // Información complementaria
  const [observaciones, setObservaciones] = useState('')
  const [ordenCompra, setOrdenCompra] = useState('')
  const [guiaRemision, setGuiaRemision] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isReserving, setIsReserving] = useState(false)

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

  // ── Handlers de Edición de Preventa en el Panel ──
  const handleCambioTipoDocumento = (nuevoTipo) => {
    setTipoDocumento(nuevoTipo)
    if (nuevoTipo === 'factura' && cliente.tipo_documento_id !== '6') {
      toast.info('Factura seleccionada', 'Recuerde ingresar o buscar un cliente con RUC (11 dígitos).')
    }
  }

  const handleSelectCliente = (nuevoCliente) => {
    setCliente(nuevoCliente)
    toast.success('Cliente asignado', nuevoCliente.nombre_razon_social || nuevoCliente.razonSocial)
  }

  const handleAgregarProducto = (nuevoItem) => {
    setCartItems((prevItems) => {
      const idx = prevItems.findIndex((i) => i.uniqueId === nuevoItem.uniqueId)
      if (idx >= 0) {
        const copy = [...prevItems]
        copy[idx].cantidad = Number((copy[idx].cantidad + 1).toFixed(2))
        return copy
      }
      return [
        ...prevItems,
        {
          ...nuevoItem,
          cantidad: 1,
          precio_unitario: nuevoItem.precio,
          descuento: 0,
          tarifa: 'menor'
        }
      ]
    })
    toast.success('Producto agregado', nuevoItem.nombre_completo)
  }

  const handleUpdateCantidad = (uniqueId, nuevaCant) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.uniqueId === uniqueId ? { ...item, cantidad: Math.max(0.01, nuevaCant) } : item
      )
    )
  }

  const handleUpdatePrecio = (uniqueId, nuevoPrecio) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.uniqueId === uniqueId ? { ...item, precio_unitario: Math.max(0, nuevoPrecio) } : item
      )
    )
  }

  const handleUpdateDescuento = (uniqueId, nuevoDesc) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.uniqueId === uniqueId ? { ...item, descuento: Math.max(0, nuevoDesc) } : item
      )
    )
  }

  const handleRemoveItem = (uniqueId) => {
    setCartItems((prev) => prev.filter((item) => item.uniqueId !== uniqueId))
  }

  // ── Manejadores de métodos de pago ──
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

    if (totalPagado >= totales.total && totales.total > 0) {
      toast.warning(
        'Pago completo',
        'El total de la venta ya ha sido cubierto. Modifique los montos existentes si desea agregar otro método.'
      )
      return
    }

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

  // Helper para validar si un string es UUID
  const isValidUUID = (str) => {
    if (!str || typeof str !== 'string') return false
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
  }

  // ── SINCRONIZAR PREVENTA ACTUALIZADA EN BD (Helper) ──
  const sincronizarPreventaActualizada = async () => {
    if (!preventaId) return null

    let sanitizedClienteId = null
    if (cliente?.id && isValidUUID(cliente.id)) {
      sanitizedClienteId = cliente.id
    }

    const payload = {
      cliente_id: sanitizedClienteId,
      tipo_documento: tipoDocumento,
      placa: placa || null,
      alias: placa || null,
      gravado: totales.gravado,
      igv: totales.igv,
      total: totales.total,
      items: cartItems.map((item) => ({
        producto_id: item.producto_id,
        presentacion_id: item.presentacion_id || null,
        cantidad: Number(item.cantidad),
        precio_unitario: Number(item.precio_unitario),
        descuento: Number(item.descuento || 0)
      }))
    }

    return await venderController.actualizarPreventa(preventaId, payload)
  }

  // ── BOTÓN RESERVAR: Dejar la preventa pendiente y volver a Vender vacío ──
  const handleReservar = async () => {
    if (!cartItems || cartItems.length === 0) {
      toast.info('Preventa vacía', 'No hay productos en la preventa para reservar.')
      return
    }

    setIsReserving(true)
    try {
      if (preventaId) {
        // Asegurar que la preventa quede actualizada con los últimos cambios hechos en este panel
        await sincronizarPreventaActualizada()
      }
      toast.success(
        'Preventa reservada',
        `La preventa ha quedado guardada en estado pendiente.`
      )
      // Limpiar store y estado para una nueva preventa completamente limpia
      clearVenta()
      navigate('/vender', { state: null, replace: true })
    } catch (err) {
      console.error('Error al reservar preventa:', err)
      toast.error('Error al reservar', 'No se pudo guardar la preventa como reserva.')
    } finally {
      setIsReserving(false)
    }
  }

  // ── BOTÓN PAGAR: Confirmar y Procesar la Venta Final ──
  const handlePagar = async () => {
    if (!cartItems || cartItems.length === 0) {
      toast.error('Preventa vacía', 'Debe haber al menos un producto en la venta.')
      return
    }

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

    // Validar RUC para facturas
    if (tipoDocumento === 'factura') {
      const doc = String(cliente?.numero_documento || '').trim()
      if (doc.length !== 11) {
        toast.error('Cliente no válido para Factura', 'Para emitir Factura debe asignar un cliente con RUC (11 dígitos).')
        return
      }
    }

    // Validar Regla Fiscal SUNAT (RN-V03): Total >= 700 exige identificar al cliente
    const docCliente = String(cliente?.numero_documento || '').trim()
    const esClienteGenerico = !docCliente || docCliente === '99999999' || docCliente === '00000000'
    if (totales.total >= 700 && esClienteGenerico && tipoDocumento !== 'vale') {
      toast.error(
        'Identificación obligatoria (SUNAT)',
        'Para ventas mayores o iguales a S/. 700.00 SUNAT exige identificar al cliente con DNI o RUC.'
      )
      setIsBuscarClienteOpen(true)
      return
    }

    setIsProcessing(true)

    // Si hubo modificaciones en items/cliente/tipoDoc, sincronizar la preventa en BD antes de facturar
    if (preventaId) {
      try {
        await sincronizarPreventaActualizada()
      } catch (err) {
        console.warn('Error sincronizando cambios de preventa antes de pagar:', err)
      }
    }

    // Lazy Registration de cliente nuevo si aplica
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
      cliente_id: isValidUUID(finalClienteId) ? finalClienteId : null,
      placa: placa || null,
      alias: placa || null,
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
      navigate('/vender', { state: null, replace: true })
    } else {
      toast.error('Error al procesar pago', res.message || 'No se pudo registrar la venta.')
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4.25rem)] -m-4 sm:-m-6 overflow-hidden">
      {/* ── CUERPO PRINCIPAL: 2 PANELES (RESUMEN EDITABLE IZQ, PAGOS DER) ── */}
      <div className="flex-1 p-3 sm:p-4 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        {/* PANEL IZQUIERDO: Resumen Editable de Preventa (Cliente, Tipo Doc, Productos) */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-0 overflow-hidden">
          <ResumenProductosTabla
            cartItems={cartItems}
            cliente={cliente}
            setCliente={setCliente}
            tipoDocumento={tipoDocumento}
            setTipoDocumento={setTipoDocumento}
            placa={placa}
            setPlaca={setPlaca}
            onOpenBuscarCliente={() => setIsBuscarClienteOpen(true)}
            onOpenAgregarProducto={() => setIsAgregarProductoOpen(true)}
            onUpdateCantidad={handleUpdateCantidad}
            onUpdatePrecio={handleUpdatePrecio}
            onUpdateDescuento={handleUpdateDescuento}
            onRemoveItem={handleRemoveItem}
          />
        </div>

        {/* PANEL DERECHO: Detalle de Pagos + Carrusel de Métodos + Info Complementaria */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 overflow-hidden dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border dark:border-slate-800 shadow-sm p-4 justify-between gap-3">
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

      {/* ── FOOTER TOTALIZADOR CON BOTÓN RESERVAR Y PAGAR ── */}
      <div className="bg-slate-300/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-300/70 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 sm:gap-4 shrink-0 shadow-lg z-20">
        {/* Desglose de Totales a la Izquierda */}
        <div className="flex-1 flex items-center gap-3 sm:gap-8 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 min-w-0">
          <div>
            <span className="text-slate-600 font-semibold dark:text-slate-500 mr-1">Gravado</span>
            <strong className="font-bold text-slate-900 dark:text-white">{totales.gravado.toFixed(2)}</strong>
          </div>

          <div>
            <span className="text-slate-600 font-semibold dark:text-slate-500 mr-1">IGV</span>
            <strong className="font-bold text-slate-900 dark:text-white">{totales.igv.toFixed(2)}</strong>
          </div>
        </div>

        {/* Centro: Total Destacado (Caja Verde Aqua) */}
        <div className="flex items-center justify-center shrink-0">
          <div className="bg-[#01a59c] text-white w-36 sm:w-56 py-2.5 sm:py-3 rounded-2xl shadow-md flex items-center justify-center gap-1.5 transition-transform">
            <span className="text-sm sm:text-base font-bold opacity-80">S/</span>
            <span className="text-xl sm:text-3xl font-extrabold tracking-tight">
              {totales.total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Derecha: Botón RESERVAR y Botón PAGAR */}
        <div className="flex-1 flex justify-end items-center gap-2 sm:gap-3 shrink-0">
          {/* Botón RESERVAR */}
          <button
            type="button"
            onClick={handleReservar}
            disabled={isProcessing || isReserving}
            className="w-28 sm:w-40 justify-center bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 sm:py-3.5 rounded-2xl text-sm sm:text-lg font-black tracking-wide shadow-md transition-all duration-200 flex items-center gap-1.5 transform active:scale-95 cursor-pointer"
            title="Dejar en preventa pendiente y volver a nueva venta vacía"
          >
            {isReserving ? 'Guardando...' : 'RESERVAR'}
          </button>

          {/* Botón PAGAR */}
          <button
            type="button"
            onClick={handlePagar}
            disabled={isProcessing || isReserving}
            className="w-32 sm:w-48 justify-center bg-[#01473d] hover:bg-[#025a4d] disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 sm:py-3.5 rounded-2xl text-base sm:text-2xl font-black tracking-wide shadow-[0_6px_16px_rgba(1,71,61,0.35)] hover:shadow-[0_10px_24px_rgba(1,71,61,0.45)] transition-all duration-200 flex items-center gap-2 transform active:scale-95 cursor-pointer"
            title="Confirmar y Registrar Pago"
          >
            {isProcessing ? 'Procesando...' : 'PAGAR'}
          </button>
        </div>
      </div>

      {/* ── MODAL AUXILIAR: Buscar / Asignar Cliente ── */}
      <BuscarClienteModal
        isOpen={isBuscarClienteOpen}
        onClose={() => setIsBuscarClienteOpen(false)}
        onSelectCliente={handleSelectCliente}
      />

      {/* ── MODAL AUXILIAR: Buscar / Agregar Producto Directamente ── */}
      <AgregarProductoModal
        isOpen={isAgregarProductoOpen}
        onClose={() => setIsAgregarProductoOpen(false)}
        onAgregarItem={handleAgregarProducto}
      />
    </div>
  )
}
