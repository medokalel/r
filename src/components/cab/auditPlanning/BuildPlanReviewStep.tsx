import { useTranslation } from 'react-i18next'
import {
  AppIcon,
  BuildingsIcon,
  CalendarIcon,
  FileTextIcon,
  HistoryIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
} from '@/components/icons'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { Checkbox } from '@/components/ui/Checkbox'
import { AuditPlanLifecycleBar } from '@/components/cab/auditPlanning/AuditPlanLifecycleBar'
import type { TourStepConfig } from '@/context/TourContext'
import type { AuditPlan, AuditStageType, AuditTeamMember } from '@/lib/api/cabAuditPlanningApi'
import { auditDateLocale, auditStageLabel, isolateDate } from '@/components/cab/auditPlanning/shared'
import { localizeCountry } from '@/lib/auditSchedule'
import { cn } from '@/lib/utils'

interface BuildPlanReviewStepProps {
  plan: AuditPlan
  tourSteps: TourStepConfig[]
  auditStage: AuditStageType
  proposedStartDate: string
  proposedEndDate: string
  leadAuditor: string
  teamMembers: AuditTeamMember[]
  siteCode: string
  auditObjectives: string
  scopeSummary: string
  availabilityConfirmed: boolean
  noConflictsDeclared: boolean
  teamReady: boolean
  agendaReady: boolean
  siteReady: boolean
  declarationsReady: boolean
  sendBlockedReason: string | null
  onGoToStep: (step: 1 | 2 | 3 | 4) => void
  onPlanChanged: (plan: AuditPlan) => void
  onStartExecution: () => void
  onOpenChangeModal: () => void
  onChangeObjectives: (val: string) => void
  onChangeScope: (val: string) => void
  onChangeAvailability: (val: boolean) => void
  onChangeNoConflicts: (val: boolean) => void
  onChangeTimezone: (timezone: string) => void
  onSaveDraft: () => void
  onSendToClient: () => void
}

