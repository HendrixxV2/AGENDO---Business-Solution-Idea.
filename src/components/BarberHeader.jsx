import { useState, useEffect } from 'react'
import logoImg from '../assets/logo-transparent.png'

export default function BarberHeader({
  onOpenBooking,
  lang,
  onSelectLang,
  t,
  currentUser,
  onOpenLogin,
  onOpenDashboard,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  return (
    <header className="barber-topbar">
      {/* Brand Logo */}
      <a href="#inicio" className="barber-brand" aria-label="Barber Shop - Home">
        <img
          src={logoImg}
          alt="Barber Shop — Your Complete Hair Solution Since 1952"
          className="barber-brand-img"
        />
      </a>

      {/* Desktop Navigation Links */}
      <nav className={`barber-nav ${mobileMenuOpen ? 'open' : ''}`} aria-label="Navegación principal">
        <a
          href="#inicio"
          className="barber-nav-link active"
          onClick={() => setMobileMenuOpen(false)}
        >
          {t.home}
        </a>
        <a
          href="#about"
          className="barber-nav-link"
          onClick={() => setMobileMenuOpen(false)}
        >
          {t.about}
        </a>
        <a
          href="#services"
          className="barber-nav-link"
          onClick={() => setMobileMenuOpen(false)}
        >
          {t.services}
        </a>
        <a
          href="#finance"
          className="barber-nav-link"
          onClick={() => setMobileMenuOpen(false)}
          title="Agendo Cyber SaaS — Unit Economics & Simulador de Caja"
        >
          {t.pages} <span className="barber-badge-tag">SAAS</span>
        </a>
        <a
          href="#blog"
          className="barber-nav-link"
          onClick={() => setMobileMenuOpen(false)}
        >
          {t.blog}
        </a>
        <a
          href="#contact"
          className="barber-nav-link"
          onClick={() => setMobileMenuOpen(false)}
        >
          {t.contact}
        </a>

        {/* Mobile menu only action buttons */}
        <div className="barber-mobile-nav-actions">
          <button
            type="button"
            className="barber-btn-appointment mobile-drawer-btn"
            onClick={() => {
              setMobileMenuOpen(false)
              onOpenBooking()
            }}
          >
            {t.appointment}
          </button>

          {currentUser ? (
            <button
              type="button"
              className="barber-btn-admin-pill mobile-drawer-admin"
              onClick={() => {
                setMobileMenuOpen(false)
                onOpenDashboard()
              }}
            >
              📊 {lang === 'es' ? 'PANEL ADMINISTRATIVO' : 'ADMIN DASHBOARD'}
            </button>
          ) : (
            <button
              type="button"
              className="barber-btn-admin-pill mobile-drawer-admin"
              onClick={() => {
                setMobileMenuOpen(false)
                onOpenLogin()
              }}
            >
              🔐 {lang === 'es' ? 'ACCESO ADMINISTRADOR' : 'ADMIN LOGIN'}
            </button>
          )}
        </div>
      </nav>

      {/* Topbar Actions Group */}
      <div className="barber-actions-wrap">
        {/* Language switch */}
        <div className="barber-lang-switch" role="group" aria-label="Cambiar idioma / Language switch">
          <button
            type="button"
            className={`barber-lang-btn ${lang === 'en' ? 'active' : ''}`}
            onClick={() => onSelectLang('en')}
            aria-label="English"
            title="Switch to English"
          >
            EN
          </button>
          <span className="barber-lang-sep">|</span>
          <button
            type="button"
            className={`barber-lang-btn ${lang === 'es' ? 'active' : ''}`}
            onClick={() => onSelectLang('es')}
            aria-label="Español"
            title="Cambiar a Español"
          >
            ES
          </button>
        </div>

        {/* Admin Login / Dashboard Entry (Desktop & Tablet) */}
        {currentUser ? (
          <button
            type="button"
            className="barber-btn-admin-pill header-admin-btn"
            onClick={onOpenDashboard}
            title={lang === 'es' ? 'Ir al Panel Administrativo' : 'Go to Admin Dashboard'}
          >
            📊 {lang === 'es' ? 'PANEL' : 'DASHBOARD'}
          </button>
        ) : (
          <button
            type="button"
            className="barber-btn-admin-pill header-admin-btn"
            onClick={onOpenLogin}
            title={lang === 'es' ? 'Acceso Administrativo' : 'Admin Login'}
          >
            🔐 <span className="admin-text-label">{lang === 'es' ? 'ADMIN' : 'LOGIN'}</span>
          </button>
        )}

        {/* Appointment CTA Button */}
        <button
          type="button"
          className="barber-btn-appointment header-appointment-btn"
          onClick={onOpenBooking}
        >
          {t.appointment}
        </button>

        {/* Mobile Hamburger Toggle Button */}
        <button
          className="barber-mobile-toggle"
          type="button"
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>
    </header>
  )
}
