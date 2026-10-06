import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  LockClosedIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../../store/useAuthStore.js'
import ThemeToggle from '../../../components/ThemeToggle.jsx'

// Archivos servidos desde /public
const LOGO_EMPRESA = '/images/LogoMIFACTURA.png'
const LOGO_PARTNER = '/images/logoEM2.png'
const REMEMBER_KEY = 'login-remember-user'

const features = [
  { icon: ChartBarIcon,     title: 'Control en tiempo real', text: 'Ventas, stock y caja actualizados al instante.' },
  { icon: ShieldCheckIcon,  title: 'Acceso seguro',          text: 'Roles y permisos por módulo para cada usuario.' },
  { icon: CloudArrowUpIcon, title: 'Sincronización en nube', text: 'Tu información respaldada y disponible siempre.' },
]

export default function Login() {
  const { login, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/dashboard'

  const [form, setForm] = useState({ usuario: '', password: '' })
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY)
    if (saved) {
      setForm((f) => ({ ...f, usuario: saved }))
      setRemember(true)
    }
  }, [])

  if (isAuthenticated) return <Navigate to={redirectTo} replace />

  const handleChange = (e) => {
    setError('')
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(form.usuario.trim(), form.password)

    if (result.success) {
      remember
        ? localStorage.setItem(REMEMBER_KEY, form.usuario.trim())
        : localStorage.removeItem(REMEMBER_KEY)
      navigate(redirectTo, { replace: true })
    } else {
      setError(result.message || 'Usuario o contraseña incorrectos.')
      setLoading(false)
    }
  }

  const year = new Date().getFullYear()

  return (
    <div className="login-page">
      {/* ─── Panel de marca (solo desktop) ─────────────────────────── */}
      <aside className="login-brand">
        <div className="login-brand-glow" aria-hidden="true" />

        <div className="relative z-10">
          <div className="logo-tile">
            <img src={LOGO_EMPRESA} alt="MIFACTURA Perú" className="h-20 w-auto object-contain" />
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl xl:text-4xl font-bold leading-tight">
            Gestiona tu negocio con total control.
          </h2>
          <p className="mt-4 text-white/75 text-base">
            Plataforma ERP integral para ventas, inventario, clientes y reportes.
          </p>

          <ul className="mt-10 space-y-5">
            {features.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="login-feature-icon">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-white/70">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/50">Soluciones empresariales</p>
      </aside>

      {/* ─── Panel del formulario ──────────────────────────────────── */}
      <main className="login-main">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="flex-1 w-full flex items-center justify-center">
          <div className="w-full max-w-md">
            {/* Logo visible en mobile/tablet */}
            <div className="flex justify-center mb-6 lg:hidden">
              <div className="logo-tile">
                <img src={LOGO_EMPRESA} alt="MIFACTURA Perú" className="h-16 w-auto object-contain" />
              </div>
            </div>

            <div className="card login-card">
              <header className="mb-6">
                <h1 className="text-2xl font-bold">Iniciar sesión</h1>
                <p className="mt-1 text-sm text-muted">
                  Ingresa tus credenciales para acceder al panel de administración.
                </p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label htmlFor="login-usuario" className="form-label">Usuario</label>
                  <div className="relative">
                    <UserIcon className="input-icon" />
                    <input
                      id="login-usuario"
                      type="text"
                      name="usuario"
                      autoComplete="username"
                      autoFocus={!form.usuario}
                      value={form.usuario}
                      onChange={handleChange}
                      placeholder="Ingresa tu usuario"
                      required
                      className="input-field pl-10 py-2.5"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="form-label">Contraseña</label>
                  <div className="relative">
                    <LockClosedIcon className="input-icon" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      autoComplete="current-password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className="input-field pl-10 pr-11 py-2.5"
                    />
                    <button
                      type="button"
                      id="toggle-password-visibility"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:opacity-80 transition-opacity"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <label htmlFor="login-remember" className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    id="login-remember"
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded accent-[var(--color-secondary)]"
                  />
                  <span className="text-muted">Recordar usuario</span>
                </label>

                {error && (
                  <div role="alert" className="login-error">
                    <ExclamationCircleIcon className="h-5 w-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  id="login-submit"
                  type="submit"
                  disabled={loading || !form.usuario || !form.password}
                  className="btn-primary w-full justify-center py-3 text-base"
                >
                  {loading && <span className="spinner" aria-hidden="true" />}
                  {loading ? 'Verificando…' : 'Ingresar'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ─── Footer ─── */}
        <footer className="login-footer">
          <a
            href="https://www.contatrib.com/"
            target="_blank"
            rel="noopener noreferrer"
            title="www.contatrib.com"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-xs font-medium text-muted">Powered by</span>
            <span className="logo-tile logo-tile-sm">
              <img src={LOGO_PARTNER} alt="Escobedo Medina Auditores" className="h-6 w-auto object-contain" />
            </span>
          </a>
          <p className="text-xs text-muted text-center">
            © {year} MIFACTURA. Todos los derechos reservados.
          </p>
        </footer>
      </main>
    </div>
  )
}
