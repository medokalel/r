import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { AddCircleIcon, AppIcon, DownloadTrayIcon, SearchIcon } from '@/components/icons'
import { fetchAuditPlanById, type AuditPlan } from '@/lib/api/cabAuditPlanningApi'
import {
  SCHEME_RULES,
  downloadFile,
  listFindingRecords,
  toCsv,
  type FindingRecord,
} from '@/lib/api/cabAuditReportingApi'
import {
  buildEvidenceRows,
  buildReportingRow,
  buildReportReadiness,
  canAddFinding,
  type ReadinessItem,
  findingsForPlan,
  getReportAction,
  getReportingStatus,
} from '@/lib/api/auditReportingWorkspace'
import { ROUTES, cabAuditExecutionPath, cabAuditReportingPath, cabStageReportPath } from '@/lib/routes'
import { CARD, GHOST_BTN, INPUT, PRIMARY_BTN } from '@/components/cab/auditReporting/shared'
import { ReportingStatusBadge, formatReportingDate } from '@/pages/CabAuditReportingPage'
import { RESULT_LABEL_KEYS } from '@/components/cab/auditPlanning/ExecutionMeetingReportSteps'
import { cn } from '@/lib/utils'

type Tab = 'agenda' | 'evidence' | 'findings' | 'report'

function classificationLabel(t: (k: string) => unknown, value: string): string {
  if (!value) return t('cab.auditReporting.unclassified') as string
  const match = SCHEME_RULES.classifications.find((c) => c.label === value || c.value === value)
  return match ? (t(`cab.auditReporting.register.class.${match.value}`) as string) : value
}

function typeLabel(t: (k: string) => unknown, value: string): string {
  const key = ['Nonconformity', 'Observation', 'Opportunity'].includes(value) ? value : ''
  return key ? (t(`cab.auditReporting.register.type.${key}`) as string) : value
}

