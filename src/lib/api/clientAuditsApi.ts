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
  saveAuditPlan,
  type AuditPlan,
} from '@/lib/api/cabAuditPlanningApi'
import { createPlanEvent } from '@/lib/api/auditPlanLifecycleApi'
import { getAuthSession } from '@/lib/authStorage'
import { acknowledgeReport, type StageReportResult } from '@/lib/api/stageReport'
import { getClientReportStatus } from '@/lib/clientAuditResults'

export type ClientPlanConfirmation = 'pending' | 'confirmed' | 'objected'

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

/** The client's current decision state on a sent plan. An explicit objection
 *  wins over the confirmed flag; the flag alone (set by the CAB demo shortcut)
 *  still reads as confirmed. */
export function getPlanConfirmation(plan: AuditPlan): ClientPlanConfirmation {
  const response = plan.execution?.preparation?.clientResponse
  if (response?.decision === 'objection') return 'objected'
  if (response?.decision === 'confirmed' || plan.execution?.preparation?.planConfirmedByClient) {
    return 'confirmed'
  }
  return 'pending'
}

/** The recorded objection, when the client's latest decision objected to a
 *  team member. Null otherwise. */
export function getClientPlanObjection(
  plan: AuditPlan,
): { memberName?: string; reason?: string } | null {
  const response = plan.execution?.preparation?.clientResponse
  return response?.decision === 'objection' ? response : null
}

/** Minimum reason length for an objection, mirroring the CAB team-exception rule. */
export const OBJECTION_REASON_MIN_LENGTH = 10

/**
 * The client approves the plan as scheduled. Demo wiring only: writes to the
 * same localStorage store the CAB reads, records a `client.confirmed` history
 * event, and flips the preparation flag the CAB readiness step watches.
 */
export async function confirmClientAuditPlan(idOrNumber: string): Promise<AuditPlan | null> {
  const plan = await getClientAuditPlan(idOrNumber)
  if (!plan) return null
  return saveAuditPlan({
    id: plan.id,
    planNumber: plan.planNumber,
    events: [...(plan.events ?? []), createPlanEvent('client.confirmed')],
    execution: {
      ...plan.execution,
      preparation: {
        ...plan.execution.preparation,
        planConfirmedByClient: true,
        clientResponse: { decision: 'confirmed', at: new Date().toISOString() },
      },
    },
  })
}

/**
 * The client objects to one team member with a reason. The plan stays
 * unconfirmed, the objection is stored for the CAB, and a `client.objection`
 * history event records the member and reason.
 */
export async function objectToClientAuditPlan(
  idOrNumber: string,
  memberName: string,
  reason: string,
): Promise<AuditPlan | null> {
  const plan = await getClientAuditPlan(idOrNumber)
  if (!plan) return null
  const trimmedReason = reason.trim()
  return saveAuditPlan({
    id: plan.id,
    planNumber: plan.planNumber,
    events: [
      ...(plan.events ?? []),
      createPlanEvent('client.objection', `${memberName}: ${trimmedReason}`),
    ],
    execution: {
      ...plan.execution,
      preparation: {
        ...plan.execution.preparation,
        planConfirmedByClient: false,
        clientResponse: {
          decision: 'objection',
          memberName,
          reason: trimmedReason,
          at: new Date().toISOString(),
        },
      },
    },
  })
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

/**
 * One audit with an ISSUED report for the signed-in client, or null. Same
 * scoping as the plan view (sent to this client), plus the report must be
 * issued with its frozen snapshot: drafts and reports in review never reach
 * the client.
 */
export async function getClientAuditReport(idOrNumber: string): Promise<AuditPlan | null> {
  const plan = await getClientAuditPlan(idOrNumber)
  if (!plan || getClientReportStatus(plan) === 'notIssued') return null
  return plan
}

export type ClientAcknowledgeResult =
  | { ok: true; plan: AuditPlan }
  | { ok: false; error: NonNullable<StageReportResult['error']> | 'notFound' }

/**
 * The client acknowledges the issued report (once, with a name). Demo wiring
 * only, same shared plan store as confirm/object: the CAB reads the same
 * `stageReport.acknowledgement`.
 */
export async function acknowledgeClientAuditReport(
  idOrNumber: string,
  input: { name: string; note?: string },
): Promise<ClientAcknowledgeResult> {
  const plan = await getClientAuditReport(idOrNumber)
  if (!plan || !plan.stageReport) return { ok: false, error: 'notFound' }
  const result = acknowledgeReport(plan.stageReport, input, new Date().toISOString())
  if (!result.ok || !result.next) return { ok: false, error: result.error ?? 'wrongState' }
  const saved = await saveAuditPlan({
    id: plan.id,
    planNumber: plan.planNumber,
    stageReport: result.next,
  })
  return { ok: true, plan: saved }
}
