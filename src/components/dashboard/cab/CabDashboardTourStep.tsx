import type { ReactNode } from 'react'
import { TourTooltip } from '@/components/ui/TourTooltip'
import { CAB_DASHBOARD_TOUR_STEPS } from '@/config/cabTourSteps'
import { useTour } from '@/context/TourContext'

interface CabDashboardTourStepProps {
  stepId: string
  children: ReactNode
  /** Extra classes for the tour anchor's wrapper div — e.g. to center a
   *  fixed-size child instead of letting it sit at the wrapper's start edge. */
  className?: string
}

export function CabDashboardTourStep({ stepId, children, className }: CabDashboardTourStepProps) {
  const { activeStepId, isTourActive, nextStep, prevStep, skipTour } = useTour()
  const config = CAB_DASHBOARD_TOUR_STEPS.find((s) => s.id === stepId)

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