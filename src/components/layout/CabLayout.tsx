import { cn } from '@/lib/utils'
import { useDirection } from '@/context/DirectionContext'
import { CabSidebarProvider } from '@/context/CabSidebarContext'
import { CabSidebar } from '@/components/dashboard/cab/CabSidebar'
import { CabTourProvider } from '@/components/layout/CabTourProvider'
import { TourProvider, type TourStepConfig } from '@/context/TourContext'
import { useCabDashboardTourSteps } from '@/config/cabTourSteps'
import { isCabWorkflowTour } from '@/config/cabTourSequence'

interface CabLayoutProps {
  children: React.ReactNode
  className?: string
  /** Override the tour that StartTourButton launches on this page.
   *  If omitted, falls back to the default CAB-dashboard tour. */
  tourId?: string
  tourSteps?: TourStepConfig[]
  /** Bump to remount the tour provider after resetting tour state. */
  tourSessionKey?: number
}

function CabShell({ children, className }: { children: React.ReactNode; className?: string }) {
  const { dir } = useDirection()
  return (
    <CabSidebarProvider>
      <div dir={dir} className={cn('flex min-h-screen bg-[#f9fafc]', className)}>
        <CabSidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden">{children}</div>
      </div>
    </CabSidebarProvider>
  )
}

function CabLayoutWithDashboardTour({ children, className }: { children: React.ReactNode; className?: string }) {
  const dashboardTourSteps = useCabDashboardTourSteps()
  return (
    <TourProvider tourId="cab-dashboard" steps={dashboardTourSteps}>
      <CabShell className={className}>{children}</CabShell>
    </TourProvider>
  )
}

export function CabLayout({
  children,
  className,
  tourId,
  tourSteps,
  tourSessionKey = 0,
}: CabLayoutProps) {
  if (tourId && tourSteps) {
    const shell = <CabShell className={className}>{children}</CabShell>
    if (isCabWorkflowTour(tourId)) {
      return (
        <CabTourProvider key={tourSessionKey} tourId={tourId} steps={tourSteps}>
          {shell}
        </CabTourProvider>
      )
    }
    return (
      <TourProvider key={tourSessionKey} tourId={tourId} steps={tourSteps}>
        {shell}
      </TourProvider>
    )
  }

  return (
    <CabLayoutWithDashboardTour className={className}>{children}</CabLayoutWithDashboardTour>
  )
}
