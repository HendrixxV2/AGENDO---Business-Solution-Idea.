import { useMemo, useState } from 'react'
import {
  buildCashProjection,
  calculateScenario,
  ACQUISITION_CHANNELS,
  CASE,
  getPayback,
  getRequiredConversion,
  getRequiredPrice,
  HISTORICAL_SCENARIOS,
  interpolateTrials,
  makeUnitEconomics,
} from './model.js'
import './App.css'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const preciseCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const number = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 })
const percent = new Intl.NumberFormat('es-MX', {
  style: 'percent',
  maximumFractionDigits: 1,
})

function money(value, precise = false) {
  return Number.isFinite(value)
    ? (precise ? preciseCurrency : currency).format(value)
    : '—'
}

function ratio(value) {
  return Number.isFinite(value) ? `${value.toFixed(2)}×` : '—'
}

function paybackLabel(value, cac = 1) {
  if (cac == null || cac <= 0) return 'No aplica'
  if (value == null) return '> 24 meses'
  return value === 1 ? '1 mes' : `${value} meses`
}

function requiredConversionLabel(value) {
  if (value == null) return 'no alcanzable con estos supuestos'
  const formatted = percent.format(value)
  return value > 1 ? `${formatted} (no alcanzable)` : formatted
}

function getMarginalCAC(scenario, baseline) {
  const deltaClients = scenario.paidCustomers - baseline.paidCustomers
  if (Math.abs(deltaClients) < 0.0001) return null

  return Math.abs(
    (scenario.acquisitionCost - baseline.acquisitionCost) / deltaClients,
  )
}

function SectionHeading({ eyebrow, title, description, id }) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id}>{title}</h2>
      </div>
      {description && <p className="section-description">{description}</p>}
    </div>
  )
}

function RangeControl({ id, label, value, min, max, step, format, onChange }) {
  return (
    <label className="range-control" htmlFor={id}>
      <span className="range-label">
        <span>{label}</span>
        <strong>{format(value)}</strong>
      </span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="range-bounds">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </span>
    </label>
  )
}

function MetricCard({ label, value, detail, tone = 'default' }) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      {detail && <span>{detail}</span>}
    </article>
  )
}

function CashChart({ projection }) {
  const width = 800
  const height = 250
  const left = 44
  const right = 18
  const top = 20
  const bottom = 34
  const values = [CASE.startingCash, ...projection.months.map((month) => month.endingCash)]
  const maxCash = Math.max(CASE.startingCash, ...values)
  const minCash = Math.min(CASE.cashFloor, ...values)
  const x = (index) => left + (index / (values.length - 1)) * (width - left - right)
  const y = (value) =>
    top +
    ((maxCash - value) / Math.max(maxCash - minCash, 1)) * (height - top - bottom)
  const points = values.map((value, index) => `${x(index)},${y(value)}`).join(' ')

  return (
    <div className="chart-wrap">
      <svg
        className="cash-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Proyección de caja protegida durante 24 meses"
      >
        <line
          x1={left}
          x2={width - right}
          y1={y(minCash)}
          y2={y(minCash)}
          className="chart-floor"
        />
        <polyline points={points} className="chart-line" />
        {values.map((value, index) => (
          <circle
            key={index}
            cx={x(index)}
            cy={y(value)}
            r={index === 0 || index === values.length - 1 ? 4 : 2}
            className={
              projection.months[index - 1]?.floorViolation
                ? 'chart-point breached'
                : projection.months[index - 1]?.investmentCapped
                  ? 'chart-point capped'
                  : 'chart-point'
            }
          />
        ))}
        {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((month) => (
          <text
            key={month}
            x={x(month)}
            y={height - 8}
            textAnchor="middle"
            className="chart-label"
          >
            {month === 0 ? 'HOY' : `M${month}`}
          </text>
        ))}
        <text x={left} y={y(minCash) - 8} className="chart-floor-label">
          PISO {money(minCash)}
        </text>
        <text x={left} y={top + 4} className="chart-label">
          {money(maxCash)}
        </text>
      </svg>
    </div>
  )
}

