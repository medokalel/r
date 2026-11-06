import { useTranslation } from 'react-i18next'
import { englishDigitsLtrClassName } from '@/lib/englishDigits'
import { SSO_WIZARD_STEPS, type SsoWizardStep } from '@/lib/api/ssoTypes'
import { cn } from '@/lib/utils'

interface SsoStepNavProps {
  current: SsoWizardStep
  /** Steps after the first need a saved connection. */
  canOpenStep: (step: SsoWizardStep) => boolean
  onSelect: (step: SsoWizardStep) => void
  disabled?: boolean
}

/** The wizard's numbered steps — same look as the registration step nav, but clickable. */
export function SsoStepNav({ current, canOpenStep, onSelect, disabled }: SsoStepNavProps) {
  const { t } = useTranslation()

  return (
    <nav
      className="flex flex-nowrap items-center gap-3 overflow-x-auto scrollbar-hide"
      aria-label={t('cab.sso.wizard.stepsLabel')}
    >
      {SSO_WIZARD_STEPS.map((step, index) => {
        const isActive = step === current
        const locked = disabled || !canOpenStep(step)

        return (
          <button
            key={step}
            type="button"
            disabled={locked}
            aria-current={isActive ? 'step' : undefined}
            onClick={() => onSelect(step)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-[var(--radius-sm)] border px-2 py-2',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed',
              isActive ? 'border-[#a3b8f5] bg-primary-subtle' : 'border-transparent hover:bg-neutral-50',
            )}
          >
            <span
              lang="en"
              dir="ltr"
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-[10px] text-[13px] font-semibold',
                englishDigitsLtrClassName,
                isActive ? 'bg-primary text-white' : 'bg-[#f4f4f4] text-neutral-500',
              )}
            >
              {index + 1}
            </span>
            <span
              className={cn(
                'whitespace-nowrap text-[14px] leading-none',
                isActive ? 'font-semibold text-primary' : 'text-neutral-500',
                locked && !isActive && 'opacity-60',
              )}
            >
              {t(`cab.sso.wizard.steps.${step}`)}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
