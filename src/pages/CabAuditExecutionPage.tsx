import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { valueLabel } from '@/components/cab/auditPlanning/displayValue'
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
  countFindingsRaised,
  findChecklistItem,
  applyStepCompletion,
  getStartBlockers,
  isAuditedResultValue,
  isNonconformingResult,
} from '@/lib/api/auditExecutionGates'
import { loadAuditChecklistsMock } from '@/lib/api/auditChecklistMockData'
import type { AuditChecklist } from '@/lib/auditChecklistTypes'
import {
  AuditStatusBadge,
  BreadcrumbChevron,
  IcascoConnectedStepper,
} from '@/components/cab/auditPlanning/shared'
import { toast } from '@/lib/toast'
import { ExecutionPreparationStep } from '@/components/cab/auditPlanning/ExecutionPreparationStep'
import { ExecutionConductStep } from '@/components/cab/auditPlanning/ExecutionConductStep'
import {
  ExecutionOpeningStep,
  ExecutionTeamReviewStep,
  ExecutionClosingStep,
  ExecutionReportStep,
} from '@/components/cab/auditPlanning/ExecutionMeetingReportSteps'
import { ROUTES } from '@/lib/routes'

type ExecutionStep = 1 | 2 | 3 | 4 | 5 | 6

const EXECUTION_STEPS: Array<{ id: ExecutionStep; labelKey: string; label: string }> = [
  { id: 1, labelKey: 'execution.steps.1', label: 'Preparation' },
  { id: 2, labelKey: 'execution.steps.2', label: 'Opening meeting' },
  { id: 3, labelKey: 'execution.steps.3', label: 'Conduct' },
  { id: 4, labelKey: 'execution.steps.4', label: 'Team review' },
  { id: 5, labelKey: 'execution.steps.5', label: 'Closing meeting' },
  { id: 6, labelKey: 'execution.steps.6', label: 'Report' },
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
  const navigate = useNavigate()
  const { planId } = useParams<{ planId: string }>()

  const [plan, setPlan] = useState<AuditPlan | null>(null)
  const [execution, setExecution] = useState<AuditExecutionData | null>(null)
  const executionRef = useRef<AuditExecutionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [ownChecklists, setOwnChecklists] = useState<AuditChecklist[]>([])

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

  useEffect(() => {
    let active = true
    loadAuditChecklistsMock()
      .then((data) => {
        if (active) setOwnChecklists(data.mine.filter((c) => c.status === 'ACTIVE'))
      })
      .catch(() => {
        if (active) setOwnChecklists([])
      })
    return () => {
      active = false
    }
  }, [])

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

  const { totalItems, auditedItems, nonconformingItems } = useMemo(() => {
    if (!execution) {
      return { totalItems: 0, auditedItems: 0, nonconformingItems: 0 }
    }
    let total = 0
    let audited = 0
    let nc = 0
    for (const sec of execution.checklists) {
      for (const item of sec.items) {
        total += 1
        if (isAuditedResultValue(item.result)) audited += 1
        if (isNonconformingResult(item.result)) nc += 1
      }
    }
    return { totalItems: total, auditedItems: audited, nonconformingItems: nc }
  }, [execution])

  const daysSpent = useMemo(() => {
    if (!execution) return 0
    const totalHours = execution.timeSpent.reduce((sum, e) => sum + e.hours, 0)
    return Number((totalHours / 8).toFixed(2))
  }, [execution])

  const blockerMessage = (blocker: { code: string; count?: number }) =>
    t(`execution.blockers.${blocker.code}`, { count: blocker.count ?? 0 })

  const completeStep = (step: ExecutionStep, nextStep?: ExecutionStep) => {
    const current = executionRef.current || execution
    if (!current) return
    const result = applyStepCompletion(current, step, nextStep)
    if (!result.ok || !result.next) {
      showToast(blockerMessage(result.blockers[0]), 'warning')
      return
    }
    void persistExecution(result.next, 'In progress')
    showToast(
      step === 6
        ? t('execution.reportStep.handoffReadyToast')
        : t('execution.stepCompleted', { step: t(`execution.steps.${step}`) }),
    )
  }

  const startBlockers = execution ? getStartBlockers(execution) : []

  const handleStart = () => {
    if (!execution || startBlockers.length > 0) return
    void persistExecution({ ...execution, started: true })
    showToast(t('execution.start.started', 'Audit execution started.'))
  }

  const handleAddChecklist = (sourceRef: string) => {
    if (!execution || !plan) return

    if (sourceRef.startsWith('cab:')) {
      const ownId = sourceRef.slice(4)
      const own = ownChecklists.find((c) => c.id === ownId)
      if (!own) return
      const sectionId = `cab:${own.id}`
      if (execution.checklists.some((c) => c.id === sectionId)) {
        showToast(t('execution.preparation.checklistExists', 'This checklist is already assigned.'), 'warning')
        return
      }
      const newSection: AuditChecklistSection = {
        id: sectionId,
        title: own.name,
        libraryTag: t('execution.preparation.oursBadge', 'Our checklists'),
        assignedAuditor: '',
        items: own.items.map((item, index) => ({
          id: `${sectionId}-${index + 1}`,
          clauseRef: item.clause || item.code,
          title: item.title,
          mandatory: item.mandatory,
          description: item.requirement,
          whatToLookFor: item.guidance,
          evidenceToAskFor: item.evidencePrompts,
          result: '' as ChecklistResultValue,
          evidenceNotes: '',
          documentsSampled: '',
          peopleInterviewed: '',
        })),
      }
      void persistExecution({ ...execution, checklists: [...execution.checklists, newSection] })
      showToast(t('execution.preparation.checklistAdded', { name: own.name }))
      return
    }

    const lib = LIBRARY_EXTRA_CHECKLISTS.find((l) => l.id === sourceRef)
    if (!lib) return
    if (execution.checklists.some((c) => c.id === lib.id)) {
      showToast(t('execution.preparation.checklistExists', 'This checklist is already assigned.'), 'warning')
      return
    }
    const newSection: AuditChecklistSection = {
      id: lib.id,
      title: lib.title,
      libraryTag: 'iCASCO library, approved',
      assignedAuditor: '',
      items: Array.from({ length: lib.itemsCount }).map((_, i) => ({
        id: `${lib.id}-${i + 1}`,
        clauseRef: `${lib.clausePrefix} ${4 + i}.1`,
        title: `${lib.clausePrefix} requirement check ${i + 1}`,
        mandatory: true,
        description: `Verify implementation and documented evidence for ${lib.clausePrefix} clause ${4 + i}.1.`,
        whatToLookFor: 'Confirm operational records and staff awareness.',
        evidenceToAskFor: ['Operational records', 'Procedure document'],
        result: '' as ChecklistResultValue,
        evidenceNotes: '',
        documentsSampled: '',
        peopleInterviewed: '',
      })),
    }
    void persistExecution({ ...execution, checklists: [...execution.checklists, newSection] })
    showToast(t('execution.preparation.checklistAdded', { name: lib.title }))
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

  const handleRaiseFinding = (_sectionId: string, itemId: string) => {
    if (!execution || !plan) return
    const found = findChecklistItem(execution, itemId)
    if (!found) return
    const params = new URLSearchParams({
      planId: plan.planNumber,
      itemId,
      clauseRef: found.item.clauseRef,
      result: found.item.result,
      returnTo: `/cab/audit-planning/${plan.planNumber}/execution`,
    })
    navigate(`${ROUTES.cabAddFinding}?${params.toString()}`)
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
        title={t('execution.title', 'Audit execution')}
        subtitle={`${plan.planNumber} · ${plan.clientName} · ${valueLabel(t, plan.stage)}`}
        notificationCount={6}
      />

      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        {/* iCASCO Breadcrumb */}
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]" aria-label={t('common.breadcrumb', 'Breadcrumb')}>
          <Link to={ROUTES.workspace} className="font-light text-neutral-400 hover:text-primary">
            {t('execution.breadcrumb.applicationHub', 'Application Hub')}
          </Link>
          <BreadcrumbChevron />
          <Link to={ROUTES.cabAuditPlanning} className="font-light text-neutral-400 hover:text-primary">
            {t('execution.breadcrumb.auditPlanning', 'Audit planning')}
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
          <span className="font-medium text-neutral-700">{t('execution.title', 'Audit execution')}</span>
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
              <span className="block text-[12px] text-neutral-400">{t('execution.plan.auditType', 'Audit type')}</span>
              <span className="mt-0.5 block font-semibold text-neutral-900">{valueLabel(t, plan.stage)}</span>
            </div>
            <div>
              <span className="block text-[12px] text-neutral-400">{t('execution.plan.dates', 'Dates')}</span>
              <span className="mt-0.5 block font-semibold text-neutral-900">
                <bdi dir="ltr">{formatDisplayDate(plan.proposedStartDate)} · {formatDisplayDate(plan.proposedEndDate)}</bdi>
              </span>
            </div>
            <div>
              <span className="block text-[12px] text-neutral-400">{t('execution.plan.site', 'Site')}</span>
              <span className="mt-0.5 block font-semibold text-neutral-900">{plan.siteName}</span>
            </div>
            <div>
              <span className="block text-[12px] text-neutral-400">{t('execution.plan.leadAuditor', 'Lead auditor')}</span>
              <span className="mt-0.5 block font-semibold text-neutral-900">{plan.leadAuditor}</span>
            </div>
            <div>
              <span className="block text-[12px] text-neutral-400">{t('execution.plan.auditTeam', 'Audit team')}</span>
              <span className="mt-0.5 block font-semibold text-neutral-900">{plan.auditTeam.join(', ')}</span>
            </div>
            <div>
              <span className="block text-[12px] text-neutral-400">{t('execution.plan.remoteActivities', 'Remote activities')}</span>
              <span className="mt-0.5 block font-semibold text-neutral-900">
                {plan.remoteActivities?.enabled
                  ? t('execution.plan.yes', 'Yes')
                  : t('execution.plan.no', 'No')}
              </span>
            </div>
          </div>

          {execution.started && (
            <div className="grid grid-cols-1 gap-5 border-t border-[#f0f0f0] pt-4 sm:grid-cols-2">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[12px]">
                  <span className="text-neutral-500">{t('execution.plan.itemsAudited', 'Checklist items audited')}</span>
                  <span className="font-semibold text-neutral-800">{auditedItems}/{totalItems}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full rounded-full bg-[#1236a3] transition-all" style={{ width: `${totalItems ? (auditedItems / totalItems) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[12px]">
                  <span className="text-neutral-500">{t('execution.plan.daysSpentPlanned', 'Audit days spent and planned')}</span>
                  <span className="font-semibold text-neutral-800">{daysSpent} / {plan.reviewedDurationDays}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full rounded-full bg-[#16a34a] transition-all" style={{ width: `${Math.min(100, plan.reviewedDurationDays ? (daysSpent / plan.reviewedDurationDays) * 100 : 0)}%` }} />
                </div>
              </div>
            </div>
          )}
        </section>

        {!execution.started ? (
          /* Start screen: shown before the execution is started */
          <section className="space-y-4 rounded-[16px] border border-[#ececec] bg-white p-5">
            <div>
              <h2 className="text-[18px] font-bold text-neutral-900">
                {t('execution.start.title', 'Start the audit execution')}
              </h2>
              <p className="mt-0.5 text-[13px] text-neutral-500">
                {t(
                  'execution.start.description',
                  'The workspace guides the team through six steps, from preparation to the report.',
                )}
              </p>
            </div>

            <ul className="list-disc space-y-1 ps-5 text-[13px] text-neutral-700">
              <li>{t('execution.start.point1', "Checklists are generated from the plan's standards and audit stage.")}</li>
              <li>{t('execution.start.point2', 'Completing the opening meeting starts the audit and opens its report.')}</li>
            </ul>

            {startBlockers.length > 0 && (
              <div className="rounded-[12px] border border-[#fde68a] bg-[#fffbeb] p-4 text-[13px]" data-testid="start-gate">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-bold text-[#92400e]">{t('execution.start.gateTitle', 'Before you start')}</p>
                  <Link
                    to={`/cab/audit-planning/build/${plan.planNumber}`}
                    className="font-semibold text-[#1236a3] hover:underline"
                  >
                    {t('execution.start.openPlan', 'Open plan')}
                  </Link>
                </div>
                <ul className="mt-1 list-disc space-y-0.5 ps-5 text-[12px] text-[#b45309]">
                  {startBlockers.map((blocker) => (
                    <li key={blocker.code}>{blockerMessage(blocker)}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <button
                type="button"
                data-testid="start-execution"
                disabled={startBlockers.length > 0 || plan.status === 'Completed'}
                onClick={handleStart}
                className="h-10 rounded-[8px] bg-[#1236a3] px-5 text-[13px] font-semibold text-white transition hover:bg-[#0e2a80] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('execution.start.button', 'Start execution')}
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* iCASCO Connected 6-Step Horizontal Stepper */}
            <IcascoConnectedStepper
              steps={EXECUTION_STEPS.map((s) => ({
                id: s.id,
                label: t(s.labelKey, s.label),
                completed: execution.completedSteps.includes(s.id),
              }))}
              activeStep={activeStep}
              onSelectStep={(step) => void persistExecution({ ...execution, activeStep: step })}
            />

            {activeStep === 1 && (
              <ExecutionPreparationStep
                plan={plan}
                execution={execution}
                ownChecklists={ownChecklists}
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
                daysSpent={daysSpent}
                onUpdateItem={handleUpdateChecklistItem}
                onMarkAllConforming={handleMarkAllConforming}
                onRaiseFinding={handleRaiseFinding}
                onAddTimeEntry={(entry) => {
                  void persistExecution({
                    ...execution,
                    timeSpent: [...execution.timeSpent, { id: `ts-${Date.now()}`, ...entry }],
                  })
                  showToast(t('execution.time.added'))
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
                planNumber={plan.planNumber}
                reportStatus={plan.stageReport?.status}
                totalItems={totalItems}
                auditedItems={auditedItems}
                findingsCount={countFindingsRaised(execution)}
                daysSpent={daysSpent}
                onUpdateExecution={(next) => void persistExecution(next)}
                onComplete={() => completeStep(6)}
              />
            )}
          </>
        )}
      </main>
    </CabLayout>
  )
}
