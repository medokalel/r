import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useAuditReportingTourSteps } from '@/config/auditReportingTourSteps'
import { SearchIcon, AppIcon } from '@/components/icons'
import { fetchAuditPlans } from '@/lib/api/cabAuditPlanningApi'
import { listFindingRecords } from '@/lib/api/cabAuditReportingApi'
import {
  AUDIT_REPORTING_STATUSES,
  buildReportingRows,
  filterReportingRows,
  getReportAction,
  type AuditReportingRow,
  type AuditReportingStatus,
} from '@/lib/api/auditReportingWorkspace'
import { ROUTES, cabAuditExecutionPath, cabAuditReportingPath, cabStageReportPath } from '@/lib/routes'
import { CARD, GHOST_BTN, INPUT, PRIMARY_BTN } from '@/components/cab/auditReporting/shared'
import { cn } from '@/lib/utils'

export const REPORTING_STATUS_STYLE: Record<AuditReportingStatus, string> = {
  handoffPending: 'bg-[#f3f4f6] text-neutral-600',
  readyToCreate: 'bg-[#e8edfc] text-[#1236a3]',
  draft: 'bg-[#fff7ed] text-[#ea580c]',
  returned: 'bg-[#fef2f2] text-[#dc2626]',
  inReview: 'bg-[#f3e8ff] text-[#7e22ce]',
  approved: 'bg-[#e8edfc] text-[#1236a3]',
  issued: 'bg-[#ecfdf5] text-[#16a34a]',
}

export function useReportingStatusLabel() {
  const { t } = useTranslation()
  return (status: AuditReportingStatus) =>
    status === 'handoffPending' || status === 'readyToCreate'
      ? (t(`cab.auditReporting.register.status.${status}`) as string)
      : (t(`stageReport.status.${status}`) as string)
}

export function ReportingStatusBadge({ status }: { status: AuditReportingStatus }) {
  const label = useReportingStatusLabel()
  return (
    <span
      data-testid="reporting-status"
      className={cn('inline-flex rounded-[4px] px-3 py-1 text-[12px] font-medium whitespace-nowrap', REPORTING_STATUS_STYLE[status])}
    >
      {label(status)}
    </span>
  )
}

