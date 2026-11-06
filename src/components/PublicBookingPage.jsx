import { useState } from 'react'

const TIME_SLOTS = [
  '09:00 AM', '10:15 AM', '11:30 AM', '01:00 PM', '02:15 PM', '03:30 PM', '04:45 PM', '06:00 PM'
]

export default function PublicBookingPage({ shop, t, onBookingConfirmed, lang = 'es' }) {
  const [service, setService] = useState(() => shop.services?.find((item) => item.active) || null)
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(TIME_SLOTS[0])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [bookingCode, setBookingCode] = useState('')
  const [notifying, setNotifying] = useState(false)
  const [notified, setNotified] = useState(false)

  const sim = (translations[lang] || translations.es).simulado

  const activeServices = shop.services ? shop.services.filter((s) => s.active) : []

  const handleBook = (e) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return
    if (!service) return
    const code = 'BKG-' + Math.floor(1000 + Math.random() * 9000)
    setBookingCode(code)
    setConfirmed(true)
    setNotifying(true)
    setTimeout(() => {
      setNotifying(false)
      setNotified(true)
      if (onBookingConfirmed) {
        onBookingConfirmed({
          id: code,
          shopName: shop.name,
          client: name,
          service: service.name,
          date,
          time,
          price: service.price,
          simulado: true
        })
      }
    }, 900)
  }

  const handleReset = () => {
    setConfirmed(false)
    setNotified(false)
    setName('')
    setPhone('')
    setBookingCode('')
  }

  return (
    <div className="public-page">
      <header className="public-header">
        <div className="brand-wrap">
          <span className="agendo-badge">Reservado con Agendo</span>
          <span className="powered">{t.publicPage.powered}</span>
        </div>
        <div className="shop-info">
          <h1>{shop.name}</h1>
          <p className="sub">{shop.settings?.whatsapp || ''}</p>
        </div>
      </header>

      {!confirmed ? (
        <form onSubmit={handleBook} className="booking-form">
          <section className="form-step">
            <span className="step-badge">{t.publicPage.chooseService}</span>
            <h2>Selecciona un servicio</h2>
            <div className="service-options">
              {activeServices.map((svc) => (
                <button
                  key={svc.id}
                  type="button"
                  className={`service-btn ${service?.id === svc.id ? 'active' : ''}`}
                  onClick={() => setService(svc)}
                >
                  <span className="svc-name">{svc.name}</span>
                  <span className="svc-meta">${svc.price} USD · {svc.duration} min</span>
                </button>
              ))}
            </div>
          </section>

          <section className="form-step">
            <span className="step-badge">{t.publicPage.chooseDate}</span>
            <h2>Elige la fecha</h2>
            <input
              type="date"
              className="date-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </section>

          <section className="form-step">
            <span className="step-badge">{t.publicPage.chooseTime}</span>
            <h2>Selecciona el horario</h2>
            <div className="time-slots">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`time-slot ${time === slot ? 'active' : ''}`}
                  onClick={() => setTime(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>
          </section>

          <section className="form-step">
            <span className="step-badge">{t.publicPage.chooseName}</span>
            <h2>Tus datos</h2>
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Nombre completo</label>
                <input
                  className="form-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t.publicPage.choosePhone}</label>
                <input
                  className="form-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  required
                />
              </div>
            </div>
          </section>

          <div className="summary-bar">
            <span className="summary-label">Total estimado</span>
            <strong>${service ? service.price : 0} USD</strong>
          </div>

          <button type="submit" className="book-btn" disabled={!service || !name.trim() || !phone.trim()}>
            {t.publicPage.bookNow}
          </button>

          <div className="source-note">
            <span className="simulado-badge">{sim.badge}</span>
            Reserva de demostración simulada. No es una cita real.
          </div>
        </form>
      ) : (
        <div className="confirm-view">
          <div className="success-badge">✓</div>
          <span className="step-badge">Reserva confirmada</span>
          <h2>{t.publicPage.confirmed}</h2>
          <p className="code">{t.publicPage.code} <strong>{bookingCode}</strong></p>
          <div className="receipt-card">
            <div className="receipt-row"><span>Cliente:</span> <strong>{name}</strong></div>
            <div className="receipt-row"><span>Servicio:</span> <strong>{service.name} (${service.price})</strong></div>
            <div className="receipt-row"><span>Fecha y hora:</span> <strong>{date} {time}</strong></div>
            <div className="receipt-row"><span>Barbería:</span> <strong>{shop.name}</strong></div>
            <div className="receipt-row"><span>Teléfono:</span> <strong>{phone}</strong></div>
          </div>
          <div className="notify-box">
            <span className={`notify-dot ${notified ? 'active' : ''}`} />
            {notifying ? 'Notificando al barbero...' : notified ? 'Notificación enviada al barbero ✓' : ''}
          </div>
          <button type="button" className="reset-btn" onClick={handleReset}>
            Nueva reserva
          </button>
          <div className="source-note">
            <span className="simulado-badge">{sim.badge}</span>
            Datos de demostración simulados. Reserva ficticia.
          </div>
        </div>
      )}
    </div>
  )
}

const translations = {
  es: {
    publicPage: {
      title: 'Reservar cita',
      subtitle: 'Selecciona tu servicio, fecha y horario.',
      chooseService: 'Servicio',
      chooseDate: 'Fecha',
      chooseTime: 'Horario',
      chooseName: 'Tu nombre',
      choosePhone: 'Teléfono',
      bookNow: 'Reservar cita',
      confirming: 'Confirmando...',
      confirmed: 'Reserva confirmada',
      code: 'Código de reserva:',
      receipt: 'Comprobante de reserva (SIMULADO)',
      badge: 'Reservado con Agendo',
      powered: 'Página de reservas creada con Agendo',
      simLabel: 'SIMULADO'
    },
    simulado: {
      badge: 'SIMULADO',
      notice: 'Datos de demostración simulados. No son reales.'
    }
  },
  en: {
    publicPage: {
      title: 'Book an appointment',
      subtitle: 'Choose your service, date and time.',
      chooseService: 'Service',
      chooseDate: 'Date',
      chooseTime: 'Time',
      chooseName: 'Your name',
      choosePhone: 'Phone',
      bookNow: 'Book appointment',
      confirming: 'Confirming...',
      confirmed: 'Appointment confirmed',
      code: 'Booking code:',
      receipt: 'Booking receipt (SIMULATED)',
      badge: 'Booked with Agendo',
      powered: 'Booking page created with Agendo',
      simLabel: 'SIMULATED'
    },
    simulado: {
      badge: 'SIMULATED',
      notice: 'Simulated demo data. Not real.'
    }
  }
}
