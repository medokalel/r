import { useTranslation } from 'react-i18next'
import { WIZARD_STEPS, type WizardStep } from '@/lib/dataMigrationWizard'
import { cn } from '@/lib/utils'

interface ImportWizardStepperProps {
  step: WizardStep
  /** Which steps the user may jump to by clicking them. */
  isReachable: (step: WizardStep) => boolean
  onSelect: (step: WizardStep) => void
}

export function ImportWizardStepper({ step, isReachable, onSelect }: ImportWizardStepperProps) {
  const { t } = useTranslation()
  const currentIndex = WIZARD_STEPS.indexOf(step)

  return (
    <ol className="flex items-center gap-2">
      {WIZARD_STEPS.map((item, index) => {
        const done = index < currentIndex
        const current = index === currentIndex
        const clickable = !current && isReachable(item)
        const content = (
          <>
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold',
                current && 'bg-primary text-white',
                done && 'bg-[#dcfce7] text-[#16a34a]',
                !current && !done && 'bg-[#f3f4f6] text-neutral-500'
              )}
            >
              {done ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              ) : (
                index + 1
              )}
            </span>
            <span
              className={cn(
                'text-[13px] font-semibold',
                current ? 'inline text-neutral-900' : 'hidden text-neutral-500 sm:inline'
              )}
            >
              {t(`cab.dataMigration.wizard.steps.${item}`)}
            </span>
          </>
        )
        return (
          <li key={item} className="flex items-center gap-2" aria-current={current ? 'step' : undefined}>
            {clickable ? (
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {content}
              </button>
            ) : (
              <span className="flex items-center gap-2">{content}</span>
            )}
            {index < WIZARD_STEPS.length - 1 && <span className="h-px w-4 bg-[#e2e2e2] sm:w-8" aria-hidden />}
          </li>
        )
      })}
    </ol>
  )
}