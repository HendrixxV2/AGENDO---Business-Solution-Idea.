import { useState } from 'react'
import db from '../../db.json'

export default function ValeriaDashboard({ user, onLogout, onBackToSite, lang, onSelectLang }) {
  const t = (translations[lang] || translations.es).valeria
  const sim = (translations[lang] || translations.es).simulado
  const [activeTab, setActiveTab] = useState('overview')

  const funnel = db.onboardingFunnel || []
  const barbershops = db.barbershops || []
  const sharedLinks = db.sharedLinks || []
  const bookings = db.bookings || []

  const trialsStarted = funnel[0]?.users ?? 0
  const publishedPages = barbershops.filter((b) => b.published).length
  const totalLinks = sharedLinks.length
  const totalClicks = sharedLinks.reduce((s, l) => s + l.clicks, 0)
  const totalBookingsFromLinks = sharedLinks.reduce((s, l) => s + l.bookings, 0)
  const firstBookings = bookings.length

  const tabs = [
    { id: 'overview', label: lang === 'es' ? 'Resumen General' : 'Overview' },
    { id: 'funnel', label: lang === 'es' ? 'Embudo y Abandono' : 'Funnel & Drop-off' },
    { id: 'activity', label: lang === 'es' ? 'Actividad Reciente' : 'Recent Activity' }
  ]

  return (
    <div className="valeria-layout">
      <header className="valeria-navbar">
        <div className="valeria-nav-left">
          <a href="#" onClick={onBackToSite} className="valeria-logo">
            <span className="valeria-brand">AGENDO</span>
          </a>
          <span className="valeria-pill">PANEL VALERIA</span>
        </div>
        <div className="valeria-nav-right">
          <div className="valeria-lang">
            <button className={lang === 'en' ? 'active' : ''} onClick={() => onSelectLang('en')}>EN</button>
            <span>|</span>
            <button className={lang === 'es' ? 'active' : ''} onClick={() => onSelectLang('es')}>ES</button>
          </div>
          <div className="valeria-user">
            <span className="valeria-avatar">{user.avatar || 'VG'}</span>
            <div className="valeria-user-info">
              <span className="valeria-user-name">{user.name}</span>
              <span className="valeria-user-role">{user.role}</span>
            </div>
          </div>
          <button className="valeria-btn-back" onClick={onBackToSite}>
            {lang === 'es' ? '← Ver Sitio Público' : '← View Public Site'}
          </button>
          <button className="valeria-btn-logout" onClick={onLogout}>
            {lang === 'es' ? 'Cerrar Sesión' : 'Logout'}
          </button>
        </div>
      </header>

      <div className="valeria-container">
        <aside className="valeria-sidebar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`valeria-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
          <div className="valeria-simulado">
            <span className="simulado-badge">{sim.badge}</span>
            {lang === 'es' ? 'Todos los datos son de demostración simulados.' : 'All data is simulated demo data.'}
          </div>
        </aside>

        <main className="valeria-main">
          <header className="valeria-page-header">
            <h1>{t.title}</h1>
            <p className="valeria-page-sub">{t.subtitle}</p>
          </header>

          {activeTab === 'overview' && (
            <section className="valeria-section">
              <div className="kpi-grid">
                <KPICard label={t.trials} value={trialsStarted} trend="+12%" />
                <KPICard label={t.publishedPages} value={publishedPages} trend="+8%" />
                <KPICard label={t.sharedLinks} value={totalLinks} trend={totalClicks + ' clics'} />
                <KPICard label={t.firstBookings} value={firstBookings} trend={totalBookingsFromLinks + ' reservas'} />
                <KPICard label={t.highVolume} value="3" trend="SIMULADO" tone="warning" />
              </div>

              <div className="valeria-card">
                <span className="section-kicker">{t.funnel}</span>
                <h3>Embudo de onboarding y conversión</h3>
                <div className="funnel-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Etapa</th>
                        <th>Usuarios</th>
                        <th>Conversión</th>
                        <th>Abandono</th>
                      </tr>
                    </thead>
                    <tbody>
                      {funnel.map((stage, idx) => {
                        const prev = funnel[idx - 1]
                        const conversion = trialsStarted > 0 ? (stage.users / trialsStarted) * 100 : 0
                        const dropoff = prev ? ((prev.users - stage.users) / prev.users) * 100 : 0
                        return (
                          <tr key={stage.id}>
                            <td>{stage.label}</td>
                            <td>{stage.users}</td>
                            <td>{conversion.toFixed(0)}%</td>
                            <td>{idx === 0 ? '—' : dropoff.toFixed(0) + '%'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'funnel' && (
            <section className="valeria-section">
              <div className="valeria-card">
                <span className="section-kicker">{t.abandonment}</span>
                <h3>Tasa de conversión y abandono por etapa</h3>
                <FunnelChart funnel={funnel} trialsStarted={trialsStarted} lang={lang} />
              </div>
            </section>
          )}

          {activeTab === 'activity' && (
            <section className="valeria-section">
              <div className="valeria-card">
                <span className="section-kicker">
                  {lang === 'es' ? 'Últimas reservas (SIMULADO)' : 'Recent bookings (SIMULATED)'}
                </span>
                <h3>{lang === 'es' ? 'Primeras reservas recibidas' : 'First bookings received'}</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Barbería</th>
                      <th>Cliente</th>
                      <th>Servicio</th>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id}>
                        <td>{b.id}</td>
                        <td>{b.barbershopName}</td>
                        <td>{b.client}</td>
                        <td>{b.service}</td>
                        <td>{b.date}</td>
                        <td>{b.time}</td>
                        <td><span className="status confirmada">{b.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

function KPICard({ label, value, trend, tone = 'default' }) {
  return (
    <div className={`kpi-card kpi-${tone}`}>
      <span className="kpi-label">{label}</span>
      <div className="kpi-value">{value}</div>
      <span className="kpi-trend">{trend}</span>
    </div>
  )
}

function FunnelChart({ funnel, trialsStarted, lang }) {
  const max = funnel[0]?.users ?? 1
  const width = 700
  const height = 300
  const barHeight = 40
  const gap = 16

  return (
    <div className="funnel-wrap">
      <svg width={width} height={height} role="img" aria-label="Embudo de conversión de onboarding">
        {funnel.map((stage, idx) => {
          const pct = stage.users / max
          const barW = width * 0.55 * pct
          const x = (width - barW) / 2
          const y = idx * (barHeight + gap) + 10
          return (
            <g key={stage.id}>
              <rect x={x} y={y} width={barW} height={barHeight} rx="4" fill="#a38c76" opacity={1 - idx * 0.12} />
              <text x={x + barW + 10} y={y + barHeight / 2 + 5} fill="#b5b2ad" fontSize="11" fontFamily="Montserrat, sans-serif">
                {stage.users} ({Math.round((stage.users / trialsStarted) * 100)}%)
              </text>
              <text x={20} y={y + barHeight / 2 + 5} fill="#eceee9" fontSize="12" fontWeight="700" fontFamily="Montserrat, sans-serif">
                {stage.label}
              </text>
            </g>
          )
        })}
      </svg>
      <p className="funnel-note">
        {lang === 'es'
          ? 'Cada barra representa usuarios que alcanzan la etapa. El mayor abandono ocurre entre configuración y publicación.'
          : 'Each bar shows users reaching the stage. Biggest drop-off is between setup and publish.'}
      </p>
    </div>
  )
}

const translations = {
  es: {
    valeria: {
      title: 'Panel Administrativo — Agendo',
      subtitle: 'Métricas de onboarding y conversión (datos de demostración SIMULADO)',
      trials: 'Trials iniciados',
      publishedPages: 'Páginas publicadas',
      sharedLinks: 'Enlaces compartidos',
      firstBookings: 'Primeras reservas',
      highVolume: 'Negocios con 20+ citas en 14 días',
      funnel: 'Embudo de conversión',
      abandonment: 'Abandono por etapa'
    },
    simulado: {
      badge: 'SIMULADO',
      notice: 'Datos de demostración simulados. No son reales.'
    }
  },
  en: {
    valeria: {
      title: 'Admin Panel — Agendo',
      subtitle: 'Onboarding and conversion metrics (SIMULATED demo data)',
      trials: 'Trials started',
      publishedPages: 'Pages published',
      sharedLinks: 'Links shared',
      firstBookings: 'First bookings',
      highVolume: 'Businesses with 20+ appointments in 14 days',
      funnel: 'Conversion funnel',
      abandonment: 'Drop-off by stage'
    },
    simulado: {
      badge: 'SIMULATED',
      notice: 'Simulated demo data. Not real.'
    }
  }
}
