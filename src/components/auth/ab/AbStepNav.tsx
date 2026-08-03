import { useTranslation } from 'react-i18next'
import { englishDigitsLtrClassName } from '@/lib/englishDigits'
import { cn } from '@/lib/utils'

const AB_STEPS = [
  { key: 'register.ab.steps.details', number: 1 },
  { key: 'register.ab.steps.scopeModules', number: 2 },
  { key: 'register.ab.steps.verification', number: 3 },
  { key: 'register.ab.steps.accountSetup', number: 4 },
] as const

interface AbStepNavProps {
  current: 1 | 2 | 3 | 4 | 5
  className?: string
}

export function AbStepNav({ current, className }: AbStepNavProps) {
  const { t } = useTranslation()

  return (
    <nav
      className={cn('flex flex-nowrap items-center gap-4 overflow-x-auto scrollbar-hide', className)}
      aria-label={t('register.progressLabel')}
    >
      {AB_STEPS.map((step) => {
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