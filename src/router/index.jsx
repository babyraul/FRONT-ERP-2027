import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from '../components/layout/Layout.jsx'
import Dashboard from '../pages/Dashboard/Dashboard.jsx'
import Productos from '../pages/Productos/Productos.jsx'
import Clientes from '../pages/Clientes/Clientes.jsx'
import Ventas from '../pages/Ventas/Ventas.jsx'
import Usuarios from '../pages/Usuarios/Usuarios.jsx'
import Reportes from '../pages/Reportes/Reportes.jsx'
import Configuracion from '../pages/Configuracion/Configuracion.jsx'
import Login from '../modules/auth/pages/Login.jsx'

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
