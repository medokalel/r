import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { AuditPlanLifecycleDialog } from '@/components/cab/auditPlanning/AuditPlanLifecycleDialog'
import { AuditStatusBadge } from '@/components/cab/auditPlanning/shared'
import type { AuditPlan } from '@/lib/api/cabAuditPlanningApi'
import {
  getLifecycleBlock,
  hasAuditReport,
  type LifecycleAction,
} from '@/lib/api/auditPlanLifecycleApi'
import {
  LIFECYCLE_ACTIONS,
  lifecycleActionLabel,
  lifecycleBlockMessage,
} from '@/lib/auditPlanLifecycleCopy'
import { ROUTES } from '@/lib/routes'

interface AuditPlanLifecycleBarProps {
  plan: AuditPlan
  /** Team, agenda, site and declarations are all complete. */
  planReady: boolean
  onChanged: (plan: AuditPlan) => void
  onStartExecution: () => void
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
      return lifecycleBlockMessage(t, block)
    }
    if (action === 'start' && !planReady) {
      return t(
        'cab.auditPlanning.lifecycle.block.notReady',
        'Complete the team, agenda, site and declarations first.',
      )
    }
    return null
  }

  const events = (plan.events ?? []).slice(-MAX_VISIBLE_EVENTS).reverse()

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
          {LIFECYCLE_ACTIONS.map((action) => {
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
                  {lifecycleActionLabel(t, action)}
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
            {plan.status === 'Completed'
              ? t('cab.auditPlanning.lifecycle.viewExecution', 'View execution')
              : t('cab.auditPlanning.lifecycle.openExecution', 'Start / continue execution')}
          </Button>

          {hasAuditReport(plan) && (
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

      <AuditPlanLifecycleDialog
        plan={pending ? plan : null}
        action={pending}
        onClose={() => setPending(null)}
        onDone={onChanged}
      />
    </section>
  )
}
