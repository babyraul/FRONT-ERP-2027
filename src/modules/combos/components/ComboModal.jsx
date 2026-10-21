import { useState, useEffect, useMemo, useRef } from 'react'
import {
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ShoppingBagIcon,
  InformationCircleIcon,
  TagIcon,
  QrCodeIcon,
  CalculatorIcon,
  CubeIcon,
  CurrencyDollarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import Modal from '../../../components/ui/Modal.jsx'
import SearchableSelect from '../../../components/ui/SearchableSelect.jsx'
import { combosService } from '../controller/combos.js'
import { toast } from '../../../utils/toast.js'

// Formateador legacy para truncamiento a N decimales
const decimalFloor = (val, decimals = 2) => {
  const num = Number(val) || 0
  const factor = Math.pow(10, decimals)
  return (Math.floor(num * factor) / factor).toFixed(decimals)
}

export default function ComboModal({ isOpen, onClose, comboId, onSaved, variant = 'modal' }) {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Cabecera del combo
  const [nombre, setNombre] = useState('')
  const [codigoBarras, setCodigoBarras] = useState('')

  // Catálogo de productos para el buscador
  const [productOptions, setProductOptions] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Selector y configuración del nuevo ítem a agregar
  const [selectedPresId, setSelectedPresId] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const [precioVenta, setPrecioVenta] = useState(0)
  const [precioCosto, setPrecioCosto] = useState(0)
  const [usarMargenGanancia, setUsarMargenGanancia] = useState(true)
  const [descuento, setDescuento] = useState(0)

  // Grilla de detalles en memoria
  const [detalles, setDetalles] = useState([])

  const inputDescuentoRef = useRef(null)

  // Cargar catálogo de productos para búsqueda
  useEffect(() => {
    if (isOpen) {
      cargarProductos()
    }
  }, [isOpen])

  const cargarProductos = async () => {
    setLoadingProducts(true)
    const res = await combosService.buscarProductos('')
    if (res.success) {
      setProductOptions(res.data)
    }
    setLoadingProducts(false)
  }

  // Cargar combo en modo edición o limpiar en modo registro
  useEffect(() => {
    if (!isOpen) return

    if (comboId) {
      setLoading(true)
      combosService
        .fetchDetail(comboId)
        .then((res) => {
          if (res.success && res.data) {
            const data = res.data
            setNombre(data.nombre || data.Nombre || '')
            setCodigoBarras(data.codigo_barra || data.CodigoBarras || '')
            const loadedDetalles = (data.detalles || []).map((d) => ({
              IdPresentacion: d.IdPresentacion || d.presentacion_componente_id,
              presentacion_componente_id: d.IdPresentacion || d.presentacion_componente_id,
              producto_nombre: d.producto_nombre || d.nombre,
              presentacion_nombre: d.presentacion_nombre || '',
              Cantidad: Math.max(1, parseInt(d.Cantidad || d.cantidad, 10) || 1),
              PrecioCosto: Number(d.PrecioCosto ?? d.precio_costo ?? 0),
              PrecioVenta: Number(d.PrecioVenta ?? d.precio_venta ?? 0),
              usarMargenGanancia: d.usar_margen_ganancia !== false && (d.tipo_ajuste === 'MARGEN' || d.Descuento < 0),
              Descuento: Math.abs(Number(d.valor_ajuste ?? d.Descuento ?? 0))
            }))
            setDetalles(loadedDetalles)
          } else {
            toast.error('Error', res.error || 'No se puede obtener información en este momento. Intentelo en unos minutos.')
            onClose()
          }
        })
        .finally(() => setLoading(false))
    } else {
      // Modo registrar
      setNombre('')
      setCodigoBarras('')
      setDetalles([])
      resetItemInputs()
    }
  }, [isOpen, comboId])

  const resetItemInputs = () => {
    setSelectedPresId('')
    setSelectedProduct(null)
    setCantidad(1)
    setPrecioVenta(0)
    setPrecioCosto(0)
    setUsarMargenGanancia(true)
    setDescuento(0)
  }

  // Al seleccionar producto en el buscador
  const handleSelectProduct = (presId) => {
    setSelectedPresId(presId)
    const prod = productOptions.find((p) => p.value === presId)
    if (prod) {
      setSelectedProduct(prod)
      setCantidad(1)
      setPrecioVenta(Number(prod.precio || 0))
      setPrecioCosto(Number(prod.precio_costo || 0))
      setDescuento(0)
      setTimeout(() => {
        if (inputDescuentoRef.current) {
          inputDescuentoRef.current.focus()
        }
      }, 50)
    } else {
      setSelectedProduct(null)
      setPrecioVenta(0)
      setPrecioCosto(0)
    }
  }

  // Cálculo del precio final del ítem que se está por agregar
  const itemPrecioFinal = useMemo(() => {
    if (usarMargenGanancia) {
      const margen = Number(descuento) || 0
      const pf = precioCosto + (precioCosto * margen) / 100
      return Math.max(0, pf)
    } else {
      const desc = Number(descuento) || 0
      const pf = precioVenta - desc
      return Math.max(0, pf)
    }
  }, [usarMargenGanancia, descuento, precioCosto, precioVenta])

  // Botón "Agregar item"
  const handleAddItem = () => {
    if (!selectedProduct || !selectedPresId) {
      toast.warning('Atención', 'Seleccione un producto para agregar.')
      return
    }

    // VI-01: Prohibición de duplicados
    const alreadyExists = detalles.find(
      (x) => String(x.IdPresentacion) === String(selectedPresId)
    )
    if (alreadyExists) {
      toast.error('Validación', 'El producto ya se encuentra registrado.')
      return
    }

    const nuevoItem = {
      IdPresentacion: selectedPresId,
      presentacion_componente_id: selectedPresId,
      producto_nombre: selectedProduct.producto_nombre,
      presentacion_nombre: selectedProduct.presentacion_nombre,
      Cantidad: Math.max(1, parseInt(cantidad, 10) || 1),
      PrecioCosto: precioCosto,
      PrecioVenta: precioVenta,
      usarMargenGanancia,
      Descuento: Math.max(0, parseFloat(descuento) || 0)
    }

    setDetalles((prev) => [...prev, nuevoItem])
    resetItemInputs()
  }

  // Modificar cantidad inline en la grilla (VI-02: fallback a 1)
  const handleInlineCantidadChange = (idx, val) => {
    const parsed = parseInt(val, 10)
    const validCant = isNaN(parsed) || parsed < 1 ? 1 : parsed
    setDetalles((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, Cantidad: validCant } : item))
    )
  }

  // Modificar descuento/margen inline en la grilla (VI-03: fallback a 0)
  const handleInlineDescuentoChange = (idx, val) => {
    const parsed = parseFloat(val)
    const validDesc = isNaN(parsed) ? 0 : Math.max(0, parsed)
    setDetalles((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, Descuento: validDesc } : item))
    )
  }

  // Eliminar ítem de la grilla
  const handleRemoveItem = (idx) => {
    setDetalles((prev) => prev.filter((_, i) => i !== idx))
  }

  // Cálculo del precio final por cada ítem en la grilla
  const getDetallePrecioFinal = (item) => {
    let pf = 0
    if (item.usarMargenGanancia !== false) {
      pf = item.PrecioCosto + (item.PrecioCosto * Number(item.Descuento || 0)) / 100
    } else {
      pf = item.PrecioVenta - Number(item.Descuento || 0)
    }
    return Math.max(0, pf)
  }

  // Totales acumulados (Form.js:590-605)
  const totalCalculado = useMemo(() => {
    return detalles.reduce((acc, curr) => {
      const pf = getDetallePrecioFinal(curr)
      return acc + pf * curr.Cantidad
    }, 0)
  }, [detalles])

  // Guardar cambios (POST o PUT)
  const handleSubmit = async (e) => {
    if (e) e.preventDefault()

    // Validación VC-01
    if (detalles.length === 0) {
      toast.error('Validación', 'Se debe asignar al menos un producto.')
      return
    }

    const payload = {
      nombre: nombre.trim(),
      codigo_barra: codigoBarras.trim(),
      detalles: detalles.map((d) => ({
        presentacion_componente_id: d.IdPresentacion,
        IdPresentacion: d.IdPresentacion,
        cantidad: d.Cantidad,
        tipo_ajuste: d.usarMargenGanancia ? 'MARGEN' : 'DESCUENTO',
        valor_ajuste: Number(d.Descuento || 0),
        usar_margen_ganancia: d.usarMargenGanancia,
        Descuento: d.usarMargenGanancia ? -Math.abs(Number(d.Descuento || 0)) : Math.abs(Number(d.Descuento || 0))
      }))
    }

    setSubmitting(true)
    let res
    if (comboId) {
      res = await combosService.update(comboId, payload)
    } else {
      res = await combosService.create(payload)
    }
    setSubmitting(false)

    if (res.success) {
      toast.success('Éxito', 'Se guardaron los cambios correctamente.')
      if (onSaved) onSaved()
      onClose()
    } else {
      toast.error('Error', res.error || 'No se pudo registrar el combo. Inténtalo otra vez.')
    }
  }

  const isInline = variant === 'inline'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={comboId ? 'Editar combo' : 'Registrar combo'}
      size="2xl"
      variant={variant}
      confirmButtonId="form-combo-modal"
      confirmText="Guardar cambios"
      cancelText="Cancelar"
      isProcessing={submitting}
      showFooter={isInline}
    >
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-[#01a59c] border-t-transparent mb-3"></div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cargando información del combo...</p>
        </div>
      ) : (
        <form id="form-combo-modal" onSubmit={handleSubmit} className="space-y-5">
          {/* SECCIÓN 1: DATOS PRINCIPALES DEL COMBO */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[#01a59c] border border-teal-100 dark:border-teal-900/50">
                  <TagIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Identificación del Combo / Paquete Promocional
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Define la denominación comercial y código de barras del kit para su venta rápida en caja.
                  </p>
                </div>
              </div>
              {nombre.trim().length >= 3 && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                  <CheckCircleIcon className="h-3.5 w-3.5" /> Nombre Válido
                </span>
              )}
            </div>

            <div className="space-y-3.5">
              {/* Nombre Comercial del Combo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center justify-between">
                  <span>Nombre del Combo *</span>
                  <span className="text-[11px] font-normal text-slate-400">Obligatorio</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Pack Parrillero 2026 (Carne + Chorizo + Carbón)"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50/60 dark:bg-slate-800/70 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#01a59c] focus:ring-2 focus:ring-[#01a59c]/20 outline-none text-sm font-medium dark:text-white transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Código de Barras */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <QrCodeIcon className="h-3.5 w-3.5 text-slate-500" />
                  <span>Código de Barras del Combo</span>
                  <span className="text-[11px] font-normal text-slate-400">(Opcional para lectura por scanner)</span>
                </label>
                <input
                  type="text"
                  name="codBarras"
                  value={codigoBarras}
                  onChange={(e) => setCodigoBarras(e.target.value)}
                  placeholder="Ej. 7750001234567"
                  className="w-full px-3.5 py-2.5 bg-slate-50/60 dark:bg-slate-800/70 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#01a59c] focus:ring-2 focus:ring-[#01a59c]/20 outline-none text-sm dark:text-white font-mono transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: BUSCADOR Y COMPOSICIÓN DE ÍTEMS */}
          <div className="p-5 bg-gradient-to-br from-teal-50/40 via-white to-slate-50/30 dark:from-slate-900 dark:via-slate-900/90 dark:to-teal-950/20 rounded-2xl border border-teal-100/80 dark:border-teal-900/40 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-teal-100/60 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-[#01a59c] dark:text-teal-400 uppercase tracking-wider">
                <div className="p-1.5 bg-teal-100/60 dark:bg-teal-950/60 rounded-lg text-[#01a59c]">
                  <ShoppingBagIcon className="h-4 w-4" />
                </div>
                <span>Agregar Producto o Presentación al Combo</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Selecciona la unidad y ajusta el margen o descuento comercial.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
              {/* Buscador de producto */}
              <div className="md:col-span-6">
                <SearchableSelect
                  label="Buscar Producto Componente"
                  placeholder={loadingProducts ? 'Cargando catálogo...' : 'Escriba nombre o código de barra...'}
                  options={productOptions}
                  value={selectedPresId}
                  onChange={handleSelectProduct}
                  allowEmpty={false}
                />
              </div>

              {/* Cantidad */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  step="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3 py-2 text-sm font-semibold text-center rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-[#01a59c] focus:ring-2 focus:ring-[#01a59c]/20 outline-none font-mono"
                />
              </div>

              {/* Precio venta base */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  P. Venta Base
                </label>
                <div className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-right font-medium">
                  S/ {decimalFloor(precioVenta, 2)}
                </div>
              </div>

              {/* Precio costo base */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  P. Costo Base
                </label>
                <div className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono text-right font-medium">
                  S/ {decimalFloor(precioCosto, 2)}
                </div>
              </div>
            </div>

            {/* Alternador de Margen / Descuento y Precio Final */}
            <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
              {/* Switch modo margen */}
              <div className="md:col-span-5 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Cálculo por Margen de Ganancia
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {usarMargenGanancia ? 'Sobre precio de costo' : 'Descuento manual sobre precio venta'}
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={usarMargenGanancia}
                  onClick={() => {
                    setUsarMargenGanancia(prev => !prev)
                    setDescuento(0)
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#01a59c] focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${usarMargenGanancia ? 'bg-[#01a59c]' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${usarMargenGanancia ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>

              {/* Input Margen / Descuento */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {usarMargenGanancia ? 'Margen Ganancia (%)' : 'Descuento (S/)'}
                </label>
                <div className="relative">
                  <input
                    ref={inputDescuentoRef}
                    type="number"
                    step="0.01"
                    min="0"
                    value={descuento}
                    onChange={(e) => setDescuento(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 text-sm font-semibold rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-[#01a59c] focus:ring-2 focus:ring-[#01a59c]/20 outline-none font-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
                    {usarMargenGanancia ? '%' : 'S/'}
                  </span>
                </div>
              </div>

              {/* Subtotal del item */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Precio Final
                </label>
                <div className="px-3 py-2 text-sm font-bold rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-right font-mono shadow-2xs">
                  S/ {decimalFloor(itemPrecioFinal, 3)}
                </div>
              </div>

              {/* Botón Agregar */}
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedProduct}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl text-white bg-[#01a59c] hover:bg-[#008f86] active:bg-[#007b73] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
                  title="Agregar item a la composición"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Agregar Ítem</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: GRILLA DE COMPONENTES ASIGNADOS */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="bg-slate-50/80 dark:bg-slate-800/60 px-5 py-3 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CubeIcon className="h-4 w-4 text-[#01a59c]" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Composición del Combo ({detalles.length} {detalles.length === 1 ? 'ítem' : 'ítems'})
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Ajuste la cantidad o margen en tiempo real
              </span>
            </div>

            <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100/70 dark:bg-slate-800/80 sticky top-0 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4 min-w-[200px]">Producto Componente</th>
                    <th className="py-2.5 px-3 w-[110px] text-center">Cantidad</th>
                    <th className="py-2.5 px-3 w-[110px] text-right">P. Costo</th>
                    <th className="py-2.5 px-3 w-[110px] text-right">P. Venta</th>
                    <th className="py-2.5 px-3 w-[150px] text-center">Margen / Dcto.</th>
                    <th className="py-2.5 px-4 w-[120px] text-right">Subtotal</th>
                    <th className="py-2.5 px-3 w-[60px] text-center">Quitar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {detalles.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                        <ShoppingBagIcon className="h-10 w-10 mx-auto mb-2 opacity-30 text-[#01a59c]" />
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Aún no se han asignado productos al combo</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Usa el buscador de arriba para incorporar componentes y calcular el precio paquete.</p>
                      </td>
                    </tr>
                  ) : (
                    detalles.map((item, idx) => {
                      const pf = getDetallePrecioFinal(item)
                      return (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-[#01a59c] shrink-0" />
                              <span>{item.producto_nombre}</span>
                            </div>
                            {item.presentacion_nombre && (
                              <div className="text-[11px] text-slate-400 pl-4 font-normal">
                                Unidad: {item.presentacion_nombre}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={item.Cantidad}
                              onChange={(e) => handleInlineCantidadChange(idx, e.target.value)}
                              className="w-16 px-2 py-1 text-center text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-slate-800 dark:text-white focus:ring-1 focus:ring-[#01a59c] outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500 dark:text-slate-400">
                            S/ {decimalFloor(item.PrecioCosto, 2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500 dark:text-slate-400">
                            S/ {decimalFloor(item.PrecioVenta, 2)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.Descuento}
                                onChange={(e) => handleInlineDescuentoChange(idx, e.target.value)}
                                className="w-18 px-2 py-1 text-center text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-slate-800 dark:text-white focus:ring-1 focus:ring-[#01a59c] outline-none"
                              />
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                {item.usarMargenGanancia ? '%' : 'S/'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {item.usarMargenGanancia ? 'Margen costo' : 'Dcto. venta'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                            S/ {decimalFloor(pf, 3)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="Quitar producto de la lista"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* SECCIÓN 4: RESUMEN Y TOTALES */}
            <div className="bg-slate-50/90 dark:bg-slate-800/70 px-5 py-3.5 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 font-medium">
                <span>
                  Total Componentes: <strong className="text-slate-900 dark:text-white font-bold">{detalles.length}</strong>
                </span>
                <span>•</span>
                <span>
                  Unidades Totales: <strong className="text-slate-900 dark:text-white font-bold">{detalles.reduce((acc, it) => acc + (Number(it.Cantidad) || 0), 0)}</strong>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                  Precio Total del Combo:
                </span>
                <span className="text-xl font-bold font-mono text-[#01a59c] dark:text-teal-400 bg-white dark:bg-slate-900 px-3.5 py-1 rounded-xl border border-teal-200 dark:border-teal-800 shadow-2xs">
                  S/ {decimalFloor(totalCalculado, 2)}
                </span>
              </div>
            </div>
          </div>

          {/* SECCIÓN 5: BOTONES DE ACCIÓN (Solo cuando es modal flotante; en variant="inline" ActionSection provee su footer) */}
          {!isInline && (
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors shadow-2xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl text-white bg-[#01a59c] hover:bg-[#008f86] active:bg-[#007b73] disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
              >
                {submitting && (
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                )}
                <span>Guardar cambios</span>
              </button>
            </div>
          )}
        </form>
      )}
    </Modal>
  )
}
