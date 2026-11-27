import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useParams } from 'react-router-dom'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { AppIcon, DocumentFileIcon } from '@/components/icons'
import { AppLayout } from '@/components/layout/AppLayout'
import {
  StageReportDocument,
  STAGE_REPORT_PRINT_CSS,
} from '@/components/cab/stageReport/StageReportDocument'
import type { AuditPlan } from '@/lib/api/cabAuditPlanningApi'
import { acknowledgeClientAuditReport, getClientAuditReport } from '@/lib/api/clientAuditsApi'
import { clientAuditPlanPath, ROUTES } from '@/lib/routes'
import { toast } from '@/lib/toast'

const FIELD =
  'w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900 focus:border-primary focus:outline-none'

function formatDateTime(value: string, language: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(language, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/** The audit client reads the issued stage report and acknowledges it. */
export function ClientAuditReportPage() {
  const { t, i18n } = useTranslation()
  const { planId } = useParams<{ planId: string }>()
  const location = useLocation()
  const [plan, setPlan] = useState<AuditPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [nameError, setNameError] = useState(false)

  useEffect(() => {
    let cancelled = false
    getClientAuditReport(planId ?? '')
      .then((result) => {
        if (!cancelled) setPlan(result)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [planId])

  useEffect(() => {
    if (plan && location.hash === '#acknowledge') {
      document.getElementById('acknowledge')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [plan, location.hash])

  const report = plan?.stageReport
  const snapshot = report?.snapshot
  const acknowledgement = report?.acknowledgement

  const handleAcknowledge = async () => {
    if (!plan) return
    if (!name.trim()) {
      setNameError(true)
      return
    }
    setSaving(true)
    try {
      const result = await acknowledgeClientAuditReport(plan.planNumber, { name, note })
      if (result.ok) {
        setPlan(result.plan)
        toast.success(t('clientAuditResults.report.acknowledgedToast'))
      } else if (result.error === 'alreadyAcknowledged') {
        const fresh = await getClientAuditReport(plan.planNumber)
        if (fresh) setPlan(fresh)
      } else {
        toast.error(t('clientAuditResults.report.acknowledgeFailed'))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <style>{STAGE_REPORT_PRINT_CSS}</style>
      <div className="print:hidden">
        <AccreditationHeader titleKey="clientAuditResults.report.pageTitle" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 sm:p-5">
        <Link
          to={plan ? clientAuditPlanPath(plan.planNumber) : ROUTES.audits}
          className="self-start text-[14px] font-medium text-primary hover:underline print:hidden"
        >
          {t('clientAuditResults.report.backToAudit')}
        </Link>

        {loading ? (
          <div className="h-[200px] animate-pulse rounded-[16px] border border-[#ececec] bg-white" />
        ) : !plan || !report || !snapshot ? (
          <div
            className="flex flex-col items-center gap-2 rounded-[16px] border border-dashed border-[#d7dce5] bg-white px-6 py-16 text-center"
            data-testid="report-unavailable"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-[#eef2fd] text-primary">
              <AppIcon icon={DocumentFileIcon} size={26} />
            </span>
            <p className="text-[16px] font-semibold text-neutral-900">
              {t('clientAuditResults.report.unavailableTitle')}
            </p>
            <p className="max-w-md text-[13px] text-neutral-500">
              {t('clientAuditResults.report.unavailableSubtitle')}
            </p>
          </div>
        ) : (
          <>
            <section
              id="acknowledge"
              className="flex flex-col gap-4 rounded-[16px] border border-[#ececec] bg-white p-5 print:hidden"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-[16px] font-semibold text-neutral-900">
                    {t('clientAuditResults.report.acknowledgeTitle')}
                  </h2>
                  <p className="mt-0.5 text-[13px] text-neutral-500">
                    <bdi dir="ltr">{snapshot.planNumber}</bdi> · <bdi dir="ltr">v{report.version}</bdi>
                  </p>
                </div>
                <button
                  type="button"
                  data-testid="client-print-report"
                  onClick={() => window.print()}
                  className="h-10 rounded-[8px] border border-[#d7dce5] bg-white px-5 text-[13px] font-semibold text-neutral-800 transition-colors hover:bg-neutral-50"
                >
                  {t('clientAuditResults.report.print')}
                </button>
              </div>

              {acknowledgement ? (
                <div
                  className="rounded-[12px] border border-[#bbe5c8] bg-[#e7f6ec] px-4 py-3 text-[13px] text-[#1e7e34]"
                  data-testid="acknowledged-notice"
                >
                  <p className="font-semibold">
                    {t('clientAuditResults.report.acknowledgedBy', {
                      name: acknowledgement.by,
                      date: formatDateTime(acknowledgement.at, i18n.language),
                    })}
                  </p>
                  {acknowledgement.note && (
                    <p dir="auto" className="mt-1 text-start font-normal">
                      {acknowledgement.note}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3" data-testid="acknowledge-form">
                  <p className="text-[13px] text-neutral-600">
                    {t('clientAuditResults.report.acknowledgeHint')}
                  </p>
                  <div>
                    <label htmlFor="ack-name" className="mb-1 block text-[13px] font-medium text-neutral-800">
                      {t('clientAuditResults.report.yourName')}
                    </label>
                    <input
                      id="ack-name"
                      dir="auto"
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value)
                        setNameError(false)
                      }}
                      aria-invalid={nameError}
                      className={`${FIELD} h-10 sm:max-w-sm`}
                    />
                    {nameError && (
                      <p className="mt-1 text-[12px] text-[#b91c1c]" role="alert">
                        {t('clientAuditResults.report.nameRequired')}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="ack-note" className="mb-1 block text-[13px] font-medium text-neutral-800">
                      {t('clientAuditResults.report.note')}
                    </label>
                    <textarea
                      id="ack-note"
                      dir="auto"
                      rows={3}
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      className={`${FIELD} p-3`}
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      data-testid="acknowledge-report"
                      disabled={saving}
                      onClick={() => void handleAcknowledge()}
                      className="h-10 rounded-[8px] bg-primary px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#0f2d8a] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {t('clientAuditResults.report.acknowledge')}
                    </button>
                  </div>
                </div>
              )}
            </section>

            <div className="print:hidden">
              <StageReportDocument
                data={snapshot}
                version={report.version}
                statusLabel={t(`stageReport.status.${report.status}`) as string}
                reviewer={report.reviewer}
                issuedAt={report.issuedAt}
              />
            </div>
            {typeof document !== 'undefined' &&
              createPortal(
                <div id="stage-report-print-root" className="hidden">
                  <StageReportDocument
                    data={snapshot}
                    version={report.version}
                    statusLabel={t(`stageReport.status.${report.status}`) as string}
                    reviewer={report.reviewer}
                    issuedAt={report.issuedAt}
                  />
                </div>,
                document.body,
              )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
