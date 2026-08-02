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
import { AppLayout } from '@/components/layout/AppLayout'
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
    <AppLayout>
      <AccreditationHeader titleKey="nav.dashboard" />

      <div className="flex flex-1 flex-col gap-5 overflow-auto p-5">
        {loading ? <DashboardStatsSkeleton /> : <DashboardStatCards stats={stats} loading={loading} />}

        <div className="flex flex-col gap-5 lg:flex-row">
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
          {loading ? (
            <DashboardActivitiesSkeleton />
          ) : (
            <DashboardActivities activities={activities} loading={loading} onViewAll={() => undefined} />
          )}
        </div>
      </div>
    </AppLayout>
  )
}