function CohortChart({ price, grossMargin, churn, paidCAC }) {
  const width = 780
  const height = 220
  const left = 43
  const right = 18
  const top = 17
  const bottom = 29
  const monthlyMargin = price * grossMargin
  const annualMargin = CASE.annualPrice * grossMargin
  const months = Array.from({ length: CASE.horizonMonths + 1 }, (_, index) => index)
  let monthlyCumulative = 0
  let organicCumulative = 0
  let annualCumulative = 0
  const monthlyCash = [paidCAC == null ? 0 : -paidCAC]
  const annualCash = [paidCAC == null ? 0 : -paidCAC]
  const organicCash = [0]
  const paybackMonthAnnual =
    paidCAC == null
      ? null
      : months.slice(1).find((month) => {
          annualCumulative +=
            month === 1
              ? annualMargin
              : month === CASE.annualPeriodMonths + 1
                ? annualMargin * CASE.annualRenewalRate
                : 0
          return annualCumulative >= paidCAC
        }) ?? null

  for (const month of months.slice(1)) {
    const contribution = monthlyMargin * (1 - churn) ** (month - 1)
    monthlyCumulative += contribution
    organicCumulative += contribution
    if (month === 1) annualCumulative = annualMargin
    if (month === CASE.annualPeriodMonths + 1) {
      annualCumulative += annualMargin * CASE.annualRenewalRate
    }
    monthlyCash.push(monthlyCumulative - (paidCAC ?? 0))
    annualCash.push(annualCumulative - (paidCAC ?? 0))
    organicCash.push(organicCumulative)
  }

  const allValues = [...monthlyCash, ...annualCash, ...organicCash, 0]
  const minValue = Math.min(0, ...allValues)
  const maxValue = Math.max(0, ...allValues)
  const x = (month) => left + (month / CASE.horizonMonths) * (width - left - right)
  const y = (value) =>
    top +
    ((maxValue - value) / Math.max(maxValue - minValue, 1)) *
      (height - top - bottom)
  const points = (values) =>
    values.map((value, month) => `${x(month)},${y(value)}`).join(' ')
  const monthlyPayback =
    paidCAC == null
      ? null
      : getPayback(paidCAC, monthlyMargin, churn, CASE.horizonMonths)
  const annualLtv24 = annualMargin * (1 + CASE.annualRenewalRate)

  return (
    <div className="cohort-layout">
      <div className="cohort-chart-wrap">
        <svg
          className="cohort-chart"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Caja acumulada por cliente desde el mes cero hasta el mes 24"
        >
          <line
            x1={left}
            x2={width - right}
            y1={y(0)}
            y2={y(0)}
            className="cohort-zero"
          />
          {paidCAC != null && (
            <polyline points={points(monthlyCash)} className="cohort-line monthly" />
          )}
          {paidCAC != null && (
            <polyline points={points(annualCash)} className="cohort-line annual" />
          )}
          <polyline points={points(organicCash)} className="cohort-line organic" />
          {[0, 1, 6, 12, 13, 14, 18, 24].map((month) => (
            <text
              key={month}
              x={x(month)}
              y={height - 7}
              textAnchor="middle"
              className="chart-label"
            >
              {month === 0 ? 'LLEGA' : `M${month}`}
            </text>
          ))}
          <text x={left} y={y(0) - 7} className="chart-floor-label">
            CAC RECUPERADO
          </text>
        </svg>
      </div>
      <div className="cohort-legend">
        {paidCAC != null && (
          <span><i className="cohort-swatch monthly" /> Mensual · CAC {money(paidCAC, true)}</span>
        )}
        {paidCAC != null && (
          <span><i className="cohort-swatch annual" /> Anual prepago · {money(annualMargin, true)} de margen al llegar</span>
        )}
        <span><i className="cohort-swatch organic" /> Orgánico · CAC $0</span>
      </div>
      <div className="cohort-metrics">
        <div>
          <span>CLIENTE MENSUAL</span>
          <strong>{paybackLabel(monthlyPayback, paidCAC)}</strong>
          <small>LTV 24 m {money(monthlyMargin * (1 - (1 - churn) ** CASE.horizonMonths) / churn, true)}</small>
        </div>
        <div>
          <span>CLIENTE ANUAL PREPAGO</span>
          <strong>{paybackLabel(paybackMonthAnnual, paidCAC)}</strong>
          <small>LTV esperado 24 m {money(annualLtv24, true)} · renueva 70 % en M13</small>
        </div>
        <div>
          <span>CLIENTE ORGÁNICO</span>
          <strong>Mes 1</strong>
          <small>CAC $0 · primer margen {money(monthlyMargin, true)}</small>
        </div>
      </div>
      <p className="source-note">
        Caja neta acumulada después del CAC paid. El mensual aporta margen cada mes esperado;
        el anual cobra $240 por adelantado (margen: {money(annualMargin, true)}) y añade la renovación esperada en el mes 13.
      </p>
    </div>
  )
}

