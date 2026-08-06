import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const WORKFLOW_STEPS = [
  'application',
  'applicationReview',
  'quotation',
  'contracting',
  'financial',
  'auditPlanning',
  'auditExecution',
  'auditReporting',
  'certificationDecision',
  'surveillanceProgramme',
] as const

type WorkflowStepKey = (typeof WORKFLOW_STEPS)[number]

interface ClientWorkflowProgressProps {
  /** Which step is currently active (in progress) — the rest render as pending. */
  activeStep?: WorkflowStepKey
  onViewFullWorkflow?: () => void
}

/** Read-only overview of the full client → certification workflow, shown while registering a new client. */
export function ClientWorkflowProgress({
  activeStep = 'application',
  onViewFullWorkflow,
}: ClientWorkflowProgressProps) {
  const { t } = useTranslation()

  return (
    <aside className="w-full shrink-0 rounded-[var(--radius-md)] border border-[#ececec] bg-white p-5 lg:w-[340px]">
      <h3 className="text-[18px] font-semibold text-neutral-900">
        {t('cab.clientRegistration.workflow.title')}
      </h3>

      <ol className="mt-4 space-y-5">
        {WORKFLOW_STEPS.map((step, index) => {
          const isActive = step === activeStep
          const isLast = index === WORKFLOW_STEPS.length - 1

          return (
            <li key={step} className="relative flex items-start gap-3">
              {!isLast && (
                <span
                  className={cn(
                    'absolute start-3 top-6 -bottom-5 w-0.5',
                    isActive ? 'bg-primary' : 'bg-[#e0e0e0]'
                  )}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold',
                  isActive ? 'bg-primary text-white' : 'bg-[#f0f0f0] text-neutral-500'
                )}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn('text-[14px] font-semibold', isActive ? 'text-neutral-900' : 'text-neutral-700')}>
                    {t(`cab.clientRegistration.workflow.steps.${step}.title`)}
                  </p>
                  <span
                    className={cn(
                      'shrink-0 rounded-[6px] px-2 py-0.5 text-[11px] font-medium',
                      isActive ? 'bg-[#fef3c6] text-[#a58401]' : 'bg-[#f0f0f0] text-neutral-500'
                    )}
                  >
                    {isActive
                      ? t('cab.clientRegistration.workflow.inProgress')
                      : t('cab.clientRegistration.workflow.pending')}
                  </span>
                </div>
                <p className="mt-0.5 text-[13px] text-neutral-500">
                  {t(`cab.clientRegistration.workflow.steps.${step}.description`)}
                </p>
              </div>
            </li>
          )
        })}
      </ol>

      <button
        type="button"
        onClick={onViewFullWorkflow}
        className="mt-5 flex w-full items-center justify-center rounded-[var(--radius-sm)] border border-primary px-4 py-3 text-[14px] font-semibold text-primary transition-colors hover:bg-[#f3f6fd]"
      >
        {t('cab.clientRegistration.workflow.viewFull')}
      </button>
    </aside>
  )
}