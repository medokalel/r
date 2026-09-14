export interface AgendaActivity {
  id: string
  date: string
  startTime: string
  endTime: string
  activity: string
  auditors: string[]
  durationHours: number
}

export interface SiteAllocation {
  siteCode: string
  siteName: string
  onSitePersonnel: string[]
  siteAddress: string
}

export interface RemoteActivities {
  enabled: boolean
  activities: string[]
  platform: string
  notes: string
}

export interface TravelNotes {
  details: string
}

export interface TeamDeclarations {
  availabilityConfirmed: boolean
  noConflictsDeclared: boolean
  conflictNotes?: string
}

export interface EligibilityCheckResult {
  passed: boolean
  competenceAuthorization: {
    status: 'passed' | 'warning' | 'failed'
    details: string
    certifiedStandards: string[]
  }
  availability: {
    status: 'passed' | 'warning' | 'failed'
    details: string
    conflictingEvents: string[]
  }
  impartiality: {
    status: 'passed' | 'warning' | 'failed'
    details: string
    conflictReasons: string[]
    silentOverrideAllowed: false
  }
}

export interface AuditPlan {
  id: string
  planNumber: string // e.g., 'AUD-0024'
  clientName: string
  clientCode: string
  country: string
  stage: 'Planning' | 'Stage 1' | 'Stage 2' | 'Surveillance 1' | 'Surveillance 2' | 'Recertification' | 'Special Audit'
  applicationNumber: string // e.g., 'APP-0024'
  standardName: string // e.g., 'Food Safety Management (ISO 22000)' or 'ISO 22000:2018'
  reviewedDurationCode: string // e.g., 'DUR-0024'
  reviewedDurationDays: number // e.g., 3.0
  totalEffortHours: number // e.g., 8.0
  siteCode: string // e.g., 'SITE-001'
  siteName: string // e.g., 'Riyadh (Main)'
  siteAddress: string
  primaryContactName: string
  primaryContactEmail: string
  primaryContactPhone: string
  proposedStartDate: string // 'YYYY-MM-DD'
  proposedEndDate: string // 'YYYY-MM-DD'
  durationDays: number
  timezone: string // e.g., 'Asia/Riyadh'
  leadAuditor: string
  auditTeam: string[]
  auditObjectives: string
  scopeSummary: string
  status: 'Draft' | 'Planned' | 'In progress' | 'Under review' | 'Completed' | 'Rescheduled'
  agendaActivities: AgendaActivity[]
  siteAllocation: SiteAllocation
  remoteActivities: RemoteActivities
  travelNotes: TravelNotes
  teamDeclarations: TeamDeclarations
  version: number
  rescheduleHistory?: Array<{
    date: string
    previousDates: string
    newDates: string
    reason: string
    rescheduledBy: string
  }>
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'icasco_cab_audit_plans_v1'

const initialAuditPlans: AuditPlan[] = [
  {
    id: 'plan-0024',
    planNumber: 'AUD-0024',
    clientName: 'Al Noor Food Industries',
    clientCode: 'CL-0001',
    country: 'Saudi Arabia',
    stage: 'Stage 1',
    applicationNumber: 'APP-0024',
    standardName: 'Food Safety Management (ISO 22000)',
    reviewedDurationCode: 'DUR-0024',
    reviewedDurationDays: 3.0,
    totalEffortHours: 8.0,
    siteCode: 'SITE-001',
    siteName: 'Riyadh (Main)',
    siteAddress: 'Al Noor Food Industries, Second Industrial City, Riyadh 14334, Saudi Arabia',
    primaryContactName: 'Sara Ali',
    primaryContactEmail: 'sara@alnoor.example',
    primaryContactPhone: '+966 50 123 4567',
    proposedStartDate: '2025-05-18',
    proposedEndDate: '2025-05-19',
    durationDays: 5,
    timezone: 'Asia/Riyadh',
    leadAuditor: 'Alex Morgan',
    auditTeam: ['Alex Morgan', 'Priya Desai', 'Omar Al-Farsi'],
    auditObjectives:
      'Confirm readiness for Stage 2, evaluate implementation status and site specific conditions.',
    scopeSummary:
      'Production of food products, including processing, packaging and storage at Riyadh site (SITE-001).',
    status: 'Planned',
    version: 1,
    siteAllocation: {
      siteCode: 'SITE-001 - Riyadh',
      siteName: 'SITE-001 - Riyadh',
      onSitePersonnel: ['Alex Morgan', 'Priya Desai', 'Omar Al-Farsi'],
      siteAddress: 'Al Noor Food Industries\nSecond Industrial City\nRiyadh 14334\nSaudi Arabia',
    },
    remoteActivities: {
      enabled: true,
      activities: ['Document review', 'Interviews (if required)'],
      platform: 'Microsoft Teams',
      notes: 'Client to arrange access and invitations.',
    },
    travelNotes: {
      details:
        'Auditors to arrive in Riyadh on 17 May 2025. Accommodation booked near the site. Local transport to be arranged by client.',
    },
    teamDeclarations: {
      availabilityConfirmed: true,
      noConflictsDeclared: true,
      conflictNotes: 'No conflict of interest with Al Noor Food Industries or affiliate entities in past 3 years.',
    },
    agendaActivities: [
      {
        id: 'act-1',
        date: '2025-05-18',
        startTime: '09:00',
        endTime: '09:30',
        activity: 'Opening meeting',
        auditors: ['Alex Morgan'],
        durationHours: 0.5,
      },
      {
        id: 'act-2',
        date: '2025-05-18',
        startTime: '09:30',
        endTime: '11:00',
        activity: 'Management system overview',
        auditors: ['Alex Morgan', 'Priya Desai'],
        durationHours: 1.5,
      },
      {
        id: 'act-3',
        date: '2025-05-18',
        startTime: '11:00',
        endTime: '12:30',
        activity: 'Site tour (production, packaging)',
        auditors: ['Alex Morgan', 'Omar Al-Farsi'],
        durationHours: 1.5,
      },
      {
        id: 'act-4',
        date: '2025-05-18',
        startTime: '13:30',
        endTime: '15:00',
        activity: 'Document review',
        auditors: ['Priya Desai'],
        durationHours: 1.5,
      },
      {
        id: 'act-5',
        date: '2025-05-19',
        startTime: '09:00',
        endTime: '11:00',
        activity: 'Interviews (key personnel)',
        auditors: ['Alex Morgan', 'Priya Desai'],
        durationHours: 2.0,
      },
      {
        id: 'act-6',
        date: '2025-05-19',
        startTime: '11:00',
        endTime: '12:00',
        activity: 'Close out meeting',
        auditors: ['Alex Morgan'],
        durationHours: 1.0,
      },
    ],
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-12T14:30:00Z',
  },
  {
    id: 'plan-0025',
    planNumber: 'AUD-0025',
    clientName: 'GreenLeaf Pvt. Ltd.',
    clientCode: 'CLT-2025-0148',
    country: 'United Arab Emirates',
    stage: 'Stage 2',
    applicationNumber: 'APP-0148',
    standardName: 'Environmental Management (ISO 14001)',
    reviewedDurationCode: 'DUR-0148',
    reviewedDurationDays: 2.5,
    totalEffortHours: 16.0,
    siteCode: 'SITE-002',
    siteName: 'Dubai Logistics Hub',
    siteAddress: 'Jebel Ali Free Zone, Dubai, UAE',
    primaryContactName: 'Tariq Mansoor',
    primaryContactEmail: 'tariq@greenleaf.example',
    primaryContactPhone: '+971 50 987 6543',
    proposedStartDate: '2026-10-22',
    proposedEndDate: '2026-10-24',
    durationDays: 3,
    timezone: 'Asia/Dubai',
    leadAuditor: 'Layla Al-Khatib',
    auditTeam: ['Layla Al-Khatib', 'Hassan Mahmoud'],
    auditObjectives: 'Verify implementation compliance with ISO 14001:2015 requirements.',
    scopeSummary: 'Warehousing, supply chain operations and environmental monitoring at Dubai facility.',
    status: 'Draft',
    version: 1,
    siteAllocation: {
      siteCode: 'SITE-002 - Dubai',
      siteName: 'SITE-002 - Dubai',
      onSitePersonnel: ['Layla Al-Khatib', 'Hassan Mahmoud'],
      siteAddress: 'Jebel Ali Free Zone, Dubai, United Arab Emirates',
    },
    remoteActivities: {
      enabled: false,
      activities: [],
      platform: 'Zoom',
      notes: '',
    },
    travelNotes: {
      details: 'Local auditors based in Dubai. Flight arrangements not required.',
    },
    teamDeclarations: {
      availabilityConfirmed: true,
      noConflictsDeclared: true,
    },
    agendaActivities: [
      {
        id: 'act-25-1',
        date: '2026-10-22',
        startTime: '09:00',
        endTime: '10:00',
        activity: 'Opening Meeting & Facility Walkthrough',
        auditors: ['Layla Al-Khatib'],
        durationHours: 1.0,
      },
    ],
    createdAt: '2026-10-05T09:00:00Z',
    updatedAt: '2026-10-05T09:00:00Z',
  },
]

function getStoredPlans(): AuditPlan[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(initialAuditPlans))
      return initialAuditPlans
    }
    return JSON.parse(raw) as AuditPlan[]
  } catch {
    return initialAuditPlans
  }
}

