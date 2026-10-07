import { useEffect, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function AlmacenModal({ isOpen, onClose, onSave, almacen }) {
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    codigo: '',
    es_principal: false,
    activo: true
  })

  useEffect(() => {
    if (almacen) {
      setFormData({
        nombre: almacen.nombre || '',
        direccion: almacen.direccion || '',
        codigo: almacen.codigo || '',
        es_principal: almacen.es_principal ?? false,
        activo: almacen.activo ?? true
      })
    } else {
      setFormData({
        nombre: '',
        direccion: '',
        codigo: '',
        es_principal: false,
        activo: true
      })
    }
  }, [almacen, isOpen])

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
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            {almacen ? 'Editar Almacén' : 'Nuevo Almacén'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30 dark:bg-slate-900/30">
          <form id="almacen-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre del Almacén *</label>
              <input required type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="input-field" placeholder="Almacén Principal" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Código</label>
              <input type="text" name="codigo" value={formData.codigo} onChange={handleChange} className="input-field" placeholder="ALM01" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Dirección</label>
              <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className="input-field" placeholder="Av. Los Almacenes 123" />
            </div>

            <div className="flex items-center gap-4 mt-2 pt-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="es_principal" checked={formData.es_principal} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">Es Principal</span>
              </label>

              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="activo" checked={formData.activo} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">Activo</span>
              </label>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            Cancelar
          </button>
          <button type="submit" form="almacen-form" className="btn-primary px-6">
            Guardar
          </button>
        </div>

      </div>
    </div>
  )
}
