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

const MOCK_STATS: CabDashboardStats = {
  newApplications: 12,
  pendingReviews: 18,
  upcomingAudits: 9,
  technicalReviewsPending: 14,
  decisionsPending: 7,
  certificatesToIssue: 11,
  outstandingPaymentsEgp: 1254750,
}

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

// TODO: replace with `authorizedRequest<CabDashboardStats>('/cab/dashboard/stats')`
// once the backend adds this endpoint.
export function getCabDashboardStats(): Promise<CabDashboardStats> {
  return delay(MOCK_STATS)
}