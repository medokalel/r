/**
 * Mock availability and impartiality records used by the audit team checks.
 * There is no backend endpoint yet; replace these with the competence,
 * leave/scheduling and impartiality registers once they exist.
 */

export interface AuditorBusyPeriod {
  /** Inclusive ISO dates (YYYY-MM-DD). */
  start: string
  end: string
  reason: string
}

export interface AuditorImpartialityRecord {
  clientCode: string
  reason: string
}

export const AUDITOR_BUSY_PERIODS: Record<string, AuditorBusyPeriod[]> = {
  'aud-karim': [{ start: '2026-12-01', end: '2026-12-10', reason: 'Assigned to another audit' }],
  'aud-nadia': [{ start: '2026-12-20', end: '2026-12-31', reason: 'Annual leave' }],
}

export const AUDITOR_IMPARTIALITY_RECORDS: Record<string, AuditorImpartialityRecord[]> = {
  'aud-tarek': [
    {
      clientCode: 'CL-0001',
      reason: 'Provided consultancy to this client within the last two years.',
    },
  ],
}
