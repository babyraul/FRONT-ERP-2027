import { useEffect, useState } from 'react'
import Modal from '../../../components/ui/Modal.jsx'
import { useAuthStore } from '../../../store/useAuthStore'
import { empresaController } from '../controllers/empresa.js'
import { sucursalController } from '../controllers/sucursal.js'
import { rolController } from '../controllers/rol.js'

export default function UsuarioModal({ isOpen, onClose, onSave, usuario }) {
  const { user } = useAuthStore()
  const [formData, setFormData] = useState({
    nombre: '',
    usuario: '',
    password: '',
    activo: true,
    es_super_admin: false,
    telefono: '',
    empresa_id: '',
    branch_id: '',
    rol_id: ''
  })

  const [empresas, setEmpresas] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [roles, setRoles] = useState([])

  useEffect(() => {
    if (isOpen && !usuario) {
      // Fetch empresas for all (if not super admin, we just get their own empresa from the backend via the same endpoint)
      Promise.all([
        empresaController.getAll(),
        sucursalController.getAll(),
        rolController.getAll()
      ]).then(([resEmp, resSuc, resRol]) => {
        if (resEmp.success) {
          setEmpresas(resEmp.data)
          // Fallback en caso el state no tenga active_acceso, seteamos la primera empresa devuelta
          if (!user?.es_super_admin && resEmp.data.length > 0) {
            setFormData(prev => ({ ...prev, empresa_id: resEmp.data[0].id }))
          }
        }
        if (resSuc.success) setSucursales(resSuc.data)
        if (resRol.success) setRoles(resRol.data)
      })
    }
  }, [isOpen, usuario, user])

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
        telefono: '',
        empresa_id: user?.active_acceso?.empresa_id || '',
        branch_id: user?.active_acceso?.branch_id || '',
        rol_id: ''
      })
    }
  }, [usuario, isOpen, user])

  const availableBranches = sucursales.filter(s => s.empresa_id === formData.empresa_id)

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'empresa_id' ? { branch_id: '' } : {})
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

        {!usuario && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 space-y-4">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Acceso Inicial</h4>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Empresa *</label>
              <select required name="empresa_id" value={formData.empresa_id} onChange={handleChange} disabled={!user?.es_super_admin} className="input-field py-1.5 text-sm disabled:bg-slate-100 disabled:text-slate-500">
                <option value="">-- Seleccionar --</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.razon_social}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Sucursal *</label>
                <select required name="branch_id" value={formData.branch_id} onChange={handleChange} disabled={!formData.empresa_id} className="input-field py-1.5 text-sm">
                  <option value="">-- Seleccionar --</option>
                  {availableBranches.map(s => <option key={s.id} value={s.id}>{s.sucursal_nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Rol *</label>
                <select required name="rol_id" value={formData.rol_id} onChange={handleChange} className="input-field py-1.5 text-sm">
                  <option value="">-- Seleccionar --</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Usuario *</label>
            <input required type="text" name="usuario" value={formData.usuario} onChange={handleChange} className="input-field" placeholder="Ej: jperez" />
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
          {user?.es_super_admin && (
            <div className="flex items-center">
              <input type="checkbox" id="super_admin_usr" name="es_super_admin" checked={formData.es_super_admin} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500" />
              <label htmlFor="super_admin_usr" className="ml-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Es Super Administrador</label>
            </div>
          )}
        </div>

      </form>
    </Modal>
  )
}