function formatFullRange(start: string, end: string, locale = 'en-GB') {
  try {
    const fmt = (d: Date) =>
      isolateDate(d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' }), locale)
    return `${fmt(new Date(start))} – ${fmt(new Date(end))}`
  } catch {
    return `${start} – ${end}`
  }
}

export function BuildPlanReviewStep({
  plan,
  tourSteps,
  auditStage,
  proposedStartDate,
  proposedEndDate,
  leadAuditor,
  teamMembers,
  siteCode,
  auditObjectives,
  scopeSummary,
  availabilityConfirmed,
  noConflictsDeclared,
  teamReady,
  agendaReady,
  siteReady,
  declarationsReady,
  sendBlockedReason,
  onGoToStep,
  onPlanChanged,
  onStartExecution,
  onOpenChangeModal,
  onChangeObjectives,
  onChangeScope,
  onChangeAvailability,
  onChangeNoConflicts,
  onChangeTimezone,
  onSaveDraft,
  onSendToClient,
}: BuildPlanReviewStepProps) {
  const { t, i18n } = useTranslation()
  const checklistItems = [
    { label: t('cab.auditPlanning.fields.auditTeam', 'Audit team'), done: teamReady, fixStep: 1 as const },
    {
      label: agendaReady ? t('cab.auditPlanning.review.agendaAdded', 'Agenda activities added') : t('cab.auditPlanning.review.addActivity', 'Add at least one activity'),
      done: agendaReady,
      fixStep: 2 as const,
    },
    { label: t('cab.buildAuditPlan.steps.site', 'Site & logistics'), done: siteReady, fixStep: 3 as const },
    { label: t('cab.auditPlanning.review.teamDeclarations', 'Team declarations'), done: declarationsReady },
  ]

  return (
    <div className="space-y-5">
      {/* Before you send */}
      <section className="space-y-3 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
        <h2 className="text-[15px] font-bold text-neutral-900">{t('cab.auditPlanning.review.beforeSend', 'Before you send')}</h2>
        <ul className="space-y-2.5 text-[13px]">
          {checklistItems.map((item) => (
            <li key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'flex size-5 items-center justify-center rounded-full text-[11px] font-bold',
                    item.done ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fef3c7] text-[#d97706]',
                  )}
                >
                  {item.done ? '✓' : '!'}
                </span>
                <span className={item.done ? 'text-neutral-500' : 'font-medium text-neutral-800'}>
                  {item.label}
                </span>
              </div>
              {!item.done && item.fixStep && (
                <button
                  type="button"
                  onClick={() => onGoToStep(item.fixStep)}
                  className="font-semibold text-[#1236a3] hover:underline"
                >
                  {t('cab.auditPlanning.review.fix', 'Fix →')}
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Audit lifecycle */}
      <AuditPlanLifecycleBar
        plan={plan}
        planReady={teamReady && agendaReady && siteReady && declarationsReady}
        onChanged={onPlanChanged}
        onStartExecution={onStartExecution}
      />

      {/* 6-Column Summary Strip */}
      <CabTourStep steps={tourSteps} stepId="build-plan-summary-bar">
        <div className="grid grid-cols-2 gap-4 rounded-[12px] border border-[#ececec] bg-white p-5 sm:grid-cols-3 lg:grid-cols-6">
          <div className="space-y-1 border-e border-neutral-100 pe-3 last:border-e-0">
            <div className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-[#dbeafe] text-[#1447e6]">
                <CalendarIcon className="size-4" />
              </span>
              <span className="text-[12px] font-medium text-neutral-500">{t('cab.auditPlanning.review.auditPlan', 'Audit plan')}</span>
            </div>
            <p className="text-[15px] font-bold text-neutral-900">{plan.planNumber}</p>
            <p className="text-[12px] text-neutral-500">{auditStageLabel(t, auditStage)}</p>
          </div>

          <div className="space-y-1 border-e border-neutral-100 pe-3 last:border-e-0">
            <div className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-[#fef3c6] text-[#a58401]">
                <AppIcon icon={BuildingsIcon} size={15} />
              </span>
              <span className="text-[12px] font-medium text-neutral-500">{t('cab.auditSchedule.client', 'Client')}</span>
            </div>
            <p className="truncate text-[15px] font-bold text-neutral-900">{plan.clientName}</p>
            <p className="text-[12px] text-neutral-500">
              {plan.clientCode} · {localizeCountry(plan.country, i18n.language)}
            </p>
          </div>

          <div className="space-y-1 border-e border-neutral-100 pe-3 last:border-e-0">
            <div className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-[#ede9fe] text-[#6d28d9]">
                <AppIcon icon={FileTextIcon} size={15} />
              </span>
              <span className="text-[12px] font-medium text-neutral-500">{t('cab.auditPlanning.review.application', 'Application')}</span>
            </div>
            <span className="inline-block rounded-[6px] border border-[#dce4f5] bg-[#f8faff] px-2.5 py-0.5 text-[12px] font-semibold text-[#1236a3]">
              {plan.applicationNumber}
            </span>
          </div>

          <div className="space-y-1 border-e border-neutral-100 pe-3 last:border-e-0">
            <div className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-[#d7f4f0] text-[#0f9488]">
                <AppIcon icon={HistoryIcon} size={15} />
              </span>
              <span className="text-[12px] font-medium text-neutral-500">{t('cab.auditPlanning.review.reviewedDuration', 'Reviewed duration')}</span>
            </div>
            <p className="text-[14px] font-bold text-neutral-900">
              {t('cab.auditPlanning.review.durationDays', '{{days}} day(s)', { days: plan.reviewedDurationDays.toFixed(1) })}
            </p>
          </div>

          <div className="space-y-1 border-e border-neutral-100 pe-3 last:border-e-0">
            <div className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-[#fee2e2] text-[#dc2626]">
                <AppIcon icon={MapPinIcon} size={15} />
              </span>
              <span className="text-[12px] font-medium text-neutral-500">{t('cab.auditPlanning.fields.site', 'Site')}</span>
            </div>
            <p className="text-[14px] font-bold text-neutral-900">{siteCode}</p>
            <p className="text-[12px] text-neutral-500">
              {plan.clientName} · {localizeCountry(plan.country, i18n.language)}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-[#fce7f3] text-[#be185d]">
                <AppIcon icon={UserIcon} size={15} />
              </span>
              <span className="text-[12px] font-medium text-neutral-500">{t('cab.auditPlanning.review.primaryContact', 'Primary contact')}</span>
            </div>
            <p className="text-[14px] font-bold text-neutral-900">{plan.primaryContactName}</p>
            <p className="flex items-center gap-1 truncate text-[12px] text-[#1236a3]">
              <AppIcon icon={MailIcon} size={12} className="shrink-0 text-neutral-400" />
              <span className="truncate">{plan.primaryContactEmail}</span>
            </p>
            <p className="flex items-center gap-1 text-[12px] text-neutral-500">
              <AppIcon icon={PhoneIcon} size={12} className="shrink-0 text-neutral-400" />
              <span>{plan.primaryContactPhone}</span>
            </p>
          </div>
        </div>
      </CabTourStep>

      {/* Audit details & Objectives and scope */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <CabTourStep steps={tourSteps} stepId="build-plan-details">
            <section className="h-full space-y-4 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
              <div>
                <h3 className="text-[16px] font-bold text-neutral-900">{t('cab.auditPlanning.review.auditDetails', 'Audit details')}</h3>
                <p className="mt-0.5 text-[12px] text-neutral-400">
                  {t('cab.auditPlanning.review.detailsHint', 'Confirmed when the plan was created. Use Change to alter them; the reason is recorded.')}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                <div>
                  <span className="block text-[12px] text-neutral-500">{t('cab.auditSchedule.auditStage', 'Audit stage')}</span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[14px] font-bold text-neutral-900">{auditStageLabel(t, auditStage)}</span>
                    <button
                      type="button"
                      onClick={onOpenChangeModal}
                      className="text-[12px] font-semibold text-[#1236a3] hover:underline"
                    >
                      {t('common.change', 'Change')}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="block text-[12px] text-neutral-500">{t('cab.auditPlanning.review.proposedDates', 'Proposed dates')}</span>
                  <div className="mt-1 flex items-center gap-2">
                    <span dir="ltr" className="text-[14px] font-bold text-neutral-900">
                      {formatFullRange(proposedStartDate, proposedEndDate, auditDateLocale(i18n.language))}
                    </span>
                    <button
                      type="button"
                      onClick={onOpenChangeModal}
                      className="text-[12px] font-semibold text-[#1236a3] hover:underline"
                    >
                      {t('common.change', 'Change')}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="block text-[12px] text-neutral-500">{t('cab.auditSchedule.leadAuditor', 'Lead auditor')}</span>
                  <p className="mt-1 text-[14px] font-semibold text-neutral-900">{leadAuditor}</p>
                </div>

                <div>
                  <span className="block text-[12px] text-neutral-500">{t('cab.auditPlanning.fields.auditTeam', 'Audit team')}</span>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-medium text-neutral-800">
                      {teamMembers.map((m) => m.name).join(', ')}
                    </span>
                    <button
                      type="button"
                      onClick={() => onGoToStep(1)}
                      className="text-[12px] font-semibold text-[#1236a3] hover:underline"
                    >
                      {t('cab.auditPlanning.review.changeTeam', 'Change in the audit team')}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="block text-[12px] text-neutral-500">{t('cab.auditPlanning.review.timezone', 'Timezone')}</span>
                  <select
                    value={plan.timezone}
                    onChange={(e) => onChangeTimezone(e.target.value)}
                    className="mt-1 h-9 w-full max-w-xs rounded-[8px] border border-[#e2e2e2] bg-white px-2.5 text-[13px] text-neutral-900 focus:border-[#1236a3] focus:outline-none"
                  >
                    {Array.from(
                      new Set([plan.timezone, 'Asia/Riyadh', 'Asia/Dubai', 'Africa/Cairo'].filter(Boolean)),
                    ).map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>
          </CabTourStep>
        </div>

        <div className="lg:col-span-6">
          <CabTourStep steps={tourSteps} stepId="build-plan-objectives">
            <section className="h-full space-y-4 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
              <h3 className="text-[16px] font-bold text-neutral-900">{t('cab.auditPlanning.review.objectivesScope', 'Objectives and scope')}</h3>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-neutral-700">{t('cab.auditPlanning.review.objectives', 'Audit objectives')}</label>
                <textarea
                  value={auditObjectives}
                  onChange={(e) => onChangeObjectives(e.target.value)}
                  rows={2}
                  className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-3 text-[13px] text-neutral-900 focus:border-[#1236a3] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-neutral-700">{t('cab.auditPlanning.review.scopeSummary', 'Scope summary')}</label>
                <textarea
                  value={scopeSummary}
                  onChange={(e) => onChangeScope(e.target.value)}
                  rows={2}
                  className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-3 text-[13px] text-neutral-900 focus:border-[#1236a3] focus:outline-none"
                />
              </div>
            </section>
          </CabTourStep>
        </div>
      </div>

      {/* Team declarations */}
      <section className="rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
        <div className="mb-4 flex items-center justify-between border-b border-[#ececec] pb-2.5">
          <h3 className="text-[15px] font-bold text-neutral-900">{t('cab.auditPlanning.review.teamDeclarations', 'Team declarations')}</h3>
          <button
            type="button"
            onClick={onSaveDraft}
            className="text-[13px] font-semibold text-[#1236a3] hover:underline"
          >
            {t('common.edit', 'Edit')}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              checked={availabilityConfirmed}
              onChange={() => onChangeAvailability(!availabilityConfirmed)}
            />
            <span className="text-[13px] font-medium text-neutral-800">
              {t('cab.auditPlanning.review.availabilityConfirmed', 'All team members have confirmed their availability for the planned dates.')}
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              checked={noConflictsDeclared}
              onChange={() => onChangeNoConflicts(!noConflictsDeclared)}
            />
            <span className="text-[13px] font-medium text-neutral-800">
              {t('cab.auditPlanning.review.noConflicts', 'All team members have declared no conflicts of interest.')}
            </span>
          </label>
        </div>
      </section>

      {/* Bottom Action Bar: ← Back & Send to client (Matches Screenshot) */}
      <section className="flex items-center justify-between rounded-[16px] border border-[#ececec] bg-white px-5 py-4">
        <button
          type="button"
          onClick={() => onGoToStep(3)}
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-600 transition-colors hover:text-neutral-900"
        >
          <span>←</span>
          <span>{t('common.back', 'Back')}</span>
        </button>

        <div className="flex items-center gap-3">
          {sendBlockedReason && (
            <span className="text-[13px] text-neutral-500">{sendBlockedReason}</span>
          )}
          <button
            type="button"
            onClick={onSendToClient}
            disabled={Boolean(sendBlockedReason)}
            title={sendBlockedReason ?? undefined}
            className="inline-flex h-11 items-center justify-center rounded-[8px] bg-[#1236a3] px-6 text-[14px] font-semibold text-white transition-colors hover:bg-[#0e2a80] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('cab.buildAuditPlan.sendToClient', 'Send to client')}
          </button>
        </div>
      </section>
    </div>
  )
}
