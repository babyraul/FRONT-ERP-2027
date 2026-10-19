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
import { calcularTotalesVenta } from '../../../utils/Operaciones.js'
import { toast } from '../../../utils/toast.js'

export default function Vender() {
  const navigate = useNavigate()
  const location = useLocation()
  const store = useVentaActivaStore()
  const { productos, loading: loadingProductos, fetchProductos } = useProductosStore()

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

  // Cargar productos al montar
  useEffect(() => {
    fetchProductos()
  }, [fetchProductos])

  // Validación automática de tipo de comprobante vs cliente
  const handleCambioTipoDocumento = (nuevoTipo) => {
    setTipoDocumento(nuevoTipo)
    if (nuevoTipo === 'factura' && cliente.tipo_documento_id !== '6') {
      toast.info('Factura seleccionada', 'Recuerde ingresar o buscar un cliente con RUC (11 dígitos).')
    }
  }

  // 3. Gestión del Carrito
  const handleAgregarItem = (item) => {
    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((i) => i.uniqueId === item.uniqueId)
      if (existingIndex >= 0) {
        const updated = [...prevItems]
        updated[existingIndex].cantidad = Number((updated[existingIndex].cantidad + 1).toFixed(2))
        return updated
      } else {
        return [
          ...prevItems,
          {
            ...item,
            cantidad: 1,
            precio_unitario: item.precio,
            tarifa: 'menor'
          }
        ]
      }
    })
  }

  const handleUpdateCantidad = (uniqueId, nuevaCantidad) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.uniqueId === uniqueId ? { ...item, cantidad: Math.max(0.01, nuevaCantidad) } : item
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

  // 4. Cálculos Matemáticos Centralizados en Operaciones.js (sin redondeo)
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
    // A. Validar carrito
    if (!cartItems || cartItems.length === 0) {
      toast.info('Carrito vacío', 'Agregue al menos un producto para procesar la preventa.')
      return
    }

    // B. Validar tipo de comprobante vs cliente
    if (tipoDocumento === 'factura') {
      const doc = String(cliente?.numero_documento || '').trim()
      if (doc.length !== 11) {
        toast.error('Cliente no válido para Factura', 'Para emitir Factura debe seleccionar o ingresar un cliente con RUC (11 dígitos).')
        return
      }
    }

    setIsSubmitting(true)

    // C. Sanitizar cliente_id para evitar error de sintaxis UUID en PostgreSQL
    let sanitizedClienteId = null
    if (cliente?.id && isValidUUID(cliente.id)) {
      sanitizedClienteId = cliente.id
    }

    // Formatear payload de preventa
    const preventaPayload = {
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
    <div className="flex flex-col h-[calc(100vh-4.25rem)] -m-4 sm:-m-6 overflow-hidden">
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

      {/* ── FOOTER TOTALIZADOR FIJO AL PIE ── */}
      <VentaFooter
        gravado={totales.gravado}
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

