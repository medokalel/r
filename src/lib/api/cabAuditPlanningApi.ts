import { AUDITOR_REGISTER } from '@/lib/teamSelection/teamMember'

export type AuditStageType =
  | 'Stage 1'
  | 'Stage 2'
  | 'Surveillance 1'
  | 'Surveillance 2'
  | 'Recertification'
  | 'Special Audit'

export type AuditPlanStatus = 'Draft' | 'Planned' | 'In progress' | 'Under review' | 'Completed'

export interface AuditTeamMember {
  id: string
  name: string
  initials: string
  role: 'Lead Auditor' | 'Auditor' | 'Technical Expert' | 'Trainee Auditor' | 'Observer'
  passesChecks: boolean
  schemes: string[]
  iafCodes: string[]
  country: string
  reason?: string
}

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

/** The travel cost estimate saved with a plan: the inputs it was worked out from and the result. */
export interface AuditTravelEstimate {
  mode: 'ON_SITE' | 'HYBRID' | 'REMOTE'
  firstDay: string
  lastDay: string
  sites: { name: string; address: string; cityKey: string; onsite: boolean }[]
  /** `baseKey` is empty when the auditor travels from the CAB's office city. */
  team: { name: string; baseKey: string }[]
  currency: string
  total: number
  lines: { key: string; amount: number }[]
  bySite: { name: string; total: number }[]
  savedAt: string
}

export interface TeamDeclarations {
  availabilityConfirmed: boolean
  noConflictsDeclared: boolean
  conflictNotes?: string
}

export type ChecklistResultValue =
  | 'Conforming'
  | 'Observation'
  | 'OFI'
  | 'Minor NC'
  | 'Major NC'
  | 'Not audited'
  | 'N/A'
  | ''

export interface ChecklistItem {
  id: string
  clauseRef: string
  title: string
  mandatory: boolean
  description: string
  whatToLookFor: string
  evidenceToAskFor: string[]
  result: ChecklistResultValue
  evidenceNotes: string
  documentsSampled: string
  peopleInterviewed: string
  photoName?: string
}

export interface AuditChecklistSection {
  id: string
  title: string
  libraryTag: string
  assignedAuditor: string
  items: ChecklistItem[]
}

export interface TimeSpentEntry {
  id: string
  auditor: string
  date: string
  hours: number
  activity: string
  remote: boolean
}

export interface AttendeeRecord {
  id: string
  name: string
  position: string
  organization: 'Client' | 'Audit team' | 'Observer'
  attendedRemotely: boolean
  signatureMode?: 'draw' | 'type' | 'upload'
  signatureValue?: string
}

export interface DailyWrapUp {
  id: string
  date: string
  notes: string
}

export interface AuditExecutionData {
  activeStep: 1 | 2 | 3 | 4 | 5 | 6
  completedSteps: number[]
  preparation: {
    agreementId: string
    agreementActive: boolean
    planSentToClient: boolean
    planConfirmedByClient: boolean
    /** The client's latest decision on the sent plan (client-side phase 2).
     *  Null until the client confirms or objects. The demo shortcuts that set
     *  planConfirmedByClient directly leave this null. */
    clientResponse: ClientPlanResponse | null
    declarationsCompleted: boolean
    clientDocumentsReviewed: boolean
    preparationNotes: string
  }
  openingMeeting: {
    agendaConfirmed: boolean
    confidentialityGiven: boolean
    meetingNotes: string
    attendees: AttendeeRecord[]
  }
  checklists: AuditChecklistSection[]
  timeSpent: TimeSpentEntry[]
  teamReview: {
    dailyWrapUps: DailyWrapUp[]
    gradingConsensus: boolean
    internalTeamNotes: string
  }
  closingMeeting: {
    findingsPresented: boolean
    clientPosition: 'Agrees' | 'Partly agrees' | 'Disagrees' | ''
    clientComments: string
    ncResponseDueBy: string
    closingNotes: string
    attendees: AttendeeRecord[]
  }
  report: {
    executiveSummary: string
    recommendation: string
    reportFinalized: boolean
  }
}

export interface ClientPlanResponse {
  decision: 'confirmed' | 'objection'
  /** Name of the team member the client objected to (objection only). */
  memberName?: string
  /** The client's stated reason (objection only). */
  reason?: string
  at: string
}

export interface AuditPlanEvent {
  id: string
  at: string
  /** Machine-readable action, e.g. `lifecycle.start`, `team.confirmed`, `team.exception`. */
  action: string
  detail?: string
}

export interface AuditPlan {
  id: string
  planNumber: string
  clientName: string
  clientCode: string
  country: string
  stage: AuditStageType
  applicationNumber: string
  standardName: string
  standards: string[]
  reviewedDurationCode: string
  reviewedDurationDays: number
  totalEffortHours: number
  siteCode: string
  siteName: string
  siteAddress: string
  primaryContactName: string
  primaryContactEmail: string
  primaryContactPhone: string
  proposedStartDate: string
  proposedEndDate: string
  durationDays: number
  timezone: string
  leadAuditor: string
  auditTeam: string[]
  teamMembers: AuditTeamMember[]
  auditTrailNote?: string
  teamConfirmed?: boolean
  auditObjectives: string
  scopeSummary: string
  status: AuditPlanStatus
  agendaActivities: AgendaActivity[]
  siteAllocation: SiteAllocation
  remoteActivities: RemoteActivities
  travelNotes: TravelNotes
  travelEstimate?: AuditTravelEstimate
  teamDeclarations: TeamDeclarations
  /** Plan history: lifecycle steps, team confirmation, exception requests. */
  events?: AuditPlanEvent[]
  /** Names of the team members whose competence log received this audit on completion. */
  competenceLoggedFor?: string[]
  /** Audit checklists attached to this plan (library or custom checklist ids). */
  checklistIds?: string[]
  execution: AuditExecutionData
  version: number
  createdAt: string
  updatedAt: string
}

