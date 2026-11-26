import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { SCHEME_RULES, listFindingRecords, validateFindingForSubmit } from '@/lib/api/cabAuditReportingApi'
import { FIELD_KEYS, saveFindingRecord, type FindingRecord, type FindingSubmitErrorCode } from '@/lib/api/cabAuditReportingApi'
import {
  fetchAuditPlanById,
  saveAuditPlan,
  type AuditPlan,
} from '@/lib/api/cabAuditPlanningApi'
import { attachFindingToItem, nextFindingCode } from '@/lib/api/auditExecutionGates'
import { canAddFinding, nextRegisterFindingCode } from '@/lib/api/auditReportingWorkspace'
import { normalizeClassification } from '@/lib/api/nonconformityRegister'
import { CARD, GHOST_BTN, INPUT, PRIMARY_BTN, Toast } from '@/components/cab/auditReporting/shared'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

/**
 * Add finding. Opens EMPTY: no demo audit, no prefilled statement or evidence.
 * When opened from the conduct step (?planId=..&itemId=..&clauseRef=..&result=..&returnTo=..)
 * the form is bound to that audit and checklist item: submitting records the
 * finding code on the item and returns to the execution workspace.
 * When opened with ?findingId=.. it reopens that saved draft with its own audit
 * and item binding; saving or submitting updates the same record in place, so a
 * draft never blocks the report with no way through.
 */