function ScenarioTable({ scenarios, ltv24 }) {
  const baseline = scenarios.find((scenario) => scenario.id === 'base')

  return (
    <div className="table-scroll">
      <table className="data-table scenario-table">
        <thead>
          <tr>
            <th>Escenario</th>
            <th>Inversión</th>
            <th>Trials</th>
            <th>Nuevos ads</th>
            <th>Vendedoras</th>
            <th>CAC paid</th>
            <th>CAC blended</th>
            <th>CAC marginal vs. base</th>
            <th>LTV 24 m</th>
            <th>LTV sin tope</th>
            <th>LTV:CAC paid</th>
            <th>LTV:CAC blended</th>
            <th>Payback paid</th>
            <th>Payback blended</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((scenario) => {
            const economics = makeUnitEconomics(scenario, ltv24)
            return (
              <tr key={scenario.id} className={scenario.id === 'history-30' ? 'row-highlight' : ''}>
                <th scope="row">
                  <span className="table-title">{scenario.name}</span>
                  <span className="table-note">{scenario.note}</span>
                </th>
                <td>{money(scenario.investment)}</td>
                <td>{number.format(scenario.trials)}</td>
                <td>{number.format(scenario.paidCustomers)}</td>
                <td>{number.format(scenario.salespeople)}</td>
                <td>{money(economics.paidCAC, true)}</td>
                <td>{money(economics.blendedCAC, true)}</td>
                <td>{baseline ? money(getMarginalCAC(scenario, baseline), true) : '—'}</td>
                <td>{money(ltv24, true)}</td>
                <td>{money(scenario.ltvUnlimited, true)}</td>
                <td className={economics.paidRatio >= 2.4 ? 'positive-cell' : 'negative-cell'}>
                  {ratio(economics.paidRatio)}
                </td>
                <td className={economics.blendedRatio >= 2.4 ? 'positive-cell' : 'negative-cell'}>
                  {ratio(economics.blendedRatio)}
                </td>
                <td>{paybackLabel(economics.paidPayback, economics.paidCAC)}</td>
                <td>{paybackLabel(economics.blendedPayback, economics.blendedCAC)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SourceData() {
  const totalInvestment = ACQUISITION_CHANNELS.reduce(
    (total, channel) => total + channel.investment,
    0,
  )
  const totalClicks = ACQUISITION_CHANNELS.reduce(
    (total, channel) => total + channel.clicks,
    0,
  )
  const totalTrials = ACQUISITION_CHANNELS.reduce(
    (total, channel) => total + channel.trials,
    0,
  )

  return (
    <div className="source-grid">
      <article className="panel source-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">FUENTE · SEPTIEMBRE</span>
            <h3>Adquisición por canal</h3>
          </div>
          <span className="table-note">14 % de conversión combinada</span>
        </div>
        <div className="table-scroll">
          <table className="data-table source-table">
            <thead>
              <tr>
                <th>Canal</th>
                <th>Inversión</th>
                <th>Clics</th>
                <th>Trials</th>
                <th>Costo / trial</th>
              </tr>
            </thead>
            <tbody>
              {ACQUISITION_CHANNELS.map((channel) => (
                <tr key={channel.name}>
                  <th scope="row">{channel.name}</th>
                  <td>{money(channel.investment)}</td>
                  <td>{number.format(channel.clicks)}</td>
                  <td>{number.format(channel.trials)}</td>
                  <td>{money(channel.investment / channel.trials, true)}</td>
                </tr>
              ))}
              <tr className="source-total">
                <th scope="row">Total</th>
                <td>{money(totalInvestment)}</td>
                <td>{number.format(totalClicks)}</td>
                <td>{number.format(totalTrials)}</td>
                <td>{money(totalInvestment / totalTrials, true)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="source-note">
          Los 70 clientes pagadores se estiman con la conversión combinada; el caso no separa conversiones por canal.
        </p>
      </article>

      <article className="panel source-panel">
        <div className="panel-heading">
          <div>
            <span className="panel-kicker">RESPUESTA OBSERVADA · INTERPOLACIÓN LINEAL</span>
            <h3>La curva de adquisición</h3>
          </div>
        </div>
        <div className="curve-list">
          {HISTORICAL_SCENARIOS.map((point) => (
            <div className="curve-point" key={point.investment}>
              <span>{money(point.investment)}</span>
              <strong>{number.format(point.trials)}</strong>
              <small>trials</small>
            </div>
          ))}
        </div>
        <p className="source-note">
          A $30.000, el costo histórico sube a {money(30_000 / HISTORICAL_SCENARIOS.at(-1).trials, true)} por trial;
          {` `}Valeria asume que se mantiene en $20.
        </p>
      </article>
    </div>
  )
}

function Assumptions() {
  return (
    <details className="assumptions-panel">
      <summary>Supuestos y metodología</summary>
      <div className="assumptions-grid">
        <p>Trial de 14 días sin tarjeta. La mezcla de referencia es 90 % mensual ($25) y 10 % anual ($240); el escenario base calcula todos los clientes como mensuales.</p>
        <p>El simulador permite variar el porcentaje anual; registra el margen al prepago y modela 70 % de renovación al mes 13. Los clientes existentes empiezan como mensuales.</p>
        <p>El primer mes se cobra al llegar; el churn mensual inicial de 6 % comienza el mes siguiente.</p>
        <p>La conversión trial → pago permanece en 14 %; es un supuesto, no una garantía al escalar.</p>
        <p>Los trials se interpolan linealmente entre los datos históricos; los 50 orgánicos son fijos por mes.</p>
        <p>Hay 1.150 clientes activos al mes 0. Cada vendedora cuesta $1.200 y atiende hasta 500 trials; la comisión es $20 por nuevo cliente de anuncios.</p>
        <p>Se incluyen los costos fijos de $14.000 mensuales; no incluyen vendedoras ni costos directos.</p>
        <p>El 22 % de costos directos está reflejado en el margen bruto de 78 %; no se vuelve a restar.</p>
        <p>El registro de $41 promedio B2B solo es comparable como costo por trial; no equivale al CAC de un cliente pagador.</p>
        <p>Para Valeria, el costo de registro se mantiene en $20 al escalar; se contrasta con el historial.</p>
        <p>El simulador limita anuncios si una inversión mensual pone la caja bajo el piso de $10.000.</p>
      </div>
    </details>
  )
}

function downloadCsv(scenarios, ltv24, assumptions) {
  const baseline = scenarios.find((scenario) => scenario.id === 'base')
  const rows = [
    [
      'Escenario',
      'Inversion USD',
      'Precio mensual USD',
      'Margen bruto',
      'Conversion trial a pago',
      'Churn mensual',
      'Trials',
      'Nuevos anuncios',
      'Organicos',
      'Vendedoras',
      'CAC paid USD',
      'CAC blended USD',
      'CAC marginal vs base USD',
      'LTV 24m USD',
      'LTV sin tope USD',
      'LTV CAC paid',
      'LTV CAC blended',
      'Payback paid meses',
      'Payback blended meses',
    ],
    ...scenarios.map((scenario) => {
      const economics = makeUnitEconomics(scenario, ltv24)
      return [
        scenario.name,
        scenario.investment,
        assumptions.price,
        assumptions.grossMargin,
        CASE.trialConversion,
        assumptions.churn,
        scenario.trials,
        scenario.paidCustomers,
        CASE.organicCustomers,
        scenario.salespeople,
        economics.paidCAC ?? '',
        economics.blendedCAC,
        baseline ? (getMarginalCAC(scenario, baseline) ?? '') : '',
        ltv24,
        scenario.ltvUnlimited,
        economics.paidRatio ?? '',
        economics.blendedRatio,
        economics.paidPayback ?? '>24',
        economics.blendedPayback ?? '>24',
      ]
    }),
  ]
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'agendo-escenarios-unit-economics.csv'
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function App() {
  const [theme, setTheme] = useState(
    () => (localStorage.getItem('agendo-theme') === 'dark' ? 'dark' : 'light'),
  )
  const [investment, setInvestment] = useState(CASE.baseInvestment)
  const [price, setPrice] = useState(CASE.monthlyPrice)
  const [grossMargin, setGrossMargin] = useState(CASE.grossMargin)
  const [churn, setChurn] = useState(CASE.monthlyChurn)
  const [annualShare, setAnnualShare] = useState(0)

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('agendo-theme', nextTheme)
    setTheme(nextTheme)
  }

  const current = useMemo(
    () => calculateScenario(investment, { price, grossMargin, churn }),
    [investment, price, grossMargin, churn],
  )
  const scenarios = useMemo(
    () => [
      calculateScenario(10_000, {
        price,
        grossMargin,
        churn,
        id: 'base',
        name: '01 · Base histórico',
        note: 'Inversión actual; 20 USD por trial.',
      }),
      calculateScenario(30_000, {
        price,
        grossMargin,
        churn,
        id: 'valeria',
        name: '02 · Proyección de Valeria',
        note: 'Asume 20 USD por trial al escalar.',
        costPerTrial: 20,
      }),
      calculateScenario(30_000, {
        price,
        grossMargin,
        churn,
        id: 'history-30',
        name: '03 · Escala histórica',
        note: 'La curva observada entrega 900 trials.',
      }),
    ],
    [price, grossMargin, churn],
  )
  const ltv24 = current.ltv24
  const currentEconomics = makeUnitEconomics(current, ltv24)
  const projection = useMemo(
    () =>
      buildCashProjection(investment, {
        price,
        grossMargin,
        churn,
        annualShare,
      }),
    [investment, price, grossMargin, churn, annualShare],
  )
  const tripledProjection = useMemo(
    () =>
      buildCashProjection(30_000, {
        price,
        grossMargin,
        churn,
        annualShare,
      }),
    [price, grossMargin, churn, annualShare],
  )
  const currentInvestment = projection.months[0]?.investment ?? investment
  const cappedMonths = projection.months.filter((month) => month.investmentCapped)
  const historicalTrialsAtInvestment = interpolateTrials(investment)
  const requiredConversion = getRequiredConversion(investment, ltv24, 2.4)
  const requiredPrice = getRequiredPrice(
    investment,
    { grossMargin, churn },
    2.4,
  )
  const history30 = scenarios[2]
  const history30Economics = makeUnitEconomics(history30, ltv24)
  const valeriaScenario = scenarios[1]
  const valeriaEconomics = makeUnitEconomics(valeriaScenario, ltv24)
  const marginalBase = calculateScenario(10_000, {
    price,
    grossMargin,
    churn,
  })
  const marginalCAC = getMarginalCAC(current, marginalBase)
  const breakMonth = projection.unprotectedBreachMonth
  const unavoidableFloorMonth = projection.protectedFloorBreachMonth
  const tripledBreakMonth = tripledProjection.unprotectedBreachMonth
  const heroVerdict =
    history30Economics.blendedRatio >= 2.4 ? 'Escalar con límites' : 'No triplicar todavía'

  return (
    <main data-theme={theme}>
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="Agendo, ir al inicio">
          <span className="brand-mark">A</span>
          <span>AGENDO<span className="brand-sub">CYBER / FINANCE</span></span>
        </a>
        <nav className="stage-nav" aria-label="Niveles del reto">
          <a href="#calculadora"><span>01</span> Calculadora</a>
          <a href="#tablero"><span>02</span> Tablero <b>+10</b></a>
          <a href="#simulador"><span>03</span> Simulador <b>+15 / +5</b></a>
        </nav>
        <button
          className="theme-toggle"
          type="button"
          aria-label={`Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`}
          aria-pressed={theme === 'dark'}
          onClick={toggleTheme}
        >
          <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
          {theme === 'dark' ? 'Claro' : 'Oscuro'}
        </button>
        <span className="live-status"><i /> CASO B · ACTIVO</span>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-square" /> DECISIÓN DE INVERSIÓN · HORIZONTE 24 MESES</p>
          <h1>Crecer sin<br /><em>quebrar la caja.</em></h1>
          <p className="hero-lede">
            Valeria quiere triplicar los anuncios. Ricardo quiere saber cuánto aguanta la caja.
            La respuesta empieza por el costo real de adquirir un cliente.
          </p>
          <p className="hero-capital">
            CAPITAL ÁNGEL <strong>$150.000</strong> <span>→</span> CAJA HOY <strong>{money(CASE.startingCash)}</strong>
          </p>
          <a className="primary-link" href="#calculadora">Analizar el caso <span>↓</span></a>
        </div>
        <aside className="hero-verdict">
          <span className="verdict-label">LECTURA DEL CASO</span>
          <strong>{heroVerdict}</strong>
          <p>
            A $30.000, el historial predice {number.format(history30.trials)} trials, no 1.500.
            Su CAC blended es {money(history30Economics.blendedCAC, true)}.
          </p>
          <div className="verdict-stats">
            <span><b>{ratio(history30Economics.blendedRatio)}</b>LTV:CAC blended</span>
            <span><b>{tripledBreakMonth ? `M${tripledBreakMonth}` : '24 m'}</b>primer cruce del piso*</span>
          </div>
          <small>*Sin corregir el gasto. El simulador protege el piso.</small>
        </aside>
        <div className="hero-index">ANÁLISIS 01—03 <span>UNIT ECONOMICS / SAAS</span></div>
      </section>

      <section className="section calculator-section" aria-labelledby="calculadora">
        <SectionHeading
          id="calculadora"
          eyebrow="NIVEL 01 · LA CALCULADORA"
          title="El registro no es el cliente."
          description="Compara los números reales con la proyección optimista. Exporta la tabla para abrirla en Excel o Google Sheets."
        />

        <div className="fact-strip">
          <div><span>PRECIO MENSUAL</span><strong>{money(price)} <small>/ mes</small></strong></div>
          <div><span>MARGEN BRUTO</span><strong>{percent.format(grossMargin)}</strong></div>
          <div><span>CONVERSIÓN</span><strong>{percent.format(CASE.trialConversion)}</strong></div>
          <div><span>CHURN MENSUAL</span><strong>{percent.format(churn)}</strong></div>
          <div><span>LTV ACOTADO · 24 M</span><strong>{money(ltv24, true)}</strong></div>
          <div><span>LTV SIN TOPE · REFERENCIA</span><strong>{money(current.ltvUnlimited, true)}</strong></div>
        </div>

        <div className="panel scenario-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">HOJA DE CÁLCULO · 100 PUNTOS</span>
              <h3>Tres escenarios, el mismo método.</h3>
            </div>
            <button
              className="outline-button"
              type="button"
              onClick={() =>
                downloadCsv(scenarios, ltv24, { price, grossMargin, churn })
              }
            >
              <span aria-hidden="true">↓</span> Descargar CSV
            </button>
          </div>
          <ScenarioTable scenarios={scenarios} ltv24={ltv24} />
          <div className="table-footer">
            <span><i className="legend-dot green" /> Ratio ≥ 2,4×</span>
            <span><i className="legend-dot yellow" /> Ratio &lt; 2,4× · no cumple la meta alegada</span>
          </div>
        </div>

        <SourceData />

        <div className="panel cohort-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">CAJA NETA POR COHORTE · 24 MESES</span>
              <h3>¿Cuándo recupera CAC cada cliente?</h3>
            </div>
            <span className="table-note">CAC paid actual: {money(currentEconomics.paidCAC, true)}</span>
          </div>
          <CohortChart
            price={price}
            grossMargin={grossMargin}
            churn={churn}
            paidCAC={currentEconomics.paidCAC}
          />
        </div>

        <div className="insight-grid">
          <article className="insight-card">
            <span className="insight-number">A / REGISTROS</span>
            <h3>Un registro no es un cliente pagador.</h3>
            <p>
              A $30.000, el historial predice {number.format(history30.trials)} trials y 14 % de conversión:
              {` `}$30.000 compran
              {` ${number.format(history30.paidCustomers)} clientes de anuncios`}. El CAC paid real
              sube a <strong>{money(history30Economics.paidCAC, true)}</strong>; incluye anuncios,
              vendedoras y comisiones. Aunque $33,33 por trial queda bajo la referencia de $41, no es el CAC.
            </p>
          </article>
          <article className="insight-card accent-card">
            <span className="insight-number">B / VEREDICTO</span>
            <h3>El 2,4× corresponde al caso base blended.</h3>
            <p>
              Verificación base: 500 × 14 % = 70; adquisición = $10.000 + $1.200 + (70 × $20) = $12.600.
              CAC paid = $180; blended = $12.600 ÷ (70 + 50) = $105; LTV 24 m = {money(ltv24, true)}.
              El 2,4× incluye 50 orgánicos fijos que no escalan con anuncios. Ricardo debe mirar CAC paid
              y marginal: al subir a $30.000, el blended cae a {ratio(history30Economics.blendedRatio)}.
              LTV sin tope {money(current.ltvUnlimited, true)} es solo comparación, no decisión.
            </p>
          </article>
        </div>

        <Assumptions />
      </section>

      <section className="section dashboard-section" aria-labelledby="tablero">
        <SectionHeading
          id="tablero"
          eyebrow="NIVEL 02 · EL TABLERO  +10 PUNTOS"
          title="Mueve las palancas. Lee el resultado."
          description="Explora inversión, precio, margen bruto y cancelación mensual. Las métricas se recalculan con la curva histórica de adquisición."
        />

        <div className="dashboard-layout">
          <div className="panel controls-panel">
            <span className="panel-kicker">CONTROLES DEL MODELO</span>
            <RangeControl
              id="investment"
              label="Inversión mensual"
              value={investment}
              min={0}
              max={30_000}
              step={500}
              format={money}
              onChange={setInvestment}
            />
            <RangeControl
              id="price"
              label="Precio del plan mensual"
              value={price}
              min={15}
              max={60}
              step={1}
              format={(value) => `${money(value)} / mes`}
              onChange={setPrice}
            />
            <RangeControl
              id="gross-margin"
              label="Margen bruto"
              value={grossMargin}
              min={0.5}
              max={0.95}
              step={0.01}
              format={percent.format}
              onChange={setGrossMargin}
            />
            <RangeControl
              id="churn"
              label="Cancelación mensual"
              value={churn}
              min={0.01}
              max={0.15}
              step={0.005}
              format={percent.format}
              onChange={setChurn}
            />
            <div className="control-footnote">
              <span>RESPUESTA HISTÓRICA</span>
              <strong>{number.format(historicalTrialsAtInvestment)} trials</strong>
              <span>{number.format(current.salespeople)} vendedora{current.salespeople === 1 ? '' : 's'} · hasta 500 trials c/u</span>
            </div>
          </div>

          <div className="dashboard-results">
            <div className="metric-grid">
              <MetricCard label="Nuevos clientes · ads" value={number.format(current.paidCustomers)} detail="14 % de los trials estimados" />
              <MetricCard label="CAC paid real" value={money(currentEconomics.paidCAC, true)} detail="Incluye ads + equipo + comisión" tone="blue" />
              <MetricCard label="CAC blended" value={money(currentEconomics.blendedCAC, true)} detail="Incluye 50 clientes orgánicos" />
              <MetricCard label="LTV:CAC paid" value={ratio(currentEconomics.paidRatio)} detail="Solo nuevos clientes de anuncios" tone={currentEconomics.paidRatio >= 2.4 ? 'green' : 'warning'} />
              <MetricCard label="LTV:CAC blended" value={ratio(currentEconomics.blendedRatio)} detail={`LTV 24 m: ${money(ltv24, true)}`} tone={currentEconomics.blendedRatio >= 2.4 ? 'green' : 'warning'} />
              <MetricCard label="Payback paid" value={paybackLabel(currentEconomics.paidPayback, currentEconomics.paidCAC)} detail="Margen acumulado, máximo 24 meses" />
              <MetricCard label="CAC marginal" value={marginalCAC == null ? '—' : money(marginalCAC, true)} detail="Costo incremental vs. base de $10.000" tone="blue" />
            </div>
            <div className="panel formula-panel">
              <div>
                <span className="panel-kicker">COSTO POR REGISTRO ≠ CAC</span>
                <strong>{money(current.costPerTrial, true)} <small>/ trial</small></strong>
              </div>
              <span className="formula-arrow" aria-hidden="true">→</span>
              <div>
                <span className="panel-kicker">CAC PAID COMPLETO</span>
                <strong>{money(currentEconomics.paidCAC, true)} <small>/ cliente pagador</small></strong>
              </div>
              <p>Margen mensual actual: {money(current.monthlyMargin, true)} · LTV sin tope: {money(current.ltvUnlimited, true)} (solo referencia)</p>
            </div>
          </div>
        </div>

        <div className="target-callout">
          <div className="target-icon">!</div>
          <div>
            <span className="panel-kicker">¿QUÉ TENDRÍA QUE PASAR PARA LLEGAR A 2,4×?</span>
            <p>
              {investment === 0 ? (
                <>Sin inversión publicitaria, una conversión objetivo no aplica. Añade inversión para estimar el umbral.</>
              ) : (
                <>
                  A {money(investment)} de inversión, la conversión trial → pago tendría que subir a{' '}
                  <strong>{requiredConversionLabel(requiredConversion.blended)}</strong>
                  {' '}para lograr 2,4× blended (hoy: {percent.format(CASE.trialConversion)}).
                  {requiredConversion.paid != null && <> En paid-only, la meta exige {requiredConversionLabel(requiredConversion.paid)}.</>}
                  {' '}Otra ruta, manteniendo conversión, margen y churn, es un precio mensual de al menos{' '}
                  <strong>{requiredPrice == null ? 'no alcanzable' : money(requiredPrice, true)}</strong>.
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="section simulator-section" aria-labelledby="simulador">
        <SectionHeading
          id="simulador"
          eyebrow="NIVEL 03 · EL SIMULADOR  +15 PUNTOS · +5 MEJOR PLAN"
          title="La caja no perdona el promedio."
          description="Proyección mensual a 24 meses. Si el plan cruza el piso de seguridad, el modelo recorta inversión antes de comprometer la caja."
        />

        <div className="annual-mix-panel panel">
          <RangeControl
            id="annual-mix"
            label="Nuevos clientes con plan anual prepago"
            value={annualShare}
            min={0}
            max={1}
            step={0.05}
            format={percent.format}
            onChange={setAnnualShare}
          />
          <p>
            Base: 0 % anual (todos mensuales). Los clientes anuales pagan {money(CASE.annualPrice)} por adelantado
            y 70 % renueva en el mes 13; los 1.150 clientes iniciales se consideran mensuales.
          </p>
        </div>

        <div className="simulator-summary">
          <div className="panel cash-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">CAJA PROTEGIDA · 24 MESES</span>
                <h3>La caja mes a mes</h3>
              </div>
              <span className={`floor-badge ${cappedMonths.length ? 'floor-warning' : ''}`}>
                PISO {money(CASE.cashFloor)}
              </span>
            </div>
            <CashChart projection={projection} />
            <div className="chart-legend">
              <span><i className="legend-line" /> Caja proyectada</span>
              <span><i className="legend-line floor-line" /> Piso de seguridad</span>
              <span><i className="legend-dot orange" /> Inversión limitada</span>
            </div>
          </div>
          <div className="simulator-side">
            <MetricCard label="Caja inicial" value={money(CASE.startingCash)} detail="Disponible hoy" />
            <MetricCard label="Caja al mes 24" value={money(projection.months.at(-1)?.endingCash)} detail="Con control automático del piso" tone="green" />
            <MetricCard label="Inversión este mes" value={money(currentInvestment)} detail={currentInvestment < investment ? `Reducida desde ${money(investment)}` : 'Plan solicitado'} tone={currentInvestment < investment ? 'warning' : 'blue'} />
            <MetricCard label="Meses con inversión limitada" value={number.format(cappedMonths.length)} detail="Tope automático para proteger la caja" />
          </div>
        </div>

        {unavoidableFloorMonth ? (
          <div className="danger-banner">
            <strong>El piso no se puede sostener ni con anuncios en $0.</strong>
            <span>
              Con el precio y churn seleccionados, los costos fijos superan la contribución
              disponible desde el mes {unavoidableFloorMonth}. Se necesitan recortes de costos o capital adicional.
            </span>
          </div>
        ) : breakMonth ? (
          <div className="warning-banner">
            <strong>Plan sin corrección: rompe el piso en el mes {breakMonth}.</strong>
            <span>
              Sin el límite automático, la caja del mes {breakMonth} quedaría en{' '}
              {money(projection.unprotectedEndingCash)}. El simulador recorta la inversión a{' '}
              {money(projection.months[breakMonth - 1]?.investment)} ese mes para conservar al menos {money(CASE.cashFloor)}.
            </span>
          </div>
        ) : (
          <div className="safe-banner">
            <strong>La inversión seleccionada conserva el piso de caja durante 24 meses.</strong>
            <span>La proyección incluye 50 clientes orgánicos nuevos por mes y churn de {percent.format(churn)}.</span>
          </div>
        )}

        <div className="panel cash-table-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">DETALLE DEL FLUJO</span>
              <h3>24 meses · USD</h3>
            </div>
            <span className="table-note">Activos mensuales + anuales; los prepago aportan margen al llegar y al renovar.</span>
          </div>
          <div className="table-scroll cash-table-scroll">
            <table className="data-table cash-table">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>Ads</th>
                  <th>Trials</th>
                  <th>Nuevos ads</th>
                  <th>Activos mensuales</th>
                  <th>Activos anuales</th>
                  <th>Prepago · margen</th>
                  <th>Entradas</th>
                  <th>Equipo</th>
                  <th>Comisión</th>
                  <th>Costos fijos</th>
                  <th>Salidas</th>
                  <th>Caja fin</th>
                </tr>
              </thead>
              <tbody>
                {projection.months.map((month) => (
                  <tr
                    key={month.month}
                    className={
                      month.floorViolation
                        ? 'row-floor-breach'
                        : month.investmentCapped
                          ? 'row-capped'
                          : ''
                    }
                  >
                    <th scope="row">M{String(month.month).padStart(2, '0')}</th>
                    <td>{money(month.investment)}{month.investmentCapped && <span className="capped-tag">AJUSTE</span>}</td>
                    <td>{number.format(month.trials)}</td>
                    <td>{number.format(month.paidCustomers)}</td>
                    <td>{number.format(month.monthlyActiveCustomers)}</td>
                    <td>{number.format(month.annualActiveCustomers)}</td>
                    <td>{money(month.prepaymentMargin)}</td>
                    <td>{money(month.income)}</td>
                    <td>{money(month.salespeople * CASE.salespersonSalary)}</td>
                    <td>{money(month.paidCustomers * CASE.commissionPerPaidCustomer)}</td>
                    <td>{money(CASE.fixedCosts)}</td>
                    <td>{money(month.expenses)}</td>
                    <td className={month.endingCash <= CASE.cashFloor + 1 ? 'floor-cell' : ''}>{money(month.endingCash)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="investor-answer">
          <span className="panel-kicker">RESPUESTA PARA RICARDO</span>
          <p>
            No triplicar todavía: el CAC blended incluye 50 orgánicos fijos y no mide el costo del próximo
            cliente de anuncios. El CAC blended histórico aumenta de{' '}
            {money(makeUnitEconomics(scenarios[0], ltv24).blendedCAC, true)} a{' '}
            {money(history30Economics.blendedCAC, true)}; el LTV:CAC baja de{' '}
            {ratio(makeUnitEconomics(scenarios[0], ltv24).blendedRatio)} a{' '}
            {ratio(history30Economics.blendedRatio)}. Con conversión fija, precio y churn no bastan:
            hay que mejorar conversión o eficiencia de adquisición y comprobarlo en cohortes antes de escalar.
            {valeriaEconomics.blendedRatio < 2.4 && <> Aun sosteniendo $20 por trial, ese supuesto no alcanza 2,4× blended a $30.000.</>}
          </p>
          <div className="investor-proof">
            <span>Δ CAC marginal al escalar de $10k a $30k</span>
            <strong>{money((history30.acquisitionCost - marginalBase.acquisitionCost) / (history30.paidCustomers - marginalBase.paidCustomers), true)}</strong>
            <small>por nuevo cliente paid incremental</small>
          </div>
        </div>

        <Assumptions />
      </section>

      <footer className="footer">
        <a className="brand" href="#inicio"><span className="brand-mark">A</span><span>AGENDO<span className="brand-sub">CYBER / FINANCE</span></span></a>
        <span>MODELO DE DECISIÓN · CASO B · USD NOMINALES</span>
        <a href="#inicio">VOLVER ARRIBA ↑</a>
      </footer>
    </main>
  )
}

export default App
