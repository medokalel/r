import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { DashboardActivities } from '@/components/dashboard/DashboardActivities'
import { DashboardStatCards } from '@/components/dashboard/DashboardStatCards'
import { DashboardTasksTable } from '@/components/dashboard/DashboardTasksTable'
import {
  DashboardActivitiesSkeleton,
  DashboardStatsSkeleton,
  DashboardTasksTableSkeleton,
} from '@/components/dashboard/DashboardLoadingSkeleton'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { AppLayout } from '@/components/layout/AppLayout'
import { useAuditeeDashboardTourSteps } from '@/config/auditeeTourSteps'
import { TourProvider } from '@/context/TourContext'
import {
  getDashboardActivities,
  getDashboardStats,
  getDashboardTasks,
  type DashboardActivity,
  type DashboardStats,
  type DashboardTask,
} from '@/lib/api/dashboardApi'
import { certificationRequestFormPath, ROUTES } from '@/lib/routes'

export function DashboardPage() {
  const navigate = useNavigate()
  const tourSteps = useAuditeeDashboardTourSteps()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [tasks, setTasks] = useState<DashboardTask[]>([])
  const [activities, setActivities] = useState<DashboardActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([getDashboardStats(), getDashboardTasks(), getDashboardActivities()])
      .then(([statsResult, tasksResult, activitiesResult]) => {
        if (cancelled) return
        setStats(statsResult)
        setTasks(tasksResult)
        setActivities(activitiesResult)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <TourProvider tourId="auditee-dashboard" steps={tourSteps}>
      <AppLayout>
        <DashboardTourStep steps={tourSteps} stepId="dashboard-header">
          <AccreditationHeader titleKey="nav.dashboard" />
        </DashboardTourStep>

        <div className="@container flex flex-1 flex-col gap-5 overflow-auto p-[16px]">
          <DashboardTourStep steps={tourSteps} stepId="key-metrics">
            {loading ? <DashboardStatsSkeleton /> : <DashboardStatCards stats={stats} loading={loading} />}
          </DashboardTourStep>

          <div className="flex flex-col gap-5 @7xl:flex-row">
            <DashboardTourStep steps={tourSteps} stepId="pending-tasks" className="flex-1">
              {loading ? (
                <DashboardTasksTableSkeleton />
              ) : (
                <DashboardTasksTable
                  tasks={tasks}
                  loading={loading}
                  onViewAll={() => navigate(ROUTES.dashboardTasks)}
                  onProcedureClick={(task) => {
                    // Document-review tasks map to the application feedback view;
                    // other task types don't have a dedicated page yet.
                    if (task.taskType === 'documentReview') {
                      navigate(certificationRequestFormPath(task.id, 'feedback'))
                    }
                  }}
                />
              )}
            </DashboardTourStep>

            <DashboardTourStep
              steps={tourSteps}
              stepId="recent-activity"
              className="w-full @7xl:max-w-[400px]"
            >
              {loading ? (
                <DashboardActivitiesSkeleton />
              ) : (
                <DashboardActivities activities={activities} loading={loading} onViewAll={() => undefined} />
              )}
            </DashboardTourStep>
          </div>
        </div>
      </AppLayout>
    </TourProvider>
  )
}