export interface ClientApplicationOption {
  id: string
  type: 'application' | 'cycle' | 'special'
  label: string
  stage: AuditStageType
  applicationNumber: string
  standardName: string
  standards: string[]
  reviewedDurationDays: number
  siteCode: string
  siteName: string
  siteAddress: string
}

export interface AuditPlanningClient {
  code: string
  name: string
  country: string
  primaryContactName: string
  primaryContactEmail: string
  primaryContactPhone: string
  agreementId: string
  agreementActive: boolean
  options: ClientApplicationOption[]
}

export const AUDIT_PLANNING_CLIENTS: AuditPlanningClient[] = [
  {
    code: 'C1A00011',
    name: 'ISSC',
    country: 'Egypt',
    primaryContactName: 'Khalid Al-Harbi',
    primaryContactEmail: 'khalid.harbi@issc.example',
    primaryContactPhone: '+20 1002103344',
    agreementId: 'AGR-0001 v1',
    agreementActive: false,
    options: [
      {
        id: 'app-issc-s1',
        type: 'application',
        label: 'APP-0310 · Stage 1 — Integrated Management System (ISO 9001, ISO 14001, ISO 45001)',
        stage: 'Stage 1',
        applicationNumber: 'ISSC',
        standardName: 'Integrated Management System',
        standards: ['ISO 9001:2015', 'ISO 14001:2015', 'ISO 45001:2018'],
        reviewedDurationDays: 2.5,
        siteCode: 'SITE-1101',
        siteName: 'ISSC Head Office',
        siteAddress: 'ISSC Head Office, New Cairo, Cairo, Egypt',
      },
      {
        id: 'app-issc-s2',
        type: 'cycle',
        label: 'CYC-0310 · Stage 2 — Integrated Management System (2.5 days)',
        stage: 'Stage 2',
        applicationNumber: 'ISSC',
        standardName: 'Integrated Management System',
        standards: ['ISO 9001:2015', 'ISO 14001:2015', 'ISO 45001:2018'],
        reviewedDurationDays: 2.5,
        siteCode: 'SITE-1101',
        siteName: 'ISSC Head Office',
        siteAddress: 'ISSC Head Office, New Cairo, Cairo, Egypt',
      },
      {
        id: 'special-audit',
        type: 'special',
        label: 'None: special audit (reason required)',
        stage: 'Special Audit',
        applicationNumber: 'ISSC',
        standardName: 'Special Audit',
        standards: ['ISO 9001:2015', 'ISO 14001:2015', 'ISO 45001:2018'],
        reviewedDurationDays: 1.0,
        siteCode: 'SITE-1101',
        siteName: 'ISSC',
        siteAddress: 'ISSC Head Office, New Cairo, Cairo, Egypt',
      },
    ],
  },
  {
    code: 'CL-0001',
    name: 'Al Noor Food Industries',
    country: 'Saudi Arabia',
    primaryContactName: 'Sara Ali',
    primaryContactEmail: 'sara@alnoor.example',
    primaryContactPhone: '+966 50 123 4567',
    agreementId: 'AGR-0002 v1',
    agreementActive: true,
    options: [
      {
        id: 'app-alnoor-s1',
        type: 'application',
        label: 'APP-0024 · Stage 1 — Food Safety & Quality (ISO 9001, ISO 22000)',
        stage: 'Stage 1',
        applicationNumber: 'APP-0024',
        standardName: 'Food Safety Management System',
        standards: ['ISO 9001:2015', 'ISO 22000:2018'],
        reviewedDurationDays: 3.0,
        siteCode: 'SITE-001',
        siteName: 'Riyadh Main Plant',
        siteAddress: 'Al Noor Food Industries, Second Industrial City, Riyadh 14334, Saudi Arabia',
      },
      {
        id: 'special-audit',
        type: 'special',
        label: 'None: special audit (reason required)',
        stage: 'Special Audit',
        applicationNumber: 'APP-0024',
        standardName: 'Special Audit',
        standards: ['ISO 9001:2015', 'ISO 22000:2018'],
        reviewedDurationDays: 1.0,
        siteCode: 'SITE-001',
        siteName: 'Riyadh Main Plant',
        siteAddress: 'Al Noor Food Industries, Second Industrial City, Riyadh 14334, Saudi Arabia',
      },
    ],
  },
]

/** Everyone who can audit, taken from the personnel register. */
export const AVAILABLE_AUDITORS_POOL: AuditTeamMember[] = AUDITOR_REGISTER

