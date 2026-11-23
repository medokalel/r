import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { AuditPlan } from '@/lib/api/cabAuditPlanningApi'
import { applyLifecycleAction, type LifecycleAction } from '@/lib/api/auditPlanLifecycleApi'
import {
  lifecycleActionLabel,
  lifecycleConfirmMessage,
  lifecycleSuccessMessage,
} from '@/lib/auditPlanLifecycleCopy'
import { toast } from '@/lib/toast'

interface AuditPlanLifecycleDialogProps {
  plan: AuditPlan | null
  action: LifecycleAction | null
  onClose: () => void
  /** Receives the updated plan once the action succeeded. */
  onDone: (plan: AuditPlan) => void
}

/**
 * Confirmation step for Start audit / Send for review / Mark completed.
 * Used by the audit schedule row menu and by the lifecycle bar on the build page,
 * so both show the same wording and behave the same.
 */
export function AuditPlanLifecycleDialog({ plan, action, onClose, onDone }: AuditPlanLifecycleDialogProps) {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    setError(null)
    onClose()
  }

  const handleConfirm = async () => {
    if (!plan || !action) return
    setError(null)
    try {
      const { plan: updated, competenceLogged } = await applyLifecycleAction(plan, action)
      toast.success(lifecycleSuccessMessage(t, action, updated, competenceLogged))
      onDone(updated)
      close()
    } catch {
      setError(
        t('cab.auditPlanning.lifecycle.error', {
          defaultValue: 'The audit status could not be updated. Try again.',
        }),
      )
    }
  }

  const label = action ? lifecycleActionLabel(t, action) : ''

  return (
    <ConfirmDialog
      open={Boolean(plan && action)}
      title={label}
      description={plan && action ? lifecycleConfirmMessage(t, action, plan) : undefined}
      confirmLabel={label}
      onConfirm={handleConfirm}
      onClose={close}
    >
      {error ? (
        <p role="alert" className="text-[13px] font-medium text-error-600">
          {error}
        </p>
      ) : null}
    </ConfirmDialog>
  )
}
