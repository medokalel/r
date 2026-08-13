import { useTranslation } from 'react-i18next'
import { AppIcon, FileTextIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

export type CabWorkflowStepStatus = 'completed' | 'inProgress' | 'pending'

export interface CabWorkflowStep {
  key: string
  label: string
  description: string
  status: CabWorkflowStepStatus
}

/** Canonical CAB workflow — same 12 steps as Application Receipt on every page. */
export const CAB_WORKFLOW_STEP_KEYS = [
  'application',
  'applicationReview',
  'quotation',
  'applicationReceipt',
  'quotationApproval',
  'payment',
  'invoicing',
  'contracting',
  'auditPlanning',
  'auditExecution',
  'reporting',
  'surveillance',
] as const

export type CabWorkflowStepKey = (typeof CAB_WORKFLOW_STEP_KEYS)[number]

export function buildCabWorkflowSteps(
  t: (key: string) => string,
  activeStep: CabWorkflowStepKey
): CabWorkflowStep[] {
  const activeIndex = CAB_WORKFLOW_STEP_KEYS.indexOf(activeStep)
  return CAB_WORKFLOW_STEP_KEYS.map((key, index) => ({
    key,
    label: t(`cab.applications.receipt.workflowSteps.${key}`),
    description: t(`cab.applications.receipt.workflowStepDescriptions.${key}`),
    status:
      index < activeIndex ? 'completed' : index === activeIndex ? 'inProgress' : 'pending',
  }))
}

function WorkflowTimelineItem({
  index,
  step,
  isLast,
  fillHeight,
}: {
  index: number
  step: CabWorkflowStep
  isLast: boolean
  fillHeight: boolean
}) {
  const { t } = useTranslation()
  const isActive = step.status === 'inProgress'
  const lineColor =
    step.status === 'completed' ? 'bg-[#86efac]' : isActive ? 'bg-[#c5d4f0]' : 'bg-[#e5e7eb]'
  const statusLabel = t(`cab.applications.receipt.workflow.${step.status}`)

  return (
    <div
      className={cn(
        'relative flex gap-2',
        fillHeight ? 'min-h-0 flex-1 items-start' : 'items-center',
        isActive ? 'rounded-[10px] bg-[#e8edfc] px-2 py-2' : 'px-1.5 py-1.5'
      )}
    >
      <div className={cn('relative flex w-5 shrink-0 justify-center', fillHeight && 'self-stretch')}>
        {index > 1 && (
          <span
            className={cn(
              'absolute left-1/2 top-0 w-px -translate-x-1/2',
              fillHeight ? 'bottom-1/2' : 'h-1/2',
              lineColor
            )}
            aria-hidden
          />
        )}
        {(!isLast || fillHeight) && (
          <span
            className={cn(
              'absolute left-1/2 w-px -translate-x-1/2',
              fillHeight ? 'bottom-0 top-1/2' : '-bottom-1 top-1/2',
              lineColor
            )}
            aria-hidden
            style={fillHeight && isLast ? { visibility: 'hidden' } : undefined}
          />
        )}
        <span
          className={cn(
            'relative z-10 flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold',
            !fillHeight && 'my-auto',
            step.status === 'completed' && 'border-[#22c55e] bg-white text-[#16a34a]',
            isActive && 'border-[#1236a3] bg-[#1236a3] text-white',
            step.status === 'pending' && 'border-[#d1d5db] bg-white text-[#9ca3af]'
          )}
        >
          {index}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              'min-w-0 truncate whitespace-nowrap text-[13px] font-bold leading-tight',
              isActive ? 'text-[#1236a3]' : 'text-[#464646]'
            )}
          >
            {step.label}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold',
                step.status === 'completed' && 'bg-[#eafaf1] text-[#16a34a]',
                isActive && 'bg-white text-[#1236a3] shadow-sm',
                step.status === 'pending' && 'bg-[#f3f4f6] text-[#9ca3af]'
              )}
            >
              {statusLabel}
            </span>
            {step.status === 'completed' && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="shrink-0">
                <circle cx="7" cy="7" r="7" fill="#22C55E" />
                <path
                  d="M4 7.2L6 9.2L10 5"
                  stroke="white"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
        <p className="whitespace-nowrap text-[10px] font-medium leading-tight text-black">
          {step.description}
        </p>
      </div>
    </div>
  )
}

/** The Workflow Progress card from Application Receipt — shared by all CAB pages. */
export function CabWorkflowProgress({
  steps,
  title,
  viewFullLabel,
  onViewFullWorkflow,
  fillHeight = false,
  className,
}: {
  steps: CabWorkflowStep[]
  title: string
  viewFullLabel: string
  onViewFullWorkflow?: () => void
  /** Stretch steps to fill a tall sidebar (Application Receipt only). */
  fillHeight?: boolean
  className?: string
}) {
  return (
    <section
      className={cn(
        'flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[16px] border border-[#ececec] bg-white p-3 shadow-sm',
        fillHeight ? 'h-full' : 'min-h-[1200px]',
        className
      )}
    >
      <h2 className="mb-1.5 shrink-0 text-[14px] font-bold text-[#464646]">{title}</h2>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {steps.map((step, index) => (
          <WorkflowTimelineItem
            key={step.key}
            index={index + 1}
            step={step}
            isLast={index === steps.length - 1}
            fillHeight
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onViewFullWorkflow}
        className="mt-1 inline-flex h-8 w-full shrink-0 items-center justify-center gap-1.5 rounded-[8px] border border-[#ececec] bg-white text-[11px] font-semibold text-[#1236a3] transition-colors hover:bg-[#f9fafb]"
      >
        {viewFullLabel}
        <AppIcon icon={FileTextIcon} size={12} className="text-[#1236a3]" />
      </button>
    </section>
  )
}
