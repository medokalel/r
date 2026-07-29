import { useTranslation } from 'react-i18next'
import { englishDigitsLtrClassName } from '@/lib/englishDigits'
import { cn } from '@/lib/utils'

const CAB_STEPS = [
  { key: 'register.cab.steps.details', number: 1 },
  { key: 'register.cab.steps.scopeModules', number: 2 },
  { key: 'register.cab.steps.verification', number: 3 },
  { key: 'register.cab.steps.accountSetup', number: 4 },
] as const

interface CabStepNavProps {
  current: 1 | 2 | 3 | 4
  className?: string
}

export function CabStepNav({ current, className }: CabStepNavProps) {
  const { t } = useTranslation()

  return (
    <nav
      className={cn('flex flex-wrap gap-2', className)}
      aria-label={t('register.progressLabel')}
    >
      {CAB_STEPS.map((step) => {
        const isActive = step.number === current

        return (
          <div
            key={step.number}
            className={cn(
              'flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2',
              isActive ? 'bg-primary text-white' : 'bg-[#f4f4f4] text-neutral-500'
            )}
          >
            <span
              lang="en"
              dir="ltr"
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold',
                englishDigitsLtrClassName,
                isActive ? 'bg-white text-primary' : 'bg-white text-neutral-500'
              )}
            >
              {step.number}
            </span>
            <span
              className={cn('text-[14px] leading-none', isActive ? 'font-semibold' : undefined)}
            >
              {t(step.key)}
            </span>
          </div>
        )
      })}
    </nav>
  )
}