export function BarberAbout({ t }) {
  return (
    <section className="barber-about-section" id="about">
      <div className="barber-section-header">
        <span className="barber-section-eyebrow">{t.eyebrow}</span>
        <h2 className="barber-section-title">{t.title}</h2>
        <p className="barber-section-desc">{t.description}</p>
      </div>

      <div className="barber-features-grid">
        <div className="barber-feature-card">
          <span className="barber-feature-icon">✂</span>
          <h3>{t.card1Title}</h3>
          <p>{t.card1Desc}</p>
        </div>

        <div className="barber-feature-card">
          <span className="barber-feature-icon">🧴</span>
          <h3>{t.card2Title}</h3>
          <p>{t.card2Desc}</p>
        </div>

        <div className="barber-feature-card">
          <span className="barber-feature-icon">☕</span>
          <h3>{t.card3Title}</h3>
          <p>{t.card3Desc}</p>
        </div>
      </div>
    </section>
  )
}

export function BarberServices({ onOpenBooking, t }) {
  return (
    <section className="barber-services-section" id="services">
      <div className="barber-section-header">
        <span className="barber-section-eyebrow">{t.eyebrow}</span>
        <h2 className="barber-section-title">{t.title}</h2>
        <p className="barber-section-desc">{t.description}</p>
      </div>

      <div className="barber-menu-grid">
        {t.items.map((item, idx) => (
          <div className="barber-menu-item" key={idx}>
            <div className="barber-menu-top">
              <span className="barber-menu-name">{item.name}</span>
              <span className="barber-menu-dots"></span>
              <span className="barber-menu-price">{item.price}</span>
            </div>
            <p className="barber-menu-desc">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="barber-services-cta">
        <button
          type="button"
          className="barber-btn-appointment"
          onClick={onOpenBooking}
        >
          {t.bookCta}
        </button>
      </div>
    </section>
  )
}

export function BarberBlog({ t }) {
  return (
    <section className="barber-blog-section" id="blog">
      <div className="barber-section-header">
        <span className="barber-section-eyebrow">{t.eyebrow}</span>
        <h2 className="barber-section-title">{t.title}</h2>
        <p className="barber-section-desc">{t.description}</p>
      </div>

      <div className="barber-blog-grid">
        {t.posts.map((post, idx) => (
          <article className="barber-blog-card" key={idx}>
            <div className="barber-blog-content">
              <span className="barber-blog-tag">{post.tag}</span>
              <h3>{post.title}</h3>
              <p>{post.desc}</p>
              <a href="#blog" className="barber-blog-link">
                {post.link}
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export function BarberContact({ t }) {
  return (
    <section className="barber-contact-section" id="contact">
      <div className="barber-section-header">
        <span className="barber-section-eyebrow">{t.eyebrow}</span>
        <h2 className="barber-section-title">{t.title}</h2>
        <p className="barber-section-desc">{t.description}</p>
      </div>

      <div className="barber-contact-grid">
        <div className="barber-contact-box">
          <h4>{t.locationTitle}</h4>
          <p style={{ whiteSpace: 'pre-line' }}>{t.locationText}</p>
        </div>

        <div className="barber-contact-box">
          <h4>{t.hoursTitle}</h4>
          <ul>
            {t.hoursList.map((hour, idx) => (
              <li key={idx}>{hour}</li>
            ))}
          </ul>
        </div>

        <div className="barber-contact-box">
          <h4>{t.inquiriesTitle}</h4>
          <p style={{ whiteSpace: 'pre-line' }}>{t.inquiriesText}</p>
        </div>
      </div>

      <footer className="barber-footer">
        <div>
          <strong>BARBER SHOP</strong> · {t.brandFooter}
        </div>
        <div className="barber-footer-links">
          <a href="#inicio">Home</a>
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#finance">Agendo Finance</a>
          <a href="#blog">Blog</a>
          <a href="#contact">Contact</a>
        </div>
        <div>{t.rights}</div>
      </footer>
    </section>
  )
}
