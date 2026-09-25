import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useDecisionDetailsTourSteps } from '@/config/decisionDetailsTourSteps'
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
    <span className={cn('inline-flex items-center rounded-[6px] px-3 py-1.5 text-[13px] font-medium leading-none', tones[tone])}>
      {label}
    </span>
  )
}

function GateRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[13px] text-neutral-700">{label}</span>
      {ok ? (
        <AppIcon icon={SuccessCircleIcon} size={16} className="text-[#22c55e]" />
      ) : (
        <span className="flex size-4 items-center justify-center text-[12px] font-bold text-[#e74c3c]">✕</span>
      )}
    </div>
  )
}

function SummaryField({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[13px] font-medium text-neutral-500">{label}</p>
      <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[14px] font-semibold text-neutral-900">
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
  const tourSteps = useDecisionDetailsTourSteps()

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
        { label: t('cab.decisionDetails.gates.technicalReview', 'Technical review completed'), ok: gates.technicalReviewCompleted },
        { label: t('cab.decisionDetails.gates.findingsClosed', 'Findings closed or accepted'), ok: gates.findingsClosed },
        { label: t('cab.decisionDetails.gates.makerAuthorized', 'Decision maker authorized'), ok: gates.makerAuthorized },
        { label: t('cab.decisionDetails.gates.makerIndependent', 'Decision maker independent from audit'), ok: gates.makerIndependent },
        { label: t('cab.decisionDetails.gates.scopeOk', 'Confirmed scope provided'), ok: gates.scopeOk },
        { label: t('cab.decisionDetails.gates.rationaleOk', 'Rationale provided'), ok: gates.rationaleOk },
        { label: t('cab.decisionDetails.gates.dateOk', 'Decision date provided'), ok: gates.dateOk },
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
      showToast(t('cab.decisionDetails.draftSaved', 'Draft saved — your values are preserved.'))
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
      setSaveError(t('cab.decisionDetails.selectOutcomeBefore', 'Select an outcome before recording the decision.'))
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
      <CabLayout sidebarVariant="decisions" tourId="cab-decision-details" tourSteps={tourSteps}>
        <CabHeader title={t('cab.decisionDetails.header', 'Decisions')} />
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
      <CabLayout sidebarVariant="decisions" tourId="cab-decision-details" tourSteps={tourSteps}>
        <CabHeader title={t('cab.decisionDetails.header', 'Decisions')} />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className={cn(cardClassName, 'mx-auto max-w-md p-8 text-center')}>
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[#fde8e8] text-[#e74c3c]">
              <AppIcon icon={LockIcon} size={22} />
            </div>
            <h2 className="text-[15px] font-bold text-neutral-900">{t('cab.decisionDetails.notFound.title', 'Decision not available')}</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
              {t('cab.decisionDetails.notFound.message', 'This record does not exist or your account cannot access it. Decision records are scoped to a single CAB-client relationship and are never shared across tenants.')}
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.cabDecisions)}>
                {t('cab.decisionDetails.notFound.back', 'Back to decision queue')}
              </Button>
            </div>
          </div>
        </div>
      </CabLayout>
    )
  }

  if (loadError || !detail) {
    return (
      <CabLayout sidebarVariant="decisions" tourId="cab-decision-details" tourSteps={tourSteps}>
        <CabHeader title={t('cab.decisionDetails.header', 'Decisions')} />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className={cn(cardClassName, 'mx-auto max-w-md p-8 text-center')}>
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[#fde8e8] text-[#e74c3c]">
              <AppIcon icon={SuccessCircleIcon} size={22} />
            </div>
            <h2 className="text-[15px] font-bold text-neutral-900">{t('errors.title', 'Something went wrong')}</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
              {loadError || t('errors.generic', 'We could not load this decision record.')}
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => void load()}>
                {t('errors.retry', 'Try again')}
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
    <CabLayout sidebarVariant="decisions" tourId="cab-decision-details" tourSteps={tourSteps}>
      <CabHeader title={detail.decisionId} subtitle={t('cab.decisionDetails.header', 'Decisions')} notificationCount={2} />

      <div className="flex flex-1 flex-col gap-4 overflow-auto p-4 sm:p-6 lg:p-8">
        {/* Breadcrumb & Header Bar */}
        <CabTourStep steps={tourSteps} stepId="decision-details-header">
          <div className="flex flex-col gap-3">
            <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-500">
              <button type="button" onClick={goBack} className="hover:text-primary transition-colors">
                {t('cab.decisionDetails.header', 'Decisions')}
              </button>
              <span>/</span>
              <span className="text-neutral-800 font-semibold">{detail.decisionId}</span>
            </nav>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[8px] bg-[#e8edfc] text-[#1236a3]">
                  <AppIcon icon={SuccessCircleIcon} size={22} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-[20px] font-bold leading-tight text-neutral-900">{detail.decisionId}</h1>
                    <StatusBadge
                      label={immutable && record ? `${t('cab.decisionDetails.recordedTag', 'Recorded')} — v${record.version}` : detail.reviewStatusLabel}
                      tone={immutable ? 'green' : detail.reviewStatus === 'awaiting_technical_review' ? 'amber' : detail.reviewStatus === 'decided_refused' ? 'red' : 'blue'}
                    />
                  </div>
                  <p className="mt-1 text-[13px] text-neutral-500">
                    {detail.clientName} · {detail.scheme}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex h-11 items-center gap-2 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <AppIcon icon={ArrowRightIcon} size={14} className="rotate-180 rtl:rotate-0" />
                  <span>{t('cab.decisionDetails.queue', 'Queue')}</span>
                </button>
                {immutable ? (
                  <button
                    type="button"
                    onClick={() => void handleOpenCorrection()}
                    disabled={saving === 'correction'}
                    className="flex h-11 items-center gap-2 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-60"
                  >
                    <AppIcon icon={HistoryIcon} size={16} />
                    <span>{saving === 'correction' ? t('cab.decisionDetails.opening', 'Opening…') : t('cab.decisionDetails.openCorrection', 'Open controlled correction')}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleRecordDecision()}
                    disabled={saving === 'record'}
                    className="flex h-11 items-center gap-2 rounded-[8px] bg-primary px-5 text-[14px] font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    <AppIcon icon={LockIcon} size={16} />
                    <span>{saving === 'record' ? t('cab.decisionDetails.recording', 'Recording…') : t('cab.decisionDetails.recordDecision', 'Record decision')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </CabTourStep>

        {saveError && (
          <div className="flex items-start gap-2 rounded-[8px] border border-[#fbc5c5] bg-[#fef2f2] px-4 py-3 text-[13px] font-medium text-[#b91c1c]">
            <AppIcon icon={InfoIcon} size={16} className="mt-0.5 shrink-0" />
            <span className="min-w-0">{saveError}</span>
            <button type="button" onClick={() => setSaveError('')} className="ms-auto shrink-0 hover:opacity-70" aria-label="Dismiss">
              ✕
            </button>
          </div>
        )}

        <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* LEFT column */}
          <div className="flex min-w-0 flex-col gap-5">
            {/* Readiness gates */}
            <CabTourStep steps={tourSteps} stepId="decision-details-gates">
              <section className={cn(cardClassName, 'overflow-hidden')}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ececec] px-5 py-4">
                  <div className="flex items-center gap-2">
                    <AppIcon icon={ShieldIcon} size={18} className="text-primary" />
                    <h2 className="text-[16px] font-bold text-neutral-900">{t('cab.decisionDetails.readinessTitle', 'Readiness to record')}</h2>
                  </div>
                  {gates?.canRecord ? (
                    <StatusBadge label={t('cab.decisionDetails.allGatesPassed', 'All gates passed')} tone="green" />
                  ) : (
                    <StatusBadge label={t('cab.decisionDetails.incomplete', 'Incomplete')} tone="amber" />
                  )}
                </div>
                <div className="px-5 py-4">
                  <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
                    {gateRows.map((g) => (
                      <GateRow key={g.label} label={g.label} ok={g.ok} />
                    ))}
                  </div>
                  {gates && gates.blockers.length > 0 && (
                    <div className="mt-4 rounded-[8px] border border-[#fde2e2] bg-[#fff7f7] px-4 py-3">
                      <p className="text-[13px] font-semibold text-[#e74c3c]">{t('cab.decisionDetails.blockingGates', 'Blocking gates')}</p>
                      <ul className="mt-1.5 list-disc space-y-1 ps-4 text-[13px] text-[#7f1d1d]">
                        {gates.blockers.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-4 flex items-start gap-2 rounded-[8px] bg-[#eef2ff] px-4 py-3 text-[13px] leading-relaxed text-[#3730a3]">
                    <AppIcon icon={InfoIcon} size={16} className="mt-0.5 shrink-0" />
                    <p>{t('cab.decisionDetails.gatesInfo', 'A certification decision is separate from application acceptance. Certificates are enabled only after an authorized grant decision is recorded — no automated grant is made based on payment.')}</p>
                  </div>
                </div>
              </section>
            </CabTourStep>

            {/* Decision record / immutable outcome */}
            <CabTourStep steps={tourSteps} stepId="decision-details-record">
              <section className={cn(cardClassName, 'overflow-hidden')}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ececec] px-5 py-4">
                  <div className="flex items-center gap-2">
                    {immutable ? <AppIcon icon={LockIcon} size={18} className="text-[#22c55e]" /> : <AppIcon icon={HistoryIcon} size={18} className="text-primary" />}
                    <h2 className="text-[16px] font-bold text-neutral-900">
                      {immutable ? t('cab.decisionDetails.recordedDecision', 'Recorded decision (immutable)') : t('cab.decisionDetails.decisionRecord', 'Decision record')}
                    </h2>
                  </div>
                  {immutable ? (
                    <StatusBadge label={`v${record?.version ?? 1} · ${t('cab.decisionDetails.recordedTag', 'recorded')}`} tone="green" />
                  ) : (
                    <StatusBadge label={`v${record?.version ?? 1} · ${t('cab.decisionDetails.draftTag', 'draft')}`} tone="neutral" />
                  )}
                </div>

                {immutable && record ? (
                  <div className="px-5 py-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <SummaryField
                        label={t('cab.decisionDetails.outcome', 'Outcome')}
                        value={record.outcome ? (DECISION_OUTCOME_OPTIONS.find((o) => o.value === record.outcome)?.label ?? record.outcome) : ''}
                      />
                      <SummaryField label={t('cab.decisionDetails.decisionMaker', 'Decision maker')} value={recordMaker?.name ?? record.decisionMakerId ?? ''} />
                      <SummaryField label={t('cab.decisionDetails.decisionDate', 'Decision date')} value={record.decisionDate || ''} />
                      <SummaryField label={t('cab.decisionDetails.recommendedBy', 'Recorded by')} value={`${record.recordedBy ?? ''}${record.recordedAt ? ` · ${record.recordedAt}` : ''}`} />
                      <div className="sm:col-span-2">
                        <SummaryField label={t('cab.decisionDetails.confirmedScope', 'Confirmed scope')} value={record.confirmedScope} />
                      </div>
                      <div className="sm:col-span-2">
                        <SummaryField label={t('cab.decisionDetails.rationale', 'Rationale')} value={record.rationale} />
                      </div>
                    </div>
                    <div className="mt-4 flex items-start gap-2 rounded-[8px] border border-[#d1fae5] bg-[#f0fdf6] px-4 py-3 text-[13px] leading-relaxed text-[#166534]">
                      <AppIcon icon={LockIcon} size={16} className="mt-0.5 shrink-0" />
                      <p>{t('cab.decisionDetails.immutableInfo', 'Recorded outcomes are immutable. Changes are only possible through a controlled correction version that keeps the full decision history.')}</p>
                    </div>
                  </div>
                ) : (
                  <form className="px-5 py-4" onSubmit={(e) => { e.preventDefault(); void handleRecordDecision() }}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <label className="flex flex-col gap-1.5 text-[13px] font-medium text-neutral-800">
                        {t('cab.decisionDetails.outcome', 'Outcome')}
                        <select
                          name={DECISION_FIELD_KEYS.outcome}
                          value={outcome}
                          onChange={(e) => { setOutcome(e.target.value as DecisionOutcome | ''); setDirty(true); setSaveError('') }}
                          className={cn(
                            'h-11 w-full cursor-pointer rounded-[8px] border bg-white px-3 text-[14px] text-neutral-900 outline-none transition focus:border-primary',
                            dirty && outcome === '' ? 'border-[#e74c3c]' : 'border-[#e2e2e2]',
                          )}
                        >
                          <option value="">{t('cab.decisionDetails.selectOutcome', 'Select outcome…')}</option>
                          {DECISION_OUTCOME_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        {outcome === 'grant' && (
                          <span className="text-[12px] font-normal text-neutral-500">
                            {t('cab.decisionDetails.grantNote', 'Certificates become available only after this grant is recorded.')}
                          </span>
                        )}
                      </label>

                      <label className="flex flex-col gap-1.5 text-[13px] font-medium text-neutral-800">
                        {t('cab.decisionDetails.decisionDate', 'Decision date')}
                        <input
                          type="date"
                          name={DECISION_FIELD_KEYS.decisionDate}
                          value={decisionDate}
                          onChange={(e) => { setDecisionDate(e.target.value); setDirty(true); setSaveError('') }}
                          className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900 outline-none focus:border-primary"
                        />
                      </label>

                      <label className="flex flex-col gap-1.5 text-[13px] font-medium text-neutral-800">
                        {t('cab.decisionDetails.confirmedScope', 'Confirmed scope')}
                        <textarea
                          name={DECISION_FIELD_KEYS.confirmedScope}
                          value={confirmedScope}
                          rows={3}
                          onChange={(e) => { setConfirmedScope(e.target.value); setDirty(true); setSaveError('') }}
                          className="w-full resize-y rounded-[8px] border border-[#e2e2e2] bg-white px-3 py-2.5 text-[14px] leading-relaxed text-neutral-900 outline-none focus:border-primary"
                        />
                      </label>

                      <label className="flex flex-col gap-1.5 text-[13px] font-medium text-neutral-800 sm:col-span-2">
                        {t('cab.decisionDetails.rationale', 'Rationale')}
                        <textarea
                          name={DECISION_FIELD_KEYS.rationale}
                          value={rationale}
                          rows={4}
                          onChange={(e) => { setRationale(e.target.value); setDirty(true); setSaveError('') }}
                          placeholder={t('cab.decisionDetails.rationalePlaceholder', 'Explain your decision. Written notes take precedence over any generated microcopy shown to the client.')}
                          className="w-full resize-y rounded-[8px] border border-[#e2e2e2] bg-white px-3 py-2.5 text-[14px] leading-relaxed text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-primary"
                        />
                      </label>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-[#ececec] pt-4">
                      <button
                        type="button"
                        onClick={() => void handleSaveDraft()}
                        disabled={saving === 'draft'}
                        className="flex h-11 items-center justify-center rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-60"
                      >
                        {saving === 'draft' ? t('cab.decisionDetails.saving', 'Saving…') : t('cab.decisionDetails.saveDraft', 'Save draft')}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRecordDecision()}
                        disabled={saving === 'record' || !outcome}
                        className="flex h-11 items-center justify-center rounded-[8px] bg-primary px-5 text-[14px] font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-60"
                      >
                        {saving === 'record' ? t('cab.decisionDetails.recording', 'Recording…') : t('cab.decisionDetails.recordDecision', 'Record decision')}
                      </button>
                    </div>
                    <p className="mt-2 text-[12px] text-neutral-500">
                      {t('cab.decisionDetails.draftInfo', 'Saving a draft keeps incomplete data. Recording requires all gates above to pass.')}
                    </p>
                  </form>
                )}
              </section>
            </CabTourStep>

            {/* Evidence / Findings / Activity tabs */}
            <CabTourStep steps={tourSteps} stepId="decision-details-tabs">
              <section className={cn(cardClassName, 'overflow-hidden')}>
                <div className="flex flex-wrap items-center gap-1 overflow-x-auto border-b border-[#ececec] px-3">
                  {([
                    { key: 'evidence', label: t('cab.decisionDetails.tabs.evidence', 'Evidence'), icon: LockIcon },
                    { key: 'findings', label: t('cab.decisionDetails.tabs.findings', 'Findings'), icon: ShieldIcon },
                    { key: 'activity', label: t('cab.decisionDetails.tabs.activity', 'Activity'), icon: HistoryIcon },
                  ] as Array<{ key: TabKey; label: string; icon: typeof LockIcon }>).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        'flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-[14px] font-semibold transition-colors',
                        activeTab === tab.key ? 'border-[#1236a3] text-[#1236a3]' : 'border-transparent text-neutral-500 hover:text-neutral-800',
                      )}
                    >
                      <AppIcon icon={tab.icon} size={15} />
                      {tab.label}
                      {tab.key === 'evidence' && detail.evidence.length > 0 && (
                        <span className="rounded-full bg-[#e8edfc] px-2 py-0.5 text-[11px] font-semibold text-[#1236a3]">{detail.evidence.length}</span>
                      )}
                      {tab.key === 'findings' && detail.findings.length > 0 && (
                        <span className="rounded-full bg-[#e8edfc] px-2 py-0.5 text-[11px] font-semibold text-[#1236a3]">{detail.findings.length}</span>
                      )}
                    </button>
                  ))}
                </div>

                {activeTab === 'evidence' && (
                  <div className="px-5 py-4">
                    <ul className="space-y-3">
                      {detail.evidence.length === 0 ? (
                        <li className="text-[13px] text-neutral-400">{t('cab.decisionDetails.emptyEvidence', 'No evidence documents recorded.')}</li>
                      ) : (
                        detail.evidence.map((doc) => (
                          <li key={doc.id} className="flex items-start justify-between gap-3 rounded-[8px] border border-[#ececec] px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-[14px] font-semibold text-neutral-900">{doc.name}</p>
                              <p className="mt-0.5 text-[13px] text-neutral-500">{doc.docTypeLabel} · v{doc.version} · {doc.date}</p>
                            </div>
                            <span
                              className={cn(
                                'inline-flex shrink-0 items-center rounded-[6px] px-2.5 py-1 text-[12px] font-medium',
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
                        <li className="text-[13px] text-neutral-400">{t('cab.decisionDetails.emptyFindings', 'No audit findings recorded.')}</li>
                      ) : (
                        detail.findings.map((f) => (
                          <li key={f.id} className="rounded-[8px] border border-[#ececec] px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[14px] font-semibold text-neutral-900">{f.requirement}</p>
                              <span
                                className={cn(
                                  'inline-flex shrink-0 items-center rounded-[6px] px-2.5 py-1 text-[12px] font-medium',
                                  f.severity === 'Major' ? 'bg-[#fde8e8] text-[#e74c3c]' : 'bg-[#fff7e6] text-[#d97706]',
                                )}
                              >
                                {f.severity}
                              </span>
                            </div>
                            <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">{f.description}</p>
                            <p className="mt-1.5 text-[12px] font-medium text-neutral-500">Status: {f.status}</p>
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
                        <li className="text-[13px] text-neutral-400">{t('cab.decisionDetails.emptyActivity', 'No activity recorded yet.')}</li>
                      ) : (
                        detail.activity.map((a) => (
                          <li key={a.id} className="flex items-start gap-3">
                            <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
                            <div className="min-w-0">
                              <p className="text-[13px] text-neutral-800">{a.text}</p>
                              <p className="mt-0.5 text-[12px] text-neutral-400">{a.by} · {a.at}</p>
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </section>
            </CabTourStep>
          </div>

          <aside className="flex min-w-0 flex-col gap-5">
            {/* Decision maker */}
            <CabTourStep steps={tourSteps} stepId="decision-details-sidebar">
              <section className={cn(cardClassName, 'overflow-hidden')}>
                <div className="flex items-center gap-2 border-b border-[#ececec] px-5 py-4">
                  <AppIcon icon={UsersIcon} size={18} className="text-primary" />
                  <h2 className="text-[16px] font-bold text-neutral-900">{t('cab.decisionDetails.decisionMaker', 'Decision maker')}</h2>
                </div>
                <div className="px-5 py-4">
                  {immutable ? (
                    <SummaryField label={t('cab.decisionDetails.decisionMaker', 'Decision maker')} value={recordMaker?.name ?? record?.decisionMakerId ?? '—'} />
                  ) : (
                    <label className="flex flex-col gap-1.5 text-[13px] font-medium text-neutral-800">
                      {t('cab.decisionDetails.decisionMaker', 'Decision maker')}
                      <select
                        name={DECISION_FIELD_KEYS.decisionMaker}
                        value={decisionMakerId}
                        onChange={(e) => { setDecisionMakerId(e.target.value); setDirty(true); setSaveError('') }}
                        className="h-11 w-full cursor-pointer rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] font-normal text-neutral-900 outline-none focus:border-primary"
                      >
                        <option value="">{t('cab.decisionDetails.selectDecisionMaker', 'Select decision maker…')}</option>
                        {detail.decisionMakers.map((maker) => (
                          <option key={maker.id} value={maker.id}>
                            {maker.name}
                            {maker.authorized ? ` — ${t('cab.decisionDetails.authorizedMaker', 'authorized')}` : ''}
                            {maker.independentFromAudit ? '' : ` (${t('cab.decisionDetails.notIndependentMaker', 'audit team')})`}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {selectedMaker && (
                    <span
                      className={cn(
                        'mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium',
                        !selectedMaker.authorized || !selectedMaker.independentFromAudit ? 'text-[#d97706]' : 'text-[#16a34a]',
                      )}
                    >
                      {selectedMaker.authorized
                        ? `✓ ${t('cab.decisionDetails.authorizedMaker', 'Authorized decision maker')}`
                        : `✕ ${t('cab.decisionDetails.notAuthorizedMaker', 'Not in decision authority')}`}
                      {selectedMaker.independentFromAudit
                        ? `· ✓ ${t('cab.decisionDetails.independentMaker', 'Independent from audit')}`
                        : `· ✕ ${t('cab.decisionDetails.notIndependentMaker', 'Part of audit team')}`}
                    </span>
                  )}
                  <div className="mt-4 flex items-start gap-2 rounded-[8px] bg-[#eef2ff] px-4 py-3 text-[13px] leading-relaxed text-[#3730a3]">
                    <AppIcon icon={InfoIcon} size={16} className="mt-0.5 shrink-0" />
                    <p>{t('cab.decisionDetails.makerInfo', 'Authorization and audit independence are verified separately from auditor roles and are required before recording a grant.')}</p>
                  </div>
                </div>
              </section>
            </CabTourStep>

            {/* Application summary */}
            <section className={cn(cardClassName, 'overflow-hidden')}>
              <div className="border-b border-[#ececec] px-5 py-4">
                <h2 className="text-[16px] font-bold text-neutral-900">{t('cab.decisionDetails.applicationSummary', 'Application summary')}</h2>
              </div>
              <div className="space-y-3.5 px-5 py-4">
                <SummaryField label={t('cab.decisionDetails.client', 'Client')} value={detail.clientName} />
                <SummaryField label={t('cab.decisionDetails.application', 'Application')} value={detail.applicationId} />
                <SummaryField label={t('cab.decisionDetails.scheme', 'Scheme')} value={detail.applicationScheme || detail.scheme} />
                <SummaryField label={t('cab.decisionDetails.country', 'Country')} value={detail.clientCountry || detail.country} />
                <SummaryField label={t('cab.decisionDetails.stage', 'Stage')} value={`${detail.currentStage}${detail.currentStageDetail ? ` — ${detail.currentStageDetail}` : ''}`} />
                <div className="grid grid-cols-2 gap-3">
                  <SummaryField label={t('cab.decisionDetails.received', 'Received')} value={detail.receivedDate} />
                  <SummaryField label={t('cab.decisionDetails.due', 'Due')} value={detail.dueDate} />
                </div>
              </div>
            </section>

            {/* Technical recommendation */}
            {detail.recommendationText && (
              <section className={cn(cardClassName, 'overflow-hidden')}>
                <div className="flex items-center gap-2 border-b border-[#ececec] px-5 py-4">
                  <AppIcon icon={CommentIcon} size={16} className="text-primary" />
                  <h2 className="text-[16px] font-bold text-neutral-900">{t('cab.decisionDetails.technicalRecommendation', 'Technical recommendation')}</h2>
                </div>
                <div className="space-y-3 px-5 py-4">
                  <SummaryField label={t('cab.decisionDetails.recommendedBy', 'Recommended by')} value={`${detail.recommendationBy}${detail.recommendationDate ? ` · ${detail.recommendationDate}` : ''}`} />
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
              <h2 className="text-[15px] font-bold text-neutral-900">{t('cab.decisionDetails.discard.title', 'Discard unsaved changes?')}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
                {t('cab.decisionDetails.discard.message', 'You have unsaved changes to this decision draft. Leaving now will discard them.')}
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowDiscard(false)}>
                  {t('cab.decisionDetails.discard.keep', 'Keep editing')}
                </Button>
                <Button type="button" size="sm" onClick={() => { setShowDiscard(false); navigate(ROUTES.cabDecisions) }}>
                  {t('cab.decisionDetails.discard.discardAction', 'Discard & leave')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CabLayout>
  )
}