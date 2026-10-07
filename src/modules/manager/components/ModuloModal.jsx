import { useEffect, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function ModuloModal({ isOpen, onClose, onSave, modulo, modulosList = [] }) {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    padre_id: '',
    ruta: '',
    tipo: 'MODULO',
    orden: 0,
    activo: true
  })

  useEffect(() => {
    if (modulo) {
      setFormData({
        codigo: modulo.codigo || '',
        nombre: modulo.nombre || '',
        descripcion: modulo.descripcion || '',
        padre_id: modulo.padre_id || '',
        ruta: modulo.ruta || '',
        tipo: modulo.tipo || 'MODULO',
        orden: modulo.orden || 0,
        activo: modulo.activo ?? true
      })
    } else {
      setFormData({
        codigo: '', nombre: '', descripcion: '', padre_id: '', ruta: '', tipo: 'MODULO', orden: 0, activo: true 
      })
    }
  }, [modulo, isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => {
      let newValue = type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
      
      if (typeof newValue === 'string' && (name === 'codigo' || name === 'nombre')) {
        newValue = newValue.toUpperCase()
      }

      const newData = { ...prev, [name]: newValue }

      // Regla: Si tiene padre, debe ser MENU. Si no tiene, debe ser MODULO.
      if (name === 'padre_id') {
        if (newValue !== '') {
          newData.tipo = 'MENU'
        } else {
          newData.tipo = 'MODULO'
        }
      }

      // Regla: Si cambia manualmente el tipo a MODULO, no puede tener padre
      if (name === 'tipo') {
        if (newValue === 'MODULO') {
          newData.padre_id = ''
        }
      }

      return newData
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Transform empty string to null for padre_id
    const payload = { 
      ...formData, 
      padre_id: formData.padre_id || null,
      codigo: formData.codigo.toUpperCase(),
      nombre: formData.nombre.toUpperCase()
    }
    onSave(payload)
  }

  // Prevent selecting itself or its children as parent
  // Only modulos of type MODULO can be parents
  // Sort by creation date (newest first)
  const availableParents = modulosList
    .filter(m => m.id !== modulo?.id && m.tipo === 'MODULO')
    .sort((a, b) => {
      if (a.created_at && b.created_at) {
        return new Date(b.created_at) - new Date(a.created_at)
      }
      return 0
    })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            {modulo ? 'Editar Módulo' : 'Nuevo Módulo'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <form id="modulo-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Código Único *</label>
                <input required type="text" name="codigo" value={formData.codigo} onChange={handleChange} className="input-field uppercase" placeholder="EJ: VENTAS, COMPRAS" disabled={!!modulo} />
                {modulo && <p className="text-xs text-slate-500 mt-1">El código no puede modificarse.</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo *</label>
                <select required name="tipo" value={formData.tipo} onChange={handleChange} className="input-field" disabled={!!formData.padre_id}>
                  <option value="MODULO">MODULO RAÍZ / SECCIÓN</option>
                  <option value="MENU">MENÚ / ACCESO</option>
                </select>
                {!!formData.padre_id && <p className="text-xs text-slate-500 mt-1">Hijos deben ser de tipo Menú.</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre del Módulo *</label>
              <input required type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="input-field" placeholder="Ej: Gestión de Ventas" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Módulo Padre</label>
              <select name="padre_id" value={formData.padre_id || ''} onChange={handleChange} className="input-field">
                <option value="">-- Sin Módulo Padre (Raíz) --</option>
                {availableParents.map(m => (
                  <option key={m.id} value={m.id}>{m.codigo} - {m.nombre}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ruta (Navegación)</label>
                <input type="text" name="ruta" value={formData.ruta} onChange={handleChange} className="input-field" placeholder="Ej: /ventas/pedidos" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Orden *</label>
                <input required type="number" name="orden" value={formData.orden} onChange={handleChange} className="input-field" min="0" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
              <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} className="input-field" placeholder="Descripción breve del módulo..." rows="2"></textarea>
            </div>

            <div className="flex items-center mt-2">
              <input type="checkbox" id="activo_mod" name="activo" checked={formData.activo} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <label htmlFor="activo_mod" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">Módulo Activo</label>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            Cancelar
          </button>
          <button type="submit" form="modulo-form" className="btn-primary px-6">
            Guardar
          </button>
        </div>

      </div>
    </div>
  )
}
