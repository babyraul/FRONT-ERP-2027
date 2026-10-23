import { useState, useEffect, useMemo } from 'react'
import Modal from '../../../components/ui/Modal.jsx'
import { permisoController } from '../controllers/permiso.js'
import { toast } from '../../../utils/toast.js'
import {
  ShieldCheckIcon,
  PlusIcon,
  TrashIcon,
  KeyIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

const CRUD_ACTIONS = ['ver', 'crear', 'editar', 'eliminar']

export default function ModuloPermisosModal({
  isOpen,
  onClose,
  modulo,
  onUpdated,
  variant = 'inline'
}) {
  const [permisos, setPermisos] = useState([])
  const [loading, setLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  // Formulario para nuevo permiso especial
  const [sufijo, setSufijo] = useState('')
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')

  useEffect(() => {
    if (isOpen && modulo) {
      loadPermisos()
      resetForm()
    }
  }, [isOpen, modulo])

  const loadPermisos = async () => {
    setLoading(true)
    const res = await permisoController.getAll()
    if (res.success) {
      const delModulo = (res.data || []).filter((p) => p.modulo_id === modulo.id)
      setPermisos(delModulo)
    } else {
      toast.error('Error', res.message || 'No se pudieron cargar los permisos')
    }
    setLoading(false)
  }

  const resetForm = () => {
    setSufijo('')
    setNombre('')
    setDescripcion('')
    setIsAdding(false)
  }

  // Clasificación entre CRUD y Especiales
  const { crudList, especialesList } = useMemo(() => {
    const crud = []
    const especiales = []

    permisos.forEach((p) => {
      const isCrud = CRUD_ACTIONS.some((action) => p.codigo?.endsWith(`.${action}`))
      if (isCrud) {
        crud.push(p)
      } else {
        especiales.push(p)
      }
    })

    return {
      crudList: crud.sort((a, b) => (a.codigo || '').localeCompare(b.codigo || '')),
      especialesList: especiales.sort((a, b) => (a.codigo || '').localeCompare(b.codigo || ''))
    }
  }, [permisos])

  const moduloCodigoLower = (modulo?.codigo || '').toLowerCase()
  const codigoCompleto = sufijo.trim() ? `${moduloCodigoLower}.${sufijo.trim().toLowerCase()}` : moduloCodigoLower

  const handleCreateEspecial = async (e) => {
    e.preventDefault()

    if (!sufijo.trim()) {
      toast.error('Validación', 'El sufijo o clave del permiso es requerido.')
      return
    }
    if (!nombre.trim()) {
      toast.error('Validación', 'El nombre del permiso es requerido.')
      return
    }

    setSaving(true)
    const payload = {
      modulo_id: modulo.id,
      codigo: codigoCompleto,
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || `Permiso especial ${nombre.trim()} en ${modulo.nombre}`
    }

    const res = await permisoController.create(payload)
    setSaving(false)

    if (res.success) {
      toast.success('Permiso creado', `Se registró el permiso especial ${codigoCompleto}`)
      resetForm()
      await loadPermisos()
      if (onUpdated) onUpdated()
    } else {
      toast.error('Error al crear', res.message || 'No se pudo registrar el permiso.')
    }
  }

  const handleDeleteEspecial = async (permiso) => {
    const isCrud = CRUD_ACTIONS.some((action) => permiso.codigo?.endsWith(`.${action}`))
    const confirmMsg = isCrud
      ? `¿Eliminar el permiso base ${permiso.codigo}? (Recomendado mantener los 4 permisos CRUD)`
      : `¿Eliminar el permiso especial "${permiso.nombre}" (${permiso.codigo})?`

    if (!confirm(confirmMsg)) return

    const res = await permisoController.delete(permiso.id)
    if (res.success) {
      toast.success('Permiso eliminado', 'El permiso ha sido retirado.')
      await loadPermisos()
      if (onUpdated) onUpdated()
    } else {
      toast.error('Error', res.message || 'No se pudo eliminar el permiso')
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant={variant}
      title="Gestión de Permisos del Módulo"
      subtitle={
        modulo ? (
          <>
            Módulo:{' '}
            <span className="font-semibold text-teal-600 dark:text-teal-400">
              {modulo.nombre}
            </span>{' '}
            <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-mono">
              {modulo.codigo}
            </code>
          </>
        ) : null
      }
      hideConfirm={true}
      cancelText="Volver al Listado"
      backIcon="arrow"
    >
      <div className="space-y-6">
        {/* Cabecera explicativa */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 text-xs text-purple-900 dark:text-purple-200">
          <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Permisos Especiales y Convención</p>
            <p className="mt-0.5 text-purple-700 dark:text-purple-300">
              Los permisos que no terminan en <code className="font-mono bg-purple-100 dark:bg-purple-900/60 px-1 rounded">.ver</code>, <code className="font-mono bg-purple-100 dark:bg-purple-900/60 px-1 rounded">.crear</code>, <code className="font-mono bg-purple-100 dark:bg-purple-900/60 px-1 rounded">.editar</code> o <code className="font-mono bg-purple-100 dark:bg-purple-900/60 px-1 rounded">.eliminar</code> se clasifican automáticamente como <strong>Especiales</strong> y se muestran en la columna morada del gestor de Roles.
            </p>
          </div>
        </div>

        {/* Sección: Permisos Especiales */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <KeyIcon className="w-4 h-4 text-purple-500" />
              Permisos Especiales ({especialesList.length})
            </h4>

            {!isAdding && (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition cursor-pointer"
              >
                <PlusIcon className="w-4 h-4" />
                Nuevo Permiso Especial
              </button>
            )}
          </div>

          {/* Formulario de Creación Rápida */}
          {isAdding && (
            <form
              onSubmit={handleCreateEspecial}
              className="p-4 rounded-xl border border-purple-200 dark:border-purple-800/50 bg-purple-50/50 dark:bg-purple-950/20 space-y-3 transition-all"
            >
              <div className="flex items-center justify-between pb-2 border-b border-purple-200 dark:border-purple-800/40">
                <span className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase">
                  Registrar Permiso Especial
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Sufijo del Código *
                  </label>
                  <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-purple-500">
                    <span className="px-2.5 py-1.5 text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-700 select-none">
                      {moduloCodigoLower}.
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="ver_totales_cierre"
                      value={sufijo}
                      onChange={(e) => setSufijo(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                      className="w-full px-2.5 py-1.5 text-xs bg-transparent focus:outline-none font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block font-mono">
                    Código final: {codigoCompleto}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Nombre Descriptivo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ver Totales en Cierre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Descripción / Finalidad
                </label>
                <input
                  type="text"
                  placeholder="Permite ver montos esperados y arqueo al cerrar caja"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                >
                  Descartar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Guardando...' : 'Crear Permiso'}
                </button>
              </div>
            </form>
          )}

          {/* Listado de Especiales */}
          {loading ? (
            <div className="py-6 text-center text-xs text-slate-400">Cargando permisos...</div>
          ) : especialesList.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400">
              No hay permisos especiales registrados para este módulo.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 overflow-hidden">
              {especialesList.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                        {p.nombre}
                      </span>
                      <code className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                        {p.codigo}
                      </code>
                    </div>
                    {p.descripcion && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">{p.descripcion}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteEspecial(p)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition shrink-0 cursor-pointer"
                    title="Eliminar permiso especial"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sección: Permisos CRUD Estándar (Referencial) */}
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4 text-teal-500" />
            Permisos CRUD Estándar ({crudList.length})
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {crudList.map((p) => {
              const action = p.codigo.split('.').pop()
              return (
                <div
                  key={p.id}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-center"
                >
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase font-mono">
                    {action}
                  </span>
                  <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                    {p.codigo}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}