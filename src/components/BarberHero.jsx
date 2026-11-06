export default function BarberHero({ onOpenBooking, t }) {
  return (
    <section className="barber-hero-section" id="inicio">
      <div className="barber-hero-content">
        <p className="barber-hero-eyebrow">{t.eyebrow}</p>
        <h1 className="barber-hero-title">
          {t.titleLine1}<br />
          {t.titleLine2}
        </h1>
        <p className="barber-hero-desc">{t.description}</p>
        <button
          type="button"
          className="barber-btn-appointment barber-hero-btn"
          onClick={onOpenBooking}
        >
          {t.cta}
        </button>
      </div>
    </section>
  )
}
