/**
 * CAB Dashboard data layer.
 *
 * No backend endpoint exists yet for the CAB dashboard, so everything below
 * is mocked. Each function returns a Promise so call sites behave exactly
 * like a real network call (loading state, etc.) — once the backend ships
 * real endpoints, only the bodies of these functions need to change.
 */

export interface CabDashboardStats {
  newApplications: number
  pendingReviews: number
  upcomingAudits: number
  technicalReviewsPending: number
  decisionsPending: number
  certificatesToIssue: number
  /** Displayed as a currency amount rather than a plain count. */
  outstandingPaymentsEgp: number
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

const MOCK_STATS: CabDashboardStats = {
  newApplications: 12,
  pendingReviews: 18,
  upcomingAudits: 9,
  technicalReviewsPending: 14,
  decisionsPending: 7,
  certificatesToIssue: 11,
  outstandingPaymentsEgp: 1254750,
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