export function buildDefaultChecklists(leadAuditor = 'Omar Hassan'): AuditChecklistSection[] {
  const stage1Items: ChecklistItem[] = [
    {
      id: 's1-1',
      clauseRef: '17021-1 9.3.1.2 a',
      title: 'Documented information of the management system',
      mandatory: true,
      description:
        "The documented information of the client's management system has been reviewed and covers what the standard requires (scope, policy, objectives, required procedures and records).",
      whatToLookFor: 'Record gaps that would block Stage 2.',
      evidenceToAskFor: ['Document review notes', 'Quality / IMS manual', 'Master list of documented information'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 's1-2',
      clauseRef: '17021-1 9.3.1.2 b',
      title: 'Site conditions and preparedness',
      mandatory: true,
      description:
        'Site-specific conditions have been evaluated and discussed with client personnel to judge preparedness for Stage 2.',
      whatToLookFor: 'Confirm physical layout, access controls, shift patterns, and any site hazards before Stage 2.',
      evidenceToAskFor: ['Site tour observation log', 'Facility layout map', 'HSE induction rules'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 's1-3',
      clauseRef: '17021-1 9.3.1.2 c',
      title: 'Understanding of the standard and key performance',
      mandatory: true,
      description:
        "The client's status and understanding of the standard's requirements have been reviewed, in particular the key performance, significant aspects, processes, objectives and operation of the management system.",
      whatToLookFor: 'Verify personnel understand process KPIs, significant environmental aspects, and OH&S hazards.',
      evidenceToAskFor: ['KPI dashboard', 'Objectives register', 'Process interaction matrix'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 's1-4',
      clauseRef: '17021-1 9.3.1.2 d',
      title: 'Scope, processes, sites and legal compliance',
      mandatory: true,
      description:
        'Information on the scope, processes, equipment, controls, sites and related legal and regulatory aspects, including permits and licences, has been collected and confirmed.',
      whatToLookFor: 'Check commercial registration, operating permits, environmental approvals, and legal compliance register.',
      evidenceToAskFor: ['Legal & regulatory register', 'Operating licence / CR', 'Civil defense & environmental permits'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 's1-5',
      clauseRef: '17021-1 9.3.1.2 e',
      title: 'Resources and details for Stage 2',
      mandatory: true,
      description:
        'The allocation of resources and the details of Stage 2 (dates, sites, shifts, people to interview, audit time and team) have been reviewed and agreed with the client.',
      whatToLookFor: 'Confirm Stage 2 duration (IAF MD 5), shift coverage, and availability of key process owners.',
      evidenceToAskFor: ['Draft Stage 2 schedule', 'Shift roster', 'Resource allocation confirmation'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 's1-6',
      clauseRef: '17021-1 9.3.1.2 f',
      title: 'Focus for planning Stage 2',
      mandatory: true,
      description:
        'Enough understanding of the management system and site operations has been gained to plan Stage 2 with the right focus.',
      whatToLookFor: 'Identify priority operational processes, high-risk areas, and interfaces for Stage 2 sampling.',
      evidenceToAskFor: ['Process map', 'Risk & opportunity register', 'Stage 2 focus notes'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 's1-7',
      clauseRef: '17021-1 9.3.1.2 g',
      title: 'Internal audits and management review planned and performed',
      mandatory: true,
      description:
        'Internal audits and management reviews are planned and have been performed, and the level of implementation shows the client is ready for Stage 2.',
      whatToLookFor: 'Verify full internal audit cycle and formal management review outputs covering all required inputs.',
      evidenceToAskFor: ['Internal audit programme & reports', 'Nonconformity & corrective action logs', 'Management review minutes'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 's1-8',
      clauseRef: 'Stage 1 outsourcing',
      title: 'Outsourced processes',
      mandatory: true,
      description:
        'Processes the client outsources have been identified, with the controls it applies to them.',
      whatToLookFor: 'Confirm how outsourced processes affecting conformity are controlled and monitored.',
      evidenceToAskFor: ['Approved external providers list', 'SLAs / supplier evaluation records'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 's1-9',
      clauseRef: 'IAF MD 1',
      title: 'Multi-site organization and sampling',
      mandatory: false,
      description:
        'For multi-site clients the central function, the list of sites and their eligibility for sampling have been confirmed.',
      whatToLookFor: 'Confirm central function authority and multi-site sampling eligibility if applicable.',
      evidenceToAskFor: ['Site register', 'Central function organogram'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 's1-10',
      clauseRef: 'IAF MD 4',
      title: 'Remote auditing and ICT feasibility',
      mandatory: false,
      description:
        "Where remote techniques are planned, the ICT tools, connectivity, confidentiality and the client's agreement have been checked and tested.",
      whatToLookFor: 'Verify video/audio connection stability, screen sharing, and information security rules.',
      evidenceToAskFor: ['ICT test record', 'Remote audit consent'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 's1-11',
      clauseRef: '17021-1 9.3.1.3',
      title: 'Concerns that could be nonconformities at Stage 2',
      mandatory: true,
      description:
        'Concerns that could be classified as nonconformities at Stage 2 are documented and communicated to the client.',
      whatToLookFor: 'Document all areas of concern clearly so the client can address them before Stage 2 begins.',
      evidenceToAskFor: ['List of Stage 1 areas of concern', 'Client acknowledgement'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 's1-12',
      clauseRef: '17021-1 8.3',
      title: 'Use of certification marks and claims',
      mandatory: true,
      description:
        "The client does not claim certification or use the CAB's marks before certification is granted.",
      whatToLookFor: 'Check client website, brochures, email signatures, and packaging for premature certification claims.',
      evidenceToAskFor: ['Website & marketing review', 'Packaging / letterhead samples'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 's1-13',
      clauseRef: 'Stage 1 conclusion',
      title: 'Readiness for Stage 2',
      mandatory: true,
      description:
        'Based on the above, a conclusion is reached on whether the client is ready for Stage 2 and the interval between the stages is agreed.',
      whatToLookFor: 'Ensure interval between Stage 1 and Stage 2 allows resolving any identified concerns (typically <= 6 months).',
      evidenceToAskFor: ['Stage 1 conclusion statement', 'Agreed Stage 2 target dates'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
  ]

  const imsCommonClauses: ChecklistItem[] = [
    {
      id: 'ims-1',
      clauseRef: 'Clause 4.1',
      title: 'Understanding the organization and its context',
      mandatory: true,
      description: 'External and internal issues relevant to the purpose and strategic direction of the IMS are determined and monitored.',
      whatToLookFor: 'Verify PESTLE / SWOT or context analysis covering quality, environmental, and OH&S issues.',
      evidenceToAskFor: ['Context analysis matrix', 'Strategic review notes'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 'ims-2',
      clauseRef: 'Clause 4.2',
      title: 'Understanding the needs and expectations of interested parties',
      mandatory: true,
      description: 'Interested parties (including workers, regulators, customers) and their relevant requirements are determined.',
      whatToLookFor: 'Check identification of legal vs voluntary obligations from interested parties.',
      evidenceToAskFor: ['Interested parties register', 'Compliance obligations mapping'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 'ims-3',
      clauseRef: 'Clause 4.3',
      title: 'Determining the scope of the management system',
      mandatory: true,
      description: 'The boundaries and applicability of the IMS are documented and available to interested parties.',
      whatToLookFor: 'Confirm physical boundaries, activities, products/services, and any justified exclusions under ISO 9001.',
      evidenceToAskFor: ['IMS Scope statement', 'Manual / documented scope'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 'ims-4',
      clauseRef: 'Clause 4.4',
      title: 'Management system and its processes',
      mandatory: true,
      description: 'Processes needed for the IMS and their interactions, inputs, outputs, criteria, and resources are established.',
      whatToLookFor: 'Verify turtle diagrams or process descriptions and performance indicators.',
      evidenceToAskFor: ['Process map', 'Standard operating procedures'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 'ims-5',
      clauseRef: 'Clause 5.1',
      title: 'Leadership and commitment',
      mandatory: true,
      description: 'Top management demonstrates leadership and commitment with respect to the IMS, customer focus, and worker protection.',
      whatToLookFor: 'Interview top management on accountability, resource provision, and integration into business processes.',
      evidenceToAskFor: ['Management interview notes', 'Budget & resource approvals'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 'ims-6',
      clauseRef: 'Clause 5.2',
      title: 'Management system policy',
      mandatory: true,
      description: 'An integrated or aligned policy is established, communicated, and available to interested parties.',
      whatToLookFor: 'Confirm commitments to continual improvement, customer satisfaction, pollution prevention, and safe working conditions.',
      evidenceToAskFor: ['Signed IMS Policy', 'Noticeboard / intranet communication'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 'ims-7',
      clauseRef: 'Clause 5.3',
      title: 'Organizational roles, responsibilities and authorities',
      mandatory: true,
      description: 'Responsibilities and authorities for relevant roles are assigned and communicated within the organization.',
      whatToLookFor: 'Check organogram, job descriptions, and appointment letters.',
      evidenceToAskFor: ['Organization chart', 'Role descriptions & competency matrices'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 'ims-8',
      clauseRef: 'Clause 6.1',
      title: 'Actions to address risks and opportunities',
      mandatory: true,
      description: 'Risks and opportunities related to processes, context, and interested parties are assessed and addressed.',
      whatToLookFor: 'Review risk assessment methodology, mitigation actions, and effectiveness evaluation.',
      evidenceToAskFor: ['IMS Risk & Opportunity Register', 'Action tracking log'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 'ims-9',
      clauseRef: 'Clause 6.2',
      title: 'Management system objectives and planning to achieve them',
      mandatory: true,
      description: 'Measurable objectives are established at relevant functions and levels with clear action plans.',
      whatToLookFor: 'Confirm targets, responsibilities, timelines, and resources for each objective.',
      evidenceToAskFor: ['IMS Objectives & Targets Plan', 'Quarterly tracking sheets'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 'ims-10',
      clauseRef: 'Clause 7.1 – 7.3',
      title: 'Resources, competence and awareness',
      mandatory: true,
      description: 'Necessary resources, personnel competence, training records, and staff awareness are maintained.',
      whatToLookFor: 'Sample employee training files, qualification records, and awareness of policy/hazards.',
      evidenceToAskFor: ['Training plan & attendance logs', 'Competence evaluations'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 'ims-11',
      clauseRef: 'Clause 7.4',
      title: 'Internal and external communication',
      mandatory: true,
      description: 'Processes for internal and external communications relevant to the IMS are established.',
      whatToLookFor: 'Check communication matrix covering what, when, with whom, and how.',
      evidenceToAskFor: ['Communication matrix', 'Regulatory / external correspondence log'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 'ims-12',
      clauseRef: 'Clause 7.5',
      title: 'Documented information control',
      mandatory: true,
      description: 'Documented information is controlled for creation, approval, distribution, revision, retention, and disposal.',
      whatToLookFor: 'Verify version control, obsolete document handling, and backup of electronic records.',
      evidenceToAskFor: ['Document control procedure', 'Master document & record register'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 'ims-13',
      clauseRef: 'Clause 9.1',
      title: 'Monitoring, measurement, analysis and evaluation',
      mandatory: true,
      description: 'Performance and effectiveness of the IMS and compliance obligations are monitored and evaluated.',
      whatToLookFor: 'Check calibration records, KPI analysis, and evaluation of legal compliance.',
      evidenceToAskFor: ['Compliance evaluation report', 'Calibration certificates', 'Performance metrics'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 'ims-14',
      clauseRef: 'Clause 9.2',
      title: 'Internal audit programme',
      mandatory: true,
      description: 'Internal audits are conducted at planned intervals to verify conformity and effective implementation.',
      whatToLookFor: 'Check auditor impartiality, audit criteria coverage, checklists, and audit reports.',
      evidenceToAskFor: ['Annual internal audit schedule', 'Internal auditor qualification records', 'Internal audit reports'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 'ims-15',
      clauseRef: 'Clause 9.3 & 10.2',
      title: 'Management review, nonconformity and corrective action',
      mandatory: true,
      description: 'Top management reviews the IMS and nonconformities are reacted to with root-cause corrective actions.',
      whatToLookFor: 'Confirm all standard inputs/outputs in management review and root cause analysis in CAPA logs.',
      evidenceToAskFor: ['Management review minutes', 'CAPA / NCR register'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
  ]

  const iso9001Items: ChecklistItem[] = [
    {
      id: 'qms-1',
      clauseRef: 'ISO 9001 8.2 & 8.3',
      title: 'Requirements for products and services & design/development',
      mandatory: true,
      description: 'Customer requirements are determined and reviewed; design and development controls (or justified exclusion) are verified.',
      whatToLookFor: 'Review customer contract review records and design control stages or justification for 8.3 exclusion.',
      evidenceToAskFor: ['Customer order review records', 'Design procedure / exclusion justification'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 'qms-2',
      clauseRef: 'ISO 9001 8.4',
      title: 'Control of externally provided processes, products and services',
      mandatory: true,
      description: 'Criteria for evaluation, selection, monitoring of performance, and re-evaluation of external providers are applied.',
      whatToLookFor: 'Check approved vendor list, supplier evaluation scores, and incoming inspection criteria.',
      evidenceToAskFor: ['Supplier evaluation records', 'Purchase orders & specifications'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 'qms-3',
      clauseRef: 'ISO 9001 8.5 – 8.7',
      title: 'Production and service provision, release and nonconforming outputs',
      mandatory: true,
      description: 'Production/service operations are carried out under controlled conditions, with release verification and control of nonconforming outputs.',
      whatToLookFor: 'Verify traceability, preservation, final inspection sign-off, and quarantine/segregation of nonconforming items.',
      evidenceToAskFor: ['Quality control plans', 'Batch release records', 'Nonconforming product log'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
  ]

  const iso14001Items: ChecklistItem[] = [
    {
      id: 'ems-1',
      clauseRef: 'ISO 14001 6.1.2',
      title: 'Environmental aspects and life-cycle perspective',
      mandatory: true,
      description: 'Environmental aspects and associated impacts of activities, products, and services are identified under normal, abnormal, and emergency conditions.',
      whatToLookFor: 'Check significance scoring criteria, life-cycle perspective, and operational controls linked to significant aspects.',
      evidenceToAskFor: ['Environmental Aspects & Impacts Register', 'Significance evaluation procedure'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 'ems-2',
      clauseRef: 'ISO 14001 8.1 & 8.2',
      title: 'Environmental operational control and emergency preparedness',
      mandatory: true,
      description: 'Operational controls for waste, emissions, and resource use are in place, along with environmental emergency response plans.',
      whatToLookFor: 'Check hazardous waste manifests, spill kits, environmental emergency drills, and contractor controls.',
      evidenceToAskFor: ['Waste disposal manifests', 'Environmental emergency plan & drill report'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
  ]

  const iso45001Items: ChecklistItem[] = [
    {
      id: 'ohs-1',
      clauseRef: 'ISO 45001 5.4',
      title: 'Consultation and participation of workers',
      mandatory: true,
      description: 'Mechanisms for consultation and participation of workers and worker representatives at all applicable levels are established.',
      whatToLookFor: 'Check safety committee composition, worker feedback channels, and involvement in hazard identification.',
      evidenceToAskFor: ['OH&S committee minutes', 'Worker safety suggestion logs'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 'ohs-2',
      clauseRef: 'ISO 45001 6.1.2',
      title: 'Hazard identification and assessment of OH&S risks',
      mandatory: true,
      description: 'Ongoing and proactive hazard identification covers routine/non-routine activities, human factors, and hierarchy of controls.',
      whatToLookFor: 'Verify HIRA register covers physical, chemical, ergonomic, and psychosocial hazards and applies the hierarchy of controls.',
      evidenceToAskFor: ['HIRA / Job Safety Analysis register', 'Hierarchy of controls documentation'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 'ohs-3',
      clauseRef: 'ISO 45001 8.1',
      title: 'Operational planning, hierarchy of controls, contractors and MOC',
      mandatory: true,
      description: 'Processes for eliminating hazards, management of change (MOC), procurement, and contractor safety coordination are implemented.',
      whatToLookFor: 'Review permit-to-work system, PPE issuance, contractor inductions, and management of change records.',
      evidenceToAskFor: ['Permit to work samples', 'Contractor HSE files', 'Management of Change log'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
    {
      id: 'ohs-4',
      clauseRef: 'ISO 45001 8.2 & 10.2',
      title: 'Emergency preparedness and incident investigation',
      mandatory: true,
      description: 'Emergency response plans are tested periodically, and incidents/near-misses are investigated with worker participation.',
      whatToLookFor: 'Check fire/evacuation drill evaluations, first-aid readiness, and incident/near-miss root-cause reports.',
      evidenceToAskFor: ['Emergency drill records', 'Incident & near-miss investigation log'],
      result: '',
      evidenceNotes: '',
      documentsSampled: '',
      peopleInterviewed: '',
    },
  ]

  return [
    {
      id: 'chk-stage1-readiness',
      title: 'Stage 1 readiness review',
      libraryTag: 'iCASCO library, approved',
      assignedAuditor: leadAuditor,
      items: stage1Items,
    },
    {
      id: 'chk-ims-common',
      title: 'Integrated management system (common clauses)',
      libraryTag: 'iCASCO library, approved',
      assignedAuditor: leadAuditor,
      items: imsCommonClauses,
    },
    {
      id: 'chk-iso-9001',
      title: 'ISO 9001 Quality management system (specific requirements)',
      libraryTag: 'iCASCO library, approved',
      assignedAuditor: leadAuditor,
      items: iso9001Items,
    },
    {
      id: 'chk-iso-14001',
      title: 'ISO 14001 Environmental management system (specific requirements)',
      libraryTag: 'iCASCO library, approved',
      assignedAuditor: leadAuditor,
      items: iso14001Items,
    },
    {
      id: 'chk-iso-45001',
      title: 'ISO 45001 Occupational health and safety management system (specific requirements)',
      libraryTag: 'iCASCO library, approved',
      assignedAuditor: leadAuditor,
      items: iso45001Items,
    },
  ]
}

export const LIBRARY_EXTRA_CHECKLISTS: Array<{ id: string; title: string; itemsCount: number; clausePrefix: string }> = [
  { id: 'lib-iso-9001', title: 'ISO 9001 Quality management system', itemsCount: 3, clausePrefix: 'ISO 9001' },
  { id: 'lib-iso-14001', title: 'ISO 14001 Environmental management system', itemsCount: 2, clausePrefix: 'ISO 14001' },
  { id: 'lib-iso-45001', title: 'ISO 45001 Occupational health and safety management system', itemsCount: 4, clausePrefix: 'ISO 45001' },
  { id: 'lib-iso-22000', title: 'ISO 22000 Food safety management system (with optional FSSC 22000 add-ons)', itemsCount: 4, clausePrefix: 'ISO 22000' },
  { id: 'lib-iso-27001', title: 'ISO/IEC 27001 Information security management system (with Annex A themes)', itemsCount: 4, clausePrefix: 'ISO/IEC 27001' },
  { id: 'lib-iso-50001', title: 'ISO 50001 Energy management system', itemsCount: 3, clausePrefix: 'ISO 50001' },
  { id: 'lib-iso-22301', title: 'ISO 22301 Business continuity management system', itemsCount: 3, clausePrefix: 'ISO 22301' },
  { id: 'lib-iso-13485', title: 'ISO 13485 Medical devices quality management system', itemsCount: 3, clausePrefix: 'ISO 13485' },
  { id: 'lib-iso-37001', title: 'ISO 37001 Anti-bribery management system', itemsCount: 3, clausePrefix: 'ISO 37001' },
  { id: 'lib-iso-20000', title: 'ISO/IEC 20000-1 Service management system', itemsCount: 3, clausePrefix: 'ISO/IEC 20000-1' },
  { id: 'lib-iso-39001', title: 'ISO 39001 Road traffic safety management system', itemsCount: 3, clausePrefix: 'ISO 39001' },
  { id: 'lib-iso-41001', title: 'ISO 41001 Facility management system', itemsCount: 3, clausePrefix: 'ISO 41001' },
  { id: 'lib-iso-21001', title: 'ISO 21001 Management system for educational organizations', itemsCount: 3, clausePrefix: 'ISO 21001' },
  { id: 'lib-ims-common', title: 'Integrated management system (common clauses)', itemsCount: 15, clausePrefix: 'IMS' },
  { id: 'lib-stage1', title: 'Stage 1 readiness review', itemsCount: 13, clausePrefix: '17021-1' },
]

function buildDefaultExecution(leadAuditor = 'Omar Hassan', agreementId = 'AGR-0001 v1', agreementActive = false): AuditExecutionData {
  return {
    activeStep: 1,
    completedSteps: [],
    preparation: {
      agreementId,
      agreementActive,
      planSentToClient: false,
      planConfirmedByClient: false,
      clientResponse: null,
      declarationsCompleted: true,
      clientDocumentsReviewed: false,
      preparationNotes: '',
    },
    openingMeeting: {
      agendaConfirmed: false,
      confidentialityGiven: false,
      meetingNotes: '',
      attendees: [],
    },
    checklists: buildDefaultChecklists(leadAuditor),
    timeSpent: [],
    teamReview: {
      dailyWrapUps: [],
      gradingConsensus: false,
      internalTeamNotes: '',
    },
    closingMeeting: {
      findingsPresented: false,
      clientPosition: '',
      clientComments: '',
      ncResponseDueBy: '',
      closingNotes: '',
      attendees: [],
    },
    report: {
      executiveSummary: '',
      recommendation: 'Proceed to Stage 2 audit as scheduled subject to resolution of any Stage 1 areas of concern.',
      reportFinalized: false,
    },
  }
}

const STORAGE_KEY = 'icasco_cab_audit_plans_v3'

const initialAuditPlans: AuditPlan[] = [
  {
    id: 'plan-0310',
    planNumber: 'AUD-0310',
    clientName: 'ISSC',
    clientCode: 'C1A00011',
    country: 'Egypt',
    stage: 'Stage 1',
    applicationNumber: 'ISSC',
    standardName: 'Integrated Management System',
    standards: ['ISO 9001:2015', 'ISO 14001:2015', 'ISO 45001:2018'],
    reviewedDurationCode: 'DUR-0310',
    reviewedDurationDays: 2.5,
    totalEffortHours: 20.0,
    siteCode: 'SITE-1101',
    siteName: 'ISSC Head Office',
    siteAddress: 'ISSC Head Office, New Cairo, Cairo, Egypt',
    primaryContactName: 'Khalid Al-Harbi',
    primaryContactEmail: 'khalid.harbi@issc.example',
    primaryContactPhone: '+20 1002103344',
    proposedStartDate: '2026-12-05',
    proposedEndDate: '2026-12-07',
    durationDays: 3,
    timezone: 'Asia/Riyadh',
    leadAuditor: 'Omar Hassan',
    auditTeam: ['Omar Hassan'],
    teamMembers: [
      {
        id: 'aud-omar',
        name: 'Omar Hassan',
        initials: 'OH',
        role: 'Lead Auditor',
        passesChecks: true,
        schemes: ['ISO 9001:2015', 'ISO 14001:2015', 'ISO 45001:2018'],
        iafCodes: ['EA 18', 'EA 28', 'EA 35'],
        country: 'Egypt',
      },
      {
        id: 'aud-mostafa',
        name: 'Mostafa Adel',
        initials: 'MA',
        role: 'Auditor',
        passesChecks: true,
        schemes: ['ISO 9001:2015', 'ISO 14001:2015', 'ISO 45001:2018'],
        iafCodes: ['EA 18', 'EA 29'],
        country: 'Egypt',
      },
    ],
    auditTrailNote: 'Agreed with the technical manager.',
    teamConfirmed: true,
    auditObjectives:
      'Evaluate the client management system documented information, site-specific conditions, and readiness for Stage 2 in accordance with ISO/IEC 17021-1 clause 9.3.1.2.',
    scopeSummary:
      'Integrated Management System covering engineering consultancy, facility operations, and project management at ISSC Head Office.',
    status: 'Draft',
    version: 1,
    siteAllocation: {
      siteCode: 'SITE-1101',
      siteName: 'ISSC Head Office',
      onSitePersonnel: ['Omar Hassan', 'Mostafa Adel'],
      siteAddress: 'ISSC Head Office\nNew Cairo, Cairo\nEgypt',
    },
    remoteActivities: {
      enabled: false,
      activities: ['Document review'],
      platform: 'Microsoft Teams',
      notes: 'On-site audit at ISSC Head Office; remote ICT backup available if needed.',
    },
    travelNotes: {
      details: 'Local audit team based in Cairo. Direct arrival at ISSC Head Office by 08:45 AM.',
    },
    teamDeclarations: {
      availabilityConfirmed: true,
      noConflictsDeclared: true,
      conflictNotes: 'All team members declared zero conflict of interest with ISSC.',
    },
    agendaActivities: [
      {
        id: 'act-310-1',
        date: '2026-12-05',
        startTime: '09:00',
        endTime: '09:30',
        activity: 'Opening meeting & confirmation of audit plan',
        auditors: ['Omar Hassan'],
        durationHours: 0.5,
      },
      {
        id: 'act-310-2',
        date: '2026-12-05',
        startTime: '09:30',
        endTime: '13:00',
        activity: 'Documented information review (Scope, Policy, Objectives, Manual)',
        auditors: ['Omar Hassan'],
        durationHours: 3.5,
      },
      {
        id: 'act-310-3',
        date: '2026-12-06',
        startTime: '09:00',
        endTime: '13:00',
        activity: 'Site tour, legal compliance & operational preparedness evaluation',
        auditors: ['Omar Hassan'],
        durationHours: 4.0,
      },
      {
        id: 'act-310-4',
        date: '2026-12-07',
        startTime: '09:00',
        endTime: '12:00',
        activity: 'Internal audits, management review & Stage 2 resource planning',
        auditors: ['Omar Hassan'],
        durationHours: 3.0,
      },
    ],
    execution: buildDefaultExecution('Omar Hassan', 'AGR-0001 v1', false),
    createdAt: '2026-11-18T10:00:00Z',
    updatedAt: '2026-11-18T17:20:00Z',
  },
]

function getStoredPlans(): AuditPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialAuditPlans))
      return initialAuditPlans
    }
    const parsed = JSON.parse(raw) as AuditPlan[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialAuditPlans
  } catch {
    return initialAuditPlans
  }
}

function saveStoredPlans(plans: AuditPlan[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans))
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
  await new Promise((r) => setTimeout(r, 40))
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
          p.standardName.toLowerCase().includes(q) ||
          p.standards.some((s) => s.toLowerCase().includes(q)),
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
  await new Promise((r) => setTimeout(r, 40))
  const plans = getStoredPlans()
  const found = plans.find((p) => p.id === idOrNumber || p.planNumber === idOrNumber)
  if (found && !found.execution) {
    found.execution = buildDefaultExecution(found.leadAuditor, 'AGR-0001 v1', false)
  }
  return found || null
}

function calcDaysBetween(start: string, end: string): number {
  const s = new Date(start)
  const e = new Date(end)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 1
  const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return Math.max(1, diff)
}

export async function saveAuditPlan(plan: Partial<AuditPlan> & { id?: string }): Promise<AuditPlan> {
  await new Promise((r) => setTimeout(r, 60))
  const plans = getStoredPlans()

  if (plan.id || plan.planNumber) {
    const index = plans.findIndex(
      (p) => (plan.id && p.id === plan.id) || (plan.planNumber && p.planNumber === plan.planNumber),
    )
    if (index >= 0) {
      const existing = plans[index]
      const start = plan.proposedStartDate ?? existing.proposedStartDate
      const end = plan.proposedEndDate ?? existing.proposedEndDate
      const updated: AuditPlan = {
        ...existing,
        ...plan,
        durationDays: plan.durationDays ?? calcDaysBetween(start, end),
        updatedAt: new Date().toISOString(),
      }
      plans[index] = updated
      saveStoredPlans(plans)
      return updated
    }
  }

  const maxNum = plans.reduce((acc, p) => {
    const m = p.planNumber.match(/AUD-(\d+)/)
    const n = m ? parseInt(m[1], 10) : 310
    return Math.max(acc, n)
  }, 310)
  const newNumber = plan.planNumber || `AUD-${String(maxNum + 1).padStart(4, '0')}`
  const start = plan.proposedStartDate || '2026-11-18'
  const end = plan.proposedEndDate || '2026-11-30'
  const lead = plan.leadAuditor || 'Omar Hassan'

  const leadMember =
    AVAILABLE_AUDITORS_POOL.find((a) => a.name === lead) || AVAILABLE_AUDITORS_POOL[0]

  const newPlan: AuditPlan = {
    id: `plan-${Date.now()}`,
    planNumber: newNumber,
    clientName: plan.clientName || 'ISSC',
    clientCode: plan.clientCode || 'C1A00011',
    country: plan.country || 'Egypt',
    stage: plan.stage || 'Special Audit',
    applicationNumber: plan.applicationNumber || 'ISSC',
    standardName: plan.standardName || 'Integrated Management System',
    standards: plan.standards || ['ISO 9001:2015', 'ISO 14001:2015', 'ISO 45001:2018'],
    // Like the artifact: a special audit has no reviewed-duration code from earlier stages,
    // so the agenda total row stays empty; other plans keep the repo's generated code.
    reviewedDurationCode:
      plan.reviewedDurationCode ||
      (plan.stage === 'Special Audit' ? '' : `DUR-${String(maxNum + 1).padStart(4, '0')}`),
    reviewedDurationDays: plan.reviewedDurationDays ?? 1.0,
    totalEffortHours: plan.totalEffortHours ?? 0,
    siteCode: plan.siteCode || 'SITE-1101',
    siteName: plan.siteName || 'ISSC Head Office',
    siteAddress: plan.siteAddress || 'ISSC Head Office, New Cairo, Cairo, Egypt',
    primaryContactName: plan.primaryContactName || 'Khalid Al-Harbi',
    primaryContactEmail: plan.primaryContactEmail || 'khalid.harbi@issc.example',
    primaryContactPhone: plan.primaryContactPhone || '+20 1002103344',
    proposedStartDate: start,
    proposedEndDate: end,
    durationDays: plan.durationDays ?? calcDaysBetween(start, end),
    timezone: plan.timezone || 'Asia/Riyadh',
    leadAuditor: lead,
    auditTeam: plan.auditTeam || [lead],
    teamMembers: plan.teamMembers || [leadMember],
    auditTrailNote: plan.auditTrailNote || '',
    teamConfirmed: plan.teamConfirmed ?? true,
    auditObjectives: plan.auditObjectives || '',
    scopeSummary:
      plan.scopeSummary ||
      'Integrated Management System covering operations and processes at the client facility.',
    status: plan.status || 'Draft',
    version: 1,
    siteAllocation: plan.siteAllocation || {
      siteCode: plan.siteCode || 'SITE-1101',
      siteName: plan.siteName || 'ISSC Head Office',
      onSitePersonnel: plan.auditTeam || [lead],
      siteAddress: plan.siteAddress || 'ISSC Head Office, New Cairo, Cairo, Egypt',
    },
    remoteActivities: plan.remoteActivities || {
      enabled: false,
      activities: ['Document review'],
      platform: 'Microsoft Teams',
      notes: '',
    },
    travelNotes: plan.travelNotes || { details: '' },
    teamDeclarations: plan.teamDeclarations || {
      availabilityConfirmed: true,
      noConflictsDeclared: true,
    },
    agendaActivities: plan.agendaActivities || [],
    execution: plan.execution || buildDefaultExecution(lead, 'AGR-0001 v1', false),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  plans.unshift(newPlan)
  saveStoredPlans(plans)
  return newPlan
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
    'Standards',
    'Sites',
    'Start Date',
    'End Date',
    'Duration Days',
    'Lead Auditor',
    'Status',
  ]
  const rows = plans.map((p) => [
    p.planNumber,
    `"${p.clientName}"`,
    p.clientCode,
    p.country,
    p.stage,
    `"${p.standards.join(' | ')}"`,
    `"${p.siteName}"`,
    p.proposedStartDate,
    p.proposedEndDate,
    p.durationDays,
    `"${p.leadAuditor}"`,
    p.status,
  ])

  const csvContent =
    'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `audit_plans_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
