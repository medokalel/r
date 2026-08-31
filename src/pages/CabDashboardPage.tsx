import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { PageHeaderWithAction } from '@/components/dashboard/PageHeaderWithAction'
import { CabStatCards } from '@/components/dashboard/cab/CabStatCards'
import { CabDonutCard } from '@/components/dashboard/cab/CabDonutCard'
import { CabAuditsOverviewChart } from '@/components/dashboard/cab/CabAuditsOverviewChart'
import { AuditCalendarModal } from '@/components/dashboard/cab/AuditCalendarModal'
import { ApplicationsByStageModal } from '@/components/dashboard/cab/ApplicationsByStageModal'
import { CabWorkQueue } from '@/components/dashboard/cab/CabWorkQueue'
import { CabRecentActivity } from '@/components/dashboard/cab/CabRecentActivity'
import { CabQuickActions } from '@/components/dashboard/cab/CabQuickActions'
import { AppIcon, CalendarIcon } from '@/components/icons'
import {
  getApplicationsByStage,
  getAuditsOverview,
  getCabDashboardStats,
  getCabRecentActivity,
  getCertificationDecisions,
  getWorkQueue,
  type ApplicationsByStageEntry,
  type AuditsOverviewEntry,
  type CabActivityItem,
  type CabDashboardStats,
  type CertificationDecisionEntry,
  type WorkQueueItem,
} from '@/lib/api/cabDashboardApi'

import { CabDashboardTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'

export function CabDashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [stats, setStats] = useState<CabDashboardStats | null>(null)
  const [applicationsByStage, setApplicationsByStage] = useState<ApplicationsByStageEntry[]>([])
  const [auditsOverview, setAuditsOverview] = useState<AuditsOverviewEntry[]>([])
  const [certificationDecisions, setCertificationDecisions] = useState<CertificationDecisionEntry[]>([])
  const [workQueue, setWorkQueue] = useState<WorkQueueItem[]>([])
  const [activities, setActivities] = useState<CabActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuditCalendarOpen, setIsAuditCalendarOpen] = useState(false)
  const [isApplicationsByStageOpen, setIsApplicationsByStageOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      getCabDashboardStats(),
      getApplicationsByStage(),
      getAuditsOverview(),
      getCertificationDecisions(),
      getWorkQueue(),
      getCabRecentActivity(),
    ]).then(([statsData, stageData, auditsData, decisionsData, workQueueData, activityData]) => {
      if (cancelled) return
      setStats(statsData)
      setApplicationsByStage(stageData)
      setAuditsOverview(auditsData)
      setCertificationDecisions(decisionsData)
      setWorkQueue(workQueueData)
      setActivities(activityData)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <CabLayout>
      <CabDashboardTourStep stepId="dashboard-header">
        <CabHeader
          title={t('cab.dashboard.title')}
          subtitle={t('cab.dashboard.subtitle')}
          notificationCount={3}
        />
      </CabDashboardTourStep>

      <div className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <CabDashboardTourStep stepId="key-metrics">
          <div className="flex flex-col gap-5">
            <PageHeaderWithAction
              title={t('cab.dashboard.title')}
              subtitle={t('cab.dashboard.subtitle')}
              action={{
                icon: <AppIcon icon={CalendarIcon} size={20} />,
                label: t('cab.dashboard.auditCalendar.title'),
                onClick: () => setIsAuditCalendarOpen(true),
              }}
            />
            <CabStatCards stats={stats} loading={loading} />
          </div>
        </CabDashboardTourStep>

        <CabDashboardTourStep stepId="visual-analytics">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <CabDonutCard
              title={t('cab.dashboard.applicationsByStage.title')}
              entries={applicationsByStage.map((e) => ({ key: e.stageKey, count: e.count, color: e.color }))}
              labelPrefix="cab.dashboard.applicationsByStage.stages"
              totalLabel={t('cab.dashboard.total')}
              footerLink={{
                label: t('cab.dashboard.applicationsByStage.viewFullPipeline'),
                onClick: () => setIsApplicationsByStageOpen(true),
              }}
            />

            <CabAuditsOverviewChart
              entries={auditsOverview}
              footerLink={{
                label: t('cab.dashboard.auditsOverview.viewAuditCalendar'),
                onClick: () => setIsAuditCalendarOpen(true),
              }}
            />

            <CabDonutCard
              title={t('cab.dashboard.certificationDecisions.title')}
              entries={certificationDecisions.map((e) => ({ key: e.decisionKey, count: e.count, color: e.color }))}
              labelPrefix="cab.dashboard.certificationDecisions.decisions"
              totalLabel={t('cab.dashboard.total')}
              footerLink={{ label: t('cab.dashboard.certificationDecisions.viewDecisions'), onClick: () => undefined }}
            />
          </div>
        </CabDashboardTourStep>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <CabDashboardTourStep stepId="work-queue">
            <CabWorkQueue items={workQueue} onViewAll={() => undefined} />
          </CabDashboardTourStep>

          <CabDashboardTourStep stepId="recent-activity">
            <CabRecentActivity activities={activities} onViewAll={() => undefined} />
          </CabDashboardTourStep>

          <CabDashboardTourStep stepId="quick-actions">
            <CabQuickActions
              onNewApplication={() => navigate('/cab/clients/new')}
              onAssignReview={() => navigate('/cab/applications/review')}
              onIssueCertificate={() => undefined}
            />
          </CabDashboardTourStep>
        </div>
      </div>
      <AuditCalendarModal open={isAuditCalendarOpen} onOpenChange={setIsAuditCalendarOpen} />
      <ApplicationsByStageModal
        open={isApplicationsByStageOpen}
        onOpenChange={setIsApplicationsByStageOpen}
        entries={applicationsByStage}
      />
    </CabLayout>
  )
}