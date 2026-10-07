import { useEffect, useState } from 'react'
import Modal from '../../../components/ui/Modal.jsx'
import { empresaController } from '../controllers/empresa.js'
import { useAuthStore } from '../../../store/useAuthStore'

export default function RolModal({ isOpen, onClose, onSave, rol }) {
  const { user } = useAuthStore()
  const [empresas, setEmpresas] = useState([])
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    nivel: 100,
    es_sistema: false,
    activo: true,
    empresa_id: ''
  })

  useEffect(() => {
    if (isOpen) {
      if (user?.es_super_admin) {
        empresaController.getAll().then(res => {
          if (res.success) setEmpresas(res.data)
        })
      }
    }
  }, [isOpen, user])

  useEffect(() => {
    if (rol) {
      setFormData({
        nombre: rol.nombre || '',
        descripcion: rol.descripcion || '',
        nivel: rol.nivel ?? 100,
        es_sistema: rol.es_sistema ?? false,
        activo: rol.activo ?? true,
        empresa_id: rol.empresa_id || ''
      })
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        nivel: 100,
        es_sistema: false,
        activo: true,
        empresa_id: user?.empresa_id || ''
      })
    }
  }, [rol, isOpen, user])

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
    onSave(formData)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={rol ? 'Editar Rol' : 'Nuevo Rol'}
      confirmButtonId="rol-form"
      maxWidth="max-w-lg"
    >
      <form id="rol-form" onSubmit={handleSubmit} className="space-y-4">
        
        {user?.es_super_admin && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Empresa *</label>
            <select required name="empresa_id" value={formData.empresa_id} onChange={handleChange} className="input-field">
              <option value="">-- Seleccione Empresa --</option>
              {empresas.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.razon_social}</option>
              ))}
            </select>
          </div>
        )}

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
    </Modal>
  )
}
