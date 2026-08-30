/**
 * CAB Dashboard data layer.
 *
 * No backend endpoint exists yet for the CAB dashboard, so everything below
 * is mocked. Each function returns a Promise so call sites behave exactly
 * like a real network call (loading state, etc.) — once the backend ships
 * real endpoints, only the bodies of these functions need to change.
 */

export type CabDashboardStatTrendDirection = 'up' | 'down'

export interface CabDashboardStatTrend {
  direction: CabDashboardStatTrendDirection
  percentage: number
}

export interface CabDashboardStats {
  newApplications: number
  pendingReviews: number
  upcomingAudits: number
  technicalReviewsPending: number
  decisionsPending: number
  certificatesToIssue: number
  outstandingPayments: number
  /** Displayed as a currency amount instead of the "View all" link. */
  outstandingPaymentsEgp: number
  /** Displayed as the card's main value (with an "EGP" unit) instead of a plain count. */
  freelancerPayablesEgp: number
  /** Week-over-week change shown under each card's main value, keyed by the fields above. */
  trends: Record <
    | 'newApplications'
    | 'pendingReviews'
    | 'upcomingAudits'
    | 'technicalReviewsPending'
    | 'decisionsPending'
    | 'certificatesToIssue'
    | 'outstandingPayments'
    | 'freelancerPayablesEgp',
    CabDashboardStatTrend
  >
}

export interface ApplicationsByStageEntry {
  stageKey: string
  count: number
  color: string
}

export interface AuditsOverviewEntry {
  stageKey: string
  stage1: number
  stage2: number
}

export interface CertificationDecisionEntry {
  decisionKey: string
  count: number
  color: string
}

export type WorkQueuePriority = 'high' | 'medium' | 'low'

export interface WorkQueueItem {
  id: string
  titleKey: string
  clientName: string
  priority: WorkQueuePriority
  dueDate: string
}

export type CabActivityType = 'certificateIssued' | 'auditCompleted' | 'infoRequested' | 'reviewAssigned' | 'paymentReceived'

export interface CabActivityItem {
  id: string
  type: CabActivityType
  titleKey: string
  entityName: string
  actorName?: string
  occurredAt: string
}

const MOCK_STATS: CabDashboardStats = {
  newApplications: 12,
  pendingReviews: 18,
  upcomingAudits: 9,
  technicalReviewsPending: 14,
  decisionsPending: 7,
  certificatesToIssue: 11,
  outstandingPayments: 8,
  outstandingPaymentsEgp: 1254750,
  freelancerPayablesEgp: 254750,
  trends: {
    newApplications: { direction: 'up', percentage: 0.2 },
    pendingReviews: { direction: 'up', percentage: 0.2 },
    upcomingAudits: { direction: 'down', percentage: 0.2 },
    technicalReviewsPending: { direction: 'up', percentage: 0.2 },
    decisionsPending: { direction: 'up', percentage: 0.2 },
    certificatesToIssue: { direction: 'up', percentage: 0.2 },
    outstandingPayments: { direction: 'down', percentage: 0.2 },
    freelancerPayablesEgp: { direction: 'up', percentage: 0.2 },
  },
}

const MOCK_APPLICATIONS_BY_STAGE: ApplicationsByStageEntry[] = [
  { stageKey: 'applicationReceipt', count: 35, color: '#ef4444' },
  { stageKey: 'applicationReview', count: 19, color: '#ec4899' },
  { stageKey: 'informationRequired', count: 18, color: '#f59e0b' },
  { stageKey: 'technicalFeasibility', count: 17, color: '#8b5cf6' },
  { stageKey: 'quotation', count: 16, color: '#22c55e' },
  { stageKey: 'contractSigning', count: 15, color: '#14b8a6' },
  { stageKey: 'decisionCertification', count: 14, color: '#d1d5db' },
  { stageKey: 'auditReview', count: 8, color: '#6b7280' },
]

const MOCK_AUDITS_OVERVIEW: AuditsOverviewEntry[] = [
  { stageKey: 'planned', stage1: 32, stage2: 24 },
  { stageKey: 'inProgress', stage1: 18, stage2: 14 },
  { stageKey: 'completed', stage1: 14, stage2: 10 },
  { stageKey: 'reportFinalization', stage1: 8, stage2: 5 },
]

