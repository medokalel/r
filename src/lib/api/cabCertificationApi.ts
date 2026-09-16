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