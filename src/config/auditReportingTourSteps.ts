import { useTranslation } from 'react-i18next'
import type { TourStepConfig } from '@/context/TourContext'

export function useAuditReportingTourSteps(): TourStepConfig[] {
  const { t } = useTranslation()

  return [
    {
      id: 'audit-reporting-header',
      step: 1,
      totalSteps: 5,
      title: t('cab.auditReporting.register.tour.header.title', 'Audit Reporting Workspace'),
      description: t(
        'cab.auditReporting.register.tour.header.description',
        'Manage audit reporting stages, verify client scope, track findings, and finalize the formal audit report.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'audit-reporting-scope',
      step: 2,
      totalSteps: 5,
      title: t('cab.auditReporting.register.tour.summary.title', 'CAB-Client Audit Scope'),
      description: t(
        'cab.auditReporting.register.tour.summary.description',
        'Review the certified entity, standard clauses under assessment, facility location, and active audit stage.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'audit-reporting-tabs',
      step: 3,
      totalSteps: 5,
      title: t('cab.auditReporting.register.tour.filters.title', 'Reporting Sections & Stages'),
      description: t(
        'cab.auditReporting.register.tour.filters.description',
        'Navigate seamlessly across the Agenda timetable, Evidence tasks, Findings register, and Final Report assembly.'
      ),
      side: 'bottom',
      align: 'start',
    },
    {
      id: 'audit-reporting-content',
      step: 4,
      totalSteps: 5,
      title: t('cab.auditReporting.register.tour.register.title', 'Execution & Findings Register'),
      description: t(
        'cab.auditReporting.register.tour.register.description',
        'Log objective evidence, record non-conformity findings, classify clauses, and export audit data.'
      ),
      side: 'top',
      align: 'start',
    },
    {
      id: 'audit-reporting-gates',
      step: 5,
      totalSteps: 5,
      title: t('cab.auditReporting.register.tour.flow.title', 'Report Finalization & Gates'),
      description: t(
        'cab.auditReporting.register.tour.flow.description',
        'Validate all mandatory submission gates, formulate auditor recommendations, and freeze the version for technical review.'
      ),
      side: 'top',
      align: 'end',
    },
  ]
}
