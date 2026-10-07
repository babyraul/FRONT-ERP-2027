import { useEffect, useState } from 'react'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import api from '../../../utils/api'
import { toast } from '../../../utils/toast'

export default function EmpresaModal({ isOpen, onClose, onSave, empresa }) {
  const [formData, setFormData] = useState({
    ruc: '',
    razon_social: '',
    nombre_comercial: '',
    direccion: '',
    ubigeo: '',
    telefono1: '',
    email1: '',
    activo: true
  })
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (empresa) {
      setFormData({
        ruc: empresa.ruc || '',
        razon_social: empresa.razon_social || '',
        nombre_comercial: empresa.nombre_comercial || '',
        direccion: empresa.direccion || '',
        ubigeo: empresa.ubigeo || '',
        telefono1: empresa.telefono1 || '',
        email1: empresa.email1 || '',
        activo: empresa.activo ?? true
      })
    } else {
      setFormData({ ruc: '', razon_social: '', nombre_comercial: '', direccion: '', ubigeo: '', telefono1: '', email1: '', activo: true })
    }
  }, [empresa, isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSearchRuc = async () => {
    if (!formData.ruc || formData.ruc.length !== 11) {
      toast.error('Ingrese un RUC válido de 11 dígitos')
      return
    }

    setIsSearching(true)
    try {
      const response = await api.get(`/utils/consulta-documento/RUC/${formData.ruc}`)
      const data = response.data

      if (data && !data.error) {
        setFormData(prev => ({
          ...prev,
          razon_social: data.name || data.razonSocial || prev.razon_social,
          nombre_comercial: data.name || data.nombreComercial || prev.nombre_comercial,
          direccion: data.address || data.direccion || prev.direccion,
          ubigeo: data.ubigeo || prev.ubigeo,
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
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            {empresa ? 'Editar Empresa' : 'Nueva Empresa'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30 dark:bg-slate-900/30">
          {!empresa && (
            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl text-sm border border-blue-100 dark:border-blue-900/50 shadow-sm">
              <strong className="block mb-1">Información importante</strong>
              Al registrar una nueva empresa, el sistema creará automáticamente la <strong>Sede Principal</strong> y el <strong>Almacén Principal</strong> asociados a esta dirección inicial.
            </div>
          )}

          <form id="empresa-form" onSubmit={handleSubmit} className="space-y-6">

            {/* Sección: Identificación */}
            <div className="">
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">RUC *</label>
                  <div className="flex gap-2">
                    <input required type="text" name="ruc" maxLength="11" value={formData.ruc} onChange={handleChange} className="input-field flex-1 font-mono" placeholder="11 dígitos" />
                    <button
                      type="button"
                      onClick={handleSearchRuc}
                      disabled={isSearching}
                      className="btn-primary px-4 flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                    >
                      <MagnifyingGlassIcon className="h-4 w-4" />
                      {isSearching ? '...' : 'Buscar SUNAT'}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Razón Social *</label>
                  <input required type="text" name="razon_social" value={formData.razon_social} onChange={handleChange} className="input-field" placeholder="Ej. INVERSIONES EJEMPLO S.A.C." />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre Comercial</label>
                  <input type="text" name="nombre_comercial" value={formData.nombre_comercial} onChange={handleChange} className="input-field" placeholder="Nombre comercial visible" />
                </div>
              </div>
            </div>

            {/* Sección: Ubicación */}
            <div className="">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Dirección</label>
                  <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className="input-field" placeholder="Av. Principal 123, Distrito" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Ubigeo</label>
                  <input type="text" name="ubigeo" maxLength="6" value={formData.ubigeo} onChange={handleChange} className="input-field font-mono" placeholder="150101" />
                </div>
              </div>
            </div>

            {/* Sección: Contacto */}
            <div className="">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Teléfono</label>
                  <input type="text" name="telefono1" value={formData.telefono1} onChange={handleChange} className="input-field" placeholder="999 999 999" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                  <input type="email" name="email1" value={formData.email1} onChange={handleChange} className="input-field" placeholder="contacto@empresa.com" />
                </div>

                <div className="md:col-span-2 flex items-center mt-2 pt-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="activo" checked={formData.activo} onChange={handleChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">Empresa Activa (Permite operaciones)</span>
                  </label>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            Cancelar
          </button>
          <button type="submit" form="empresa-form" className="btn-primary px-6">
            Guardar
          </button>
        </div>

      </div>
    </div>
  )
}
