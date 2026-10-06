import { useState } from 'react'
import { MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useUsuariosStore } from '../../store/useUsuariosStore.js'

const ROL_COLORS = {
  admin:      'badge-blue',
  vendedor:   'badge-green',
  almacenero: 'badge-yellow',
  contador:   'badge-gray',
}

export default function Usuarios() {
  const { setBusqueda, getFiltered, deleteUsuario } = useUsuariosStore()
  const usuarios = getFiltered()
  const [busq, setBusq] = useState('')

  const handleBusq = (e) => { setBusq(e.target.value); setBusqueda(e.target.value) }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">{usuarios.length} usuarios registrados</p>
        </div>
        <button className="btn-primary">
          <PlusIcon className="h-4 w-4" /> Nuevo Usuario
        </button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text" placeholder="Buscar por nombre, email o rol..."
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
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium text-center">Rol</th>
                <th className="px-4 py-3 font-medium text-center">Estado</th>
                <th className="px-4 py-3 font-medium">Último acceso</th>
                <th className="px-4 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={ROL_COLORS[u.rol] ?? 'badge-gray'}>{u.rol}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={u.estado === 'activo' ? 'badge-green' : 'badge-gray'}>{u.estado}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.ultimoAcceso}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteUsuario(u.id)}
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
          {usuarios.length === 0 && (
            <div className="py-16 text-center text-gray-400">No se encontraron usuarios.</div>
          )}
        </div>
      </div>
    </div>
  )
}
