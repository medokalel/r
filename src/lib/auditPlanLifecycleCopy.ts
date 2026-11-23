import type { TFunction } from 'i18next'
import type { AuditPlan } from '@/lib/api/cabAuditPlanningApi'
import { hasAuditReport, type LifecycleAction, type LifecycleBlock } from '@/lib/api/auditPlanLifecycleApi'

/** User-facing wording for the audit plan lifecycle (labels, blocked reasons, confirmations, toasts). */

export const LIFECYCLE_ACTIONS: readonly LifecycleAction[] = ['start', 'review', 'complete']

const ACTION_LABEL_DEFAULTS: Record<LifecycleAction, string> = {
  start: 'Start audit',
  review: 'Send for review',
  complete: 'Mark completed',
}

const BLOCK_DEFAULTS: Record<LifecycleBlock, string> = {
  notSent: 'Send the plan to the client first.',
  notStarted: 'Start the audit first.',
  done: 'Already done for this plan.',
  completed: 'The audit is completed.',
}

const CONFIRM_DEFAULTS: Record<LifecycleAction, string> = {
  start: 'Start audit {{number}}? Its status becomes "In progress" and the audit report opens for the team.',
  review: 'Send audit {{number}} for review? The status becomes "Under review" while the report is finalized.',
  complete:
    'Mark audit {{number}} as completed? The plan becomes read-only and the audit is added to the competence log of each team member.',
}

export function lifecycleActionLabel(t: TFunction, action: LifecycleAction): string {
  return t(`cab.auditPlanning.lifecycle.${action}`, { defaultValue: ACTION_LABEL_DEFAULTS[action] })
}

/** Why a lifecycle action is not available (shown as a hint / helper text). */
export function lifecycleBlockMessage(t: TFunction, block: LifecycleBlock): string {
  return t(`cab.auditPlanning.lifecycle.block.${block}`, { defaultValue: BLOCK_DEFAULTS[block] })
}

export function lifecycleConfirmMessage(t: TFunction, action: LifecycleAction, plan: AuditPlan): string {
  return t(`cab.auditPlanning.lifecycle.confirm.${action}`, {
    defaultValue: CONFIRM_DEFAULTS[action],
    number: plan.planNumber,
  })
}

export function lifecycleSuccessMessage(
  t: TFunction,
  action: LifecycleAction,
  updated: AuditPlan,
  competenceLogged: number,
): string {
  switch (action) {
    case 'start':
      return hasAuditReport(updated)
        ? t('cab.auditPlanning.lifecycle.startedWithReport', {
            defaultValue: 'Audit started. The audit report is open.',
          })
        : t('cab.auditPlanning.lifecycle.started', { defaultValue: 'Audit started.' })
    case 'review':
      return t('cab.auditPlanning.lifecycle.reviewed', { defaultValue: 'Audit sent for review.' })
    case 'complete':
      return t('cab.auditPlanning.lifecycle.completed', {
        defaultValue: 'Audit completed and added to the competence log of {{count}} team member(s).',
        count: competenceLogged,
      })
  }
}
