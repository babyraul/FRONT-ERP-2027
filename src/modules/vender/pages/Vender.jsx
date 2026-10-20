import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useProductosStore } from '../../../store/useProductosStore.js'
import { useVentaActivaStore } from '../store/useVentaActivaStore.js'
import TipoDocumentoSelector from '../components/TipoDocumentoSelector.jsx'
import ClienteSection from '../components/ClienteSection.jsx'
import ProductosList from '../components/ProductosList.jsx'
import CarritoList from '../components/CarritoList.jsx'
import VentaFooter from '../components/VentaFooter.jsx'
import BuscarClienteModal from '../components/BuscarClienteModal.jsx'
import { venderController } from '../controllers/venderController.js'
import { cajaController } from '../../caja/controllers/caja.js'
import { calcularTotalesVenta } from '../../../utils/Operaciones.js'
import { permiteDecimales } from '../../../utils/unidades.js'
import { toast } from '../../../utils/toast.js'
import { ExclamationTriangleIcon, LockClosedIcon } from '@heroicons/react/24/outline'

export default function Vender() {
  const navigate = useNavigate()
  const location = useLocation()
  const store = useVentaActivaStore()
  const { productos, loading: loadingProductos, fetchProductos } = useProductosStore()

  // 0. Control de Caja Activa (RN-V01 y RN-V02)
  const [cajaStatus, setCajaStatus] = useState({
    verificado: false,
    bloqueado: false,
    motivo: null, // 'SIN_TURNO' | 'TURNO_VENCIDO'
    mensaje: ''
  })

  // 1. Estados Principales (inicializados desde navigation state o store para persistencia)
  const navState = location.state || {}
  const [preventaId, setPreventaId] = useState(navState.preventaId || store.preventaId || null)
  const [tipoDocumento, setTipoDocumento] = useState(navState.tipoDocumento || store.tipoDocumento || 'boleta')
  const [cliente, setCliente] = useState(
    navState.cliente || store.cliente || {
      id: '00000000-0000-0000-0000-000000000000',
      tipo_documento_id: '1',
      numero_documento: '99999999',
      nombre_razon_social: 'VARIOS'
    }
  )
  const [placa, setPlaca] = useState(navState.placa || store.placa || '')
  const [cartItems, setCartItems] = useState(
    navState.cartItems && navState.cartItems.length > 0
      ? navState.cartItems
      : store.cartItems && store.cartItems.length > 0
        ? store.cartItems
        : []
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 2. Modales
  const [isBuscarClienteOpen, setIsBuscarClienteOpen] = useState(false)

  // Sincronizar estado cuando se navega con datos nuevos (ej. Duplicar venta desde Reporte de Ventas)
  useEffect(() => {
    if (location.state) {
      if (location.state.tipoDocumento) setTipoDocumento(location.state.tipoDocumento)
      if (location.state.cliente) setCliente(location.state.cliente)
      if (location.state.placa !== undefined) setPlaca(location.state.placa)
      if (Array.isArray(location.state.cartItems)) {
        setCartItems(location.state.cartItems)
        store.setCartItems(location.state.cartItems)
      }
      if (location.state.preventaId !== undefined) {
        setPreventaId(location.state.preventaId)
      }
    }
  }, [location.state])

  // Cargar productos activos y verificar turno de caja al montar
  useEffect(() => {
    fetchProductos({ activo: true })

    const verificarCajaActiva = async () => {
      try {
        const res = await cajaController.getTurnoActivo()
        if (!res.success || !res.data) {
          setCajaStatus({
            verificado: true,
            bloqueado: true,
            motivo: 'SIN_TURNO',
            mensaje: 'No cuenta con un turno de caja abierto para registrar ventas. Debe aperturar una caja antes de continuar.'
          })
          return
        }

        const turno = res.data
        if (turno.fecha_apertura) {
          const fechaApertura = new Date(turno.fecha_apertura)
          const ahora = new Date()
          const limite = new Date(fechaApertura)
          limite.setDate(limite.getDate() + 1)
          limite.setHours(3, 30, 0, 0)

          if (ahora > limite) {
            setCajaStatus({
              verificado: true,
              bloqueado: true,
              motivo: 'TURNO_VENCIDO',
              mensaje: 'Su turno de caja activo está vencido (superó las 03:30 AM del día siguiente). Debe realizar el arqueo y cierre en el módulo Caja antes de generar nuevas ventas.'
            })
            return
          }
        }

        setCajaStatus({ verificado: true, bloqueado: false, motivo: null, mensaje: '' })
      } catch (err) {
        console.error('Error al verificar turno de caja:', err)
        setCajaStatus({ verificado: true, bloqueado: false, motivo: null, mensaje: '' })
      }
    }

    verificarCajaActiva()
  }, [fetchProductos])

  // Validación automática de tipo de comprobante vs cliente
  const handleCambioTipoDocumento = (nuevoTipo) => {
    setTipoDocumento(nuevoTipo)
    if (nuevoTipo === 'factura' && cliente.tipo_documento_id !== '6') {
      toast.info('Factura seleccionada', 'Recuerde ingresar o buscar un cliente con RUC (11 dígitos).')
    }
  }

  // Helper para procesar código de balanza Magellan EAN-13 (prefijo 6663 en chars 3 a 7)
  const procesarItemBalanza = (rawItem) => {
    const item = { ...rawItem }
    const cod = String(item.codigo_barra || item.codigo || '').trim()
    // Si cumple EAN-13 (13 dígitos) y posiciones 3..7 son '6663': caracteres 7 a 12 son gramos / 1000
    if (/^\d{13}$/.test(cod) && cod.substring(3, 7) === '6663') {
      const gramos = parseInt(cod.substring(7, 12), 10)
      if (!isNaN(gramos) && gramos > 0) {
        item.cantidad = Number((gramos / 1000).toFixed(3))
      }
    }
    return item
  }

  // 3. Gestión del Carrito
  const handleAgregarItem = (rawItem) => {
    const item = procesarItemBalanza(rawItem)
    const cantidadInicial = Number(item.cantidad || 1)
    console.log('[Vender.jsx] handleAgregarItem invocado para:', item.nombre_completo, 'uniqueId:', item.uniqueId, 'cantInicial:', cantidadInicial)

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((i) => i.uniqueId === item.uniqueId)
      if (existingIndex >= 0) {
        const updated = [...prevItems]
        const currentCant = Number(updated[existingIndex].cantidad || 0)
        const nuevaCant = Number((currentCant + cantidadInicial).toFixed(3))
        console.log(`[Vender.jsx] Actualizando cantidad existente de ${currentCant} a ${nuevaCant}`)
        updated[existingIndex] = {
          ...updated[existingIndex],
          cantidad: nuevaCant
        }
        return updated
      } else {
        console.log(`[Vender.jsx] Insertando nuevo ítem con cantidad ${cantidadInicial}`)
        return [
          ...prevItems,
          {
            ...item,
            cantidad: cantidadInicial,
            precio_unitario: item.precio,
            descuento: 0,
            tipo_afectacion_igv: String(item.tipo_afectacion_igv || item.tipo_tributo_id || '10'),
            es_facturable: item.es_facturable !== false && item.es_facturable !== 0 && item.es_facturable !== '0',
            tipo_stock_id: item.tipo_stock_id || 'GENERAL',
            gratuito: Boolean(item.gratuito || item.es_gratuito),
            tarifa: 'menor'
          }
        ]
      }
    })
  }

  const handleUpdateCantidad = (uniqueId, nuevaCantidad) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.uniqueId !== uniqueId) return item
        if (nuevaCantidad === '' || nuevaCantidad === null || nuevaCantidad === undefined) {
          return { ...item, cantidad: '' }
        }
        const num = Number(nuevaCantidad)
        if (isNaN(num)) return item
        const esDec = permiteDecimales(item)
        let finalCantidad = num
        if (!esDec) {
          finalCantidad = Math.round(num)
          if (finalCantidad < 1) finalCantidad = 1
        } else {
          if (finalCantidad < 0.001) finalCantidad = 0.001
        }
        return { ...item, cantidad: finalCantidad }
      })
    )
  }

  const handleUpdatePrecio = (uniqueId, nuevoPrecio) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.uniqueId !== uniqueId) return item
        if (nuevoPrecio === '' || nuevoPrecio === null || nuevoPrecio === undefined) {
          return { ...item, precio_unitario: '' }
        }
        const num = Number(nuevoPrecio)
        if (isNaN(num)) return item
        return { ...item, precio_unitario: Math.max(0, num) }
      })
    )
  }

  const handleUpdateTarifa = (uniqueId, nuevaTarifa) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.uniqueId !== uniqueId) return item
        let nuevoPrecio = item.precio
        if (nuevaTarifa === 'mayor' && item.precio_mayor > 0) {
          nuevoPrecio = item.precio_mayor
        } else if (nuevaTarifa === 'especial' && item.precio_especial > 0) {
          nuevoPrecio = item.precio_especial
        }
        return { ...item, tarifa: nuevaTarifa, precio_unitario: nuevoPrecio }
      })
    )
  }

  const handleRemoveItem = (uniqueId) => {
    setCartItems((prev) => prev.filter((item) => item.uniqueId !== uniqueId))
  }

  const handleClearCart = () => {
    setCartItems([])
  }

  // 4. Cálculos Matemáticos Centralizados en Operaciones.js (sin redondeo floor, factor 1000)
  const totales = useMemo(() => {
    return calcularTotalesVenta(cartItems)
  }, [cartItems])

  // Helper para validar si un string es un UUID válido
  const isValidUUID = (str) => {
    if (!str || typeof str !== 'string') return false
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
  }

  // Navegar a la pantalla de Pago / Procesar Preventa en BD
  const handleIrAPagar = async () => {
    // 0. Validar estado de caja (RN-V01 y RN-V02)
    if (cajaStatus.bloqueado) {
      toast.error('Caja no disponible', cajaStatus.mensaje)
      return
    }

    // A. Validar carrito no vacío
    if (!cartItems || cartItems.length === 0) {
      toast.info('Carrito vacío', 'Agregue al menos un producto para procesar la preventa.')
      return
    }

    // A.0 Validar total mayor a 0 (VAL-AFEC-06)
    if (totales.total <= 0 && totales.gratuito <= 0) {
      toast.error('Total no válido', 'El total no puede ser 0.')
      return
    }

    // A.1 Validar cantidades según unidad de medida
    for (const item of cartItems) {
      const cant = Number(item.cantidad)
      const esDec = permiteDecimales(item)
      if (isNaN(cant) || cant <= 0) {
        toast.error('Cantidad no válida', `Ingrese una cantidad mayor a 0 para "${item.nombre_completo}".`)
        return
      }
      if (!esDec && cant % 1 !== 0) {
        toast.error(
          'Cantidad no permitida',
          `El producto "${item.nombre_completo}" se vende por ${item.unidad_medida_id || 'UNIDAD'} y no admite cantidades decimales.`
        )
        return
      }
    }

    // A.2 Validar restricción estricta de Precio Costo
    for (const item of cartItems) {
      const costo = Number(item.precio_costo || 0)
      const precio = Number(item.precio_unitario || 0)
      if (costo > 0 && precio < costo) {
        toast.error(
          'Precio por debajo del costo',
          `El producto "${item.nombre_completo}" tiene un precio de S/ ${precio.toFixed(2)}, el cual no puede ser menor a su precio costo (S/ ${costo.toFixed(2)}).`
        )
        return
      }
    }

    // A.3 Validaciones fiscales por ítem (VAL-AFEC-01, VAL-AFEC-03)
    for (let i = 0; i < cartItems.length; i++) {
      const item = cartItems[i]
      const desc = Number(item.descuento || 0)
      const isGratuito = Boolean(item.gratuito || item.es_gratuito)
      const totalItemBruto = Number(item.cantidad || 0) * Number(item.precio_unitario || 0)

      if (isGratuito && desc > 0) {
        toast.error(
          'Validación fiscal de producto',
          `El producto no puede tener descuento y ser gratuito - posición ${i + 1}`
        )
        return
      }

      if (desc >= totalItemBruto && totalItemBruto > 0) {
        toast.error(
          'Descuento no permitido',
          `El descuento en la posición ${i + 1} no debe ser mayor que el total del detalle`
        )
        return
      }
    }

    // A.4 Validar productos no facturables o sin comprobante en Boleta/Factura (VAL-AFEC-07, VAL-AFEC-08)
    const esVale = tipoDocumento === 'vale' || tipoDocumento === '1'
    if (!esVale) {
      for (const item of cartItems) {
        const tipoStock = String(item.tipo_stock_id || '').toUpperCase()
        if (tipoStock === '2' || tipoStock === 'SIN_COMPROBANTE' || tipoStock === 'PENDIENTE') {
          toast.error(
            'Tipo de stock restringido',
            'Los productos sin comprobante solo pueden salir con vale'
          )
          return
        }

        if (item.es_facturable === false || item.es_facturable === 0 || item.es_facturable === '0') {
          toast.error(
            'Producto no facturable',
            'Los productos no facturables solo salen con vale'
          )
          return
        }
      }
    }

    // B. Validar tipo de comprobante vs cliente
    if (tipoDocumento === 'factura') {
      const doc = String(cliente?.numero_documento || '').trim()
      if (doc.length !== 11) {
        toast.error('Cliente no válido para Factura', 'Para emitir Factura debe seleccionar o ingresar un cliente con RUC (11 dígitos).')
        return
      }
    }

    if (tipoDocumento === 'boleta') {
      const doc = String(cliente?.numero_documento || '').trim()
      if (doc.length === 11) {
        toast.error('Comprobante incompatible', 'No puede realizar una boleta con un cliente con RUC')
        return
      }
    }

    // C. Validar Regla Fiscal SUNAT (RN-V03 / VAL-CLI-01): Total >= 700 exige identificar al cliente
    const docCliente = String(cliente?.numero_documento || '').trim()
    const esClienteGenerico = !docCliente || docCliente === '99999999' || docCliente === '00000000'
    if (totales.total >= 700 && esClienteGenerico && !esVale) {
      toast.error(
        'Identificación obligatoria (SUNAT)',
        'Seleccionar otro cliente por montos mayores a 700 S./'
      )
      setIsBuscarClienteOpen(true)
      return
    }

    setIsSubmitting(true)

    // C. Sanitizar cliente_id para evitar error de sintaxis UUID en PostgreSQL
    let sanitizedClienteId = null
    if (cliente?.id && isValidUUID(cliente.id)) {
      sanitizedClienteId = cliente.id
    }

    // Formatear payload de preventa con segregación de bases fiscales
    const preventaPayload = {
      cliente_id: sanitizedClienteId,
      tipo_documento: tipoDocumento,
      placa: placa || null,
      alias: placa || null,
      gravado: totales.gravado,
      exonerado: totales.exonerado,
      inafecto: totales.inafecto,
      gratuito: totales.gratuito,
      icbper: totales.icbper,
      igv: totales.igv,
      total: totales.total,
      items: cartItems.map((item) => ({
        producto_id: item.producto_id,
        presentacion_id: item.presentacion_id || null,
        cantidad: Number(item.cantidad),
        precio_unitario: Number(item.precio_unitario),
        descuento: Number(item.descuento || 0),
        tipo_afectacion_igv: String(item.tipo_afectacion_igv || item.tipo_tributo_id || '10'),
        gratuito: Boolean(item.gratuito || item.es_gratuito)
      }))
    }

    let activePreventaId = preventaId
    let success = false

    try {
      if (activePreventaId) {
        // Actualizar preventa existente
        const res = await venderController.actualizarPreventa(activePreventaId, preventaPayload)
        if (res.success) {
          success = true
          toast.success(
            'Pre-venta actualizada',
            `Pre-venta ${res.data?.codigo || `PRE-${String(activePreventaId).slice(0, 8)}`} actualizada correctamente.`
          )
        } else {
          toast.error('Error al actualizar pre-venta', res.message || 'No se pudo actualizar la preventa.')
        }
      } else {
        // Registrar nueva preventa
        const res = await venderController.crearPreventa(preventaPayload)
        if (res.success && res.data?.id) {
          activePreventaId = res.data.id
          setPreventaId(activePreventaId)
          success = true
          toast.success(
            'Pre-venta generada',
            `Pre-venta ${res.data?.codigo || `PRE-${String(activePreventaId).slice(0, 8)}`} registrada con éxito.`
          )
        } else {
          toast.error('Error al generar pre-venta', res.message || 'No se pudo registrar la preventa en base de datos.')
        }
      }
    } catch (err) {
      console.error('Error al procesar preventa:', err)
      toast.error('Error de conexión', err.message || 'Error al comunicarse con el servidor.')
    } finally {
      setIsSubmitting(false)
    }

    // VALIDACIÓN ESTRICTA: Si falló la creación/actualización de la preventa, NO continuar a pagos
    if (!success || !activePreventaId) {
      return
    }

    // Guardar estado en el store global
    store.setPreventaId(activePreventaId)
    store.setTipoDocumento(tipoDocumento)
    store.setCliente(cliente)
    store.setPlaca(placa)
    store.setCartItems(cartItems)

    navigate('/vender/pagar', {
      state: {
        preventaId: activePreventaId,
        tipoDocumento,
        cliente,
        placa,
        alias: placa,
        cartItems
      }
    })
  }

  // 5. Atajos de Teclado Globales
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F3: Buscar cliente
      if (e.key === 'F3') {
        e.preventDefault()
        setIsBuscarClienteOpen(true)
      }
      // F4 o Ctrl+Enter: Generar Preventa / Ir a Pagar
      if (e.key === 'F4' || (e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault()
        handleIrAPagar()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cartItems, tipoDocumento, cliente, placa])

  return (
    <div className="flex flex-col h-[calc(100vh-4.25rem)] -m-4 sm:-m-6 overflow-hidden relative">
      {/* ── BANNER BLOQUEANTE DE CAJA (RN-V01 y RN-V02) ── */}
      {cajaStatus.bloqueado && (
        <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <LockClosedIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {cajaStatus.motivo === 'TURNO_VENCIDO' ? 'Turno de Caja Vencido' : 'Caja Cerrada / Sin Turno'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {cajaStatus.mensaje}
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/caja')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
              >
                <span>Ir al Módulo Caja</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CUERPO PRINCIPAL (2 PANELES: PRODUCTOS IZQ, CARRITO DER) ── */}
      <div className="flex-1 p-3 sm:p-4 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        {/* PANEL IZQUIERDO: Configuración de Documento + Cliente + Lista de Productos */}
        <div className="lg:col-span-7 flex flex-col gap-2.5 h-full min-h-0 overflow-hidden">
          {/* Fila Superior: Selector de Documento + Sección de Cliente */}
          <div className="backdrop-blur-md dark:border-slate-800 shadow-sm shrink-0 space-y-2.5">
            {/* Selección de Cliente y Placa */}
            <ClienteSection
              cliente={cliente}
              setCliente={setCliente}
              tipoDocumento={tipoDocumento}
              setTipoDocumento={setTipoDocumento}
              placa={placa}
              setPlaca={setPlaca}
              onOpenBuscarModal={() => setIsBuscarClienteOpen(true)}
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* Selector de Tipo de Documento */}
              <div className="w-full">
                <TipoDocumentoSelector
                  tipoDocumento={tipoDocumento}
                  onChange={handleCambioTipoDocumento}
                />
              </div>
            </div>
          </div>

          {/* Tabla de Productos con Buscador */}
          <div className="flex-1 min-h-0">
            <ProductosList
              productos={productos}
              loading={loadingProductos}
              onAgregarItem={handleAgregarItem}
            />
          </div>
        </div>

        {/* PANEL DERECHO: Carrito de Productos */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 overflow-hidden">
          <CarritoList
            cartItems={cartItems}
            onUpdateCantidad={handleUpdateCantidad}
            onUpdatePrecio={handleUpdatePrecio}
            onUpdateTarifa={handleUpdateTarifa}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
          />
        </div>
      </div>

      {/* ── FOOTER TOTALIZADOR FIJO AL PIE CON BASES FISCALES ── */}
      <VentaFooter
        gravado={totales.gravado}
        exonerado={totales.exonerado}
        inafecto={totales.inafecto}
        gratuito={totales.gratuito}
        icbper={totales.icbper}
        igv={totales.igv}
        total={totales.total}
        itemCount={cartItems.length}
        onGenerarVenta={handleIrAPagar}
      />

      {/* ── MODAL AUXILIAR DE BÚSQUEDA GENERAL DE CLIENTE ── */}
      <BuscarClienteModal
        isOpen={isBuscarClienteOpen}
        onClose={() => setIsBuscarClienteOpen(false)}
        onSelectCliente={setCliente}
      />
    </div>
  )
}

