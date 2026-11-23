import { getCountries } from 'libphonenumber-js'
import type { AuditPlan } from '@/lib/api/cabAuditPlanningApi'
import { countryName } from '@/lib/countries'

/** A month as `YYYY-MM`, the value used by the "Planned period" filter. */
export type PlannedPeriod = string

type PlanDates = Pick<AuditPlan, 'proposedStartDate' | 'proposedEndDate'>

const PERIOD_PATTERN = /^\d{4}-\d{2}$/
/** Safety cap so a plan with a mistyped far-future end date cannot flood the filter. */
const MAX_PERIOD_SPAN_MONTHS = 24

export function currentPeriod(now: Date = new Date()): PlannedPeriod {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/** Every month a plan touches, from its start month to its end month. */
export function planPeriods(plan: PlanDates): PlannedPeriod[] {
  const start = plan.proposedStartDate?.slice(0, 7) ?? ''
  const end = plan.proposedEndDate?.slice(0, 7) ?? ''
  if (!PERIOD_PATTERN.test(start) || !PERIOD_PATTERN.test(end)) return []

  let [year, month] = start.split('-').map(Number)
  const periods: PlannedPeriod[] = []

  for (let i = 0; i < MAX_PERIOD_SPAN_MONTHS; i += 1) {
    const key = `${year}-${String(month).padStart(2, '0')}`
    periods.push(key)
    if (key >= end) break
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }

  return periods
}

/** Distinct months covered by the plans, newest first. */
export function collectPlannedPeriods(plans: PlanDates[]): PlannedPeriod[] {
  return Array.from(new Set(plans.flatMap(planPeriods))).sort().reverse()
}

/** Distinct countries present in the plans, alphabetical. */
export function collectCountries(plans: Pick<AuditPlan, 'country'>[]): string[] {
  return Array.from(new Set(plans.map((plan) => plan.country).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  )
}

export function planOverlapsPeriod(plan: PlanDates, period: PlannedPeriod): boolean {
  return plan.proposedStartDate.slice(0, 7) <= period && plan.proposedEndDate.slice(0, 7) >= period
}

export function formatPeriodLabel(period: PlannedPeriod, locale: string): string {
  const [year, month] = period.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
}

export interface CalendarDay {
  dayNumber: number
  dateStr: string
  audits: AuditPlan[]
}

export interface CalendarMonth {
  days: CalendarDay[]
  /** Empty cells before day 1 so the first day lands on its weekday (week starts on Sunday). */
  leadingBlanks: number
}

export function buildCalendarMonth(period: PlannedPeriod, plans: AuditPlan[]): CalendarMonth {
  const [year, month] = period.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()

  const days: CalendarDay[] = Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = index + 1
    const dateStr = `${period}-${String(dayNumber).padStart(2, '0')}`
    return {
      dayNumber,
      dateStr,
      audits: plans.filter((plan) => dateStr >= plan.proposedStartDate && dateStr <= plan.proposedEndDate),
    }
  })

  return { days, leadingBlanks: new Date(year, month - 1, 1).getDay() }
}

let countryCodeByEnglishName: Map<string, string> | null = null

function getCountryCodeByEnglishName(): Map<string, string> {
  if (countryCodeByEnglishName) return countryCodeByEnglishName

  const map = new Map<string, string>()
  try {
    const english = new Intl.DisplayNames(['en'], { type: 'region' })
    for (const code of getCountries()) {
      const name = english.of(code)
      if (name) map.set(name.toLowerCase(), code)
    }
  } catch {
    // Intl.DisplayNames is unavailable: country names stay as stored.
  }
  countryCodeByEnglishName = map
  return map
}

/** Plans store the English country name; show it in the active language when it is a known country. */
export function localizeCountry(name: string, locale: string): string {
  const code = getCountryCodeByEnglishName().get(name.trim().toLowerCase())
  return code ? countryName(code, locale) : name
}
