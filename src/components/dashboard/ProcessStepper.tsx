import { useTranslation } from 'react-i18next'
import {
  AccreditationFieldStepIcon,
  AssessmentVisitStepIcon,
  ChecklistsStepIcon,
  CorrectiveActionStepIcon,
  DocumentReviewStepIcon,
  FileReviewStepIcon,
  FinalReportStepIcon,
  GrantApplicationStepIcon,
  type ProcessStepIconComponent,
} from '@/components/dashboard/processStepIcons'
import { cn } from '@/lib/utils'

const steps: { key: string; icon: ProcessStepIconComponent }[] = [
  { key: 'grantApplication', icon: GrantApplicationStepIcon },
  { key: 'accreditationField', icon: AccreditationFieldStepIcon },
  { key: 'checklists', icon: ChecklistsStepIcon },
  { key: 'fileReview', icon: FileReviewStepIcon },
  { key: 'documentReview', icon: DocumentReviewStepIcon },
  { key: 'assessmentVisit', icon: AssessmentVisitStepIcon },
  { key: 'correctiveAction', icon: CorrectiveActionStepIcon },
  { key: 'finalReport', icon: FinalReportStepIcon },
]

interface ProcessStepperProps {
  activeStep?: number
}

export function ProcessStepper({ activeStep = 0 }: ProcessStepperProps) {
  const { t } = useTranslation()

  return (
    <div className="flex shrink-0 gap-2 border-b-2 border-[#ececec] bg-white p-5">
      {steps.map(({ key, icon: Icon }, index) => {
        const isActive = index === activeStep
        const isCompleted = index < activeStep
        const isHighlighted = isActive || isCompleted

        return (
          <button
            key={key}
            type="button"
            aria-current={isActive ? 'step' : undefined}
            className="flex min-w-0 flex-1 cursor-pointer flex-col gap-4 text-start"
          >
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-full',
                isHighlighted ? 'bg-[#e8edfc]' : 'bg-[#ececec]'
              )}
            >
              <Icon className={isHighlighted ? 'text-primary' : 'text-neutral-600'} />
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
              {t(`accreditation.steps.${key}`)}
            </p>
          </button>
        )
      })}
    </div>
  )
}
