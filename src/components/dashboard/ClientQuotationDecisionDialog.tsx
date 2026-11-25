import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { QUOTATION_REJECTION_REASON_MIN_LENGTH } from '@/lib/api/clientQuotationsApi'
import { cn } from '@/lib/utils'

export type ClientQuotationDecisionMode = 'accept' | 'reject'

interface ClientQuotationDecisionDialogProps {
  mode: ClientQuotationDecisionMode
  quotationNumber: string
  onClose: () => void
  onAccept: () => void | Promise<void>
  onReject: (reason: string) => void | Promise<void>
}

/**
 * The client's decision on an issued quotation: accept it as issued, or reject
 * it with a reason. Styled like the audit plan decision dialog, RTL aware.
 * The parent renders it only while open, so local state starts empty.
 */
export function ClientQuotationDecisionDialog({
  mode,
  quotationNumber,
  onClose,
  onAccept,
  onReject,
}: ClientQuotationDecisionDialogProps) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const reasonValid = reason.trim().length >= QUOTATION_REJECTION_REASON_MIN_LENGTH
  const canSubmit = mode === 'accept' ? !submitting : reasonValid && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      if (mode === 'accept') await onAccept()
      else await onReject(reason.trim())
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
        aria-labelledby="client-quotation-decision-title"
        className="w-full max-w-[520px] rounded-[16px] bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#eef0f4] pb-4">
          <h3 id="client-quotation-decision-title" className="text-[17px] font-bold text-neutral-900">
            {mode === 'accept'
              ? t('clientQuotations.dialog.acceptTitle')
              : t('clientQuotations.dialog.rejectTitle')}
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
          {mode === 'accept'
            ? t('clientQuotations.dialog.acceptBody', { quotation: quotationNumber })
            : t('clientQuotations.dialog.rejectBody', { quotation: quotationNumber })}
        </p>

        {mode === 'reject' && (
          <div className="mt-4">
            <label
              htmlFor="quotation-reject-reason"
              className="mb-1 block text-[13px] font-medium text-neutral-800"
            >
              {t('clientQuotations.dialog.reasonLabel')} <span className="text-red-600">*</span>
            </label>
            <textarea
              id="quotation-reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={t('clientQuotations.dialog.reasonPlaceholder')}
              className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-3 text-[13px] text-neutral-900"
            />
            {reason.trim().length > 0 && !reasonValid && (
              <p className="mt-1 text-[12px] text-red-600">
                {t('clientQuotations.dialog.reasonTooShort', {
                  count: QUOTATION_REJECTION_REASON_MIN_LENGTH,
                })}
              </p>
            )}
          </div>
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
              mode === 'accept'
                ? 'bg-primary hover:bg-[#0f2d8a] disabled:hover:bg-primary'
                : 'bg-[#b91c1c] hover:bg-[#991b1b] disabled:hover:bg-[#b91c1c]',
            )}
          >
            {mode === 'accept'
              ? t('clientQuotations.dialog.acceptSubmit')
              : t('clientQuotations.dialog.rejectSubmit')}
          </button>
        </div>
      </div>
    </div>
  )
}
