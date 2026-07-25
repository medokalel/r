/**
 * Dashboard data layer.
 *
 * The iCasco Platform API doc does not (yet) expose dashboard endpoints
 * (stats / tasks / activity feed), so everything below is mocked. Each
 * function returns a Promise so the call sites in DashboardPage already
 * behave exactly like a real network call (loading state, etc.) — once the
 * backend ships real endpoints, only the bodies of these functions need to
 * change to call `client`/`authorizedClient`, the page itself needs no edits.
 */

export interface DashboardStats {
  approvedCertificates: number
  currentOrders: number
  pendingRequests: number
  users: number
}

export type DashboardTaskStatus = 'urgent' | 'underReview' | 'pending'
export type DashboardTaskType = 'documentReview' | 'contractProcessing' | 'feeCollection'

export interface DashboardTask {
  id: string
  applicantName: string
  companyCode: string
  taskType: DashboardTaskType
  status: DashboardTaskStatus
}

export type DashboardActivityType = 'documentReceived' | 'correspondenceSent' | 'statusChanged'

export interface DashboardActivity {
  id: string
  type: DashboardActivityType
  titleKey: string
  entityName: string
  /** ISO timestamp; the UI derives a relative "x minutes/hours ago" label from it. */
  occurredAt: string
  /** Only set for statusChanged activities. */
  statusNote?: string
}

const MOCK_STATS: DashboardStats = {
  approvedCertificates: 6674,
  currentOrders: 9577,
  pendingRequests: 6674,
  users: 4,
}

const MOCK_TASKS: DashboardTask[] = [
  {
    id: '1',
    applicantName: 'International Food Industries',
    companyCode: '76794793',
    taskType: 'documentReview',
    status: 'urgent',
  },
  {
    id: '2',
    applicantName: 'Big chips',
    companyCode: '76794793',
    taskType: 'contractProcessing',
    status: 'underReview',
  },
  {
    id: '3',
    applicantName: 'Foods Egypt',
    companyCode: '76794793',
    taskType: 'feeCollection',
    status: 'pending',
  },
  {
    id: '4',
    applicantName: 'Egyptian Sweets',
    companyCode: '76794793',
    taskType: 'contractProcessing',
    status: 'underReview',
  },
]

const MOCK_ACTIVITIES: DashboardActivity[] = [
  {
    id: '1',
    type: 'documentReceived',
    titleKey: 'dashboard.activities.items.documentReceived',
    entityName: 'Food Solutions Company',
    occurredAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'correspondenceSent',
    titleKey: 'dashboard.activities.items.correspondenceSent',
    entityName: 'Arab Factory',
    occurredAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'statusChanged',
    titleKey: 'dashboard.activities.items.statusChanged',
    entityName: 'Food factory',
    occurredAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    statusNote: 'dashboard.activities.movedToAwaitingDocuments',
  },
]

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

// TODO: replace with `authorizedRequest<DashboardStats>('/dashboard/stats')`
// once the backend exposes this endpoint (see userApi.ts for the pattern).
export function getDashboardStats(): Promise<DashboardStats> {
  return delay(MOCK_STATS)
}

// TODO: replace with `authorizedRequest<DashboardTask[]>('/dashboard/tasks')`
export function getDashboardTasks(): Promise<DashboardTask[]> {
  return delay(MOCK_TASKS)
}

// TODO: replace with `authorizedRequest<DashboardActivity[]>('/dashboard/activities')`
export function getDashboardActivities(): Promise<DashboardActivity[]> {
  return delay(MOCK_ACTIVITIES)
}