import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/TourContext'

export function useClientRegistrationTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'sidebar-clients-new',
      step: 1,
      totalSteps: 8,
      title: t('cab.tour.sidebarClientsNew.title', 'New Client Registration Icon'),
      description: t(
        'cab.tour.sidebarClientsNew.description',
        'Directly access the new client registration form to add an organization.'
      ),
      side: 'right',
      align: 'start',
    },
    {
      id: 'header',
      step: 2,
      totalSteps: 8,
      title: t('cab.clientRegistration.tour.header.title', 'Client Registration'),
      description: t(
        'cab.clientRegistration.tour.header.description',
        'Fill out this form to register a new client organisation under your CAB.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'client-information',
      step: 3,
      totalSteps: 8,
      title: t('cab.clientRegistration.tour.clientInformation.title', 'Client Information'),
      description: t(
        'cab.clientRegistration.tour.clientInformation.description',
        'Enter the legal entity name, trading name, organisation type, and registration details.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'registered-address',
      step: 4,
      totalSteps: 8,
      title: t('cab.clientRegistration.tour.registeredAddress.title', 'Registered Address'),
      description: t(
        'cab.clientRegistration.tour.registeredAddress.description',
        'Provide the official address including country, state, city, and postal code.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'primary-contact',
      step: 5,
      totalSteps: 8,
      title: t('cab.clientRegistration.tour.primaryContact.title', 'Primary Contact Person'),
      description: t(
        'cab.clientRegistration.tour.primaryContact.description',
        "Specify the contact person's full name, designation, email address, and phone numbers."
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'additional-information',
      step: 6,
      totalSteps: 8,
      title: t('cab.clientRegistration.tour.additionalInformation.title', 'Additional Details & Attachments'),
      description: t(
        'cab.clientRegistration.tour.additionalInformation.description',
        'Select industry and turnover, describe client activities, and upload supporting documents.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'workflow-progress',
      step: 7,
      totalSteps: 8,
      title: t('cab.clientRegistration.tour.workflowProgress.title', 'Workflow Progress'),
      description: t(
        'cab.clientRegistration.tour.workflowProgress.description',
        'Track where this registration sits in the overall certification pipeline.'
      ),
      side: 'left',
      align: 'start',
    },
    {
      id: 'action-buttons',
      step: 8,
      totalSteps: 8,
      title: t('cab.clientRegistration.tour.actionButtons.title', 'Save & Continue'),
      description: t(
        'cab.clientRegistration.tour.actionButtons.description',
        'Save your progress as a draft or proceed to the next step once all required fields are complete.'
      ),
      side: 'top',
      align: 'end',
    },
  ]
}
