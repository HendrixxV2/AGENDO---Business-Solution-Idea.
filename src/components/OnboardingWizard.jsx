import { useState, useCallback } from 'react'
import db from '../../db.json'
import { generateWelcomeMessage } from '../services/deepseek'

const DAYS = [
  { key: 'monday' },
  { key: 'tuesday' },
  { key: 'wednesday' },
  { key: 'thursday' },
  { key: 'friday' },
  { key: 'saturday' },
  { key: 'sunday' }
]

const DEFAULT_SERVICES = [
  { id: 'svc-haircut', name: 'Corte de caballero', price: 12, duration: 30, active: true },
  { id: 'svc-beard', name: 'Barba y perfilado', price: 10, duration: 25, active: true },
  { id: 'svc-combo', name: 'Corte + Barba', price: 18, duration: 50, active: true }
]

const EMPTY_DAY = { open: '09:00', close: '18:00', active: true }

export default function OnboardingWizard({ onFinish, lang, user }) {
  const t = translations[lang] || translations.es

  const [step, setStep] = useState(1)
  const [shopName, setShopName] = useState('')
  const [services, setServices] = useState(DEFAULT_SERVICES)
  const [schedule, setSchedule] = useState(() => {
    const days = {}
    DAYS.forEach((d) => { days[d.key] = { ...EMPTY_DAY } })
    return days
  })
  const [skipFiscal, setSkipFiscal] = useState(true)
  const [published, setPublished] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [welcomeSource, setWelcomeSource] = useState('')
  const [publishedShop, setPublishedShop] = useState(null)
  const [error, setError] = useState('')

  const existing = db.barbershops?.find((b) => b.ownerId === user?.id)

  const isValidPrice = (value) => {
    const n = Number(value)
    return Number.isFinite(n) && n >= 8 && n <= 15
  }

  const handleServiceChange = (index, field, value) => {
    setServices((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleToggleService = (index) => {
    setServices((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], active: !next[index].active }
      return next
    })
  }

  const handleDayChange = (dayKey, field, value) => {
    setSchedule((prev) => ({ ...prev, [dayKey]: { ...prev[dayKey], [field]: value } }))
  }

  const handleToggleDay = (dayKey) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], active: !prev[dayKey].active }
    }))
  }

  const goNext = useCallback(() => {
    if (step === 1) {
      const active = services.filter((s) => s.active)
      if (active.length === 0) {
        setError(lang === 'es' ? 'Agrega al menos un servicio activo.' : 'Add at least one active service.')
        return
      }
      const invalid = active.find((s) => !isValidPrice(s.price) || !Number.isFinite(Number(s.duration)) || Number(s.duration) <= 0)
      if (invalid) {
        setError(lang === 'es' ? 'Revisa precios ($8–$15) y duraciones de los servicios activos.' : 'Check prices ($8–$15) and durations of active services.')
        return
      }
      setError('')
      setStep(2)
    } else if (step === 2) {
      setError('')
      setStep(3)
    }
  }, [step, services, lang])

  const goBack = () => setStep((prev) => Math.max(1, prev - 1))

  const handlePublish = async (e) => {
    e.preventDefault()
    setPublishing(true)
    setError('')
    await new Promise((resolve) => setTimeout(resolve, 700))
    const slug = (shopName || 'mi-barberia')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    const shop = {
      id: `shop-${Date.now()}`,
      ownerId: user?.id || 'user-demo',
      ownerName: user?.name || shopName || 'Barbero Demo',
      name: shopName || 'Mi Barbería',
      slug,
      published: true,
      publishedAt: new Date().toISOString(),
      trialStartedAt: new Date().toISOString(),
      plan: 'trial',
      fiscalDataSkipped: skipFiscal,
      services,
      weeklySchedule: schedule,
      settings: { currency: 'USD', timezone: 'America/Mexico_City' }
    }
    try {
      const { message, source } = await generateWelcomeMessage({
        shopName: shop.name,
        services,
        whatsapp: ''
      })
      setWelcomeMessage(message)
      setWelcomeSource(source)
    } catch {
      setWelcomeMessage('')
      setWelcomeSource('offline')
    }
    setPublishedShop(shop)
    setPublished(true)
    setPublishing(false)
  }

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100

  if (published) {
    const publicUrl = `${window.location.origin}/reservas/${publishedShop?.slug || 'mi-barberia'}`
    return (
      <div className="onboarding-publish-view">
        <div className="onboarding-card">
          <div className="success-badge">✓</div>
          <h2>{t.published}</h2>
          <p>
             {t.pageUrl} <strong className="page-link">{publicUrl}</strong>
          </p>
          <div className="share-actions">
            <button type="button" className="share-btn whatsapp" onClick={() => shareWhatsApp(publicUrl)}>
              📱 {t.whatsapp}
            </button>
            <button type="button" className="share-btn copy" onClick={() => copyLink(publicUrl)}>
              🔗 {t.copyLink}
            </button>
            <button type="button" className="share-btn instagram" onClick={() => shareInstagram(publicUrl)}>
              📸 {t.instagram}
            </button>
          </div>
          {welcomeMessage && (
            <div className="welcome-preview">
              <span className="welcome-source">[{welcomeSource === 'deepseek' ? 'DeepSeek' : 'Plantilla'}]</span>
              <p className="welcome-text">{welcomeMessage.replace('{{LINK}}', publicUrl)}</p>
            </div>
          )}
          <div className="source-note">
            <span className="simulado-badge">SIMULADO</span>
            {lang === 'es' ? 'Publicación y reservas de demostración.' : 'Demo publishing and bookings.'}
          </div>
          <button type="button" className="primary-btn" onClick={() => onFinish(publishedShop)}>
            {lang === 'es' ? 'Ir a mi página pública' : 'Go to my public page'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="onboarding-wrapper">
      <div className="onboarding-card">
        <header className="onboarding-header">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p className="subtitle">{t.subtitle}</p>
        </header>

        <div className="onboarding-progress">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-steps">
            {[
              { num: '1', label: t.stepServices, active: step >= 1, done: step > 1 },
              { num: '2', label: t.stepSchedule, active: step >= 2, done: step > 2 },
              { num: '3', label: t.stepPublish, active: step === 3, done: false }
            ].map((s) => (
              <div key={s.num} className={`progress-step ${s.done ? 'done' : ''} ${s.active ? 'active' : ''}`}>
                <span className="step-num">{s.num}</span>
                <span className="step-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {error && <div className="onboarding-error">{error}</div>}

        {step === 1 && (
          <section className="onboarding-section">
            <span className="section-title">{t.stepServices}</span>
            <p className="section-hint">
              {lang === 'es'
                ? 'Plantillas editables: corte, barba y corte con barba. Precio de referencia entre $8 y $15.'
                : 'Editable templates: haircut, beard and haircut + beard. Reference price between $8 and $15.'}
            </p>
            <div className="services-grid">
              {services.map((svc, index) => (
                <div key={svc.id} className="service-card">
                  <div className="service-header">
                    <label className="service-toggle">
                      <input
                        type="checkbox"
                        checked={svc.active}
                        onChange={() => handleToggleService(index)}
                      />
                      <span className="toggle-thumb" />
                    </label>
                    <button
                      type="button"
                      className="remove-service"
                      onClick={() => setServices((prev) => prev.filter((_, i) => i !== index))}
                      aria-label="Eliminar servicio"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="service-fields">
                    <div className="form-group">
                      <label className="form-label">Nombre</label>
                      <input
                        className="form-input"
                        value={svc.name}
                        onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                        placeholder={lang === 'es' ? 'Ej. Corte de caballero' : "E.g. Gentleman's haircut"}
                      />
                    </div>
                    <div className="form-row-2">
                      <div className="form-group">
                        <label className="form-label">{t.priceLabel}</label>
                        <input
                          className="form-input"
                          type="number"
                          min="8"
                          max="15"
                          step="1"
                          value={svc.price === undefined ? '' : svc.price}
                          onChange={(e) => handleServiceChange(index, 'price', e.target.value)}
                        />
                        <span className="field-hint">{t.priceHint}</span>
                      </div>
                      <div className="form-group">
                        <label className="form-label">{t.durationLabel}</label>
                        <input
                          className="form-input"
                          type="number"
                          min="15"
                          max="120"
                          step="5"
                          value={svc.duration === undefined ? '' : svc.duration}
                          onChange={(e) => handleServiceChange(index, 'duration', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <span className={`active-pill ${svc.active ? 'active' : 'inactive'}`}>
                    {svc.active ? t.activeLabel : (lang === 'es' ? 'Inactivo' : 'Inactive')}
                  </span>
                </div>
              ))}
               <button type="button" className="add-service" onClick={() => setServices((prev) => [...prev, { id: `svc-${Date.now()}`, name: '', price: 12, duration: 30, active: true }])}>
                + {lang === 'es' ? 'Agregar servicio' : 'Add service'}
              </button>
            </div>
            {existing && (
              <div className="existing-shop">
                <span className="simulado-badge">SIMULADO</span>
                {lang === 'es' ? 'Carga datos de la tienda existente (Ricardo).' : 'Loads existing shop data (Ricardo demo).'}
              </div>
            )}
          </section>
        )}

        {step === 2 && (
          <section className="onboarding-section">
            <span className="section-title">{t.stepSchedule}</span>
            <p className="section-hint">
              {lang === 'es'
                ? 'Plantilla de horario semanal editable. Activa/desactiva días y ajusta horas.'
                : 'Editable weekly schedule template. Activate/deactivate days and set hours.'}
            </p>
            <div className="schedule-grid">
              {DAYS.map((day) => {
                const dayData = schedule[day.key] || EMPTY_DAY
                const dayLabel = (t.dayShort && t.dayShort[day.key]) || day.key
                return (
                  <div key={day.key} className="day-card">
                    <div className="day-header">
                      <label className="day-toggle">
                        <input
                          type="checkbox"
                          checked={dayData.active}
                          onChange={() => handleToggleDay(day.key)}
                        />
                        <span className="toggle-thumb" />
                      </label>
                      <span className="day-name">{dayLabel}</span>
                    </div>
                    <div className="day-times">
                      <div className="form-group">
                        <label className="form-label">{t.openLabel}</label>
                        <input
                          className="form-input"
                          type="time"
                          value={dayData.open}
                          onChange={(e) => handleDayChange(day.key, 'open', e.target.value)}
                          disabled={!dayData.active}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{t.closeLabel}</label>
                        <input
                          className="form-input"
                          type="time"
                          value={dayData.close}
                          onChange={(e) => handleDayChange(day.key, 'close', e.target.value)}
                          disabled={!dayData.active}
                        />
                      </div>
                    </div>
                    {!dayData.active && <span className="day-closed">{t.closedLabel}</span>}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="onboarding-section">
            <span className="section-title">{t.stepPublish}</span>
            <p className="section-hint">
              {lang === 'es'
                ? 'Genera tu página pública de reservas y confírmala. Los datos fiscales son opcionales durante la prueba.'
                : 'Generate your public booking page and confirm it. Tax data is optional during the trial.'}
            </p>
            <form onSubmit={handlePublish} className="publish-form">
              <div className="form-group">
                <label className="form-label">
                  {lang === 'es' ? 'Nombre de tu barbería' : 'Barbershop name'}
                </label>
                <input
                  className="form-input"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder={lang === 'es' ? 'Ej. Barbería El Corte' : "E.g. El Corte Barbershop"}
                  required
                />
              </div>
              <div className="form-group fiscal-group">
                <label className="form-label checkbox-label">
                  <input
                    type="checkbox"
                    checked={skipFiscal}
                    onChange={(e) => setSkipFiscal(e.target.checked)}
                  />
                  {t.skipFiscal}
                </label>
                <span className="field-hint">{t.fiscalNote}</span>
              </div>
              <div className="form-actions">
                <button type="button" className="secondary-btn" onClick={goBack}>
                  {lang === 'es' ? '← Anterior' : '← Back'}
                </button>
                <button type="submit" className="primary-btn" disabled={publishing}>
                  {publishing ? t.publishing : t.finish}
                </button>
              </div>
            </form>
          </section>
        )}

        <footer className="onboarding-footer">
          {step > 1 && (
            <button type="button" className="ghost-btn" onClick={goBack}>
              {lang === 'es' ? '← Anterior' : '← Back'}
            </button>
          )}
          {step < 3 && (
            <button type="button" className="primary-btn" onClick={goNext}>
              {lang === 'es' ? 'Siguiente →' : 'Next →'}
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}

function shareWhatsApp(link) {
  const text = encodeURIComponent('Reserva tu cita en mi barbería. ¡Agenda tu horario aquí!')
  const url = encodeURIComponent(link)
  window.open(`https://wa.me/?text=${text}%20${url}`, '_blank')
}

function copyLink(link) {
  navigator.clipboard.writeText(link).then(() => {
    alert('Enlace copiado al portapapeles / Link copied to clipboard')
  })
}

function shareInstagram() {
  window.open('https://www.instagram.com/', '_blank')
}

const translations = {
  es: {
    eyebrow: 'AGENDO · ONBOARDING RÁPIDO',
    title: 'Configura tu barbería en menos de 5 minutos',
    subtitle: 'Publica tu página de reservas, comparte el enlace y recibe tu primera cita.',
    stepServices: '1. Servicios y precios',
    stepSchedule: '2. Horario semanal',
    stepPublish: '3. Publicar y compartir',
    serviceHaircut: 'Corte de caballero',
    serviceBeard: 'Barba y perfilado',
    serviceCombo: 'Corte + Barba',
    priceLabel: 'Precio (USD)',
    priceHint: 'Referencia entre $8 y $15',
    durationLabel: 'Duración (minutos)',
    activeLabel: 'Servicio activo',
    scheduleLabel: 'Horario semanal',
    dayShort: { monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié', thursday: 'Jue', friday: 'Vie', saturday: 'Sáb', sunday: 'Dom' },
    openLabel: 'Abre', closeLabel: 'Cierra', closedLabel: 'Cerrado',
    fiscalNote: 'Datos fiscales opcionales hasta que finalice la prueba de 14 días.',
    skipFiscal: 'Omitir datos fiscales por ahora',
    finish: 'Finalizar configuración y publicar',
    publishing: 'Publicando...',
    published: '¡Tu página está publicada!',
    shareTitle: 'Comparte tu enlace de reservas',
    whatsapp: 'Compartir por WhatsApp',
    copyLink: 'Copiar enlace',
    instagram: 'Publicar en Instagram',
    pageUrl: 'Tu página pública:'
  },
  en: {
    eyebrow: 'AGENDO · QUICK ONBOARDING',
    title: 'Set up your barbershop in under 5 minutes',
    subtitle: 'Publish your booking page, share the link and get your first appointment.',
    stepServices: '1. Services and prices',
    stepSchedule: '2. Weekly schedule',
    stepPublish: '3. Publish and share',
    serviceHaircut: "Gentleman's haircut",
    serviceBeard: 'Beard trim and lineup',
    serviceCombo: 'Haircut + Beard',
    priceLabel: 'Price (USD)',
    priceHint: 'Reference between $8 and $15',
    durationLabel: 'Duration (minutes)',
    activeLabel: 'Active service',
    scheduleLabel: 'Weekly schedule',
    dayShort: { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' },
    openLabel: 'Opens', closeLabel: 'Closes', closedLabel: 'Closed',
    fiscalNote: 'Tax data optional until the 14-day trial ends.',
    skipFiscal: 'Skip tax data for now',
    finish: 'Finish setup and publish',
    publishing: 'Publishing...',
    published: 'Your page is now published!',
    shareTitle: 'Share your booking link',
    whatsapp: 'Share on WhatsApp',
    copyLink: 'Copy link',
    instagram: 'Post to Instagram',
    pageUrl: 'Your public page:'
  }
}
