import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { SCHEME_RULES, validateFindingForSubmit } from '@/lib/api/cabAuditReportingApi'
import { FIELD_KEYS } from '@/lib/api/cabAuditReportingApi'
import { CARD, GHOST_BTN, INPUT, PRIMARY_BTN, ScopeBanner, Toast } from '@/components/cab/auditReporting/shared'
import { cn } from '@/lib/utils'

export function CabAddFindingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tr = (k: string, fb: string) => t(k, fb)

  const [findingType, setFindingType] = useState('Nonconformity')
  const [classification, setClassification] = useState('')
  const [requirementRef, setRequirementRef] = useState('ISO 9001:2015, Clause 8.5.1')
  const [evidenceText, setEvidenceText] = useState('Storage area temperature records for March were available for 1-10 March only (DOC-102).')
  const [evidenceLinks, setEvidenceLinks] = useState<string[]>(['EV-0103'])
  const [statement, setStatement] = useState('Complete temperature records for the storage area were not maintained per the referenced requirement.')
  const [dueDate, setDueDate] = useState('2025-04-12')
  const [process, setProcess] = useState('Storage and Handling')
  const [contact, setContact] = useState('Sara Ali (CTC-011 - Client contact)')
  const [comments, setComments] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [showScheme, setShowScheme] = useState(false)

  const show = (m: string) => {
    setToast(m)
    window.setTimeout(() => setToast(null), 3800)
  }
  const markDirty = () => setIsDirty(true)
  const toggleLink = (id: string) => {
    markDirty()
    setEvidenceLinks((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }
  const handleSaveDraft = () => {
    setIsDirty(false)
    setErrors([])
    show(tr('cab.auditReporting.findingDraftSaved', 'Finding draft saved - incomplete later-stage data allowed in draft.'))
  }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const res = validateFindingForSubmit({ findingType, classification, requirementRef, evidenceText, evidenceLinks, statement })
    setErrors(res.errors)
    if (!res.ok) {
      show(tr('cab.auditReporting.submitBlocked', 'Submission blocked - resolve the listed gates first. Draft preserved.'))
      return
    }
    setIsDirty(false)
    show(tr('cab.auditReporting.findingSubmitted', 'Finding submitted. Classification follows configured scheme rules.'))
    window.setTimeout(() => navigate('/cab/audit-reporting'), 1100)
  }
  const handleCancel = () => {
    if (isDirty) setShowCancel(true)
    else navigate('/cab/audit-reporting')
  }

  return (
    <CabLayout sidebarVariant="auditReporting">
      <div className="flex min-h-screen flex-col">
        <CabHeader
          title={tr('cab.auditReporting.addFindingTitle', 'Add finding — NC-0024')}
          subtitle={tr('cab.auditReporting.addFindingSub', 'AUD-0024 · linked to audit + requirement')}
          notificationCount={0}
        />

        <main className="flex flex-1 flex-col gap-5 overflow-auto bg-[#f9fafc] p-3 sm:p-5">
          <nav className="flex items-center gap-2 text-[13px] font-medium text-neutral-400" aria-label="Breadcrumb">
            <button type="button" onClick={handleCancel} className="transition-colors hover:text-[#1236a3]">
              {tr('cab.auditReporting.title', 'Audit Reporting')}
            </button>
            <span aria-hidden>/</span>
            <span className="font-semibold text-neutral-600">{tr('cab.auditReporting.addFinding', 'Add finding')}</span>
          </nav>

          <ScopeBanner title={tr('cab.auditReporting.scope', 'CAB-client scope')} />

          {errors.length > 0 && (
            <div className="rounded-[8px] border border-error-200 bg-error-50 p-4" role="alert">
              <p className="text-[13px] font-bold text-error-600">{tr('cab.auditReporting.gatesBlockedTitle', 'Submission gates — resolve to submit')}</p>
              <ul className="mt-1.5 list-disc space-y-0.5 ps-5 text-[12px] font-medium text-neutral-700">
                {errors.map((e) => <li key={e}>{e}</li>)}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            {/* ===== Left column ===== */}
            <div className={cn(CARD, 'space-y-4 p-5')}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-neutral-800">
                    {tr('cab.auditReporting.findingType', 'Finding type')} *
                  </label>
                  <select value={findingType} onChange={(e) => { setFindingType(e.target.value); markDirty(); }} className={INPUT} data-field={FIELD_KEYS.findingType}>
                    <option value="Nonconformity">Nonconformity</option>
                    <option value="Observation">Observation</option>
                    <option value="Opportunity">Opportunity for improvement</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-[13px] font-medium text-neutral-800">
                    {tr('cab.auditReporting.classification', 'Classification (scheme rules)')} *
                    <button type="button" onClick={() => setShowScheme(true)} aria-label="Scheme rules info"
                      className="flex size-5 items-center justify-center rounded-full bg-[#e8edfc] text-[11px] font-bold text-[#1236a3]">?</button>
                  </label>
                  <select value={classification} onChange={(e) => { setClassification(e.target.value); markDirty(); }} className={INPUT} data-field={FIELD_KEYS.classification}>
                    <option value="">{tr('cab.auditReporting.selectClass', 'Select per scheme rules…')}</option>
                    {SCHEME_RULES.classifications.map((c) => <option key={c.value} value={c.label}>{c.label}</option>)}
                  </select>
                  <p className="mt-1 text-[11px] text-neutral-500">
                    {classification
                      ? SCHEME_RULES.classifications.find((c) => c.label === classification)?.dueRule
                      : SCHEME_RULES.version}
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
                />
              </div>

              <div>
                <label className="mb-1 block text-[13px] font-medium text-neutral-800">
                  {tr('cab.auditReporting.objectiveEvidence', 'Objective evidence (linked)')} *
                </label>
                <textarea rows={3} value={evidenceText} onChange={(e) => { setEvidenceText(e.target.value); markDirty(); }} className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-3 text-[14px] text-neutral-900 focus:border-[#1236a3] focus:outline-none min-h-20 resize-y" data-field={FIELD_KEYS.objectiveEvidence} />
                <div className="mt-2 flex flex-wrap gap-2">
                  {['EV-0101', 'EV-0102', 'EV-0103', 'DOC-102'].map((id) => (
                    <label key={id} className={cn('cursor-pointer rounded-[8px] border px-3 py-1.5 text-[12px] font-medium',
                      evidenceLinks.includes(id) ? 'border-[#1236a3] bg-[#e8edfc] text-[#1236a3]' : 'border-[#e2e2e2] bg-white text-neutral-600')}>
                      <input type="checkbox" className="me-1.5 accent-[#1236a3]" checked={evidenceLinks.includes(id)} onChange={() => toggleLink(id)} />
                      {id}
                    </label>
                  ))}
                </div>
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
                <button type="button" onClick={handleSaveDraft} className={GHOST_BTN}>{tr('common.saveDraft', 'Save as Draft')}</button>
                <button type="submit" className={PRIMARY_BTN}>{tr('cab.auditReporting.submitFinding', 'Submit finding')}</button>
              </div>
            </aside>
            {/* ===== /Right column ===== */}
          </form>
        </main>

        {toast && <Toast message={toast} />}

        {showCancel && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-neutral-900/50 p-4" role="alertdialog" aria-modal="true" aria-label="Discard changes">
            <div className={cn(CARD, 'w-full max-w-md space-y-3 p-6 shadow-2xl')}>
              <p className="text-[15px] font-bold text-neutral-900">{tr('cab.auditReporting.dirtyCancelTitle', 'Discard unsaved finding?')}</p>
              <p className="text-[12px] text-neutral-600">{tr('cab.auditReporting.dirtyCancelBody', 'This finding has unsaved draft changes. Leave without saving?')}</p>
              <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
                <button type="button" className={GHOST_BTN} onClick={() => setShowCancel(false)}>{tr('common.cancel', 'Cancel')}</button>
                <button type="button" className={PRIMARY_BTN} onClick={() => { setIsDirty(false); navigate('/cab/audit-reporting'); }}>
                  {tr('cab.auditReporting.discard', 'Discard changes')}
                </button>
              </div>
            </div>
          </div>
        )}

        {showScheme && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-neutral-900/50 p-4" role="dialog" aria-modal="true" aria-label="Scheme rules">
            <div className={cn(CARD, 'w-full max-w-lg space-y-4 p-6 shadow-2xl')}>
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-[16px] font-bold text-neutral-900">{SCHEME_RULES.scheme}</h3>
                <span className="text-[12px] text-neutral-500">{SCHEME_RULES.version}</span>
              </div>
              <p className="text-[13px] text-neutral-600">Classification rules and due date constraints:</p>
              <div className="space-y-2">
                {SCHEME_RULES.classifications.map((c) => (
                  <div key={c.value} className="rounded-[8px] border border-neutral-200 bg-neutral-50 p-3 text-[13px]">
                    <p className="font-semibold text-neutral-900">{c.label}</p>
                    <p className="mt-0.5 text-[12px] text-neutral-600">{c.dueRule}</p>
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