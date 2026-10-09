import { useAuthStore } from '../../../store/useAuthStore'
import { Link } from 'react-router-dom'
import { 
  BuildingOfficeIcon, 
  MapPinIcon, 
  ArchiveBoxIcon, 
  KeyIcon, 
  UsersIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline'

const iconMap = {
  'EMPRESAS': BuildingOfficeIcon,
  'SUCURSALES': MapPinIcon,
  'ALMACENES': ArchiveBoxIcon,
  'ROLES': KeyIcon,
  'USUARIOS': UsersIcon,
  'MODULOS': Squares2X2Icon
}

export default function Configuracion() {
  const { menu } = useAuthStore()
  
  // Encontrar el módulo de configuración
  const configuracionModule = menu?.find(m => m.codigo === 'CONFIGURACION')
  const items = configuracionModule?.items || []

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Administración y Configuración</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
          Gestiona los accesos, la configuración de empresas, sucursales y parámetros generales del sistema.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          No tienes accesos configurados para esta sección.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => {
            const Icon = iconMap[item.codigo] || Squares2X2Icon
            return (
              <Link
                key={item.id}
                to={item.ruta || `/${item.codigo.toLowerCase()}`}
                className="group relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-800 overflow-hidden"
              >
                {/* Background glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-all duration-300">
                    <Icon className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.nombre}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Configuración de {item.nombre.toLowerCase()}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
