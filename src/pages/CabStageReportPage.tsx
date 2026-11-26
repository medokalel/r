import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import {
  fetchAuditPlanById,
  saveAuditPlan,
  type AuditExecutionData,
  type AuditPlan,
} from '@/lib/api/cabAuditPlanningApi'
import { AUDITOR_REGISTER } from '@/lib/teamSelection/teamMember'
import { applyLifecycleAction, createPlanEvent } from '@/lib/api/auditPlanLifecycleApi'
import { listFindingRecords, type FindingRecord } from '@/lib/api/cabAuditReportingApi'
import {
  STAGE_REPORT_SECTION_IDS,
  countChecklistResults,
  createStageReport,
  decideReview,
  buildSnapshot,
  generateSections,
  getSubmitBlockers,
  isEditable,
  isReviewerEligible,
  issueReport,
  submitForReview,
  type FindingSummary,
  type StageReportSectionId,
  type StageReportState,
  type StageReportStatus,
} from '@/lib/api/stageReport'
import { AuditStatusBadge, BreadcrumbChevron } from '@/components/cab/auditPlanning/shared'
import { toast } from '@/lib/toast'
import { ROUTES, cabAuditExecutionPath } from '@/lib/routes'
import { cn } from '@/lib/utils'

const CLASS_KEYS: Record<string, string> = {
  critical: 'classCritical',
  major: 'classMajor',
  minor: 'classMinor',
  observation: 'classObservation',
}

const STATUS_STYLE: Record<StageReportStatus, string> = {
  draft: 'bg-[#fff7ed] text-[#ea580c]',
  returned: 'bg-[#fef2f2] text-[#dc2626]',
  inReview: 'bg-[#f3e8ff] text-[#7e22ce]',
  approved: 'bg-[#e8edfc] text-[#1236a3]',
  issued: 'bg-[#ecfdf5] text-[#16a34a]',
}

function StageReportStatusBadge({ status, label }: { status: StageReportStatus; label: string }) {
  return (
    <span
      data-testid="report-status"
      className={cn('inline-flex rounded-[4px] px-3 py-1 text-[12px] font-medium whitespace-nowrap', STATUS_STYLE[status])}
    >
      {label}
    </span>
  )
}

