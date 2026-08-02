import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/ui/TextField'
import { fieldTextareaClassName } from '@/components/ui/fieldStyles'
import { WalletModalActions, WalletModalShell } from '@/components/dashboard/wallet/WalletModalShell'
import { cn } from '@/lib/utils'

interface RequestRefundModalProps {
  open: boolean
  onClose: () => void
  onSubmit: () => void
}

export function RequestRefundModal({ open, onClose, onSubmit }: RequestRefundModalProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [authorized, setAuthorized] = useState(true)
  const [form, setForm] = useState({
    orderNumber: '578676498098',
    date: '01/01/2026',
    amount: '4,000',
    reason: 'Cancel grant application',
    notes: '',
  })

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 400))
      onSubmit()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <WalletModalShell
      open={open}
      onClose={onClose}
      title={t('wallet.refundModal.title')}
    >
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
        <div className="flex flex-col gap-5">
          <TextField
            id="refund-order-number"
            label={t('wallet.refundModal.orderNumber')}
            value={form.orderNumber}
            onChange={(e) => setForm((prev) => ({ ...prev, orderNumber: e.target.value }))}
            dir="ltr"
          />
          <div className="space-y-2">
            <label htmlFor="refund-date" className="block text-[15px] font-medium text-neutral-900">
              {t('wallet.refundModal.date')}
            </label>
            <div className="relative">
              <input
                id="refund-date"
                type="text"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full rounded-[var(--radius-sm)] border border-neutral-200 bg-white py-3 pe-10 ps-4 text-[14px] outline-none focus:border-primary"
                dir="ltr"
              />
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="pointer-events-none absolute inset-y-0 end-3 my-auto text-neutral-400"
              >
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <TextField
            id="refund-amount"
            label={t('wallet.refundModal.amount')}
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
            dir="ltr"
          />
          <TextField
            id="refund-reason"
            label={t('wallet.refundModal.reason')}
            value={form.reason}
            onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="refund-notes" className="block text-[15px] font-medium text-neutral-900">
            {t('wallet.refundModal.notes')}
          </label>
          <textarea
            id="refund-notes"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder={t('wallet.refundModal.notesPlaceholder')}
            className={cn(fieldTextareaClassName, 'min-h-[96px] resize-none')}
          />
        </div>

        <p className="text-[13px] leading-[1.6] text-[#e74c3c]">
          {t('wallet.refundModal.warning')}
        </p>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={authorized}
            onChange={(e) => setAuthorized(e.target.checked)}
            className="mt-1 size-5 shrink-0 accent-primary"
          />
          <span className="text-[14px] leading-[1.6] text-neutral-700">
            {t('wallet.refundModal.authorization')}
          </span>
        </label>

        <WalletModalActions
          onCancel={onClose}
          onConfirm={handleSubmit}
          confirmLabel={t('wallet.refundModal.submit')}
          confirmDisabled={!authorized}
          loading={loading}
        />
      </div>
    </WalletModalShell>
  )
}
