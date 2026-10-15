import { useState, useEffect, useMemo } from 'react'
import { MagnifyingGlassIcon, XMarkIcon, UserPlusIcon, CheckIcon } from '@heroicons/react/24/outline'
import Modal from '../../../components/ui/Modal.jsx'
import { venderController } from '../controllers/venderController.js'

export default function BuscarClienteModal({
  isOpen,
  onClose,
  onSelectCliente,
  onOpenNuevoCliente
}) {
  const [busqueda, setBusqueda] = useState('')
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      cargarClientes('')
    }
  }, [isOpen])

  const cargarClientes = async (q = '') => {
    setLoading(true)
    const res = await venderController.buscarClientes(q)
    if (res.success) {
      setClientes(res.data)
    }
    setLoading(false)
  }

  const handleSearch = (e) => {
    const val = e.target.value
    setBusqueda(val)
    cargarClientes(val)
  }

  const handleSelect = (cliente) => {
    onSelectCliente(cliente)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buscar Cliente" size="2xl">
      <div className="space-y-4">
        {/* Buscador y botón nuevo */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Buscar por DNI, RUC o Nombre / Razón Social..."
              value={busqueda}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#01a59c] text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              onClose()
              onOpenNuevoCliente()
            }}
            className="btn-primary flex items-center gap-1.5 shrink-0 text-xs py-2 px-3"
            title="Registrar nuevo cliente"
          >
            <UserPlusIcon className="h-4 w-4" />
            Nuevo
          </button>
        </div>

        {/* Botón rápido clientes varios */}
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>Clientes registrados: {clientes.length}</span>
          <button
            type="button"
            onClick={() =>
              handleSelect({
                id: 'varios',
                tipo_documento_id: '0',
                numero_documento: '99999999',
                nombre_razon_social: 'CLIENTES VARIOS'
              })
            }
            className="text-[#01a59c] hover:underline font-semibold"
          >
            + Seleccionar "CLIENTES VARIOS"
          </button>
        </div>

        {/* Tabla / Lista de Clientes */}
        <div className="max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Cargando clientes...</div>
          ) : clientes.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No se encontraron clientes con "{busqueda}".
            </div>
          ) : (
            clientes.map((c) => (
              <div
                key={c.id}
                onClick={() => handleSelect(c)}
                className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      {c.nombre_razon_social}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-mono font-medium">
                      {c.numero_documento || 'S/D'}
                    </span>
                  </div>
                  {c.direccion_1 && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">{c.direccion_1}</p>
                  )}
                </div>

                <button
                  type="button"
                  className="px-2.5 py-1 text-xs rounded-lg bg-[#01a59c]/10 text-[#01a59c] hover:bg-[#01a59c] hover:text-white transition-colors font-medium flex items-center gap-1"
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                  Elegir
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}
