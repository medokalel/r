import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const STEPS = [
  'clientInformation',
  'standardsAndScope',
  'sitesAndFacilities',
  'documents',
  'reviewAndConfirm',
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
 * Horizontal step header for the Application Draft wizard.
 * Same visual system as ProcessStepper (dashboard/ProcessStepper.tsx) —
 * border-bottom container, full-width per-step progress bar, completed
 * steps stay highlighted like the active one — but with step numbers in
 * the circles instead of per-step icons.
 */
export function ApplicationStepper({ current, className, onStepClick }: ApplicationStepperProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('flex shrink-0 gap-2 border-b-2 border-[#ececec] bg-white p-5', className)}>
      {STEPS.map((step, index) => {
        const number = index + 1
        const isActive = number === current
        const isCompleted = number < current
        const isHighlighted = isActive || isCompleted

        return (
          <button
            key={step}
            type="button"
            aria-current={isActive ? 'step' : undefined}
            onClick={() => onStepClick?.(number as 1 | 2 | 3 | 4 | 5)}
            className="flex min-w-0 flex-1 cursor-pointer flex-col gap-4 text-start"
          >
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold',
                isHighlighted ? 'bg-[#e8edfc] text-primary' : 'bg-[#ececec] text-neutral-600'
              )}
            >
              {number}
            </div>

            <div
              className={cn(
                'h-1 w-full rounded-[var(--radius-sm)]',
                isHighlighted ? 'bg-primary' : 'bg-[#ececec]'
              )}
            />

            <p
              className={cn(
                'truncate text-[16px] font-semibold leading-[1.6]',
                isActive ? 'text-primary' : 'text-[#7c7c7c]'
              )}
            >
              {t(`cab.applicationDraft.steps.${step}`)}
            </p>
          </button>
        )
      })}
    </div>
  )
}