import { useTranslation } from 'react-i18next'
import { englishDigitsLtrClassName } from '@/lib/englishDigits'
import { cn } from '@/lib/utils'

const STEPS = [
  { key: 'register.steps.entityVerification', number: 1 },
  { key: 'register.steps.legalOperational', number: 2 },
  { key: 'register.steps.accountSetup', number: 3 },
] as const

interface RegisterStepNavProps {
  current: 1 | 2 | 3
  className?: string
}

export function RegisterStepNav({ current, className }: RegisterStepNavProps) {
  const { t } = useTranslation()

  return (
    <nav className={cn('grid grid-cols-3 gap-2', className)} aria-label={t('register.progressLabel')}>
      {STEPS.map((step) => {
        const isActive = step.number === current
        const isPast = step.number < current

        return (
          <div
            key={step.number}
            className={cn(
              'flex min-w-0 items-center gap-2 rounded-[var(--radius-sm)] min-h-[70px] py-3 pe-3 ps-2',
              isActive && 'border border-blue-200 bg-primary-subtle'
            )}
          >
            <div
              lang="en"
              dir="ltr"
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[14px] font-semibold',
                englishDigitsLtrClassName,
                isActive && 'bg-primary text-white shadow-md',
                !isActive && (isPast ? 'bg-neutral-100 text-neutral-600' : 'bg-[#f4f4f4] text-neutral-500')
              )}
            >
              {step.number}
            </div>
            <span
              className={cn(
                'min-w-0 flex-1 text-[14px] leading-snug',
                isActive ? 'text-primary font-semibold' : 'text-neutral-500'
              )}
            >
              {t(step.key)}
            </span>
          </div>
        )
      })}
    </nav>
  )
}
