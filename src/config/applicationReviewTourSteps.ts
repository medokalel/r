import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/TourContext'

export function useApplicationReviewTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'sidebar-app-review',
      step: 1,
      totalSteps: 7,
      title: t('cab.tour.sidebarAppReview.title', 'Application Review Icon'),
      description: t(
        'cab.tour.sidebarAppReview.description',
        'Directly access application documents, review data, and make certification decisions.'
      ),
      side: 'right',
      align: 'start',
    },
    {
      id: 'header',
      step: 2,
      totalSteps: 7,
      title: t('cab.applications.review.tour.header.title', 'Header & Control Bar'),
      description: t(
        'cab.applications.review.tour.header.description',
        'Displays breadcrumb navigation, tour controls, notifications, and reviewer profile.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'page-header',
      step: 3,
      totalSteps: 7,
      title: t('cab.applications.review.tour.pageHeader.title', 'Review Title & Actions'),
      description: t(
        'cab.applications.review.tour.pageHeader.description',
        'Review status, download application, and send for technical feasibility assessment.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'summary-card',
      step: 4,
      totalSteps: 7,
      title: t('cab.applications.review.tour.summaryCard.title', 'Application Summary'),
      description: t(
        'cab.applications.review.tour.summaryCard.description',
        'Overview of client, application type, certification body, and assigned reviewer.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'tabs',
      step: 5,
      totalSteps: 7,
      title: t('cab.applications.review.tour.tabs.title', 'Review Sections & Tabs'),
      description: t(
        'cab.applications.review.tour.tabs.description',
        'Switch between Checklist, Application Details, Documents, Comments, and History.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'checklist-table',
      step: 6,
      totalSteps: 7,
      title: t('cab.applications.review.tour.checklistTable.title', 'Review Checklist'),
      description: t(
        'cab.applications.review.tour.checklistTable.description',
        "Inspect each area's completion status, add comments, and set overall decision."
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'workflow-progress',
      step: 7,
      totalSteps: 7,
      title: t('cab.applications.review.tour.workflowProgress.title', 'Workflow Progress'),
      description: t(
        'cab.applications.review.tour.workflowProgress.description',
        'Track stages from Application Receipt through Feasibility, Quotation, and Decision.'
      ),
      side: 'left',
      align: 'start',
    },
  ]
}
