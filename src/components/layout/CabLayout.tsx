import { cn } from '@/lib/utils'
import { useDirection } from '@/context/DirectionContext'
import { CabSidebar } from '@/components/dashboard/cab/CabSidebar'
import { TourProvider, type TourStepConfig } from '@/context/TourContext'
import { useCabDashboardTourSteps } from '@/config/cabTourSteps'

import type { CabSidebarVariant } from '@/components/dashboard/cab/CabSidebar'

interface CabLayoutProps {
  children: React.ReactNode
  className?: string
  sidebarVariant?: CabSidebarVariant
  /** Override the tour that StartTourButton launches on this page.
   *  If omitted, falls back to the default CAB-dashboard tour. */
  tourId?: string
  tourSteps?: TourStepConfig[]
  /** Fired when the user finishes this page's tour (used to chain the next CAB tour). */
  onTourComplete?: () => void
  /** Bump to remount the tour provider after resetting tour state. */
  tourSessionKey?: number
}

function CabShell({
  children,
  className,
  sidebarVariant,
}: {
  children: React.ReactNode
  className?: string
  sidebarVariant?: CabSidebarVariant
}) {
  const { dir } = useDirection()
  return (
    <div dir={dir} className={cn('flex min-h-screen bg-[#f9fafc]', className)}>
      <CabSidebar variant={sidebarVariant} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden">{children}</div>
    </div>
  )
}

function CabLayoutWithDashboardTour({
  children,
  className,
  sidebarVariant,
  onTourComplete,
  tourSessionKey = 0,
}: {
  children: React.ReactNode
  className?: string
  sidebarVariant?: CabSidebarVariant
  onTourComplete?: () => void
  tourSessionKey?: number
}) {
  const dashboardTourSteps = useCabDashboardTourSteps()
  return (
    <TourProvider
      key={tourSessionKey}
      tourId="cab-dashboard"
      steps={dashboardTourSteps}
      onComplete={onTourComplete}
    >
      <CabShell className={className} sidebarVariant={sidebarVariant}>
        {children}
      </CabShell>
    </TourProvider>
  )
}

export function CabLayout({
  children,
  className,
  sidebarVariant,
  tourId,
  tourSteps,
  onTourComplete,
  tourSessionKey = 0,
}: CabLayoutProps) {
  if (tourId && tourSteps) {
    return (
      <TourProvider
        key={tourSessionKey}
        tourId={tourId}
        steps={tourSteps}
        onComplete={onTourComplete}
      >
        <CabShell className={className} sidebarVariant={sidebarVariant}>
          {children}
        </CabShell>
      </TourProvider>
    )
  }

  return (
    <CabLayoutWithDashboardTour
      className={className}
      sidebarVariant={sidebarVariant}
      onTourComplete={onTourComplete}
      tourSessionKey={tourSessionKey}
    >
      {children}
    </CabLayoutWithDashboardTour>
  )
}

