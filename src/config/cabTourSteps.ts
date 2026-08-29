import type { TourStepConfig } from '@/context/TourContext'
export const CAB_DASHBOARD_TOUR_STEPS: TourStepConfig[] = [
  {
    id: 'sidebar-navigation',
    step: 1,
    totalSteps: 7,
    title: 'Your Navigation',
    description:
      'Use the sidebar to move between sections like Dashboard, Client Registration, Applications, Audits, and more.',
    side: 'right',
    align: 'start',
  },
  {
    id: 'dashboard-header',
    step: 2,
    totalSteps: 7,
    title: 'Dashboard Overview',
    description:
      'This is your central hub for tracking certification activities and workload at a glance.',
    side: 'bottom',
    align: 'start',
  },
  {
    id: 'key-metrics',
    step: 3,
    totalSteps: 7,
    title: 'Key Metrics',
    description:
      'Track your most important numbers new applications, pending reviews, upcoming audits, outstanding payments, and more.',
    side: 'bottom',
    align: 'start',
    alignOffset: 290,
  },
  {
    id: 'visual-analytics',
    step: 4,
    totalSteps: 7,
    title: 'Visual Analytics',
    description:
      'See applications by stage, audit progress, and certification decisions displayed as interactive charts.',
    side: 'bottom',
    align: 'start',
    alignOffset: 290,
  },
  {
    id: 'work-queue',
    step: 5,
    totalSteps: 7,
    title: 'Your Work Queue',
    description:
      'View and manage your pending tasks technical reviews, information requests, and approvals that need your attention.',
    side: 'right',
    align: 'start',
  },
  {
    id: 'recent-activity',
    step: 6,
    totalSteps: 7,
    title: 'Recent Activity',
    description:
      'Stay up to date with the latest actions certificates issued, audits completed, and reviews assigned.',
    side: 'right',
    align: 'start',
  },
  {
    id: 'quick-actions',
    step: 7,
    totalSteps: 7,
    title: 'Quick Actions',
    description:
      'Start common tasks instantly create a new application, assign a review, or issue a certificate with one click.',
    side: 'top',
    align: 'start',
  },
]