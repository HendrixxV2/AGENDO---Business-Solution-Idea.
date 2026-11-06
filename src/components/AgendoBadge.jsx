import { useState } from 'react'

export default function AgendoBadge({ t, lang, onRegister }) {
  const [copied, setCopied] = useState(false)

  const cycle = (translations[lang] || translations.es).badge.cycle

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="agendo-badge-wrap">
      <div className="badge-card">
        <div className="badge-header">
          <span className="badge-label">{t.badge.label}</span>
          <span className="badge-dot" />
        </div>
        <p className="badge-desc">
          {lang === 'es'
            ? 'Los clientes que reservan aquí ven esta insignia y pueden crear su propia página en Agendo.'
            : 'Customers who book here see this badge and can create their own page on Agendo.'}
        </p>
        <div className="badge-actions">
          <button type="button" className="badge-btn primary" onClick={handleCopy}>
            {copied ? '¡Enlace copiado!' : 'Copiar enlace'}
          </button>
          <button
            type="button"
            className="badge-btn secondary"
            onClick={() => {
              window.open('https://wa.me/?text=' + encodeURIComponent('Reserva tu cita aquí: ' + window.location.href), '_blank')
            }}
          >
            📱 WhatsApp
          </button>
          <button type="button" className="badge-btn register" onClick={onRegister}>
            {t.badge.cta}
          </button>
        </div>
      </div>

      <div className="cycle-card">
        <span className="cycle-title">{t.badge.cycleTitle}</span>
        <div className="cycle-steps">
          {[
            { key: 'barbershop', icon: '💈' },
            { key: 'clients', icon: '👥' },
            { key: 'badge', icon: '🏅' },
            { key: 'newBarbers', icon: '🪒' },
            { key: 'newShops', icon: '🏪' }
          ].map((step, idx) => (
            <div key={step.key} className="cycle-step">
              <span className="cycle-icon">{step.icon}</span>
              <span className="cycle-text">{cycle[step.key]}</span>
              {idx < 4 && <span className="cycle-arrow">→</span>}
            </div>
          ))}
        </div>
        <p className="cycle-note">
          {lang === 'es'
            ? 'Barbería activa → Clientes → Insignia → Nuevos barberos → Nuevas barberías.'
            : 'Active barbershop → Clients → Badge → New barbers → New barbershops.'}
        </p>
      </div>
    </div>
  )
}

const translations = {
  es: {
    badge: {
      label: 'Reservado con Agendo',
      cta: 'Crea tu página de reservas',
      cycleTitle: 'Ciclo de adquisición',
      cycle: {
        barbershop: 'Barbería activa',
        clients: 'Clientes',
        badge: 'Insignia',
        newBarbers: 'Nuevos barberos',
        newShops: 'Nuevas barberías'
      }
    }
  },
  en: {
    badge: {
      label: 'Booked with Agendo',
      cta: 'Create your booking page',
      cycleTitle: 'Acquisition cycle',
      cycle: {
        barbershop: 'Active barbershop',
        clients: 'Clients',
        badge: 'Badge',
        newBarbers: 'New barbers',
        newShops: 'New barbershops'
      }
    }
  }
}