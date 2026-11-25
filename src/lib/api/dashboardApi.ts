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

import { listClientPlanNotifications } from '@/lib/api/clientNotificationsApi'
import { listClientQuotationActivities } from '@/lib/api/clientQuotationsApi'

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

export type DashboardActivityType =
  | 'documentReceived'
  | 'correspondenceSent'
  | 'statusChanged'
  | 'auditPlanSent'
  | 'auditPlanRescheduled'
  | 'quotationIssued'
  | 'quotationAccepted'
  | 'quotationRejected'

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
// once the backend exposes this endpoint. Only real events are listed (no
// placeholder entries): the audit-plan entries are the client's real planning events (plan sent, plan
// rescheduled) derived from the shared plan store (client-side phase 3), so
// the home activity feed reflects what the CAB actually did.
export async function getDashboardActivities(): Promise<DashboardActivity[]> {
  const notifications = await listClientPlanNotifications()
  const planActivities: DashboardActivity[] = notifications
    .filter((notification) => notification.kind !== 'quotationIssued')
    .map((notification) => ({
      id: notification.id,
      type: notification.kind === 'planSent' ? 'auditPlanSent' : 'auditPlanRescheduled',
      titleKey:
        notification.kind === 'planSent'
          ? 'dashboard.activities.items.auditPlanSent'
          : 'dashboard.activities.items.auditPlanRescheduled',
      entityName: notification.reference,
      occurredAt: notification.occurredAt,
    }))
  // Quotation entries come from the local quotation bridge (quotation phase 1):
  // issued by the CAB, then the client's own accept or reject.
  const quotationActivities: DashboardActivity[] = (await listClientQuotationActivities()).map(
    (activity) => ({
      id: activity.id,
      type: activity.kind,
      titleKey: `dashboard.activities.items.${activity.kind}`,
      entityName: activity.reference,
      occurredAt: activity.occurredAt,
    }),
  )
  const merged = [...planActivities, ...quotationActivities].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  )
  return delay(merged)
}
