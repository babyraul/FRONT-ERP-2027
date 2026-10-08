import { useEffect, useState } from 'react'
import Modal from '../../../components/ui/Modal.jsx'

export default function UsuarioModal({ isOpen, onClose, onSave, usuario }) {
  const [formData, setFormData] = useState({
    nombre: '',
    usuario: '',
    password: '',
    activo: true,
    es_super_admin: false,
    telefono: ''
  })

  useEffect(() => {
    if (usuario) {
      setFormData({
        nombre: usuario.nombre || '',
        usuario: usuario.usuario || '',
        password: '', // blank so we don't display the hash
        activo: usuario.activo ?? true,
        es_super_admin: usuario.es_super_admin ?? false,
        telefono: usuario.telefono || ''
      })
    } else {
      setFormData({
        nombre: '',
        usuario: '',
        password: '',
        activo: true,
        es_super_admin: false,
        telefono: ''
      })
    }
  }, [usuario, isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Si estamos editando y no se puso password, lo quitamos del payload
    const payload = { ...formData }
    if (usuario && !payload.password) {
      delete payload.password
    }
    onSave(payload)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={usuario ? 'Editar Usuario' : 'Nuevo Usuario'}
      confirmText="Guardar"
      cancelText="Cancelar"
      confirmButtonId="usuario-form"
      maxWidth="max-w-lg"
    >
      <form id="usuario-form" onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre Completo *</label>
          <input required type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="input-field" placeholder="Ej: Juan Pérez" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre de Usuario *</label>
            <input required type="text" name="usuario" value={formData.usuario} onChange={handleChange} className="input-field" placeholder="Ej: jperez" disabled={!!usuario} />
            {usuario && <p className="text-xs text-slate-500 mt-1">El identificador no puede cambiarse.</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono</label>
            <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="input-field" placeholder="Opcional" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contraseña {usuario ? '(Opcional)' : '*'}</label>
          <input type="password" name="password" required={!usuario} value={formData.password} onChange={handleChange} className="input-field" placeholder="******" />
        </div>

        <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center">
            <input type="checkbox" id="activo_usr" name="activo" checked={formData.activo} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            <label htmlFor="activo_usr" className="ml-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Usuario Activo en el Sistema</label>
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="super_admin_usr" name="es_super_admin" checked={formData.es_super_admin} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500" />
            <label htmlFor="super_admin_usr" className="ml-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Es Super Administrador</label>
          </div>
        </div>

      </form>
    </Modal>
  )
}
