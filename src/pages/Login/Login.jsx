import { useState } from 'react'
import { useAuthStore } from '../../store/useAuthStore.js'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { login } = useAuthStore()
  const navigate  = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    // TODO: reemplazar con llamada real a API
    await new Promise((r) => setTimeout(r, 800))
    if (form.email === 'admin@sistemmarket.pe' && form.password === 'admin123') {
      login({ nombre: 'Administrador', rol: 'admin', email: form.email }, 'mock-token')
      navigate('/dashboard')
    } else {
      setError('Credenciales incorrectas. Intenta con admin@sistemmarket.pe / admin123')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🏪</span>
          <h1 className="mt-3 text-2xl font-bold text-white">Sistema Market</h1>
          <p className="text-gray-400 text-sm mt-1">Panel de Administración</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input
              type="email" name="email"
              value={form.email} onChange={handleChange}
              placeholder="admin@sistemmarket.pe"
              required className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password" name="password"
              value={form.password} onChange={handleChange}
              placeholder="••••••••"
              required className="input-field"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
