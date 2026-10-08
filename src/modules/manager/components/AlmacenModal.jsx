import { useEffect, useState } from 'react'
import Modal from '../../../components/ui/Modal.jsx'

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={almacen ? 'Editar Almacén' : 'Nuevo Almacén'}
      confirmButtonId="almacen-form"
      maxWidth="max-w-lg"
    >
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
    </Modal>
  )
}
