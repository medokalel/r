import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import {
  fetchAuditPlanById,
  saveAuditPlan,
  LIBRARY_EXTRA_CHECKLISTS,
  type AuditChecklistSection,
  type AuditExecutionData,
  type AuditPlan,
  type ChecklistItem,
  type ChecklistResultValue,
} from '@/lib/api/cabAuditPlanningApi'
import {
  AuditStatusBadge,
  BreadcrumbChevron,
  IcascoConnectedStepper,
} from '@/components/cab/auditPlanning/shared'
import { toast } from '@/lib/toast'
import { ExecutionPreparationStep } from '@/components/cab/auditPlanning/ExecutionPreparationStep'
import {
  ExecutionConductStep,
  isAuditedResult,
  isNonconforming,
} from '@/components/cab/auditPlanning/ExecutionConductStep'
import {
  ExecutionOpeningStep,
  ExecutionTeamReviewStep,
  ExecutionClosingStep,
  ExecutionReportStep,
} from '@/components/cab/auditPlanning/ExecutionMeetingReportSteps'
import { ROUTES } from '@/lib/routes'

type ExecutionStep = 1 | 2 | 3 | 4 | 5 | 6

const EXECUTION_STEPS: Array<{ id: ExecutionStep; label: string }> = [
  { id: 1, label: 'Preparation' },
  { id: 2, label: 'Opening meeting' },
  { id: 3, label: 'Conduct' },
  { id: 4, label: 'Team review' },
  { id: 5, label: 'Closing meeting' },
  { id: 6, label: 'Report' },
]

function formatDisplayDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export function CabAuditExecutionPage() {
  const { t } = useTranslation()
  const { planId } = useParams<{ planId: string }>()

  const [plan, setPlan] = useState<AuditPlan | null>(null)
  const [execution, setExecution] = useState<AuditExecutionData | null>(null)
  const executionRef = useRef<AuditExecutionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      const data = await fetchAuditPlanById(planId || 'AUD-0310')
      if (data) {
        setPlan(data)
        setExecution(data.execution)
        executionRef.current = data.execution
      }
      setIsLoading(false)
    }
    load()
  }, [planId])

  const showToast = (message: string, variant: 'success' | 'warning' = 'success') => {
    if (variant === 'warning') {
      toast.error(message)
    } else {
      toast.success(message)
    }
  }

  const persistExecution = async (
    nextExecution: AuditExecutionData,
    statusOverride?: AuditPlan['status'],
  ) => {
    if (!plan) return
    executionRef.current = nextExecution
    setExecution(nextExecution)
    const updated = await saveAuditPlan({
      id: plan.id,
      planNumber: plan.planNumber,
      status: statusOverride ?? plan.status,
      execution: nextExecution,
    })
    setPlan((prev) => (prev ? { ...prev, status: updated.status } : updated))
  }

  const { totalItems, auditedItems, nonconformingItems, mandatoryUnauditedCount } = useMemo(() => {
    if (!execution) {
      return { totalItems: 0, auditedItems: 0, nonconformingItems: 0, mandatoryUnauditedCount: 0 }
    }
    let total = 0
    let audited = 0
    let nc = 0
    let mandUnaudited = 0
    for (const sec of execution.checklists) {
      for (const item of sec.items) {
        total += 1
        if (isAuditedResult(item.result)) audited += 1
        if (isNonconforming(item.result)) nc += 1
        if (item.mandatory && !isAuditedResult(item.result)) mandUnaudited += 1
      }
    }
    return { totalItems: total, auditedItems: audited, nonconformingItems: nc, mandatoryUnauditedCount: mandUnaudited }
  }, [execution])

  const daysSpent = useMemo(() => {
    if (!execution) return 0
    const totalHours = execution.timeSpent.reduce((sum, e) => sum + e.hours, 0)
    return Number((totalHours / 8).toFixed(2))
  }, [execution])

  const getStepValidationError = (step: ExecutionStep): string | null => {
    const current = executionRef.current || execution
    if (!current) return null

    if (step === 1) {
      const p = current.preparation
      if (!p.planSentToClient) return 'Please send the audit plan to the client first.'
      if (!p.declarationsCompleted) return 'Team availability and impartiality declarations must be completed.'
      if (!p.clientDocumentsReviewed) return 'Please confirm that the client documents were reviewed.'
    }

    if (step === 2) {
      const om = current.openingMeeting
      const hasSignedClient = om.attendees.some((a) => a.organization === 'Client' && Boolean(a.signatureValue))
      const hasTeam = om.attendees.some((a) => a.organization === 'Audit team')
      if (!om.agendaConfirmed) return 'Please confirm the agenda with the client.'
      if (!om.confidentialityGiven) return 'Please confirm the confidentiality statement was given.'
      if (!hasSignedClient) return 'At least one client attendee must sign the opening meeting attendance.'
      if (!hasTeam) return 'Please add at least one audit team member to the attendance.'
    }

    if (step === 3) {
      if (mandatoryUnauditedCount > 0) {
        return `Complete all mandatory checklist items first (${mandatoryUnauditedCount} remaining without a result).`
      }
    }

    if (step === 4) {
      const tr = current.teamReview
      if (tr.dailyWrapUps.length === 0) return 'Please record at least one daily team wrap-up.'
      if (!tr.gradingConsensus) return 'Please confirm the team agreed on the grading of every finding.'
    }

    if (step === 5) {
      const cm = current.closingMeeting
      const hasSignedClient = cm.attendees.some((a) => a.organization === 'Client' && Boolean(a.signatureValue))
      if (!cm.findingsPresented) return 'Please confirm that findings were presented to the client.'
      if (!cm.clientPosition) return "Please record the client's position on the findings."
      if (!hasSignedClient) return 'At least one client attendee must sign the closing meeting attendance.'
      if (current.timeSpent.length === 0) return 'Please record the time spent by the audit team.'
    }

    return null
  }

  const completeStep = (step: ExecutionStep, nextStep?: ExecutionStep) => {
    const current = executionRef.current || execution
    if (!current) return
    const validationError = getStepValidationError(step)
    if (validationError) {
      showToast(validationError, 'warning')
      return
    }
    const completed = current.completedSteps.includes(step)
      ? current.completedSteps
      : [...current.completedSteps, step]
    void persistExecution(
      { ...current, completedSteps: completed, activeStep: nextStep ?? step },
      step === 6 ? 'Completed' : 'In progress',
    )
    showToast(`Step ${step} completed.`)
  }

  const handleAddChecklist = (libraryId: string) => {
    if (!execution || !plan) return
    const lib = LIBRARY_EXTRA_CHECKLISTS.find((l) => l.id === libraryId)
    if (!lib) return
    if (execution.checklists.some((c) => c.id === lib.id)) {
      showToast('This checklist is already assigned.')
      return
    }
    const newSection: AuditChecklistSection = {
      id: lib.id,
      title: lib.title,
      libraryTag: 'iCASCO library, approved',
      assignedAuditor: plan.leadAuditor,
      items: Array.from({ length: lib.itemsCount }).map((_, i) => ({
        id: `${lib.id}-${i + 1}`,
        clauseRef: `${lib.clausePrefix} ${4 + i}.1`,
        title: `${lib.clausePrefix} requirement check ${i + 1}`,
        mandatory: true,
        description: `Verify implementation and documented evidence for ${lib.clausePrefix} clause ${4 + i}.1.`,
        whatToLookFor: 'Confirm operational records and staff awareness.',
        evidenceToAskFor: ['Operational records', 'Procedure document'],
        result: '',
        evidenceNotes: '',
        documentsSampled: '',
        peopleInterviewed: '',
      })),
    }
    void persistExecution({ ...execution, checklists: [...execution.checklists, newSection] })
    showToast(`${lib.title} added.`)
  }

  const handleUpdateChecklistItem = (
    sectionId: string,
    itemId: string,
    patch: Partial<ChecklistItem>,
  ) => {
    if (!execution) return
    const nextChecklists = execution.checklists.map((sec) =>
      sec.id === sectionId
        ? { ...sec, items: sec.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)) }
        : sec,
    )
    void persistExecution({ ...execution, checklists: nextChecklists })
  }

  const handleMarkAllConforming = (sectionId: string) => {
    if (!execution) return
    const nextChecklists = execution.checklists.map((sec) =>
      sec.id === sectionId
        ? {
            ...sec,
            items: sec.items.map((item) =>
              item.result === '' || item.result === 'Not audited'
                ? { ...item, result: 'Conforming' as ChecklistResultValue }
                : item,
            ),
          }
        : sec,
    )
    void persistExecution({ ...execution, checklists: nextChecklists })
    showToast('All remaining items marked as Conforming.')
  }

  if (isLoading || !plan || !execution) {
    return (
      <CabLayout sidebarVariant="auditPlanning">
        <div className="flex flex-1 items-center justify-center p-12 text-neutral-400">
          {t('common.loading', 'Loading audit execution...')}
        </div>
      </CabLayout>
    )
  }

  const activeStep = execution.activeStep

  return (
    <CabLayout sidebarVariant="auditPlanning">
      <CabHeader
        title="Audit execution"
        subtitle={`${plan.planNumber} · ${plan.clientName} · ${plan.stage}`}
        notificationCount={6}
      />

      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        {/* iCASCO Breadcrumb */}
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]" aria-label="breadcrumb">
          <Link to={ROUTES.workspace} className="font-light text-neutral-400 hover:text-primary">
            Application Hub
          </Link>
          <BreadcrumbChevron />
          <Link to={ROUTES.cabAuditPlanning} className="font-light text-neutral-400 hover:text-primary">
            Audit planning
          </Link>
          <BreadcrumbChevron />
          <Link
            to={`/cab/audit-planning/build/${plan.planNumber}`}
            className="font-light text-neutral-400 hover:text-primary"
            dir="ltr"
          >
            {plan.planNumber}
          </Link>
          <BreadcrumbChevron />
          <span className="font-medium text-neutral-700">Audit execution</span>
        </nav>

        {/* Top Audit Overview Card */}
        <section className="space-y-4 rounded-[16px] border border-[#ececec] bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-[18px] font-bold text-neutral-900">
                {plan.planNumber} · {plan.clientName}
              </h1>
              <p className="mt-0.5 text-[13px] text-neutral-500">{plan.standardName}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {plan.standards.map((std) => (
                  <span key={std} className="rounded-[6px] border border-[#dce4f5] bg-[#f8faff] px-2.5 py-0.5 text-[11px] font-medium text-neutral-700">
                    {std}
                  </span>
                ))}
              </div>
            </div>
            <AuditStatusBadge status={plan.status} />
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-[#f0f0f0] pt-4 text-[13px] sm:grid-cols-3">
            <div>
              <span className="block text-[12px] text-neutral-400">Audit type</span>
              <span className="mt-0.5 block font-semibold text-neutral-900">{plan.stage}</span>
            </div>
            <div>
              <span className="block text-[12px] text-neutral-400">Dates</span>
              <span className="mt-0.5 block font-semibold text-neutral-900">
                {formatDisplayDate(plan.proposedStartDate)} · {formatDisplayDate(plan.proposedEndDate)}
              </span>
            </div>
            <div>
              <span className="block text-[12px] text-neutral-400">Site</span>
              <span className="mt-0.5 block font-semibold text-neutral-900">{plan.siteName}</span>
            </div>
            <div>
              <span className="block text-[12px] text-neutral-400">Lead auditor</span>
              <span className="mt-0.5 block font-semibold text-neutral-900">{plan.leadAuditor}</span>
            </div>
            <div>
              <span className="block text-[12px] text-neutral-400">Audit team</span>
              <span className="mt-0.5 block font-semibold text-neutral-900">{plan.auditTeam.join(', ')}</span>
            </div>
            <div>
              <span className="block text-[12px] text-neutral-400">Remote activities</span>
              <span className="mt-0.5 block font-semibold text-neutral-900">
                {plan.remoteActivities?.enabled ? 'Yes' : 'No'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 border-t border-[#f0f0f0] pt-4 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[12px]">
                <span className="text-neutral-500">Checklist items audited</span>
                <span className="font-semibold text-neutral-800">{auditedItems}/{totalItems}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full rounded-full bg-[#1236a3] transition-all" style={{ width: `${totalItems ? (auditedItems / totalItems) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[12px]">
                <span className="text-neutral-500">Audit days spent and planned</span>
                <span className="font-semibold text-neutral-800">{daysSpent} / {plan.reviewedDurationDays}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full rounded-full bg-[#16a34a] transition-all" style={{ width: `${Math.min(100, plan.reviewedDurationDays ? (daysSpent / plan.reviewedDurationDays) * 100 : 0)}%` }} />
              </div>
            </div>
          </div>
        </section>

        {/* iCASCO Connected 6-Step Horizontal Stepper */}
        <IcascoConnectedStepper
          steps={EXECUTION_STEPS.map((s) => ({
            id: s.id,
            label: s.label,
            completed: execution.completedSteps.includes(s.id),
          }))}
          activeStep={activeStep}
          onSelectStep={(step) => void persistExecution({ ...execution, activeStep: step })}
        />

        {activeStep === 1 && (
          <ExecutionPreparationStep
            plan={plan}
            execution={execution}
            onUpdateExecution={(next) => void persistExecution(next)}
            onAddChecklist={handleAddChecklist}
            onComplete={() => completeStep(1, 2)}
          />
        )}

        {activeStep === 2 && (
          <ExecutionOpeningStep
            plan={plan}
            execution={execution}
            onUpdateExecution={(next) => void persistExecution(next)}
            onComplete={() => completeStep(2, 3)}
          />
        )}

        {activeStep === 3 && (
          <ExecutionConductStep
            plan={plan}
            execution={execution}
            totalItems={totalItems}
            auditedItems={auditedItems}
            nonconformingItems={nonconformingItems}
            mandatoryUnauditedCount={mandatoryUnauditedCount}
            daysSpent={daysSpent}
            onUpdateItem={handleUpdateChecklistItem}
            onMarkAllConforming={handleMarkAllConforming}
            onAddTimeEntry={(entry) => {
              void persistExecution({
                ...execution,
                timeSpent: [...execution.timeSpent, { id: `ts-${Date.now()}`, ...entry }],
              })
              showToast('Time entry recorded.')
            }}
            onComplete={() => completeStep(3, 4)}
          />
        )}

        {activeStep === 4 && (
          <ExecutionTeamReviewStep
            plan={plan}
            execution={execution}
            nonconformingItems={nonconformingItems}
            onUpdateExecution={(next) => void persistExecution(next)}
            onComplete={() => completeStep(4, 5)}
          />
        )}

        {activeStep === 5 && (
          <ExecutionClosingStep
            plan={plan}
            execution={execution}
            nonconformingItems={nonconformingItems}
            daysSpent={daysSpent}
            onUpdateExecution={(next) => void persistExecution(next)}
            onComplete={() => completeStep(5, 6)}
          />
        )}

        {activeStep === 6 && (
          <ExecutionReportStep
            execution={execution}
            onUpdateExecution={(next) => void persistExecution(next)}
            onFinalize={() => {
              void persistExecution(
                {
                  ...execution,
                  completedSteps: Array.from(new Set([...execution.completedSteps, 6])),
                  report: { ...execution.report, reportFinalized: true },
                },
                'Completed',
              )
              showToast('Audit execution report finalized and submitted.')
            }}
          />
        )}
      </main>
    </CabLayout>
  )
}
