import type { ReactNode } from 'react'
import { TourTooltip } from '@/components/ui/TourTooltip'
import { CAB_DASHBOARD_TOUR_STEPS } from '@/config/cabTourSteps'
import { useTour } from '@/context/TourContext'

interface CabDashboardTourStepProps {
  stepId: string
  children: ReactNode
}

export function CabDashboardTourStep({ stepId, children }: CabDashboardTourStepProps) {
  const { activeStepId, isTourActive, isSkipped, nextStep, prevStep, skipTour, goToStep } = useTour()
  const config = CAB_DASHBOARD_TOUR_STEPS.find((s) => s.id === stepId)

  if (!config) {
    return <>{children}</>
  }

  const isActiveStep = activeStepId === stepId

  // Calculate open status:
  // 1. If skipped: force openProp = false (hides all popups).
  // 2. If tour is active (e.g. Next/Back clicked): open active step automatically.
  // 3. Otherwise: openProp = undefined (hovering/touching any area opens its foreground spotlight popup).
  let openProp: boolean | undefined = undefined
  if (isSkipped) {
    openProp = false
  } else if (isTourActive) {
    openProp = isActiveStep
  } else {
    openProp = undefined
  }

  const handleNext = () => {
    if (isActiveStep) {
      nextStep()
    } else {
      goToStep(config.step + 1)
    }
  }

  const handleBack = () => {
    if (isActiveStep) {
      prevStep()
    } else {
      goToStep(config.step - 1)
    }
  }

  const handleSelectStep = () => {
    if (!isSkipped) {
      goToStep(config.step)
    }
  }

  const isLastStep = config.step === config.totalSteps

  return (
    <TourTooltip
      step={config.step}
      totalSteps={config.totalSteps}
      title={config.title}
      description={config.description}
      side={config.side}
      align={config.align}
      offsetX={config.offsetX}
      offsetY={config.offsetY}
      open={openProp}
      onNext={handleNext}
      nextLabel={isLastStep ? 'Finish' : 'Next'}
      onBack={config.step > 1 ? handleBack : undefined}
      onSkip={skipTour}
      onSelectStep={handleSelectStep}
    >
      {children}
    </TourTooltip>
  )
}
