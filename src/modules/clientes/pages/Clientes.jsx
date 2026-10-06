import { useState } from 'react'
import { MagnifyingGlassIcon, ArrowDownTrayIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useClientesStore } from '../../store/useClientesStore.js'
import { exportToExcel } from '../../utils/exportExcel.js'

export default function Clientes() {
  const { setBusqueda, getFiltered, deleteCliente } = useClientesStore()
  const clientes = getFiltered()
  const [busq, setBusq] = useState('')

  const handleBusq = (e) => { setBusq(e.target.value); setBusqueda(e.target.value) }

  const handleExport = () => {
    const data = clientes.map((c) => ({
      RUC: c.ruc, Nombre: c.nombre, Email: c.email,
      Teléfono: c.telefono, Tipo: c.tipo, Estado: c.estado,
    }))
    exportToExcel(data, 'clientes', 'Clientes')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clientes.length} clientes encontrados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary">
            <ArrowDownTrayIcon className="h-4 w-4" /> Exportar Excel
          </button>
          <button className="btn-primary">
            <PlusIcon className="h-4 w-4" /> Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text" placeholder="Buscar por nombre, RUC o email..."
            value={busq} onChange={handleBusq}
            className="input-field pl-9"
          />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">RUC / DNI</th>
                <th className="px-4 py-3 font-medium">Nombre / Razón Social</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 font-medium text-center">Tipo</th>
                <th className="px-4 py-3 font-medium text-center">Estado</th>
                <th className="px-4 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.ruc}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{c.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email}</td>
                  <td className="px-4 py-3 text-gray-500">{c.telefono}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={c.tipo === 'empresa' ? 'badge-blue' : 'badge-gray'}>
                      {c.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={c.estado === 'activo' ? 'badge-green' : 'badge-gray'}>
                      {c.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteCliente(c.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clientes.length === 0 && (
            <div className="py-16 text-center text-gray-400">No se encontraron clientes.</div>
          )}
        </div>
      </div>
    </div>
  )
}
