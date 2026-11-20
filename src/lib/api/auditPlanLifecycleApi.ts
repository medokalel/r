import {
  saveAuditPlan,
  type AuditPlan,
  type AuditPlanEvent,
} from '@/lib/api/cabAuditPlanningApi'

/**
 * Audit plan lifecycle: start the audit, send it for review, mark it completed.
 * Runs on the local mock plan store until the backend endpoints exist.
 */

export type LifecycleAction = 'start' | 'review' | 'complete'

/** Why an action is not available right now (maps to a translated message). */
export type LifecycleBlock = 'notSent' | 'notStarted' | 'done' | 'completed'

const NOT_STARTED: ReadonlyArray<AuditPlan['status']> = ['Draft', 'Planned']

export function getLifecycleBlock(plan: AuditPlan, action: LifecycleAction): LifecycleBlock | null {
  const { status } = plan

  if (status === 'Completed') return 'completed'

  switch (action) {
    case 'start':
      if (status === 'In progress' || status === 'Under review') return 'done'
      return plan.execution?.preparation.planSentToClient ? null : 'notSent'
    case 'review':
      if (NOT_STARTED.includes(status)) return 'notStarted'
      return status === 'Under review' ? 'done' : null
    case 'complete':
      return NOT_STARTED.includes(status) ? 'notStarted' : null
  }
}

const TARGET_STATUS: Record<LifecycleAction, AuditPlan['status']> = {
  start: 'In progress',
  review: 'Under review',
  complete: 'Completed',
}

export function createPlanEvent(action: string, detail?: string): AuditPlanEvent {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    action,
    ...(detail ? { detail } : {}),
  }
}

export interface LifecycleResult {
  plan: AuditPlan
  /** Number of team members whose competence log received the audit (completion only). */
  competenceLogged: number
}

export async function applyLifecycleAction(
  plan: AuditPlan,
  action: LifecycleAction,
): Promise<LifecycleResult> {
  if (getLifecycleBlock(plan, action)) {
    throw new Error(`Lifecycle action "${action}" is not available for status "${plan.status}".`)
  }

  const events = [...(plan.events ?? []), createPlanEvent(`lifecycle.${action}`)]
  const competenceLoggedFor =
    action === 'complete'
      ? plan.auditTeam.length
        ? plan.auditTeam
        : [plan.leadAuditor]
      : plan.competenceLoggedFor

  const updated = await saveAuditPlan({
    id: plan.id,
    planNumber: plan.planNumber,
    status: TARGET_STATUS[action],
    events,
    competenceLoggedFor,
  })

  return {
    plan: updated,
    competenceLogged: action === 'complete' ? (competenceLoggedFor?.length ?? 0) : 0,
  }
}

/** Appends a history entry without changing the plan status. */
export async function recordPlanEvent(
  plan: AuditPlan,
  action: string,
  detail?: string,
): Promise<AuditPlan> {
  return saveAuditPlan({
    id: plan.id,
    planNumber: plan.planNumber,
    events: [...(plan.events ?? []), createPlanEvent(action, detail)],
  })
}
