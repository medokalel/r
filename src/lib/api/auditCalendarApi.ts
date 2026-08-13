export type AuditCalendarStatus =
  | 'planned'
  | 'inProgress'
  | 'completed'
  | 'reportFinalization'
  | 'cancelled'
  | 'postponed'

export interface AuditCalendarEntry {
  id: string
  /** ISO date (YYYY-MM-DD), local to the calendar's mock "today" of 2025-01-18. */
  date: string
  clientName: string
  standard: string
  auditType: string
  auditTeam: string[]
  timeRange: string
  status: AuditCalendarStatus
}

// TODO: replace with a real lookup once the backend exposes a scheduled-audits endpoint
const MOCK_AUDIT_ENTRIES: AuditCalendarEntry[] = [
  {
    id: '1',
    date: '2025-01-18',
    clientName: 'GreenLeaf Pvt.',
    standard: 'ISO 45001:2015',
    auditType: 'Surveillance Audit - 1',
    auditTeam: ['AK', 'JD'],
    timeRange: '10:00 AM - 01:00 PM',
    status: 'inProgress',
  },
  {
    id: '2',
    date: '2025-01-18',
    clientName: 'GreenLeaf Pvt.',
    standard: 'ISO 45001:2015',
    auditType: 'Surveillance Audit - 1',
    auditTeam: ['AK', 'JD'],
    timeRange: '10:00 AM - 01:00 PM',
    status: 'planned',
  },
  {
    id: '3',
    date: '2025-01-18',
    clientName: 'GreenLeaf Pvt.',
    standard: 'ISO 45001:2015',
    auditType: 'Surveillance Audit - 1',
    auditTeam: ['AK', 'JD'],
    timeRange: '10:00 AM - 01:00 PM',
    status: 'reportFinalization',
  },
  {
    id: '4',
    date: '2025-01-18',
    clientName: 'GreenLeaf Pvt.',
    standard: 'ISO 45001:2015',
    auditType: 'Surveillance Audit - 1',
    auditTeam: ['AK', 'JD'],
    timeRange: '10:00 AM - 01:00 PM',
    status: 'inProgress',
  },
  {
    id: '5',
    date: '2025-01-18',
    clientName: 'GreenLeaf Pvt.',
    standard: 'ISO 45001:2015',
    auditType: 'Surveillance Audit - 1',
    auditTeam: ['AK', 'JD'],
    timeRange: '10:00 AM - 01:00 PM',
    status: 'reportFinalization',
  },
  {
    id: '6',
    date: '2025-01-10',
    clientName: 'Acme Industries',
    standard: 'ISO 9001:2015',
    auditType: 'Stage 2 Audit',
    auditTeam: ['RM'],
    timeRange: '09:00 AM - 12:00 PM',
    status: 'completed',
  },
  {
    id: '7',
    date: '2025-01-24',
    clientName: 'BuildWell Constructions',
    standard: 'ISO 14001:2015',
    auditType: 'Stage 1 Audit',
    auditTeam: ['PN', 'AK'],
    timeRange: '01:00 PM - 04:00 PM',
    status: 'postponed',
  },
]

export function getAuditCalendarEntries(): Promise<AuditCalendarEntry[]> {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_AUDIT_ENTRIES), 300))
}