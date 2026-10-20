import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  ArrowDownTrayIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { DataTable } from '../../../components/ui/DataTable.jsx'
import ClienteModal from '../components/ClienteModal.jsx'
import { clienteController } from '../controllers/cliente.js'
import { tablasFijasService } from '../../../utils/tablasFijas.js'
import { exportToExcel } from '../../../utils/exportExcel.js'
import { toast } from '../../../utils/toast.js'
import Can from '../../../components/ui/Can.jsx'
import { ActionCell, EditRowButton, DeleteRowButton } from '../../../components/ui/ActionButtons.jsx'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [tiposDocumento, setTiposDocumento] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState(null)

  // Cargar tipos de documento para los filtros y modal
  useEffect(() => {
    async function loadCatalogos() {
      const res = await tablasFijasService.getTiposDocumento()
      if (res.success && res.data) {
        setTiposDocumento(res.data)
      }
    }
    loadCatalogos()
  }, [])

  // Cargar clientes desde el backend
  const loadClientes = useCallback(async () => {
    setLoading(true)
    const res = await clienteController.getAll()
    if (res.success) {
      setClientes(res.data)
    } else {
      toast.error(res.message || 'Error al cargar los clientes')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadClientes()
  }, [loadClientes])

  // Exportar a Excel
  const handleExport = () => {
    if (clientes.length === 0) {
      toast.error('No hay clientes para exportar')
      return
    }

    const data = clientes.map((c) => ({
      'Tipo Doc': c.tipo_documento_abreviatura || c.tipo_documento_id || '',
      'N° Documento': c.numero_documento,
      'Nombre / Razón Social': c.nombre_razon_social,
      'Dirección': c.direccion_1 || '',
      'Teléfono': c.telefono_1 || '',
      'Email': c.email_1 || '',
      'Límite Crédito (S/)': Number(c.limite_credito || 0).toFixed(2),
      'Saldo Utilizado (S/)': Number(c.saldo_utilizado || 0).toFixed(2),
      'Días Crédito': c.dias_credito_pactado || 30,
      'Estado Crédito': c.estado_credito || 'NORMAL',
    }))

    exportToExcel(data, 'clientes', 'Clientes')
  }

  const handleOpenNew = () => {
    setSelectedCliente(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (cliente) => {
    setSelectedCliente(cliente)
    setIsModalOpen(true)
  }

  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Está seguro de eliminar al cliente "${nombre}"?`)) return

    const res = await clienteController.delete(id)
    if (res.success) {
      toast.success(res.message || 'Cliente eliminado correctamente')
      loadClientes()
    } else {
      toast.error(res.message || 'Error al eliminar el cliente')
    }
  }

  const handleSaveModal = async (formData) => {
    setIsProcessing(true)
    let res
    if (selectedCliente) {
      res = await clienteController.update(selectedCliente.id, formData)
    } else {
      res = await clienteController.create(formData)
    }

    if (res.success) {
      setIsModalOpen(false)
      toast.success(res.message || (selectedCliente ? 'Cliente actualizado' : 'Cliente registrado exitosamente'))
      loadClientes()
    } else {
      toast.error(res.message || 'Error al procesar el cliente')
    }
    setIsProcessing(false)
  }

  // Columnas para TanStack DataTable
  const columns = useMemo(() => [
,
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <ActionCell>
          <Can I="editar" a="clientes">
            <EditRowButton
              onClick={() => handleOpenEdit(row.original)}
              title="Editar Cliente"
            />
          </Can>
          <Can I="eliminar" a="clientes">
            <DeleteRowButton
              onClick={() => handleDelete(row.original.id, row.original.nombre_razon_social)}
              title="Eliminar Cliente"
            />
          </Can>
        </ActionCell>
      ),
      enableColumnFilter: false,
      enableSorting: false
    },
    {
      accessorKey: 'numero_documento',
      header: 'Documento',
      cell: ({ row }) => {
        const c = row.original
        const badgeColor = c.tipo_documento_id === '6' 
          ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800'
          : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'

        return (
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${badgeColor}`}>
              {c.tipo_documento_abreviatura || (c.tipo_documento_id === '6' ? 'RUC' : 'DNI')}
            </span>
            <span className="font-mono text-xs font-semibold tracking-wider text-slate-800 dark:text-slate-200">
              {c.numero_documento}
            </span>
          </div>
        )
      },
      size: 160
    },
    {
      accessorKey: 'nombre_razon_social',
      header: 'Cliente / Razón Social',
      cell: info => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 dark:text-slate-100 leading-snug">
            {info.getValue()}
          </span>
        </div>
      ),
      size: 280
    },
    {
      accessorKey: 'direccion_1',
      header: 'Dirección',
      cell: info => (
        <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-xs block" title={info.getValue() || ''}>
          {info.getValue() || <span className="text-slate-400 italic">No especificada</span>}
        </span>
      ),
      size: 220
    },
    {
      id: 'contacto',
      header: 'Contacto',
      cell: ({ row }) => {
        const { telefono_1, email_1 } = row.original
        return (
          <div className="flex flex-col gap-0.5 text-xs">
            {telefono_1 && (
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <PhoneIcon className="h-3 w-3 shrink-0 text-slate-400" /> {telefono_1}
              </span>
            )}
            {email_1 && (
              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 truncate max-w-[170px]" title={email_1}>
                <EnvelopeIcon className="h-3 w-3 shrink-0 text-slate-400" /> {email_1}
              </span>
            )}
            {!telefono_1 && !email_1 && (
              <span className="text-slate-400 italic">Sin datos de contacto</span>
            )}
          </div>
        )
      },
      size: 180
    },
    {
      id: 'credito',
      header: 'Crédito y Saldo',
      cell: ({ row }) => {
        const { limite_credito, saldo_utilizado, saldo_disponible } = row.original
        const hasCredito = Number(limite_credito || 0) > 0

        if (!hasCredito) {
          return <span className="text-xs text-slate-400 italic">Sin línea de crédito</span>
        }

        return (
          <div className="flex flex-col text-xs font-mono">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Límite: S/ {Number(limite_credito).toFixed(2)}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
              Disp: S/ {Number(saldo_disponible || 0).toFixed(2)}
            </span>
          </div>
        )
      },
      size: 160,
      enableColumnFilter: false
    },
    {
      accessorKey: 'estado_credito',
      header: 'Estado Crédito',
      cell: info => {
        const estado = info.getValue() || 'NORMAL'
        let color = 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
        if (estado === 'OBSERVADO') color = 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
        if (estado === 'BLOQUEADO') color = 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'

        return (
          <div className="flex justify-center">
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${color}`}>
              {estado}
            </span>
          </div>
        )
      },
      size: 120,
      enableColumnFilter: false
    }
  ], [])

  return (
    <div className="space-y-6 p-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Clientes</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Directorio de clientes comerciales, líneas de crédito y comprobantes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center gap-2"
            title="Exportar listado a Excel"
          >
            <ArrowDownTrayIcon className="h-4 w-4" /> Exportar Excel
          </button>

          <Can I="crear" a="clientes" fallback={
            <button
              onClick={handleOpenNew}
              className="btn-primary flex items-center gap-2 shadow-sm"
            >
              <PlusIcon className="h-4 w-4" /> Nuevo Cliente
            </button>
          }>
            <button
              onClick={handleOpenNew}
              className="btn-primary flex items-center gap-2 shadow-sm"
            >
              <PlusIcon className="h-4 w-4" /> Nuevo Cliente
            </button>
          </Can>
        </div>
      </div>

      {/* Tabla con TanStack DataTable */}
      <div className="w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 font-medium">Cargando directorio de clientes...</p>
          </div>
        ) : (
          <DataTable data={clientes} columns={columns} pagination={true} />
        )}
      </div>

      {/* Modal de Creación / Edición */}
      <ClienteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        cliente={selectedCliente}
        tiposDocumento={tiposDocumento}
        isProcessing={isProcessing}
      />
    </div>
  )
}
