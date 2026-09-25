import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import type { TourStepConfig } from '@/context/TourContext'
import { cn } from '@/lib/utils'

interface PortalLayoutProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
  tourId?: string
  tourSteps?: TourStepConfig[]
  notificationCount?: number
}

export function PortalLayout({
  children,
  className,
  title,
  subtitle,
  tourId,
  tourSteps,
  notificationCount = 3,
}: PortalLayoutProps) {
  const { t } = useTranslation()
  return (
    <CabLayout className={className} tourId={tourId} tourSteps={tourSteps}>
      <CabHeader
        title={title ?? t('portal.title', 'Client Portal')}
        subtitle={subtitle}
        notificationCount={notificationCount}
      />
      <main className={cn('flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto p-4 sm:p-6')}>
        {children}
      </main>
    </CabLayout>
  )
}
