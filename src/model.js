export const CASE = {
  monthlyPrice: 25,
  grossMargin: 0.78,
  trialConversion: 0.14,
  monthlyChurn: 0.06,
  annualPrice: 240,
  annualRenewalRate: 0.7,
  annualPeriodMonths: 12,
  organicCustomers: 50,
  startingCash: 60_000,
  cashFloor: 10_000,
  fixedCosts: 14_000,
  salespersonSalary: 1_200,
  trialsPerSalesperson: 500,
  commissionPerPaidCustomer: 20,
  initialActiveCustomers: 1_150,
  baseInvestment: 10_000,
  horizonMonths: 24,
}

export const HISTORICAL_SCENARIOS = [
  { investment: 0, trials: 0 },
  { investment: 5_000, trials: 290 },
  { investment: 10_000, trials: 500 },
  { investment: 15_000, trials: 650 },
  { investment: 20_000, trials: 760 },
  { investment: 30_000, trials: 900 },
]

export const ACQUISITION_CHANNELS = [
  { name: 'Meta', investment: 6_500, clicks: 9_750, trials: 433 },
  { name: 'Google', investment: 3_500, clicks: 1_480, trials: 67 },
]

export function interpolateTrials(investment) {
  const spend = Math.max(0, investment)
  const upperIndex = HISTORICAL_SCENARIOS.findIndex(
    (point) => point.investment >= spend,
  )

  if (upperIndex === -1) return HISTORICAL_SCENARIOS.at(-1).trials
  if (upperIndex <= 0) return 0

  const lower = HISTORICAL_SCENARIOS[upperIndex - 1]
  const upper = HISTORICAL_SCENARIOS[upperIndex]
  const progress = (spend - lower.investment) / (upper.investment - lower.investment)

  return lower.trials + progress * (upper.trials - lower.trials)
}

export function calculateScenario(
  investment,
  {
    price = CASE.monthlyPrice,
    grossMargin = CASE.grossMargin,
    churn = CASE.monthlyChurn,
    id = `spend-${investment}`,
    name = `Inversión ${investment}`,
    note = '',
    costPerTrial = null,
  } = {},
) {
  const trials =
    costPerTrial == null ? interpolateTrials(investment) : investment / costPerTrial
  const paidCustomers = trials * CASE.trialConversion
  const salespeople = Math.ceil(trials / CASE.trialsPerSalesperson)
  const acquisitionCost =
    investment +
    salespeople * CASE.salespersonSalary +
    paidCustomers * CASE.commissionPerPaidCustomer
  const monthlyMargin = price * grossMargin
  const ltv24 =
    churn === 0
      ? monthlyMargin * CASE.horizonMonths
      : (monthlyMargin * (1 - (1 - churn) ** CASE.horizonMonths)) / churn
  const ltvUnlimited = churn === 0 ? Infinity : monthlyMargin / churn

  return {
    id,
    name,
    note,
    investment,
    trials,
    paidCustomers,
    organicCustomers: CASE.organicCustomers,
    salespeople,
    grossMargin,
    acquisitionCost,
    monthlyMargin,
    churn,
    ltv24,
    ltvUnlimited,
    costPerTrial: trials === 0 ? null : investment / trials,
  }
}

export function getPayback(cac, monthlyMargin, churn, maxMonths = CASE.horizonMonths) {
  if (!Number.isFinite(cac) || cac <= 0 || monthlyMargin <= 0) return null

  for (let month = 1; month <= maxMonths; month += 1) {
    const contribution =
      churn === 0
        ? monthlyMargin * month
        : (monthlyMargin * (1 - (1 - churn) ** month)) / churn

    if (contribution >= cac) return month
  }

  return null
}

