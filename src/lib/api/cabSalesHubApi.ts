export type LeadStageId =
  | 'new_lead'
  | 'qualified'
  | 'needs_analysis'
  | 'proposal_sent'
  | 'negotiation'
  | 'won'

export type LeadSource =
  | 'Added by team'
  | 'Client portal'
  | 'Referral'
  | 'Website'
  | 'Tender'

export interface LeadActivityItem {
  id: string
  title: string
  actor: string
  timestamp: string
  type: 'stage' | 'checklist' | 'created' | 'note'
}

export interface SalesLead {
  id: string
  leadCode: string
  companyName: string
  contactPerson: string
  contactRole?: string
  email: string
  phone: string
  city: string
  sector: string
  standards: string[]
  employees: number
  sites: number
  estimatedValueSar: number
  source: LeadSource
  owner: string
  stage: LeadStageId
  checklistCompleted: string[]
  nextAction?: string
  nextActionDate?: string
  activities: LeadActivityItem[]
  overdue?: boolean
  createdAt: string
}

export interface LeadStageConfig {
  id: LeadStageId
  stepNumber: number
  labelKey: string
  defaultLabel: string
  descriptionKey: string
  defaultDescription: string
  weight: number
  badgeClassName: string
  checklist: string[]
}

export const LEAD_STAGES: LeadStageConfig[] = [
  {
    id: 'new_lead',
    stepNumber: 1,
    labelKey: 'cab.salesHub.stages.new_lead.label',
    defaultLabel: 'New lead',
    descriptionKey: 'cab.salesHub.stages.new_lead.description',
    defaultDescription: 'Received from the portal or added by the team.',
    weight: 0.1,
    badgeClassName: 'bg-[#f1f5f9] text-[#475569]',
    checklist: [
      'Acknowledge the lead within 24 hours',
      'Assign an owner',
      'Check the audit client register for duplicates',
    ],
  },
  {
    id: 'qualified',
    stepNumber: 2,
    labelKey: 'cab.salesHub.stages.qualified.label',
    defaultLabel: 'Qualified',
    descriptionKey: 'cab.salesHub.stages.qualified.description',
    defaultDescription: 'Contact made and fit with our scope confirmed.',
    weight: 0.25,
    badgeClassName: 'bg-[#e8edfc] text-primary',
    checklist: [
      'First call or meeting held',
      'Standards and certification need confirmed',
      'Within our accreditation scope (IAF code)',
      'Decision maker identified',
    ],
  },
  {
    id: 'needs_analysis',
    stepNumber: 3,
    labelKey: 'cab.salesHub.stages.needs_analysis.label',
    defaultLabel: 'Needs analysis',
    descriptionKey: 'cab.salesHub.stages.needs_analysis.description',
    defaultDescription: 'Scope, sites and headcount collected.',
    weight: 0.5,
    badgeClassName: 'bg-[#e8edfc] text-primary',
    checklist: [
      'Headcount, shifts and sites collected',
      'Certification type set (initial, transfer or recertification)',
      'Impartiality check passed (no consultancy conflict)',
      'Target audit date agreed',
    ],
  },
  {
    id: 'proposal_sent',
    stepNumber: 4,
    labelKey: 'cab.salesHub.stages.proposal_sent.label',
    defaultLabel: 'Proposal sent',
    descriptionKey: 'cab.salesHub.stages.proposal_sent.description',
    defaultDescription: 'Audit time calculated and quotation sent.',
    weight: 0.7,
    badgeClassName: 'bg-[#fef3c6] text-[#a58401]',
    checklist: [
      'Audit time calculated (IAF MD 5)',
      'Quotation approved internally',
      'Proposal sent and walkthrough held',
    ],
  },
  {
    id: 'negotiation',
    stepNumber: 5,
    labelKey: 'cab.salesHub.stages.negotiation.label',
    defaultLabel: 'Negotiation',
    descriptionKey: 'cab.salesHub.stages.negotiation.description',
    defaultDescription: 'Terms and price being agreed.',
    weight: 0.85,
    badgeClassName: 'bg-[#ffedd5] text-[#c2410c]',
    checklist: [
      'Client questions answered',
      'Final price approved by the authorised person',
      'Certification agreement terms shared',
    ],
  },
  {
    id: 'won',
    stepNumber: 6,
    labelKey: 'cab.salesHub.stages.won.label',
    defaultLabel: 'Won',
    descriptionKey: 'cab.salesHub.stages.won.description',
    defaultDescription: 'Signed certification agreement received.',
    weight: 1.0,
    badgeClassName: 'bg-[#eafaf1] text-[#16a34a]',
    checklist: [
      'Offer accepted and agreement signed',
      'Converted to an audit client',
      'Application opened',
      'Handed over to audit planning',
    ],
  },
]

