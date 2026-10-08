import { useEffect, useState, useCallback } from 'react'
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import Modal from '../../../components/ui/Modal.jsx'
import { toast } from '../../../utils/toast.js'
import { usuarioController } from '../controllers/usuario.js'
import { empresaController } from '../controllers/empresa.js'
import { sucursalController } from '../controllers/sucursal.js'
import { rolController } from '../controllers/rol.js'

export default function UsuarioAccesosModal({ isOpen, onClose, user }) {
  const [accesos, setAccesos] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Catalogs
  const [empresas, setEmpresas] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [roles, setRoles] = useState([])

  // Form State
  const [formData, setFormData] = useState({
    empresa_id: '',
    branch_id: '',
    rol_id: '',
    es_predeterminado: false,
    activo: true
  })

  const loadAccesos = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const res = await usuarioController.getAccesos(user.id)
    if (res.success) {
      setAccesos(res.data)
    }
    setLoading(false)
  }, [user])

  const loadCatalogs = async () => {
    const [resEmpresas, resSucursales, resRoles] = await Promise.all([
      empresaController.getAll(),
      sucursalController.getAll(),
      rolController.getAll()
    ])
    if (resEmpresas.success) setEmpresas(resEmpresas.data)
    if (resSucursales.success) setSucursales(resSucursales.data)
    if (resRoles.success) setRoles(resRoles.data)
  }

  useEffect(() => {
    if (isOpen && user) {
      loadAccesos()
      loadCatalogs()
      setShowForm(false)
      setFormData({ empresa_id: '', branch_id: '', rol_id: '', es_predeterminado: false, activo: true })
    }
  }, [isOpen, user, loadAccesos])

  if (!isOpen || !user) return null

  // Derived filtered branches based on selected company
  const availableBranches = sucursales.filter(s => s.empresa_id === formData.empresa_id)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'empresa_id' ? { branch_id: '' } : {}) // reset branch if company changes
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.empresa_id || !formData.branch_id || !formData.rol_id) {
      return toast.warning('Advertencia', 'Debes seleccionar Empresa, Sucursal y Rol.')
    }
    
    const res = await usuarioController.addAcceso(user.id, formData)
    if (res.success) {
      toast.success('Guardado', 'Acceso agregado correctamente.')
      setShowForm(false)
      setFormData({ empresa_id: '', branch_id: '', rol_id: '', es_predeterminado: false, activo: true })
      loadAccesos()
    } else {
      toast.error('Error', res.message)
    }
  }

  const handleToggleDefault = async (acceso) => {
    const res = await usuarioController.updateAcceso(user.id, acceso.id, { es_predeterminado: true })
    if (res.success) {
      toast.success('Actualizado', 'Se cambió la sucursal predeterminada.')
      loadAccesos()
    } else {
      toast.error('Error', res.message)
    }
  }

  const handleRemove = async (accesoId) => {
    if (!confirm('¿Quitar este acceso al usuario?')) return
    const res = await usuarioController.deleteAcceso(user.id, accesoId)
    if (res.success) {
      toast.success('Eliminado', 'El acceso ha sido revocado.')
      loadAccesos()
    } else {
      toast.error('Error', res.message)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestionar Accesos"
      subtitle={`Usuario: ${user.nombre} (${user.usuario})`}
      maxWidth="max-w-4xl"
      showFooter={false}
      noPadding={true}
    >
      <div className="flex-1 overflow-hidden flex flex-col sm:flex-row">
        
        {/* List of accesses */}
        <div className={`flex-1 p-6 overflow-y-auto border-r border-slate-200 dark:border-slate-800 ${showForm ? 'hidden sm:block' : 'block'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-slate-800 dark:text-white">Accesos Actuales</h3>
            <button 
              onClick={() => setShowForm(true)} 
              className="btn-primary py-1.5 text-xs sm:hidden"
            >
              <PlusIcon className="h-4 w-4" /> Nuevo
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-10 text-slate-500">Cargando...</div>
          ) : accesos.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-slate-500 text-sm">Este usuario no tiene accesos asignados.</p>
              <p className="text-slate-400 text-xs mt-1">No podrá entrar a ninguna sucursal.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accesos.map(acc => (
                <div key={acc.id} className={`p-4 rounded-xl border ${acc.es_predeterminado ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{acc.sucursal_nombre}</span>
                        {acc.es_predeterminado && (
                          <span className="badge-blue text-[10px] px-1.5">Default</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                        <p>Empresa: <span className="font-medium">{acc.empresa_nombre}</span></p>
                        <p>Rol Base: <span className="font-medium">{acc.rol_nombre}</span></p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <button onClick={() => handleRemove(acc.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar acceso">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                      {!acc.es_predeterminado && (
                        <button onClick={() => handleToggleDefault(acc)} className="text-xs text-blue-600 hover:underline">
                          Hacer Default
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form to add new access */}
        <div className={`w-full sm:w-80 bg-slate-50 dark:bg-slate-800/30 p-6 overflow-y-auto flex-shrink-0 ${!showForm ? 'hidden sm:block' : 'block'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-slate-800 dark:text-white">Asignar Nuevo Acceso</h3>
            {showForm && (
              <button onClick={() => setShowForm(false)} className="text-slate-400 sm:hidden">
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Empresa</label>
              <select required name="empresa_id" value={formData.empresa_id} onChange={handleChange} className="input-field text-sm py-2">
                <option value="">Seleccionar...</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.razon_social}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Sucursal</label>
              <select required name="branch_id" value={formData.branch_id} onChange={handleChange} className="input-field text-sm py-2" disabled={!formData.empresa_id}>
                <option value="">Seleccionar...</option>
                {availableBranches.map(s => <option key={s.id} value={s.id}>{s.nombre_comercial}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Rol</label>
              <select required name="rol_id" value={formData.rol_id} onChange={handleChange} className="input-field text-sm py-2">
                <option value="">Seleccionar...</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>

            <div className="flex items-center pt-2">
              <input type="checkbox" id="es_predeterminado" name="es_predeterminado" checked={formData.es_predeterminado} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <label htmlFor="es_predeterminado" className="ml-2 block text-xs font-medium text-slate-700 dark:text-slate-300">Convertir en predeterminado</label>
            </div>

            <button type="submit" className="btn-primary w-full mt-4">
              Asignar Acceso
            </button>
          </form>
        </div>

      </div>
    </Modal>
  )
}
