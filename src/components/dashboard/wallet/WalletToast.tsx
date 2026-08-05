import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export type WalletToastVariant = 'success' | 'error'

interface WalletToastProps {
  variant: WalletToastVariant
  onClose: () => void
  onRetry?: () => void
}

export function WalletToast({ variant, onClose, onRetry }: WalletToastProps) {
  const { t } = useTranslation()
  const isSuccess = variant === 'success'

  return (
    <div
      className={cn(
        'flex w-full items-start gap-3 rounded-[12px] border px-4 py-3 shadow-sm',
        isSuccess ? 'border-[#b8e6cc] bg-[#eafaf1]' : 'border-[#f5c6cb] bg-[#fdecea]'
      )}
      role="status"
    >
      <span
        className={cn(
          'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full',
          isSuccess ? 'bg-[#2ecc70] text-white' : 'bg-[#e74c3c] text-white'
        )}
      >
        {isSuccess ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className={cn('text-[15px] font-semibold', isSuccess ? 'text-[#1e7e45]' : 'text-[#c0392b]')}>
          {t(isSuccess ? 'wallet.toast.successTitle' : 'wallet.toast.errorTitle')}
        </p>
        <p className={cn('text-[13px] leading-[1.5]', isSuccess ? 'text-[#2d8659]' : 'text-[#c0392b]')}>
          {t(isSuccess ? 'wallet.toast.successMessage' : 'wallet.toast.errorMessage')}
        </p>
        {!isSuccess && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 rounded-[var(--radius-sm)] border border-[#e74c3c] px-4 py-1.5 text-[13px] font-medium text-[#e74c3c] transition-colors hover:bg-white"
          >
            {t('errors.retry')}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label={t('common.close')}
        className="shrink-0 text-neutral-500 hover:text-neutral-700"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

/** Fixed overlay toast — floats above page content without shifting layout. */
export function WalletToastOverlay({ variant, onClose, onRetry }: WalletToastProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[76px] z-50 flex justify-center px-5">
      <div className="pointer-events-auto w-full max-w-[640px]">
        <WalletToast variant={variant} onClose={onClose} onRetry={onRetry} />
      </div>
    </div>
  )
}
