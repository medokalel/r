import { AppIcon, CheckIcon } from '@/components/icons'
import type { CertificationCycleStage } from '@/lib/api/cabCertificationApi'
import { cn } from '@/lib/utils'

interface CertificationCycleTimelineProps {
  stages: CertificationCycleStage[]
  statusLabels: Record<CertificationCycleStage['status'], string>
  className?: string
}

/**
 * Horizontal "cycle timeline" — completed/current/pending stages connected
 * by a line, each with a label, date, and status pill underneath. New
 * component: nothing existing covers a horizontal dotted timeline
 * (WorkflowProgressCard is vertical, ApplicationStepper is an equal-width
 * tab bar), so this is scoped to certification-cycle pages only.
 */
export function CertificationCycleTimeline({
  stages,
  statusLabels,
  className,
}: CertificationCycleTimelineProps) {
  return (
    <ol className={cn('flex w-full items-start', className)}>
      {stages.map((stage, index) => {
        const isLast = index === stages.length - 1
        const isCompleted = stage.status === 'completed'
        const isUpcoming = stage.status === 'upcoming'

        return (
          <li key={stage.id} className="relative flex min-w-0 flex-1 flex-col items-center text-center">
            {!isLast && (
              <span
                className={cn(
                  'absolute top-[15px] start-1/2 h-0.5 w-full',
                  isCompleted ? 'bg-primary' : 'bg-[#e0e0e0]',
                )}
                aria-hidden
              />
            )}
            <span
              className={cn(
                'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2',
                isCompleted && 'border-primary bg-primary text-white',
                isUpcoming && 'border-primary bg-white text-primary',
                !isCompleted && !isUpcoming && 'border-[#e0e0e0] bg-white text-neutral-400',
              )}
            >
              {isCompleted ? (
                <AppIcon icon={CheckIcon} size={16} />
              ) : (
                <span className={cn('size-2 rounded-full', isUpcoming ? 'bg-primary' : 'bg-[#e0e0e0]')} aria-hidden />
              )}
            </span>

            <p className="mt-3 max-w-[140px] text-[13px] font-semibold text-neutral-900">{stage.label}</p>
            <p className="mt-0.5 text-[12px] text-neutral-500">{stage.date}</p>
            <span
              className={cn(
                'mt-2 rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                isCompleted && 'bg-[#eafaf1] text-[#16a34a]',
                isUpcoming && 'bg-[#e8edfc] text-primary',
                !isCompleted && !isUpcoming && 'bg-[#f0f0f0] text-neutral-500',
              )}
            >
              {statusLabels[stage.status]}
            </span>
          </li>
        )
      })}
    </ol>
  )
}