export function formatReportingDate(iso?: string) {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleDateString(i18n.language?.startsWith('ar') ? 'ar-EG-u-nu-latn' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

/** Where the primary action of a register row goes. */
export function reportActionTarget(row: Pick<AuditReportingRow, 'status' | 'planNumber'>): string {
  return getReportAction(row.status) === 'openExecution'
    ? cabAuditExecutionPath(row.planNumber)
    : cabStageReportPath(row.planNumber)
}

function CabAuditReportingContent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tourSteps = useAuditReportingTourSteps()
  const [rows, setRows] = useState<AuditReportingRow[] | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<AuditReportingStatus | 'all'>('all')

  useEffect(() => {
    let active = true
    void fetchAuditPlans().then((plans) => {
      if (active) setRows(buildReportingRows(plans, listFindingRecords()))
    })
    return () => {
      active = false
    }
  }, [])

  const visible = useMemo(() => filterReportingRows(rows ?? [], { search, status }), [rows, search, status])
  const count = (...s: AuditReportingStatus[]) => (rows ?? []).filter((r) => s.includes(r.status)).length
  const actionLabel = (row: AuditReportingRow) => t(`cab.auditReporting.register.action.${getReportAction(row.status)}`) as string

  const summary = [
    { id: 'audits', value: rows?.length ?? 0 },
    { id: 'inProgress', value: count('handoffPending', 'readyToCreate', 'draft', 'returned') },
    { id: 'awaiting', value: count('inReview', 'approved') },
    { id: 'issued', value: count('issued') },
  ]

  return (
    <>
      <CabTourStep steps={tourSteps} stepId="audit-reporting-header">
        <CabHeader
          title={t('cab.auditReporting.title')}
          subtitle={t('cab.auditReporting.register.subtitle')}
          notificationCount={3}
        />
      </CabTourStep>
      <main className="flex flex-1 flex-col gap-5 overflow-auto p-3 sm:p-5">
        <CabTourStep steps={tourSteps} stepId="audit-reporting-scope">
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label={t('cab.auditReporting.register.summaryLabel') as string}>
            {summary.map((s) => (
              <div key={s.id} className={cn(CARD, 'p-4')}>
                <p className="text-[12px] font-medium text-neutral-500">{t(`cab.auditReporting.register.summary.${s.id}`)}</p>
                <p className="mt-1 text-[24px] font-bold text-neutral-900" data-testid={`summary-${s.id}`}>{s.value}</p>
              </div>
            ))}
          </section>
        </CabTourStep>

        <CabTourStep steps={tourSteps} stepId="audit-reporting-tabs">
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[240px] flex-1">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('cab.auditReporting.register.searchPlaceholder') as string}
                aria-label={t('cab.auditReporting.register.searchPlaceholder') as string}
                className={cn(INPUT, 'ps-10')}
              />
              <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-neutral-400">
                <AppIcon icon={SearchIcon} size={18} />
              </div>
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AuditReportingStatus | 'all')}
              aria-label={t('cab.auditReporting.register.columns.status') as string}
              className={cn(INPUT, 'w-auto min-w-[200px]')}
            >
              <option value="all">{t('cab.auditReporting.register.allStatuses')}</option>
              {AUDIT_REPORTING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === 'handoffPending' || s === 'readyToCreate'
                    ? (t(`cab.auditReporting.register.status.${s}`) as string)
                    : (t(`stageReport.status.${s}`) as string)}
                </option>
              ))}
            </select>
          </div>
        </CabTourStep>

        <CabTourStep steps={tourSteps} stepId="audit-reporting-content">
          <section className={cn(CARD, 'overflow-hidden py-0')}>
            {rows === null ? (
              <p className="p-10 text-center text-[14px] text-neutral-500">{t('cab.auditReporting.register.loading')}</p>
            ) : rows.length === 0 ? (
              <div className="space-y-3 p-10 text-center" data-testid="register-empty">
                <p className="text-[15px] font-bold text-neutral-800">{t('cab.auditReporting.register.emptyTitle')}</p>
                <p className="mx-auto max-w-md text-[13px] text-neutral-500">{t('cab.auditReporting.register.emptyBody')}</p>
                <Link to={ROUTES.cabAuditExecutionList} className={PRIMARY_BTN}>
                  {t('cab.auditReporting.register.goExecution')}
                </Link>
              </div>
            ) : visible.length === 0 ? (
              <div className="space-y-3 p-10 text-center">
                <p className="text-[14px] font-bold text-neutral-700">{t('cab.auditReporting.register.noMatch')}</p>
                <button type="button" className={GHOST_BTN} onClick={() => { setSearch(''); setStatus('all') }}>
                  {t('cab.auditReporting.clearFilters')}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-center" data-testid="register-table">
                  <thead>
                    <tr className="bg-[#1236a3] text-white">
                      {['audit', 'client', 'dates', 'status', 'version', 'checklist', 'findings', 'actions'].map((c) => (
                        <th key={c} className="p-[18px] text-[14px] font-medium">{t(`cab.auditReporting.register.columns.${c}`)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((row, index) => (
                      <tr key={row.id} data-testid="register-row" className={cn('transition-colors hover:bg-[#e8edfc]/50', index % 2 && 'bg-[#f9fafc]')}>
                        <td className="px-4 py-3.5 text-start">
                          <Link to={cabAuditReportingPath(row.planNumber)} className="whitespace-nowrap font-bold text-primary hover:underline" dir="ltr">
                            {row.planNumber}
                          </Link>
                          <p className="text-[12px] text-neutral-500">{row.stage}</p>
                        </td>
                        <td className="px-4 py-3.5 text-start text-[14px] font-medium text-neutral-900">
                          <span dir="auto">{row.clientName}</span>
                          <p className="text-[12px] font-normal text-neutral-500">{row.siteName}</p>
                        </td>
                        <td className="px-4 py-3.5 text-[13px] text-neutral-600" dir="ltr">
                          {formatReportingDate(row.startDate)} - {formatReportingDate(row.endDate)}
                        </td>
                        <td className="px-4 py-3.5">
                          <ReportingStatusBadge status={row.status} />
                          {row.acknowledgedAt && (
                            <p className="mt-1 text-[11px] font-medium text-[#1e40af]" data-testid="register-acknowledged" title={row.acknowledgedBy}>
                              {t('clientAuditResults.cab.registerAcknowledged')} · <bdi dir="ltr">{formatReportingDate(row.acknowledgedAt)}</bdi>
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-[13px] text-neutral-700">
                          {row.version > 0 ? `v${row.version}` : '-'}
                          {row.issuedAt && <p className="text-[11px] text-neutral-500" dir="ltr">{formatReportingDate(row.issuedAt)}</p>}
                        </td>
                        <td className="px-4 py-3.5 text-[13px] text-neutral-700">
                          {t('cab.auditReporting.register.coverageValue', { audited: row.audited, total: row.total })}
                        </td>
                        <td className="px-4 py-3.5 text-[13px] text-neutral-700">
                          {t('cab.auditReporting.register.findingsValue', { submitted: row.submittedFindings, draft: row.draftFindings })}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <button type="button" className={cn(PRIMARY_BTN, 'h-9 px-3 text-[13px]')} onClick={() => navigate(reportActionTarget(row))}>
                              {actionLabel(row)}
                            </button>
                            <Link to={cabAuditReportingPath(row.planNumber)} className={cn(GHOST_BTN, 'h-9 px-3 text-[13px]')}>
                              {t('cab.auditReporting.register.action.openWorkspace')}
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </CabTourStep>

        <CabTourStep steps={tourSteps} stepId="audit-reporting-gates">
          <aside className={cn(CARD, 'p-4 text-[13px] text-neutral-600')}>
            <p className="font-bold text-neutral-800">{t('cab.auditReporting.register.flowTitle')}</p>
            <p className="mt-1">{t('cab.auditReporting.register.flowBody')}</p>
          </aside>
        </CabTourStep>
      </main>
    </>
  )
}

export function CabAuditReportingPage() {
  const tourSteps = useAuditReportingTourSteps()
  return (
    <CabLayout sidebarVariant="auditReporting" tourId="cab-audit-reporting" tourSteps={tourSteps}>
      <CabAuditReportingContent />
    </CabLayout>
  )
}