const MOCK_CERTIFICATION_DECISIONS: CertificationDecisionEntry[] = [
  { decisionKey: 'approved', count: 45, color: '#22c55e' },
  { decisionKey: 'approvedWithConditions', count: 15, color: '#3b82f6' },
  { decisionKey: 'nonconformity', count: 10, color: '#f59e0b' },
  { decisionKey: 'withheld', count: 5, color: '#ef4444' },
  { decisionKey: 'withdrawn', count: 5, color: '#9ca3af' },
]

const MOCK_WORK_QUEUE: WorkQueueItem[] = [
  {
    id: '1',
    titleKey: 'cab.dashboard.workQueue.items.technicalReviewIso14001',
    clientName: 'GreenLeaf Pvt. Ltd.',
    priority: 'high',
    dueDate: '2025-06-16',
  },
  {
    id: '2',
    titleKey: 'cab.dashboard.workQueue.items.informationRequiredFollowUp',
    clientName: 'Acme Industries',
    priority: 'high',
    dueDate: '2025-06-16',
  },
  {
    id: '3',
    titleKey: 'cab.dashboard.workQueue.items.auditTeamProposalReview',
    clientName: 'BuildWell Constructions',
    priority: 'medium',
    dueDate: '2025-06-17',
  },
  {
    id: '4',
    titleKey: 'cab.dashboard.workQueue.items.contractReviewApproval',
    clientName: 'SwiftLogistics Ltd.',
    priority: 'medium',
    dueDate: '2025-06-18',
  },
  {
    id: '5',
    titleKey: 'cab.dashboard.workQueue.items.stage1AuditReportReview',
    clientName: 'TechWave Solutions',
    priority: 'high',
    dueDate: '2025-06-18',
  },
]

const MOCK_ACTIVITIES: CabActivityItem[] = [
  {
    id: '1',
    type: 'certificateIssued',
    titleKey: 'cab.dashboard.recentActivity.items.certificateIssued',
    entityName: 'GreenLeaf Pvt. Ltd. (ISO 9001:2015)',
    actorName: 'Rekha Sharma',
    occurredAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'auditCompleted',
    titleKey: 'cab.dashboard.recentActivity.items.auditCompleted',
    entityName: 'Acme Industries',
    actorName: 'Rohit Mehta',
    occurredAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'infoRequested',
    titleKey: 'cab.dashboard.recentActivity.items.infoRequested',
    entityName: 'BuildWell Constructions',
    actorName: 'Priya Nair',
    occurredAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    type: 'reviewAssigned',
    titleKey: 'cab.dashboard.recentActivity.items.reviewAssigned',
    entityName: 'Amit Soni',
    actorName: 'Spark Technologies',
    occurredAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    type: 'paymentReceived',
    titleKey: 'cab.dashboard.recentActivity.items.paymentReceived',
    entityName: 'TechWave Solutions',
    actorName: 'INV-2025-117',
    occurredAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
]

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

// TODO: replace with `authorizedRequest<CabDashboardStats>('/cab/dashboard/stats')`
// once the backend adds this endpoint.
export function getCabDashboardStats(): Promise<CabDashboardStats> {
  return delay(MOCK_STATS)
}

// TODO: replace with a real endpoint once the backend adds one.
export function getApplicationsByStage(): Promise<ApplicationsByStageEntry[]> {
  return delay(MOCK_APPLICATIONS_BY_STAGE)
}

// TODO: replace with a real endpoint once the backend adds one.
export function getAuditsOverview(): Promise<AuditsOverviewEntry[]> {
  return delay(MOCK_AUDITS_OVERVIEW)
}

// TODO: replace with a real endpoint once the backend adds one.
export function getCertificationDecisions(): Promise<CertificationDecisionEntry[]> {
  return delay(MOCK_CERTIFICATION_DECISIONS)
}

// TODO: replace with a real endpoint once the backend adds one.
export function getWorkQueue(): Promise<WorkQueueItem[]> {
  return delay(MOCK_WORK_QUEUE)
}

// TODO: replace with a real endpoint once the backend adds one.
export function getCabRecentActivity(): Promise<CabActivityItem[]> {
  return delay(MOCK_ACTIVITIES)
}