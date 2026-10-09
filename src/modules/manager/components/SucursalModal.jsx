import { useEffect, useState } from 'react'
import Modal from '../../../components/ui/Modal.jsx'
import { empresaController } from '../controllers/empresa.js'

export default function SucursalModal({ isOpen, onClose, onSave, sucursal }) {
  const [empresas, setEmpresas] = useState([])

  const [formData, setFormData] = useState({
    empresa_id: '',
    ruc: '',
    razon_social: '',
    nombre_comercial: '',
    sucursal_nombre: '',
    direccion: '',
    codigo_anexo: '0000',
    ubigeo: '',
    telefono1: '',
    email1: '',
    activo: true
  })

  // Cargar empresas para el select
  useEffect(() => {
    if (isOpen) {
      empresaController.getAll().then(res => {
        if (res.success) setEmpresas(res.data)
      })
    }
  }, [isOpen])

  useEffect(() => {
    if (sucursal) {
      setFormData({
        empresa_id: sucursal.empresa_id || '',
        ruc: sucursal.ruc || '',
        razon_social: sucursal.razon_social || '',
        nombre_comercial: sucursal.nombre_comercial || '',
        sucursal_nombre: sucursal.sucursal_nombre || '',
        direccion: sucursal.direccion || '',
        codigo_anexo: sucursal.codigo_anexo || '0000',
        ubigeo: sucursal.ubigeo || '',
        telefono1: sucursal.telefono1 || '',
        email1: sucursal.email1 || '',
        activo: sucursal.activo ?? true
      })
    } else {
      setFormData({
        empresa_id: '', ruc: '', razon_social: '', nombre_comercial: '',
        sucursal_nombre: '', direccion: '', codigo_anexo: '0000', ubigeo: '',
        telefono1: '', email1: '', activo: true
      })
    }
  }, [sucursal, isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    if (name === 'empresa_id') {
      const selectedEmpresa = empresas.find(emp => String(emp.id) === String(value))
      if (selectedEmpresa) {
        setFormData(prev => ({
          ...prev,
          empresa_id: value,
          ruc: selectedEmpresa.ruc || '',
          razon_social: selectedEmpresa.razon_social || '',
          nombre_comercial: selectedEmpresa.nombre_comercial || ''
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          empresa_id: value,
          ruc: '',
          razon_social: '',
          nombre_comercial: ''
        }))
      }
      return
    }

    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={sucursal ? 'Editar Sucursal' : 'Nueva Sucursal'}
      confirmButtonId="sucursal-form"
      maxWidth="max-w-3xl"
    >
      <form id="sucursal-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Empresa Principal *</label>
            <select required name="empresa_id" value={formData.empresa_id} onChange={handleChange} className="input-field">
              <option value="">Seleccione una empresa...</option>
              {empresas.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.razon_social} (RUC: {emp.ruc})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre de Sucursal *</label>
            <input required type="text" name="sucursal_nombre" value={formData.sucursal_nombre} onChange={handleChange} className="input-field" placeholder="Sede Principal, Sede Norte..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Código Anexo (SUNAT)</label>
            <input type="text" name="codigo_anexo" maxLength="4" value={formData.codigo_anexo} onChange={handleChange} className="input-field" placeholder="0000" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Código Ubigeo</label>
            <input type="text" name="ubigeo" maxLength="6" value={formData.ubigeo} onChange={handleChange} className="input-field" placeholder="150101" />
          </div>



          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dirección *</label>
            <input required type="text" name="direccion" value={formData.direccion} onChange={handleChange} className="input-field" placeholder="Dirección de la sucursal" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono</label>
            <input type="text" name="telefono1" value={formData.telefono1} onChange={handleChange} className="input-field" placeholder="999 999 999" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input type="email" name="email1" value={formData.email1} onChange={handleChange} className="input-field" placeholder="sucursal@empresa.com" />
          </div>

          <div className="md:col-span-2 flex items-center mt-2">
            <input type="checkbox" id="activo_suc" name="activo" checked={formData.activo} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            <label htmlFor="activo_suc" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">Sucursal Activa</label>
          </div>
        </div>
      </form>
    </Modal>
  )
}
