import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { Button } from '@/components/ui/Button'
import {
  AuditStatusBadge,
  BreadcrumbChevron,
  formatIcascoDate,
} from '@/components/cab/auditPlanning/shared'
import { fetchAuditPlans, type AuditPlan } from '@/lib/api/cabAuditPlanningApi'
import { ROUTES, cabAuditExecutionPath } from '@/lib/routes'

export function CabAuditExecutionListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [plans, setPlans] = useState<AuditPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAuditPlans()
      .then(setPlans)
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <CabLayout sidebarVariant="auditPlanning">
      <CabHeader
        title={t('cab.auditExecution.title', 'Audit execution')}
        subtitle={t('cab.auditExecution.subtitle', 'Choose an audit to start or continue.')}
        notificationCount={8}
      />

      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]" aria-label="breadcrumb">
          <Link to={ROUTES.workspace} className="font-light text-neutral-400 hover:text-primary">
            {t('cab.workspace.appHub', 'Application Hub')}
          </Link>
          <BreadcrumbChevron />
          <span className="font-medium text-neutral-700">
            {t('cab.auditExecution.title', 'Audit execution')}
          </span>
        </nav>

        <div>
          <h1 className="text-[28px] font-bold leading-tight text-neutral-900">
            {t('cab.auditExecution.title', 'Audit execution')}
          </h1>
          <p className="mt-1 text-[14px] text-neutral-500">
            {t('cab.auditExecution.subtitle', 'Choose an audit to start or continue.')}
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-[16px] border border-[#ececec] bg-white p-8 text-center text-[14px] text-neutral-400">
            {t('common.loading', 'Loading audits...')}
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-[#e2e2e2] bg-white p-10 text-center">
            <p className="text-[15px] font-semibold text-neutral-700">No audits available</p>
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate(ROUTES.cabAuditPlanning)}
              className="mt-4"
            >
              Go to Audit Planning
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map((plan) => {
              const isCompleted = plan.status === 'Completed'
              return (
                <div
                  key={plan.id}
                  onClick={() => navigate(cabAuditExecutionPath(plan.planNumber))}
                  className="flex cursor-pointer flex-col justify-between gap-4 rounded-[16px] border border-[#ececec] bg-white px-5 py-4 transition-all hover:border-primary hover:shadow-[0_4px_16px_rgba(18,54,163,0.06)] sm:flex-row sm:items-center"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-[16px] font-bold text-primary">{plan.planNumber}</span>
                      <AuditStatusBadge status={plan.status} />
                    </div>

                    <p className="text-[15px] font-semibold text-neutral-900">{plan.clientName}</p>

                    <div className="flex flex-wrap items-center gap-2 text-[13px] text-neutral-500">
                      <span className="font-medium text-neutral-700">{plan.stage}</span>
                      <span>·</span>
                      <span dir="ltr">
                        {formatIcascoDate(plan.proposedStartDate)} →{' '}
                        {formatIcascoDate(plan.proposedEndDate)}
                      </span>
                      <span>·</span>
                      <span>{plan.standardName}</span>
                      <div className="flex flex-wrap gap-1">
                        {plan.standards.map((std) => (
                          <span
                            key={std}
                            className="rounded-[4px] bg-[#e8edfc] px-2 py-0.5 text-[11px] font-medium text-primary"
                          >
                            {std}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(cabAuditExecutionPath(plan.planNumber))
                    }}
                    className="shrink-0 text-start text-[13px] font-semibold text-primary hover:underline sm:text-end"
                  >
                    {isCompleted ? 'View execution' : 'Start / continue execution'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </CabLayout>
  )
}
