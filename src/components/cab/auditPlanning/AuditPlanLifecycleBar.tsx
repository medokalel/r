import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AuditStatusBadge } from '@/components/cab/auditPlanning/shared'
import type { AuditPlan } from '@/lib/api/cabAuditPlanningApi'
import {
  applyLifecycleAction,
  getLifecycleBlock,
  type LifecycleAction,
  type LifecycleBlock,
} from '@/lib/api/auditPlanLifecycleApi'
import { ROUTES } from '@/lib/routes'
import { toast } from '@/lib/toast'

interface AuditPlanLifecycleBarProps {
  plan: AuditPlan
  /** Team, agenda, site and declarations are all complete. */
  planReady: boolean
  onChanged: (plan: AuditPlan) => void
  onStartExecution: () => void
}

const ACTIONS: LifecycleAction[] = ['start', 'review', 'complete']

const BLOCK_DEFAULTS: Record<LifecycleBlock, string> = {
  notSent: 'Send the plan to the client first.',
  notStarted: 'Start the audit first.',
  done: 'Already done for this plan.',
  completed: 'The audit is completed.',
}

const MAX_VISIBLE_EVENTS = 4

/**
 * Start audit → Send for review → Mark completed, with the reason shown under
 * any action that is not available yet. Each step asks for confirmation.
 */
export function AuditPlanLifecycleBar({
  plan,
  planReady,
  onChanged,
  onStartExecution,
}: AuditPlanLifecycleBarProps) {
  const { t, i18n } = useTranslation()
  const [pending, setPending] = useState<LifecycleAction | null>(null)

  const blockFor = (action: LifecycleAction): string | null => {
    const block = getLifecycleBlock(plan, action)
    if (block) {
      return t(`cab.auditPlanning.lifecycle.block.${block}`, BLOCK_DEFAULTS[block])
    }
    if (action === 'start' && !planReady) {
      return t(
        'cab.auditPlanning.lifecycle.block.notReady',
        'Complete the team, agenda, site and declarations first.',
      )
    }
    return null
  }

  const hasStarted = plan.status !== 'Draft' && plan.status !== 'Planned'
  const events = (plan.events ?? []).slice(-MAX_VISIBLE_EVENTS).reverse()

  const handleConfirm = async () => {
    if (!pending) return
    try {
      const { plan: updated, competenceLogged } = await applyLifecycleAction(plan, pending)
      onChanged(updated)
      toast.success(
        pending === 'complete'
          ? t(
              'cab.auditPlanning.lifecycle.completed',
              'Audit completed and added to the competence log of {{count}} team member(s).',
              { count: competenceLogged },
            )
          : pending === 'start'
            ? t('cab.auditPlanning.lifecycle.started', 'Audit started.')
            : t('cab.auditPlanning.lifecycle.reviewed', 'Audit sent for review.'),
      )
      setPending(null)
    } catch {
      toast.error(t('cab.auditPlanning.lifecycle.error', 'The audit status could not be updated. Try again.'))
    }
  }

  const actionLabel = (action: LifecycleAction) =>
    t(`cab.auditPlanning.lifecycle.${action}`, {
      defaultValue: { start: 'Start audit', review: 'Send for review', complete: 'Mark completed' }[action],
    })

  return (
    <section className="space-y-4 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <h3 className="text-[15px] font-bold text-neutral-900">
            {t('cab.auditPlanning.lifecycle.title', 'Audit lifecycle')}
          </h3>
          <p className="mt-1 flex items-center gap-2 text-[13px] text-neutral-500">
            <span>{t('cab.auditPlanning.lifecycle.currentStatus', 'Current status')}</span>
            <AuditStatusBadge status={plan.status} />
          </p>
        </div>

        <div className="flex flex-wrap items-start gap-2.5">
          {ACTIONS.map((action) => {
            const reason = blockFor(action)
            return (
              <div key={action} className="flex flex-col items-center">
                <Button
                  type="button"
                  variant={action === 'start' ? 'primary' : 'outline'}
                  className="h-11 px-5 text-[13px]"
                  disabled={Boolean(reason)}
                  onClick={() => setPending(action)}
                >
                  {actionLabel(action)}
                </Button>
                {reason && (
                  <span className="mt-1 max-w-[180px] text-center text-[11px] text-neutral-400">{reason}</span>
                )}
              </div>
            )
          })}

          <Button
            type="button"
            variant="outline"
            className="h-11 px-5 text-[13px]"
            onClick={onStartExecution}
          >
            {t('cab.auditPlanning.lifecycle.openExecution', 'Start / continue execution')}
          </Button>

          {hasStarted && (
            <Button asChild variant="tertiary" className="h-11 px-3 text-[13px]">
              <Link to={ROUTES.cabAuditWorkspace}>
                {t('cab.auditPlanning.lifecycle.openReport', 'Open audit report')}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {events.length > 0 && (
        <div className="border-t border-[#f0f0f0] pt-3">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">
            {t('cab.auditPlanning.history.title', 'Plan history')}
          </p>
          <ul className="mt-2 space-y-1.5">
            {events.map((event) => (
              <li key={event.id} className="flex flex-wrap items-center gap-x-3 text-[13px] text-neutral-600">
                <span className="font-medium text-neutral-800">
                  {t(`cab.auditPlanning.history.events.${event.action}`, { defaultValue: event.action })}
                </span>
                {event.detail && <span className="text-neutral-500">{event.detail}</span>}
                <span className="text-[12px] text-neutral-400" dir="ltr">
                  {new Date(event.at).toLocaleString(i18n.language.startsWith('ar') ? 'ar-EG' : 'en-GB', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmDialog
        open={pending !== null}
        title={pending ? actionLabel(pending) : ''}
        description={
          pending
            ? t(`cab.auditPlanning.lifecycle.confirm.${pending}`, {
                number: plan.planNumber,
                defaultValue: {
                  start: `Start audit ${plan.planNumber}? Its status becomes "In progress" and the audit report opens for the team.`,
                  review: `Send audit ${plan.planNumber} for review? The status becomes "Under review" while the report is finalised.`,
                  complete: `Mark audit ${plan.planNumber} as completed? The plan becomes read-only and the audit is added to the competence log of the team.`,
                }[pending],
              })
            : undefined
        }
        confirmLabel={pending ? actionLabel(pending) : ''}
        onConfirm={handleConfirm}
        onClose={() => setPending(null)}
      />
    </section>
  )
}
