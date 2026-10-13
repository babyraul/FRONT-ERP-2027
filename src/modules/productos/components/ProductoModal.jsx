import { useState, useEffect, useMemo } from 'react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import Modal from '../../../components/ui/Modal.jsx'
import SearchableSelect from '../../../components/ui/SearchableSelect.jsx'
import tablasFijasService from '../../../utils/tablasFijas.js'
import { productoController } from '../controllers/producto.js'
import { toast } from '../../../utils/toast.js'

export default function ProductoModal({ isOpen, onClose, producto, onSave }) {
  const [loading, setLoading] = useState(false)
  
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
    descripcion: '',
    palabra_clave: '',
    codigo_barra: '',
    codigo_sunat: '',
    unidad_medida_id: 'NIU',
    categoria_id: '',
    sub_categoria_id: '',
    tipo_existencia_id: '',
    tipo_tributo_id: '',
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
    if (producto) {
      setFormData({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        palabra_clave: producto.palabra_clave || '',
        codigo_barra: producto.codigo_barra || '',
        codigo_sunat: producto.codigo_sunat || '',
        unidad_medida_id: producto.unidad_medida_id || 'NIU',
        categoria_id: producto.categoria_id || '',
        sub_categoria_id: producto.sub_categoria_id || '',
        tipo_existencia_id: producto.tipo_existencia_id || '',
        tipo_tributo_id: producto.tipo_tributo_id || '',
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
        descripcion: '',
        palabra_clave: '',
        codigo_barra: '',
        codigo_sunat: '',
        unidad_medida_id: 'NIU',
        categoria_id: '',
        sub_categoria_id: '',
        tipo_existencia_id: '',
        tipo_tributo_id: '',
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
      label: `${u.codigo} - ${u.descripcion}`,
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
    // Si hay categoría seleccionada, filtrar subcategorías que correspondan (si aplica idcategoria)
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSelectField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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
  }

  const handleRemovePresentacion = (index) => {
    if (presentaciones.length <= 1) {
      return toast.warning('Atención', 'El producto debe tener al menos una presentación (PRINCIPAL).')
    }
    setPresentaciones(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!formData.nombre.trim()) {
      return toast.warning('Campo requerido', 'El nombre comercial del producto es obligatorio.')
    }

    for (const [idx, pres] of presentaciones.entries()) {
      if (!pres.nombre.trim()) {
        return toast.warning('Atención', `La presentación #${idx + 1} debe tener un nombre.`)
      }
      if (Number(pres.precio_venta) < 0) {
        return toast.warning('Atención', `El precio de venta en "${pres.nombre}" no puede ser negativo.`)
      }
    }

    setLoading(true)

    const payload = {
      ...formData,
      presentaciones
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
      title={producto?.id ? 'Editar Producto y Tarifas' : 'Nuevo Producto y Tarifas'}
      subtitle="Define el catálogo del producto, sus códigos SUNAT y sus presentaciones comerciales."
      maxWidth="max-w-4xl"
      confirmButtonId="productoForm"
      isProcessing={loading}
      confirmText={producto?.id ? 'Actualizar Producto' : 'Guardar Producto'}
    >
      <form id="productoForm" onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECCIÓN 1: IDENTIFICACIÓN BÁSICA */}
        <div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            1. Identificación del Producto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre Comercial *
              </label>
              <input
                type="text"
                name="nombre"
                required
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej. Arroz Extra Costeño 1kg"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Código de Barras / SKU Principal
              </label>
              <input
                type="text"
                name="codigo_barra"
                value={formData.codigo_barra}
                onChange={handleChange}
                placeholder="Ej. 775123456789"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white font-mono"
              />
            </div>

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
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Palabras Clave <span className="text-[11px] text-slate-400 font-normal">(Tags de Búsqueda)</span>
              </label>
              <input
                type="text"
                name="palabra_clave"
                value={formData.palabra_clave}
                onChange={handleChange}
                placeholder="arroz, grano, costeño"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: PRESENTACIONES DINÁMICAS (NOMBRE POR DEFECTO PRINCIPAL + UNIDAD DE MEDIDA) */}
        <div className="p-4 bg-blue-50/40 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-blue-950 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                2. Presentaciones Comerciales y Estructura de Precios (S/.)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                La presentación inicial se denomina <strong>PRINCIPAL</strong>. Puedes agregar múltiples presentaciones adicionales con su propia unidad de medida y precios.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddPresentacion}
              className="self-start sm:self-auto px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Agregar Presentación
            </button>
          </div>

          <div className="space-y-3">
            {presentaciones.map((pres, idx) => (
              <div
                key={idx}
                className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs font-mono">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200">
                      {pres.nombre}
                    </span>
                    {idx === 0 && (
                      <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold px-2 py-0.5 rounded-full">
                        Predeterminada
                      </span>
                    )}
                  </div>
                  {presentaciones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePresentacion(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors rounded-md"
                      title="Eliminar presentación"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Nombre Presentación *
                    </label>
                    <input
                      type="text"
                      required
                      value={pres.nombre}
                      onChange={(e) => handlePresentacionChange(idx, 'nombre', e.target.value.toUpperCase())}
                      placeholder="Ej. PRINCIPAL, CAJA X 12, BLISTER"
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white uppercase font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  
                  <SearchableSelect
                    label="Unidad de Medida"
                    options={opcionesUnidades}
                    value={pres.unidad_medida_id || formData.unidad_medida_id}
                    onChange={(val) => handlePresentacionChange(idx, 'unidad_medida_id', val)}
                    placeholder="Buscar unidad..."
                    allowEmpty={false}
                  />

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Código de Barras
                    </label>
                    <input
                      type="text"
                      value={pres.cod_barra || ''}
                      onChange={(e) => handlePresentacionChange(idx, 'cod_barra', e.target.value)}
                      placeholder="SKU específico"
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Multiplica por (Equiv.)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={pres.multiplica_por || 1}
                      onChange={(e) => handlePresentacionChange(idx, 'multiplica_por', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2 border-t border-slate-50 dark:border-slate-800">
                  <div>
                    <label className="block text-[10px] font-bold text-blue-700 dark:text-blue-400 mb-0.5">
                      Precio Costo *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pres.precio_costo}
                      onChange={(e) => handlePresentacionChange(idx, 'precio_costo', Number(e.target.value))}
                      className="w-full px-2.5 py-1 bg-blue-50/50 dark:bg-blue-900/30 border-2 border-blue-400 dark:border-blue-500 rounded-lg text-xs dark:text-white font-bold font-mono focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-blue-700 dark:text-blue-400 mb-0.5">
                      Precio Venta *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={pres.precio_venta}
                      onChange={(e) => handlePresentacionChange(idx, 'precio_venta', Number(e.target.value))}
                      className="w-full px-2.5 py-1 bg-blue-50/50 dark:bg-blue-900/30 border-2 border-blue-400 dark:border-blue-500 rounded-lg text-xs dark:text-white font-bold font-mono focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">Precio x Mayor</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pres.precio_mayor}
                      onChange={(e) => handlePresentacionChange(idx, 'precio_mayor', Number(e.target.value))}
                      className="w-full px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">Precio Especial</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pres.precio_especial}
                      onChange={(e) => handlePresentacionChange(idx, 'precio_especial', Number(e.target.value))}
                      className="w-full px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white font-mono"
                    />
                  </div>
                  <div className="flex items-center pt-3 pl-2">
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pres.activo}
                        onChange={(e) => handlePresentacionChange(idx, 'activo', e.target.checked)}
                        className="w-3.5 h-3.5 text-blue-600 rounded"
                      />
                      Presentación Habilitada
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECCIÓN 2: CATEGORÍAS, CLASIFICACIÓN Y PARÁMETROS SUNAT CON SELECTORES BUSCABLES */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            3. Categorización y Parámetros Fiscales SUNAT
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <SearchableSelect
              label="Categoría"
              options={opcionesCategorias}
              value={formData.categoria_id}
              onChange={(val) => handleSelectField('categoria_id', val)}
              placeholder="Buscar categoría..."
              emptyOptionLabel="-- Sin Categoría --"
            />

            <SearchableSelect
              label="Subcategoría"
              options={opcionesSubcategorias}
              value={formData.sub_categoria_id}
              onChange={(val) => handleSelectField('sub_categoria_id', val)}
              placeholder="Buscar subcategoría..."
              emptyOptionLabel="-- Sin Subcategoría --"
            />

            <SearchableSelect
              label="Unidad de Medida Base"
              options={opcionesUnidades}
              value={formData.unidad_medida_id}
              onChange={(val) => handleSelectField('unidad_medida_id', val)}
              placeholder="Buscar unidad..."
              allowEmpty={false}
            />

            <SearchableSelect
              label="Tipo de Existencia"
              options={opcionesExistencias}
              value={formData.tipo_existencia_id}
              onChange={(val) => handleSelectField('tipo_existencia_id', val)}
              placeholder="Buscar tipo existencia..."
              emptyOptionLabel="-- Por Defecto (Mercaderías) --"
            />

            <SearchableSelect
              label="Afectación al IGV"
              options={opcionesAfectaciones}
              value={formData.tipo_tributo_id}
              onChange={(val) => handleSelectField('tipo_tributo_id', val)}
              placeholder="Buscar afectación..."
              emptyOptionLabel="10 - Gravado - Operación Onerosa"
            />

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Código SUNAT / UNSPSC
              </label>
              <input
                type="text"
                name="codigo_sunat"
                value={formData.codigo_sunat}
                onChange={handleChange}
                placeholder="Ej. 50192701"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: PARÁMETROS OPERATIVOS Y FLAGS */}
        <div className="space-y-3">
          {/* <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            4. Parámetros Operativos
          </h3> */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                name="es_facturable"
                checked={formData.es_facturable}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              Facturable (FE)
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                name="es_vendible"
                checked={formData.es_vendible}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              Vendible en POS
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                name="es_producido"
                checked={formData.es_producido}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              Es Producido
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                name="es_combo"
                checked={formData.es_combo}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              Es Combo / Pack
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                name="es_insumo"
                checked={formData.es_insumo}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              Es Insumo
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              Producto Activo
            </label>
          </div>
        </div>

      </form>
    </Modal>
  )
}