export function CabAddFindingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tr = (k: string, fb: string) => t(k, fb)

  const findingId = searchParams.get('findingId') || ''
  // Reopening a draft: the record carries the binding, so it cannot be detached
  // from its audit or item by editing the URL. Only drafts reopen; submitted
  // findings are fixed records. CAB-scoped: another organization's id finds nothing.
  const [existing] = useState<FindingRecord | null>(() =>
    findingId
      ? (listFindingRecords().find((r) => r.id === findingId && r.status === 'Draft') ?? null)
      : null,
  )
  // Strict binding: with findingId the record alone decides, including its nulls —
  // URL params can only bind a NEW finding, never rebind a reopened one.
  const planId = findingId ? (existing?.planId ?? '') : searchParams.get('planId') || ''
  const itemId = findingId ? (existing?.checklistItemId ?? '') : searchParams.get('itemId') || ''
  const clauseRef = findingId ? (existing?.clauseRef ?? '') : searchParams.get('clauseRef') || ''
  const sourceResult = searchParams.get('result') || ''
  const returnTo = searchParams.get('returnTo') || ''
  const isBound = Boolean(planId)
  const hasItem = Boolean(itemId)

  const [boundPlan, setBoundPlan] = useState<AuditPlan | null>(null)
  // The audit lookup gates every action: until it resolves, save/submit stay
  // disabled so a pending or failed lookup cannot bypass the report lock.
  const [planLookup, setPlanLookup] = useState<'loading' | 'ready' | 'failed'>(isBound ? 'loading' : 'failed')

  // A finding always belongs to an audit: without one, choose it in the register first.
  // A findingId that resolves to no draft is always sent back, even if the URL
  // also carries a planId (which only binds new findings).
  useEffect(() => {
    if ((findingId && !existing) || !isBound) navigate(returnTo || ROUTES.cabAuditReporting, { replace: true })
  }, [findingId, existing, isBound, returnTo, navigate])

  useEffect(() => {
    let active = true
    if (isBound) {
      setPlanLookup('loading')
      fetchAuditPlanById(planId)
        .then((data) => {
          if (!active) return
          setBoundPlan(data)
          setPlanLookup(data ? 'ready' : 'failed')
        })
        .catch(() => {
          if (!active) return
          setBoundPlan(null)
          setPlanLookup('failed')
        })
    }
    return () => {
      active = false
    }
  }, [isBound, planId])

  // Classifications are stored as values ('major'); the label is only ever a display translation.
  const suggestedClassification =
    sourceResult === 'Major NC' ? 'major' : sourceResult === 'Minor NC' ? 'minor' : ''

  const [findingType, setFindingType] = useState(
    existing?.findingType ?? (sourceResult === 'Minor NC' || sourceResult === 'Major NC' ? 'Nonconformity' : ''),
  )
  // Drafts saved before classifications were stored as values carry the display label;
  // normalize on reopen so the dropdown selects the canonical value.
  const [classification, setClassification] = useState(
    existing ? (normalizeClassification(existing.classification) ?? '') : suggestedClassification,
  )
  const [requirementRef, setRequirementRef] = useState(existing?.requirementRef ?? clauseRef)
  const [evidenceText, setEvidenceText] = useState(existing?.evidenceText ?? '')
  const evidenceLinks: string[] = existing?.evidenceLinks ?? []
  const [statement, setStatement] = useState(existing?.statement ?? '')
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? '')
  const [process, setProcess] = useState(existing?.process ?? '')
  const [contact, setContact] = useState(existing?.contact ?? '')
  const [comments, setComments] = useState(existing?.comments ?? '')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [errors, setErrors] = useState<FindingSubmitErrorCode[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [showScheme, setShowScheme] = useState(false)

  // The report left the audit team's hands (in review, approved or issued): the audit's findings are fixed.
  // While the audit lookup is pending or failed the form is locked too, so the
  // lock can never be bypassed by acting before the plan is known.
  const reportLocked = Boolean(boundPlan && !canAddFinding(boundPlan))
  const locked = reportLocked || (isBound && planLookup !== 'ready')

  const fallbackTarget = returnTo || ROUTES.cabAuditReporting

  const show = (m: string) => {
    setToast(m)
    window.setTimeout(() => setToast(null), 3800)
  }
  const markDirty = () => setIsDirty(true)

  // Reopened drafts keep their identity (id, owner, createdAt) and binding; only
  // the edited fields and status change, so resubmitting never duplicates a finding.
  const buildRecord = (
    status: 'Draft' | 'Submitted',
    findingCode: string | null,
  ): Omit<FindingRecord, 'cabId'> & { cabId?: string | null } => ({
    id: existing?.id ?? `find-${Date.now()}`,
    cabId: existing?.cabId ?? undefined,
    findingCode,
    status,
    planId: isBound ? (boundPlan?.id ?? planId) : null,
    planNumber: isBound ? (boundPlan?.planNumber ?? existing?.planNumber ?? planId) : null,
    checklistItemId: isBound && hasItem ? itemId : null,
    clauseRef: isBound ? clauseRef || null : null,
    findingType,
    classification,
    requirementRef,
    evidenceText,
    evidenceLinks,
    statement,
    dueDate,
    process,
    contact,
    comments,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  })

  // A draft keeps the entered fields but is never attached to the checklist
  // item, so it does not clear the NC-without-finding blocker.
  const handleSaveDraft = () => {
    if (locked) return
    void saveFindingRecord(buildRecord('Draft', null))
    setIsDirty(false)
    setErrors([])
    show(tr('cab.auditReporting.findingDraftSaved', 'Finding draft saved - incomplete later-stage data allowed in draft.'))
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (locked) return
    const res = validateFindingForSubmit({ findingType, classification, requirementRef, evidenceText, evidenceLinks, statement })
    setErrors(res.errors)
    if (!res.ok) {
      show(tr('cab.auditReporting.submitBlocked', 'Submission blocked - resolve the listed gates first. Draft preserved.'))
      return
    }
    setIsDirty(false)
    if (isBound && boundPlan) {
      const itemCodes = boundPlan.execution.checklists.flatMap((s) => s.items.map((i) => i.findingCode ?? ''))
      // A draft never attached its code, but another finding may have claimed the
      // item since; never overwrite an item's existing code with a reopened draft's.
      const itemFree = hasItem && !boundPlan.execution.checklists.some((s) =>
        s.items.some((i) => i.id === itemId && (i.findingCode ?? '') !== ''),
      )
      const code = itemFree
        ? nextFindingCode(boundPlan.execution)
        : nextRegisterFindingCode(boundPlan, listFindingRecords(), itemCodes)
      if (itemFree) {
        await saveAuditPlan({
          id: boundPlan.id,
          planNumber: boundPlan.planNumber,
          execution: attachFindingToItem(boundPlan.execution, itemId, code),
        })
      }
      await saveFindingRecord(buildRecord('Submitted', code))
      show(tr('cab.auditReporting.findingSubmitted', 'Finding submitted. Classification follows configured scheme rules.'))
      window.setTimeout(() => navigate(fallbackTarget), 1100)
      return
    }
    await saveFindingRecord(buildRecord('Submitted', null))
    show(tr('cab.auditReporting.findingSubmitted', 'Finding submitted. Classification follows configured scheme rules.'))
    window.setTimeout(() => navigate(fallbackTarget), 1100)
  }
  const handleCancel = () => {
    if (isDirty) setShowCancel(true)
    else navigate(fallbackTarget)
  }

  const subtitle = isBound
    ? [boundPlan?.planNumber ?? planId, boundPlan?.clientName, clauseRef].filter(Boolean).join(' · ')
    : tr('cab.auditReporting.addFindingUnboundSub', 'Not linked to an audit')

  return (
    <CabLayout sidebarVariant={hasItem ? 'auditPlanning' : 'auditReporting'}>
      <div className="flex min-h-screen flex-col">
        <CabHeader
          title={existing ? tr('cab.auditReporting.editFindingTitle', 'Edit finding') : tr('cab.auditReporting.addFindingTitle', 'Add finding')}
          subtitle={subtitle}
          notificationCount={0}
        />

        <main className="flex flex-1 flex-col gap-5 overflow-auto bg-[#f9fafc] p-3 sm:p-5">
          <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400" aria-label={tr('common.breadcrumb', 'Breadcrumb')}>
            <button type="button" onClick={handleCancel} className="transition-colors hover:text-[#1236a3]">
              {hasItem
                ? tr('execution.title', 'Audit execution')
                : tr('cab.auditReporting.title', 'Audit Reporting')}
            </button>
            <span aria-hidden>/</span>
            <span className="font-semibold text-neutral-600">{existing ? tr('cab.auditReporting.editFindingTitle', 'Edit finding') : tr('cab.auditReporting.addFinding', 'Add finding')}</span>
          </nav>

          {isBound && boundPlan ? (
            <section className={cn(CARD, 'border-[#1236a3]/20 bg-[#f3f6fd] p-4')} aria-label={tr('cab.auditReporting.auditContext', 'Audit context')}>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px]">
                <span className="rounded-[6px] bg-[#1236a3] px-2 py-0.5 font-bold text-white">
                  {tr('cab.auditReporting.scope', 'CAB-client scope')}
                </span>
                <span className="font-medium text-neutral-700">
                  {tr('cab.auditReporting.orgLabel', 'Org')}: {boundPlan.clientCode ? `${boundPlan.clientCode} · ` : ''}{boundPlan.clientName}
                </span>
                {boundPlan.siteName && (
                  <span className="font-medium text-neutral-700">
                    {tr('cab.auditReporting.siteLabel', 'Site')}: {boundPlan.siteCode ? `${boundPlan.siteCode} · ` : ''}{boundPlan.siteName}
                  </span>
                )}
                {boundPlan.primaryContactName && (
                  <span className="font-medium text-neutral-700">
                    {tr('cab.auditReporting.contactLabel', 'Contact')}: {boundPlan.primaryContactName}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[11px] text-neutral-500">
                {hasItem
                  ? tr('cab.auditReporting.findingRaisedFor', 'Raised from the conduct step, bound to this checklist item.')
                  : tr('cab.auditReporting.register.findingForAudit', 'Raised from Audit Reporting, bound to this audit.')}
              </p>
            </section>
          ) : (
            <p className="rounded-[8px] border border-[#dce4f5] bg-[#f8faff] px-4 py-2.5 text-[12px] font-medium text-neutral-700">
              {hasItem
                ? tr('cab.auditReporting.findingRaisedFor', 'Raised from the conduct step, bound to this checklist item.')
                : tr('cab.auditReporting.register.findingForAudit', 'Raised from Audit Reporting, bound to this audit.')}
            </p>
          )}

          {reportLocked && (
            <div className="rounded-[8px] border border-[#fde68a] bg-[#fffbeb] p-4 text-[13px] text-[#b45309]" role="alert" data-testid="finding-locked">
              {tr('cab.auditReporting.register.findingsLocked', 'The stage report is with the reviewer or issued, so findings can no longer be added to this audit.')}
            </div>
          )}

          {errors.length > 0 && (
            <div className="rounded-[8px] border border-error-200 bg-error-50 p-4" role="alert">
              <p className="text-[13px] font-bold text-error-600">{tr('cab.auditReporting.gatesBlockedTitle', 'Submission gates — resolve to submit')}</p>
              <ul className="mt-1.5 list-disc space-y-0.5 ps-5 text-[12px] font-medium text-neutral-700">
                {errors.map((e) => <li key={e}>{tr(`cab.auditReporting.submitError.${e}`, e)}</li>)}
              </ul>
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            {/* ===== Left column ===== */}
            <div className={cn(CARD, 'space-y-4 p-5')}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-neutral-800">
                    {tr('cab.auditReporting.findingType', 'Finding type')} *
                  </label>
                  <select value={findingType} onChange={(e) => { setFindingType(e.target.value); markDirty(); }} className={INPUT} data-field={FIELD_KEYS.findingType}>
                    <option value="">{tr('cab.auditReporting.selectType', 'Select…')}</option>
                    <option value="Nonconformity">{tr('cab.auditReporting.typeNonconformity', 'Nonconformity')}</option>
                    <option value="Observation">{tr('cab.auditReporting.typeObservation', 'Observation')}</option>
                    <option value="Opportunity">{tr('cab.auditReporting.typeOpportunity', 'Opportunity for improvement')}</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-[13px] font-medium text-neutral-800">
                    {tr('cab.auditReporting.classification', 'Classification (scheme rules)')} *
                    <button type="button" onClick={() => setShowScheme(true)} aria-label={tr('cab.auditReporting.schemeRulesInfo', 'Scheme rules info')}
                      className="flex size-5 items-center justify-center rounded-full bg-[#e8edfc] text-[11px] font-bold text-[#1236a3]">?</button>
                  </label>
                  <select value={classification} onChange={(e) => { setClassification(e.target.value); markDirty(); }} className={INPUT} data-field={FIELD_KEYS.classification}>
                    <option value="">{tr('cab.auditReporting.selectClass', 'Select per scheme rules…')}</option>
                    {SCHEME_RULES.classifications.map((c) => (
                      <option key={c.value} value={c.value}>
                        {tr(`cab.auditReporting.class${c.value.charAt(0).toUpperCase()}${c.value.slice(1)}`, c.label)}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-neutral-500">
                    {classification
                      ? tr('cab.auditReporting.duePerScheme', 'Due per scheme rules (configured)')
                      : tr('cab.auditReporting.schemeRulesVersion', SCHEME_RULES.version)}
                  </p>
                </div>
              </div>

              {/* Requirement reference field */}
              <div>
                <label className="mb-1 block text-[13px] font-medium text-neutral-800">
                  {tr('cab.auditReporting.reqRefFull', 'Requirement reference')} *
                </label>
                <input
                  value={requirementRef}
                  onChange={(e) => { setRequirementRef(e.target.value); markDirty(); }}
                  className={INPUT}
                  data-field={FIELD_KEYS.requirementRef}
                  dir="ltr"
                />
              </div>

              <div>
                <label className="mb-1 block text-[13px] font-medium text-neutral-800">
                  {tr('cab.auditReporting.objectiveEvidence', 'Objective evidence')} *
                </label>
                <textarea rows={3} value={evidenceText} onChange={(e) => { setEvidenceText(e.target.value); markDirty(); }} className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-3 text-[14px] text-neutral-900 focus:border-[#1236a3] focus:outline-none min-h-20 resize-y" data-field={FIELD_KEYS.objectiveEvidence} />
                <p className="mt-1 text-[11px] text-neutral-500">
                  {tr('cab.auditReporting.evidenceGate', 'Evidence must reference the audit and requirement. Generic claims are blocked on submission.')}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-[13px] font-medium text-neutral-800">
                  {tr('cab.auditReporting.statement', 'Finding statement')} *
                </label>
                <textarea rows={3} value={statement} onChange={(e) => { setStatement(e.target.value); markDirty(); }} className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-3 text-[14px] text-neutral-900 focus:border-[#1236a3] focus:outline-none min-h-20 resize-y" data-field={FIELD_KEYS.statement} />
              </div>

              <div>
                <button type="button" onClick={() => setDetailsOpen((v) => !v)} aria-expanded={detailsOpen}
                  className="flex w-full items-center justify-between rounded-[8px] border border-[#e2e2e2] bg-neutral-50 px-4 py-2.5 text-[13px] font-medium text-neutral-800">
                  {tr('cab.auditReporting.moreDetails', 'More details (progressive disclosure)')}
                  <span aria-hidden className={cn(detailsOpen ? 'rotate-180' : '')}>▾</span>
                </button>
              </div>

              {detailsOpen && (
                <div className="mt-3 grid grid-cols-1 gap-4 rounded-[8px] border border-neutral-100 bg-[#fbfcfd] p-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-neutral-700">{tr('cab.auditReporting.process', 'Process / area')}</label>
                    <input value={process} onChange={(e) => { setProcess(e.target.value); markDirty(); }} className={INPUT} data-field={FIELD_KEYS.process} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-neutral-700">
                      {tr('cab.auditReporting.dueDate', 'Due date')} · {tr('cab.auditReporting.schemeRuled', 'scheme-ruled')}
                    </label>
                    <input type="date" value={dueDate} onChange={(e) => { setDueDate(e.target.value); markDirty(); }} className={INPUT} data-field={FIELD_KEYS.dueDate} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[12px] font-medium text-neutral-700">{tr('cab.auditReporting.responsible', 'Responsible contact (client contact role)')}</label>
                    <input value={contact} onChange={(e) => { setContact(e.target.value); markDirty(); }} className={INPUT} data-field={FIELD_KEYS.contact} />
                    <p className="mt-1 text-[11px] text-neutral-500">
                      {tr('cab.auditReporting.rolesSep', 'Client contact ≠ portal access ≠ signatory authority ≠ competence record ≠ decision authority.')}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[12px] font-medium text-neutral-700">{tr('cab.auditReporting.comments', 'Additional comments (optional)')}</label>
                    <textarea rows={2} value={comments} onChange={(e) => { setComments(e.target.value); markDirty(); }} className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-3 text-[14px] text-neutral-900 focus:border-[#1236a3] focus:outline-none resize-y" />
                  </div>
                </div>
              )}
            </div>
            {/* ===== /Left column ===== */}

            {/* ===== Right column ===== */}
            <aside className={cn(CARD, 'h-fit space-y-3 p-5 shadow-none')}>
              <h3 className="text-[16px] font-bold text-neutral-900">{tr('cab.auditReporting.stageGates', 'Stage gates')}</h3>
              <p className="text-[12px] text-neutral-500">
                {tr('cab.auditReporting.stageGatesSub', 'Draft permits incomplete later-stage data. Submission enforces configured gates.')}
              </p>
              <ul className="space-y-2 text-[12px] font-medium">
                {([
                  [findingType !== '', tr('cab.auditReporting.gateType', 'Finding type chosen')],
                  [classification !== '', tr('cab.auditReporting.gateClass', 'Classified per scheme rules')],
                  [requirementRef.trim() !== '', tr('cab.auditReporting.gateReq', 'Requirement referenced')],
                  [evidenceText.trim() !== '' || evidenceLinks.length > 0, tr('cab.auditReporting.gateEv', 'Evidence linked')],
                  [statement.trim() !== '', tr('cab.auditReporting.gateStmt', 'Statement written')],
                ] as [boolean, string][]).map(([ok, label]) => (
                  <li key={label} className={cn('flex items-center gap-2 rounded-[8px] border px-3 py-2', ok ? 'border-success-200 bg-success-50 text-success-700' : 'border-neutral-200 bg-neutral-50 text-neutral-500')}>
                    <span aria-hidden className={cn('flex size-4 items-center justify-center rounded-full text-[10px] text-white', ok ? 'bg-success-500' : 'bg-neutral-300')}>✓</span>
                    {label}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2 border-t border-neutral-100 pt-4">
                <button type="button" onClick={handleCancel} className={GHOST_BTN}>{tr('common.cancel', 'Cancel')}</button>
                <button type="button" onClick={handleSaveDraft} disabled={locked} className={GHOST_BTN}>{tr('common.saveDraft', 'Save as Draft')}</button>
                <button type="submit" disabled={locked} className={PRIMARY_BTN} data-testid="submit-finding">{tr('cab.auditReporting.submitFinding', 'Submit finding')}</button>
              </div>
            </aside>
            {/* ===== /Right column ===== */}
          </form>
        </main>

        {toast && <Toast message={toast} />}

        {showCancel && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-neutral-900/50 p-4" role="alertdialog" aria-modal="true" aria-label={tr('cab.auditReporting.discard', 'Discard changes')}>
            <div className={cn(CARD, 'w-full max-w-md space-y-3 p-6 shadow-2xl')}>
              <p className="text-[15px] font-bold text-neutral-900">{tr('cab.auditReporting.dirtyCancelTitle', 'Discard unsaved finding?')}</p>
              <p className="text-[12px] text-neutral-600">{tr('cab.auditReporting.dirtyCancelBody', 'This finding has unsaved draft changes. Leave without saving?')}</p>
              <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
                <button type="button" className={GHOST_BTN} onClick={() => setShowCancel(false)}>{tr('common.cancel', 'Cancel')}</button>
                <button type="button" className={PRIMARY_BTN} onClick={() => { setIsDirty(false); navigate(fallbackTarget); }}>
                  {tr('cab.auditReporting.discard', 'Discard changes')}
                </button>
              </div>
            </div>
          </div>
        )}

        {showScheme && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-neutral-900/50 p-4" role="dialog" aria-modal="true" aria-label={tr('cab.auditReporting.schemeRules', 'Scheme rules')}>
            <div className={cn(CARD, 'w-full max-w-lg space-y-4 p-6 shadow-2xl')}>
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-[16px] font-bold text-neutral-900">{tr('cab.auditReporting.schemeName', SCHEME_RULES.scheme)}</h3>
                <span className="text-[12px] text-neutral-500">{tr('cab.auditReporting.schemeRulesVersion', SCHEME_RULES.version)}</span>
              </div>
              <p className="text-[13px] text-neutral-600">{tr('cab.auditReporting.schemeRulesIntro', 'Classification rules and due date constraints:')}</p>
              <div className="space-y-2">
                {SCHEME_RULES.classifications.map((c) => (
                  <div key={c.value} className="rounded-[8px] border border-neutral-200 bg-neutral-50 p-3 text-[13px]">
                    <p className="font-semibold text-neutral-900">{tr(`cab.auditReporting.class${c.value.charAt(0).toUpperCase()}${c.value.slice(1)}`, c.label)}</p>
                    <p className="mt-0.5 text-[12px] text-neutral-600">{tr('cab.auditReporting.duePerScheme', c.dueRule)}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <button type="button" className={PRIMARY_BTN} onClick={() => setShowScheme(false)}>
                  {tr('common.close', 'Close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CabLayout>
  )
}