function saveStoredPlans(plans: AuditPlan[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(plans))
  } catch (err) {
    console.error('Failed to save audit plans to storage', err)
  }
}

export interface AuditPlanFilters {
  search?: string
  plannedPeriod?: string
  country?: string
  status?: string
}

export async function fetchAuditPlans(filters?: AuditPlanFilters): Promise<AuditPlan[]> {
  await new Promise((r) => setTimeout(r, 80))
  let plans = getStoredPlans()

  if (filters) {
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase()
      plans = plans.filter(
        (p) =>
          p.planNumber.toLowerCase().includes(q) ||
          p.clientName.toLowerCase().includes(q) ||
          p.clientCode.toLowerCase().includes(q) ||
          p.leadAuditor.toLowerCase().includes(q) ||
          p.standardName.toLowerCase().includes(q)
      )
    }

    if (filters.country && filters.country !== 'All') {
      plans = plans.filter((p) => p.country.toLowerCase() === filters.country!.toLowerCase())
    }

    if (filters.status && filters.status !== 'All') {
      plans = plans.filter((p) => p.status.toLowerCase() === filters.status!.toLowerCase())
    }
  }

  return plans
}

export async function fetchAuditPlanById(idOrNumber: string): Promise<AuditPlan | null> {
  await new Promise((r) => setTimeout(r, 60))
  const plans = getStoredPlans()
  const found = plans.find((p) => p.id === idOrNumber || p.planNumber === idOrNumber)
  return found || null
}

