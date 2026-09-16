export type CertificationLifecycleStatus = 'active' | 'upcoming' | 'suspended' | 'expired'
export type CertificationStageStatus = 'completed' | 'upcoming' | 'pending'

export interface CertificationCycleStage {
  id: string
  label: string
  date: string
  status: CertificationStageStatus
}

export interface CertificationUpcomingActivity {
  id: string
  date: string
  activity: string
  type: 'Audit' | 'Task'
  status: 'Planned' | 'Open' | 'Done'
}

export interface CertificationCycle {
  id: string
  cycleId: string
  applicationId: string
  clientId: string
  clientName: string
  primaryContactName: string
  primaryContactEmail: string
  country: string
  certificateStandard: string
  certificateStandardLabel: string
  lifecycleStatus: CertificationLifecycleStatus
  lifecycleStatusLabel: string
  cycleStartDate: string
  cycleEndDate: string
  nextSurveillanceDue: string
  nextSurveillanceDueInDays: number
  stages: CertificationCycleStage[]
  upcomingActivities: CertificationUpcomingActivity[]
}

/** Cycle event lifecycle — drives the dot/badge styling on the manage page. */
export type CycleEventStatus = 'next' | 'planned' | 'completed'

export interface CertificationCycleEvent {
  id: string
  /** i18n key suffix under `cab.manageCycle.eventTypes.*` (e.g. `surveillance`). */
  type: string
  typeLabel: string
  windowStart: string
  windowEnd: string
  status: CycleEventStatus
  statusLabel: string
}

export interface CertificationCycleNextEvent extends CertificationCycleEvent {
  /** Negative when the target window has already passed. */
  dueInDays: number
  responsibleCoordinator: string
  scheduled: boolean
  schedulingStatusLabel: string
}

export interface CertificationActiveCertificate {
  certificateNumber: string
  standard: string
  standardLabel: string
  status: CertificationLifecycleStatus
  statusLabel: string
  validFrom: string
  validUntil: string
}

export interface CertificationCycleRecord {
  id: string
  title: string
  date: string
  status: string
}

/** One collapsible row in the "More details" section. */
export interface CertificationCycleRecordGroup {
  /** i18n key suffix under `cab.manageCycle.records.*`. */
  id: string
  count: number
  /** Shown as the trailing pill; falls back to a "no records" pill when 0. */
  highlightCount?: number
  records: CertificationCycleRecord[]
}

export interface CertificationCycleDetail extends CertificationCycle {
  cycleRangeLabel: string
  cycleStatusLabel: string
  initialCertificationDate: string
  certificationExpiryDate: string
  primaryContactPhone: string
  certificate: CertificationActiveCertificate
  nextEvent: CertificationCycleNextEvent | null
  upcomingEvents: CertificationCycleEvent[]
  recordGroups: CertificationCycleRecordGroup[]
}

export interface CertificationCycleFilterParams {
  searchQuery?: string
  dueWithinDays?: number
  country?: string
  lifecycleStatus?: string
}

