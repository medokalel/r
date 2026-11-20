import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import {
  AUDIT_PLANNING_CLIENTS,
  AVAILABLE_AUDITORS_POOL,
  saveAuditPlan,
} from '@/lib/api/cabAuditPlanningApi'
import { BreadcrumbChevron, IsoDateField } from '@/components/cab/auditPlanning/shared'
import { SelectField } from '@/components/ui/Select'
import {
  auditDateErrorField,
  todayIsoDate,
  validateAuditDates,
  type AuditDateError,
} from '@/lib/auditPlanDates'
import { ROUTES } from '@/lib/routes'
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
  const navigate = useNavigate()

  const [selectedClientCode, setSelectedClientCode] = useState('')
  const [selectedOptionId, setSelectedOptionId] = useState('')
  const [specialReason, setSpecialReason] = useState('')
  const [today] = useState(() => todayIsoDate())
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
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
          ? `Special audit: ${specialReason.trim()}`
          : `Evaluate conformity and implementation for ${selectedOption.stage} (${selectedOption.standardName}).`,
        scopeSummary: `Integrated Management System and operational processes at ${selectedOption.siteName} (${selectedOption.siteCode}).`,
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
            Start from an application or the next due event of a certification cycle. What earlier stages know is filled in: check it and confirm.
          </p>
        </div>

        <form onSubmit={handleConfirmCreate} className="space-y-5">
          {/* Card 1: Where this audit comes from */}
          <section className="space-y-4 rounded-[16px] border border-[#ececec] bg-white p-5">
            <h2 className="text-[15px] font-bold text-neutral-900">
              Where this audit comes from
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-[14px] font-medium text-neutral-800">
                  Client <span className="text-error-500">*</span>
                </label>
                <SelectField
                  value={selectedClientCode}
                  placeholder="Select a client"
                  onChange={(code) => {
                    setSelectedClientCode(code)
                    const client = AUDIT_PLANNING_CLIENTS.find((c) => c.code === code)
                    setSelectedOptionId(client?.options[0]?.id || '')
                  }}
                  options={AUDIT_PLANNING_CLIENTS.map((c) => ({
                    value: c.code,
                    label: `${c.name} (${c.code} · ${c.country})`,
                  }))}
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[14px] font-medium text-neutral-800">
                  Application or cycle event <span className="text-error-500">*</span>
                </label>
                <SelectField
                  value={selectedOptionId}
                  placeholder="Choose the application or cycle event"
                  onChange={setSelectedOptionId}
                  disabled={!selectedClient}
                  options={(selectedClient?.options || []).map((opt) => ({
                    value: opt.id,
                    label: opt.label,
                  }))}
                  className="h-11"
                />
              </div>
            </div>
          </section>

          {/* Card 2: Details & Special audit / Application pre-filled details */}
          {selectedClient && selectedOption && (
            <section className="space-y-5 rounded-[16px] border border-[#ececec] bg-white p-5">
              {isSpecialAudit ? (
                <>
                  <div className="rounded-[8px] border-s-4 border-s-[#f59e0b] bg-[#fffbeb] px-4 py-3">
                    <p className="text-[13px] font-bold text-neutral-900">
                      Special audit without an application
                    </p>
                    <p className="mt-0.5 text-[12px] text-neutral-600">
                      Use this only for special or short-notice audits. Give the reason; the details are completed on the build page.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[14px] font-medium text-neutral-800">
                      Reason for the special audit <span className="text-error-500">*</span>
                    </label>
                    <textarea
                      value={specialReason}
                      onChange={(e) => setSpecialReason(e.target.value)}
                      placeholder="For example: short-notice audit after a complaint"
                      rows={3}
                      className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-3.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-[#1236a3] focus:outline-none focus:ring-1 focus:ring-[#1236a3]"
                    />
                  </div>
                </>
              ) : (
                <div className="rounded-[10px] border border-[#dce4f5] bg-[#f8faff] p-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                        Audit stage
                      </p>
                      <p className="mt-0.5 text-[14px] font-bold text-neutral-900">
                        {selectedOption.stage}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                        Reviewed duration
                      </p>
                      <p className="mt-0.5 text-[14px] font-bold text-[#1236a3]">
                        {selectedOption.reviewedDurationDays.toFixed(1)} day(s)
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                        Site
                      </p>
                      <p className="mt-0.5 text-[14px] font-bold text-neutral-900">
                        {selectedOption.siteCode} · {selectedOption.siteName}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                        Standards
                      </p>
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
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-[14px] font-medium text-neutral-800">
                    Start date <span className="text-error-500">*</span>
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
                    End date <span className="text-error-500">*</span>
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
                  Lead auditor <span className="text-error-500">*</span>
                </label>
                <SelectField
                  value={leadAuditor}
                  placeholder="Select the lead auditor"
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
                      ? 'Provide the reason for the special audit.'
                      : 'All pre-checks ready. Proceed to build the full plan.'}
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.cabAuditPlanning)}
                    className="h-11 rounded-[8px] border border-[#e2e2e2] bg-white px-5 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    Cancel
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
                    {isSubmitting ? 'Creating...' : 'Confirm and create plan'}
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
