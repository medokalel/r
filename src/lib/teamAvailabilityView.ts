/**
 * Pure view-model builder for the CAB team availability calendar.
 *
 * Zero-import module on purpose: the unit tests load it through the
 * transpile-and-VM harness used by the other lib tests (tests/*.test.mjs).
 *
 * Data comes from the same sources the team-selection engine reads:
 *   - unavailability periods (leave, training, ...) from the personnel register
 *   - audit bookings from the audit plans and their saved teams
 * Days are plain `yyyy-mm-dd` strings, so no timezone shifts can move a day.
 */

export type AvailabilityCellState =
  | 'free'
  | 'auditConfirmed'
  | 'auditUnconfirmed'
  | 'leave'
  | 'conflict'

export interface AvailabilityPersonLike {
  id: string
  name: string
  role?: string | null
}

export interface AvailabilityBookingLike {
  personId: string
  planNumber: string
  clientName?: string | null
  start: string
  end: string
  confirmed: boolean
}

export interface AvailabilityUnavailabilityLike {
  personId: string
  start: string
  end: string
  reason?: string | null
}

export interface AvailabilityEntry {
  kind: 'audit' | 'unavailable'
  label: string
  detail: string
  confirmed: boolean
}

export interface AvailabilityCell {
  day: string
  dayOfMonth: number
  weekday: number
  state: AvailabilityCellState
  entries: AvailabilityEntry[]
}

export interface AvailabilityRow {
  personId: string
  name: string
  role: string
  cells: AvailabilityCell[]
  auditDays: number
  leaveDays: number
  conflictDays: number
}

export interface AvailabilityMonthView {
  year: number
  month: number
  monthKey: string
  days: { day: string; dayOfMonth: number; weekday: number; isToday: boolean }[]
  rows: AvailabilityRow[]
  totals: {
    people: number
    auditDays: number
    leaveDays: number
    conflictDays: number
    peopleWithConflicts: number
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Normalize an ISO date/datetime to `yyyy-mm-dd`, or null. */
export function toDayString(iso?: string | null): string | null {
  if (!iso) return null
  const clean = String(iso).split('T')[0]
  return /^\d{4}-\d{2}-\d{2}$/.test(clean) ? clean : null
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** `month` is 1-12. Weekday 0 = Sunday. */
export function weekdayOf(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

export function dayKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`
}

export function monthKeyOf(year: number, month: number): string {
  return `${year}-${pad(month)}`
}

/** Move by whole months; rolls the year over in both directions. */
export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta
  return { year: Math.floor(index / 12), month: (index % 12 + 12) % 12 + 1 }
}

/** Month containing the given day string, or the fallback if it is not a valid day. */
export function monthOfDay(
  day: string | null | undefined,
  fallback: { year: number; month: number },
): { year: number; month: number } {
  const clean = toDayString(day)
  if (!clean) return fallback
  return { year: Number(clean.slice(0, 4)), month: Number(clean.slice(5, 7)) }
}

function covers(start: string | null, end: string | null, day: string): boolean {
  if (!start) return false
  const last = end && end >= start ? end : start
  return start <= day && day <= last
}

export function stateOfEntries(entries: AvailabilityEntry[]): AvailabilityCellState {
  if (!entries.length) return 'free'
  const audits = entries.filter((entry) => entry.kind === 'audit')
  const unavailable = entries.filter((entry) => entry.kind === 'unavailable')
  if (audits.length > 1 || (audits.length > 0 && unavailable.length > 0)) return 'conflict'
  if (audits.length === 1) return audits[0].confirmed ? 'auditConfirmed' : 'auditUnconfirmed'
  return 'leave'
}

export function buildMonthView(input: {
  year: number
  month: number
  today: string
  people: AvailabilityPersonLike[]
  bookings: AvailabilityBookingLike[]
  unavailability: AvailabilityUnavailabilityLike[]
  search?: string
}): AvailabilityMonthView {
  const { year, month, today } = input
  const total = daysInMonth(year, month)
  const days = Array.from({ length: total }, (_, i) => {
    const dayOfMonth = i + 1
    const day = dayKey(year, month, dayOfMonth)
    return { day, dayOfMonth, weekday: weekdayOf(year, month, dayOfMonth), isToday: day === today }
  })

  const needle = (input.search ?? '').trim().toLowerCase()
  const people = input.people.filter(
    (person) => !needle || person.name.toLowerCase().includes(needle),
  )

  const rows: AvailabilityRow[] = people.map((person) => {
    const bookings = input.bookings.filter((b) => b.personId === person.id)
    const unavailable = input.unavailability.filter((u) => u.personId === person.id)
    let auditDays = 0
    let leaveDays = 0
    let conflictDays = 0
    const cells: AvailabilityCell[] = days.map((d) => {
      const entries: AvailabilityEntry[] = []
      for (const b of bookings) {
        if (covers(toDayString(b.start), toDayString(b.end), d.day)) {
          entries.push({
            kind: 'audit',
            label: b.planNumber,
            detail: b.clientName ?? '',
            confirmed: b.confirmed,
          })
        }
      }
      for (const u of unavailable) {
        if (covers(toDayString(u.start), toDayString(u.end), d.day)) {
          entries.push({
            kind: 'unavailable',
            label: u.reason ?? 'OTHER',
            detail: '',
            confirmed: true,
          })
        }
      }
      const state = stateOfEntries(entries)
      if (state === 'conflict') conflictDays += 1
      else if (state === 'leave') leaveDays += 1
      else if (state !== 'free') auditDays += 1
      return { day: d.day, dayOfMonth: d.dayOfMonth, weekday: d.weekday, state, entries }
    })
    return {
      personId: person.id,
      name: person.name,
      role: person.role ?? '',
      cells,
      auditDays,
      leaveDays,
      conflictDays,
    }
  })

  return {
    year,
    month,
    monthKey: monthKeyOf(year, month),
    days,
    rows,
    totals: {
      people: rows.length,
      auditDays: rows.reduce((sum, r) => sum + r.auditDays, 0),
      leaveDays: rows.reduce((sum, r) => sum + r.leaveDays, 0),
      conflictDays: rows.reduce((sum, r) => sum + r.conflictDays, 0),
      peopleWithConflicts: rows.filter((r) => r.conflictDays > 0).length,
    },
  }
}
