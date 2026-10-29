import { useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useDirection } from '@/context/DirectionContext'
import { getToasts, subscribeToasts, toast, type ToastItem, type ToastType } from '@/lib/toast'

const TONES: Record<ToastType, { accent: string; iconWrap: string; progress: string }> = {
  success: {
    accent: 'bg-success-500',
    iconWrap: 'bg-success-50 text-success-600',
    progress: 'bg-success-500/60',
  },
  error: {
    accent: 'bg-error-500',
    iconWrap: 'bg-error-50 text-error-500',
    progress: 'bg-error-500/60',
  },
}

function ToastIcon({ type }: { type: ToastType }) {
  return type === 'success' ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5v.01" strokeLinecap="round" />
    </svg>
  )
}

function ToastCard({ item }: { item: ToastItem }) {
  const { t } = useTranslation()
  const { dir } = useDirection()
  const tone = TONES[item.type]
  const [first, ...rest] = item.message.split('\n')
  const hasDetails = rest.length > 0

  return (
    <div
      role={item.type === 'success' ? 'status' : 'alert'}
      className={cn(
        'pointer-events-auto relative flex w-full max-w-[440px] items-start gap-3 overflow-hidden',
        // The colored edge (inline-start) stays square; only the opposite side is rounded.
        'rounded-[var(--radius-md)] rounded-s-none border border-s-0 border-[#ececec] bg-white py-3.5 ps-5 pe-3',
        'shadow-[0_8px_24px_rgba(18,54,163,0.14)] animate-[toastIn_220ms_ease-out]',
      )}
    >
      <span className={cn('absolute inset-y-0 start-0 w-1', tone.accent)} aria-hidden />

      <span
        className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', tone.iconWrap)}
      >
        <ToastIcon type={item.type} />
      </span>

      <div className="min-w-0 flex-1 pt-1">
        <p
          className={cn(
            'text-[14px] leading-[1.6] text-neutral-900',
            hasDetails ? 'font-semibold' : 'font-medium',
          )}
        >
          {first}
        </p>
        {hasDetails && (
          <p className="mt-1 whitespace-pre-line text-[13px] leading-[1.7] text-neutral-600">
            {rest.join('\n')}
          </p>
        )}
        {item.action && (
          <Button
            type="button"
            variant="tertiary"
            size="sm"
            className="mt-1.5 -ms-3"
            onClick={() => {
              toast.dismiss(item.id)
              item.action?.onClick()
            }}
          >
            {item.action.label}
          </Button>
        )}
      </div>

      <button
        type="button"
        onClick={() => toast.dismiss(item.id)}
        aria-label={t('common.close')}
        className="flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-xs)] text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-700"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
      </button>

      <span
        className={cn(
          'absolute bottom-0 start-0 h-[3px] w-full',
          tone.progress,
        )}
        // The bar fills from the start edge of the active language (left in EN, right in AR).
        style={{
          transformOrigin: dir === 'rtl' ? 'right' : 'left',
          animation: `toastProgress ${item.duration}ms linear forwards reverse`,
        }}
        aria-hidden
      />
    </div>
  )
}

/** Renders the toasts raised through `toast.success / toast.error`. Mount once at the app root. */
export function Toaster() {
  const items = useSyncExternalStore(subscribeToasts, getToasts, getToasts)

  return (
    <div className="pointer-events-none fixed inset-x-0 top-5 z-[100] flex flex-col items-center gap-3 px-4">
      {items.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  )
}
