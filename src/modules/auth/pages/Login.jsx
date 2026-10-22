import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  LockClosedIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../../store/useAuthStore.js'
import ThemeToggle from '../../../components/ThemeToggle.jsx'
import EnterpriseModernBackground from '../components/EnterpriseModernBackground.jsx'

// Archivos servidos desde /public
const LOGO_EMPRESA = '/images/LogoMIFACTURA.png'
const LOGO_PARTNER = '/images/logoEM2.png'
const REMEMBER_KEY = 'login-remember-user'

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

  const checkCapsLock = (e) => {
    if (e.getModifierState) {
      setCapsLock(e.getModifierState('CapsLock'))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await login(form.usuario.trim(), form.password)

      if (result?.success) {
        if (remember) {
          localStorage.setItem(REMEMBER_KEY, form.usuario.trim())
        } else {
          localStorage.removeItem(REMEMBER_KEY)
        }
        navigate(redirectTo, { replace: true })
      } else {
        setError(result?.message || 'Usuario o contraseña incorrectos.')
      }
    } catch (err) {
      setError('Ocurrió un error inesperado al iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  const year = new Date().getFullYear()

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-slate-50 dark:bg-[#07100f] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4">
      {/* ─── FONDO FINTECH / ENTERPRISE INDUSTRIAL DE ALTA GAMA ─── */}
      <EnterpriseModernBackground />

      {/* ─── BOTÓN MODO OSCURO / DÍA EN ESQUINA SUPERIOR ─── */}
      <div className="absolute top-6 right-6 z-30">
        <ThemeToggle />
      </div>

      {/* ─── CONTENEDOR CENTRAL DEL FORMULARIO CON EFECTO CRISTAL MULTICAPA ─── */}
      <div className="relative z-20 w-full max-w-[430px] my-auto flex flex-col justify-center">
        {/* Tarjeta de Cristal de Precisión */}
        <div className="relative rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#0c1816]/90 p-8 sm:p-9 shadow-[0_25px_60px_-15px_rgba(1,165,156,0.15)] dark:shadow-[0_30px_70px_-20px_rgba(0,0,0,0.7)] backdrop-blur-2xl transition-all duration-300">
          {/* Luz cenital perimetral sutil */}
          <div className="absolute -inset-px rounded-3xl pointer-events-none" />

          <header className="mb-7 text-center">
            {/* Logo principal en contenedor de precisión */}
            <div className="mb-5 flex justify-center">
              <div className="rounded-2xl bg-white p-3 px-6 shadow-md border border-slate-200/80 dark:border-teal-500/25 inline-block">
                <img
                  src={LOGO_EMPRESA}
                  alt="MIFACTURA Perú"
                  className="h-11 sm:h-12 w-auto object-contain drop-shadow-sm"
                />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Iniciar sesión
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              Ingresa tus credenciales autorizadas para acceder a la sucursal.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
            <div>
              <label htmlFor="login-usuario" className="mb-1.5 block text-xs font-semibold tracking-wider uppercase text-slate-600 dark:text-slate-300 font-mono">
                Usuario
              </label>
              <div className="group relative">
                <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#01a59c]" />
                <input
                  id="login-usuario"
                  type="text"
                  name="usuario"
                  autoComplete="username"
                  autoFocus={!form.usuario}
                  value={form.usuario}
                  onChange={handleChange}
                  onKeyDown={checkCapsLock}
                  onKeyUp={checkCapsLock}
                  placeholder="Ingresa tu usuario"
                  required
                  aria-invalid={!!error}
                  aria-describedby={error ? 'login-error' : undefined}
                  className="h-12 w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white/80 dark:bg-black/25 pl-11 pr-3.5 text-base text-slate-900 dark:text-white placeholder:text-slate-400 transition hover:border-[#01a59c]/40 focus:border-[#01a59c] focus:bg-white dark:focus:bg-black/40 focus:outline-none focus:ring-4 focus:ring-[#01a59c]/20 aria-[invalid=true]:border-red-500/80"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-xs font-semibold tracking-wider uppercase text-slate-600 dark:text-slate-300 font-mono">
                Contraseña
              </label>
              <div className="group relative">
                <LockClosedIcon className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#01a59c]" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  onKeyDown={checkCapsLock}
                  onKeyUp={checkCapsLock}
                  onBlur={() => setCapsLock(false)}
                  placeholder="••••••••"
                  required
                  aria-invalid={!!error}
                  aria-describedby={error ? 'login-error' : undefined}
                  className="h-12 w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white/80 dark:bg-black/25 pl-11 pr-12 text-base text-slate-900 dark:text-white placeholder:text-slate-400 transition hover:border-[#01a59c]/40 focus:border-[#01a59c] focus:bg-white dark:focus:bg-black/40 focus:outline-none focus:ring-4 focus:ring-[#01a59c]/20 aria-[invalid=true]:border-red-500/80"
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-200/50 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white focus-visible:outline-2 focus-visible:outline-[#01a59c]"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeSlashIcon className="size-5" /> : <EyeIcon className="size-5" />}
                </button>
              </div>
              {capsLock && (
                <p role="status" className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <ExclamationTriangleIcon className="size-4 shrink-0" />
                  Bloq Mayús está activado
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="login-remember" className="inline-flex cursor-pointer select-none items-center gap-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
                <input
                  id="login-remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="size-4 rounded border-slate-300 dark:border-white/20 bg-white dark:bg-white/10 cursor-pointer accent-[#01a59c]"
                />
                <span>Recordar usuario</span>
              </label>
            </div>

            {error && (
              <div id="login-error" role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-950/50 p-3.5 text-xs text-red-700 dark:text-red-300">
                <ExclamationCircleIcon className="size-4 shrink-0 text-red-500 dark:text-red-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading || !form.usuario.trim() || !form.password}
              className="relative group overflow-hidden inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#01a59c] to-[#35605a] dark:from-[#06b6a4] dark:to-[#1f6f64] text-base font-semibold text-white shadow-[0_10px_25px_rgba(1,165,156,0.3)] transition-all duration-300 hover:shadow-[0_12px_30px_rgba(1,165,156,0.45)] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
            >
              <div className="absolute inset-0 bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity" />
              {loading ? (
                <>
                  <span className="size-[18px] rounded-full border-2 border-white/35 border-t-white animate-spin" aria-hidden="true" />
                  <span>Verificando credenciales…</span>
                </>
              ) : (
                <span>Ingresar al Sistema</span>
              )}
            </button>
          </form>
        </div>

        {/* ─── Footer & Barra de Estado Fiscal ─── */}
        <footer className="mt-6 flex flex-col items-center gap-3 text-center text-xs text-slate-500 dark:text-slate-400">

          <a
            href="https://www.contatrib.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 opacity-80 hover:opacity-100 transition text-[11px]"
          >
            <span>Powered by</span>
            <span className="rounded-md bg-white px-2 py-0.5 shadow-sm border border-slate-200/60">
              <img src={LOGO_PARTNER} alt="Escobedo Medina" className="h-5 w-auto object-contain" />
            </span>
          </a>
          <p className="text-[11px]">© {year} MIFACTURA Perú. Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  )
}
