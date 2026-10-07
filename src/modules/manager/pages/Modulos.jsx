import { useEffect, useState, useCallback, useMemo } from 'react'
import { MagnifyingGlassIcon, ArrowDownTrayIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { moduloController } from '../controllers/modulo.js'
import { exportToExcel } from '../../../utils/exportExcel.js'
import ModuloModal from '../components/ModuloModal.jsx'
import { toast } from '../../../utils/toast.js'
import { DataTable } from '../../../components/ui/DataTable.jsx'

export function Modulos() {
  const [modulos, setModulos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busq, setBusq] = useState('')
  const [isModalOpen, setModalOpen] = useState(false)
  const [moduloEdit, setModuloEdit] = useState(null)

  const loadModulos = useCallback(async () => {
    setLoading(true)
    const res = await moduloController.getAll()
    if (res.success) setModulos(res.data)
    setLoading(false)
  }, [])

  const handleOpenEdit = (modulo) => {
    setModuloEdit(modulo)
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar módulo de manera permanente?')) return
    const res = await moduloController.delete(id)
    if (res.success) {
      toast.success('Éxito', 'Módulo eliminado permanentemente.')
      loadModulos()
    } else {
      toast.error('Error al eliminar', res.message || 'Ocurrió un error inesperado.')
    }
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'codigo',
      header: 'Código',
      size: 150,
      cell: info => <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{info.getValue()}</span>
    },
    {
      accessorKey: 'nombre',
      header: 'Nombre',
      size: 250,
      cell: info => (
        <div>
          <p className="font-medium">{info.getValue()}</p>
          {info.row.original.descripcion && <p className="text-xs text-slate-400 font-normal truncate max-w-xs">{info.row.original.descripcion}</p>}
        </div>
      )
    },
    {
      accessorFn: row => {
        const parent = modulos.find(p => p.id === row.padre_id)
        return parent ? `${row.tipo} (${parent.codigo})` : row.tipo
      },
      id: 'padre_tipo',
      header: 'Padre / Tipo',
      size: 200,
      cell: info => {
        const { tipo, padre_id } = info.row.original
        const parent = modulos.find(p => p.id === padre_id)
        return (
          <div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 mr-2">{tipo}</span>
            {parent && <span className="text-xs text-slate-500">↳ {parent.codigo}</span>}
          </div>
        )
      }
    },
    {
      accessorKey: 'icon',
      header: 'Ícono',
      size: 120,
      cell: info => {
        const iconClass = info.getValue()
        return (
          <div className="flex items-center justify-center gap-2">
            {iconClass ? (
              <>
                <i className={`${iconClass} text-slate-500`} />
                <span className="text-xs text-slate-500 hidden sm:inline-block">{iconClass}</span>
              </>
            ) : (
              <span className="text-xs text-slate-400">-</span>
            )}
          </div>
        )
      }
    },
    {
      accessorKey: 'ruta',
      header: 'Ruta',
      size: 120,
      cell: info => <div className="text-center text-sm font-mono text-slate-500">{info.getValue() || '-'}</div>
    },
    {
      accessorKey: 'orden',
      header: 'Orden',
      size: 100,
      cell: info => <div className="text-center text-sm">{info.getValue()}</div>
    },
    {
      accessorKey: 'activo',
      header: 'Estado',
      size: 120,
      cell: info => (
        <div className="text-center">
          <span className={info.getValue() ? 'badge-green' : 'badge-gray'}>
            {info.getValue() ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      )
    },
    {
      id: 'acciones',
      header: 'Acciones',
      size: 120,
      enableSorting: false,
      enableColumnFilter: false,
      cell: info => (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => handleOpenEdit(info.row.original)} className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="Editar Módulo">
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(info.row.original.id)}
            className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
            title="Eliminar Módulo"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ], [modulos])

  useEffect(() => {
    loadModulos()
  }, [loadModulos])

  const handleBusq = (e) => setBusq(e.target.value)

  const filtered = modulos.filter(m =>
    m.codigo?.toLowerCase().includes(busq.toLowerCase()) ||
    m.nombre?.toLowerCase().includes(busq.toLowerCase()) ||
    m.descripcion?.toLowerCase().includes(busq.toLowerCase())
  )

  const handleExport = () => {
    const data = filtered.map((m) => ({
      Código: m.codigo,
      Nombre: m.nombre,
      Descripción: m.descripcion,
      Estado: m.activo ? 'Activo' : 'Inactivo',
    }))
    exportToExcel(data, 'modulos', 'Módulos')
  }

  const handleOpenNew = () => {
    setModuloEdit(null)
    setModalOpen(true)
  }


  const handleSaveModal = async (data) => {
    let res
    if (moduloEdit) {
      res = await moduloController.update(moduloEdit.id, data)
    } else {
      res = await moduloController.create(data)
    }

    if (res.success) {
      toast.success('Guardado correctamente', moduloEdit ? 'Módulo actualizado con éxito.' : 'Módulo creado con éxito.')
      setModalOpen(false)
      loadModulos()
    } else {
      toast.error('Error al guardar', res.message || 'No se pudo guardar el módulo.')
    }
  }

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Módulos del Sistema</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} módulos registrados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary">
            <ArrowDownTrayIcon className="h-4 w-4" /> Exportar Excel
          </button>
          <button onClick={handleOpenNew} className="btn-primary">
            <PlusIcon className="h-4 w-4" /> Nuevo Módulo
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text" placeholder="Buscar por Código, Nombre o Descripción..."
            value={busq} onChange={handleBusq}
            className="input-field pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-slate-500">Cargando módulos...</div>
      ) : (
        <DataTable data={filtered} columns={columns} />
      )}

      <ModuloModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveModal}
        modulo={moduloEdit}
        modulosList={modulos}
      />
    </div>
  )
}
