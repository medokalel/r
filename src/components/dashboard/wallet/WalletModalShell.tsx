import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

interface WalletModalShellProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  wide?: boolean
}

export function WalletModalShell({
  open,
  onClose,
  title,
  subtitle,
  children,
  className,
  wide = false,
}: WalletModalShellProps) {
  const { t } = useTranslation()

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            'fixed start-1/2 top-1/2 z-50 flex max-h-[90vh] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] bg-white shadow-xl focus:outline-none rtl:translate-x-1/2',
            wide ? 'w-[min(900px,calc(100vw-40px))]' : 'w-[min(560px,calc(100vw-40px))]',
            className
          )}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 px-6 pt-5">
            <div className="min-w-0">
              <Dialog.Title className="text-[24px] font-semibold leading-[1.4] text-neutral-900">
                {title}
              </Dialog.Title>
              {subtitle && (
                <p className="mt-1 text-[14px] leading-[1.6] text-neutral-500">{subtitle}</p>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t('common.close')}
                className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-[#000000] text-[#000000] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function WalletSecurityNotice() {
  const { t } = useTranslation()

  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-sm)] bg-[#e8edfc] px-4 py-3">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-primary">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 8v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1" fill="currentColor" />
      </svg>
      <p className="text-[13px] leading-[1.6] text-primary">{t('wallet.securityNotice')}</p>
    </div>
  )
}

export function WalletModalActions({
  onCancel,
  onConfirm,
  confirmLabel,
  confirmDisabled,
  loading,
}: {
  onCancel: () => void
  onConfirm: () => void
  confirmLabel: string
  confirmDisabled?: boolean
  loading?: boolean
}) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="flex h-12 flex-1 items-center justify-center rounded-[var(--radius-sm)] bg-[#fde8e8] text-[16px] font-semibold text-[#e74c3c] transition-colors hover:bg-[#fcd5d5]"
      >
        {t('common.cancel')}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={confirmDisabled || loading}
        className="flex h-12 flex-1 items-center justify-center rounded-[var(--radius-sm)] bg-primary text-[16px] font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? t('common.loading') : confirmLabel}
      </button>
    </div>
  )
}

export function PaymentMethodToggle({
  value,
  onChange,
}: {
  value: 'visa' | 'bank'
  onChange: (value: 'visa' | 'bank') => void
}) {
  const { t } = useTranslation()

  const options = [
    {
      id: 'visa' as const,
      label: t('wallet.paymentMethods.visa'),
      icon: (
        <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
          <rect x="0.5" y="0.5" width="21" height="15" rx="2" stroke="currentColor" />
          <path d="M0 5h22" stroke="currentColor" />
        </svg>
      ),
    },
    {
      id: 'bank' as const,
      label: t('wallet.paymentMethods.bankAccount'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 10h18M5 10V19M9 10V19M15 10V19M19 10V19M2 19h20M12 3l9 5H3l9-5z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ]

  return (
    <div className="flex w-fit gap-3">
      {options.map((option) => {
        const selected = value === option.id
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border px-5 py-3 text-[14px] font-medium transition-colors',
              selected
                ? 'border-primary bg-[#e8edfc] text-primary'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
            )}
          >
            <span className={selected ? 'text-primary' : 'text-neutral-400'}>{option.icon}</span>
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
