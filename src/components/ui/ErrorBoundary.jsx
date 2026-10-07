import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useRouteError } from 'react-router-dom';

export function GlobalErrorFallback({ error, onReload }) {
  const errorMessage = error?.message || error?.statusText || error?.toString() || 'Error desconocido';

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 p-6 text-center dark:bg-slate-950">
      <div className="mb-6 rounded-full bg-red-100 p-4 dark:bg-red-900/30">
        <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
      </div>

      <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
        Ups, algo salió mal
      </h1>

      <p className="mb-8 max-w-md text-slate-600 dark:text-slate-400">
        Se ha producido un error inesperado en esta sección. Hemos registrado el incidente para solucionarlo pronto.
      </p>

      <button
        onClick={onReload}
        className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white transition-all hover:bg-teal-700 active:scale-95 shadow-lg shadow-teal-600/20"
      >
        <RefreshCw size={18} />
        Recargar Aplicación
      </button>

      {/* Solo se muestra en desarrollo o si hay un error específico */}
      <div className="mt-10 max-w-2xl overflow-auto rounded-lg bg-slate-200 p-4 text-left text-xs font-mono text-red-700 dark:bg-slate-900 dark:text-red-400">
        <p className="font-bold uppercase mb-2 text-[10px]">Debug Info:</p>
        {errorMessage}
      </div>
    </div>
  );
}

/**
 * RouteErrorBoundary
 * Este componente es para usarlo específicamente en React Router v6 como `errorElement`
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  console.error('💥 RouteErrorBoundary detectó un error:', error);
  
  return <GlobalErrorFallback error={error} onReload={() => window.location.href = '/'} />;
}

/**
 * ErrorBoundary
 * Captura errores de renderizado en la jerarquía de componentes que no son capturados por el router.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('💥 ErrorBoundary detectó un error crítico:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return <GlobalErrorFallback error={this.state.error} onReload={this.handleReload} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