const ALL_CHECKLIST_ITEMS = LEAD_STAGES.flatMap((s) => s.checklist)

export const LEAD_OWNERS = [
  'Unassigned',
  'Sara Al-Harbi',
  'Omar Al-Qahtani',
  'Khalid Al-Otaibi',
  'Noura Al-Dosari',
] as const

export const LEAD_SOURCES: LeadSource[] = [
  'Added by team',
  'Client portal',
  'Referral',
  'Website',
  'Tender',
]

const STORAGE_KEY = 'icasco_cab_sales_hub_leads_v3'
const LOST_COUNT_DEFAULT = 1

const DEFAULT_DEMO_LEADS: SalesLead[] = [
  {
    id: 'lead-1',
    leadCode: 'LD-0201',
    companyName: 'Al Noor Food Industries',
    contactPerson: 'Sara Ali',
    contactRole: 'Quality Manager',
    email: 'sara.ali@alnoor-foods.example',
    phone: '+966 50 123 4567',
    city: 'Jeddah',
    sector: 'Food Manufacturing · IAF 03',
    standards: ['ISO 9001:2015', 'ISO 22000:2018'],
    employees: 240,
    sites: 3,
    estimatedValueSar: 91488,
    source: 'Client portal',
    owner: 'Sara Al-Harbi',
    stage: 'won',
    checklistCompleted: [...ALL_CHECKLIST_ITEMS],
    nextAction: '',
    nextActionDate: '',
    activities: [
      {
        id: 'act-8',
        title: 'Stage moved to Won — Offer accepted and agreement signed',
        actor: 'Sara Al-Harbi',
        timestamp: '2026-10-28 14:20',
        type: 'stage',
      },
      {
        id: 'act-7',
        title: 'Completed checklist: Handed over to audit planning',
        actor: 'Sara Al-Harbi',
        timestamp: '2026-10-28 11:05',
        type: 'checklist',
      },
      {
        id: 'act-6',
        title: 'Completed checklist: Converted to an audit client',
        actor: 'Sara Al-Harbi',
        timestamp: '2026-10-27 16:40',
        type: 'checklist',
      },
      {
        id: 'act-5',
        title: 'Stage moved to Negotiation',
        actor: 'Sara Al-Harbi',
        timestamp: '2026-10-24 10:15',
        type: 'stage',
      },
      {
        id: 'act-4',
        title: 'Quotation QT-2026-019 sent to Sara Ali (91,488 SAR)',
        actor: 'Sara Al-Harbi',
        timestamp: '2026-10-21 15:30',
        type: 'stage',
      },
      {
        id: 'act-3',
        title: 'Stage moved to Needs analysis — 3 sites & 240 employees verified',
        actor: 'Sara Al-Harbi',
        timestamp: '2026-10-18 09:45',
        type: 'stage',
      },
      {
        id: 'act-2',
        title: 'Lead qualified — IAF 03 accreditation scope confirmed',
        actor: 'Sara Al-Harbi',
        timestamp: '2026-10-15 13:10',
        type: 'stage',
      },
      {
        id: 'act-1',
        title: 'Lead registered automatically from Client portal',
        actor: 'System',
        timestamp: '2026-10-12 09:30',
        type: 'created',
      },
    ],
    overdue: false,
    createdAt: '2026-10-12',
  },
  {
    id: 'lead-2',
    leadCode: 'LD-0202',
    companyName: 'Gulf Horizon Logistics',
    contactPerson: 'Fahad Al-Mutairi',
    contactRole: 'HSE Director',
    email: 'f.almutairi@gulfhorizon.sa',
    phone: '+966 55 831 2044',
    city: 'Riyadh',
    sector: 'Transport & Storage · IAF 31',
    standards: ['ISO 9001:2015', 'ISO 14001:2015', 'ISO 45001:2018'],
    employees: 540,
    sites: 4,
    estimatedValueSar: 1744719,
    source: 'Added by team',
    owner: 'Omar Al-Qahtani',
    stage: 'won',
    checklistCompleted: [...ALL_CHECKLIST_ITEMS],
    nextAction: '',
    nextActionDate: '',
    activities: [
      {
        id: 'act-202-2',
        title: 'Stage moved to Won — Agreement signed',
        actor: 'Omar Al-Qahtani',
        timestamp: '2026-10-25 12:00',
        type: 'stage',
      },
      {
        id: 'act-202-1',
        title: 'Lead added by business development team',
        actor: 'Omar Al-Qahtani',
        timestamp: '2026-10-18 11:15',
        type: 'created',
      },
    ],
    overdue: false,
    createdAt: '2026-10-18',
  },
  {
    id: 'lead-3',
    leadCode: 'LD-0203',
    companyName: 'Red Sea Industrial Systems',
    contactPerson: 'Maha Al-Zahrani',
    contactRole: 'Compliance Lead',
    email: 'm.alzahrani@redseaind.sa',
    phone: '+966 54 902 1173',
    city: 'Dammam',
    sector: 'Industrial Engineering · IAF 18',
    standards: ['ISO 9001:2015', 'ISO/IEC 27001:2022'],
    employees: 210,
    sites: 2,
    estimatedValueSar: 1800000,
    source: 'Referral',
    owner: 'Khalid Al-Otaibi',
    stage: 'won',
    checklistCompleted: [...ALL_CHECKLIST_ITEMS],
    nextAction: '',
    nextActionDate: '',
    activities: [
      {
        id: 'act-203-2',
        title: 'Stage moved to Won — Agreement signed',
        actor: 'Khalid Al-Otaibi',
        timestamp: '2026-10-29 15:10',
        type: 'stage',
      },
      {
        id: 'act-203-1',
        title: 'Lead created via partner referral',
        actor: 'Khalid Al-Otaibi',
        timestamp: '2026-10-24 14:00',
        type: 'created',
      },
    ],
    overdue: false,
    createdAt: '2026-10-24',
  },
]