export async function saveAuditPlan(plan: Partial<AuditPlan> & { id?: string }): Promise<AuditPlan> {
  await new Promise((r) => setTimeout(r, 120))
  const plans = getStoredPlans()

  if (plan.id) {
    const index = plans.findIndex((p) => p.id === plan.id || p.planNumber === plan.id)
    if (index >= 0) {
      const updated: AuditPlan = {
        ...plans[index],
        ...plan,
        updatedAt: new Date().toISOString(),
      }
      plans[index] = updated
      saveStoredPlans(plans)
      return updated
    }
  }

  // Create new plan
  const count = plans.length + 1
  const newNumber = `AUD-${String(count).padStart(4, '0')}`
  const newPlan: AuditPlan = {
    id: `plan-${Date.now()}`,
    planNumber: plan.planNumber || newNumber,
    clientName: plan.clientName || 'Al Noor Food Industries',
    clientCode: plan.clientCode || 'CL-0001',
    country: plan.country || 'Saudi Arabia',
    stage: plan.stage || 'Stage 1',
    applicationNumber: plan.applicationNumber || 'APP-0024',
    standardName: plan.standardName || 'Food Safety Management (ISO 22000)',
    reviewedDurationCode: plan.reviewedDurationCode || 'DUR-0024',
    reviewedDurationDays: plan.reviewedDurationDays || 3.0,
    totalEffortHours: plan.totalEffortHours || 8.0,
    siteCode: plan.siteCode || 'SITE-001',
    siteName: plan.siteName || 'Riyadh (Main)',
    siteAddress: plan.siteAddress || 'Riyadh, Saudi Arabia',
    primaryContactName: plan.primaryContactName || 'Sara Ali',
    primaryContactEmail: plan.primaryContactEmail || 'sara@alnoor.example',
    primaryContactPhone: plan.primaryContactPhone || '+966 50 123 4567',
    proposedStartDate: plan.proposedStartDate || new Date().toISOString().split('T')[0],
    proposedEndDate: plan.proposedEndDate || new Date().toISOString().split('T')[0],
    durationDays: plan.durationDays || 5,
    timezone: plan.timezone || 'Asia/Riyadh',
    leadAuditor: plan.leadAuditor || 'Alex Morgan',
    auditTeam: plan.auditTeam || ['Alex Morgan'],
    auditObjectives: plan.auditObjectives || '',
    scopeSummary: plan.scopeSummary || '',
    status: plan.status || 'Draft',
    version: 1,
    siteAllocation: plan.siteAllocation || {
      siteCode: 'SITE-001 - Riyadh',
      siteName: 'SITE-001 - Riyadh',
      onSitePersonnel: ['Alex Morgan'],
      siteAddress: 'Riyadh, Saudi Arabia',
    },
    remoteActivities: plan.remoteActivities || {
      enabled: false,
      activities: [],
      platform: 'Microsoft Teams',
      notes: '',
    },
    travelNotes: plan.travelNotes || { details: '' },
    teamDeclarations: plan.teamDeclarations || {
      availabilityConfirmed: true,
      noConflictsDeclared: true,
    },
    agendaActivities: plan.agendaActivities || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  plans.unshift(newPlan)
  saveStoredPlans(plans)
  return newPlan
}

export async function checkAuditPlanReadiness(idOrNumber: string): Promise<EligibilityCheckResult> {
  await new Promise((r) => setTimeout(r, 100))
  const plan = await fetchAuditPlanById(idOrNumber)

  if (!plan) {
    return {
      passed: false,
      competenceAuthorization: {
        status: 'failed',
        details: 'Audit plan not found',
        certifiedStandards: [],
      },
      availability: {
        status: 'failed',
        details: 'Audit plan not found',
        conflictingEvents: [],
      },
      impartiality: {
        status: 'failed',
        details: 'Audit plan not found',
        conflictReasons: ['Plan does not exist'],
        silentOverrideAllowed: false,
      },
    }
  }

  // Check 1: Competence
  const hasLead = Boolean(plan.leadAuditor)
  const competenceStatus: 'passed' | 'warning' | 'failed' = hasLead ? 'passed' : 'failed'

  // Check 2: Availability
  const availabilityStatus: 'passed' | 'warning' | 'failed' = plan.teamDeclarations.availabilityConfirmed
    ? 'passed'
    : 'warning'

  // Check 3: Impartiality / Conflict
  const impartialityStatus: 'passed' | 'warning' | 'failed' = plan.teamDeclarations.noConflictsDeclared
    ? 'passed'
    : 'failed'

  const allPassed = competenceStatus === 'passed' && availabilityStatus === 'passed' && impartialityStatus === 'passed'

  return {
    passed: allPassed,
    competenceAuthorization: {
      status: competenceStatus,
      details: hasLead
        ? `Lead Auditor ${plan.leadAuditor} is certified for ${plan.standardName} under sector codes EA 03 / EA 29.`
        : 'Lead Auditor is not assigned or qualified.',
      certifiedStandards: ['ISO 22000:2018', 'FSSC 22000 v6', 'ISO 9001:2015'],
    },
    availability: {
      status: availabilityStatus,
      details: plan.teamDeclarations.availabilityConfirmed
        ? `All ${plan.auditTeam.length} team members confirmed available for ${plan.proposedStartDate} to ${plan.proposedEndDate}.`
        : 'Team availability is pending confirmation.',
      conflictingEvents: [],
    },
    impartiality: {
      status: impartialityStatus,
      details: plan.teamDeclarations.noConflictsDeclared
        ? 'Impartiality verified: No consultancy or financial ties within the required 3-year restriction window.'
        : 'Conflict of interest check flagged potential consultancy conflict.',
      conflictReasons: plan.teamDeclarations.noConflictsDeclared ? [] : ['Previous consultancy tie within 24 months'],
      silentOverrideAllowed: false,
    },
  }
}

export async function sendAuditPlanToClient(
  idOrNumber: string,
  recipientInfo: { email: string; name: string; notes?: string }
): Promise<{ success: boolean; message: string; timestamp: string }> {
  await new Promise((r) => setTimeout(r, 200))
  const plan = await fetchAuditPlanById(idOrNumber)
  if (plan) {
    plan.status = 'Planned'
    await saveAuditPlan(plan)
  }
  return {
    success: true,
    message: `Audit plan ${idOrNumber} successfully sent to ${recipientInfo.name} (${recipientInfo.email}).`,
    timestamp: new Date().toISOString(),
  }
}

export async function rescheduleAuditPlan(
  idOrNumber: string,
  newDates: { startDate: string; endDate: string; reason: string; rescheduledBy?: string }
): Promise<AuditPlan> {
  const plan = await fetchAuditPlanById(idOrNumber)
  if (!plan) throw new Error('Audit plan not found')

  const historyEntry = {
    date: new Date().toISOString(),
    previousDates: `${plan.proposedStartDate} – ${plan.proposedEndDate}`,
    newDates: `${newDates.startDate} – ${newDates.endDate}`,
    reason: newDates.reason,
    rescheduledBy: newDates.rescheduledBy || 'Lead Auditor',
  }

  const updated: AuditPlan = {
    ...plan,
    proposedStartDate: newDates.startDate,
    proposedEndDate: newDates.endDate,
    version: plan.version + 1,
    status: 'Rescheduled',
    rescheduleHistory: [...(plan.rescheduleHistory || []), historyEntry],
  }

  return saveAuditPlan(updated)
}

export function exportAuditPlansToFormat(plans: AuditPlan[], format: 'csv' | 'json' | 'excel'): void {
  if (format === 'json') {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(plans, null, 2))
    const dlAnchorElem = document.createElement('a')
    dlAnchorElem.setAttribute('href', dataStr)
    dlAnchorElem.setAttribute('download', `audit_plans_${new Date().toISOString().split('T')[0]}.json`)
    dlAnchorElem.click()
    return
  }

  const headers = [
    'Audit Plan',
    'Client Name',
    'Client Code',
    'Country',
    'Stage',
    'Standard',
    'Sites',
    'Start Date',
    'End Date',
    'Lead Auditor',
    'Status',
  ]
  const rows = plans.map((p) => [
    p.planNumber,
    `"${p.clientName}"`,
    p.clientCode,
    p.country,
    p.stage,
    `"${p.standardName}"`,
    `"${p.siteName}"`,
    p.proposedStartDate,
    p.proposedEndDate,
    `"${p.leadAuditor}"`,
    p.status,
  ])

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `audit_plans_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
