/**
 * Date rules for a new audit plan. Pure and free of React/i18n so the form can
 * show the right message and the rules can be unit-tested.
 */

export type AuditDateError = 'startRequired' | 'endRequired' | 'startInPast' | 'endBeforeStart'

/** Local calendar date as `YYYY-MM-DD` (not UTC, so it matches what the user sees). */
export function todayIsoDate(now: Date = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** First problem with the dates, or `null` when they are valid. ISO dates compare as strings. */
export function validateAuditDates(start: string, end: string, today: string): AuditDateError | null {
  if (!start) return 'startRequired'
  if (!end) return 'endRequired'
  if (start < today) return 'startInPast'
  if (end < start) return 'endBeforeStart'
  return null
}

/** Which date field an error belongs to. */
export function auditDateErrorField(error: AuditDateError): 'start' | 'end' {
  return error === 'startRequired' || error === 'startInPast' ? 'start' : 'end'
}
