import { useState } from 'react'
import { useAuthStore } from '../../../store/useAuthStore.js'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../../../components/ThemeToggle.jsx'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function Login() {
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({ usuario: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(form.usuario, form.password)

    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.message || 'Credenciales incorrectas.')
    }

    setLoading(false)
  }
  const logoEmpresa = new URL('/images/LogoMIFACTURA.png', import.meta.url).href;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* Botón flotante para cambiar de tema */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img
              src={logoEmpresa}
              alt="LOGO EMPRESA"
              className="h-14 sm:h-16 object-contain"
            />
          </div>          {/* Quitamos text-white para que herede del body/theme o usamos una clase que cambie sola */}
          <h1 className="mt-3 text-2xl font-bold">Sistema Market</h1>
          <p className="text-gray-400 text-sm mt-1">Panel de Administración</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <input
              type="text" name="usuario"
              value={form.usuario} onChange={handleChange}
              placeholder="Ej: user"
              required className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} name="password"
                value={form.password} onChange={handleChange}
                placeholder="••••••••"
                required className="input-field pr-10"
              />
              <button
                type="button"
                id="toggle-password-visibility"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
        </form>
      </div>

      <footer className="w-full py-4 px-2 backdrop-blur-sm z-10" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex flex-col items-center space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Powered by</span>
            <a
              href="https://www.contatrib.com/"
              target="_blank"
              rel="noopener noreferrer"
              title="www.contatrib.com"
              className="hover:opacity-80 transition-opacity"
            >
              <img
                src="/images/logoEM2.png"
                alt="Logo Escobedo"
                className="h-8 object-contain"
              />
            </a>
          </div>

          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            © 2026 MIFACTURA. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