export function getSalesHubLeads(): SalesLead[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_LEADS))
      return DEFAULT_DEMO_LEADS
    }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    return DEFAULT_DEMO_LEADS
  } catch {
    return DEFAULT_DEMO_LEADS
  }
}

export function getSalesHubLeadById(leadId: string): SalesLead | undefined {
  return getSalesHubLeads().find((lead) => lead.id === leadId)
}

export function saveSalesHubLeads(leads: SalesLead[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads))
  } catch {
    // Ignore storage quota errors
  }
}

export interface CreateSalesLeadInput {
  companyName: string
  contactPerson: string
  contactRole?: string
  email: string
  phone: string
  city: string
  sector: string
  standardsText: string
  employees: number
  sites: number
  estimatedValueSar: number
  source: LeadSource
  owner: string
}

export function createSalesLead(input: CreateSalesLeadInput): SalesLead[] {
  const current = getSalesHubLeads()
  const standards = input.standardsText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const nextNum = 200 + current.length + 1
  const nowStamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
  const newLead: SalesLead = {
    id: `lead-${Date.now()}`,
    leadCode: `LD-0${nextNum}`,
    companyName: input.companyName.trim(),
    contactPerson: input.contactPerson.trim(),
    contactRole: input.contactRole?.trim() || 'Quality Manager',
    email: input.email.trim(),
    phone: input.phone.trim(),
    city: input.city.trim() || 'Riyadh',
    sector: input.sector.trim() || 'General',
    standards: standards.length > 0 ? standards : ['ISO 9001:2015'],
    employees: Math.max(1, Number(input.employees) || 1),
    sites: Math.max(1, Number(input.sites) || 1),
    estimatedValueSar: Math.max(0, Number(input.estimatedValueSar) || 0),
    source: input.source,
    owner: input.owner || 'Unassigned',
    stage: 'new_lead',
    checklistCompleted: [],
    nextAction: '',
    nextActionDate: '',
    activities: [
      {
        id: `act-${Date.now()}`,
        title: `Lead created (${input.source})`,
        actor: input.owner || 'Team',
        timestamp: nowStamp,
        type: 'created',
      },
    ],
    overdue: false,
    createdAt: new Date().toISOString().slice(0, 10),
  }

  const next = [newLead, ...current]
  saveSalesHubLeads(next)
  return next
}

