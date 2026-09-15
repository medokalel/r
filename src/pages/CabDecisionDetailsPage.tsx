import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { Button } from '@/components/ui/Button'
import {
  AppIcon,
  ArrowRightIcon,
  CommentIcon,
  HistoryIcon,
  InfoIcon,
  LockIcon,
  ShieldIcon,
  SuccessCircleIcon,
  UsersIcon,
} from '@/components/icons'
import {
  DECISION_FIELD_KEYS,
  DECISION_OUTCOME_OPTIONS,
  evaluateGates,
  getDecisionById,
  openCorrectionVersion,
  recordDecision,
  saveDecisionDraft,
  type DecisionDetail,
  type DecisionOutcome,
  type DraftInput,
} from '@/lib/api/cabDecisionsApi'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

const cardClassName = 'rounded-[16px] border border-[#ececec] bg-white'

type TabKey = 'evidence' | 'findings' | 'activity'

function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: 'amber' | 'green' | 'red' | 'blue' | 'neutral' }) {
  const tones: Record<string, string> = {
    amber: 'bg-[#fff7e6] text-[#d97706]',
    green: 'bg-[#eafaf1] text-[#22c55e]',
    red: 'bg-[#fde8e8] text-[#e74c3c]',
    blue: 'bg-[#e8edfc] text-[#1236a3]',
    neutral: 'bg-[#f3f4f6] text-neutral-600',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none', tones[tone])}>
      {label}
    </span>
  )
}

function GateRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[13px] text-neutral-600">{label}</span>
      {ok ? (
        <AppIcon icon={SuccessCircleIcon} size={16} className="text-[#22c55e]" />
      ) : (
        <span className="flex size-4 items-center justify-center text-[11px] font-bold text-[#e74c3c]">✕</span>
      )}
    </div>
  )
}

function SummaryField({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[13px] font-medium text-neutral-900">
        {icon && <span className="shrink-0 text-neutral-400">{icon}</span>}
        <span className="min-w-0 break-words">{value || '—'}</span>
      </p>
    </div>
  )
}

