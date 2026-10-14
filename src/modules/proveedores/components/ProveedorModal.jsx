import { useEffect, useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Modal from '../../../components/ui/Modal.jsx'
import api from '../../../utils/api'
import { toast } from '../../../utils/toast'

export default function ProveedorModal({ isOpen, onClose, onSave, proveedor, isProcessing }) {
  const [formData, setFormData] = useState({
    ruc: '',
    razon_social: '',
    nombre_comercial: '',
    direccion: '',
    ubigeo: '',
    telefono: '',
    email: '',
    persona_contacto: '',
    es_mercaderia: false,
    es_servicio: false,
    es_activo: false,
    es_comisiones: false,
    activo: true
  })
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (proveedor) {
      setFormData({
        ruc: proveedor.ruc || '',
        razon_social: proveedor.razon_social || '',
        nombre_comercial: proveedor.nombre_comercial || '',
        direccion: proveedor.direccion || '',
        ubigeo: proveedor.ubigeo || '',
        telefono: proveedor.telefono || '',
        email: proveedor.email || '',
        persona_contacto: proveedor.persona_contacto || '',
        es_mercaderia: proveedor.es_mercaderia ?? false,
        es_servicio: proveedor.es_servicio ?? false,
        es_activo: proveedor.es_activo ?? false,
        es_comisiones: proveedor.es_comisiones ?? false,
        activo: proveedor.activo ?? true
      })
    } else {
      setFormData({
        ruc: '',
        razon_social: '',
        nombre_comercial: '',
        direccion: '',
        ubigeo: '',
        telefono: '',
        email: '',
        persona_contacto: '',
        es_mercaderia: false,
        es_servicio: false,
        es_activo: false,
        es_comisiones: false,
        activo: true
      })
    }
  }, [proveedor, isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSearchRuc = async () => {
    const rucClean = formData.ruc?.trim()
    if (!rucClean || rucClean.length !== 11) {
      toast.error('Ingrese un RUC válido de 11 dígitos')
      return
    }

    setIsSearching(true)
    try {
      const response = await api.get(`/utils/consulta-documento/RUC/${rucClean}`)
      const data = response.data

      if (data && !data.error) {
        setFormData(prev => ({
          ...prev,
          razon_social: data.name || data.razonSocial || prev.razon_social,
          nombre_comercial: data.nombreComercial || data.name || prev.nombre_comercial,
          direccion: data.address || data.direccion || prev.direccion,
          ubigeo: data.ubigeo || prev.ubigeo
        }))
        toast.success('Datos de SUNAT obtenidos correctamente')
      } else {
        toast.error('No se encontraron datos para este RUC')
      }
    } catch (error) {
      toast.error('Error al consultar RUC en SUNAT')
      console.error(error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.ruc || formData.ruc.trim().length !== 11) {
      toast.error('El RUC debe tener 11 dígitos')
      return
    }
    if (!formData.razon_social || formData.razon_social.trim() === '') {
      toast.error('La razón social es obligatoria')
      return
    }
    onSave(formData)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={proveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      subtitle={proveedor ? 'Modifique los datos comerciales y de contacto del proveedor' : 'Complete el formulario para registrar un nuevo proveedor'}
      confirmButtonId="proveedor-form"
      confirmText={proveedor ? 'Actualizar' : 'Guardar'}
      isProcessing={isProcessing}
      maxWidth="max-w-2xl"
    >
      <form id="proveedor-form" onSubmit={handleSubmit} className="space-y-5">
        
        {/* Identificación y RUC */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Datos Principales
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                RUC <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-1.5">
                <input
                  required
                  type="text"
                  name="ruc"
                  maxLength="11"
                  value={formData.ruc}
                  onChange={handleChange}
                  placeholder="20XXXXXXXXX"
                  className="input-field flex-1 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={handleSearchRuc}
                  disabled={isSearching}
                  className="btn-secondary px-3 flex items-center justify-center shrink-0 disabled:opacity-50"
                  title="Consultar en SUNAT"
                >
                  <MagnifyingGlassIcon className={`h-4 w-4 ${isSearching ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Razón Social <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                name="razon_social"
                value={formData.razon_social}
                onChange={handleChange}
                placeholder="Nombre o Razón Social completa"
                className="input-field text-sm"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nombre Comercial
              </label>
              <input
                type="text"
                name="nombre_comercial"
                value={formData.nombre_comercial}
                onChange={handleChange}
                placeholder="Nombre comercial visible / Marca"
                className="input-field text-sm"
              />
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Ubicación Fiscal
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Dirección Fiscal
              </label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                placeholder="Av. / Jr. / Calle y número"
                className="input-field text-sm"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ubigeo
              </label>
              <input
                type="text"
                name="ubigeo"
                maxLength="6"
                value={formData.ubigeo}
                onChange={handleChange}
                placeholder="150101"
                className="input-field font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Contacto Comercial
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Teléfono / Celular
              </label>
              <input
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="999 999 999"
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ventas@proveedor.com"
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Persona de Contacto
              </label>
              <input
                type="text"
                name="persona_contacto"
                value={formData.persona_contacto}
                onChange={handleChange}
                placeholder="Ej. Juan Pérez"
                className="input-field text-sm"
              />
            </div>
          </div>
        </div>

        {/* Clasificación de Compras */}
        <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Clasificación de Operaciones
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/80">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                name="es_mercaderia"
                checked={formData.es_mercaderia}
                onChange={handleChange}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-700"
              />
              <span>Mercadería</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                name="es_servicio"
                checked={formData.es_servicio}
                onChange={handleChange}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-700"
              />
              <span>Servicio</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                name="es_activo"
                checked={formData.es_activo}
                onChange={handleChange}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-700"
              />
              <span>Activo Fijo</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                name="es_comisiones"
                checked={formData.es_comisiones}
                onChange={handleChange}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-700"
              />
              <span>Comisiones</span>
            </label>
          </div>
        </div>

        {/* Estado */}
        <div className="pt-2 flex items-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="activo"
              checked={formData.activo}
              onChange={handleChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
              Proveedor Activo (Permite compras y órdenes)
            </span>
          </label>
        </div>

      </form>
    </Modal>
  )
}