function formatDate(iso?: string) {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

const TEXTAREA =
  'w-full rounded-[8px] border border-[#e2e2e2] p-3 text-[13px] disabled:cursor-not-allowed disabled:bg-[#f9fafc] disabled:text-neutral-500'

export function CabStageReportPage() {
  const { t } = useTranslation()
  const { planId } = useParams<{ planId: string }>()
  const [plan, setPlan] = useState<AuditPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'edit' | 'preview'>('edit')
  const [reviewComment, setReviewComment] = useState('')
  const [findingRecords, setFindingRecords] = useState<FindingRecord[]>([])

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      const data = await fetchAuditPlanById(planId || '')
      if (!active) return
      setPlan(data)
      setFindingRecords(data ? listFindingRecords().filter((r) => r.planNumber === data.planNumber) : [])
      setLoading(false)
    }
    void load()
    return () => {
      active = false
    }
  }, [planId])

  const tr = (key: string, params?: Record<string, string | number>) => String(t(key, params as never))

  const findings: FindingSummary[] = useMemo(
    () =>
      findingRecords
        .filter((r) => r.status === 'Submitted' && r.findingCode)
        .map((r) => ({
          code: r.findingCode as string,
          classification: CLASS_KEYS[r.classification]
            ? (t(`cab.auditReporting.${CLASS_KEYS[r.classification]}`) as string)
            : r.classification,
          clauseRef: r.clauseRef || r.requirementRef,
          statement: r.statement,
        })),
    [findingRecords, t],
  )
  const draftFindings = findingRecords.filter((r) => r.status === 'Draft').length

  if (loading) {
    return (
      <CabLayout sidebarVariant="auditPlanning">
        <div className="flex flex-1 items-center justify-center p-12 text-neutral-400">{t('stageReport.loading')}</div>
      </CabLayout>
    )
  }

  if (!plan) {
    return (
      <CabLayout sidebarVariant="auditPlanning">
        <CabHeader title={t('stageReport.title')} subtitle="" notificationCount={6} />
        <main className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
          <p className="text-[14px] text-neutral-600">{t('stageReport.notFound')}</p>
          <Link to={ROUTES.cabAuditExecutionList} className="text-[13px] font-semibold text-[#1236a3] hover:underline">
            {t('stageReport.backToExecutionList')}
          </Link>
        </main>
      </CabLayout>
    )
  }

  const execution = plan.execution
  const state = plan.stageReport
  const handoffReady = execution.report.handoffReady
  const executionPath = cabAuditExecutionPath(plan.planNumber)

  const persist = async (patch: Partial<AuditPlan>, event?: string, detail?: string) => {
    const events = event ? [...(plan.events ?? []), createPlanEvent(event, detail)] : plan.events
    const updated = await saveAuditPlan({ id: plan.id, planNumber: plan.planNumber, ...patch, ...(events ? { events } : {}) })
    setPlan(updated)
    return updated
  }

  const statusLabel = (status: StageReportStatus) => t(`stageReport.status.${status}`) as string

  // --- Not ready: the report opens from the execution hand-off ---
  if (!handoffReady) {
    return (
      <CabLayout sidebarVariant="auditPlanning">
        <CabHeader title={t('stageReport.title')} subtitle={`${plan.planNumber} · ${plan.clientName} · ${plan.stage}`} notificationCount={6} />
        <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
          <section className="space-y-3 rounded-[16px] border border-[#fde68a] bg-[#fffbeb] p-5" data-testid="report-not-ready">
            <h2 className="text-[16px] font-bold text-[#92400e]">{t('stageReport.notReady.title')}</h2>
            <p className="text-[13px] text-[#b45309]">{t('stageReport.notReady.body')}</p>
            <Link
              to={executionPath}
              className="inline-flex h-10 items-center rounded-[8px] bg-[#1236a3] px-5 text-[13px] font-semibold text-white hover:bg-[#0e2a80]"
            >
              {t('stageReport.notReady.back')}
            </Link>
          </section>
        </main>
      </CabLayout>
    )
  }

  const editable = isEditable(state)
  const status: StageReportStatus = state?.status ?? 'draft'
  const defaultTr = (key: string, params?: Record<string, string | number>) => tr(key, params)

  const handleCreate = async () => {
    const created = createStageReport(generateSections(plan, execution, findings, defaultTr), new Date().toISOString())
    await persist({ stageReport: created })
  }

  // First visit: nothing generated yet.
  if (!state) {
    return (
      <CabLayout sidebarVariant="auditPlanning">
        <CabHeader title={t('stageReport.title')} subtitle={`${plan.planNumber} · ${plan.clientName} · ${plan.stage}`} notificationCount={6} />
        <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
          <section className="space-y-4 rounded-[16px] border border-[#ececec] bg-white p-5" data-testid="report-create">
            <div>
              <h2 className="text-[18px] font-bold text-neutral-900">{t('stageReport.create.title')}</h2>
              <p className="mt-0.5 text-[13px] text-neutral-500">{t('stageReport.create.description')}</p>
            </div>
            <ul className="list-disc space-y-1 ps-5 text-[13px] text-neutral-700">
              <li>{t('stageReport.create.point1')}</li>
              <li>{t('stageReport.create.point2')}</li>
            </ul>
            <button
              type="button"
              data-testid="generate-report"
              onClick={() => void handleCreate()}
              className="h-10 rounded-[8px] bg-[#1236a3] px-5 text-[13px] font-semibold text-white transition hover:bg-[#0e2a80]"
            >
              {t('stageReport.create.button')}
            </button>
          </section>
        </main>
      </CabLayout>
    )
  }

  const blockers = getSubmitBlockers(plan, execution, state, draftFindings)
  const counts = countChecklistResults(execution)

  const updateState = (patch: Partial<StageReportState>) => {
    void persist({ stageReport: { ...state, ...patch } })
  }
  const updateSection = (id: StageReportSectionId, value: string) =>
    updateState({ sections: { ...state.sections, [id]: value } })
  const updateReport = (patch: Partial<AuditExecutionData['report']>) =>
    void persist({ execution: { ...execution, report: { ...execution.report, ...patch } } })

  const handleRegenerate = () => {
    updateState({ sections: generateSections(plan, execution, findings, defaultTr) })
    toast.success(t('stageReport.regenerated'))
  }

  const handleSubmit = async () => {
    const result = submitForReview(plan, execution, state, new Date().toISOString(), draftFindings)
    if (!result.ok || !result.next) {
      if (result.blockers[0]) {
        toast.error(t(`stageReport.blockers.${result.blockers[0].code}`, { count: result.blockers[0].count ?? 0 }) as string)
      }
      return
    }
    await persist(
      { stageReport: result.next, ...(plan.status === 'Completed' ? {} : { status: 'Under review' as const }) },
      'report.submitted',
      state.reviewer,
    )
    setReviewComment('')
    toast.success(t('stageReport.toast.submitted'))
  }

  const handleDecision = async (decision: 'approve' | 'return') => {
    const result = decideReview(plan, state, decision, reviewComment, new Date().toISOString())
    if (!result.ok || !result.next) {
      if (result.error === 'commentRequired') toast.error(t('stageReport.review.commentRequired') as string)
      else if (result.error === 'reviewerNotAllowed') toast.error(t('stageReport.blockers.reviewerOnTeam') as string)
      return
    }
    await persist(
      { stageReport: result.next, ...(decision === 'return' && plan.status !== 'Completed' ? { status: 'In progress' as const } : {}) },
      decision === 'approve' ? 'report.approved' : 'report.returned',
      state.reviewer,
    )
    setReviewComment('')
    toast.success(t(decision === 'approve' ? 'stageReport.toast.approved' : 'stageReport.toast.returned') as string)
  }

  const handleIssue = async () => {
    const result = issueReport(state, new Date().toISOString(), buildSnapshot(plan, execution, state, findings.length))
    if (!result.ok || !result.next) return
    const saved = await persist(
      {
        stageReport: result.next,
        execution: { ...execution, report: { ...execution.report, reportFinalized: true } },
      },
      'report.issued',
      `v${state.version}`,
    )
    try {
      const lifecycle = await applyLifecycleAction(saved, 'complete')
      setPlan(lifecycle.plan)
    } catch {
      /* the report stays issued; the plan status can be completed from the plan page */
    }
    toast.success(t('stageReport.toast.issued') as string)
  }

  const reviewerOptions = AUDITOR_REGISTER.map((person) => ({
    name: person.name,
    eligible: isReviewerEligible(person.name, plan),
  }))

  const blockerText = (b: { code: string; count?: number }) =>
    t(`stageReport.blockers.${b.code}`, { count: b.count ?? 0 }) as string

  // An issued report always renders from its frozen snapshot, never from live plan/execution data.
  const snap = status === 'issued' ? state.snapshot : undefined
  const d = snap ?? {
    planNumber: plan.planNumber,
    clientName: plan.clientName,
    siteName: plan.siteName,
    stage: plan.stage,
    standardName: plan.standardName,
    standards: plan.standards,
    leadAuditor: plan.leadAuditor,
    auditTeam: plan.auditTeam,
    proposedStartDate: plan.proposedStartDate,
    proposedEndDate: plan.proposedEndDate,
    executiveSummary: execution.report.executiveSummary,
    recommendation: execution.report.recommendation,
    sections: state.sections,
    counts: { audited: counts.audited, total: counts.total, nc: counts.minorNc + counts.majorNc, findings: findings.length },
  }

  const docSections: Array<{ id: string; title: string; text: string }> = [
    { id: 'summary', title: t('stageReport.sections.executiveSummary') as string, text: d.executiveSummary },
    ...STAGE_REPORT_SECTION_IDS.map((id) => ({
      id,
      title: t(`stageReport.sections.${id}`) as string,
      text: d.sections[id],
    })),
    { id: 'recommendation', title: t('stageReport.sections.recommendation') as string, text: d.recommendation },
  ]

  const reportDocument = (
        <div className="rounded-[16px] border border-[#ececec] bg-white p-8 print:border-0 print:p-0" data-testid="report-document">
          <h1 className="text-[22px] font-bold text-neutral-900">{t('stageReport.document.title', { stage: d.stage })}</h1>
          <p className="mt-1 text-[13px] text-neutral-500">
            {d.clientName} · {d.siteName} · <bdi dir="ltr">{d.planNumber}</bdi> · <bdi dir="ltr">v{state.version}</bdi> · {statusLabel(status)}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-y border-[#e5e7eb] py-3 text-[12px]">
            <div><dt className="text-neutral-400">{t('execution.plan.leadAuditor')}</dt><dd className="font-semibold">{d.leadAuditor}</dd></div>
            <div><dt className="text-neutral-400">{t('execution.plan.auditTeam')}</dt><dd className="font-semibold">{d.auditTeam.join(', ')}</dd></div>
            <div><dt className="text-neutral-400">{t('execution.plan.dates')}</dt><dd className="font-semibold"><bdi dir="ltr">{formatDate(d.proposedStartDate)} · {formatDate(d.proposedEndDate)}</bdi></dd></div>
            <div><dt className="text-neutral-400">{t('stageReport.overview.standards')}</dt><dd className="font-semibold"><bdi dir="ltr">{d.standards.join(', ')}</bdi></dd></div>
            <div><dt className="text-neutral-400">{t('stageReport.document.reviewer')}</dt><dd className="font-semibold">{state.reviewer || '-'}</dd></div>
            <div><dt className="text-neutral-400">{t('stageReport.document.issuedOn')}</dt><dd className="font-semibold"><bdi dir="ltr">{state.issuedAt ? formatDate(state.issuedAt) : '-'}</bdi></dd></div>
          </dl>
          {docSections.map((section) => (
            <section key={section.id} className="mt-5 print:mt-3">
              <h2 className="break-after-avoid text-[14px] font-bold text-[#0e2a80]">{section.title}</h2>
              <p dir="auto" className="mt-1 whitespace-pre-line text-[13px] leading-6 text-neutral-800">{section.text || '-'}</p>
            </section>
          ))}
          <p className="mt-5 break-inside-avoid rounded-[8px] bg-[#f9fafc] p-3 text-[12px] text-neutral-600 print:mt-3">{t('stageReport.recommendationNote')}</p>
        </div>
  )

  return (
    <CabLayout sidebarVariant="auditPlanning">
      <style>{`
        @media print {
          body > *:not(#stage-report-print-root) { display: none !important; }
          #stage-report-print-root { display: block !important; }
          @page { margin: 14mm; }
        }
      `}</style>

      <div className="print:hidden">
        <CabHeader title={t('stageReport.title')} subtitle={`${plan.planNumber} · ${plan.clientName} · ${plan.stage}`} notificationCount={6} />
      </div>

      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[13px] print:hidden" aria-label="breadcrumb">
          <Link to={ROUTES.cabAuditPlanning} className="font-light text-neutral-400 hover:text-primary">
            {t('execution.breadcrumb.auditPlanning')}
          </Link>
          <BreadcrumbChevron />
          <Link to={executionPath} className="font-light text-neutral-400 hover:text-primary" dir="ltr">
            {plan.planNumber}
          </Link>
          <BreadcrumbChevron />
          <span className="font-medium text-neutral-700">{t('stageReport.title')}</span>
        </nav>

        {/* Overview */}
        <section className="space-y-3 rounded-[16px] border border-[#ececec] bg-white p-5 print:hidden">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-[18px] font-bold text-neutral-900">
                {d.planNumber} · {d.clientName}
              </h1>
              <p className="mt-0.5 text-[13px] text-neutral-500">
                {d.standardName} · {d.stage}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] text-neutral-500" dir="ltr">v{state.version}</span>
              <StageReportStatusBadge status={status} label={statusLabel(status)} />
              <AuditStatusBadge status={plan.status} />
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-4 border-t border-[#f0f0f0] pt-3 text-[13px] sm:grid-cols-4">
            <div>
              <dt className="text-[12px] text-neutral-400">{t('execution.reportStep.checklistCoverage')}</dt>
              <dd className="mt-0.5 font-semibold text-neutral-900">{t('execution.reportStep.coverageValue', { answered: d.counts.audited, total: d.counts.total })}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-neutral-400">{t('execution.reportStep.findings')}</dt>
              <dd className="mt-0.5 font-semibold text-neutral-900">{d.counts.findings}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-neutral-400">{t('stageReport.overview.nc')}</dt>
              <dd className="mt-0.5 font-semibold text-neutral-900">{d.counts.nc}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-neutral-400">{t('stageReport.overview.dates')}</dt>
              <dd className="mt-0.5 font-semibold text-neutral-900"><bdi dir="ltr">{formatDate(d.proposedStartDate)} · {formatDate(d.proposedEndDate)}</bdi></dd>
            </div>
          </dl>
          <div className="flex flex-wrap items-center gap-2 border-t border-[#f0f0f0] pt-3">
            <button
              type="button"
              data-testid="view-edit"
              onClick={() => setView('edit')}
              className={cn('h-9 rounded-[8px] px-4 text-[13px] font-medium', view === 'edit' ? 'bg-[#1236a3] text-white' : 'border border-[#e2e2e2] bg-white text-neutral-700')}
            >
              {t('stageReport.view.edit')}
            </button>
            <button
              type="button"
              data-testid="view-preview"
              onClick={() => setView('preview')}
              className={cn('h-9 rounded-[8px] px-4 text-[13px] font-medium', view === 'preview' ? 'bg-[#1236a3] text-white' : 'border border-[#e2e2e2] bg-white text-neutral-700')}
            >
              {t('stageReport.view.preview')}
            </button>
            <button
              type="button"
              data-testid="print-report"
              onClick={() => window.print()}
              className="h-9 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {t('stageReport.print')}
            </button>
            <Link to={executionPath} className="ms-auto text-[13px] font-semibold text-[#1236a3] hover:underline">
              {t('stageReport.backToExecution')}
            </Link>
          </div>
        </section>

        {status === 'returned' && state.reviewComment && (
          <p className="rounded-[10px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[13px] text-[#b91c1c] print:hidden" data-testid="returned-banner">
            <span className="font-semibold">{t('stageReport.review.returnedBy', { name: state.reviewer })}</span> {state.reviewComment}
          </p>
        )}
        {status === 'issued' && (
          <p className="rounded-[10px] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-[13px] font-medium text-[#15803d] print:hidden" data-testid="issued-banner">
            {t('stageReport.issuedBanner', { version: state.version, date: formatDate(state.issuedAt) })}
          </p>
        )}
        {status === 'inReview' && (
          <p className="rounded-[10px] border border-[#e9d5ff] bg-[#faf5ff] px-4 py-3 text-[13px] text-[#6b21a8] print:hidden" data-testid="frozen-banner">
            {t('stageReport.frozen')}
          </p>
        )}

        {plan.status === 'Completed' && status !== 'issued' && (
          <p className="rounded-[10px] border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-[13px] text-[#92400e] print:hidden" data-testid="completed-elsewhere-banner">
            {t('stageReport.completedElsewhere')}
          </p>
        )}

        {/* Preview + print document */}
        {view === 'preview' && <div className="print:hidden">{reportDocument}</div>}

        {view === 'edit' && (
          <div className="grid grid-cols-1 gap-5 print:hidden lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <section className="space-y-4 rounded-[16px] border border-[#ececec] bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-[15px] font-bold text-neutral-900">{t('stageReport.editor.title')}</h2>
                    <p className="mt-0.5 text-[12px] text-neutral-500">{t('stageReport.editor.description')}</p>
                  </div>
                  <button
                    type="button"
                    data-testid="regenerate"
                    disabled={!editable}
                    onClick={handleRegenerate}
                    className="h-9 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[12px] font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t('stageReport.editor.regenerate')}
                  </button>
                </div>

                <div>
                  <label className="mb-1 block text-[13px] font-medium text-neutral-800">{t('stageReport.sections.executiveSummary')}</label>
                  <textarea
                    dir="auto"
                    data-testid="section-summary"
                    rows={3}
                    disabled={!editable}
                    value={execution.report.executiveSummary}
                    onChange={(e) => updateReport({ executiveSummary: e.target.value })}
                    placeholder={t('execution.reportStep.executiveSummaryPlaceholder') as string}
                    className={TEXTAREA}
                  />
                </div>

                {STAGE_REPORT_SECTION_IDS.map((id) => (
                  <div key={id}>
                    <label className="mb-1 block text-[13px] font-medium text-neutral-800">{t(`stageReport.sections.${id}`)}</label>
                    <textarea
                    dir="auto"
                      data-testid={`section-${id}`}
                      rows={id === 'findings' ? 5 : id === 'scopeObjectives' || id === 'teamDates' ? 4 : 3}
                      disabled={!editable}
                      value={state.sections[id]}
                      onChange={(e) => updateSection(id, e.target.value)}
                      className={TEXTAREA}
                    />
                  </div>
                ))}

                <div>
                  <label className="mb-1 block text-[13px] font-medium text-neutral-800">{t('stageReport.sections.recommendation')}</label>
                  <textarea
                    dir="auto"
                    data-testid="section-recommendation"
                    rows={2}
                    disabled={!editable}
                    value={execution.report.recommendation}
                    onChange={(e) => updateReport({ recommendation: e.target.value })}
                    className={TEXTAREA}
                  />
                  <p className="mt-1 text-[11px] text-neutral-400">{t('stageReport.recommendationNote')}</p>
                </div>
              </section>
            </div>

            <div className="space-y-5">
              {/* Review lifecycle */}
              <section className="space-y-3 rounded-[16px] border border-[#ececec] bg-white p-5" data-testid="review-panel">
                <h2 className="text-[15px] font-bold text-neutral-900">{t('stageReport.review.title')}</h2>
                <p className="text-[12px] text-neutral-500">{t('stageReport.review.hint')}</p>

                <div>
                  <label className="mb-1 block text-[12px] font-medium text-neutral-700">{t('stageReport.review.reviewer')}</label>
                  <select
                    data-testid="reviewer-select"
                    disabled={!editable}
                    value={state.reviewer}
                    onChange={(e) => updateState({ reviewer: e.target.value })}
                    className="h-10 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[13px] disabled:cursor-not-allowed disabled:bg-[#f9fafc]"
                  >
                    <option value="">{t('stageReport.review.choose')}</option>
                    {reviewerOptions.map((option) => (
                      <option key={option.name} value={option.name} disabled={!option.eligible}>
                        {option.name}
                        {option.eligible ? '' : ` (${t('stageReport.review.onTeam')})`}
                      </option>
                    ))}
                  </select>
                </div>

                {editable && (
                  <div className="rounded-[10px] border border-[#fde68a] bg-[#fffbeb] p-3 text-[12px]" data-testid="submit-gate">
                    <p className="font-bold text-[#92400e]">{t('stageReport.blockers.title')}</p>
                    {blockers.length === 0 ? (
                      <p className="mt-1 text-[#b45309]">{t('stageReport.blockers.ready')}</p>
                    ) : (
                      <ul className="mt-1 list-disc space-y-0.5 ps-5 text-[#b45309]">
                        {blockers.map((b) => (
                          <li key={b.code}>{blockerText(b)}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {editable && (
                  <button
                    type="button"
                    data-testid="submit-review"
                    disabled={blockers.length > 0}
                    onClick={() => void handleSubmit()}
                    className="h-10 w-full rounded-[8px] bg-[#1236a3] px-5 text-[13px] font-semibold text-white transition hover:bg-[#0e2a80] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t('stageReport.review.submit')}
                  </button>
                )}

                {status === 'inReview' && (
                  <div className="space-y-2" data-testid="review-actions">
                    <p className="text-[12px] text-neutral-600">{t('stageReport.review.actingAs', { name: state.reviewer })}</p>
                    <textarea
                    dir="auto"
                      data-testid="review-comment"
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder={t('stageReport.review.commentPlaceholder') as string}
                      className={TEXTAREA}
                    />
                    <div className="flex gap-2">
                      <button type="button" data-testid="approve-report" onClick={() => void handleDecision('approve')} className="h-10 flex-1 rounded-[8px] bg-[#16a34a] px-3 text-[13px] font-semibold text-white hover:bg-[#15803d]">
                        {t('stageReport.review.approve')}
                      </button>
                      <button type="button" data-testid="return-report" onClick={() => void handleDecision('return')} className="h-10 flex-1 rounded-[8px] border border-[#fecaca] bg-white px-3 text-[13px] font-semibold text-[#dc2626] hover:bg-[#fef2f2]">
                        {t('stageReport.review.return')}
                      </button>
                    </div>
                  </div>
                )}

                {status === 'approved' && (
                  <div className="space-y-2" data-testid="issue-panel">
                    <p className="text-[12px] text-neutral-600">{t('stageReport.review.approvedHint', { name: state.reviewer })}</p>
                    <button type="button" data-testid="issue-report" onClick={() => void handleIssue()} className="h-10 w-full rounded-[8px] bg-[#1236a3] px-5 text-[13px] font-semibold text-white hover:bg-[#0e2a80]">
                      {t('stageReport.review.issue')}
                    </button>
                    <p className="text-[11px] text-neutral-400">{t('stageReport.review.issueNote')}</p>
                  </div>
                )}
              </section>

              {/* History */}
              <section className="space-y-2 rounded-[16px] border border-[#ececec] bg-white p-5" data-testid="report-history">
                <h2 className="text-[15px] font-bold text-neutral-900">{t('stageReport.history.title')}</h2>
                <ul className="space-y-2 text-[12px]">
                  {[...state.events].reverse().map((event) => (
                    <li key={event.id} className="border-b border-[#f3f3f3] pb-2 last:border-0">
                      <p className="font-semibold text-neutral-800">{t(`stageReport.history.${event.action}`)}</p>
                      <p className="text-neutral-500">
                        <bdi dir="ltr">{formatDateTime(event.at)}</bdi>
                        {event.actor ? ` · ${event.actor}` : ''}
                      </p>
                      {event.detail && <p className="text-neutral-600">{event.detail}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        )}
      </main>
      {typeof document !== 'undefined' &&
        createPortal(
          <div id="stage-report-print-root" className="hidden">
            {reportDocument}
          </div>,
          document.body,
        )}
    </CabLayout>
  )
}
