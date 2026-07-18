import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  variant?: 'generic' | 'rateLimit'
  className?: string
}

function GenericErrorArt() {
  return (
    <svg
      width="176"
      height="176"
      viewBox="0 0 176 176"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="max-w-full"
    >
      <circle cx="88" cy="88" r="88" className="fill-[#f3f6fd]" />
      <circle cx="88" cy="88" r="64" className="fill-white" />
      <circle
        cx="88"
        cy="88"
        r="63"
        className="fill-none stroke-[#dbe4fa]"
        strokeWidth="2"
        strokeDasharray="6 8"
      />
      <path
        d="M64 92a20 20 0 0 1 5-13 24 24 0 0 1 46 5 16 16 0 0 1-3 31H70"
        className="fill-[#e8edfc]"
      />
      <path
        d="M64 92a20 20 0 0 1 5-13 24 24 0 0 1 46 5 16 16 0 0 1-3 31H70"
        className="fill-none stroke-primary"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M90 74l-10 18h9l-3 14 12-19h-9l1-13z"
        className="fill-[#fdb022] stroke-[#dc9114]"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RateLimitArt() {
  return (
    <svg
      width="176"
      height="176"
      viewBox="0 0 176 176"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="max-w-full"
    >
      <circle cx="88" cy="88" r="88" className="fill-[#fef9e7]" />
      <circle cx="88" cy="88" r="64" className="fill-white" />
      <rect x="62" y="52" width="52" height="9" rx="4.5" className="fill-[#1e3a8a]" />
      <rect x="62" y="115" width="52" height="9" rx="4.5" className="fill-[#1e3a8a]" />
      <path
        d="M68 61h40c0 14-16 22-16 27s16 13 16 27H68c0-14 16-22 16-27s-16-13-16-27z"
        className="fill-[#eaf0ff] stroke-[#c7d5f5]"
        strokeWidth="2"
      />
      <path d="M74 65h28c0 8-14 15-14 18s0-10-14-18z" className="fill-[#fdb022]" />
      <path d="M88 92c-8 6-14 12-14 20h28c0-8-6-14-14-20z" className="fill-[#f59e0b]" />
      <circle cx="88" cy="90" r="1.6" className="fill-[#f59e0b]" />
      <circle cx="88" cy="97" r="1.4" className="fill-[#f59e0b]" />
    </svg>
  )
}

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel,
  variant = 'generic',
  className,
}: ErrorStateProps) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-6 px-6 py-16 text-center',
        className
      )}
      role="alert"
    >
      <div className="relative flex items-center justify-center">
        <span
          className={cn(
            'absolute size-40 rounded-full blur-2xl',
            variant === 'rateLimit' ? 'bg-[#fef3c6]' : 'bg-[#e8edfc]'
          )}
          aria-hidden
        />
        <div className="relative animate-[fadeInScale_0.4s_ease-out]">
          {variant === 'rateLimit' ? <RateLimitArt /> : <GenericErrorArt />}
        </div>
      </div>

      <div className="max-w-md space-y-2">
        <h3 className="text-[22px] font-semibold text-neutral-900">
          {title ?? t('errors.title')}
        </h3>
        <p className="text-[16px] leading-[1.6] text-neutral-600">
          {description ?? t('errors.generic')}
        </p>
      </div>

      {onRetry && (
        <Button variant="primary" size="lg" onClick={onRetry} className="min-w-[180px]">
          {retryLabel ?? t('errors.retry')}
        </Button>
      )}
    </div>
  )
}