const MOCK_CYCLES: CertificationCycle[] = [
  {
    id: 'cyc-0001',
    cycleId: 'CYC-0001',
    applicationId: 'APP-0024',
    clientId: 'CL-0001',
    clientName: 'Al Noor Food Industries',
    primaryContactName: 'Sara Ali',
    primaryContactEmail: 'sara@alnoor.example',
    country: 'Saudi Arabia',
    certificateStandard: 'ISO 9001',
    certificateStandardLabel: 'Quality Management Systems',
    lifecycleStatus: 'active',
    lifecycleStatusLabel: 'Active',
    cycleStartDate: '10 Jan 2023',
    cycleEndDate: '09 Jan 2026',
    nextSurveillanceDue: '10 Jan 2026',
    nextSurveillanceDueInDays: 120,
    stages: [
      { id: 'initial', label: 'Initial Certification', date: '10 Jan 2023', status: 'completed' },
      { id: 'surveillance-1', label: 'Surveillance', date: '10 Jan 2024', status: 'completed' },
      { id: 'surveillance-2', label: 'Next Surveillance', date: '10 Jan 2026', status: 'upcoming' },
      { id: 'recertification', label: 'Recertification', date: '09 Jan 2026', status: 'pending' },
    ],
    upcomingActivities: [
      { id: 'act-1', date: '10 Jan 2026', activity: 'Surveillance Audit', type: 'Audit', status: 'Planned' },
      { id: 'act-2', date: '15 Dec 2025', activity: 'Audit Plan Due', type: 'Task', status: 'Open' },
      { id: 'act-3', date: '01 Dec 2025', activity: 'Send Information Request', type: 'Task', status: 'Open' },
    ],
  },
  {
    id: 'cyc-0002',
    cycleId: 'CYC-0002',
    applicationId: 'APP-0031',
    clientId: 'CLT-2025-0148',
    clientName: 'GreenLeaf Pvt. Ltd.',
    primaryContactName: 'Omar Khalid',
    primaryContactEmail: 'omar@greenleaf.example',
    country: 'United Arab Emirates',
    certificateStandard: 'ISO 22000',
    certificateStandardLabel: 'Food Safety Management Systems',
    lifecycleStatus: 'upcoming',
    lifecycleStatusLabel: 'Upcoming',
    cycleStartDate: '02 Mar 2025',
    cycleEndDate: '01 Mar 2028',
    nextSurveillanceDue: '02 Mar 2026',
    nextSurveillanceDueInDays: 165,
    stages: [
      { id: 'initial', label: 'Initial Certification', date: '02 Mar 2025', status: 'completed' },
      { id: 'surveillance-1', label: 'Surveillance', date: '02 Mar 2026', status: 'upcoming' },
      { id: 'surveillance-2', label: 'Surveillance', date: '02 Mar 2027', status: 'pending' },
      { id: 'recertification', label: 'Recertification', date: '01 Mar 2028', status: 'pending' },
    ],
    upcomingActivities: [
      { id: 'act-1', date: '02 Mar 2026', activity: 'Surveillance Audit', type: 'Audit', status: 'Planned' },
    ],
  },
  {
    id: 'cyc-0003',
    cycleId: 'CYC-0003',
    applicationId: 'APP-0019',
    clientId: 'CL-0019',
    clientName: 'Apex Health Systems',
    primaryContactName: 'Mohammed Khan',
    primaryContactEmail: 'mkhan@apexhealth.example',
    country: 'Egypt',
    certificateStandard: 'ISO 13485',
    certificateStandardLabel: 'Medical Devices Quality Management',
    lifecycleStatus: 'suspended',
    lifecycleStatusLabel: 'Suspended',
    cycleStartDate: '20 Jan 2022',
    cycleEndDate: '19 Jan 2025',
    nextSurveillanceDue: '20 Jan 2025',
    nextSurveillanceDueInDays: -14,
    stages: [
      { id: 'initial', label: 'Initial Certification', date: '20 Jan 2022', status: 'completed' },
      { id: 'surveillance-1', label: 'Surveillance', date: '20 Jan 2023', status: 'completed' },
      { id: 'surveillance-2', label: 'Surveillance', date: '20 Jan 2024', status: 'completed' },
      { id: 'recertification', label: 'Recertification', date: '19 Jan 2025', status: 'upcoming' },
    ],
    upcomingActivities: [
      { id: 'act-1', date: '19 Jan 2025', activity: 'Recertification Audit', type: 'Audit', status: 'Open' },
    ],
  },
]

