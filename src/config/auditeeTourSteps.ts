import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/TourContext'

/**
 * Tour steps for the general Auditee dashboard, translated live via i18n
 * (unlike CAB_DASHBOARD_TOUR_STEPS, which is still English-only) — a hook
 * instead of a plain constant so the copy re-translates on language switch.
 */
export function useAuditeeDashboardTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'dashboard-header',
      step: 1,
      totalSteps: 4,
      title: t('dashboard.tour.dashboardHeader.title'),
      description: t('dashboard.tour.dashboardHeader.description'),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'key-metrics',
      step: 2,
      totalSteps: 4,
      title: t('dashboard.tour.keyMetrics.title'),
      description: t('dashboard.tour.keyMetrics.description'),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'pending-tasks',
      step: 3,
      totalSteps: 4,
      title: t('dashboard.tour.pendingTasks.title'),
      description: t('dashboard.tour.pendingTasks.description'),
      side: 'top',
      align: 'start',
    },
    {
      id: 'recent-activity',
      step: 4,
      totalSteps: 4,
      title: t('dashboard.tour.recentActivity.title'),
      description: t('dashboard.tour.recentActivity.description'),
      side: 'top',
      align: 'end',
    },
  ]
}