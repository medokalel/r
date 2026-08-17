import type { WorkflowStep, WorkflowStepStatus } from '@/lib/workflowSteps'
import { cn } from '@/lib/utils'

interface WorkflowProgressCardProps {
  steps: WorkflowStep[]
  title: string
  viewFullLabel: string
  statusLabels: Record<WorkflowStepStatus, string>
  onViewFullWorkflow?: () => void
  className?: string
}

/**
 * Read-only overview of a CAB workflow (client registration, application
 * receipt, review, etc.) — shared by every CAB page that shows one, so a
 * style change here applies everywhere instead of needing to be repeated.
 */
export function WorkflowProgressCard({
  steps,
  title,
  viewFullLabel,
  statusLabels,
  onViewFullWorkflow,
  className,
}: WorkflowProgressCardProps) {
  return (
    <aside
      className={cn(
        'w-full shrink-0 rounded-[var(--radius-md)] border border-[#ececec] bg-white p-5 lg:w-[340px]',
        className
      )}
    >
      <h3 className="text-[18px] font-semibold text-neutral-900">{title}</h3>

      <ol className="mt-4 space-y-5">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1
          const isActive = step.status === 'inProgress'
          const isCompleted = step.status === 'completed'

          return (
            <li key={step.key} className="relative flex items-start gap-3">
              {!isLast && (
                <span
                  className={cn(
                    'absolute start-3 top-6 -bottom-5 w-0.5',
                    isCompleted ? 'bg-[#22c55e]' : isActive ? 'bg-primary' : 'bg-[#e0e0e0]'
                  )}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold',
                  isCompleted
                    ? 'bg-[#22c55e] text-white'
                    : isActive
                      ? 'bg-primary text-white'
                      : 'bg-[#f0f0f0] text-neutral-500'
                )}
              >
                {isCompleted ? (
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path
                      d="M3 7.2L6 10.2L11 4"
                      stroke="white"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      'text-[14px] font-semibold',
                      isActive || isCompleted ? 'text-neutral-900' : 'text-neutral-700'
                    )}
                  >
                    {step.label}
                  </p>
                  <span
                    className={cn(
                      'shrink-0 rounded-[6px] px-2 py-0.5 text-[11px] font-medium',
                      isCompleted
                        ? 'bg-[#eafaf1] text-[#16a34a]'
                        : isActive
                          ? 'bg-[#fef3c6] text-[#a58401]'
                          : 'bg-[#f0f0f0] text-neutral-500'
                    )}
                  >
                    {statusLabels[step.status]}
                  </span>
                </div>
                <p className="mt-0.5 text-[13px] text-neutral-500">{step.description}</p>
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
        {viewFullLabel}
      </button>
    </aside>
  )
}