import { useState } from 'react'
import { EnvelopeIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

export default function Configuracion() {
  const [form, setForm] = useState({
    destinatario: '',
    asunto: '',
    mensaje: '',
  })
  const [status, setStatus] = useState(null) // 'loading' | 'success' | 'error'
  const [respuesta, setRespuesta] = useState('')

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSend = async (e) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (res.ok) {
        setStatus('success')
        setRespuesta(json.message ?? 'Correo enviado correctamente.')
        setForm({ destinatario: '', asunto: '', mensaje: '' })
      } else {
        setStatus('error')
        setRespuesta(json.error ?? 'Error al enviar el correo.')
      }
    } catch (err) {
      setStatus('error')
      setRespuesta('No se pudo conectar con el servidor de correo.')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-0.5">Envío de correos y ajustes del sistema</p>
      </div>

      {/* Envío de correo */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <EnvelopeIcon className="h-5 w-5 text-primary-600" />
          <h2 className="text-base font-semibold text-gray-800">Enviar correo</h2>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destinatario</label>
            <input
              type="email" name="destinatario"
              value={form.destinatario} onChange={handleChange}
              placeholder="correo@ejemplo.com"
              required className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
            <input
              type="text" name="asunto"
              value={form.asunto} onChange={handleChange}
              placeholder="Asunto del correo"
              required className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
            <textarea
              name="mensaje" rows={5}
              value={form.mensaje} onChange={handleChange}
              placeholder="Escribe el contenido del correo..."
              required className="input-field resize-none"
            />
          </div>

          {status === 'success' && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-3 py-2 text-sm">
              <CheckCircleIcon className="h-4 w-4 shrink-0" />
              {respuesta}
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-lg px-3 py-2 text-sm">
              <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
              {respuesta}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="btn-primary"
          >
            {status === 'loading' ? 'Enviando…' : 'Enviar correo'}
          </button>
        </form>
      </div>

      {/* Info SMTP */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">Configuración SMTP (server/.env)</h3>
        <pre className="text-xs text-blue-700 bg-blue-100 rounded p-3 overflow-x-auto">
{`EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_app_password
EMAIL_FROM="Sistema Market <tu_correo@gmail.com>"`}
        </pre>
        <p className="text-xs text-blue-600 mt-2">
          Levanta el servidor con: <code className="bg-blue-100 px-1 rounded">npm run server</code>
        </p>
      </div>
    </div>
  )
}
