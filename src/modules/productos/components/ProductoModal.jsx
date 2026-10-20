import { useState, useEffect, useMemo } from 'react'
import {
  PlusIcon,
  TrashIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TagIcon,
  CubeIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import Modal from '../../../components/ui/Modal.jsx'
import SearchableSelect from '../../../components/ui/SearchableSelect.jsx'
import tablasFijasService from '../../../utils/tablasFijas.js'
import { productoController } from '../controllers/producto.js'
import { toast } from '../../../utils/toast.js'
import { useFactoresStore } from '../../../store/useFactoresStore.js'

export default function ProductoModal({ isOpen, onClose, producto, onSave }) {
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState({}) // Control de campos interactuados
  const [submitted, setSubmitted] = useState(false) // Flag de intento de envío
  const [activeTab, setActiveTab] = useState('producto') // 'producto' | 'presentaciones'

  const { factorPrecio, factorVolumen } = useFactoresStore()

  // Listas maestras para Selects Buscables
  const [unidades, setUnidades] = useState([])
  const [afectaciones, setAfectaciones] = useState([])
  const [categorias, setCategorias] = useState([])
  const [subcategorias, setSubcategorias] = useState([])
  const [tiposExistencia, setTiposExistencia] = useState([])
  const [tiposTributos, setTiposTributos] = useState([])

  // Estado del Formulario Principal
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    palabra_clave: '',
    codigo_barra: '',
    codigo_sunat: '',
    unidad_medida_id: 'NIU',
    categoria_id: '',
    sub_categoria_id: '',
    tipo_existencia_id: '1',
    tipo_tributo_id: '10',
    stock_minimo: 5,
    es_facturable: true,
    es_vendible: true,
    es_insumo: false,
    es_producido: false,
    es_combo: false,
    activo: true
  })

  // Estructura de Presentaciones (Nombre por defecto 'PRINCIPAL')
  const [presentaciones, setPresentaciones] = useState([
    {
      id: undefined,
      nombre: 'PRINCIPAL',
      cod_barra: '',
      unidad_medida_id: 'NIU',
      multiplica_por: 1,
      precio_costo: 0,
      precio_venta: 0,
      precio_mayor: 0,
      precio_especial: 0,
      precio_otros: 0,
      activo: true
    }
  ])

  useEffect(() => {
    setActiveTab('producto')
    setTouched({})
    setSubmitted(false)

    if (producto) {
      setFormData({
        nombre: producto.nombre || '',
        codigo: producto.codigo || '',
        descripcion: producto.descripcion || '',
        palabra_clave: producto.palabra_clave || '',
        codigo_barra: producto.codigo_barra || '',
        codigo_sunat: producto.codigo_sunat || '',
        unidad_medida_id: producto.unidad_medida_id || 'NIU',
        categoria_id: producto.categoria_id || '',
        sub_categoria_id: producto.sub_categoria_id || '',
        tipo_existencia_id: producto.tipo_existencia_id || '1',
        tipo_tributo_id: producto.tipo_tributo_id || '10',
        stock_minimo: Number(producto.stock_minimo || 0),
        es_facturable: producto.es_facturable ?? true,
        es_vendible: producto.es_vendible ?? true,
        es_insumo: producto.es_insumo ?? false,
        es_producido: producto.es_producido ?? false,
        es_combo: producto.es_combo ?? false,
        activo: producto.activo ?? true
      })

      if (Array.isArray(producto.presentaciones) && producto.presentaciones.length > 0) {
        setPresentaciones(producto.presentaciones.map((p, idx) => ({
          ...p,
          nombre: p.nombre || (idx === 0 ? 'PRINCIPAL' : `PRESENTACIÓN ${idx + 1}`),
          unidad_medida_id: p.unidad_medida_id || producto.unidad_medida_id || 'NIU',
          precio_costo: Number(p.precio_costo || 0),
          precio_venta: Number(p.precio_venta || 0),
          precio_mayor: Number(p.precio_mayor || 0),
          precio_especial: Number(p.precio_especial || 0),
          precio_otros: Number(p.precio_otros || 0),
          multiplica_por: Number(p.multiplica_por || 1)
        })))
      } else {
        setPresentaciones([
          {
            nombre: 'PRINCIPAL',
            cod_barra: producto.codigo_barra || '',
            unidad_medida_id: producto.unidad_medida_id || 'NIU',
            multiplica_por: 1,
            precio_costo: Number(producto.precio_costo || 0),
            precio_venta: Number(producto.precio_venta || 0),
            precio_mayor: Number(producto.precio_mayor || 0),
            precio_especial: Number(producto.precio_especial || 0),
            precio_otros: 0,
            activo: true
          }
        ])
      }
    } else {
      setFormData({
        nombre: '',
        codigo: '',
        descripcion: '',
        palabra_clave: '',
        codigo_barra: '',
        codigo_sunat: '',
        unidad_medida_id: 'NIU',
        categoria_id: '',
        sub_categoria_id: '',
        tipo_existencia_id: '1',
        tipo_tributo_id: '10',
        stock_minimo: 5,
        es_facturable: true,
        es_vendible: true,
        es_insumo: false,
        es_producido: false,
        es_combo: false,
        activo: true
      })
      setPresentaciones([
        {
          nombre: 'PRINCIPAL',
          cod_barra: '',
          unidad_medida_id: 'NIU',
          multiplica_por: 1,
          precio_costo: 0,
          precio_venta: 0,
          precio_mayor: 0,
          precio_especial: 0,
          precio_otros: 0,
          activo: true
        }
      ])
    }
  }, [producto, isOpen])

  // Carga de catálogos maestros
  useEffect(() => {
    const fetchCatalogos = async () => {
      const [
        resUnidades,
        resAfect,
        resCat,
        resSubcat,
        resExist,
        resTrib
      ] = await Promise.all([
        tablasFijasService.getTiposUnidadesMedida(),
        tablasFijasService.getTiposAfectacionIgv(),
        tablasFijasService.getCategorias(),
        tablasFijasService.getSubcategorias(),
        tablasFijasService.getTiposExistencia(),
        tablasFijasService.getTiposTributos()
      ])

      if (resUnidades.success) setUnidades(resUnidades.data)
      if (resAfect.success) setAfectaciones(resAfect.data)
      if (resCat.success) setCategorias(resCat.data)
      if (resSubcat.success) setSubcategorias(resSubcat.data)
      if (resExist.success) setTiposExistencia(resExist.data)
      if (resTrib.success) setTiposTributos(resTrib.data)
    }

    if (isOpen) {
      fetchCatalogos()
    }
  }, [isOpen])

  // Opciones formateadas para los SearchableSelect
  const opcionesUnidades = useMemo(() => {
    return unidades.map(u => ({
      value: u.codigo || u.id,
      label: `${u.descripcion}`,
      sublabel: u.codigo
    }))
  }, [unidades])

  const opcionesCategorias = useMemo(() => {
    return categorias.map(c => ({
      value: c.id,
      label: c.nombre
    }))
  }, [categorias])

  const opcionesSubcategorias = useMemo(() => {
    return subcategorias
      .filter(sc => !formData.categoria_id || !sc.idcategoria || sc.idcategoria === formData.categoria_id)
      .map(sc => ({
        value: sc.id,
        label: sc.Nombre || sc.nombre
      }))
  }, [subcategorias, formData.categoria_id])

  const opcionesExistencias = useMemo(() => {
    return tiposExistencia.map(te => ({
      value: te.id,
      label: te.descripcion,
      sublabel: te.codigo
    }))
  }, [tiposExistencia])

  const opcionesAfectaciones = useMemo(() => {
    return afectaciones.map(a => ({
      value: String(a.codigo),
      label: `${a.codigo} - ${a.descripcion}`,
      sublabel: String(a.codigo)
    }))
  }, [afectaciones])

  // Validaciones en tiempo real
  const errors = useMemo(() => {
    const errs = {
      nombre: '',
      unidad_medida_id: '',
      tipo_existencia_id: '',
      tipo_tributo_id: '',
      presentaciones: []
    }

    // 1. Nombre comercial
    if (!formData.nombre.trim()) {
      errs.nombre = 'El nombre comercial es obligatorio.'
    } else if (formData.nombre.trim().length < 3) {
      errs.nombre = 'El nombre debe tener al menos 3 caracteres.'
    }

    // 2. Unidad base
    if (!formData.unidad_medida_id) {
      errs.unidad_medida_id = 'Selecciona una unidad de medida base.'
    }

    // 3. Presentaciones
    presentaciones.forEach((p, idx) => {
      const pErr = {
        nombre: '',
        unidad: '',
        precio_costo: '',
        precio_venta: '',
        precio_mayor: '',
        precio_especial: '',
        relacion_precios: ''
      }

      if (!p.nombre || !p.nombre.trim()) {
        pErr.nombre = 'El nombre de la presentación es requerido.'
      }

      const unidadPres = idx === 0 ? (p.unidad_medida_id || formData.unidad_medida_id) : p.unidad_medida_id
      if (!unidadPres || !String(unidadPres).trim()) {
        pErr.unidad = 'Selecciona una unidad de medida.'
      }

      const costo = Number(p.precio_costo || 0)
      const venta = Number(p.precio_venta || 0)
      const mayor = Number(p.precio_mayor || 0)
      const especial = Number(p.precio_especial || 0)

      if (costo < 0) {
        pErr.precio_costo = 'El costo no puede ser negativo.'
      }

      if (venta <= 0) {
        pErr.precio_venta = 'El precio de venta debe ser mayor a 0.00.'
      } else if (venta < costo) {
        pErr.relacion_precios = `El precio de venta (S/. ${venta.toFixed(2)}) es menor al costo (S/. ${costo.toFixed(2)}). Margen negativo.`
        pErr.precio_venta = 'No puede ser menor al costo.'
      }

      if (mayor < 0) pErr.precio_mayor = 'No puede ser negativo.'
      if (especial < 0) pErr.precio_especial = 'No puede ser negativo.'

      errs.presentaciones[idx] = pErr
    })

    return errs
  }, [formData, presentaciones])

  // Identificar errores por sección/pestaña
  const hasProductoErrors = useMemo(() => {
    return Boolean(errors.nombre || errors.unidad_medida_id)
  }, [errors])

  const hasPresentacionErrors = useMemo(() => {
    return errors.presentaciones.some(p =>
      p.nombre || p.unidad || p.precio_costo || p.precio_venta || p.relacion_precios || p.precio_mayor || p.precio_especial
    )
  }, [errors])

  // Determinar si hay errores globales
  const hasErrors = useMemo(() => {
    return hasProductoErrors || hasPresentacionErrors
  }, [hasProductoErrors, hasPresentacionErrors])

  // Contar cantidad de problemas
  const totalErroresCount = useMemo(() => {
    let count = 0
    if (errors.nombre) count++
    if (errors.unidad_medida_id) count++
    errors.presentaciones.forEach(p => {
      if (p.nombre) count++
      if (p.unidad) count++
      if (p.precio_venta) count++
      if (p.precio_costo) count++
      if (p.relacion_precios) count++
    })
    return count
  }, [errors])

  const handleBlurField = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const handleBlurPresentacion = (idx, field) => {
    setTouched(prev => ({ ...prev, [`pres_${idx}_${field}`]: true }))
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    // Si cambia el código de barras principal, sincronizar la presentación principal si coincide o está vacía
    if (name === 'codigo_barra') {
      setPresentaciones(prev => {
        if (!prev || prev.length === 0) return prev
        const updated = [...prev]
        if (!updated[0].cod_barra || updated[0].cod_barra === formData.codigo_barra) {
          updated[0] = { ...updated[0], cod_barra: value }
        }
        return updated
      })
    }
  }

  const handleSelectField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setTouched(prev => ({ ...prev, [field]: true }))

    // Sincronización hereditaria automática: La presentación PRINCIPAL siempre hereda la unidad de medida base
    if (field === 'unidad_medida_id') {
      setPresentaciones(prev => {
        if (!prev || prev.length === 0) return prev
        const updated = [...prev]
        updated[0] = {
          ...updated[0],
          unidad_medida_id: value
        }
        return updated
      })
    }
  }

  const handlePresentacionChange = (index, field, value) => {
    setPresentaciones(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleAddPresentacion = () => {
    setPresentaciones(prev => [
      ...prev,
      {
        nombre: `PRESENTACIÓN ${prev.length + 1}`,
        cod_barra: '',
        unidad_medida_id: formData.unidad_medida_id || 'NIU',
        multiplica_por: 1,
        precio_costo: 0,
        precio_venta: 0,
        precio_mayor: 0,
        precio_especial: 0,
        precio_otros: 0,
        activo: true
      }
    ])
    // Asegurar que estamos en la pestaña de presentaciones al agregar
    setActiveTab('presentaciones')
  }

  const handleRemovePresentacion = (index) => {
    if (presentaciones.length <= 1) {
      return toast.warning('Atención', 'El producto debe tener al menos una presentación (PRINCIPAL).')
    }
    setPresentaciones(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setSubmitted(true)

    if (hasErrors) {
      // Redirigir a la pestaña que contenga el error
      if (hasProductoErrors && activeTab !== 'producto') {
        setActiveTab('producto')
      } else if (hasPresentacionErrors && activeTab !== 'presentaciones') {
        setActiveTab('presentaciones')
      }
      return toast.error(
        'Formulario incompleto o con errores',
        `Por favor revisa los ${totalErroresCount} campos resaltados en rojo antes de continuar.`
      )
    }

    // Validar y asegurar unidad_medida_id en cada presentación
    const presentacionesConUnidad = presentaciones.map((p, idx) => {
      const unidad = (p.unidad_medida_id || (idx === 0 ? formData.unidad_medida_id : '') || formData.unidad_medida_id || '').trim()
      return {
        ...p,
        unidad_medida_id: unidad
      }
    })

    const presSinUnidad = presentacionesConUnidad.find(p => !p.unidad_medida_id)
    if (presSinUnidad) {
      if (activeTab !== 'presentaciones') setActiveTab('presentaciones')
      return toast.error(
        'Unidad de medida requerida',
        `La presentación "${presSinUnidad.nombre || 'Sin nombre'}" debe tener asignada una unidad de medida.`
      )
    }

    setLoading(true)

    const payload = {
      ...formData,
      presentaciones: presentacionesConUnidad
    }

    try {
      if (producto?.id) {
        const res = await productoController.update(producto.id, payload)
        if (!res.success) throw new Error(res.error)
        toast.success('Producto actualizado', `"${formData.nombre}" ha sido actualizado con éxito.`)
      } else {
        const res = await productoController.create(payload)
        if (!res.success) throw new Error(res.error)
        toast.success('Producto registrado', `"${formData.nombre}" ha sido creado con éxito.`)
      }
      onSave()
      onClose()
    } catch (err) {
      toast.error('Error al guardar', err.message || 'No se pudo guardar el producto.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={producto?.id ? 'Editar Producto y Precios' : 'Nuevo Producto y Precios'}
      subtitle={
        producto?.codigo ? (
          <span className="flex items-center gap-2">
            <span>Define el catálogo del producto, facturación y presentaciones comerciales.</span>
            <span className="px-2 py-0.5 rounded-md font-mono text-xs bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
              Cód: {producto.codigo}
            </span>
          </span>
        ) : (
          'Define el catálogo del producto, facturación y presentaciones comerciales.'
        )
      }
      maxWidth="max-w-5xl w-full"
      size="4xl"
      confirmButtonId="productoForm"
      isProcessing={loading}
      confirmText={producto?.id ? 'Actualizar Producto' : 'Guardar Producto'}
    >
      <form id="productoForm" onSubmit={handleSubmit} className="space-y-4">

        {/* ── NAVEGACIÓN TIPO FIXED SUB-HEADER ── */}
        <div className="sticky -top-6 -mx-6 px-6 pt-2 pb-3 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md z-20 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('producto')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'producto'
                ? 'bg-white dark:bg-slate-900 text-[#01a59c] dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <TagIcon className="h-4 w-4" />
              <span>1. Datos del Producto y Facturación</span>
              {(submitted || Object.keys(touched).length > 0) && hasProductoErrors && (
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" title="Hay campos con error en esta sección" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('presentaciones')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'presentaciones'
                ? 'bg-white dark:bg-slate-900 text-[#01a59c] dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <CubeIcon className="h-4 w-4" />
              <span>2. Presentaciones y Precios</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${activeTab === 'presentaciones'
                ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                : 'bg-slate-300/60 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                {presentaciones.length}
              </span>
              {(submitted || Object.keys(touched).length > 0) && hasPresentacionErrors && (
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" title="Hay errores en las presentaciones" />
              )}
            </button>
          </div>

          {/* Botón rápido para agregar presentación visible en la navegación */}
          {activeTab === 'presentaciones' && (
            <button
              type="button"
              onClick={handleAddPresentacion}
              className="px-3 py-1.5 text-xs font-bold text-white bg-[#01a59c] hover:bg-[#018e86] rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Agregar Presentación</span>
            </button>
          )}
        </div>

        {/* ── BANNER DE ALERTA DINÁMICO EN CASO DE ERRORES ── */}
        {(submitted || Object.keys(touched).length > 0) && hasErrors && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl flex items-start gap-2.5 animate-in fade-in duration-200">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-red-800 dark:text-red-300">
                Se detectaron {totalErroresCount} observaciones en el formulario:
              </span>
              <p className="text-red-600 dark:text-red-400 mt-0.5">
                {hasProductoErrors && 'Revisa los campos de identificación o unidad en la pestaña "Datos del Producto". '}
                {hasPresentacionErrors && 'Revisa los precios o nombres en la pestaña "Presentaciones y Precios".'}
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECCIÓN 1: DATOS DEL PRODUCTO Y FACTURACIÓN
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'producto' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* 1.1 Columnas en orden de datos del producto */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <TagIcon className="h-4 w-4 text-[#01a59c]" />
                  <span>Identificación y Parámetros del Producto</span>
                </h3>
                {formData.nombre.trim().length >= 3 && (
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircleIcon className="h-4 w-4" /> Nombre Válido
                  </span>
                )}
              </div>

              {/* Grid ordenado como columnas consecutivas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Nombre Comercial */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 items-center justify-between">
                    <span>Nombre Comercial *</span>
                    {(submitted || touched.nombre) && errors.nombre && (
                      <span className="text-[11px] text-red-500 font-normal flex items-center gap-1 animate-pulse">
                        <ExclamationCircleIcon className="h-3.5 w-3.5" />
                        {errors.nombre}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="nombre"
                      required
                      value={formData.nombre}
                      onChange={handleChange}
                      onBlur={() => handleBlurField('nombre')}
                      placeholder="Ej. Arroz Extra Costeño 1kg"
                      className={`w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-lg focus:outline-none transition-all text-sm dark:text-white ${(submitted || touched.nombre) && errors.nombre
                        ? 'border-red-400 dark:border-red-500/80 bg-red-50/20 ring-2 ring-red-400/20'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#01a59c]'
                        }`}
                    />
                    {(submitted || touched.nombre) && errors.nombre && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 group">
                        <ExclamationCircleIcon className="h-4 w-4" />
                        <span className="absolute bottom-full right-0 mb-1 hidden group-hover:block bg-slate-900 text-white text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-30">
                          {errors.nombre}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Código de Barras / SKU Principal */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Código de Barras / SKU Principal
                  </label>
                  <input
                    type="text"
                    name="codigo_barra"
                    value={formData.codigo_barra}
                    onChange={handleChange}
                    placeholder="Ej. 775123456789"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#01a59c] outline-none text-sm dark:text-white font-mono"
                  />
                </div>

                {/* 3. Descripción Detallada */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Descripción Detallada <span className="text-[11px] text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Detalle o notas del producto para presupuestos o reportes"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#01a59c] outline-none text-sm dark:text-white"
                  />
                </div>

                {/* 4. Palabras Clave */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Palabras Clave <span className="text-[11px] text-slate-400 font-normal">(Tags de Búsqueda)</span>
                  </label>
                  <input
                    type="text"
                    name="palabra_clave"
                    value={formData.palabra_clave}
                    onChange={handleChange}
                    placeholder="arroz, grano, costeño"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#01a59c] outline-none text-sm dark:text-white"
                  />
                </div>

                {/* 5. Categoría */}
                <div>
                  <SearchableSelect
                    label="Categoría"
                    options={opcionesCategorias}
                    value={formData.categoria_id}
                    onChange={(val) => handleSelectField('categoria_id', val)}
                    placeholder="Buscar categoría..."
                    emptyOptionLabel="-- Sin Categoría --"
                  />
                </div>

                {/* 6. Subcategoría */}
                <div>
                  <SearchableSelect
                    label="Subcategoría"
                    options={opcionesSubcategorias}
                    value={formData.sub_categoria_id}
                    onChange={(val) => handleSelectField('sub_categoria_id', val)}
                    placeholder="Buscar subcategoría..."
                    emptyOptionLabel="-- Sin Subcategoría --"
                  />
                </div>

                {/* 7. Unidad de Medida Base */}
                <div>
                  <SearchableSelect
                    label="Unidad de Medida Base *"
                    options={opcionesUnidades}
                    value={formData.unidad_medida_id}
                    onChange={(val) => handleSelectField('unidad_medida_id', val)}
                    placeholder="Buscar unidad..."
                    allowEmpty={false}
                    error={(submitted || touched.unidad_medida_id) ? errors.unidad_medida_id : ''}
                  />
                  <span className="text-[10px] text-slate-400 block mt-1 leading-tight">
                    * La presentación <strong className="text-teal-600 dark:text-teal-400">PRINCIPAL</strong> heredará automáticamente esta unidad base.
                  </span>
                </div>

                {/* 8. Stock Mínimo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 items-center justify-between">
                    <span>Stock Mínimo (Alerta)</span>
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">
                      Base: {formData.unidad_medida_id || 'NIU'}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    name="stock_minimo"
                    value={formData.stock_minimo}
                    onChange={handleChange}
                    placeholder="Ej. 5"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#01a59c] outline-none text-sm dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 1.2 Datos de Facturación SUNAT */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Datos de Facturación y Parámetros Fiscales (SUNAT)</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* 9. Tipo de Existencia */}
                <SearchableSelect
                  label="Tipo de Existencia"
                  options={opcionesExistencias}
                  value={formData.tipo_existencia_id}
                  onChange={(val) => handleSelectField('tipo_existencia_id', val)}
                  placeholder="Buscar tipo existencia..."
                  allowEmpty={false}
                />

                {/* 10. Afectación al IGV */}
                <SearchableSelect
                  label="Afectación al IGV"
                  options={opcionesAfectaciones}
                  value={formData.tipo_tributo_id}
                  onChange={(val) => handleSelectField('tipo_tributo_id', val)}
                  placeholder="Buscar afectación..."
                  allowEmpty={false}
                />

                {/* 11. Código SUNAT */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Código SUNAT / UNSPSC
                  </label>
                  <input
                    type="text"
                    name="codigo_sunat"
                    value={formData.codigo_sunat}
                    onChange={handleChange}
                    placeholder="Ej. 50192701"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#01a59c] outline-none text-sm dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 1.3 Flags y Parámetros Booleanos */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Comportamiento Operativo y Opciones de Venta
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <input
                    type="checkbox"
                    name="es_facturable"
                    checked={formData.es_facturable}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#01a59c] rounded border-slate-300 focus:ring-[#01a59c]"
                  />
                  <span>Facturable (FE)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <input
                    type="checkbox"
                    name="es_vendible"
                    checked={formData.es_vendible}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#01a59c] rounded border-slate-300 focus:ring-[#01a59c]"
                  />
                  <span>Vendible en POS</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <input
                    type="checkbox"
                    name="es_producido"
                    checked={formData.es_producido}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#01a59c] rounded border-slate-300 focus:ring-[#01a59c]"
                  />
                  <span>Es Producido</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <input
                    type="checkbox"
                    name="es_combo"
                    checked={formData.es_combo}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#01a59c] rounded border-slate-300 focus:ring-[#01a59c]"
                  />
                  <span>Es Combo / Pack</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <input
                    type="checkbox"
                    name="es_insumo"
                    checked={formData.es_insumo}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#01a59c] rounded border-slate-300 focus:ring-[#01a59c]"
                  />
                  <span>Es Insumo</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECCIÓN 2: PRESENTACIONES Y Precios
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'presentaciones' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Cabecera y botón de agregar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-teal-50/50 dark:bg-teal-950/20 rounded-2xl border border-teal-100 dark:border-teal-900/40">
              <div>
                <h3 className="text-xs font-bold text-[#01a59c] dark:text-teal-400 uppercase tracking-wider flex items-center gap-2">
                  <CubeIcon className="h-4 w-4" />
                  <span>Presentaciones Comerciales y Estructura de Precios (S/.)</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  La presentación inicial es <strong>PRINCIPAL</strong>. Configura las unidades de venta (ej: Sixpack, Caja, Blister) con su respectivo factor de conversión.
                </p>
              </div>
            </div>

            {/* Listado de tarjetas de presentaciones */}
            <div className="space-y-3">
              {presentaciones.map((pres, idx) => {
                const pErr = errors.presentaciones[idx] || {}
                const margenSoles = Number(pres.precio_venta || 0) - Number(pres.precio_costo || 0)
                const margenPorcentaje = Number(pres.precio_costo || 0) > 0
                  ? ((margenSoles / Number(pres.precio_costo)) * 100).toFixed(1)
                  : '100.0'

                const hasPresError = Boolean(
                  pErr.nombre || pErr.precio_venta || pErr.precio_costo || pErr.relacion_precios
                )

                return (
                  <div
                    key={idx}
                    className={`p-4 bg-white dark:bg-slate-900 rounded-xl border shadow-2xs space-y-3 transition-colors ${hasPresError
                      ? 'border-red-300 dark:border-red-800/80 bg-red-50/10'
                      : 'border-slate-200 dark:border-slate-800'
                      }`}
                  >
                    {/* Header de la tarjeta de presentación */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs font-mono ${hasPresError
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                          : 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'
                          }`}>
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200">
                          {pres.nombre || `PRESENTACIÓN ${idx + 1}`}
                        </span>
                        {idx === 0 && (
                          <span className="text-[10px] bg-teal-100 dark:bg-teal-900/30 text-[#01a59c] dark:text-teal-400 font-semibold px-2 py-0.5 rounded-full">
                            Predeterminada
                          </span>
                        )}

                        {/* Margen dinámico calculado */}
                        {Number(pres.precio_venta) > 0 && Number(pres.precio_costo) >= 0 && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ml-1 ${margenSoles < 0
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            }`}>
                            Margen: S/. {margenSoles.toFixed(2)} ({margenPorcentaje}%)
                          </span>
                        )}
                      </div>

                      {presentaciones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePresentacion(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors rounded-md cursor-pointer"
                          title="Eliminar presentación"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* ALERTA DE MARGEN NEGATIVO EN TIEMPO REAL */}
                    {pErr.relacion_precios && (
                      <div className="px-3 py-1.5 bg-red-100/70 dark:bg-red-900/40 border border-red-300 dark:border-red-800 rounded-lg flex items-center gap-2 text-xs text-red-700 dark:text-red-300 animate-in fade-in">
                        <ExclamationCircleIcon className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                        <span>{pErr.relacion_precios}</span>
                      </div>
                    )}

                    {/* Fila 1: Nombre, Unidad, Código de Barras y Factor Multiplicador */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 items-center justify-between">
                          <span>Nombre Presentación *</span>
                          {pErr.nombre && (
                            <span className="text-[10px] text-red-500 font-normal">{pErr.nombre}</span>
                          )}
                        </label>
                        <input
                          type="text"
                          required
                          value={pres.nombre}
                          onChange={(e) => handlePresentacionChange(idx, 'nombre', e.target.value.toUpperCase())}
                          onBlur={() => handleBlurPresentacion(idx, 'nombre')}
                          placeholder="Ej. PRINCIPAL, CAJA X 12, BLISTER"
                          className={`w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs dark:text-white uppercase font-medium focus:outline-none transition-all ${pErr.nombre
                            ? 'border-red-400 dark:border-red-500 ring-1 ring-red-400'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#01a59c]'
                            }`}
                        />
                      </div>

                      {/* Unidad de Medida: Heredada en la presentación PRINCIPAL */}
                      {idx === 0 ? (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
                            <span>Unidad de Medida</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-900/50 text-[#01a59c] dark:text-teal-300 font-bold uppercase">
                              Heredada
                            </span>
                          </label>
                          <div
                            className="w-full px-2.5 py-2 bg-slate-100/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between shadow-2xs"
                            title="La presentación principal hereda y sincroniza automáticamente la Unidad Base del producto"
                          >
                            <span className="truncate">
                              {opcionesUnidades.find(u => u.value === (formData.unidad_medida_id || pres.unidad_medida_id))?.label || formData.unidad_medida_id || 'NIU'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 font-semibold shrink-0 ml-1">
                              ({formData.unidad_medida_id || 'NIU'})
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <SearchableSelect
                            label="Unidad de Medida *"
                            options={opcionesUnidades}
                            value={pres.unidad_medida_id || ''}
                            onChange={(val) => handlePresentacionChange(idx, 'unidad_medida_id', val)}
                            placeholder="Buscar unidad..."
                            allowEmpty={false}
                            error={submitted && !pres.unidad_medida_id ? 'Requerido' : ''}
                          />
                        </div>
                      )}

                      {/* Código de Barras / SKU */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Código de Barras / SKU
                        </label>
                        <input
                          type="text"
                          value={pres.cod_barra || ''}
                          onChange={(e) => handlePresentacionChange(idx, 'cod_barra', e.target.value)}
                          placeholder={idx === 0 && formData.codigo_barra ? formData.codigo_barra : "SKU específico"}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white font-mono focus:ring-2 focus:ring-[#01a59c] outline-none"
                        />
                        {idx === 0 && formData.codigo_barra && !pres.cod_barra && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Usa: {formData.codigo_barra}
                          </span>
                        )}
                      </div>

                      {/* Multiplica por: Bloqueado a 1 en la PRINCIPAL, editable en secundarias */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
                          <span>Multiplica por</span>
                          {idx === 0 && (
                            <span className="text-[9px] text-slate-400 font-normal">Base x1</span>
                          )}
                        </label>
                        {idx === 0 ? (
                          <div>
                            <div
                              className="w-full px-2.5 py-2 bg-slate-100/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black font-mono text-slate-600 dark:text-slate-300 flex items-center justify-between"
                              title="La presentación principal equivale exactamente a 1 unidad base del inventario"
                            >
                              <span>1</span>
                              <span className="text-[10px] text-slate-400 font-sans font-normal">
                                {formData.unidad_medida_id || 'NIU'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Factor 1 (Unidad Base)
                            </span>
                          </div>
                        ) : (
                          <div>
                            <input
                              type="number"
                              min="1"
                              value={pres.multiplica_por || 1}
                              onChange={(e) => handlePresentacionChange(idx, 'multiplica_por', Math.max(1, Number(e.target.value)))}
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white font-mono focus:ring-2 focus:ring-[#01a59c] outline-none"
                            />
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                              = {pres.multiplica_por || 1} {formData.unidad_medida_id || 'NIU'} base
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Fila 2: Precios y Estado de la Presentación */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2 border-t border-slate-50 dark:border-slate-800">
                      <div>
                        <label className="block text-[10px] font-bold text-teal-700 dark:text-teal-400 mb-0.5 items-center justify-between">
                          <span>Precio Costo (S/.) *</span>
                          {pErr.precio_costo && <span className="text-red-500 text-[9px]">{pErr.precio_costo}</span>}
                        </label>
                        <div className="relative group">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={pres.precio_costo}
                            onChange={(e) => handlePresentacionChange(idx, 'precio_costo', Number(e.target.value))}
                            onBlur={() => handleBlurPresentacion(idx, 'precio_costo')}
                            className={`w-full px-2.5 py-1 bg-teal-50/40 dark:bg-teal-950/30 border-2 rounded-lg text-xs dark:text-white font-bold font-mono focus:outline-none transition-all ${pErr.precio_costo
                              ? 'border-red-400 ring-1 ring-red-400'
                              : 'border-teal-400 dark:border-teal-600 focus:ring-2 focus:ring-[#01a59c]'
                              }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-teal-700 dark:text-teal-400 mb-0.5 items-center justify-between">
                          <span>Precio Venta (S/.) *</span>
                          {pErr.precio_venta && <span className="text-red-500 text-[9px]">{pErr.precio_venta}</span>}
                        </label>
                        <div className="relative group">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={pres.precio_venta}
                            onChange={(e) => handlePresentacionChange(idx, 'precio_venta', Number(e.target.value))}
                            onBlur={() => handleBlurPresentacion(idx, 'precio_venta')}
                            className={`w-full px-2.5 py-1 rounded-lg text-xs dark:text-white font-bold font-mono border-2 focus:outline-none transition-all ${pErr.precio_venta || pErr.relacion_precios
                              ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 ring-2 ring-red-300'
                              : 'bg-teal-50/40 dark:bg-teal-950/30 border-teal-400 dark:border-teal-600 focus:ring-2 focus:ring-[#01a59c]'
                              }`}
                          />
                          {(pErr.precio_venta || pErr.relacion_precios) && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 group-hover:opacity-100">
                              <ExclamationCircleIcon className="h-4 w-4" />
                              <span className="absolute bottom-full right-0 mb-1 hidden group-hover:block bg-red-950 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-30">
                                {pErr.relacion_precios || pErr.precio_venta}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                          Precio x Mayor (S/.)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={pres.precio_mayor}
                          onChange={(e) => handlePresentacionChange(idx, 'precio_mayor', Number(e.target.value))}
                          className="w-full px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white font-mono outline-none focus:ring-1 focus:ring-[#01a59c]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                          Precio Especial (S/.)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={pres.precio_especial}
                          onChange={(e) => handlePresentacionChange(idx, 'precio_especial', Number(e.target.value))}
                          className="w-full px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white font-mono outline-none focus:ring-1 focus:ring-[#01a59c]"
                        />
                      </div>
                      {/* 
                      <div className="flex items-center pt-3 pl-2">
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pres.activo}
                            onChange={(e) => handlePresentacionChange(idx, 'activo', e.target.checked)}
                            className="w-3.5 h-3.5 text-[#01a59c] rounded border-slate-300 focus:ring-[#01a59c]"
                          />
                          <span>Presentación Activa</span>
                        </label>
                      </div> */}
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        )}

      </form>
    </Modal>
  )
}