export function updateSalesLead(
  leadId: string,
  input: CreateSalesLeadInput,
): SalesLead[] {
  const current = getSalesHubLeads()
  const standards = input.standardsText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const next = current.map((lead) =>
    lead.id === leadId
      ? {
          ...lead,
          companyName: input.companyName.trim(),
          contactPerson: input.contactPerson.trim(),
          contactRole:
            input.contactRole?.trim() || lead.contactRole || 'Quality Manager',
          email: input.email.trim(),
          phone: input.phone.trim(),
          city: input.city.trim() || 'Riyadh',
          sector: input.sector.trim() || 'General',
          standards: standards.length > 0 ? standards : ['ISO 9001:2015'],
          employees: Math.max(1, Number(input.employees) || 1),
          sites: Math.max(1, Number(input.sites) || 1),
          estimatedValueSar: Math.max(0, Number(input.estimatedValueSar) || 0),
          source: input.source,
          owner: input.owner || 'Unassigned',
        }
      : lead,
  )
  saveSalesHubLeads(next)
  return next
}

export function computeSalesHubMetrics(leads: SalesLead[]) {
  const openLeads = leads.filter((l) => l.stage !== 'won')
  const wonLeads = leads.filter((l) => l.stage === 'won')
  const openCount = openLeads.length
  const unassignedOpenCount = openLeads.filter(
    (l) => !l.owner || l.owner === 'Unassigned',
  ).length

  const pipelineValueSar = openLeads.reduce(
    (sum, l) => sum + (Number(l.estimatedValueSar) || 0),
    0,
  )

  const weightedForecastSar = Math.round(
    openLeads.reduce((sum, lead) => {
      const stageCfg = LEAD_STAGES.find((s) => s.id === lead.stage)
      const weight = stageCfg?.weight ?? 0.1
      return sum + (Number(lead.estimatedValueSar) || 0) * weight
    }, 0),
  )

  const weightedPct =
    pipelineValueSar > 0
      ? Math.round((weightedForecastSar / pipelineValueSar) * 100)
      : 0

  const wonCount = wonLeads.length
  const lostCount = LOST_COUNT_DEFAULT
  const totalClosed = wonCount + lostCount
  const winRatePct =
    totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0

  const needsActionCount = openLeads.filter((l) => l.overdue).length

  return {
    openCount,
    unassignedOpenCount,
    pipelineValueSar,
    weightedForecastSar,
    weightedPct,
    winRatePct,
    wonCount,
    lostCount,
    needsActionCount,
  }
}
