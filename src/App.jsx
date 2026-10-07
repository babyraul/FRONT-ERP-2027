import { RouterProvider } from 'react-router-dom'
import { router } from './router/index.jsx'
import { useTheme } from './hooks/useTheme'
import ToastContainer from './components/ui/ToastContainer'
import ErrorBoundary from './components/ui/ErrorBoundary.jsx'

// Inicializar el tema antes de que React renderice para evitar destellos (flicker)
useTheme.getState().initTheme()

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <ToastContainer />
    </ErrorBoundary>
  )
}
