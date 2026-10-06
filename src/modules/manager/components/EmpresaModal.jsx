import { useEffect, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function EmpresaModal({ isOpen, onClose, onSave, empresa }) {
  const [formData, setFormData] = useState({
    ruc: '',
    razon_social: '',
    nombre_comercial: '',
    direccion: '',
    telefono1: '',
    email1: '',
    activo: true
  })

  useEffect(() => {
    if (empresa) {
      setFormData({
        ruc: empresa.ruc || '',
        razon_social: empresa.razon_social || '',
        nombre_comercial: empresa.nombre_comercial || '',
        direccion: empresa.direccion || '',
        telefono1: empresa.telefono1 || '',
        email1: empresa.email1 || '',
        activo: empresa.activo ?? true
      })
    } else {
      setFormData({ ruc: '', razon_social: '', nombre_comercial: '', direccion: '', telefono1: '', email1: '', activo: true })
    }
  }, [empresa, isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            {empresa ? 'Editar Empresa' : 'Nueva Empresa'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <form id="empresa-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">RUC *</label>
                <input required type="text" name="ruc" maxLength="11" value={formData.ruc} onChange={handleChange} className="input-field" placeholder="11 dígitos" />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Razón Social *</label>
                <input required type="text" name="razon_social" value={formData.razon_social} onChange={handleChange} className="input-field" placeholder="Razón Social S.A.C." />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre Comercial</label>
                <input type="text" name="nombre_comercial" value={formData.nombre_comercial} onChange={handleChange} className="input-field" placeholder="Nombre Comercial" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dirección</label>
                <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className="input-field" placeholder="Av. Principal 123" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono</label>
                <input type="text" name="telefono1" value={formData.telefono1} onChange={handleChange} className="input-field" placeholder="999 999 999" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input type="email" name="email1" value={formData.email1} onChange={handleChange} className="input-field" placeholder="contacto@empresa.com" />
              </div>

              <div className="md:col-span-2 flex items-center mt-2">
                <input type="checkbox" id="activo" name="activo" checked={formData.activo} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="activo" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">Empresa Activa</label>
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
