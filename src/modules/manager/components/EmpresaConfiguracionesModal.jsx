import { useEffect, useState, useMemo } from 'react'
import Modal from '../../../components/ui/Modal.jsx'
import { empresaController } from '../controllers/empresa.js'
import { configuracionController } from '../controllers/configuracion.js'
import { toast } from '../../../utils/toast.js'
import {
  Cog6ToothIcon,
  PlusIcon,
  SparklesIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

// Switch Minimalista con estilo coherente al ERP
const ConfigSwitch = ({ active, onClick }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
        active ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'
      }`}
    >
      <span className="sr-only">Toggle</span>
      <span
        className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
          active ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function EmpresaConfiguracionesModal({
  isOpen,
  onClose,
  empresa,
  variant = 'inline'
}) {
  const [configuraciones, setConfiguraciones] = useState([])
  const [assignedIds, setAssignedIds] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Formulario rápido para crear nueva configuración en el catálogo
  const [isAdding, setIsAdding] = useState(false)
  const [nuevoCodigo, setNuevoCodigo] = useState('')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoModulo, setNuevoModulo] = useState('VENTAS')
  const [nuevaDescripcion, setNuevaDescripcion] = useState('')

  useEffect(() => {
    if (isOpen && empresa) {
      loadData()
      setIsAdding(false)
    }
  }, [isOpen, empresa])

  const loadData = async () => {
    setLoading(true)
    const [resCatalog, resAssigned] = await Promise.all([
      configuracionController.getAll(),
      empresaController.getConfiguraciones(empresa.id)
    ])

    if (resCatalog.success) {
      setConfiguraciones(resCatalog.data || [])
    } else {
      toast.error('Error', 'No se pudo cargar el catálogo de configuraciones')
    }

    if (resAssigned.success) {
      setAssignedIds(new Set(resAssigned.data || []))
    }
    setLoading(false)
  }

  // Agrupar configuraciones por módulo
  const groupedConfiguraciones = useMemo(() => {
    const map = {}
    configuraciones.forEach((c) => {
      const mod = (c.modulo || 'GENERAL').toUpperCase()
      if (!map[mod]) map[mod] = []
      map[mod].push(c)
    })
    return map
  }, [configuraciones])

  const modulosKeys = Object.keys(groupedConfiguraciones).sort()

  const handleToggle = (id) => {
    setAssignedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const res = await empresaController.assignConfiguraciones(
      empresa.id,
      Array.from(assignedIds)
    )
    setSaving(false)

    if (res.success) {
      toast.success('Configuraciones guardadas', 'Se actualizaron las reglas activas de la empresa')
      onClose()
    } else {
      toast.error('Error al guardar', res.message || 'No se pudieron asignar las configuraciones')
    }
  }

  const handleCreateInCatalog = async (e) => {
    e.preventDefault()
    if (!nuevoCodigo.trim() || !nuevoNombre.trim()) {
      toast.error('Validación', 'El código y nombre de la regla son obligatorios.')
      return
    }

    const payload = {
      codigo: nuevoCodigo.trim().toUpperCase(),
      nombre: nuevoNombre.trim(),
      modulo: nuevoModulo.trim().toUpperCase(),
      descripcion: nuevaDescripcion.trim() || `Configuración especial ${nuevoNombre.trim()}`,
      activo: true
    }

    setSaving(true)
    const res = await configuracionController.create(payload)
    setSaving(false)

    if (res.success) {
      toast.success('Configuración registrada', `Regla ${payload.codigo} añadida al catálogo`)
      setNuevoCodigo('')
      setNuevoNombre('')
      setNuevaDescripcion('')
      setIsAdding(false)
      // Activarla automáticamente para la empresa actual
      if (res.data?.id) {
        setAssignedIds((prev) => new Set([...prev, res.data.id]))
      }
      await loadData()
    } else {
      toast.error('Error al registrar', res.message || 'No se pudo crear la configuración')
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant={variant}
      title="Configuraciones por Empresa"
      subtitle={
        empresa ? (
          <>
            Empresa:{' '}
            <span className="font-semibold text-teal-600 dark:text-teal-400">
              {empresa.razon_social}
            </span>{' '}
            <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-mono">
              RUC: {empresa.ruc}
            </code>
          </>
        ) : null
      }
      confirmText="Guardar Configuraciones"
      onConfirm={handleSave}
      isProcessing={saving || loading}
      cancelText="Volver"
      backIcon="arrow"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Banner descriptivo */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/40 text-xs text-teal-900 dark:text-teal-200">
          <SparklesIcon className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Reglas de Negocio y Banderas Activas</p>
            <p className="mt-0.5 text-teal-700 dark:text-teal-300">
              Active o desactive las reglas de comportamiento deseadas para esta empresa (por ejemplo: comprobante por defecto en ventas, validaciones de stock o políticas de caja).
            </p>
          </div>
        </div>

        {/* Botón y Formulario de Nueva Configuración en Catálogo */}
        <div>
          {!isAdding ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition cursor-pointer"
              >
                <PlusIcon className="w-4 h-4" />
                Nueva Regla en Catálogo
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleCreateInCatalog}
              className="p-4 rounded-xl border border-teal-200 dark:border-teal-800/50 bg-teal-50/40 dark:bg-teal-950/20 space-y-3 transition-all"
            >
              <div className="flex items-center justify-between pb-2 border-b border-teal-200 dark:border-teal-800/40">
                <span className="text-xs font-bold text-teal-900 dark:text-teal-200 uppercase">
                  Registrar Nueva Regla en el Catálogo
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Módulo *
                  </label>
                  <select
                    value={nuevoModulo}
                    onChange={(e) => setNuevoModulo(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="VENTAS">VENTAS</option>
                    <option value="CAJA">CAJA</option>
                    <option value="STOCK">STOCK / INVENTARIO</option>
                    <option value="FACTURACION">FACTURACIÓN</option>
                    <option value="GENERAL">GENERAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Código Único *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VENTAS_DOC_DEFECTO_VALE"
                    value={nuevoCodigo}
                    onChange={(e) => setNuevoCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono uppercase rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Nombre Descriptivo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Usar Vales por Defecto en Ventas"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Descripción / Finalidad
                </label>
                <input
                  type="text"
                  placeholder="Inicializa el TPV con Vale en lugar de Boleta"
                  value={nuevaDescripcion}
                  onChange={(e) => setNuevaDescripcion(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                >
                  Descartar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Guardando...' : 'Crear en Catálogo'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Lista de Reglas Agrupadas por Módulo */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Cargando configuraciones disponibles...
          </div>
        ) : modulosKeys.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
            No hay configuraciones registradas en el catálogo. Usa el botón &quot;Nueva Regla en Catálogo&quot; para registrar la primera.
          </div>
        ) : (
          <div className="space-y-4">
            {modulosKeys.map((modKey) => {
              const items = groupedConfiguraciones[modKey] || []
              return (
                <div
                  key={modKey}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs"
                >
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-black tracking-wider uppercase text-slate-700 dark:text-slate-300 font-mono">
                      {modKey}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {items.filter((i) => assignedIds.has(i.id)).length} de {items.length} activas
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((conf) => {
                      const isON = assignedIds.has(conf.id)
                      return (
                        <div
                          key={conf.id}
                          onClick={() => handleToggle(conf.id)}
                          className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-xs font-bold transition-colors ${
                                  isON
                                    ? 'text-teal-700 dark:text-teal-400'
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {conf.nombre}
                              </span>
                              <code className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                {conf.codigo}
                              </code>
                            </div>
                            {conf.descripcion && (
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                {conf.descripcion}
                              </p>
                            )}
                          </div>

                          <ConfigSwitch active={isON} onClick={() => handleToggle(conf.id)} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}