export function makeUnitEconomics(scenario, ltv24 = scenario.ltv24) {
  const blendedCustomers = scenario.paidCustomers + scenario.organicCustomers
  const paidCAC =
    scenario.paidCustomers > 0
      ? scenario.acquisitionCost / scenario.paidCustomers
      : null
  const blendedCAC =
    blendedCustomers > 0 ? scenario.acquisitionCost / blendedCustomers : null

  return {
    paidCAC,
    blendedCAC,
    paidRatio: paidCAC > 0 ? ltv24 / paidCAC : null,
    blendedRatio: blendedCAC > 0 ? ltv24 / blendedCAC : null,
    paidPayback: getPayback(
      paidCAC,
      scenario.monthlyMargin,
      scenario.churn,
    ),
    blendedPayback: getPayback(
      blendedCAC,
      scenario.monthlyMargin,
      scenario.churn,
    ),
  }
}

export function getRequiredConversion(investment, ltv24, targetRatio = 2.4) {
  const trials = interpolateTrials(investment)
  if (trials <= 0) return { paid: null, blended: null }

  const salespeople = Math.ceil(trials / CASE.trialsPerSalesperson)
  const targetCAC = ltv24 / targetRatio
  const fixedAcquisitionCost =
    investment + salespeople * CASE.salespersonSalary
  const contributionPerPaidCustomer =
    targetCAC - CASE.commissionPerPaidCustomer

  if (contributionPerPaidCustomer <= 0) {
    return { paid: null, blended: null }
  }

  const paidCustomersForPaidTarget =
    fixedAcquisitionCost / contributionPerPaidCustomer
  const paidCustomersForBlendedTarget = Math.max(
    0,
    (fixedAcquisitionCost - targetCAC * CASE.organicCustomers) /
      contributionPerPaidCustomer,
  )

  return {
    paid: paidCustomersForPaidTarget / trials,
    blended: paidCustomersForBlendedTarget / trials,
  }
}

export function getRequiredPrice(
  investment,
  { grossMargin = CASE.grossMargin, churn = CASE.monthlyChurn } = {},
  targetRatio = 2.4,
) {
  const scenario = calculateScenario(investment, {
    price: 1,
    grossMargin,
    churn,
  })
  const economics = makeUnitEconomics(scenario)

  if (!Number.isFinite(economics.blendedCAC) || scenario.ltv24 <= 0) {
    return null
  }

  return (economics.blendedCAC * targetRatio) / scenario.ltv24
}

function projectMonth(
  investment,
  previousCash,
  previousMonthlyActive,
  previousAnnualCohorts,
  month,
  price,
  grossMargin,
  churn,
  annualShare,
) {
  const trials = interpolateTrials(investment)
  const paidCustomers = trials * CASE.trialConversion
  const salespeople = Math.ceil(trials / CASE.trialsPerSalesperson)
  const newCustomers = paidCustomers + CASE.organicCustomers
  const newAnnualCustomers = newCustomers * annualShare
  const newMonthlyCustomers = newCustomers - newAnnualCustomers
  const monthlyActiveCustomers =
    previousMonthlyActive * (1 - churn) + newMonthlyCustomers
  let annualActiveCustomers = newAnnualCustomers
  let renewalCustomers = 0

  for (const cohort of previousAnnualCohorts) {
    if (
      month >= cohort.month &&
      month < cohort.month + CASE.annualPeriodMonths
    ) {
      annualActiveCustomers += cohort.customers
    }

    if (month === cohort.month + CASE.annualPeriodMonths) {
      renewalCustomers += cohort.customers * CASE.annualRenewalRate
    }

    if (
      month >= cohort.month + CASE.annualPeriodMonths &&
      month < cohort.month + CASE.annualPeriodMonths * 2
    ) {
      annualActiveCustomers += cohort.customers * CASE.annualRenewalRate
    }
  }

  const activeCustomers = monthlyActiveCustomers + annualActiveCustomers
  const prepaymentMargin =
    (newAnnualCustomers + renewalCustomers) * CASE.annualPrice * grossMargin
  const income =
    monthlyActiveCustomers * price * grossMargin + prepaymentMargin
  const expenses =
    investment +
    salespeople * CASE.salespersonSalary +
    paidCustomers * CASE.commissionPerPaidCustomer +
    CASE.fixedCosts

  return {
    investment,
    trials,
    paidCustomers,
    salespeople,
    monthlyActiveCustomers,
    annualActiveCustomers,
    newAnnualCustomers,
    renewalCustomers,
    prepaymentMargin,
    activeCustomers,
    income,
    expenses,
    endingCash: previousCash + income - expenses,
  }
}

