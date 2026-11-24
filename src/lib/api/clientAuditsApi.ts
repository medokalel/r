/**
 * Audit-client side of Audit Planning.
 *
 * Demo wiring only: the CAB and the audit client run inside the same demo
 * frontend, so this module reads the SAME localStorage source the CAB writes
 * (`icasco_cab_audit_plans_v3`, owned by `cabAuditPlanningApi`). A plan becomes
 * visible to the client the moment the CAB marks it sent
 * (`execution.preparation.planSentToClient`). This is NOT real cross-account
 * delivery — that needs a backend API later, at which point only the bodies of
 * these functions change, not the pages.
 */

import {
  fetchAuditPlanById,
  fetchAuditPlans,
  type AuditPlan,
} from '@/lib/api/cabAuditPlanningApi'
import { getAuthSession } from '@/lib/authStorage'

export type ClientPlanConfirmation = 'pending' | 'confirmed'

/** A plan is visible to the audit client only after the CAB sends it. */
export function isPlanSentToClient(plan: AuditPlan): boolean {
  return Boolean(plan.execution?.preparation?.planSentToClient)
}

function normalizeName(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

/**
 * Demo scoping: the demo frontend has no real accounts on the CAB side, so a
 * client sees the plans whose client name matches their own organization name
 * from the login session. Real per-account delivery (a client id on the plan,
 * enforced by the backend) replaces this once the API exists.
 */
export function isPlanForSessionClient(plan: AuditPlan): boolean {
  const orgName = normalizeName(getAuthSession()?.organization?.name)
  if (!orgName) return false
  return normalizeName(plan.clientName) === orgName
}

/** What the client still owes on this plan. Confirmation itself is phase 2. */
export function getPlanConfirmation(plan: AuditPlan): ClientPlanConfirmation {
  return plan.execution?.preparation?.planConfirmedByClient ? 'confirmed' : 'pending'
}

function byStartDateAsc(a: AuditPlan, b: AuditPlan): number {
  return new Date(a.proposedStartDate).getTime() - new Date(b.proposedStartDate).getTime()
}

/** Every plan the CAB has sent to THIS client, nearest audit first. */
export async function listClientAudits(): Promise<AuditPlan[]> {
  const plans = await fetchAuditPlans()
  return plans
    .filter((plan) => isPlanSentToClient(plan) && isPlanForSessionClient(plan))
    .sort(byStartDateAsc)
}

/** One sent plan for the read-only client view; null when not sent, missing,
 *  or addressed to a different client. */
export async function getClientAuditPlan(idOrNumber: string): Promise<AuditPlan | null> {
  const plan = await fetchAuditPlanById(idOrNumber)
  if (!plan || !isPlanSentToClient(plan) || !isPlanForSessionClient(plan)) return null
  return plan
}

/**
 * The next audit the client should prepare for: a sent plan whose audit window
 * has not ended yet, nearest start date first. Null when nothing is upcoming.
 */
export async function getUpcomingClientAudit(): Promise<AuditPlan | null> {
  const plans = await listClientAudits()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcoming = plans.filter((plan) => {
    const end = new Date(plan.proposedEndDate)
    return !Number.isNaN(end.getTime()) && end >= today
  })
  return upcoming[0] ?? null
}
