require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const nodemailer = require('nodemailer')

const app  = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5175' }))
app.use(express.json())

// ─── Transporte Nodemailer ────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true para puerto 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// ─── Rutas ────────────────────────────────────────────────────────────────────

/** GET /api/health */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

/** POST /api/email/send */
app.post('/api/email/send', async (req, res) => {
  const { destinatario, asunto, mensaje } = req.body

  if (!destinatario || !asunto || !mensaje) {
    return res.status(400).json({ error: 'Faltan campos requeridos: destinatario, asunto, mensaje.' })
  }

  try {
    const info = await transporter.sendMail({
      from:    process.env.EMAIL_FROM || `"Sistema Market" <${process.env.EMAIL_USER}>`,
      to:      destinatario,
      subject: asunto,
      text:    mensaje,
      html:    `<div style="font-family:Inter,sans-serif;padding:24px;">
                  <h2 style="color:#1e293b;">${asunto}</h2>
                  <p style="color:#475569;">${mensaje.replace(/\n/g, '<br/>')}</p>
                  <hr style="margin-top:32px;border-color:#e2e8f0;"/>
                  <p style="color:#94a3b8;font-size:12px;">Enviado desde Sistema Market — MiFacturaPeru</p>
                </div>`,
    })

    console.log('✅ Correo enviado:', info.messageId)
    res.json({ message: 'Correo enviado correctamente.', messageId: info.messageId })
  } catch (err) {
    console.error('❌ Error Nodemailer:', err.message)
    res.status(500).json({ error: `Error al enviar: ${err.message}` })
  }
})

// ─── Inicio ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor de correo corriendo en http://localhost:${PORT}`)
})
