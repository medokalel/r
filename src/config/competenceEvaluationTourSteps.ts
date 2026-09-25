import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/TourContext'

export function useCompetenceEvaluationTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'eval-header',
      step: 1,
      totalSteps: 6,
      title: t('cab.competence.evalTour.header.title', 'Evaluation Overview'),
      description: t(
        'cab.competence.evalTour.header.description',
        'Review and manage the overall competence assessment status for this personnel record.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'eval-actions',
      step: 2,
      totalSteps: 6,
      title: t('cab.competence.evalTour.actions.title', 'Save & Submit Actions'),
      description: t(
        'cab.competence.evalTour.actions.description',
        'Save draft modifications or submit completed evaluations to the technical manager for authorization.'
      ),
      side: 'bottom',
      align: 'end',
    },
    {
      id: 'eval-profile',
      step: 3,
      totalSteps: 6,
      title: t('cab.competence.evalTour.profile.title', 'Personnel Profile Snapshot'),
      description: t(
        'cab.competence.evalTour.profile.description',
        'View key staff credentials including personal code, primary role, email, phone, and active status.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'eval-tabs',
      step: 4,
      totalSteps: 6,
      title: t('cab.competence.evalTour.tabs.title', 'Assessment Sections & Records'),
      description: t(
        'cab.competence.evalTour.tabs.description',
        'Navigate between evaluation details, training courses, audit experience logs, witnessing reports, evidence files, and renewals.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'eval-general-form',
      step: 5,
      totalSteps: 6,
      title: t('cab.competence.evalTour.form.title', 'Competence Criteria & Details'),
      description: t(
        'cab.competence.evalTour.form.description',
        'Record evaluation schemes, sectors, evaluator feedback, highest qualifications, and years of experience.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'eval-quick-records',
      step: 6,
      totalSteps: 6,
      title: t('cab.competence.evalTour.records.title', 'Integrated Audit & Training Logs'),
      description: t(
        'cab.competence.evalTour.records.description',
        'Quickly add or review training completions, witnessed audits, and past client audit histories.'
      ),
      side: 'top',
      align: 'start',
    },
  ]
}