function CabAuditReportingAuditContent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { planId } = useParams<{ planId: string }>()
  const [plan, setPlan] = useState<AuditPlan | null>(null)
  const [records, setRecords] = useState<FindingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const [tab, setTab] = useState<Tab>(
    requestedTab === 'evidence' || requestedTab === 'findings' || requestedTab === 'report' ? requestedTab : 'agenda',
  )
  const [query, setQuery] = useState('')
  const [missingOnly, setMissingOnly] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    void fetchAuditPlanById(planId || '').then((data) => {
      if (!active) return
      setPlan(data)
      setRecords(listFindingRecords())
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [planId])

  const evidence = useMemo(() => (plan ? buildEvidenceRows(plan) : []), [plan])
  const shownEvidence = evidence.filter(
    (e) =>
      (!missingOnly || !e.hasEvidence) &&
      (query.trim() === '' || `${e.clauseRef} ${e.title} ${e.findingCode}`.toLowerCase().includes(query.trim().toLowerCase())),
  )

  if (loading) {
    return <div className="flex flex-1 items-center justify-center p-12 text-neutral-400">{t('cab.auditReporting.register.loading')}</div>
  }

  if (!plan) {
    return (
      <>
        <CabHeader title={t('cab.auditReporting.title')} subtitle="" notificationCount={3} />
        <main className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
          <p className="text-[14px] text-neutral-600">{t('cab.auditReporting.register.notFound')}</p>
          <Link to={ROUTES.cabAuditReporting} className="text-[13px] font-semibold text-[#1236a3] hover:underline">
            {t('cab.auditReporting.register.back')}
          </Link>
        </main>
      </>
    )
  }

  const own = findingsForPlan(plan, records)
  const status = getReportingStatus(plan)
  const action = getReportAction(status)
  const readiness = buildReportReadiness(plan, records)
  const addAllowed = canAddFinding(plan)
  const reportTarget = action === 'openExecution' ? cabAuditExecutionPath(plan.planNumber) : cabStageReportPath(plan.planNumber)
  const state = plan.stageReport
  const row = buildReportingRow(plan, records)
  const workspacePath = cabAuditReportingPath(plan.planNumber)

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'agenda', label: t('cab.auditReporting.tabs.agenda') as string },
    { id: 'evidence', label: t('cab.auditReporting.tabs.evidence') as string },
    { id: 'findings', label: t('cab.auditReporting.tabs.findings') as string },
    { id: 'report', label: t('cab.auditReporting.tabs.report') as string },
  ]

  const exportEvidence = () => {
    const headers = ['Clause', 'Item', 'Result', 'Evidence', 'Documents', 'People', 'Finding']
    const rows = shownEvidence.map((e) => ({
      Clause: e.clauseRef, Item: e.title, Result: e.result, Evidence: e.evidenceNotes,
      Documents: e.documentsSampled, People: e.peopleInterviewed, Finding: e.findingCode,
    }))
    downloadFile(`${plan.planNumber}-evidence.csv`, toCsv(rows, headers), 'text/csv')
  }
  const exportFindings = () => {
    const headers = ['ID', 'Type', 'Requirement', 'Classification', 'Statement', 'Status']
    const rows = own.map((f) => ({
      ID: f.findingCode ?? '', Type: f.findingType, Requirement: f.requirementRef,
      Classification: f.classification, Statement: f.statement, Status: f.status,
    }))
    downloadFile(`${plan.planNumber}-findings.csv`, toCsv(rows, headers), 'text/csv')
  }

  const addFindingPath = `${ROUTES.cabAddFinding}?planId=${encodeURIComponent(plan.id)}&returnTo=${encodeURIComponent(workspacePath)}`
    const reportButton = (
    <button type="button" data-testid="report-action" className={PRIMARY_BTN} onClick={() => navigate(reportTarget)}>
      {t(`cab.auditReporting.register.action.${action}`)}
    </button>
  )

  return (
    <>
      <CabHeader
        title={t('cab.auditReporting.title')}
        subtitle={`${plan.planNumber} · ${plan.clientName} · ${plan.stage}`}
        notificationCount={3}
      />
      <main className="flex flex-1 flex-col gap-5 overflow-auto p-3 sm:p-5">
        <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400" aria-label="Breadcrumb">
          <Link to={ROUTES.cabAuditReporting} className="transition-colors hover:text-[#1236a3]">{t('cab.auditReporting.title')}</Link>
          <span aria-hidden>/</span>
          <span className="font-semibold text-neutral-600" dir="ltr">{plan.planNumber}</span>
        </nav>

        <section className={cn(CARD, 'border-[#1236a3]/20 bg-[#f3f6fd] p-4')} aria-label={t('cab.auditReporting.scope') as string} data-testid="audit-context">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px]">
            <span className="rounded-[6px] bg-[#1236a3] px-2 py-0.5 font-bold text-white">{t('cab.auditReporting.scope')}</span>
            <span className="font-medium text-neutral-700">{t('cab.auditReporting.register.scopeClient')}: <bdi>{plan.clientCode ? `${plan.clientCode} · ` : ''}{plan.clientName}</bdi></span>
            {plan.siteName && <span className="font-medium text-neutral-700">{t('cab.auditReporting.register.scopeSite')}: <bdi>{plan.siteName}</bdi></span>}
            {plan.primaryContactName && <span className="font-medium text-neutral-700">{t('cab.auditReporting.register.scopeContact')}: <bdi>{plan.primaryContactName}</bdi></span>}
            <span className="font-medium text-neutral-700">{t('cab.auditReporting.register.scopeLead')}: <bdi>{plan.leadAuditor}</bdi></span>
            <span className="font-medium text-neutral-700" dir="ltr">{formatReportingDate(plan.proposedStartDate)} - {formatReportingDate(plan.proposedEndDate)}</span>
            <ReportingStatusBadge status={status} />
          </div>
        </section>

        <div className="flex gap-6 overflow-x-auto border-b border-[#ececec] text-[14px]" role="tablist" data-testid="ws-tabs">
          {tabs.map((x) => (
            <button
              key={x.id}
              role="tab"
              aria-selected={tab === x.id}
              type="button"
              onClick={() => setTab(x.id)}
              className={cn(
                'shrink-0 whitespace-nowrap border-b-2 pb-3 font-medium transition-colors',
                tab === x.id ? 'border-primary font-bold text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-900',
              )}
            >
              {x.label}
            </button>
          ))}
        </div>

        {tab === 'agenda' && (
          <section className={cn(CARD, 'overflow-hidden py-4')}>
            <div className="px-4 pb-4">
              <h2 className="text-[20px] font-bold text-neutral-900">{t('cab.auditReporting.register.agendaTitle')}</h2>
              <p className="mt-0.5 text-[13px] text-neutral-500">{t('cab.auditReporting.register.agendaSub', { count: plan.agendaActivities.length })}</p>
            </div>
            {plan.agendaActivities.length === 0 ? (
              <p className="p-8 text-center text-[13px] text-neutral-500">{t('cab.auditReporting.register.agendaEmpty')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-center">
                  <thead>
                    <tr className="bg-[#1236a3] text-white">
                      {['date', 'time', 'activity', 'auditors', 'hours'].map((c) => (
                        <th key={c} className="p-[18px] text-[14px] font-medium">{t(`cab.auditReporting.register.agendaColumns.${c}`)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {plan.agendaActivities.map((a, i) => (
                      <tr key={a.id} className={cn(i % 2 && 'bg-[#f9fafc]')}>
                        <td className="px-4 py-3.5 text-[13px] text-neutral-700" dir="ltr">{formatReportingDate(a.date)}</td>
                        <td className="px-4 py-3.5 text-[13px] font-semibold text-primary" dir="ltr">{a.startTime} - {a.endTime}</td>
                        <td className="px-4 py-3.5 text-start text-[14px] font-medium text-neutral-900">{a.activity}</td>
                        <td className="px-4 py-3.5 text-[13px] text-neutral-600">{a.auditors.join(', ')}</td>
                        <td className="px-4 py-3.5 text-[13px] text-neutral-600">{a.durationHours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {tab === 'evidence' && (
          <section className={cn(CARD, 'overflow-hidden py-4')}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-4">
              <div>
                <h2 className="text-[20px] font-bold text-neutral-900">{t('cab.auditReporting.evidenceTitle')}</h2>
                <p className="mt-0.5 text-[13px] text-neutral-500">{t('cab.auditReporting.register.evidenceSub')}</p>
              </div>
              <button type="button" className={GHOST_BTN} onClick={exportEvidence} disabled={shownEvidence.length === 0}>
                <AppIcon icon={DownloadTrayIcon} size={18} />
                {t('cab.auditReporting.exportFiltered')}
              </button>
            </div>
            <div className="mb-2 flex flex-wrap items-center gap-3 border-b border-[#ececec] bg-[#f8fafd] p-4">
              <div className="relative min-w-[220px] flex-1">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('cab.auditReporting.register.evidenceSearch') as string} aria-label={t('cab.auditReporting.register.evidenceSearch') as string} className={cn(INPUT, 'ps-10')} />
                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-neutral-400"><AppIcon icon={SearchIcon} size={18} /></div>
              </div>
              <label className="flex items-center gap-2 text-[13px] font-medium text-neutral-700">
                <input type="checkbox" checked={missingOnly} onChange={(e) => setMissingOnly(e.target.checked)} className="size-4" />
                {t('cab.auditReporting.register.missingOnly')}
              </label>
              <span className="ms-auto text-[13px] font-medium text-neutral-500">{shownEvidence.length} / {evidence.length}</span>
            </div>
            {shownEvidence.length === 0 ? (
              <p className="p-8 text-center text-[13px] text-neutral-500">{t('cab.auditReporting.register.evidenceEmpty')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] border-collapse text-center">
                  <thead>
                    <tr className="bg-[#1236a3] text-white">
                      {['clause', 'item', 'result', 'evidence', 'finding'].map((c) => (
                        <th key={c} className="p-[18px] text-[14px] font-medium">{t(`cab.auditReporting.register.evidenceColumns.${c}`)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shownEvidence.map((e, i) => (
                      <tr key={e.id} className={cn(i % 2 && 'bg-[#f9fafc]')}>
                        <td className="px-4 py-3.5 text-[13px] font-bold text-primary" dir="ltr">{e.clauseRef}</td>
                        <td className="px-4 py-3.5 text-start text-[14px] text-neutral-900">{e.title}</td>
                        <td className="px-4 py-3.5 text-[13px] text-neutral-700">{t(`execution.results.${RESULT_LABEL_KEYS[e.result] ?? 'notAudited'}`)}</td>
                        <td className="px-4 py-3.5">
                          <span className={cn('inline-flex rounded-[4px] px-3 py-1 text-[12px] font-medium', e.hasEvidence ? 'bg-[#ecfdf5] text-[#16a34a]' : 'bg-[#fff7ed] text-[#ea580c]')}>
                            {t(e.hasEvidence ? 'cab.auditReporting.register.evidenceRecorded' : 'cab.auditReporting.register.evidenceMissing')}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[13px] text-neutral-700" dir="ltr">{e.findingCode || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {tab === 'findings' && (
          <section className={cn(CARD, 'overflow-hidden py-4')}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-4">
              <div>
                <h2 className="text-[20px] font-bold text-neutral-900">{t('cab.auditReporting.findingsTitle')}</h2>
                <p className="mt-0.5 text-[13px] text-neutral-500">{t('cab.auditReporting.register.findingsSub')}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" className={GHOST_BTN} onClick={exportFindings} disabled={own.length === 0}>
                  <AppIcon icon={DownloadTrayIcon} size={18} />
                  {t('cab.auditReporting.exportFiltered')}
                </button>
                <button type="button" className={PRIMARY_BTN} disabled={!addAllowed} onClick={() => navigate(addFindingPath)}>
                  <AppIcon icon={AddCircleIcon} size={18} />
                  {t('cab.auditReporting.addFinding')}
                </button>
              </div>
            </div>
            {!addAllowed && (
              <p className="mx-4 mb-3 rounded-[8px] border border-[#fde68a] bg-[#fffbeb] p-3 text-[13px] text-[#b45309]" data-testid="findings-locked">
                {t('cab.auditReporting.register.findingsLocked')}
              </p>
            )}
            {own.length === 0 ? (
              <p className="p-8 text-center text-[13px] text-neutral-500" data-testid="findings-empty">{t('cab.auditReporting.register.findingsEmpty')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] border-collapse text-center">
                  <thead>
                    <tr className="bg-[#1236a3] text-white">
                      {['finding', 'requirement', 'statement', 'classification', 'status'].map((c) => (
                        <th key={c} className="p-[18px] text-[14px] font-medium">{t(`cab.auditReporting.register.findingColumns.${c}`)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {own.map((f, i) => (
                      <tr key={f.id} data-testid="finding-row" className={cn(i % 2 && 'bg-[#f9fafc]')}>
                        <td className="px-4 py-3.5 font-medium text-neutral-900">
                          <span className="me-1.5 font-bold text-primary" dir="ltr">{f.findingCode ?? '-'}</span>
                          <span className="text-[13px] font-normal text-neutral-600">({typeLabel(t, f.findingType)})</span>
                        </td>
                        <td className="px-4 py-3.5 text-[13px] text-neutral-700">{f.requirementRef}</td>
                        <td className="max-w-xs px-4 py-3.5 text-start text-[14px] text-neutral-800">{f.statement}</td>
                        <td className="px-4 py-3.5">
                          <span className={cn('inline-flex rounded-[4px] px-3 py-1 text-[12px] font-medium', f.classification ? 'bg-[#e8edfc] text-primary' : 'bg-[#fff7ed] text-[#ea580c]')}>
                            {classificationLabel(t, f.classification)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={cn('inline-flex rounded-[4px] px-3 py-1 text-[12px] font-medium', f.status === 'Submitted' ? 'bg-[#ecfdf5] text-[#16a34a]' : 'bg-[#f3f4f6] text-neutral-700')}>
                            {t(f.status === 'Submitted' ? 'cab.auditReporting.register.findingSubmitted' : 'cab.auditReporting.register.findingDraft')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {tab === 'report' && (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className={cn(CARD, 'space-y-4 p-5')} data-testid="report-panel">
              <h2 className="text-[20px] font-bold text-neutral-900">{t('cab.auditReporting.register.reportTitle')}</h2>
              <dl className="grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
                <div><dt className="text-neutral-500">{t('cab.auditReporting.register.columns.status')}</dt><dd className="mt-1"><ReportingStatusBadge status={status} /></dd></div>
                <div><dt className="text-neutral-500">{t('cab.auditReporting.register.columns.version')}</dt><dd className="mt-1 font-semibold text-neutral-900" data-testid="report-version">{state ? `v${state.version}` : '-'}</dd></div>
                <div><dt className="text-neutral-500">{t('cab.auditReporting.register.reviewer')}</dt><dd className="mt-1 font-semibold text-neutral-900">{state?.reviewer || '-'}</dd></div>
                <div><dt className="text-neutral-500">{t('cab.auditReporting.register.issuedOn')}</dt><dd className="mt-1 font-semibold text-neutral-900" dir="ltr">{formatReportingDate(state?.issuedAt)}</dd></div>
              </dl>
              <p className="text-[13px] text-neutral-600" data-testid="report-coverage">
                {t('cab.auditReporting.register.coverageValue', { audited: row.audited, total: row.total })}
                {' · '}
                {t('cab.auditReporting.register.findingsValue', { submitted: row.submittedFindings, draft: row.draftFindings })}
              </p>
              {status === 'handoffPending' && (
                <p className="rounded-[8px] border border-[#fde68a] bg-[#fffbeb] p-3 text-[13px] text-[#b45309]">{t('stageReport.notReady.body')}</p>
              )}
              <p className="rounded-[8px] border border-[#c5d7fa] bg-[#e8edfc]/40 p-3 text-[13px] font-medium text-primary">{t('stageReport.recommendationNote')}</p>
              <div className="flex flex-wrap gap-3">
                {reportButton}
                <Link to={cabAuditExecutionPath(plan.planNumber)} className={GHOST_BTN}>{t('stageReport.backToExecution')}</Link>
              </div>
              {state && state.events.length > 0 && (
                <div>
                  <h3 className="text-[14px] font-bold text-neutral-900">{t('stageReport.history.title')}</h3>
                  <ul className="mt-2 space-y-1.5 text-[13px] text-neutral-700" data-testid="report-history">
                    {state.events.map((ev) => (
                      <li key={ev.id} className="flex flex-wrap gap-x-3">
                        <span className="text-neutral-500" dir="ltr">{formatReportingDate(ev.at)}</span>
                        <span>{t(`stageReport.history.${ev.action}`, { defaultValue: ev.action }) as string}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
            <aside className={cn(CARD, 'h-fit space-y-5 p-5')} data-testid="report-readiness">
              <div>
                <h3 className="text-[16px] font-bold text-neutral-900">{t('cab.auditReporting.register.readinessTitle')}</h3>
                <p className="mt-0.5 text-[13px] text-neutral-500">{t('cab.auditReporting.register.readinessSub')}</p>
              </div>
              {(['submit', 'issue'] as const).map((group) => (
                <div key={group}>
                  <h4 className="text-[13px] font-bold text-neutral-800">{t(`cab.auditReporting.register.readiness.${group}Title`)}</h4>
                  <p className="mt-0.5 text-[12px] text-neutral-500">{t(`cab.auditReporting.register.readiness.${group}Sub`)}</p>
                  <ul className="mt-2 space-y-2">
                    {readiness.filter((g: ReadinessItem) => g.group === group).map((g) => (
                      <li
                        key={g.id}
                        data-testid={`readiness-${g.id}`}
                        data-state={g.state}
                        className={cn(
                          'rounded-[8px] border p-3',
                          g.state === 'met' && 'border-success-200 bg-success-50',
                          g.state === 'pending' && 'border-[#fde68a] bg-[#fffbeb]',
                          g.state === 'waiting' && 'border-neutral-200 bg-neutral-50',
                        )}
                      >
                        <p className="flex items-center gap-2 text-[13px] font-bold text-neutral-800">
                          <span
                            aria-hidden
                            className={cn(
                              'flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white',
                              g.state === 'met' && 'bg-success-500',
                              g.state === 'pending' && 'bg-[#ea580c]',
                              g.state === 'waiting' && 'bg-neutral-400',
                            )}
                          >
                            {g.state === 'met' ? '✓' : g.state === 'pending' ? '!' : '…'}
                          </span>
                          <span className="min-w-0 flex-1">{t(`cab.auditReporting.register.readiness.item.${g.id}`)}</span>
                          <span
                            className={cn(
                              'shrink-0 rounded-[4px] px-2 py-0.5 text-[11px] font-medium',
                              g.state === 'met' && 'bg-[#ecfdf5] text-[#16a34a]',
                              g.state === 'pending' && 'bg-[#fff7ed] text-[#ea580c]',
                              g.state === 'waiting' && 'bg-[#f3f4f6] text-neutral-600',
                            )}
                          >
                            {t(`cab.auditReporting.register.readiness.state.${g.state}`)}
                          </span>
                        </p>
                        {g.id === 'findings' && g.state === 'pending' && (
                          <p className="mt-1 text-[12px] text-neutral-600">
                            {t('cab.auditReporting.register.readiness.draftFindings', { count: g.count ?? 0 })}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </aside>
          </div>
        )}
      </main>
    </>
  )
}

export function CabAuditReportingAuditPage() {
  return (
    <CabLayout sidebarVariant="auditReporting">
      <CabAuditReportingAuditContent />
    </CabLayout>
  )
}
