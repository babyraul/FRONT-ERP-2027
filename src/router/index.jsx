import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from '../components/layout/Layout.jsx'
import { Login } from '../modules/auth'
import { Dashboard } from '../modules/dashboard'
import { Productos } from '../modules/productos'
import { Clientes } from '../modules/clientes'
import { Ventas } from '../modules/ventas'
import { Reportes } from '../modules/reportes'
import { Usuarios, Configuracion } from '../modules/manager'

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
      { path: 'usuarios', element: <Usuarios /> },
      { path: 'reportes', element: <Reportes /> },
      { path: 'configuracion', element: <Configuracion /> },
    ],
  },
])
