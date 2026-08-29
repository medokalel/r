import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const STEPS = [
  { key: 'clientInformation', subtitleKey: 'companyContact' },
  { key: 'standardsAndScope', subtitleKey: 'certificationRequirements' },
  { key: 'sitesAndFacilities', subtitleKey: 'locationsActivities' },
  { key: 'documents', subtitleKey: 'requiredDocuments' },
  { key: 'reviewAndConfirm', subtitleKey: 'reviewBeforeSubmit' },
] as const

interface ApplicationStepperProps {
  current: 1 | 2 | 3 | 4 | 5
  className?: string
  // TODO(DEV ONLY): remove onStepClick once the Application Draft flow is
  // finished — this is a dev-convenience shortcut to jump between steps
  // without filling each one in order, not meant for production.
  onStepClick?: (step: 1 | 2 | 3 | 4 | 5) => void
}

/**
 * Horizontal tab bar for the Application Draft wizard — five equal-width
 * tabs (title + short subtitle) inside a bordered/rounded card matching the
 * page's other cards, the active tab highlighted with a light blue fill and
 * a blue underline flush with its bottom edge.
 */
export function ApplicationStepper({ current, className, onStepClick }: ApplicationStepperProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('flex shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-[#ececec] bg-white', className)}>
      {STEPS.map((step, index) => {
        const number = (index + 1) as 1 | 2 | 3 | 4 | 5
        const isActive = number === current
        const isFirst = index === 0
        const isLast = index === STEPS.length - 1

        return (
          <button
            key={step.key}
            type="button"
            aria-current={isActive ? 'step' : undefined}
            onClick={() => onStepClick?.(number)}
            className={cn(
              'relative flex min-w-0 flex-1 flex-col items-center gap-1 border-e border-[#ececec] px-4 py-3.5 text-center last:border-e-0',
              isActive && 'bg-[#eef2fc]',
              isFirst && 'rounded-s-[var(--radius-md)]',
              isLast && 'rounded-e-[var(--radius-md)]'
            )}
          >
            <span
              className={cn(
                'truncate text-[15px] font-semibold',
                isActive ? 'text-primary' : 'text-neutral-900'
              )}
            >
              {t(`cab.applicationDraft.steps.${step.key}`)}
            </span>
            <span className={cn('truncate text-[13px]', isActive ? 'text-primary/70' : 'text-neutral-400')}>
              {t(`cab.applicationDraft.stepSubtitles.${step.subtitleKey}`)}
            </span>
            {isActive && (
              <span
                className={cn(
                  'absolute inset-x-0 bottom-0 h-[3px] bg-primary',
                  isFirst && 'rounded-es-[var(--radius-md)]',
                  isLast && 'rounded-ee-[var(--radius-md)]'
                )}
                aria-hidden
              />
            )}
          </button>
        )
      })}
    </div>
  )
}