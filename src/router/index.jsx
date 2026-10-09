import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from '../components/layout/Layout.jsx'
import ProtectedRoute from '../components/layout/ProtectedRoute.jsx'
import { RouteErrorBoundary } from '../components/ui/ErrorBoundary.jsx'
import { Login } from '../modules/auth'
import { Dashboard } from '../modules/dashboard'
import { Productos } from '../modules/productos'
import { Clientes } from '../modules/clientes'
import { Ventas } from '../modules/ventas'
import { Reportes } from '../modules/reportes'
import { Usuarios, Configuracion, Empresas, Sucursales, Almacenes, Modulos, Roles } from '../modules/manager'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'productos', element: <Productos /> },
      { path: 'clientes', element: <Clientes /> },
      { path: 'ventas', element: <Ventas /> },
      { path: 'reportes', element: <Reportes /> },
      
      // Rutas de gestión protegidas (validadas 100% dinámicamente)
      { path: 'usuarios', element: <ProtectedRoute><Usuarios /></ProtectedRoute> },
      { path: 'configuracion', element: <ProtectedRoute requireSuperAdmin><Configuracion /></ProtectedRoute> },
      { path: 'empresas', element: <ProtectedRoute><Empresas /></ProtectedRoute> },
      { path: 'sucursales', element: <ProtectedRoute><Sucursales /></ProtectedRoute> },
      { path: 'almacenes', element: <ProtectedRoute><Almacenes /></ProtectedRoute> },
      { path: 'modulos', element: <ProtectedRoute requireSuperAdmin><Modulos /></ProtectedRoute> },
      { path: 'roles', element: <ProtectedRoute><Roles /></ProtectedRoute> },
    ],
  },
])
