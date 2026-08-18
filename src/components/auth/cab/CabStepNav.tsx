import { useTranslation } from 'react-i18next'
import { englishDigitsLtrClassName } from '@/lib/englishDigits'
import { cn } from '@/lib/utils'

const CAB_STEPS = [
  { key: 'register.cab.steps.basics', number: 1 },
  { key: 'register.cab.steps.verification', number: 2 },
] as const

interface CabStepNavProps {
  current: 1 | 2
  className?: string
}

export function CabStepNav({ current, className }: CabStepNavProps) {
  const { t } = useTranslation()

  return (
    <nav
      className={cn('flex flex-nowrap items-center gap-4 overflow-x-auto scrollbar-hide', className)}
      aria-label={t('register.progressLabel')}
    >
      {CAB_STEPS.map((step) => {
        const isActive = step.number === current

        return (
          <div
            key={step.number}
            className={cn(
              'flex shrink-0 items-center gap-2',
              isActive && 'rounded-[var(--radius-sm)] border border-[#a3b8f5] bg-primary-subtle px-1 py-3'
            )}
          >
            <span
              lang="en"
              dir="ltr"
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[13px] font-semibold',
                englishDigitsLtrClassName,
                isActive ? 'bg-primary text-white' : 'bg-[#f4f4f4] text-neutral-500'
              )}
            >
              {step.number}
            </span>
            <span
              className={cn(
                'whitespace-nowrap text-[14px] leading-none',
                isActive ? 'font-semibold text-primary' : 'text-neutral-500'
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