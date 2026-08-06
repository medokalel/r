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
}

/** Horizontal 5-step progress header for the Application Draft wizard. Visual only for now — only step 1 is built. */
export function ApplicationStepper({ current, className }: ApplicationStepperProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('flex items-start rounded-[var(--radius-md)] border border-[#ececec] bg-white p-5', className)}>
      {STEPS.map((step, index) => {
        const number = index + 1
        const isActive = number === current
        const isLast = index === STEPS.length - 1

        return (
          <div key={step} className={cn('flex flex-col', isLast ? 'shrink-0' : 'flex-1')}>
            <div className="flex items-center">
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold',
                  isActive ? 'bg-primary-subtle text-primary' : 'bg-[#f0f0f0] text-neutral-500'
                )}
              >
                {number}
              </span>
              {!isLast && <span className={cn('mx-2 h-px flex-1', isActive ? 'bg-primary' : 'bg-[#ececec]')} aria-hidden />}
            </div>
            <div className="mt-3">
              <p className={cn('text-[15px] font-semibold', isActive ? 'text-neutral-900' : 'text-neutral-500')}>
                {t(`cab.applicationDraft.steps.${step}`)}
              </p>
              <span className={cn('mt-2 block h-[3px] w-10 rounded-full', isActive ? 'bg-primary' : 'bg-transparent')} aria-hidden />
            </div>
          </div>
        )
      })}
    </div>
  )
}