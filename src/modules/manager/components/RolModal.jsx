import { useEffect, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function RolModal({ isOpen, onClose, onSave, rol }) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    nivel: 100,
    es_sistema: false,
    activo: true
  })

  useEffect(() => {
    if (rol) {
      setFormData({
        nombre: rol.nombre || '',
        descripcion: rol.descripcion || '',
        nivel: rol.nivel ?? 100,
        es_sistema: rol.es_sistema ?? false,
        activo: rol.activo ?? true
      })
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        nivel: 100,
        es_sistema: false,
        activo: true
      })
    }
  }, [rol, isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    let finalValue = type === 'checkbox' ? checked : type === 'number' ? Number(value) : value;
    
    // Forzar el nombre del rol a mayúsculas
    if (name === 'nombre' && typeof finalValue === 'string') {
      finalValue = finalValue.toUpperCase();
    }

    setFormData(prev => ({ 
      ...prev, 
      [name]: finalValue 
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Si la empresa viene global o default, podríamos hardcodear empresa_id para pruebas si es necesario.
    // El backend probablemente asuma la empresa_id del token, o debe enviarse
    // Omitimos validaciones exhaustivas por brevedad
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            {rol ? 'Editar Rol' : 'Nuevo Rol'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30 dark:bg-slate-900/30">
          <form id="rol-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre del Rol *</label>
              <input required type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="input-field" placeholder="EJ. ADMINISTRADOR" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Descripción</label>
              <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} className="input-field min-h-[80px]" placeholder="Breve descripción del rol..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nivel de Acceso (Numérico)</label>
              <input type="number" name="nivel" value={formData.nivel} onChange={handleChange} className="input-field" placeholder="100" />
              <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                <strong>Guía de niveles:</strong> El nivel <strong>1</strong> representa la jerarquía más alta (máximos permisos), mientras que el nivel <strong>100</strong> o superior representa la jerarquía más baja (usuarios básicos).
              </p>
            </div>

            <div className="flex items-center gap-4 mt-2 pt-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="es_sistema" checked={formData.es_sistema} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">Es de Sistema</span>
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
          <button type="submit" form="rol-form" className="btn-primary px-6">
            Guardar
          </button>
        </div>

      </div>
    </div>
  )
}
