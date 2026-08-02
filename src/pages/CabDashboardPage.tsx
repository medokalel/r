import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabStatCards } from '@/components/dashboard/cab/CabStatCards'
import { getCabDashboardStats, type CabDashboardStats } from '@/lib/api/cabDashboardApi'

export function CabDashboardPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<CabDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getCabDashboardStats().then((data) => {
      if (!cancelled) {
        setStats(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <CabLayout>
      <CabHeader
        title={t('cab.dashboard.title')}
        subtitle={t('cab.dashboard.subtitle')}
        notificationCount={3}
      />

      <div className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <CabStatCards stats={stats} loading={loading} />
        {/* Charts and list widgets are added in the next steps */}
      </div>
    </CabLayout>
  )
}