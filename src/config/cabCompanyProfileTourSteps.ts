import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/TourContext'

export function useCabCompanyProfileTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'cab-company-profile-header',
      step: 1,
      totalSteps: 4,
      title: t('cab.companyProfile.tour.header.title', 'CAB Company Profile Overview'),
      description: t(
        'cab.companyProfile.tour.header.description',
        'Your certification body’s identity, accreditation and certificate settings, one page at a time.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'cab-company-profile-steps',
      step: 2,
      totalSteps: 4,
      title: t('cab.companyProfile.tour.steps.title', 'The pages'),
      description: t(
        'cab.companyProfile.tour.steps.description',
        'Nine short pages in a logical order. Jump to any page; a tick shows the pages you have completed.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'cab-company-profile-body',
      step: 3,
      totalSteps: 4,
      title: t('cab.companyProfile.tour.body.title', 'Current page'),
      description: t(
        'cab.companyProfile.tour.body.description',
        'Fill or update this page only. Everything else waits on its own page.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'cab-company-profile-actions',
      step: 4,
      totalSteps: 4,
      title: t('cab.companyProfile.tour.actions.title', 'Next saves as you go'),
      description: t(
        'cab.companyProfile.tour.actions.description',
        'Next saves this page and opens the next one. On the last page, finish to save the whole profile.'
      ),
      side: 'top',
      align: 'end',
    },
  ]
}
