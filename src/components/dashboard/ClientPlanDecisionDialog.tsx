import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { OBJECTION_REASON_MIN_LENGTH } from '@/lib/api/clientAuditsApi'
import type { AuditPlan } from '@/lib/api/cabAuditPlanningApi'
import { cn } from '@/lib/utils'

export type ClientPlanDecisionMode = 'confirm' | 'objection'

interface ClientPlanDecisionDialogProps {
  isOpen: boolean
  mode: ClientPlanDecisionMode
  plan: AuditPlan
  onClose: () => void
  onConfirmPlan: () => void | Promise<void>
  onSubmitObjection: (memberName: string, reason: string) => void | Promise<void>
}

/**
 * The client's decision on a sent audit plan (phase 2): approve the plan as
 * scheduled, or object to one team member with a reason. Styled after the
 * CAB reschedule modal, RTL aware.
 */
export function ClientPlanDecisionDialog({
  isOpen,
  mode,
  plan,
  onClose,
  onConfirmPlan,
  onSubmitObjection,
}: ClientPlanDecisionDialogProps) {
  const { t } = useTranslation()
  const [memberName, setMemberName] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // The parent renders this dialog only while it is open, so local state
  // always starts empty on mount; no reset effect needed.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const reasonValid = reason.trim().length >= OBJECTION_REASON_MIN_LENGTH
  const canSubmit =
    mode === 'confirm' ? !submitting : Boolean(memberName) && reasonValid && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      if (mode === 'confirm') {
        await onConfirmPlan()
      } else {
        await onSubmitObjection(memberName, reason.trim())
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-plan-decision-title"
        className="w-full max-w-[520px] rounded-[16px] bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#eef0f4] pb-4">
          <h3 id="client-plan-decision-title" className="text-[17px] font-bold text-neutral-900">
            {mode === 'confirm'
              ? t('clientAudits.plan.dialog.confirmTitle')
              : t('clientAudits.plan.dialog.objectionTitle')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.cancel')}
            className="text-[20px] leading-none text-neutral-400 hover:text-neutral-600"
          >
            ×
          </button>
        </div>

        <p className="mt-4 text-[13px] leading-relaxed text-neutral-600">
          {mode === 'confirm'
            ? t('clientAudits.plan.dialog.confirmBody', { plan: plan.planNumber })
            : t('clientAudits.plan.dialog.objectionBody')}
        </p>

        {mode === 'objection' && (
          <>
            <div className="mt-4">
              <p className="mb-1.5 block text-[13px] font-medium text-neutral-800">
                {t('clientAudits.plan.dialog.memberLabel')} <span className="text-red-600">*</span>
              </p>
              <ul className="flex max-h-[180px] flex-col gap-2 overflow-y-auto">
                {plan.teamMembers.map((member) => (
                  <li key={member.id}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-[8px] border px-3 py-2.5 text-[13px]',
                        memberName === member.name
                          ? 'border-primary bg-[#eef2fd]'
                          : 'border-[#e2e2e2] bg-white hover:border-[#c7d4f7]'
                      )}
                    >
                      <input
                        type="radio"
                        name="objection-member"
                        value={member.name}
                        checked={memberName === member.name}
                        onChange={() => setMemberName(member.name)}
                        className="accent-primary"
                      />
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e8edfc] text-[11px] font-semibold text-primary">
                        {member.initials}
                      </span>
                      <span className="min-w-0">
                        <span dir="auto" className="block truncate text-start font-medium text-neutral-900">
                          {member.name}
                        </span>
                        <span className="block text-[12px] text-neutral-500">
                          {t(`clientAudits.plan.roles.${member.role}`, member.role)}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4">
              <label
                htmlFor="objection-reason"
                className="mb-1 block text-[13px] font-medium text-neutral-800"
              >
                {t('clientAudits.plan.dialog.reasonLabel')} <span className="text-red-600">*</span>
              </label>
              <textarea
                id="objection-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder={t('clientAudits.plan.dialog.reasonPlaceholder')}
                className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-3 text-[13px] text-neutral-900"
              />
              {reason.trim().length > 0 && !reasonValid && (
                <p className="mt-1 text-[12px] text-red-600">
                  {t('clientAudits.plan.dialog.reasonTooShort', {
                    count: OBJECTION_REASON_MIN_LENGTH,
                  })}
                </p>
              )}
            </div>
          </>
        )}

        <div className="mt-5 flex justify-end gap-2.5 border-t border-[#eef0f4] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              'h-10 rounded-[8px] px-5 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50',
              mode === 'confirm'
                ? 'bg-primary hover:bg-[#0f2d8a] disabled:hover:bg-primary'
                : 'bg-[#b91c1c] hover:bg-[#991b1b] disabled:hover:bg-[#b91c1c]'
            )}
          >
            {mode === 'confirm'
              ? t('clientAudits.plan.dialog.confirmSubmit')
              : t('clientAudits.plan.dialog.objectionSubmit')}
          </button>
        </div>
      </div>
    </div>
  )
}
