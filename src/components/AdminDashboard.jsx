import { useState } from 'react'
import logoImg from '../assets/logo-transparent.png'

export default function AdminDashboard({
  user,
  onLogout,
  onBackToSite,
  lang,
  onSelectLang,
  initialData,
}) {
  const [activeTab, setActiveTab] = useState('overview')
  const [appointments, setAppointments] = useState(() => initialData.appointments || [])
  const [barbers, setBarbers] = useState(() => initialData.barbers || [])
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal for new quick appointment
  const [newAptModal, setNewAptModal] = useState(false)
  const [newClient, setNewClient] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newService, setNewService] = useState('Classic Precision Haircut')
  const [newBarber, setNewBarber] = useState(barbers[0]?.name || 'Marcus Vance')
  const [newTime, setNewTime] = useState('02:00 PM')

  const metrics = initialData.dashboardMetrics || {
    dailyRevenue: 1485,
    monthlyRevenue: 38420,
    occupancyRate: 88,
    completedToday: 14,
    pendingToday: 6,
    totalClients: 1150,
    averageTicket: 28.5,
    customerSatisfaction: 4.9,
  }

  const services = initialData.services || []
  const clients = initialData.clients || []

  // Update appointment status
  function handleStatusChange(id, newStatus) {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt))
    )
  }

  // Toggle barber status
  function handleToggleBarberStatus(id) {
    setBarbers((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b
        const nextStatus = b.status === 'Disponible' ? 'Ocupado' : 'Disponible'
        return { ...b, status: nextStatus }
      })
    )
  }

  // Add new appointment
  function handleCreateAppointment(e) {
    e.preventDefault()
    const selectedSvcObj = services.find((s) => s.name === newService)
    const newApt = {
      id: `APT-${Math.floor(810 + Math.random() * 90)}`,
      client: newClient,
      phone: newPhone,
      service: newService,
      barber: newBarber,
      date: new Date().toISOString().split('T')[0],
      time: newTime,
      price: selectedSvcObj ? selectedSvcObj.price : 25,
      status: 'Confirmada',
      paymentMethod: 'Tarjeta',
    }
    setAppointments([newApt, ...appointments])
    setNewClient('')
    setNewPhone('')
    setNewAptModal(false)
  }

  // Filtered appointments
  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus = statusFilter === 'all' || apt.status.toLowerCase() === statusFilter.toLowerCase()
    const matchesSearch =
      apt.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.barber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Calculate live daily revenue from completed appointments
  const liveDailyRevenue = appointments
    .filter((a) => a.status === 'Completada' || a.status === 'En curso')
    .reduce((sum, a) => sum + a.price, 0)

  return (
    <div className="admin-layout">
      {/* 1. Admin Topbar */}
      <header className="admin-navbar">
        <div className="admin-nav-left">
          <a href="#inicio" onClick={onBackToSite} className="admin-logo-badge">
            <img src={logoImg} alt="Barber Shop" style={{ height: '36px' }} />
          </a>
          <span className="admin-badge-pill">
            {lang === 'es' ? 'PANEL ADMINISTRATIVO' : 'ADMIN SUITE'}
          </span>
        </div>

        <div className="admin-nav-right">
          {/* Language Switch */}
          <div className="barber-lang-switch">
            <button
              type="button"
              className={`barber-lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => onSelectLang('en')}
            >
              EN
            </button>
            <span className="barber-lang-sep">|</span>
            <button
              type="button"
              className={`barber-lang-btn ${lang === 'es' ? 'active' : ''}`}
              onClick={() => onSelectLang('es')}
            >
              ES
            </button>
          </div>

          {/* User profile */}
          <div className="admin-user-profile">
            <div className="admin-avatar">{user.avatar || 'AD'}</div>
            <div className="admin-user-info">
              <span className="admin-user-name">{user.name}</span>
              <span className="admin-user-role">{user.role}</span>
            </div>
          </div>

          <button type="button" className="admin-btn-secondary" onClick={onBackToSite}>
            {lang === 'es' ? '← Ver Barbería' : '← View Public Site'}
          </button>

          <button type="button" className="admin-btn-logout" onClick={onLogout}>
            {lang === 'es' ? 'Cerrar Sesión' : 'Logout'}
          </button>
        </div>
      </header>

      {/* 2. Main Admin Container */}
      <div className="admin-container">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="admin-tab-icon">📊</span>
            {lang === 'es' ? 'Resumen General' : 'Overview'}
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            <span className="admin-tab-icon">📅</span>
            {lang === 'es' ? 'Gestión de Citas' : 'Appointments'}
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '11px',
                background: 'rgba(255,255,255,0.1)',
                padding: '2px 6px',
                borderRadius: '10px',
              }}
            >
              {appointments.length}
            </span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'barbers' ? 'active' : ''}`}
            onClick={() => setActiveTab('barbers')}
          >
            <span className="admin-tab-icon">✂️</span>
            {lang === 'es' ? 'Barberos & Personal' : 'Staff & Barbers'}
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            <span className="admin-tab-icon">💈</span>
            {lang === 'es' ? 'Catálogo de Servicios' : 'Services & Pricing'}
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'clients' ? 'active' : ''}`}
            onClick={() => setActiveTab('clients')}
          >
            <span className="admin-tab-icon">👥</span>
            {lang === 'es' ? 'Clientes (CRM)' : 'Clients Directory'}
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'finance' ? 'active' : ''}`}
            onClick={() => setActiveTab('finance')}
          >
            <span className="admin-tab-icon">📈</span>
            {lang === 'es' ? 'Unit Economics (Agendo)' : 'SaaS Economics'}
          </button>
        </aside>

        {/* Dynamic Content Panel */}
        <main className="admin-content">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <div className="admin-header-title">
                <div>
                  <h1>{lang === 'es' ? 'Panel de Control Principal' : 'Administrative Overview'}</h1>
                  <p>
                    {lang === 'es'
                      ? 'Monitoreo en tiempo real de ingresos, ocupación de sillones y citas de hoy.'
                      : 'Real-time monitoring of revenue, chair occupancy, and today’s appointment schedule.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="barber-btn-appointment"
                  onClick={() => setNewAptModal(true)}
                >
                  + {lang === 'es' ? 'NUEVA CITA' : 'NEW APPOINTMENT'}
                </button>
              </div>

              {/* KPI Grid */}
              <div className="kpi-grid">
                <div className="kpi-card">
                  <span className="kpi-label">{lang === 'es' ? 'Ingresos de Hoy' : "Today's Revenue"}</span>
                  <div className="kpi-value">${metrics.dailyRevenue + liveDailyRevenue} USD</div>
                  <span className="kpi-sub">▲ +12% vs. ayer</span>
                </div>

                <div className="kpi-card">
                  <span className="kpi-label">{lang === 'es' ? 'Ingreso Mensual' : 'Monthly Revenue'}</span>
                  <div className="kpi-value">${metrics.monthlyRevenue.toLocaleString()} USD</div>
                  <span className="kpi-sub">✓ {lang === 'es' ? 'Meta mensual 94%' : '94% of monthly target'}</span>
                </div>

                <div className="kpi-card">
                  <span className="kpi-label">{lang === 'es' ? 'Ocupación de Sillones' : 'Chair Occupancy'}</span>
                  <div className="kpi-value">{metrics.occupancyRate}%</div>
                  <span className="kpi-sub">💈 3 {lang === 'es' ? 'sillones activos' : 'active chairs'}</span>
                </div>

                <div className="kpi-card">
                  <span className="kpi-label">{lang === 'es' ? 'Ticket Promedio' : 'Average Ticket'}</span>
                  <div className="kpi-value">${metrics.averageTicket.toFixed(2)} USD</div>
                  <span className="kpi-sub">★ {metrics.customerSatisfaction} / 5.0 {lang === 'es' ? 'satisfacción' : 'rating'}</span>
                </div>
              </div>

              {/* Recent appointments snippet */}
              <div className="admin-card-section">
                <div className="admin-card-header">
                  <h3>{lang === 'es' ? 'Agenda del Día en Vivo' : "Today's Appointment Schedule"}</h3>
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => setActiveTab('appointments')}
                  >
                    {lang === 'es' ? 'Ver todas las citas →' : 'View all appointments →'}
                  </button>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>{lang === 'es' ? 'Hora' : 'Time'}</th>
                        <th>{lang === 'es' ? 'Cliente' : 'Client'}</th>
                        <th>{lang === 'es' ? 'Servicio' : 'Service'}</th>
                        <th>{lang === 'es' ? 'Barbero' : 'Barber'}</th>
                        <th>{lang === 'es' ? 'Monto' : 'Price'}</th>
                        <th>{lang === 'es' ? 'Estado' : 'Status'}</th>
                        <th>{lang === 'es' ? 'Acciones' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.slice(0, 5).map((apt) => (
                        <tr key={apt.id}>
                          <td><strong>{apt.id}</strong></td>
                          <td>{apt.time}</td>
                          <td>
                            <strong>{apt.client}</strong>
                            <div style={{ fontSize: '11px', color: '#a09d98' }}>{apt.phone}</div>
                          </td>
                          <td>{apt.service}</td>
                          <td>{apt.barber}</td>
                          <td><strong>${apt.price} USD</strong></td>
                          <td>
                            <span
                              className={`status-pill ${
                                apt.status === 'Completada'
                                  ? 'status-completed'
                                  : apt.status === 'En curso'
                                  ? 'status-in-progress'
                                  : apt.status === 'Confirmada'
                                  ? 'status-confirmed'
                                  : 'status-cancelled'
                              }`}
                            >
                              {apt.status}
                            </span>
                          </td>
                          <td>
                            {apt.status !== 'Completada' && (
                              <button
                                type="button"
                                className="table-action-btn"
                                onClick={() => handleStatusChange(apt.id, 'Completada')}
                                title="Marcar como Completada"
                              >
                                ✓
                              </button>
                            )}
                            {apt.status !== 'Cancelada' && (
                              <button
                                type="button"
                                className="table-action-btn"
                                onClick={() => handleStatusChange(apt.id, 'Cancelada')}
                                title="Cancelar cita"
                              >
                                ✕
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPOINTMENTS MANAGEMENT */}
          {activeTab === 'appointments' && (
            <div>
              <div className="admin-header-title">
                <div>
                  <h1>{lang === 'es' ? 'Control y Gestión de Citas' : 'Appointment Management'}</h1>
                  <p>
                    {lang === 'es'
                      ? 'Administra, filtra y actualiza el estado de las reservaciones en db.json.'
                      : 'Manage, filter, and update the status of barbershop reservations.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="barber-btn-appointment"
                  onClick={() => setNewAptModal(true)}
                >
                  + {lang === 'es' ? 'AGREGAR CITA' : 'ADD APPOINTMENT'}
                </button>
              </div>

              <div className="admin-card-section">
                <div className="admin-card-header">
                  <div className="admin-filters">
                    <input
                      type="text"
                      className="admin-search-input"
                      placeholder={lang === 'es' ? 'Buscar cliente, servicio...' : 'Search client, service...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    <select
                      className="admin-filter-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">{lang === 'es' ? 'Todos los Estados' : 'All Statuses'}</option>
                      <option value="Confirmada">{lang === 'es' ? 'Confirmadas' : 'Confirmed'}</option>
                      <option value="En curso">{lang === 'es' ? 'En Curso' : 'In Progress'}</option>
                      <option value="Completada">{lang === 'es' ? 'Completadas' : 'Completed'}</option>
                      <option value="Cancelada">{lang === 'es' ? 'Canceladas' : 'Cancelled'}</option>
                    </select>
                  </div>

                  <span style={{ fontSize: '12px', color: '#a09d98' }}>
                    {filteredAppointments.length} {lang === 'es' ? 'citas encontradas' : 'appointments found'}
                  </span>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>{lang === 'es' ? 'Fecha y Hora' : 'Date & Time'}</th>
                        <th>{lang === 'es' ? 'Cliente' : 'Client'}</th>
                        <th>{lang === 'es' ? 'Servicio' : 'Service'}</th>
                        <th>{lang === 'es' ? 'Barbero' : 'Barber'}</th>
                        <th>{lang === 'es' ? 'Monto' : 'Total'}</th>
                        <th>{lang === 'es' ? 'Pago' : 'Payment'}</th>
                        <th>{lang === 'es' ? 'Estado' : 'Status'}</th>
                        <th>{lang === 'es' ? 'Acciones' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppointments.map((apt) => (
                        <tr key={apt.id}>
                          <td><strong>{apt.id}</strong></td>
                          <td>
                            <div>{apt.date}</div>
                            <small style={{ color: '#a09d98' }}>{apt.time}</small>
                          </td>
                          <td>
                            <strong>{apt.client}</strong>
                            <div style={{ fontSize: '11px', color: '#a09d98' }}>{apt.phone}</div>
                          </td>
                          <td>{apt.service}</td>
                          <td>{apt.barber}</td>
                          <td><strong>${apt.price} USD</strong></td>
                          <td>{apt.paymentMethod}</td>
                          <td>
                            <span
                              className={`status-pill ${
                                apt.status === 'Completada'
                                  ? 'status-completed'
                                  : apt.status === 'En curso'
                                  ? 'status-in-progress'
                                  : apt.status === 'Confirmada'
                                  ? 'status-confirmed'
                                  : 'status-cancelled'
                              }`}
                            >
                              {apt.status}
                            </span>
                          </td>
                          <td>
                            {apt.status !== 'Completada' && (
                              <button
                                type="button"
                                className="table-action-btn"
                                onClick={() => handleStatusChange(apt.id, 'Completada')}
                              >
                                ✓ {lang === 'es' ? 'Completar' : 'Done'}
                              </button>
                            )}
                            {apt.status !== 'En curso' && apt.status !== 'Completada' && (
                              <button
                                type="button"
                                className="table-action-btn"
                                onClick={() => handleStatusChange(apt.id, 'En curso')}
                              >
                                ▶ {lang === 'es' ? 'Iniciar' : 'Start'}
                              </button>
                            )}
                            {apt.status !== 'Cancelada' && (
                              <button
                                type="button"
                                className="table-action-btn"
                                onClick={() => handleStatusChange(apt.id, 'Cancelada')}
                              >
                                ✕ {lang === 'es' ? 'Cancelar' : 'Cancel'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BARBERS & STAFF */}
          {activeTab === 'barbers' && (
            <div>
              <div className="admin-header-title">
                <div>
                  <h1>{lang === 'es' ? 'Equipo de Barberos & Sillones' : 'Barbers & Staff Management'}</h1>
                  <p>
                    {lang === 'es'
                      ? 'Disponibilidad, comisiones acumuladas y calificación de los maestros artesanos.'
                      : 'Availability, accumulated commissions, and master barber performance metrics.'}
                  </p>
                </div>
              </div>

              <div className="barbers-admin-grid">
                {barbers.map((b) => (
                  <div className="barber-admin-card" key={b.id}>
                    <div className="barber-admin-top">
                      <div className="barber-avatar-box">✂</div>
                      <div className="barber-admin-info">
                        <h4>{b.name}</h4>
                        <span>{b.role} · <strong>{b.chair}</strong></span>
                      </div>
                    </div>

                    <div className="barber-stats-list">
                      <div className="barber-stats-row">
                        <span>{lang === 'es' ? 'Calificación:' : 'Rating:'}</span>
                        <strong>⭐ {b.rating} / 5.0</strong>
                      </div>
                      <div className="barber-stats-row">
                        <span>{lang === 'es' ? 'Servicios Realizados:' : 'Total Services:'}</span>
                        <strong>{b.totalServices} cortes</strong>
                      </div>
                      <div className="barber-stats-row">
                        <span>{lang === 'es' ? 'Comisión Asignada:' : 'Commission Rate:'}</span>
                        <strong>{(b.commissionRate * 100).toFixed(0)}%</strong>
                      </div>
                      <div className="barber-stats-row">
                        <span>{lang === 'es' ? 'Teléfono:' : 'Phone:'}</span>
                        <span>{b.phone}</span>
                      </div>
                      <div className="barber-stats-row">
                        <span>{lang === 'es' ? 'Estado actual:' : 'Status:'}</span>
                        <span
                          className={`status-pill ${
                            b.status === 'Disponible' ? 'status-completed' : 'status-in-progress'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="admin-btn-secondary"
                      style={{ width: '100%', marginTop: '10px' }}
                      onClick={() => handleToggleBarberStatus(b.id)}
                    >
                      {lang === 'es'
                        ? b.status === 'Disponible'
                          ? 'Cambiar a Ocupado'
                          : 'Cambiar a Disponible'
                        : b.status === 'Disponible'
                        ? 'Set as Busy'
                        : 'Set as Available'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SERVICES CATALOG */}
          {activeTab === 'services' && (
            <div>
              <div className="admin-header-title">
                <div>
                  <h1>{lang === 'es' ? 'Catálogo de Servicios y Costos' : 'Services & Pricing Catalog'}</h1>
                  <p>
                    {lang === 'es'
                      ? 'Precios al público, duración estimada, costo de insumos y margen bruto por servicio.'
                      : 'Public pricing, estimated duration, supply cost, and gross margins per service.'}
                  </p>
                </div>
              </div>

              <div className="admin-card-section">
                <div className="admin-table-wrap">
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th>{lang === 'es' ? 'Servicio' : 'Service Name'}</th>
                        <th>{lang === 'es' ? 'Categoría' : 'Category'}</th>
                        <th>{lang === 'es' ? 'Duración' : 'Duration'}</th>
                        <th>{lang === 'es' ? 'Precio Venta' : 'Price'}</th>
                        <th>{lang === 'es' ? 'Costo Insumos' : 'Supply Cost'}</th>
                        <th>{lang === 'es' ? 'Margen Bruto' : 'Gross Margin'}</th>
                        <th>{lang === 'es' ? 'Popularidad' : 'Popularity'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.map((svc) => {
                        const margin = (((svc.price - svc.cost) / svc.price) * 100).toFixed(0)
                        return (
                          <tr key={svc.id}>
                            <td><strong>{svc.name}</strong></td>
                            <td>{svc.category}</td>
                            <td>{svc.duration}</td>
                            <td><strong style={{ color: 'var(--barber-tan)' }}>${svc.price} USD</strong></td>
                            <td>${svc.cost.toFixed(2)} USD</td>
                            <td><strong>{margin}%</strong></td>
                            <td>
                              <span className="status-pill status-completed">
                                {svc.popularity}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CLIENTS CRM */}
          {activeTab === 'clients' && (
            <div>
              <div className="admin-header-title">
                <div>
                  <h1>{lang === 'es' ? 'Directorio de Clientes (CRM)' : 'Client Directory & History'}</h1>
                  <p>
                    {lang === 'es'
                      ? 'Historial de visitas, barbero preferido y estado de fidelización de los clientes.'
                      : 'Client visit history, preferred barber, and loyalty status.'}
                  </p>
                </div>
              </div>

              <div className="admin-card-section">
                <div className="admin-table-wrap">
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>{lang === 'es' ? 'Cliente' : 'Client Name'}</th>
                        <th>{lang === 'es' ? 'Contacto' : 'Contact'}</th>
                        <th>{lang === 'es' ? 'Total Visitas' : 'Visits'}</th>
                        <th>{lang === 'es' ? 'Última Visita' : 'Last Visit'}</th>
                        <th>{lang === 'es' ? 'Barbero Preferido' : 'Preferred Barber'}</th>
                        <th>{lang === 'es' ? 'Membresía' : 'Tier'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((cli) => (
                        <tr key={cli.id}>
                          <td><strong>{cli.id}</strong></td>
                          <td><strong>{cli.name}</strong></td>
                          <td>
                            <div>{cli.phone}</div>
                            <small style={{ color: '#a09d98' }}>{cli.email}</small>
                          </td>
                          <td><strong>{cli.visits} {lang === 'es' ? 'citas' : 'appointments'}</strong></td>
                          <td>{cli.lastVisit}</td>
                          <td>{cli.preferredBarber}</td>
                          <td>
                            {cli.vip ? (
                              <span className="status-pill status-confirmed">★ VIP CLIENT</span>
                            ) : (
                              <span className="status-pill status-completed">REGULAR</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: FINANCE & UNIT ECONOMICS (AGENDO CASO B) */}
          {activeTab === 'finance' && (
            <div>
              <div className="admin-header-title">
                <div>
                  <h1>{lang === 'es' ? 'Modelo Financiero Agendo Cyber' : 'Agendo Cyber Financial Model'}</h1>
                  <p>
                    {lang === 'es'
                      ? 'Análisis del Caso B: Unit economics, curvas históricas y protección de caja a 24 meses.'
                      : 'Case B decision engine: Unit economics, historical acquisition curve, and 24-month cash runway.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={onBackToSite}
                >
                  {lang === 'es' ? 'Ver en sitio web con simulador interactivo ↓' : 'View on public site with sliders ↓'}
                </button>
              </div>

              <div className="kpi-grid">
                <div className="kpi-card">
                  <span className="kpi-label">{lang === 'es' ? 'Caja Inicial' : 'Starting Cash'}</span>
                  <div className="kpi-value">${initialData.assumptions?.[0]?.startingCash?.toLocaleString() || '60,000'} USD</div>
                  <span className="kpi-sub">Piso protegido: ${initialData.assumptions?.[0]?.cashFloor?.toLocaleString() || '10,000'}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">{lang === 'es' ? 'Precio Mensual SaaS' : 'Monthly SaaS Price'}</span>
                  <div className="kpi-value">${initialData.assumptions?.[0]?.monthlyPrice || '25'} USD</div>
                  <span className="kpi-sub">Margen bruto: {((initialData.assumptions?.[0]?.grossMargin || 0.78) * 100).toFixed(0)}%</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">{lang === 'es' ? 'Conversión Trial a Pago' : 'Trial to Paid'}</span>
                  <div className="kpi-value">{((initialData.assumptions?.[0]?.trialConversion || 0.14) * 100).toFixed(0)}%</div>
                  <span className="kpi-sub">Churn mensual: {((initialData.assumptions?.[0]?.monthlyChurn || 0.06) * 100).toFixed(0)}%</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">{lang === 'es' ? 'Meta LTV:CAC' : 'LTV:CAC Target'}</span>
                  <div className="kpi-value">{initialData.assumptions?.[0]?.ltvCacTarget || '2.4'}×</div>
                  <span className="kpi-sub">Horizonte: 24 meses</span>
                </div>
              </div>

              <div className="admin-card-section">
                <div className="admin-card-header">
                  <h3>{lang === 'es' ? 'Escenarios Comparativos de Adquisición' : 'Acquisition Scenarios Comparison'}</h3>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th>{lang === 'es' ? 'Escenario' : 'Scenario'}</th>
                        <th>{lang === 'es' ? 'Inversión' : 'Spend'}</th>
                        <th>{lang === 'es' ? 'Trials' : 'Trials'}</th>
                        <th>{lang === 'es' ? 'Clientes Paid' : 'Paid Clients'}</th>
                        <th>{lang === 'es' ? 'CAC Paid' : 'Paid CAC'}</th>
                        <th>{lang === 'es' ? 'CAC Blended' : 'Blended CAC'}</th>
                        <th>{lang === 'es' ? 'Veredicto' : 'Verdict'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {initialData.scenarios?.map((s) => (
                        <tr key={s.id}>
                          <td><strong>{s.name}</strong></td>
                          <td>${s.investment.toLocaleString()} USD</td>
                          <td>{s.trials}</td>
                          <td>{s.paidCustomers}</td>
                          <td>${s.paidCAC} USD</td>
                          <td><strong>${s.blendedCAC} USD</strong></td>
                          <td>
                            <span
                              className={`status-pill ${
                                s.id === 'base' ? 'status-completed' : 'status-confirmed'
                              }`}
                            >
                              {s.note}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 3. New Appointment Modal */}
      {newAptModal && (
        <div className="modal-backdrop" onClick={() => setNewAptModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setNewAptModal(false)}>
              ✕
            </button>
            <div className="modal-header">
              <span className="modal-eyebrow">BARBER SHOP · ADMIN</span>
              <h2>{lang === 'es' ? 'Crear Nueva Cita' : 'Create New Appointment'}</h2>
              <p>{lang === 'es' ? 'Registra una cita directa en el sistema administrativo.' : 'Register a new appointment into db.json records.'}</p>
            </div>

            <form onSubmit={handleCreateAppointment} className="booking-form">
              <div className="form-group">
                <label className="form-label">{lang === 'es' ? 'Nombre del Cliente' : 'Client Name'}</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Ej. Mateo Gómez"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">{lang === 'es' ? 'Teléfono' : 'Phone'}</label>
                  <input
                    type="tel"
                    className="modal-input"
                    placeholder="+1 (555) 000-0000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{lang === 'es' ? 'Horario' : 'Time Slot'}</label>
                  <select
                    className="modal-select"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:15 AM">10:15 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="01:00 PM">01:00 PM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:30 PM">03:30 PM</option>
                    <option value="05:00 PM">05:00 PM</option>
                    <option value="06:00 PM">06:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">{lang === 'es' ? 'Servicio' : 'Service'}</label>
                  <select
                    className="modal-select"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} (${s.price} USD)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{lang === 'es' ? 'Barbero Asignado' : 'Barber'}</label>
                  <select
                    className="modal-select"
                    value={newBarber}
                    onChange={(e) => setNewBarber(e.target.value)}
                  >
                    {barbers.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name} ({b.chair})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="barber-btn-appointment modal-submit-btn"
                style={{ width: '100%', marginTop: '10px' }}
              >
                {lang === 'es' ? 'GUARDAR CITA' : 'CONFIRM APPOINTMENT'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