export function CabDecisionDetailsPage() {
  const { decisionId } = useParams<{ decisionId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [detail, setDetail] = useState<DecisionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [notFound, setNotFound] = useState(false)

  // Draft form — stable keys via DECISION_FIELD_KEYS (shared with the portal).
  const [outcome, setOutcome] = useState<DecisionOutcome | ''>('')
  const [rationale, setRationale] = useState('')
  const [decisionMakerId, setDecisionMakerId] = useState('')
  const [decisionDate, setDecisionDate] = useState('')
  const [confirmedScope, setConfirmedScope] = useState('')

  const [dirty, setDirty] = useState(false)
  const [showDiscard, setShowDiscard] = useState(false)
  const [saving, setSaving] = useState<'draft' | 'record' | 'correction' | null>(null)
  const [saveError, setSaveError] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('evidence')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    setNotFound(false)
    try {
      const d = await getDecisionById(decisionId || '')
      if (!d) {
        setNotFound(true)
        setDetail(null)
        return
      }
      const preferred = d.decisionMakers.find((m) => m.authorized && m.independentFromAudit)
      setDetail(d)
      setOutcome(d.record.outcome ?? '')
      setRationale(d.record.rationale || '')
      setDecisionMakerId(d.record.decisionMakerId || preferred?.id || '')
      setDecisionDate(d.record.decisionDate || d.dueDateRaw || '')
      setConfirmedScope(d.record.confirmedScope || d.proposedScope)
      setDirty(false)
      setSaveError('')
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load decision.')
    } finally {
      setLoading(false)
    }
  }, [decisionId])

  useEffect(() => {
    void load()
  }, [load])

  const draft = useMemo<DraftInput>(
    () => ({ outcome: outcome || null, rationale, decisionMakerId, decisionDate, confirmedScope }),
    [outcome, rationale, decisionMakerId, decisionDate, confirmedScope],
  )

  const gates = useMemo(() => (detail ? evaluateGates(detail, draft) : null), [detail, draft])

  const gateRows = gates
    ? [
        { label: 'Technical review completed', ok: gates.technicalReviewCompleted },
        { label: 'Findings closed or accepted', ok: gates.findingsClosed },
        { label: 'Decision maker authorized', ok: gates.makerAuthorized },
        { label: 'Decision maker independent from audit', ok: gates.makerIndependent },
        { label: 'Confirmed scope provided', ok: gates.scopeOk },
        { label: 'Rationale provided', ok: gates.rationaleOk },
        { label: 'Decision date provided', ok: gates.dateOk },
      ]
    : []

  const immutable = Boolean(detail?.record.immutable)
  const record = detail?.record

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3200)
  }

  const handleSaveDraft = async () => {
    if (!detail) return
    setSaving('draft')
    setSaveError('')
    try {
      // Draft save permits incomplete later-stage data — gates are never validated here.
      const updated = await saveDecisionDraft(detail.id, { ...draft, version: detail.record.version })
      setDetail(updated)
      setDirty(false)
      showToast('Draft saved — your values are preserved.')
    } catch (e) {
      // A failed save keeps the in-form values intact.
      setSaveError(e instanceof Error ? e.message : 'Save failed. Your values were preserved.')
      if ((e as Error & { code?: string }).code === 'CONFLICT_IMMUTABLE') {
        void load()
      }
    } finally {
      setSaving(null)
    }
  }

  const handleRecordDecision = async () => {
    if (!detail || !draft.outcome) {
      setSaveError('Select an outcome before recording the decision.')
      return
    }
    if (gates && !gates.canRecord) {
      setSaveError(gates.blockers.join(' '))
      return
    }
    setSaving('record')
    setSaveError('')
    try {
      // Submission requires configured gates; recorded outcome is immutable.
      const updated = await recordDecision(detail.id, { ...draft, outcome: draft.outcome as DecisionOutcome })
      setDetail(updated)
      setDirty(false)
      const label = DECISION_OUTCOME_OPTIONS.find((o) => o.value === updated.record.outcome)?.label ?? updated.record.outcome ?? ''
      showToast(
        updated.record.outcome === 'grant'
          ? `Decision recorded (${label}). Certificate issuance is now enabled for this client.`
          : `Decision recorded (${label}).`,
      )
    } catch (e) {
      const code = (e as Error & { code?: string }).code
      if (code === 'CONFLICT_IMMUTABLE') {
        setSaveError('This outcome was already recorded elsewhere. The immutable record is shown — corrections require a controlled version.')
        void load()
      } else {
        setSaveError(e instanceof Error ? e.message : 'Failed to record the decision.')
      }
    } finally {
      setSaving(null)
    }
  }

  const handleOpenCorrection = async () => {
    if (!detail) return
    setSaving('correction')
    setSaveError('')
    try {
      const updated = await openCorrectionVersion(detail.id)
      setDetail(updated)
      setDirty(false)
      showToast(`Controlled correction version v${updated.record.version} opened — every change stays traceable.`)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to open correction version.')
    } finally {
      setSaving(null)
    }
  }

  const goBack = () => {
    if (dirty) {
      setShowDiscard(true)
      return
    }
    navigate(ROUTES.cabDecisions)
  }

  if (loading) {
    return (
      <CabLayout sidebarVariant="decisions">
        <CabHeader title={t('cab.decisions.header', 'Decisions')} />
        <div className="flex flex-1 flex-col gap-4 overflow-auto p-6 lg:p-8">
          <div className="h-5 w-44 rounded-md bg-[#e8edfc]" aria-hidden />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className={cn(cardClassName, 'min-h-[360px] p-5')}>
              <div className="skeleton h-5 w-44" />
              <div className="mt-5 space-y-3">
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-4 w-5/6" />
              </div>
            </div>
            <div className={cn(cardClassName, 'min-h-[360px] p-5')}>
              <div className="skeleton h-5 w-36" />
              <div className="mt-5 space-y-3">
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </CabLayout>
    )
  }

  if (notFound) {
    return (
      <CabLayout sidebarVariant="decisions">
        <CabHeader title={t('cab.decisions.header', 'Decisions')} />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className={cn(cardClassName, 'mx-auto max-w-md p-8 text-center')}>
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[#fde8e8] text-[#e74c3c]">
              <AppIcon icon={LockIcon} size={22} />
            </div>
            <h2 className="text-[15px] font-bold text-neutral-900">Decision not available</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
              This record does not exist or your account cannot access it. Decision records are scoped to a single CAB-client
              relationship and are never shared across tenants.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.cabDecisions)}>
                Back to decision queue
              </Button>
            </div>
          </div>
        </div>
      </CabLayout>
    )
  }

  if (loadError || !detail) {
    return (
      <CabLayout sidebarVariant="decisions">
        <CabHeader title={t('cab.decisions.header', 'Decisions')} />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className={cn(cardClassName, 'mx-auto max-w-md p-8 text-center')}>
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[#fde8e8] text-[#e74c3c]">
              <AppIcon icon={SuccessCircleIcon} size={22} />
            </div>
            <h2 className="text-[15px] font-bold text-neutral-900">Something went wrong</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
              {loadError || 'We could not load this decision record.'}
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => void load()}>
                Try again
              </Button>
            </div>
          </div>
        </div>
      </CabLayout>
    )
  }

  const selectedMaker = detail.decisionMakers.find((m) => m.id === decisionMakerId) ?? null
  const recordMaker = record?.decisionMakerId ? detail.decisionMakers.find((m) => m.id === record!.decisionMakerId) : null

  return (
    <CabLayout sidebarVariant="decisions">
      <CabHeader title={detail.decisionId} subtitle={t('cab.decisions.header', 'Decisions')} notificationCount={2} />

      <div className="flex flex-1 flex-col gap-4 overflow-auto p-4 sm:p-6 lg:p-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[12px] font-medium text-neutral-400">
          <button type="button" onClick={goBack} className="hover:text-primary">
            Decisions
          </button>
          <span>/</span>
          <span className="text-neutral-600">{detail.decisionId}</span>
        </nav>

        {/* Page header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-[#e8edfc] text-[#1236a3]">
              <AppIcon icon={SuccessCircleIcon} size={22} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[22px] font-bold leading-none text-neutral-900">{detail.decisionId}</h1>
                <StatusBadge
                  label={immutable && record ? `Recorded — v${record.version}` : detail.reviewStatusLabel}
                  tone={immutable ? 'green' : detail.reviewStatus === 'awaiting_technical_review' ? 'amber' : detail.reviewStatus === 'decided_refused' ? 'red' : 'blue'}
                />
              </div>
              <p className="mt-1 text-[13px] text-neutral-500">
                {detail.clientName} · {detail.scheme}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={goBack}>
              <AppIcon icon={ArrowRightIcon} size={14} className="rotate-180 rtl:rotate-0" />
              Queue
            </Button>
            {immutable ? (
              <Button variant="outline" size="sm" onClick={() => void handleOpenCorrection()} disabled={saving === 'correction'}>
                <AppIcon icon={HistoryIcon} size={14} />
                {saving === 'correction' ? 'Opening…' : 'Open controlled correction'}
              </Button>
            ) : (
              <Button size="sm" onClick={() => void handleRecordDecision()} disabled={saving === 'record'}>
                <AppIcon icon={LockIcon} size={14} />
                {saving === 'record' ? 'Recording…' : 'Record decision'}
              </Button>
            )}
          </div>
        </div>

        {saveError && (
          <div className="flex items-start gap-2 rounded-[12px] border border-[#fbc5c5] bg-[#fef2f2] px-4 py-3 text-[13px] font-medium text-[#b91c1c]">
            <AppIcon icon={InfoIcon} size={16} className="mt-0.5 shrink-0" />
            <span className="min-w-0">{saveError}</span>
            <button type="button" onClick={() => setSaveError('')} className="ms-auto shrink-0 hover:opacity-70" aria-label="Dismiss">
              ✕
            </button>
          </div>
        )}

        <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* LEFT column */}
          <div className="flex min-w-0 flex-col gap-4">
            {/* Readiness gates */}
            <section className={cn(cardClassName, 'overflow-hidden')}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ececec] px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <AppIcon icon={ShieldIcon} size={17} className="text-primary" />
                  <h2 className="text-[14px] font-bold text-neutral-900">Readiness to record</h2>
                </div>
                {gates?.canRecord ? <StatusBadge label="All gates passed" tone="green" /> : <StatusBadge label="Incomplete" tone="amber" />}
              </div>
              <div className="px-5 py-4">
                <div className="grid grid-cols-1 gap-x-8 gap-y-0.5 sm:grid-cols-2">
                  {gateRows.map((g) => (
                    <GateRow key={g.label} label={g.label} ok={g.ok} />
                  ))}
                </div>
                {gates && gates.blockers.length > 0 && (
                  <div className="mt-4 rounded-[10px] border border-[#fde2e2] bg-[#fff7f7] px-3.5 py-3">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[#e74c3c]">Blocking gates</p>
                    <ul className="mt-1.5 list-disc space-y-1 ps-4 text-[13px] text-[#7f1d1d]">
                      {gates.blockers.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-4 flex items-start gap-2 rounded-[10px] bg-[#eef2ff] px-3.5 py-3 text-[12px] leading-relaxed text-[#3730a3]">
                  <AppIcon icon={InfoIcon} size={15} className="mt-0.5 shrink-0" />
                  <p>
                    A certification decision is separate from application acceptance. Certificates are enabled only after an
                    authorized grant decision is recorded — no automated grant is made based on payment.
                  </p>
                </div>
              </div>
            </section>
{/* Decision record / immutable outcome */}
            <section className={cn(cardClassName, 'overflow-hidden')}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ececec] px-5 py-3.5">
                <div className="flex items-center gap-2">
                  {immutable ? <AppIcon icon={LockIcon} size={16} className="text-[#22c55e]" /> : <AppIcon icon={HistoryIcon} size={16} className="text-primary" />}
                  <h2 className="text-[14px] font-bold text-neutral-900">{immutable ? 'Recorded decision (immutable)' : 'Decision record'}</h2>
                </div>
                {immutable ? <StatusBadge label={`v${record?.version ?? 1} · recorded`} tone="green" /> : <StatusBadge label={`v${record?.version ?? 1} · draft`} tone="neutral" />}
              </div>

              {immutable && record ? (
                <div className="px-5 py-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <SummaryField
                      label="Outcome"
                      value={record.outcome ? (DECISION_OUTCOME_OPTIONS.find((o) => o.value === record.outcome)?.label ?? record.outcome) : ''}
                    />
                    <SummaryField label="Decision maker" value={recordMaker?.name ?? record.decisionMakerId ?? ''} />
                    <SummaryField label="Decision date" value={record.decisionDate || ''} />
                    <SummaryField label="Recorded by" value={`${record.recordedBy ?? ''}${record.recordedAt ? ` · ${record.recordedAt}` : ''}`} />
                    <div className="sm:col-span-2">
                      <SummaryField label="Confirmed scope" value={record.confirmedScope} />
                    </div>
                    <div className="sm:col-span-2">
                      <SummaryField label="Rationale" value={record.rationale} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-start gap-2 rounded-[10px] border border-[#d1fae5] bg-[#f0fdf6] px-3.5 py-3 text-[12px] leading-relaxed text-[#166534]">
                    <AppIcon icon={LockIcon} size={15} className="mt-0.5 shrink-0" />
                    <p>
                      Recorded outcomes are immutable. Changes are only possible through a controlled correction version that
                      keeps the full decision history.
                    </p>
                  </div>
                </div>
              ) : (
                <form className="px-5 py-4" onSubmit={(e) => { e.preventDefault(); void handleRecordDecision() }}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-neutral-700">
                      Outcome
                      <select
                        name={DECISION_FIELD_KEYS.outcome}
                        value={outcome}
                        onChange={(e) => { setOutcome(e.target.value as DecisionOutcome | ''); setDirty(true); setSaveError('') }}
                        className={cn(
                          'h-10 w-full cursor-pointer rounded-[8px] border bg-white px-2.5 text-[13px] font-normal text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10',
                          dirty && outcome === '' ? 'border-[#e74c3c]' : 'border-neutral-200',
                        )}
                      >
                        <option value="">Select outcome…</option>
                        {DECISION_OUTCOME_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      {outcome === 'grant' && (
                        <span className="text-[11px] font-normal text-neutral-500">
                          Certificates become available only after this grant is recorded.
                        </span>
                      )}
                    </label>

                    <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-neutral-700">
                      Decision date
                      <input
                        type="date"
                        name={DECISION_FIELD_KEYS.decisionDate}
                        value={decisionDate}
                        onChange={(e) => { setDecisionDate(e.target.value); setDirty(true); setSaveError('') }}
                        className="h-10 w-full rounded-[8px] border border-neutral-200 bg-white px-2.5 text-[13px] text-neutral-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </label>

                    <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-neutral-700">
                      Confirmed scope
                      <textarea
                        name={DECISION_FIELD_KEYS.confirmedScope}
                        value={confirmedScope}
                        rows={3}
                        onChange={(e) => { setConfirmedScope(e.target.value); setDirty(true); setSaveError('') }}
                        className="w-full resize-y rounded-[8px] border border-neutral-200 bg-white px-2.5 py-2 text-[13px] leading-relaxed text-neutral-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </label>

                    <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-neutral-700 sm:col-span-2">
                      Rationale
                      <textarea
                        name={DECISION_FIELD_KEYS.rationale}
                        value={rationale}
                        rows={4}
                        onChange={(e) => { setRationale(e.target.value); setDirty(true); setSaveError('') }}
                        placeholder="Explain your decision. Written notes take precedence over any generated microcopy shown to the client."
                        className="w-full resize-y rounded-[8px] border border-neutral-200 bg-white px-2.5 py-2 text-[13px] leading-relaxed text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </label>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-[#ececec] pt-4">
                    <Button type="button" variant="outline" size="sm" onClick={() => void handleSaveDraft()} disabled={saving === 'draft'}>
                      {saving === 'draft' ? 'Saving…' : 'Save draft'}
                    </Button>
                    <Button type="button" size="sm" onClick={() => void handleRecordDecision()} disabled={saving === 'record' || !outcome}>
                      {saving === 'record' ? 'Recording…' : 'Record decision'}
                    </Button>
                  </div>
                  <p className="mt-2 text-[11px] text-neutral-400">
                    Saving a draft keeps incomplete data. Recording requires all gates above to pass.
                  </p>
                </form>
              )}
            </section>

            {/* Evidence / Findings / Activity tabs */}
            <section className={cn(cardClassName, 'overflow-hidden')}>
              <div className="flex flex-wrap items-center gap-1 overflow-x-auto border-b border-[#ececec] px-2">
                {([
                  { key: 'evidence', label: 'Evidence', icon: LockIcon },
                  { key: 'findings', label: 'Findings', icon: ShieldIcon },
                  { key: 'activity', label: 'Activity', icon: HistoryIcon },
                ] as Array<{ key: TabKey; label: string; icon: typeof LockIcon }>).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-semibold transition-colors',
                      activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-800',
                    )}
                  >
                    <AppIcon icon={tab.icon} size={14} />
                    {tab.label}
                    {tab.key === 'evidence' && detail.evidence.length > 0 && (
                      <span className="rounded-full bg-[#e8edfc] px-1.5 text-[11px] font-semibold text-[#1236a3]">{detail.evidence.length}</span>
                    )}
                    {tab.key === 'findings' && detail.findings.length > 0 && (
                      <span className="rounded-full bg-[#e8edfc] px-1.5 text-[11px] font-semibold text-[#1236a3]">{detail.findings.length}</span>
                    )}
                  </button>
                ))}
              </div>

              {activeTab === 'evidence' && (
                <div className="px-5 py-4">
                  <ul className="space-y-3">
                    {detail.evidence.length === 0 ? (
                      <li className="text-[13px] text-neutral-400">No evidence documents recorded.</li>
                    ) : (
                      detail.evidence.map((doc) => (
                        <li key={doc.id} className="flex items-start justify-between gap-3 rounded-[10px] border border-[#ececec] px-3.5 py-3">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-neutral-900">{doc.name}</p>
                            <p className="mt-0.5 text-[12px] text-neutral-500">{doc.docTypeLabel} · v{doc.version} · {doc.date}</p>
                          </div>
                          <span
                            className={cn(
                              'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold',
                              doc.status === 'Final'
                                ? 'bg-[#eafaf1] text-[#16a34a]'
                                : doc.status === 'Open'
                                  ? 'bg-[#fff7e6] text-[#d97706]'
                                  : 'bg-[#e8edfc] text-[#1236a3]',
                            )}
                          >
                            {doc.status}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}

              {activeTab === 'findings' && (
                <div className="px-5 py-4">
                  <ul className="space-y-3">
                    {detail.findings.length === 0 ? (
                      <li className="text-[13px] text-neutral-400">No audit findings recorded.</li>
                    ) : (
                      detail.findings.map((f) => (
                        <li key={f.id} className="rounded-[10px] border border-[#ececec] px-3.5 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[13px] font-semibold text-neutral-900">{f.requirement}</p>
                            <span
                              className={cn(
                                'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold',
                                f.severity === 'Major' ? 'bg-[#fde8e8] text-[#e74c3c]' : 'bg-[#fff7e6] text-[#d97706]',
                              )}
                            >
                              {f.severity}
                            </span>
                          </div>
                          <p className="mt-1 text-[12px] leading-relaxed text-neutral-600">{f.description}</p>
                          <p className="mt-1.5 text-[11px] font-medium text-neutral-500">Status: {f.status}</p>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="px-5 py-4">
                  <ul className="space-y-3">
                    {detail.activity.length === 0 ? (
                      <li className="text-[13px] text-neutral-400">No activity recorded yet.</li>
                    ) : (
                      detail.activity.map((a) => (
                        <li key={a.id} className="flex items-start gap-3">
                          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#c7d2fe]" />
                          <div className="min-w-0">
                            <p className="text-[13px] text-neutral-800">{a.text}</p>
                            <p className="mt-0.5 text-[11px] text-neutral-400">{a.by} · {a.at}</p>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </section>
          </div>
          <aside className="flex min-w-0 flex-col gap-4">
            {/* Decision maker */}
            <section className={cn(cardClassName, 'overflow-hidden')}>
              <div className="flex items-center gap-2 border-b border-[#ececec] px-5 py-3.5">
                <AppIcon icon={UsersIcon} size={16} className="text-primary" />
                <h2 className="text-[14px] font-bold text-neutral-900">Decision maker</h2>
              </div>
              <div className="px-5 py-4">
                {immutable ? (
                  <SummaryField label="Decision maker" value={recordMaker?.name ?? record?.decisionMakerId ?? '—'} />
                ) : (
                  <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-neutral-700">
                    Decision maker
                    <select
                      name={DECISION_FIELD_KEYS.decisionMaker}
                      value={decisionMakerId}
                      onChange={(e) => { setDecisionMakerId(e.target.value); setDirty(true); setSaveError('') }}
                      className="h-10 w-full cursor-pointer rounded-[8px] border border-neutral-200 bg-white px-2.5 text-[13px] font-normal text-neutral-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="">Select decision maker…</option>
                      {detail.decisionMakers.map((maker) => (
                        <option key={maker.id} value={maker.id}>
                          {maker.name}
                          {maker.authorized ? ' — authorized' : ''}
                          {maker.independentFromAudit ? '' : ' (audit team)'}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {selectedMaker && (
                  <span
                    className={cn(
                      'mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-normal',
                      !selectedMaker.authorized || !selectedMaker.independentFromAudit ? 'text-[#d97706]' : 'text-[#16a34a]',
                    )}
                  >
                    {selectedMaker.authorized ? '✓ Authorized decision maker' : '✕ Not in decision authority'}
                    {selectedMaker.independentFromAudit ? '· ✓ Independent from audit' : '· ✕ Part of audit team'}
                  </span>
                )}
                <div className="mt-4 flex items-start gap-2 rounded-[10px] bg-[#eef2ff] px-3.5 py-3 text-[12px] leading-relaxed text-[#3730a3]">
                  <AppIcon icon={InfoIcon} size={15} className="mt-0.5 shrink-0" />
                  <p>Authorization and audit independence are verified separately from auditor roles and are required before recording a grant.</p>
                </div>
              </div>
            </section>

            {/* Application summary */}
            <section className={cn(cardClassName, 'overflow-hidden')}>
              <div className="border-b border-[#ececec] px-5 py-3.5">
                <h2 className="text-[14px] font-bold text-neutral-900">Application summary</h2>
              </div>
              <div className="space-y-3.5 px-5 py-4">
                <SummaryField label="Client" value={detail.clientName} />
                <SummaryField label="Application" value={detail.applicationId} />
                <SummaryField label="Scheme" value={detail.applicationScheme || detail.scheme} />
                <SummaryField label="Country" value={detail.clientCountry || detail.country} />
                <SummaryField label="Stage" value={`${detail.currentStage}${detail.currentStageDetail ? ` — ${detail.currentStageDetail}` : ''}`} />
                <div className="grid grid-cols-2 gap-3">
                  <SummaryField label="Received" value={detail.receivedDate} />
                  <SummaryField label="Due" value={detail.dueDate} />
                </div>
              </div>
            </section>

            {/* Technical recommendation */}
            {detail.recommendationText && (
              <section className={cn(cardClassName, 'overflow-hidden')}>
                <div className="flex items-center gap-2 border-b border-[#ececec] px-5 py-3.5">
                  <AppIcon icon={CommentIcon} size={15} className="text-primary" />
                  <h2 className="text-[14px] font-bold text-neutral-900">Technical recommendation</h2>
                </div>
                <div className="space-y-3 px-5 py-4">
                  <SummaryField label="Recommended by" value={`${detail.recommendationBy}${detail.recommendationDate ? ` · ${detail.recommendationDate}` : ''}`} />
                  <p className="text-[13px] leading-relaxed text-neutral-700">{detail.recommendationText}</p>
                </div>
              </section>
            )}
          </aside>
        </div>
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-[12px] border border-[#d1fae5] bg-[#f0fdf6] px-4 py-3 text-[13px] font-medium text-[#166534] shadow-lg">
            <AppIcon icon={SuccessCircleIcon} size={16} />
            {toast}
          </div>
        )}
        {showDiscard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <div className="w-full max-w-sm rounded-[16px] border border-[#ececec] bg-white p-6 shadow-xl">
              <h2 className="text-[15px] font-bold text-neutral-900">Discard unsaved changes?</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
                You have unsaved changes to this decision draft. Leaving now will discard them.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowDiscard(false)}>
                  Keep editing
                </Button>
                <Button type="button" size="sm" onClick={() => { setShowDiscard(false); navigate(ROUTES.cabDecisions) }}>
                  Discard & leave
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CabLayout>
  )
}