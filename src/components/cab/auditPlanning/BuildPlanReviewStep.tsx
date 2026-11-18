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
import type { TourStepConfig } from '@/context/TourContext'
import type { AuditPlan, AuditStageType, AuditTeamMember } from '@/lib/api/cabAuditPlanningApi'
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
  onGoToStep: (step: 1 | 2 | 3 | 4) => void
  onUpdateStatus: (status: AuditPlan['status'], toast: string) => void
  onStartExecution: () => void
  onOpenChangeModal: () => void
  onChangeObjectives: (val: string) => void
  onChangeScope: (val: string) => void
  onChangeAvailability: (val: boolean) => void
  onChangeNoConflicts: (val: boolean) => void
  onSaveDraft: () => void
  onSendToClient: () => void
}

function formatFullRange(start: string, end: string) {
  try {
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
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
  onGoToStep,
  onUpdateStatus,
  onStartExecution,
  onOpenChangeModal,
  onChangeObjectives,
  onChangeScope,
  onChangeAvailability,
  onChangeNoConflicts,
  onSaveDraft,
  onSendToClient,
}: BuildPlanReviewStepProps) {
  const checklistItems = [
    { label: 'Audit team', done: teamReady, fixStep: 1 as const },
    {
      label: agendaReady ? 'Agenda activities added' : 'Add at least one activity',
      done: agendaReady,
      fixStep: 2 as const,
    },
    { label: 'Site & logistics', done: siteReady, fixStep: 3 as const },
    { label: 'Team declarations', done: declarationsReady },
  ]

  const isNotStarted = plan.status === 'Draft' || plan.status === 'Planned'

  return (
    <div className="space-y-5">
      {/* Before you send */}
      <section className="space-y-3 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
        <h2 className="text-[15px] font-bold text-neutral-900">Before you send</h2>
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
                  Fix →
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Audit lifecycle */}
      <section className="flex flex-col justify-between gap-4 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none lg:flex-row lg:items-center">
        <div>
          <h3 className="text-[15px] font-bold text-neutral-900">Audit lifecycle</h3>
          <p className="mt-0.5 text-[13px] text-neutral-500">
            Current status: <span className="font-semibold text-neutral-800">{plan.status}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-start gap-2.5">
          {plan.status === 'Draft' && (
            <button
              type="button"
              onClick={() => onUpdateStatus('Planned', 'Audit plan confirmed and marked as Planned.')}
              className="h-11 rounded-[8px] border border-[#1236a3] bg-white px-4 text-[13px] font-semibold text-[#1236a3] transition hover:bg-[#f3f6fd]"
            >
              Confirm plan (Mark Planned)
            </button>
          )}

          <button
            type="button"
            onClick={() => onUpdateStatus('In progress', 'Audit started. Status updated to In progress.')}
            className="h-11 rounded-[8px] bg-[#1236a3] px-5 text-[13px] font-semibold text-white transition hover:bg-[#0e2a80]"
          >
            Start audit
          </button>

          <div className="flex flex-col items-center">
            <button
              type="button"
              disabled={isNotStarted}
              onClick={() => onUpdateStatus('Under review', 'Audit sent for technical review.')}
              className="h-11 rounded-[8px] border border-[#d6dff2] bg-white px-4 text-[13px] font-semibold text-[#1236a3] transition hover:bg-[#f3f6fd] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send for review
            </button>
            {isNotStarted && <span className="mt-1 text-[11px] text-neutral-400">Start the audit first.</span>}
          </div>

          <div className="flex flex-col items-center">
            <button
              type="button"
              disabled={isNotStarted}
              onClick={() => onUpdateStatus('Completed', 'Audit marked as Completed.')}
              className="h-11 rounded-[8px] border border-[#d6dff2] bg-white px-4 text-[13px] font-semibold text-[#1236a3] transition hover:bg-[#f3f6fd] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mark completed
            </button>
            {isNotStarted && <span className="mt-1 text-[11px] text-neutral-400">Start the audit first.</span>}
          </div>

          <button
            type="button"
            onClick={onStartExecution}
            className="h-11 rounded-[8px] bg-[#1236a3] px-5 text-[13px] font-semibold text-white transition hover:bg-[#0e2a80]"
          >
            Start / continue execution
          </button>
        </div>
      </section>

      {/* 6-Column Summary Strip */}
      <CabTourStep steps={tourSteps} stepId="build-plan-summary-bar">
        <div className="grid grid-cols-2 gap-4 rounded-[12px] border border-[#ececec] bg-white p-5 sm:grid-cols-3 lg:grid-cols-6">
          <div className="space-y-1 border-e border-neutral-100 pe-3 last:border-e-0">
            <div className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-[#dbeafe] text-[#1447e6]">
                <CalendarIcon className="size-4" />
              </span>
              <span className="text-[12px] font-medium text-neutral-500">Audit plan</span>
            </div>
            <p className="text-[15px] font-bold text-neutral-900">{plan.planNumber}</p>
            <p className="text-[12px] text-neutral-500">{auditStage}</p>
          </div>

          <div className="space-y-1 border-e border-neutral-100 pe-3 last:border-e-0">
            <div className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-[#fef3c6] text-[#a58401]">
                <AppIcon icon={BuildingsIcon} size={15} />
              </span>
              <span className="text-[12px] font-medium text-neutral-500">Client</span>
            </div>
            <p className="truncate text-[15px] font-bold text-neutral-900">{plan.clientName}</p>
            <p className="text-[12px] text-neutral-500">
              {plan.clientCode} · {plan.country}
            </p>
          </div>

          <div className="space-y-1 border-e border-neutral-100 pe-3 last:border-e-0">
            <div className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-[#ede9fe] text-[#6d28d9]">
                <AppIcon icon={FileTextIcon} size={15} />
              </span>
              <span className="text-[12px] font-medium text-neutral-500">Application</span>
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
              <span className="text-[12px] font-medium text-neutral-500">Reviewed duration</span>
            </div>
            <p className="text-[14px] font-bold text-neutral-900">
              {plan.reviewedDurationDays.toFixed(1)} day(s)
            </p>
          </div>

          <div className="space-y-1 border-e border-neutral-100 pe-3 last:border-e-0">
            <div className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-[#fee2e2] text-[#dc2626]">
                <AppIcon icon={MapPinIcon} size={15} />
              </span>
              <span className="text-[12px] font-medium text-neutral-500">Site</span>
            </div>
            <p className="text-[14px] font-bold text-neutral-900">{siteCode}</p>
            <p className="text-[12px] text-neutral-500">
              {plan.clientName} · {plan.country}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-[#fce7f3] text-[#be185d]">
                <AppIcon icon={UserIcon} size={15} />
              </span>
              <span className="text-[12px] font-medium text-neutral-500">Primary contact</span>
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
                <h3 className="text-[16px] font-bold text-neutral-900">Audit details</h3>
                <p className="mt-0.5 text-[12px] text-neutral-400">
                  Confirmed when the plan was created. Use Change to alter them; the reason is recorded.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                <div>
                  <span className="block text-[12px] text-neutral-500">Audit stage</span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[14px] font-bold text-neutral-900">{auditStage}</span>
                    <button
                      type="button"
                      onClick={onOpenChangeModal}
                      className="text-[12px] font-semibold text-[#1236a3] hover:underline"
                    >
                      Change
                    </button>
                  </div>
                </div>

                <div>
                  <span className="block text-[12px] text-neutral-500">Proposed dates</span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[14px] font-bold text-neutral-900">
                      {formatFullRange(proposedStartDate, proposedEndDate)}
                    </span>
                    <button
                      type="button"
                      onClick={onOpenChangeModal}
                      className="text-[12px] font-semibold text-[#1236a3] hover:underline"
                    >
                      Change
                    </button>
                  </div>
                </div>

                <div>
                  <span className="block text-[12px] text-neutral-500">Lead Auditor</span>
                  <p className="mt-1 text-[14px] font-semibold text-neutral-900">{leadAuditor}</p>
                </div>

                <div>
                  <span className="block text-[12px] text-neutral-500">Audit team</span>
                  <p className="mt-1 text-[14px] font-medium text-neutral-800">
                    {teamMembers.map((m) => m.name).join(', ')}
                  </p>
                </div>
              </div>
            </section>
          </CabTourStep>
        </div>

        <div className="lg:col-span-6">
          <CabTourStep steps={tourSteps} stepId="build-plan-objectives">
            <section className="h-full space-y-4 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
              <h3 className="text-[16px] font-bold text-neutral-900">Objectives and scope</h3>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-neutral-700">Audit objectives</label>
                <textarea
                  value={auditObjectives}
                  onChange={(e) => onChangeObjectives(e.target.value)}
                  rows={2}
                  className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-3 text-[13px] text-neutral-900 focus:border-[#1236a3] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-neutral-700">Scope summary</label>
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
          <h3 className="text-[15px] font-bold text-neutral-900">Team declarations</h3>
          <button
            type="button"
            onClick={onSaveDraft}
            className="text-[13px] font-semibold text-[#1236a3] hover:underline"
          >
            Edit
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              checked={availabilityConfirmed}
              onChange={() => onChangeAvailability(!availabilityConfirmed)}
            />
            <span className="text-[13px] font-medium text-neutral-800">
              All team members have confirmed their availability for the planned dates.
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              checked={noConflictsDeclared}
              onChange={() => onChangeNoConflicts(!noConflictsDeclared)}
            />
            <span className="text-[13px] font-medium text-neutral-800">
              All team members have declared no conflicts of interest.
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
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onSendToClient}
          className="inline-flex h-11 items-center justify-center rounded-[8px] bg-[#1236a3] px-6 text-[14px] font-semibold text-white transition-colors hover:bg-[#0e2a80]"
        >
          Send to client
        </button>
      </section>
    </div>
  )
}
