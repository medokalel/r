import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { DashboardActivityTimeline } from '@/components/dashboard/DashboardActivities'
import { AppIcon, CorrespondenceSentIcon } from '@/components/icons'
import { AppLayout } from '@/components/layout/AppLayout'
import { getDashboardActivities } from '@/lib/api/dashboardApi'
import type { DashboardActivity } from '@/lib/api/dashboardApi'
import { ROUTES } from '@/lib/routes'

export function DashboardActivitiesPage() {
  const { t } = useTranslation()
  const [activities, setActivities] = useState<DashboardActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getDashboardActivities()
      .then((result) => {
        if (!cancelled) setActivities(result)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AppLayout>
      <AccreditationHeader titleKey="clientActivities.pageTitle" />
      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 sm:p-5">
        <Link to={ROUTES.dashboard} className="self-start text-[14px] font-medium text-primary hover:underline">
          {t('clientActivities.backToDashboard')}
        </Link>

        <div className="flex w-full flex-col rounded-[16px] border border-[#ececec] bg-white">
          <div className="flex items-center gap-2 rounded-t-[16px] border-b border-[#ececec] bg-[#f3f6fd] p-[25px]">
            <AppIcon icon={CorrespondenceSentIcon} size={32} className="text-primary" />
            <h2 className="text-[22px] font-semibold text-neutral-900">{t('clientActivities.pageTitle')}</h2>
          </div>
          <div className="flex flex-col p-[24px]">
            <DashboardActivityTimeline activities={activities} loading={loading} />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
