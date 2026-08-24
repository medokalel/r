export type WorkflowStepStatus = 'completed' | 'inProgress' | 'pending'
export type AssessmentStatus = 'feasible' | 'partiallyFeasible' | 'notFeasible' | 'notApplicable'

export interface FeasibilityAssessmentRow {
  id: number
  areaKey: string
  assessment: string
  status: AssessmentStatus
  comments: string
}

export interface CabApplicationTechnicalFeasibility {
  applicationId: string
  status: 'inProgress'
  client: string
  applicationType: string
  certificationBody: string
  primaryStandard: string
  sitesCount: number
  requestedOnDate: string
  requestedOnTime: string
  requestedBy: { name: string; initials: string; role: string }
  documentCount: number
  assessmentDueDate: string
  assessments: FeasibilityAssessmentRow[]
  feasibleCount: number
  totalAssessments: number
  feasibilityPercent: number
  auditTeam: Array<{
    name: string
    initials: string
    roleKey: string
    certification: string
    experience: string
    color: string
  }>
  resources: Array<{ key: string; available: boolean }>
  internalComments: Array<{
    author: string
    initials: string
    role: string
    date: string
    time: string
    text: string
    color: string
  }>
  workflowSteps: Array<{ key: string; status: WorkflowStepStatus }>
}

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const MOCK: CabApplicationTechnicalFeasibility = {
  applicationId: 'APP-2025-0086',
  status: 'inProgress',
  client: 'GreenLeaf Pvt. Ltd.',
  applicationType: 'Initial Certification',
  certificationBody: 'CASCO',
  primaryStandard: 'ISO 9001:2015',
  sitesCount: 2,
  requestedOnDate: 'May 19, 2025',
  requestedOnTime: '02:35 PM (IST)',
  requestedBy: { name: 'Neha Sharma', initials: 'NS', role: 'Lead Auditor' },
  documentCount: 7,
  assessmentDueDate: 'May 26, 2025',
  assessments: [
    {
      id: 1,
      areaKey: 'scopeComplexity',
      assessment: 'Standard manufacturing scope with moderate complexity',
      status: 'feasible',
      comments: 'Scope is well-defined and within CAB competence',
    },
    {
      id: 2,
      areaKey: 'applicableStandards',
      assessment: 'ISO 9001:2015 — fully accredited',
      status: 'feasible',
      comments: 'Accreditation scope covers requested standard',
    },
    {
      id: 3,
      areaKey: 'auditTeamAvailability',
      assessment: 'Lead Auditor and Auditor available for proposed dates',
      status: 'feasible',
      comments: 'Team confirmed for Jun 15–19, 2025',
    },
    {
      id: 4,
      areaKey: 'technicalExpertise',
      assessment: 'Technical Expert available for valves & flow control',
      status: 'feasible',
      comments: 'Expert assigned for 2 days on-site',
    },
    {
      id: 5,
      areaKey: 'siteAccessibility',
      assessment: 'Both sites accessible; no travel restrictions',
      status: 'feasible',
      comments: 'Sites in Pune and Mumbai, India',
    },
    {
      id: 6,
      areaKey: 'resourceAvailability',
      assessment: 'All required resources available',
      status: 'feasible',
      comments: 'Support staff and equipment confirmed',
    },
    {
      id: 7,
      areaKey: 'timelineScheduling',
      assessment: 'Proposed audit dates feasible',
      status: 'feasible',
      comments: '5 audit days sufficient for scope',
    },
    {
      id: 8,
      areaKey: 'regulatoryRequirements',
      assessment: 'No additional regulatory barriers identified',
      status: 'feasible',
      comments: 'Standard certification requirements apply',
    },
  ],
  feasibleCount: 8,
  totalAssessments: 8,
  feasibilityPercent: 100,
  auditTeam: [
    {
      name: 'Neha Sharma',
      initials: 'NS',
      roleKey: 'leadAuditor',
      certification: 'IRCA ISO 9001:2015 LA',
      experience: '10+ years',
      color: '#1236a3',
    },
    {
      name: 'Rakesh Kumar',
      initials: 'RK',
      roleKey: 'auditor',
      certification: 'IRCA ISO 9001:2015 Auditor',
      experience: '6+ years',
      color: '#7c3aed',
    },
  ],
  resources: [
    { key: 'technicalExpertsOnCall', available: true },
    { key: 'sectorSpecialists', available: true },
    { key: 'documentReviewers', available: true },
    { key: 'supportStaff', available: true },
    { key: 'travelResources', available: true },
  ],
  internalComments: [
    {
      author: 'Neha Sharma',
      initials: 'NP',
      role: 'Lead Auditor',
      date: 'May 19, 2025',
      time: '03:15 PM',
      color: '#7c3aed',
      text: 'All assessment areas reviewed. Application is technically feasible based on scope, team availability, and resource allocation.',
    },
    {
      author: 'Rakesh Kumar',
      initials: 'RK',
      role: 'Technical Reviewer',
      date: 'May 19, 2025',
      time: '03:25 PM',
      color: '#1236a3',
      text: 'Technical expertise confirmed for valves and flow control domain. Recommend proceeding to quotation phase.',
    },
  ],
  workflowSteps: [
    { key: 'application', status: 'completed' },
    { key: 'applicationReview', status: 'completed' },
    { key: 'informationRequired', status: 'completed' },
    { key: 'technicalFeasibility', status: 'inProgress' },
    { key: 'quotation', status: 'pending' },
    { key: 'quotationApproval', status: 'pending' },
    { key: 'payment', status: 'pending' },
    { key: 'invoicing', status: 'pending' },
    { key: 'contracting', status: 'pending' },
    { key: 'auditPlanning', status: 'pending' },
  ],
}

export async function getCabApplicationTechnicalFeasibility(
  _applicationId?: string
): Promise<CabApplicationTechnicalFeasibility> {
  await delay()
  return MOCK
}
