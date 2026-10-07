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
  ExclamationTriangleIcon,
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
  const [capsLock, setCapsLock] = useState(false)

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
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[1.05fr_1fr] bg-slate-50 dark:bg-[#0c1514] text-slate-900 dark:text-slate-100">
      {/* ─── Panel de marca (solo desktop) ─────────────────────────── */}
      <aside className="hidden lg:flex bg-[#1b3733] text-white relative overflow-hidden isolate flex-col justify-between gap-12 px-14 py-12">
        <div
          aria-hidden="true"
          className="absolute -z-10 -right-[22%] -bottom-[28%] w-[90%] aspect-square rounded-full"
          style={{
            backgroundImage: 'radial-gradient(circle, #1b3733 0 18%, transparent 18.2%), repeating-radial-gradient(circle, rgba(255,255,255,0.07) 0 1px, transparent 1px 22px)',
            maskImage: 'radial-gradient(circle, #000 55%, transparent 72%)',
            WebkitMaskImage: 'radial-gradient(circle, #000 55%, transparent 72%)'
          }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#01a59c]/15 to-transparent to-45%" />

        <div className="relative z-10">
          <div className="self-start rounded-2xl bg-white px-5 py-3 shadow-lg shadow-black/20 inline-block">
            <img src={LOGO_EMPRESA} alt="MIFACTURA Perú" className="h-[4.5rem] w-auto object-contain" />
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl xl:text-[2.75rem] font-bold leading-[1.12] tracking-tight text-balance">
            Gestiona tu negocio con total control.
          </h2>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-white/80">
            Plataforma ERP integral para ventas, inventario, clientes y reportes.
          </p>

          <ul className="mt-10 border-t border-white/15">
            {features.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4 py-[18px] border-b border-white/15">
                <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#01a59c]/20 text-teal-200">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-white/70">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-[13px] text-white/55">Soluciones empresariales</p>
      </aside>

      {/* ─── Panel del formulario ──────────────────────────────────── */}
      <main className="relative flex min-w-0 flex-col p-6">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center pt-12 pb-6">
          <div className="w-full max-w-[26rem]">
            {/* Logo visible en mobile/tablet */}
            <div className="mb-6 flex justify-center lg:hidden">
              <div className="h-[3.75rem] rounded-xl border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 inline-block">
                <img src={LOGO_EMPRESA} alt="MIFACTURA Perú" className="h-full w-auto object-contain" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 max-[420px]:p-5 shadow-[0_1px_2px_rgba(16,40,36,0.05),0_12px_32px_-12px_rgba(16,40,36,0.18)] dark:border-[#263836] dark:bg-[#131f1d]">
              <header className="mb-6">
                <h1 className="text-[1.625rem] font-bold tracking-tight">Iniciar sesión</h1>
                <p className="mt-2 text-[15px] leading-normal text-slate-500 dark:text-slate-400">
                  Ingresa tus credenciales para acceder al panel de administración.
                </p>
              </header>

              <form onSubmit={handleSubmit} className="mt-7 grid gap-5" noValidate>
                <div>
                  <label htmlFor="login-usuario" className="mb-1.5 block text-sm font-semibold">Usuario</label>
                  <div className="group relative">
                    <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[var(--color-secondary)]" />
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
                      aria-invalid={!!error}
                      aria-describedby={error ? 'login-error' : undefined}
                      className="h-12 w-full rounded-[10px] border border-slate-300 bg-white pl-11 pr-3.5 text-base text-slate-900 placeholder:text-slate-400 transition hover:border-[var(--color-primary)]/50 focus:border-[var(--color-secondary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-secondary)]/20 aria-[invalid=true]:border-red-600 dark:border-[#263836] dark:bg-[#0e1917] dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="mb-1.5 block text-sm font-semibold">Contraseña</label>
                  <div className="group relative">
                    <LockClosedIcon className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[var(--color-secondary)]" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      autoComplete="current-password"
                      value={form.password}
                      onChange={handleChange}
                      onKeyDown={(e) => e.getModifierState && setCapsLock(e.getModifierState('CapsLock'))}
                      onKeyUp={(e) => e.getModifierState && setCapsLock(e.getModifierState('CapsLock'))}
                      onBlur={() => setCapsLock(false)}
                      placeholder="••••••••"
                      required
                      aria-invalid={!!error}
                      aria-describedby={error ? 'login-error' : undefined}
                      className="h-12 w-full rounded-[10px] border border-slate-300 bg-white pl-11 pr-12 text-base text-slate-900 placeholder:text-slate-400 transition hover:border-[var(--color-primary)]/50 focus:border-[var(--color-secondary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-secondary)]/20 aria-[invalid=true]:border-red-600 dark:border-[#263836] dark:bg-[#0e1917] dark:text-slate-100"
                    />
                    <button
                      type="button"
                      id="toggle-password-visibility"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition hover:bg-[var(--color-primary)]/10 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-[var(--color-secondary)] dark:hover:text-white"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeSlashIcon className="size-5" /> : <EyeIcon className="size-5" />}
                    </button>
                  </div>
                  {capsLock && (
                    <p role="status" className="mt-2 flex items-center gap-1.5 text-[13px] text-amber-700 dark:text-amber-400">
                      <ExclamationTriangleIcon className="size-4 shrink-0" />
                      Bloq Mayús está activado
                    </p>
                  )}
                </div>

                <label htmlFor="login-remember" className="inline-flex w-fit cursor-pointer select-none items-center gap-2 text-sm text-slate-500">
                  <input
                    id="login-remember"
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="size-4 cursor-pointer accent-[var(--color-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2"
                  />
                  <span>Recordar usuario</span>
                </label>

                {error && (
                  <div id="login-error" role="alert" className="flex items-start gap-2.5 rounded-[10px] border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 motion-safe:animate-[shake_.35s_ease-out]">
                    <ExclamationCircleIcon className="size-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  id="login-submit"
                  type="submit"
                  disabled={loading || !form.usuario || !form.password}
                  className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-[10px] bg-[var(--color-primary)] text-base font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_6px_16px_-6px_var(--color-primary)] transition hover:brightness-90 active:translate-y-px focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--color-secondary)]/55 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                >
                  {loading && <span className="size-[18px] rounded-full border-2 border-white/35 border-t-white animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                  {loading ? 'Verificando…' : 'Ingresar'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ─── Footer ─── */}
        <footer className="grid justify-items-center gap-3 pt-4">
          <a
            href="https://www.contatrib.com/"
            target="_blank"
            rel="noopener noreferrer"
            title="www.contatrib.com"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 opacity-90 transition hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-secondary)] rounded-md"
          >
            <span>Powered by</span>
            <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1">
              <img src={LOGO_PARTNER} alt="Escobedo Medina Auditores" className="h-6 w-auto object-contain" />
            </span>
          </a>
          <p className="text-xs text-slate-500 text-center">
            © {year} MIFACTURA. Todos los derechos reservados.
          </p>
        </footer>
      </main>
    </div>
  )
}

