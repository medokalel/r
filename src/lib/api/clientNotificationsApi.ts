/**
 * Audit-client plan notifications (client-side phase 3).
 *
 * Demo wiring only, same bridge as `clientAuditsApi`: the CAB and the audit
 * client run inside the same demo frontend, so notifications are DERIVED from
 * the plan history events the CAB already records in the shared localStorage
 * plan store (`icasco_cab_audit_plans_v3`). A `plan.sent` event becomes a
 * "plan waiting for your confirmation" notification and a `plan.rescheduled`
 * event (after the plan was sent) becomes a "plan rescheduled" notification.
 * Only the read state is persisted, under
 * `icasco_client_plan_notifications_read_v1`. Real push/email delivery needs
 * the backend API later, at which point only the bodies of these functions
 * change, not the header or the dashboard.
 */

import {
  fetchAuditPlans,
  type AuditPlan,
  type AuditPlanEvent,
} from '@/lib/api/cabAuditPlanningApi'
import { isPlanForSessionClient, isPlanSentToClient } from '@/lib/api/clientAuditsApi'

export type ClientPlanNotificationKind = 'planSent' | 'planRescheduled'

export interface ClientPlanNotification {
  /** Stable id: the id of the plan event the notification is derived from. */
  id: string
  planId: string
  planNumber: string
  kind: ClientPlanNotificationKind
  occurredAt: string
  /** ISO timestamp of when the client saw it; null while unread. */
  readAt: string | null
}

const READ_STATE_KEY = 'icasco_client_plan_notifications_read_v1'

function loadReadState(): Record<string, string> {
  try {
    const raw = localStorage.getItem(READ_STATE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {}
  } catch {
    return {}
  }
}

function saveReadState(state: Record<string, string>): void {
  localStorage.setItem(READ_STATE_KEY, JSON.stringify(state))
}

/**
 * The plan events worth notifying the client about, oldest first. A
 * reschedule only matters once the plan has actually reached the client, so
 * `plan.rescheduled` events before the first `plan.sent` are skipped.
 */
function notifiableEvents(
  plan: AuditPlan,
): { event: AuditPlanEvent; kind: ClientPlanNotificationKind }[] {
  const result: { event: AuditPlanEvent; kind: ClientPlanNotificationKind }[] = []
  let sent = false
  for (const event of plan.events ?? []) {
    if (event.action === 'plan.sent') {
      sent = true
      result.push({ event, kind: 'planSent' })
    } else if (event.action === 'plan.rescheduled' && sent) {
      result.push({ event, kind: 'planRescheduled' })
    }
  }
  return result
}

/** Every planning notification addressed to THIS client, newest first. */
export async function listClientPlanNotifications(): Promise<ClientPlanNotification[]> {
  const plans = await fetchAuditPlans()
  const readState = loadReadState()
  const notifications: ClientPlanNotification[] = []
  for (const plan of plans) {
    if (!isPlanSentToClient(plan) || !isPlanForSessionClient(plan)) continue
    for (const { event, kind } of notifiableEvents(plan)) {
      notifications.push({
        id: event.id,
        planId: plan.id,
        planNumber: plan.planNumber,
        kind,
        occurredAt: event.at,
        readAt: readState[event.id] ?? null,
      })
    }
  }
  return notifications.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  )
}

/** Unread count for the header bell badge. */
export async function getUnreadClientPlanNotificationCount(): Promise<number> {
  const notifications = await listClientPlanNotifications()
  return notifications.filter((notification) => !notification.readAt).length
}

/** Marks one notification read. No-op when it is already read. */
export function markClientPlanNotificationRead(id: string): void {
  const state = loadReadState()
  if (state[id]) return
  state[id] = new Date().toISOString()
  saveReadState(state)
}

/** Marks every current notification read. */
export async function markAllClientPlanNotificationsRead(): Promise<void> {
  const notifications = await listClientPlanNotifications()
  const state = loadReadState()
  const now = new Date().toISOString()
  for (const notification of notifications) {
    if (!state[notification.id]) state[notification.id] = now
  }
  saveReadState(state)
}
