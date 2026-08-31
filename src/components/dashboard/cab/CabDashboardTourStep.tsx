import type { ReactNode } from 'react'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { CAB_DASHBOARD_TOUR_STEPS } from '@/config/cabTourSteps'

interface CabDashboardTourStepProps {
  stepId: string
  children: ReactNode
  /** Extra classes for the tour anchor's wrapper div — e.g. to center a
   *  fixed-size child instead of letting it sit at the wrapper's start edge. */
  className?: string
}

/** Thin CAB binding over the shared DashboardTourStep, kept so existing call
 *  sites don't need to pass `steps={CAB_DASHBOARD_TOUR_STEPS}` everywhere. */
export function CabDashboardTourStep({ stepId, children, className }: CabDashboardTourStepProps) {
  return (
    <DashboardTourStep steps={CAB_DASHBOARD_TOUR_STEPS} stepId={stepId} className={className}>
      {children}
    </DashboardTourStep>
  )
}