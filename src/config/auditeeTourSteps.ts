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

/**
 * Tour steps for the Certification Requests page. Same hook-per-page
 * pattern as useAuditeeDashboardTourSteps, kept separate since the two
 * pages run independent tours (own tourId, own storage key).
 */
export function useCertificationRequestsTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'requests-header',
      step: 1,
      totalSteps: 3,
      title: t('certificationRequests.tour.header.title'),
      description: t('certificationRequests.tour.header.description'),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'new-request-actions',
      step: 2,
      totalSteps: 3,
      title: t('certificationRequests.tour.actions.title'),
      description: t('certificationRequests.tour.actions.description'),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'requests-list',
      step: 3,
      totalSteps: 3,
      title: t('certificationRequests.tour.requestsList.title'),
      description: t('certificationRequests.tour.requestsList.description'),
      side: 'top',
      align: 'start',
    },
  ]
}

/**
 * Tour steps for the Users page. Same hook-per-page pattern as the other
 * auditee tours, kept separate since it runs its own tourId/storage key.
 */
export function useUsersTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'users-header',
      step: 1,
      totalSteps: 3,
      title: t('users.tour.header.title'),
      description: t('users.tour.header.description'),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'users-stats',
      step: 2,
      totalSteps: 3,
      title: t('users.tour.stats.title'),
      description: t('users.tour.stats.description'),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'users-table',
      step: 3,
      totalSteps: 3,
      title: t('users.tour.table.title'),
      description: t('users.tour.table.description'),
      side: 'top',
      align: 'start',
    },
  ]
}

/**
 * Tour steps for the Digital Wallet page. Same hook-per-page pattern as the
 * other auditee tours, kept separate since it runs its own tourId/storage key.
 */
export function useWalletTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'wallet-header',
      step: 1,
      totalSteps: 3,
      title: t('wallet.tour.header.title'),
      description: t('wallet.tour.header.description'),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'wallet-balance',
      step: 2,
      totalSteps: 3,
      title: t('wallet.tour.balance.title'),
      description: t('wallet.tour.balance.description'),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'wallet-transactions',
      step: 3,
      totalSteps: 3,
      title: t('wallet.tour.transactions.title'),
      description: t('wallet.tour.transactions.description'),
      side: 'top',
      align: 'start',
    },
  ]
}