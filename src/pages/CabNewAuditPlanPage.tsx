import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import {
  AUDIT_PLANNING_CLIENTS,
  AVAILABLE_AUDITORS_POOL,
  fetchAuditPlans,
  saveAuditPlan,
  type AuditPlan,
} from '@/lib/api/cabAuditPlanningApi'
import { BreadcrumbChevron, IsoDateField, auditStageLabel, auditStatusLabel } from '@/components/cab/auditPlanning/shared'
import { SelectField } from '@/components/ui/Select'
import {
  auditDateErrorField,
  todayIsoDate,
  validateAuditDates,
  type AuditDateError,
} from '@/lib/auditPlanDates'
import { ROUTES, cabBuildAuditPlanPath } from '@/lib/routes'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const DATE_ERROR_DEFAULTS: Record<AuditDateError, string> = {
  startRequired: 'Choose the start date.',
  endRequired: 'Choose the end date.',
  startInPast: 'The start date is in the past.',
  endBeforeStart: 'The end date must be on or after the start date.',
}

export function CabNewAuditPlanPage() {
  const { t } = useTranslation()
  const optionLabel = (opt: { type: string; label: string; stage: string }) => {
    if (opt.type === 'special') {
      return t('cab.auditPlanning.create.specialOption', 'None: special audit (reason required)')
    }
    return opt.label
      .replace(opt.stage, auditStageLabel(t, opt.stage))
      .replace(/\((\d+(?:\.\d+)?) days\)/, (_match, days: string) =>
        `(${t('cab.auditPlanning.create.optionDays', '{{days}} days', { days })})`,
      )
  }
  const navigate = useNavigate()

  const [selectedClientCode, setSelectedClientCode] = useState('')
  const [selectedOptionId, setSelectedOptionId] = useState('')
  const [specialReason, setSpecialReason] = useState('')
  const [today] = useState(() => todayIsoDate())
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [leadAuditor, setLeadAuditor] = useState('Omar Hassan')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedClient = useMemo(
    () => AUDIT_PLANNING_CLIENTS.find((c) => c.code === selectedClientCode) || null,
    [selectedClientCode],
  )

  const selectedOption = useMemo(
    () => selectedClient?.options.find((o) => o.id === selectedOptionId) || null,
    [selectedClient, selectedOptionId],
  )

  const isSpecialAudit = selectedOption?.type === 'special'
  const [lastNonSpecialOptionId, setLastNonSpecialOptionId] = useState('')
  const [existingPlan, setExistingPlan] = useState<AuditPlan | null>(null)

  // The artifact shows a notice when an existing plan already covers the chosen client + stage.
  useEffect(() => {
    let cancelled = false
    setExistingPlan(null)
    if (selectedClient && selectedOption && !isSpecialAudit) {
      fetchAuditPlans()
        .then((plans) => {
          if (cancelled) return
          setExistingPlan(
            plans.find(
              (plan) => plan.clientCode === selectedClient.code && plan.stage === selectedOption.stage,
            ) || null,
          )
        })
        .catch(() => {})
    }
    return () => {
      cancelled = true
    }
  }, [selectedClient, selectedOption, isSpecialAudit])

  const dueStageOption = selectedClient?.options.find((o) => o.type !== 'special') || null
  const toggleSpecialMode = () => {
    if (!selectedClient) return
    if (isSpecialAudit) {
      const target =
        selectedClient.options.find((o) => o.id === lastNonSpecialOptionId && o.type !== 'special') ||
        dueStageOption
      if (target) setSelectedOptionId(target.id)
    } else {
      const special = selectedClient.options.find((o) => o.type === 'special')
      if (special) {
        setLastNonSpecialOptionId(selectedOptionId)
        setSelectedOptionId(special.id)
      }
    }
  }

  const dateError = validateAuditDates(startDate, endDate, today)
  const dateErrorMessage = dateError
    ? t(`cab.auditPlanning.create.errors.${dateError}`, DATE_ERROR_DEFAULTS[dateError])
    : null
  const startError = dateError && auditDateErrorField(dateError) === 'start' ? dateErrorMessage : null
  const endError = dateError && auditDateErrorField(dateError) === 'end' ? dateErrorMessage : null
  const canSubmit = Boolean(
    selectedClient &&
      selectedOption &&
      !dateError &&
      leadAuditor &&
      (!isSpecialAudit || specialReason.trim().length > 0),
  )

  const handleConfirmCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !selectedClient || !selectedOption) return

    setIsSubmitting(true)
    try {
      const leadMember =
        AVAILABLE_AUDITORS_POOL.find((a) => a.name === leadAuditor) ||
        AVAILABLE_AUDITORS_POOL[0]

      const created = await saveAuditPlan({
        clientName: selectedClient.name,
        clientCode: selectedClient.code,
        country: selectedClient.country,
        stage: selectedOption.stage,
        applicationNumber: selectedOption.applicationNumber,
        standardName: selectedOption.standardName,
        standards: selectedOption.standards,
        reviewedDurationDays: selectedOption.reviewedDurationDays,
        siteCode: selectedOption.siteCode,
        siteName: selectedOption.siteName,
        siteAddress: selectedOption.siteAddress,
        primaryContactName: selectedClient.primaryContactName,
        primaryContactEmail: selectedClient.primaryContactEmail,
        primaryContactPhone: selectedClient.primaryContactPhone,
        proposedStartDate: startDate,
        proposedEndDate: endDate,
        leadAuditor,
        auditTeam: [leadAuditor],
        teamMembers: [leadMember],
        auditObjectives: isSpecialAudit
          ? t('cab.auditPlanning.create.generated.specialObjectives', 'Special audit: {{reason}}', { reason: specialReason.trim() })
          : t('cab.auditPlanning.create.generated.objectives', 'Evaluate conformity and implementation for {{stage}} ({{standard}}).', { stage: auditStageLabel(t, selectedOption.stage), standard: selectedOption.standardName }),
        scopeSummary: t('cab.auditPlanning.create.generated.scope', 'Integrated Management System and operational processes at {{site}} ({{code}}).', { site: selectedOption.siteName, code: selectedOption.siteCode }),
        status: 'Draft',
      })

      navigate(`/cab/audit-planning/build/${created.planNumber}`)
      toast.success(
        t('cab.auditPlanning.create.created', 'Audit plan {{number}} created.', {
          number: created.planNumber,
        }),
      )
    } catch {
      toast.error(
        t('cab.auditPlanning.create.error', 'The audit plan could not be created. Try again.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CabLayout sidebarVariant="auditPlanning">
      <CabHeader
        title={t('cab.auditPlanning.title', 'Audit Planning')}
        subtitle={t('cab.auditPlanning.subtitle', 'Plan and manage audits across clients and sites.')}
        notificationCount={4}
      />

      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]" aria-label="breadcrumb">
          <Link to={ROUTES.workspace} className="font-light text-neutral-400 hover:text-primary">
            {t('cab.workspace.appHub', 'Application Hub')}
          </Link>
          <BreadcrumbChevron />
          <Link to={ROUTES.cabAuditPlanning} className="font-light text-neutral-400 hover:text-primary">
            {t('cab.sidebar.auditSchedule', 'Audit schedule')}
          </Link>
          <BreadcrumbChevron />
          <span className="font-medium text-neutral-700">
            {t('cab.auditPlanning.newAuditPlan', 'New audit plan')}
          </span>
        </nav>

        <div>
          <h1 className="text-[28px] font-bold leading-tight text-neutral-900">
            {t('cab.auditPlanning.newAuditPlan', 'New audit plan')}
          </h1>
          <p className="mt-1 text-[14px] text-neutral-500">
            {t('cab.auditPlanning.create.intro', 'Start from an application or the next due event of a certification cycle. What earlier stages know is filled in: check it and confirm.')}
          </p>
        </div>

        <form onSubmit={handleConfirmCreate} className="space-y-5">
          {/* Card 1: Where this audit comes from */}
          <section className="space-y-4 rounded-[16px] border border-[#ececec] bg-white p-5">
            <h2 className="text-[15px] font-bold text-neutral-900">
              {t('cab.auditPlanning.create.sourceTitle', 'Where this audit comes from')}
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-[14px] font-medium text-neutral-800">
                  {t('cab.auditSchedule.client', 'Client')} <span className="text-error-500">*</span>
                </label>
                <SelectField
                  value={selectedClientCode}
                  placeholder={t('cab.auditPlanning.create.selectClient', 'Select a client')}
                  onChange={(code) => {
                    setSelectedClientCode(code)
                    const client = AUDIT_PLANNING_CLIENTS.find((c) => c.code === code)
                    setSelectedOptionId(client?.options[0]?.id || '')
                  }}
                  options={AUDIT_PLANNING_CLIENTS.map((c) => ({
                    value: c.code,
                    label: `${c.name} (${c.code})`,
                  }))}
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[14px] font-medium text-neutral-800">
                  {t('cab.auditPlanning.create.applicationOrEvent', 'Application or cycle event')} <span className="text-error-500">*</span>
                </label>
                <SelectField
                  value={selectedOptionId}
                  placeholder={t('cab.auditPlanning.create.selectEvent', 'Choose the application or cycle event')}
                  onChange={setSelectedOptionId}
                  disabled={!selectedClient}
                  options={(selectedClient?.options || []).map((opt) => ({
                    value: opt.id,
                    label: optionLabel(opt),
                  }))}
                  className="h-11"
                />
              </div>
            </div>
          </section>

          {/* Card 2: Details & Special audit / Application pre-filled details */}
          {selectedClient && selectedOption && (
            <section className="space-y-5 rounded-[16px] border border-[#ececec] bg-white p-5">
              <div>
                <h2 className="text-[15px] font-bold text-neutral-900">{t('cab.auditPlanning.create.takenTitle', 'Taken from earlier stages')}</h2>
                <p className="mt-0.5 text-[12px] text-neutral-500">
                  {t('cab.auditPlanning.create.takenDescription', 'These values come from the application, quotation, technical feasibility and certification cycle. Check them and confirm.')}
                </p>
              </div>

              {existingPlan && !isSpecialAudit && (
                <div className="rounded-[8px] border border-[#fde68a] bg-[#fffbeb] px-4 py-3">
                  <p className="text-[13px] font-bold text-neutral-900">
                    {t('cab.auditPlanning.create.existingCovers', '{{number}} already covers {{stage}} ({{status}})', { number: existingPlan.planNumber, stage: auditStageLabel(t, existingPlan.stage), status: auditStatusLabel(t, existingPlan.status) })}
                  </p>
                  <p className="mt-0.5 text-[12px] text-neutral-600">
                    {t('cab.auditPlanning.create.existingHint', 'Open that plan instead of creating a second one for the same stage.')}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(cabBuildAuditPlanPath(existingPlan.planNumber))}
                    className="mt-1 text-[13px] font-semibold text-[#1236a3] underline-offset-4 hover:underline"
                  >
                    {t('cab.auditPlanning.create.openPlan', 'Open plan')}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{t('cab.auditSchedule.client', 'Client')}</p>
                  <p className="mt-0.5 text-[14px] font-bold text-neutral-900">{selectedClient.name}</p>
                  {selectedOption.type === 'application' && (
                    <p className="mt-0.5 text-[11px] text-neutral-400">
                      {t('cab.auditPlanning.create.fromApplication', 'From application {{number}}', { number: selectedOption.applicationNumber })}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{t('cab.auditSchedule.standard', 'Standard')}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedOption.standards.map((std) => (
                      <span
                        key={std}
                        className="rounded-[4px] border border-[#c7d7fa] bg-white px-2 py-0.5 text-[11px] font-medium text-[#1236a3]"
                      >
                        {std}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{t('cab.auditSchedule.auditStage', 'Audit stage')}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-bold text-neutral-900">{auditStageLabel(t, selectedOption.stage)}</span>
                    <button
                      type="button"
                      onClick={toggleSpecialMode}
                      className="text-[12px] font-semibold text-[#1236a3] underline-offset-4 hover:underline"
                    >
                      {isSpecialAudit && dueStageOption
                        ? t('cab.auditPlanning.create.useDueStage', 'Use the due stage ({{stage}})', { stage: auditStageLabel(t, dueStageOption.stage) })
                        : t('cab.auditPlanning.create.planSpecial', 'Plan a special audit instead')}
                    </button>
                  </div>
                  <p className="mt-0.5 text-[11px] text-neutral-400">
                    {isSpecialAudit
                      ? t('cab.auditPlanning.create.specialChosen', 'Special audit chosen by you')
                      : selectedOption.type === 'application'
                        ? t('cab.auditPlanning.create.fromApplication', 'From application {{number}}', { number: selectedOption.applicationNumber })
                        : ''}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{t('cab.auditPlanning.fields.site', 'Site')}</p>
                  <p className="mt-0.5 text-[14px] font-bold text-neutral-900">
                    {selectedOption.siteCode} · {selectedOption.siteName}
                  </p>
                  {selectedOption.siteAddress && (
                    <p className="mt-0.5 text-[11px] text-neutral-500">{selectedOption.siteAddress}</p>
                  )}
                  {selectedOption.type === 'application' && (
                    <p className="mt-0.5 text-[11px] text-neutral-400">
                      {t('cab.auditPlanning.create.siteDeclared', '1 site(s) declared in the application')}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                    {t('cab.auditPlanning.create.proposedTeam', 'Proposed team')}
                  </p>
                  <p className="mt-0.5 text-[13px] text-neutral-500">
                    {t('cab.auditPlanning.create.proposedTeamHint', 'Chosen and confirmed on the build page.')}
                  </p>
                </div>
              </div>

              {isSpecialAudit && (
                <div className="space-y-1.5 border-t border-[#f0f0f0] pt-4">
                  <label className="block text-[14px] font-medium text-neutral-800">
                    {t('cab.auditPlanning.create.specialReason', 'Reason for the special audit')} <span className="text-error-500">*</span>
                  </label>
                  <textarea
                    value={specialReason}
                    onChange={(e) => setSpecialReason(e.target.value)}
                    placeholder={t('cab.auditPlanning.create.specialReasonPlaceholder', 'For example: short-notice audit after a complaint')}
                    rows={2}
                    maxLength={500}
                    className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-3.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-[#1236a3] focus:outline-none focus:ring-1 focus:ring-[#1236a3]"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-[14px] font-medium text-neutral-800">
                    {t('cab.auditSchedule.startDate', 'Start date')} <span className="text-error-500">*</span>
                  </label>
                  <IsoDateField value={startDate} onChange={setStartDate} />
                  {startError && (
                    <p role="alert" className="text-small-light text-error-500">
                      {startError}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[14px] font-medium text-neutral-800">
                    {t('cab.auditSchedule.endDate', 'End date')} <span className="text-error-500">*</span>
                  </label>
                  <IsoDateField value={endDate} onChange={setEndDate} />
                  {endError && (
                    <p role="alert" className="text-small-light text-error-500">
                      {endError}
                    </p>
                  )}
                </div>
              </div>

              <div className="max-w-md space-y-1.5">
                <label className="block text-[14px] font-medium text-neutral-800">
                  {t('cab.auditSchedule.leadAuditor', 'Lead auditor')} <span className="text-error-500">*</span>
                </label>
                <SelectField
                  value={leadAuditor}
                  placeholder={t('cab.auditPlanning.create.selectLead', 'Select the lead auditor')}
                  onChange={setLeadAuditor}
                  options={AVAILABLE_AUDITORS_POOL.filter((a) => a.role === 'Lead Auditor').map((a) => ({
                    value: a.name,
                    label: `${a.name} (${a.schemes.join(', ')})`,
                  }))}
                  className="h-11"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0f0f0] pt-4">
                <span className="text-[12px] text-neutral-400">
                  {dateErrorMessage
                    ? dateErrorMessage
                    : isSpecialAudit && !specialReason.trim()
                      ? ''
                      : t('cab.auditPlanning.create.ready', 'All pre-checks ready. Proceed to build the full plan.')}
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.cabAuditPlanning)}
                    className="h-11 rounded-[8px] border border-[#e2e2e2] bg-white px-5 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit || isSubmitting}
                    className={cn(
                      'h-11 rounded-[8px] px-5 text-[14px] font-semibold text-white transition-all',
                      canSubmit
                        ? 'bg-[#1236a3] hover:bg-[#0e2a80]'
                        : 'cursor-not-allowed bg-[#1236a3]/50',
                    )}
                  >
                    {isSubmitting ? t('cab.auditPlanning.create.creating', 'Creating...') : t('cab.auditPlanning.create.confirm', 'Confirm and create plan')}
                  </button>
                </div>
              </div>
            </section>
          )}
        </form>
      </main>
    </CabLayout>
  )
}
