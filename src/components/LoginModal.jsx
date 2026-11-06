import { useState } from 'react'
import db from '../../db.json'

export default function LoginModal({ isOpen, onClose, onLoginSuccess, lang }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const adminUsers = db.adminUsers || []

  function handleLogin(e) {
    e.preventDefault()
    setError('')

    const foundUser = adminUsers.find(
      (u) =>
        u.email.toLowerCase() === email.trim().toLowerCase() &&
        u.password === password
    )

    if (foundUser) {
      onLoginSuccess(foundUser)
      onClose()
    } else {
      setError(
        lang === 'es'
          ? 'Correo o contraseña incorrectos. Por favor verifica tus credenciales.'
          : 'Invalid email or password. Please verify your credentials.'
      )
    }
  }

  function handleQuickFill(user) {
    setEmail(user.email)
    setPassword(user.password)
    setError('')
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card login-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar ventana">
          ✕
        </button>

        <div className="modal-header">
          <span className="modal-eyebrow">BARBER SHOP · ADMIN ACCESS</span>
          <h2>{lang === 'es' ? 'Iniciar Sesión' : 'Administrator Login'}</h2>
          <p>
            {lang === 'es'
              ? 'Ingresa tus credenciales para acceder al panel de control.'
              : 'Enter your credentials to access the administrative dashboard.'}
          </p>
        </div>

        {/* Demo credentials helper */}
        <div className="demo-credentials-box">
          <strong>
            {lang === 'es' ? '🔑 Credenciales de demostración (db.json):' : '🔑 Demo credentials (db.json):'}
          </strong>
          {adminUsers.map((u) => (
            <div key={u.id} style={{ margin: '6px 0' }}>
              <span>{u.role}: </span>
              <code>{u.email}</code> / <code>{u.password}</code>
              <button
                type="button"
                className="quick-fill-btn"
                style={{ marginLeft: '8px' }}
                onClick={() => handleQuickFill(u)}
              >
                {lang === 'es' ? 'Usar' : 'Use'}
              </button>
            </div>
          ))}
        </div>

        {error && <div className="login-error-alert">{error}</div>}

        <form onSubmit={handleLogin} className="booking-form">
          <div className="form-group">
            <label className="form-label">{lang === 'es' ? 'Correo Electrónico' : 'Email Address'}</label>
            <input
              type="email"
              className="modal-input"
              placeholder="admin@barbershop.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{lang === 'es' ? 'Contraseña' : 'Password'}</label>
            <input
              type="password"
              className="modal-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="barber-btn-appointment"
            style={{ width: '100%', marginTop: '12px', padding: '14px' }}
          >
            {lang === 'es' ? 'INGRESAR AL PANEL' : 'LOG IN TO DASHBOARD'}
          </button>
        </form>
      </div>
    </div>
  )
}