const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getCertificationCycles(
  filters: CertificationCycleFilterParams = {},
): Promise<CertificationCycle[]> {
  await wait()
  const query = filters.searchQuery?.trim().toLowerCase()

  return MOCK_CYCLES.filter((cycle) => {
    if (query) {
      const haystack = `${cycle.clientName} ${cycle.clientId} ${cycle.certificateStandard}`.toLowerCase()
      if (!haystack.includes(query)) return false
    }
    if (filters.country && filters.country !== 'all' && cycle.country !== filters.country) {
      return false
    }
    if (
      filters.lifecycleStatus &&
      filters.lifecycleStatus !== 'all' &&
      cycle.lifecycleStatus !== filters.lifecycleStatus
    ) {
      return false
    }
    if (filters.dueWithinDays !== undefined && cycle.nextSurveillanceDueInDays > filters.dueWithinDays) {
      return false
    }
    return true
  })
}

/** Detail-only fields, keyed by cycle id and merged onto the list record. */
const MOCK_CYCLE_DETAILS: Record <
  string,
  Omit<CertificationCycleDetail, keyof CertificationCycle>
> = {
  'cyc-0001': {
    cycleRangeLabel: '2024 – 2027',
    cycleStatusLabel: 'In progress',
    initialCertificationDate: '15 Jan 2024',
    certificationExpiryDate: '14 Jan 2027',
    primaryContactPhone: '+966 50 123 4567',
    certificate: {
      certificateNumber: 'CERT-0024',
      standard: 'ISO 22000:2018',
      standardLabel: 'Food safety management systems',
      status: 'active',
      statusLabel: 'Active',
      validFrom: '15 Jan 2024',
      validUntil: '14 Jan 2027',
    },
    nextEvent: {
      id: 'evt-1',
      type: 'surveillance',
      typeLabel: 'Surveillance',
      windowStart: '15 Jan 2025',
      windowEnd: '15 Mar 2025',
      status: 'next',
      statusLabel: 'Next',
      dueInDays: 45,
      responsibleCoordinator: 'Sara Ali',
      scheduled: false,
      schedulingStatusLabel: 'Not yet scheduled',
    },
    upcomingEvents: [
      {
        id: 'evt-1',
        type: 'surveillance',
        typeLabel: 'Surveillance',
        windowStart: '15 Jan 2025',
        windowEnd: '15 Mar 2025',
        status: 'next',
        statusLabel: 'Next',
      },
      {
        id: 'evt-2',
        type: 'surveillance',
        typeLabel: 'Surveillance',
        windowStart: '15 Jan 2026',
        windowEnd: '15 Mar 2026',
        status: 'planned',
        statusLabel: 'Planned',
      },
      {
        id: 'evt-3',
        type: 'recertification',
        typeLabel: 'Recertification',
        windowStart: '15 Oct 2026',
        windowEnd: '14 Jan 2027',
        status: 'planned',
        statusLabel: 'Planned',
      },
    ],
    recordGroups: [
      {
        id: 'scopeChanges',
        count: 1,
        highlightCount: 1,
        records: [{ id: 'sc-1', title: 'Add HACCP scope line', date: '02 Feb 2025', status: 'Open' }],
      },
      {
        id: 'siteChanges',
        count: 2,
        records: [
          { id: 'si-1', title: 'Add Jeddah warehouse', date: '11 Dec 2024', status: 'Approved' },
          { id: 'si-2', title: 'Remove Dammam depot', date: '03 Sep 2024', status: 'Approved' },
        ],
      },
      { id: 'transfers', count: 0, records: [] },
      { id: 'suspensions', count: 0, records: [] },
    ],
  },
  'cyc-0002': {
    cycleRangeLabel: '2025 – 2028',
    cycleStatusLabel: 'Upcoming',
    initialCertificationDate: '02 Mar 2025',
    certificationExpiryDate: '01 Mar 2028',
    primaryContactPhone: '+971 50 998 2211',
    certificate: {
      certificateNumber: 'CERT-0031',
      standard: 'ISO 22000:2018',
      standardLabel: 'Food safety management systems',
      status: 'upcoming',
      statusLabel: 'Upcoming',
      validFrom: '02 Mar 2025',
      validUntil: '01 Mar 2028',
    },
    nextEvent: {
      id: 'evt-1',
      type: 'surveillance',
      typeLabel: 'Surveillance',
      windowStart: '02 Mar 2026',
      windowEnd: '02 May 2026',
      status: 'next',
      statusLabel: 'Next',
      dueInDays: 165,
      responsibleCoordinator: 'Omar Khalid',
      scheduled: false,
      schedulingStatusLabel: 'Not yet scheduled',
    },
    upcomingEvents: [
      {
        id: 'evt-1',
        type: 'surveillance',
        typeLabel: 'Surveillance',
        windowStart: '02 Mar 2026',
        windowEnd: '02 May 2026',
        status: 'next',
        statusLabel: 'Next',
      },
      {
        id: 'evt-2',
        type: 'surveillance',
        typeLabel: 'Surveillance',
        windowStart: '02 Mar 2027',
        windowEnd: '02 May 2027',
        status: 'planned',
        statusLabel: 'Planned',
      },
    ],
    recordGroups: [
      { id: 'scopeChanges', count: 0, records: [] },
      { id: 'siteChanges', count: 0, records: [] },
      { id: 'transfers', count: 0, records: [] },
      { id: 'suspensions', count: 0, records: [] },
    ],
  },
  'cyc-0003': {
    cycleRangeLabel: '2022 – 2025',
    cycleStatusLabel: 'Suspended',
    initialCertificationDate: '20 Jan 2022',
    certificationExpiryDate: '19 Jan 2025',
    primaryContactPhone: '+20 100 447 8890',
    certificate: {
      certificateNumber: 'CERT-0019',
      standard: 'ISO 13485:2016',
      standardLabel: 'Medical devices quality management',
      status: 'suspended',
      statusLabel: 'Suspended',
      validFrom: '20 Jan 2022',
      validUntil: '19 Jan 2025',
    },
    nextEvent: {
      id: 'evt-1',
      type: 'recertification',
      typeLabel: 'Recertification',
      windowStart: '19 Oct 2024',
      windowEnd: '19 Jan 2025',
      status: 'next',
      statusLabel: 'Next',
      dueInDays: -14,
      responsibleCoordinator: 'Mohammed Khan',
      scheduled: true,
      schedulingStatusLabel: 'Scheduled',
    },
    upcomingEvents: [
      {
        id: 'evt-1',
        type: 'recertification',
        typeLabel: 'Recertification',
        windowStart: '19 Oct 2024',
        windowEnd: '19 Jan 2025',
        status: 'next',
        statusLabel: 'Next',
      },
    ],
    recordGroups: [
      { id: 'scopeChanges', count: 0, records: [] },
      { id: 'siteChanges', count: 0, records: [] },
      { id: 'transfers', count: 0, records: [] },
      {
        id: 'suspensions',
        count: 1,
        highlightCount: 1,
        records: [{ id: 'su-1', title: 'Suspended — overdue recertification', date: '20 Jan 2025', status: 'Open' }],
      },
    ],
  },
}

/**
 * Loads one cycle for the manage page. Accepts either the internal id
 * (`cyc-0001`) or the human-facing cycle id (`CYC-0001`) so links from the
 * register and from external notifications both resolve.
 */
export async function getCertificationCycleDetail(
  cycleId: string,
): Promise<CertificationCycleDetail | null> {
  await wait()
  const needle = cycleId.trim().toLowerCase()
  const cycle = MOCK_CYCLES.find(
    (item) => item.id.toLowerCase() === needle || item.cycleId.toLowerCase() === needle,
  )
  const detail = cycle ? MOCK_CYCLE_DETAILS[cycle.id] : undefined

  if (!cycle || !detail) return null

  return { ...cycle, ...detail }
}

export function certificationCyclesToCsv(cycles: CertificationCycle[]): string {
  const header = ['Cycle ID', 'Client', 'Standard', 'Country', 'Status', 'Next surveillance due']
  const rows = cycles.map((cycle) => [
    cycle.cycleId,
    cycle.clientName,
    cycle.certificateStandard,
    cycle.country,
    cycle.lifecycleStatusLabel,
    cycle.nextSurveillanceDue,
  ])
  return [header, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}