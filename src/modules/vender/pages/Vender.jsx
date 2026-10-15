import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useProductosStore } from '../../../store/useProductosStore.js'
import { useClientesStore } from '../../../store/useClientesStore.js'
import { useVentaActivaStore } from '../store/useVentaActivaStore.js'
import TipoDocumentoSelector from '../components/TipoDocumentoSelector.jsx'
import ClienteSection from '../components/ClienteSection.jsx'
import ProductosList from '../components/ProductosList.jsx'
import CarritoList from '../components/CarritoList.jsx'
import VentaFooter from '../components/VentaFooter.jsx'
import BuscarClienteModal from '../components/BuscarClienteModal.jsx'
import CobroModal from '../components/CobroModal.jsx'
import ClienteModal from '../../clientes/components/ClienteModal.jsx'
import { clienteController } from '../../clientes/controllers/cliente.js'
import { venderController } from '../controllers/venderController.js'
import { toast } from '../../../utils/toast.js'

export default function Vender() {
  const navigate = useNavigate()
  const location = useLocation()
  const store = useVentaActivaStore()
  const { productos, loading: loadingProductos, fetchProductos } = useProductosStore()

  // 1. Estados Principales (inicializados desde navigation state o store para persistencia)
  const navState = location.state || {}
  const [tipoDocumento, setTipoDocumento] = useState(navState.tipoDocumento || store.tipoDocumento || 'boleta')
  const [cliente, setCliente] = useState(
    navState.cliente || store.cliente || {
      id: 'varios',
      tipo_documento_id: '0',
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

  // 2. Modales
  const [isBuscarClienteOpen, setIsBuscarClienteOpen] = useState(false)
  const [isNuevoClienteOpen, setIsNuevoClienteOpen] = useState(false)
  const [isCobroOpen, setIsCobroOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

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

  // 4. Cálculos Matemáticos de Facturación (Gravado, IGV 18%, Redondeo, Total)
  const totales = useMemo(() => {
    const rawTotal = cartItems.reduce(
      (sum, item) => sum + Number(item.cantidad) * Number(item.precio_unitario),
      0
    )

    // Redondeo legal a 2 decimales
    const total = Math.round(rawTotal * 100) / 100
    const gravado = Math.round((total / 1.18) * 100) / 100
    const igv = Math.round((total - gravado) * 100) / 100
    const redondeo = 0.0

    return {
      gravado,
      igv,
      redondeo,
      total
    }
  }, [cartItems])

  // Navegar a la pantalla de Pago / Procesar Preventa
  const handleIrAPagar = () => {
    if (cartItems.length === 0) {
      toast.info('Carrito vacío', 'Agregue al menos un producto para procesar la preventa.')
      return
    }
    // Guardar estado en el store global
    store.setTipoDocumento(tipoDocumento)
    store.setCliente(cliente)
    store.setPlaca(placa)
    store.setCartItems(cartItems)

    navigate('/vender/pagar', {
      state: {
        tipoDocumento,
        cliente,
        placa,
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
      // F4: Generar Preventa / Ir a Pagar
      if (e.key === 'F4' || (e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault()
        handleIrAPagar()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cartItems, tipoDocumento, cliente, placa])

  // 6. Confirmación y Registro de la Venta
  const handleConfirmarVenta = async (payload) => {
    setIsProcessing(true)
    const res = await venderController.registrarVenta(payload)
    setIsProcessing(false)

    if (res.success) {
      toast.success(
        'Venta generada con éxito',
        `Comprobante emitido correctamente por S/ ${totales.total.toFixed(2)}`
      )
      // Resetear para la siguiente venta
      setCartItems([])
      setPlaca('')
      setCliente({
        id: 'varios',
        tipo_documento_id: '0',
        numero_documento: '99999999',
        nombre_razon_social: 'VARIOS'
      })
      setIsCobroOpen(false)
    } else {
      toast.error('Error al emitir venta', res.message || 'No se pudo registrar la venta.')
    }
  }

  // Guardar nuevo cliente desde modal
  const handleGuardarNuevoCliente = async (clienteData) => {
    const res = await clienteController.create(clienteData)
    if (res.success) {
      toast.success('Cliente registrado', 'El cliente fue guardado y seleccionado.')
      setCliente(res.data)
      setIsNuevoClienteOpen(false)
    } else {
      toast.error('Error al guardar cliente', res.message || 'No se pudo crear el cliente.')
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4.25rem)] -m-4 sm:-m-6 overflow-hidden">
      {/* ── CUERPO PRINCIPAL (2 PANELES: PRODUCTOS IZQ, CARRITO DER) ── */}
      <div className="flex-1 p-3 sm:p-4 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        {/* PANEL IZQUIERDO: Configuración de Documento + Cliente + Lista de Productos */}
        <div className="lg:col-span-7 flex flex-col gap-2.5 h-full min-h-0 overflow-hidden">
          {/* Fila Superior: Selector de Documento + Sección de Cliente */}
          <div className=" backdrop-blur-md dark:border-slate-800 shadow-sm shrink-0 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* Selector de Tipo de Documento */}
              <div className="w-full">
                <TipoDocumentoSelector
                  tipoDocumento={tipoDocumento}
                  onChange={handleCambioTipoDocumento}
                />
              </div>
            </div>

            {/* Selección de Cliente y Placa */}
            <ClienteSection
              cliente={cliente}
              setCliente={setCliente}
              placa={placa}
              setPlaca={setPlaca}
              onOpenBuscarModal={() => setIsBuscarClienteOpen(true)}
              onOpenNuevoModal={() => setIsNuevoClienteOpen(true)}
            />
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

      {/* ── FOOTER TOTALIZADOR FIJO AL PIE (NO TAPA CONTENIDO) ── */}
      <VentaFooter
        gravado={totales.gravado}
        igv={totales.igv}
        redondeo={totales.redondeo}
        total={totales.total}
        itemCount={cartItems.length}
        onGenerarVenta={handleIrAPagar}
        disabled={isProcessing}
      />

      {/* ── MODALES AUXILIARES ── */}
      {/* 1. Modal Buscar Cliente */}
      <BuscarClienteModal
        isOpen={isBuscarClienteOpen}
        onClose={() => setIsBuscarClienteOpen(false)}
        onSelectCliente={setCliente}
        onOpenNuevoCliente={() => setIsNuevoClienteOpen(true)}
      />

      {/* 2. Modal Registrar Nuevo Cliente */}
      {isNuevoClienteOpen && (
        <ClienteModal
          isOpen={isNuevoClienteOpen}
          onClose={() => setIsNuevoClienteOpen(false)}
          onSave={handleGuardarNuevoCliente}
          isProcessing={isProcessing}
        />
      )}

      {/* 3. Modal de Cobro y Métodos de Pago */}
      <CobroModal
        isOpen={isCobroOpen}
        onClose={() => setIsCobroOpen(false)}
        total={totales.total}
        tipoDocumento={tipoDocumento}
        cliente={cliente}
        placa={placa}
        cartItems={cartItems}
        onConfirmarVenta={handleConfirmarVenta}
        isProcessing={isProcessing}
      />
    </div>
  )
}
