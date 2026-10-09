import { useState, useEffect } from 'react'
import Modal from '../../../components/ui/Modal.jsx'
import { cajaController } from '../controllers/caja.js'
import { useAuthStore } from '../../../store/useAuthStore.js'

export default function CajaModal({ isOpen, onClose, caja, onSave }) {
  const [loading, setLoading] = useState(false)
  const [documentos, setDocumentos] = useState([])
  
  const [formData, setFormData] = useState({
    identificador_caja: '',
    nombre: '',
    tipo_caja: 'ADMINISTRATIVA',
    activo: true
  })

  const { user } = useAuthStore()
  const branchId = user?.active_acceso?.branch_id

  useEffect(() => {
    if (caja) {
      setFormData({
        identificador_caja: caja.identificador_caja || '',
        nombre: caja.nombre || '',
        tipo_caja: caja.tipo_caja || 'ADMINISTRATIVA',
        activo: caja.activo ?? true
      })
    } else {
      setFormData({
        identificador_caja: '',
        nombre: '',
        tipo_caja: 'ADMINISTRATIVA',
        activo: true
      })
    }
  }, [caja, isOpen])

  useEffect(() => {
    const fetchTipos = async () => {
      const res = await cajaController.getTiposComprobante()
      if (res.success && res.data.length > 0) {
        setDocumentos(res.data.map(t => ({
          ...t,
          habilitado: caja ? caja.tipo_comprobante_id === t.id : false,
          serie: caja && caja.tipo_comprobante_id === t.id ? caja.serie : '',
          correlativo: caja && caja.tipo_comprobante_id === t.id ? caja.correlativo : 0
        })))
      }
    }
    if (isOpen) {
      fetchTipos()
    }
  }, [isOpen, caja])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const updateDoc = (index, field, value) => {
    setDocumentos(prev => {
      const newDocs = [...prev]
      newDocs[index] = { ...newDocs[index], [field]: value }
      return newDocs
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!branchId) return alert('No hay sucursal activa seleccionada.')

    const docsToSave = documentos.filter(d => d.habilitado)
    if (docsToSave.length === 0) {
      return alert('Debe habilitar al menos un tipo de comprobante.')
    }

    // Validar que los habilitados tengan serie
    for (const d of docsToSave) {
      if (!d.serie || d.serie.trim() === '') {
        return alert(`Debe ingresar la serie para el documento: ${d.descripcion}`)
      }
    }

    setLoading(true)

    try {
      if (caja?.id) {
        // Modo Edición: Actualizamos solo el registro actual
        const doc = docsToSave[0] // En edición solo hay uno visible/habilitado
        const payload = {
          ...formData,
          serie: doc.serie.toUpperCase(),
          correlativo: doc.correlativo,
          tipo_comprobante_id: doc.id,
          branch_id: branchId,
          usuario_id: user?.id
        }
        const res = await cajaController.update(caja.id, payload)
        if (!res.success) throw new Error(res.error)
      } else {
        // Modo Creación: Creamos un registro por cada documento habilitado
        for (const doc of docsToSave) {
          const payload = {
            ...formData,
            serie: doc.serie.toUpperCase(),
            correlativo: doc.correlativo,
            tipo_comprobante_id: doc.id,
            branch_id: branchId,
            usuario_id: user?.id
          }
          const res = await cajaController.create(payload)
          if (!res.success) {
            console.error(res.error)
            // Podríamos detenernos o seguir, por ahora alertamos pero seguimos
            alert(`Error al guardar serie ${doc.serie}: ${res.error}`)
          }
        }
      }

      onSave()
      onClose()
    } catch (error) {
      console.error(error)
      alert(error.message || 'Ocurrió un error inesperado al guardar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={caja?.id ? 'Editar Caja / Serie' : 'Nueva Caja y Series'}
      maxWidth="max-w-2xl"
      showFooter={false}
    >
      <form id="cajaForm" onSubmit={handleSubmit} className="p-6 space-y-5">
        
        {/* Cabecera de la Caja */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Identificador</label>
            <input
              type="text"
              name="identificador_caja"
              value={formData.identificador_caja}
              onChange={handleChange}
              placeholder="Ej. CAJA-01"
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre Caja *</label>
            <input
              type="text"
              name="nombre"
              required
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej. Caja Principal"
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Caja</label>
            <select
              name="tipo_caja"
              value={formData.tipo_caja}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
            >
              <option value="ADMINISTRATIVA">Administrativa</option>
              <option value="PUNTO_VENTA">Punto de Venta</option>
              <option value="VIRTUAL">Virtual</option>
            </select>
          </div>
        </div>

        {/* Lista de Documentos y Series */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
            {caja?.id ? 'Documento a editar' : 'Selecciona los documentos y asigna sus series'}
          </label>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {documentos.length > 0 ? (
              documentos.map((doc, index) => {
                // En modo edición solo mostramos el documento que se está editando
                if (caja?.id && doc.id !== caja.tipo_comprobante_id) return null

                return (
                  <div 
                    key={doc.id} 
                    className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border transition-colors ${
                      doc.habilitado 
                        ? 'border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-800/50' 
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-[200px]">
                      {!caja?.id && (
                        <input
                          type="checkbox"
                          checked={doc.habilitado}
                          onChange={(e) => updateDoc(index, 'habilitado', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{doc.descripcion}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Código: {doc.id}</span>
                      </div>
                    </label>

                    {doc.habilitado && (
                      <div className="flex items-center gap-2 pl-7 sm:pl-0">
                        <div className="w-24">
                          <input
                            type="text"
                            placeholder="Serie"
                            value={doc.serie}
                            onChange={(e) => updateDoc(index, 'serie', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white uppercase"
                            required
                          />
                        </div>
                        <div className="w-28">
                          <input
                            type="number"
                            placeholder="Correlativo"
                            value={doc.correlativo}
                            min="0"
                            onChange={(e) => updateDoc(index, 'correlativo', Number(e.target.value))}
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="p-4 text-sm text-slate-500 text-center border border-dashed rounded-lg dark:border-slate-700">
                Cargando documentos...
              </div>
            )}
          </div>
        </div>

        {/* Estado y Botones */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 mt-4">
          <input
            type="checkbox"
            id="activo"
            name="activo"
            checked={formData.activo}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
          />
          <label htmlFor="activo" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {caja?.id ? 'Serie Activa' : 'Activar Cajas Creadas'}
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Datos'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
