import type { ReactNode } from 'react'
import { TourTooltip } from '@/components/ui/TourTooltip'
import { useTour, type TourStepConfig } from '@/context/TourContext'

interface DashboardTourStepProps {
  /** Ordered steps for the tour this stepId belongs to (e.g. CAB_DASHBOARD_TOUR_STEPS,
   *  AUDITEE_DASHBOARD_TOUR_STEPS). Keeps this component role-agnostic. */
  steps: TourStepConfig[]
  stepId: string
  children: ReactNode
  /** Extra classes for the tour anchor's wrapper div — e.g. to preserve a
   *  sibling's own flex-basis/max-width instead of letting the wrapper's
   *  default `w-full` override it. */
  className?: string
}

export function DashboardTourStep({ steps, stepId, children, className }: DashboardTourStepProps) {
  const { activeStepId, isTourActive, nextStep, prevStep, skipTour } = useTour()
  const config = steps.find((s) => s.id === stepId)

  if (!config) {
    return <>{children}</>
  }

  // Only the step the tour is currently on is ever open — no hover fallback,
  // no click-to-jump. Advancing only happens via the Skip/Back/Next buttons,
  // so this stays a plain boolean the whole component tree can rely on.
  const isOpen = isTourActive && activeStepId === stepId
  const isLastStep = config.step === config.totalSteps

  return (
    <TourTooltip
      step={config.step}
      totalSteps={config.totalSteps}
      title={config.title}
      description={config.description}
      side={config.side}
      align={config.align}
      alignOffset={config.alignOffset}
      open={isOpen}
      onNext={nextStep}
      nextLabel={isLastStep ? 'Finish' : 'Next'}
      onBack={config.step > 1 ? prevStep : undefined}
      onSkip={skipTour}
      className={className}
    >
      {children}
    </TourTooltip>
  )
}