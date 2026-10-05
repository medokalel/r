import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/TourContext'

export function useCabCompanyProfileTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'cab-company-profile-header',
      step: 1,
      totalSteps: 5,
      title: t('cab.companyProfile.tour.header.title', 'CAB Company Profile Overview'),
      description: t(
        'cab.companyProfile.tour.header.description',
        'View and manage your certification body’s registered identity, locations, accreditations, and issuance settings.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'cab-company-profile-account',
      step: 2,
      totalSteps: 5,
      title: t('cab.companyProfile.tour.account.title', 'Account & Contact Info'),
      description: t(
        'cab.companyProfile.tour.account.description',
        'Inspect your verified registered account email and primary contact telephone number.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'cab-company-profile-identity',
      step: 3,
      totalSteps: 5,
      title: t('cab.companyProfile.tour.identity.title', 'Identity & Locations Setup'),
      description: t(
        'cab.companyProfile.tour.identity.description',
        'Manage legal CAB name, brand trade name, activities, licensing details, headquarters, and branch offices.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'cab-company-profile-accreditation',
      step: 4,
      totalSteps: 5,
      title: t('cab.companyProfile.tour.accreditation.title', 'Accreditation & Scheme Scopes'),
      description: t(
        'cab.companyProfile.tour.accreditation.description',
        'Maintain accreditation body records, certificate validity dates, normative standards, authorized scopes, and branding symbols.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'cab-company-profile-actions',
      step: 5,
      totalSteps: 5,
      title: t('cab.companyProfile.tour.actions.title', 'Save & Update Profile'),
      description: t(
        'cab.companyProfile.tour.actions.description',
        'Save all changes and synchronize your updated CAB configuration across your entire workspace.'
      ),
      side: 'top',
      align: 'end',
    },
  ]
}