export function buildCashProjection(
  monthlyInvestment,
  {
    price = CASE.monthlyPrice,
    grossMargin = CASE.grossMargin,
    churn = CASE.monthlyChurn,
    annualShare = 0,
  } = {},
) {
  const annualMix = Math.min(1, Math.max(0, annualShare))
  let protectedCash = CASE.startingCash
  let protectedMonthlyActive = CASE.initialActiveCustomers
  const protectedAnnualCohorts = []
  let unprotectedCash = CASE.startingCash
  let unprotectedMonthlyActive = CASE.initialActiveCustomers
  const unprotectedAnnualCohorts = []
  let unprotectedBreachMonth = null
  let unprotectedEndingCash = null
  let protectedFloorBreachMonth = null
  const months = []

  for (let month = 1; month <= CASE.horizonMonths; month += 1) {
    const unprotectedMonth = projectMonth(
      monthlyInvestment,
      unprotectedCash,
      unprotectedMonthlyActive,
      unprotectedAnnualCohorts,
      month,
      price,
      grossMargin,
      churn,
      annualMix,
    )
    unprotectedCash = unprotectedMonth.endingCash
    unprotectedMonthlyActive = unprotectedMonth.monthlyActiveCustomers
    if (unprotectedMonth.newAnnualCustomers > 0) {
      unprotectedAnnualCohorts.push({
        month,
        customers: unprotectedMonth.newAnnualCustomers,
      })
    }

    if (
      unprotectedBreachMonth == null &&
      unprotectedCash < CASE.cashFloor
    ) {
      unprotectedBreachMonth = month
      unprotectedEndingCash = unprotectedCash
    }

    let investment = monthlyInvestment
    let protectedMonth = projectMonth(
      investment,
      protectedCash,
      protectedMonthlyActive,
      protectedAnnualCohorts,
      month,
      price,
      grossMargin,
      churn,
      annualMix,
    )
    let investmentCapped = false

    if (protectedMonth.endingCash < CASE.cashFloor) {
      const noInvestmentMonth = projectMonth(
        0,
        protectedCash,
        protectedMonthlyActive,
        protectedAnnualCohorts,
        month,
        price,
        grossMargin,
        churn,
        annualMix,
      )

      if (noInvestmentMonth.endingCash < CASE.cashFloor) {
        investment = 0
        protectedMonth = noInvestmentMonth
        protectedFloorBreachMonth ??= month
      } else {
        let lower = 0
        let upper = monthlyInvestment
        let bestMonth = noInvestmentMonth

        for (let iteration = 0; iteration < 48; iteration += 1) {
          const midpoint = (lower + upper) / 2
          const candidate = projectMonth(
            midpoint,
            protectedCash,
            protectedMonthlyActive,
            protectedAnnualCohorts,
            month,
            price,
            grossMargin,
            churn,
            annualMix,
          )

          if (candidate.endingCash >= CASE.cashFloor) {
            lower = midpoint
            bestMonth = candidate
          } else {
            upper = midpoint
          }
        }

        investment = lower
        protectedMonth = bestMonth
      }

      investmentCapped = investment < monthlyInvestment - 0.5
    }

    protectedCash = protectedMonth.endingCash
    protectedMonthlyActive = protectedMonth.monthlyActiveCustomers
    if (protectedMonth.newAnnualCustomers > 0) {
      protectedAnnualCohorts.push({
        month,
        customers: protectedMonth.newAnnualCustomers,
      })
    }

    months.push({
      month,
      targetInvestment: monthlyInvestment,
      ...protectedMonth,
      investmentCapped,
      floorViolation: protectedCash < CASE.cashFloor,
      unprotectedEndingCash: unprotectedMonth.endingCash,
    })
  }

  return {
    months,
    unprotectedBreachMonth,
    unprotectedEndingCash,
    protectedFloorBreachMonth,
    protectedEndingCash: protectedCash,
  }
}
