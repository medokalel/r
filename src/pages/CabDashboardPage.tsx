import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'

export function CabDashboardPage() {
  const { t } = useTranslation()

  return (
    <CabLayout>
      <CabHeader
        title={t('cab.dashboard.title')}
        subtitle={t('cab.dashboard.subtitle')}
        notificationCount={3}
      />

      <div className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        {/* Stat cards, charts, and list widgets are added in the next steps */}
      </div>
    </CabLayout>
  )
}
