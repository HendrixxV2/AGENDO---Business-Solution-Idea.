import { useState } from 'react'

const TIME_SLOTS = [
  '09:00 AM', '10:15 AM', '11:30 AM', '01:00 PM', '02:15 PM', '03:30 PM', '04:45 PM', '06:00 PM'
]

export default function BookingModal({ isOpen, onClose, t }) {
  const [service, setService] = useState('haircut')
  const [barber, setBarber] = useState('marcus')
  const [date, setDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [time, setTime] = useState('11:30 AM')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [bookingCode, setBookingCode] = useState('')

  if (!isOpen) return null

  const selectedService = t.services.find((s) => s.id === service) || t.services[0]
  const selectedBarber = t.barbers.find((b) => b.id === barber) || t.barbers[0]

  function handleSubmit(e) {
    e.preventDefault()
    const code = 'BS-' + Math.floor(1000 + Math.random() * 9000)
    setBookingCode(code)
    setConfirmed(true)
  }

  function handleReset() {
    setConfirmed(false)
    setName('')
    setPhone('')
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        {!confirmed ? (
          <>
            <div className="modal-header">
              <span className="modal-eyebrow">{t.eyebrow}</span>
              <h2>{t.title}</h2>
              <p>{t.subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="booking-form">
              <div className="form-group">
                <label className="form-label">{t.step1}</label>
                <div className="services-grid">
                  {t.services.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      className={`service-option ${service === s.id ? 'active' : ''}`}
                      onClick={() => setService(s.id)}
                    >
                      <div className="service-info">
                        <strong>{s.name}</strong>
                        <span>{s.duration} · {s.desc}</span>
                      </div>
                      <span className="service-price">${s.price}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">{t.step2}</label>
                  <select
                    className="modal-select"
                    value={barber}
                    onChange={(e) => setBarber(e.target.value)}
                  >
                    {t.barbers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t.step3}</label>
                  <input
                    type="date"
                    className="modal-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t.step4}</label>
                <div className="time-slots-grid">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      type="button"
                      key={slot}
                      className={`time-slot-btn ${time === slot ? 'active' : ''}`}
                      onClick={() => setTime(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">{t.step5}</label>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder={t.namePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t.step6}</label>
                  <input
                    type="tel"
                    className="modal-input"
                    placeholder={t.phonePlaceholder}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="booking-summary-bar">
                <div>
                  <span className="summary-label">{t.totalEstimated}</span>
                  <strong>${selectedService?.price} USD</strong>
                </div>
                <button type="submit" className="barber-btn-appointment modal-submit-btn">
                  {t.confirmBtn}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="booking-success-view">
            <div className="success-icon-badge">✓</div>
            <span className="modal-eyebrow">{t.successBadge}</span>
            <h2>{t.successTitle}</h2>
            <p className="success-code-label">
              {t.successCode} <strong>{bookingCode}</strong>
            </p>

            <div className="booking-receipt-card">
              <div className="receipt-row">
                <span>{t.labelClient}</span>
                <strong>{name}</strong>
              </div>
              <div className="receipt-row">
                <span>{t.labelService}</span>
                <strong>{selectedService?.name} (${selectedService?.price})</strong>
              </div>
              <div className="receipt-row">
                <span>{t.labelBarber}</span>
                <strong>{selectedBarber?.name}</strong>
              </div>
              <div className="receipt-row">
                <span>{t.labelDateTime}</span>
                <strong>{date} {time}</strong>
              </div>
              <div className="receipt-row">
                <span>{t.labelPhone}</span>
                <strong>{phone}</strong>
              </div>
            </div>

            <button type="button" className="barber-btn-appointment" onClick={handleReset}>
              {t.finishBtn}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
