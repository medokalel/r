import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { AddCircleIcon, AppIcon, SearchIcon, DownloadTrayIcon } from '@/components/icons'
import { DEMO_SCOPE, SCHEME_RULES, buildReportGates, downloadFile, toCsv } from '@/lib/api/cabAuditReportingApi'
import { ScopeBanner, Toast } from '@/components/cab/auditReporting/shared'
import type { EvidenceTask, Finding, PageState, TabId } from '@/components/cab/auditReporting/shared'
import { SEED_EVIDENCE, SEED_FINDINGS } from '@/components/cab/auditReporting/shared'
import { cn } from '@/lib/utils'

export function CabAuditReportingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tr = (k: string, fb: string) => t(k, fb)
  const [tab, setTab] = useState<TabId>('agenda')
  const [state, setState] = useState<PageState>('ready')
  const [toast, setToast] = useState<string | null>(null)
  const [evidence, setEvidence] = useState<EvidenceTask[]>(SEED_EVIDENCE)
  const [findings] = useState<Finding[]>(SEED_FINDINGS)
  const [query, setQuery] = useState('')
  const [statusF, setStatusF] = useState('All')
  const [frozen, setFrozen] = useState(false)
  const [version, setVersion] = useState(1)
  const [reco, setReco] = useState('')
  const [conflict, setConflict] = useState(false)
  const [choice, setChoice] = useState('')
  const [modal, setModal] = useState(false)
  const [dDesc, setDDesc] = useState('')
  const [dReq, setDReq] = useState('Clause 8.5')
  const [dDate, setDDate] = useState('2025-03-14')
  void DEMO_SCOPE

  const show = (m: string) => {
    setToast(m)
    window.setTimeout(() => setToast(null), 3800)
  }

  const filtered = useMemo(
    () =>
      evidence.filter(
        (e) =>
          (statusF === 'All' || e.status === statusF) &&
          (query.trim() === '' || `${e.id} ${e.description} ${e.requirementRef}`.toLowerCase().includes(query.toLowerCase())),
      ),
    [evidence, query, statusF],
  )

  const gates = buildReportGates({
    evidenceLinked: evidence.length,
    findingsClassified: findings.filter((f) => f.classification).length,
    findingsTotal: findings.length,
    recommendation: reco,
    frozen,
  })

  const doExportEvidence = () => {
    const rows = filtered.map((e) => ({
      ID: e.id, Description: e.description, 'Audit ref': e.auditRef,
      'Requirement ref': e.requirementRef, 'Due date': e.dueDate, Status: e.status,
    }))
    downloadFile('evidence-export.csv', toCsv(rows, ['ID', 'Description', 'Audit ref', 'Requirement ref', 'Due date', 'Status']), 'text/csv')
    show(tr('cab.auditReporting.exported', 'Export prepared from all authorized matching records.'))
  }

  const doExportFindings = () => {
    const rows = findings.map((f) => ({
      ID: f.id, Type: f.type, 'Requirement ref': f.requirementRef,
      Classification: f.classification || 'Unclassified (draft)', Statement: f.statement,
      'Linked evidence': f.linkedEvidence.join('; '), Status: f.status,
    }))
    downloadFile('findings-export.csv', toCsv(rows, ['ID', 'Type', 'Requirement ref', 'Classification', 'Statement', 'Linked evidence', 'Status']), 'text/csv')
    show(tr('cab.auditReporting.exported', 'Export prepared from all authorized matching records.'))
  }

  const addEvidence = () => {
    if (!dDesc.trim()) {
      show(tr('cab.auditReporting.evidenceRequired', 'Description is required.'))
      return
    }
    const id = `EV-0${Math.floor(100 + Math.random() * 800)}`
    setEvidence((p) => [...p, { id, description: dDesc.trim(), auditRef: 'AUD-0024 · Draft area', requirementRef: dReq, dueDate: dDate, status: 'Open', selected: false }])
    setDDesc('')
    setModal(false)
    show(tr('cab.auditReporting.evidenceDraft', 'Evidence draft added — save the workspace to persist it.'))
  }

  const finalize = () => {
    const blocked = gates.filter((g) => !g.passed)
    if (blocked.length > 0) {
      show(`${tr('cab.auditReporting.blocked', 'Finalization blocked')}: ${blocked[0].label}.`)
      return
    }
    setFrozen(true)
    setVersion((v) => v + 1)
    show(tr('cab.auditReporting.reportFrozen', 'Report finalized — version frozen for technical review handoff.'))
  }

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'agenda', label: tr('cab.auditReporting.tabs.agenda', 'Agenda') },
    { id: 'evidence', label: tr('cab.auditReporting.tabs.evidence', 'Evidence') },
    { id: 'findings', label: tr('cab.auditReporting.tabs.findings', 'Findings') },
    { id: 'report', label: tr('cab.auditReporting.tabs.report', 'Report') },
  ]

  const agenda: string[][] = [
    ['09:00 – 09:30', 'Opening meeting', '—', 'Lead Auditor', 'Completed'],
    ['09:30 – 10:30', 'Management system overview', 'Clauses 4.1, 4.2', 'Lead Auditor', 'Completed'],
    ['11:00 – 12:30', 'HACCP plan', 'Clause 8.5', 'Auditor 2', 'In progress'],
    ['13:30 – 15:00', 'Operational control (production)', 'Clause 8.6', 'Auditor 2', 'Not started'],
  ]

  return (
    <CabLayout sidebarVariant="auditReporting">
      <CabHeader
        title={tr('cab.auditReporting.title', 'Audit Reporting')}
        subtitle={tr('cab.auditReporting.subtitle', 'AUD-0024 · Al Noor Food Industries · Stage 1')}
        notificationCount={3}
      />
      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <ScopeBanner title={tr('cab.auditReporting.scope', 'CAB-client scope')} />

        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <span className="font-semibold text-neutral-500">{tr('cab.auditReporting.previewStates', 'Preview states:')}</span>
          {(['ready', 'loading', 'error', 'denied'] as PageState[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setState(s)}
              className={cn(
                'rounded-full border px-3 py-1 font-semibold capitalize transition-colors',
                state === s
                  ? 'border-primary bg-primary text-white'
                  : 'border-[#d8dce5] bg-white text-neutral-600 hover:border-primary hover:text-primary'
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {state === 'loading' && (
          <section className="rounded-[16px] border border-[#ececec] bg-white p-6 space-y-3" aria-busy="true" aria-label="Loading">
            <div className="skeleton h-10 w-[92%]" />
            <div className="skeleton h-10 w-[70%]" />
            <div className="skeleton h-10 w-[55%]" />
            <p className="text-[13px] font-medium text-neutral-500">{tr('common.loading', 'Loading…')}</p>
          </section>
        )}

        {state === 'error' && (
          <section className="rounded-[16px] border border-[#ececec] bg-white p-6 text-center" role="alert">
            <p className="text-[15px] font-bold text-error-600">{t('errors.title', 'Something went wrong')}</p>
            <p className="mt-1 text-[13px] text-neutral-600">{t('errors.generic', 'We could not load the workspace. Entered values were preserved.')}</p>
            <div className="mt-4 flex justify-center">
              <button type="button" className="rounded-[var(--radius-sm)] border border-[#d8dce5] bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50" onClick={() => setState('ready')}>
                {t('errors.retry', 'Try again')}
              </button>
            </div>
          </section>
        )}

        {state === 'denied' && (
          <section className="rounded-[16px] border border-[#ececec] bg-white p-6 text-center" role="alert">
            <p className="text-[15px] font-bold text-warning-700">{tr('cab.auditReporting.deniedTitle', 'Permission required')}</p>
            <p className="mt-1 text-[13px] text-neutral-600">
              {tr('cab.auditReporting.deniedBody', 'Your role can view this workspace but cannot edit it. Contact the lead auditor, signatory authority, or decision authority.')}
            </p>
          </section>
        )}

        {state === 'ready' && (
          <>
            {/* Tabs Navigation */}
            <div className="flex gap-1.5 overflow-x-auto rounded-[16px] border border-[#ececec] bg-white p-1.5 shadow-none" role="tablist" aria-label="Workspace stages">
              {tabs.map((x) => (
                <button
                  key={x.id}
                  role="tab"
                  aria-selected={tab === x.id}
                  type="button"
                  onClick={() => setTab(x.id)}
                  className={cn(
                    'flex-1 whitespace-nowrap rounded-[10px] px-5 py-2.5 text-[14px] font-medium transition-colors',
                    tab === x.id
                      ? 'bg-[#1236a3] text-white shadow-sm'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  )}
                >
                  {x.label}
                </button>
              ))}
            </div>

            {frozen && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-success-200 bg-success-50 px-4 py-3 text-[13px]" role="status">
                <p className="font-semibold text-success-700">
                  {tr('cab.auditReporting.frozen', `Report v${version} frozen — read-only. Technical review is a separate handoff.`)}
                </p>
                <button
                  type="button"
                  className="rounded-[var(--radius-sm)] border border-neutral-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-neutral-700 hover:border-primary hover:text-primary transition-colors"
                  onClick={() => { setFrozen(false); show(tr('cab.auditReporting.unfrozen', 'New draft version opened from frozen report.')); }}
                >
                  {tr('cab.auditReporting.newVersion', 'Open new draft version')}
                </button>
              </div>
            )}

            {conflict && (
              <div className="rounded-[16px] border border-warning-300 bg-warning-50 p-5" role="alert">
                <p className="text-[14px] font-bold text-warning-700">{tr('cab.auditReporting.conflictTitle', 'Offline conflict needs reconciliation')}</p>
                <p className="mt-1 text-[13px] text-neutral-600">
                  {tr('cab.auditReporting.conflictBody', 'This workspace changed on the server while you were offline. Choose which version to keep — nothing merges silently.')}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <label className={cn('cursor-pointer rounded-[10px] border px-3 py-2 text-[13px] font-medium', choice === 'mine' ? 'border-[#1236a3] bg-[#e8edfc] text-[#1236a3]' : 'border-[#d8dce5] bg-white text-neutral-600')}>
                    <input type="radio" name="cf" className="me-1.5" checked={choice === 'mine'} onChange={() => setChoice('mine')} />
                    {tr('cab.auditReporting.keepMine', 'Keep my offline draft')}
                  </label>
                  <label className={cn('cursor-pointer rounded-[10px] border px-3 py-2 text-[13px] font-medium', choice === 'server' ? 'border-[#1236a3] bg-[#e8edfc] text-[#1236a3]' : 'border-[#d8dce5] bg-white text-neutral-600')}>
                    <input type="radio" name="cf" className="me-1.5" checked={choice === 'server'} onChange={() => setChoice('server')} />
                    {tr('cab.auditReporting.keepServer', 'Keep server version')}
                  </label>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-[13px] font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                    disabled={!choice}
                    onClick={() => { setConflict(false); setChoice(''); show(tr('cab.auditReporting.conflictResolved', 'Conflict reconciled explicitly. Values preserved.')); }}
                  >
                    {tr('cab.auditReporting.reconcile', 'Reconcile')}
                  </button>
                </div>
              </div>
            )}

            {/* Agenda Tab */}
            {tab === 'agenda' && (
              <section className="flex flex-col rounded-[16px] border border-[#ececec] bg-white py-5 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 mb-4">
                  <div>
                    <h2 className="text-[20px] font-bold text-neutral-900">{tr('cab.auditReporting.agendaTitle', 'Audit agenda — Stage 1')}</h2>
                    <p className="mt-0.5 text-[13px] text-neutral-500">{tr('cab.auditReporting.agendaSub', 'Illustrative schedule for AUD-0024 · Riyadh site.')}</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-[var(--radius-sm)] border border-[#d8dce5] bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                    onClick={() => setConflict(true)}
                  >
                    {tr('cab.auditReporting.simulateOffline', 'Simulate offline conflict')}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] border-collapse text-center">
                    <thead>
                      <tr className="bg-[#1236a3] text-white">
                        <th className="px-4 py-4 text-[14px] font-medium">{tr('cab.auditReporting.table.time', 'Time')}</th>
                        <th className="px-4 py-4 text-[14px] font-medium">{tr('cab.auditReporting.table.session', 'Session / Activity')}</th>
                        <th className="px-4 py-4 text-[14px] font-medium">{tr('cab.auditReporting.table.clauses', 'Clauses')}</th>
                        <th className="px-4 py-4 text-[14px] font-medium">{tr('cab.auditReporting.table.auditor', 'Auditor')}</th>
                        <th className="px-4 py-4 text-[14px] font-medium">{tr('cab.auditReporting.table.status', 'Status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agenda.map((r, index) => (
                        <tr key={r[1]} className={cn('transition-colors', index % 2 ? 'bg-[#f9fafc]' : '', 'hover:bg-[#e8edfc]/50')}>
                          <td className="px-4 py-4 text-[13px] font-semibold text-primary" dir="ltr">{r[0]}</td>
                          <td className="px-4 py-4 text-[14px] font-semibold text-neutral-900">{r[1]}</td>
                          <td className="px-4 py-4 text-[13px] text-neutral-600">{r[2]}</td>
                          <td className="px-4 py-4 text-[13px] text-neutral-600">{r[3]}</td>
                          <td className="px-4 py-4">
                            <span className={cn(
                              'inline-flex rounded-full px-3 py-1 text-[12px] font-medium',
                              r[4] === 'Completed' ? 'bg-[#ecfdf5] text-[#16a34a]' : r[4] === 'In progress' ? 'bg-[#e8edfc] text-primary' : 'bg-[#f3f4f6] text-neutral-600'
                            )}>
                              {r[4]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Evidence Tab */}
            {tab === 'evidence' && (
              <section className="flex flex-col rounded-[16px] border border-[#ececec] bg-white py-5 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 mb-4">
                  <div>
                    <h2 className="text-[20px] font-bold text-neutral-900">{tr('cab.auditReporting.evidenceTitle', 'Evidence tasks')}</h2>
                    <p className="mt-0.5 text-[13px] text-neutral-500">
                      {tr('cab.auditReporting.evidenceSub', 'Each item is linked to the audit and a requirement.')}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[#d8dce5] bg-white px-4 py-2.5 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                      onClick={doExportEvidence}
                    >
                      <AppIcon icon={DownloadTrayIcon} size={18} />
                      <span>{tr('cab.auditReporting.exportFiltered', 'Export filtered')}</span>
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-primary px-4 py-2.5 text-[14px] font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                      disabled={frozen}
                      onClick={() => setModal(true)}
                    >
                      <AppIcon icon={AddCircleIcon} size={18} />
                      <span>{tr('cab.auditReporting.addEvidence', 'Add evidence')}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 border-b border-[#ececec] bg-[#f8fafd] p-4 mb-2">
                  <div className="relative flex-1 min-w-[240px]">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={tr('cab.auditReporting.searchEvidencePlaceholder', 'Search ID / description / clause...')}
                      className="w-full rounded-[10px] border border-[#d8dce5] bg-white py-2.5 ps-10 pe-4 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                    />
                    <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-neutral-400">
                      <AppIcon icon={SearchIcon} size={18} />
                    </div>
                  </div>

                  <select
                    value={statusF}
                    onChange={(e) => setStatusF(e.target.value)}
                    className="rounded-[10px] border border-[#d8dce5] bg-white py-2.5 px-3 text-[14px] text-neutral-800 focus:border-primary focus:outline-none"
                  >
                    {['All', 'Open', 'Submitted', 'Verified', 'Closed'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>

                  <span className="ms-auto self-center text-[13px] font-medium text-neutral-500">
                    {filtered.length} / {evidence.length}
                  </span>
                </div>

                {filtered.length === 0 ? (
                  <div className="p-10 text-center text-neutral-500">
                    <p className="text-[14px] font-bold text-neutral-700">{tr('cab.auditReporting.emptyEvidence', 'No evidence matches these filters')}</p>
                    <button
                      type="button"
                      className="mt-4 rounded-[var(--radius-sm)] border border-[#d8dce5] px-4 py-2 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50"
                      onClick={() => { setQuery(''); setStatusF('All'); }}
                    >
                      {tr('cab.auditReporting.clearFilters', 'Clear filters')}
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] border-collapse text-center">
                      <thead>
                        <tr className="bg-[#1236a3] text-white">
                          <th className="w-10 px-4 py-4"></th>
                          <th className="px-4 py-4 text-[14px] font-medium">{tr('cab.auditReporting.table.idDesc', 'ID & Description')}</th>
                          <th className="px-4 py-4 text-[14px] font-medium">{tr('cab.auditReporting.table.auditRef', 'Audit Reference')}</th>
                          <th className="px-4 py-4 text-[14px] font-medium">{tr('cab.auditReporting.table.reqRef', 'Requirement')}</th>
                          <th className="px-4 py-4 text-[14px] font-medium">{tr('cab.auditReporting.table.dueDate', 'Due Date')}</th>
                          <th className="px-4 py-4 text-[14px] font-medium">{tr('cab.auditReporting.table.status', 'Status')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((e, index) => (
                          <tr key={e.id} className={cn('transition-colors', index % 2 ? 'bg-[#f9fafc]' : '', 'hover:bg-[#e8edfc]/50')}>
                            <td className="px-4 py-4">
                              <input
                                type="checkbox"
                                checked={e.selected}
                                disabled={frozen}
                                onChange={() => setEvidence((p) => p.map((x) => (x.id === e.id ? { ...x, selected: !x.selected } : x)))}
                                className="size-4 rounded border-[#d8dce5] text-primary focus:ring-primary"
                              />
                            </td>
                            <td className="px-4 py-4 text-start font-semibold text-neutral-900">
                              <span className="text-primary font-bold me-2">{e.id}</span>
                              {e.description}
                            </td>
                            <td className="px-4 py-4 text-[13px] text-neutral-600">{e.auditRef}</td>
                            <td className="px-4 py-4 text-[13px] text-neutral-600">{e.requirementRef}</td>
                            <td className="px-4 py-4 text-[13px] text-neutral-600">{e.dueDate}</td>
                            <td className="px-4 py-4">
                              <span className={cn(
                                'inline-flex rounded-full px-3 py-1 text-[12px] font-medium',
                                e.status === 'Verified' ? 'bg-[#ecfdf5] text-[#16a34a]' : e.status === 'Submitted' ? 'bg-[#e8edfc] text-primary' : 'bg-[#fff7ed] text-[#ea580c]'
                              )}>
                                {e.status}
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

            {/* Findings Tab */}
            {tab === 'findings' && (
              <section className="flex flex-col rounded-[16px] border border-[#ececec] bg-white py-5 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 mb-4">
                  <div>
                    <h2 className="text-[20px] font-bold text-neutral-900">{tr('cab.auditReporting.findingsTitle', 'Findings register')}</h2>
                    <p className="mt-0.5 text-[13px] text-neutral-500">{SCHEME_RULES.note}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[#d8dce5] bg-white px-4 py-2.5 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                      onClick={doExportFindings}
                    >
                      <AppIcon icon={DownloadTrayIcon} size={18} />
                      <span>{tr('cab.auditReporting.exportFiltered', 'Export filtered')}</span>
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-primary px-4 py-2.5 text-[14px] font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                      disabled={frozen}
                      onClick={() => navigate('/cab/audit-reporting/findings/new')}
                    >
                      <AppIcon icon={AddCircleIcon} size={18} />
                      <span>{tr('cab.auditReporting.addFinding', 'Add finding')}</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] border-collapse text-center">
                    <thead>
                      <tr className="bg-[#1236a3] text-white">
                        <th className="px-4 py-4 text-[14px] font-medium">{tr('cab.auditReporting.table.findingIdType', 'Finding & Type')}</th>
                        <th className="px-4 py-4 text-[14px] font-medium">{tr('cab.auditReporting.table.requirement', 'Requirement')}</th>
                        <th className="px-4 py-4 text-[14px] font-medium">{tr('cab.auditReporting.table.statement', 'Statement')}</th>
                        <th className="px-4 py-4 text-[14px] font-medium">{tr('cab.auditReporting.table.classification', 'Classification')}</th>
                        <th className="px-4 py-4 text-[14px] font-medium">{tr('cab.auditReporting.table.status', 'Status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {findings.map((f, index) => (
                        <tr key={f.id} className={cn('transition-colors', index % 2 ? 'bg-[#f9fafc]' : '', 'hover:bg-[#e8edfc]/50')}>
                          <td className="px-4 py-4 font-semibold text-neutral-900">
                            <span className="text-primary font-bold me-1.5">{f.id}</span>
                            <span className="text-[13px] text-neutral-600 font-normal">({f.type})</span>
                          </td>
                          <td className="px-4 py-4 text-[13px] text-neutral-700">{f.requirementRef}</td>
                          <td className="px-4 py-4 text-start text-[13px] text-neutral-800 max-w-xs">{f.statement}</td>
                          <td className="px-4 py-4">
                            <span className={cn(
                              'inline-flex rounded-full px-3 py-1 text-[12px] font-medium',
                              f.classification ? 'bg-[#e8edfc] text-primary' : 'bg-[#fff7ed] text-[#ea580c]'
                            )}>
                              {f.classification || tr('cab.auditReporting.unclassified', 'Unclassified — draft only')}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={cn(
                              'inline-flex rounded-full px-3 py-1 text-[12px] font-medium',
                              f.status === 'Submitted' ? 'bg-[#ecfdf5] text-[#16a34a]' : 'bg-[#f3f4f6] text-neutral-700'
                            )}>
                              {f.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Report Tab */}
            {tab === 'report' && (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                <section className="rounded-[16px] border border-[#ececec] bg-white p-5 space-y-4">
                  <h2 className="text-[20px] font-bold text-neutral-900">{tr('cab.auditReporting.finalTitle', 'Audit report finalization')}</h2>
                  <p className="text-[13px] leading-relaxed text-neutral-500">
                    {tr('cab.auditReporting.finalNote', 'Finalization freezes the version. Technical review is a separate handoff; recommendation is not a decision.')}
                  </p>

                  <div className="space-y-1.5">
                    <label htmlFor="reco" className="block text-[13px] font-medium text-neutral-800">
                      {tr('cab.auditReporting.recommendation', 'Auditor recommendation (record only)')}
                    </label>
                    <textarea
                      id="reco"
                      rows={4}
                      value={reco}
                      disabled={frozen}
                      onChange={(e) => setReco(e.target.value)}
                      className="w-full rounded-[10px] border border-[#d8dce5] bg-white p-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none min-h-24 resize-y disabled:bg-neutral-50"
                      placeholder="Recommend progression subject to closure per scheme rules"
                    />
                  </div>

                  <div className="rounded-[12px] border border-[#c5d7fa] bg-[#e8edfc]/40 p-4 text-[13px] leading-relaxed text-primary">
                    {tr('cab.auditReporting.decisionSep', 'Recommendations here are not a certification decision. Review is a separate handoff after freeze.')}
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-primary px-5 py-2.5 text-[14px] font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                      disabled={frozen}
                      onClick={finalize}
                    >
                      {tr('cab.auditReporting.finalize', 'Finalize & freeze version')}
                    </button>
                    {frozen && (
                      <button
                        type="button"
                        className="rounded-[var(--radius-sm)] border border-[#d8dce5] bg-white px-4 py-2.5 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                        onClick={() => navigate('/cab/decisions')}
                      >
                        {tr('cab.auditReporting.toReview', 'Go to technical review handoff')}
                      </button>
                    )}
                  </div>
                </section>

                <aside className="rounded-[16px] border border-[#ececec] bg-white h-fit p-5">
                  <h3 className="text-[16px] font-bold text-neutral-900">{tr('cab.auditReporting.gatesTitle', 'Submission gates')}</h3>
                  <p className="mt-0.5 text-[13px] text-neutral-500">
                    {tr('cab.auditReporting.gatesSub', 'Draft saves any time. Finalization requires every gate.')}
                  </p>
                  <ul className="mt-4 space-y-3">
                    {gates.map((g) => (
                      <li key={g.id} className={cn('rounded-[12px] border p-3.5', g.passed ? 'border-success-200 bg-success-50' : 'border-neutral-200 bg-neutral-50')}>
                        <p className={cn('flex items-center gap-2 text-[13px] font-bold', g.passed ? 'text-success-700' : 'text-neutral-600')}>
                          <span aria-hidden className={cn('flex size-5 items-center justify-center rounded-full text-[11px] text-white', g.passed ? 'bg-success-500' : 'bg-neutral-400')}>✓</span>
                          {g.label}
                        </p>
                        <p className="mt-1 text-[12px] text-neutral-500">{g.hint}</p>
                      </li>
                    ))}
                  </ul>
                </aside>
              </div>
            )}
          </>
        )}
      </main>

      {toast && <Toast message={toast} />}

      {/* Add Evidence Modal */}
      {modal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-neutral-900/50 p-4" role="dialog" aria-modal="true" aria-label="Add evidence">
          <div className="rounded-[16px] border border-[#ececec] bg-white w-full max-w-md space-y-4 p-6 shadow-2xl">
            <h3 className="text-[16px] font-bold text-neutral-900">{tr('cab.auditReporting.addEvidenceTitle', 'Add evidence task (draft)')}</h3>
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-neutral-800">{tr('cab.auditReporting.desc', 'Description')} *</label>
              <input
                value={dDesc}
                onChange={(e) => setDDesc(e.target.value)}
                className="w-full rounded-[10px] border border-[#d8dce5] bg-white py-2.5 px-3 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                placeholder="e.g. Temperature log records"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-neutral-800">{tr('cab.auditReporting.reqRef', 'Requirement ref')} *</label>
                <input
                  value={dReq}
                  onChange={(e) => setDReq(e.target.value)}
                  className="w-full rounded-[10px] border border-[#d8dce5] bg-white py-2.5 px-3 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-neutral-800">{tr('cab.auditReporting.dueDate', 'Due date')}</label>
                <input
                  type="date"
                  value={dDate}
                  onChange={(e) => setDDate(e.target.value)}
                  className="w-full rounded-[10px] border border-[#d8dce5] bg-white py-2.5 px-3 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <p className="text-[12px] text-neutral-500">{tr('cab.auditReporting.nestedDraft', 'Stays draft until the workspace is saved. Failed saves preserve values.')}</p>
            <div className="flex justify-end gap-2 border-t border-[#ececec] pt-4">
              <button
                type="button"
                className="rounded-[var(--radius-sm)] border border-[#d8dce5] bg-white px-4 py-2 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50"
                onClick={() => setModal(false)}
              >
                {tr('common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                className="rounded-[var(--radius-sm)] bg-primary px-5 py-2 text-[14px] font-medium text-white hover:bg-primary/90"
                onClick={addEvidence}
              >
                {tr('cab.auditReporting.addEvidence', 'Add evidence')}
              </button>
            </div>
          </div>
        </div>
      )}
    </CabLayout>
  )
}
