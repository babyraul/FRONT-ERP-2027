import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from '../components/layout/Layout.jsx'
import ProtectedRoute from '../components/layout/ProtectedRoute.jsx'
import { Login } from '../modules/auth'
import { Dashboard } from '../modules/dashboard'
import { Productos } from '../modules/productos'
import { Clientes } from '../modules/clientes'
import { Ventas } from '../modules/ventas'
import { Reportes } from '../modules/reportes'
import { Usuarios, Configuracion, Empresas, Sucursales, Modulos } from '../modules/manager'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'productos', element: <Productos /> },
      { path: 'clientes', element: <Clientes /> },
      { path: 'ventas', element: <Ventas /> },
      { path: 'reportes', element: <Reportes /> },
      
      // Rutas de gestión protegidas (requieren super admin por ahora)
      { path: 'usuarios', element: <ProtectedRoute requireSuperAdmin><Usuarios /></ProtectedRoute> },
      { path: 'configuracion', element: <ProtectedRoute requireSuperAdmin><Configuracion /></ProtectedRoute> },
      { path: 'empresas', element: <ProtectedRoute requireSuperAdmin><Empresas /></ProtectedRoute> },
      { path: 'sucursales', element: <ProtectedRoute requireSuperAdmin><Sucursales /></ProtectedRoute> },
      { path: 'modulos', element: <ProtectedRoute requireSuperAdmin><Modulos /></ProtectedRoute> },
    ],
  },
])
