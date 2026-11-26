import type { AuditExecutionData, ChecklistItem, ChecklistResultValue } from './cabAuditPlanningApi'

/**
 * Phase 2: start gate and per-step "To complete this step" blockers for audit
 * execution. Pure functions so the execution page, the six step components and
 * the unit tests all share one source of truth for what blocks what.
 *
 * Frontend-only for now: the same codes are what the API will return later.
 */

export type ExecutionBlockerCode =
  | 'planNotSent'
  | 'clientNotConfirmed'
  | 'teamNotDeclared'
  | 'agreementMissing'
  | 'documentsNotReviewed'
  | 'noChecklists'
  | 'checklistsUnassigned'
  | 'agendaNotConfirmed'
  | 'confidentialityNotConfirmed'
  | 'noClientSignature'
  | 'noTeamAttendee'
  | 'mandatoryItemsOpen'
  | 'ncWithoutFinding'
  | 'noWrapUp'
  | 'noConsensus'
  | 'findingsNotPresented'
  | 'noClientPosition'
  | 'noClosingSignature'
  | 'noTimeRecorded'
  | 'reportNotOpen'
  | 'previousStepsIncomplete'

export interface ExecutionBlocker {
  code: ExecutionBlockerCode
  count?: number
}

export function isNonconformingResult(result: ChecklistResultValue): boolean {
  return result === 'Minor NC' || result === 'Major NC'
}

export function isAuditedResultValue(result: ChecklistResultValue): boolean {
  return result !== '' && result !== 'Not audited'
}

function allItems(execution: AuditExecutionData): ChecklistItem[] {
  return execution.checklists.flatMap((section) => section.items)
}

export function countMandatoryUnaudited(execution: AuditExecutionData): number {
  return allItems(execution).filter((item) => item.mandatory && !isAuditedResultValue(item.result)).length
}

export function countNonconforming(execution: AuditExecutionData): number {
  return allItems(execution).filter((item) => isNonconformingResult(item.result)).length
}

/** Nonconforming checklist items that have no finding raised for them yet. */
export function countNcWithoutFinding(execution: AuditExecutionData): number {
  return allItems(execution).filter((item) => isNonconformingResult(item.result) && !item.findingCode).length
}

export function countFindingsRaised(execution: AuditExecutionData): number {
  return allItems(execution).filter((item) => Boolean(item.findingCode)).length
}

/**
 * Readiness items that gate the "Start execution" button on the start screen:
 * the prerequisites owned by planning (plan sent, client confirmation, team
 * declarations, active agreement). Reviewing the client documents is recorded
 * during the preparation step itself, so it blocks completing step 1 instead.
 */
export function getStartBlockers(execution: AuditExecutionData): ExecutionBlocker[] {
  const blockers: ExecutionBlocker[] = []
  const p = execution.preparation
  if (!p.planSentToClient) blockers.push({ code: 'planNotSent' })
  if (!p.planConfirmedByClient) blockers.push({ code: 'clientNotConfirmed' })
  if (!p.declarationsCompleted) blockers.push({ code: 'teamNotDeclared' })
  if (!p.agreementActive) blockers.push({ code: 'agreementMissing' })
  return blockers
}

/** Blockers shown in the "To complete this step" footer of each of the six steps. */
export function getStepBlockers(execution: AuditExecutionData, step: number): ExecutionBlocker[] {
  const blockers: ExecutionBlocker[] = []

  if (step > 1) {
    let missing = 0
    for (let prev = 1; prev < step; prev++) {
      if (!execution.completedSteps.includes(prev)) missing += 1
    }
    if (missing > 0) blockers.push({ code: 'previousStepsIncomplete', count: missing })
  }

  if (step === 1) {
    const p = execution.preparation
    if (!p.planSentToClient) blockers.push({ code: 'planNotSent' })
    if (!p.declarationsCompleted) blockers.push({ code: 'teamNotDeclared' })
    if (!p.clientDocumentsReviewed) blockers.push({ code: 'documentsNotReviewed' })
    if (execution.checklists.length === 0) blockers.push({ code: 'noChecklists' })
    else if (execution.checklists.some((c) => !c.assignedAuditor)) {
      blockers.push({ code: 'checklistsUnassigned' })
    }
  }

  if (step === 2) {
    const om = execution.openingMeeting
    if (!om.agendaConfirmed) blockers.push({ code: 'agendaNotConfirmed' })
    if (!om.confidentialityGiven) blockers.push({ code: 'confidentialityNotConfirmed' })
    if (!om.attendees.some((a) => a.organization === 'Client' && Boolean(a.signatureValue))) {
      blockers.push({ code: 'noClientSignature' })
    }
    if (!om.attendees.some((a) => a.organization === 'Audit team')) {
      blockers.push({ code: 'noTeamAttendee' })
    }
  }

  if (step === 3) {
    const open = countMandatoryUnaudited(execution)
    if (open > 0) blockers.push({ code: 'mandatoryItemsOpen', count: open })
  }

  if (step === 4) {
    const tr = execution.teamReview
    if (tr.dailyWrapUps.length === 0) blockers.push({ code: 'noWrapUp' })
    if (!tr.gradingConsensus) blockers.push({ code: 'noConsensus' })
    const ncOpen = countNcWithoutFinding(execution)
    if (ncOpen > 0) blockers.push({ code: 'ncWithoutFinding', count: ncOpen })
  }

  if (step === 5) {
    const cm = execution.closingMeeting
    if (!cm.findingsPresented) blockers.push({ code: 'findingsNotPresented' })
    if (!cm.clientPosition) blockers.push({ code: 'noClientPosition' })
    if (!cm.attendees.some((a) => a.organization === 'Client' && Boolean(a.signatureValue))) {
      blockers.push({ code: 'noClosingSignature' })
    }
    if (execution.timeSpent.length === 0) blockers.push({ code: 'noTimeRecorded' })
  }

  if (step === 6) {
    if (!execution.completedSteps.includes(2)) blockers.push({ code: 'reportNotOpen' })
  }

  return blockers
}


/**
 * The single enforcement point for completing a step: every path that marks a
 * step complete goes through here (footer buttons and any direct caller), so
 * the step blockers cannot be bypassed by stale UI. Returns the blockers when
 * the step is not ready, otherwise the next execution state.
 *
 * Because getStepBlockers requires every previous step in completedSteps, a
 * direct call cannot complete a step out of order (e.g. step 6 when only the
 * opening meeting is done): the ordering is enforced here, not only in the UI.
 *
 * Step 6 never marks the report finalized or the plan completed: phase 2 only
 * prepares the hand-off to the stage report workspace; the issued state
 * arrives with phase 3.
 */
export interface StepCompletionResult {
  ok: boolean
  blockers: ExecutionBlocker[]
  next?: AuditExecutionData
}

export function applyStepCompletion(
  execution: AuditExecutionData,
  step: number,
  nextStep?: number,
): StepCompletionResult {
  const blockers = getStepBlockers(execution, step)
  if (blockers.length > 0) return { ok: false, blockers }
  const completedSteps = execution.completedSteps.includes(step)
    ? execution.completedSteps
    : ([...execution.completedSteps, step] as AuditExecutionData['completedSteps'])
  const next: AuditExecutionData = { ...execution, completedSteps, activeStep: (nextStep ?? step) as AuditExecutionData['activeStep'] }
  if (step === 6) {
    next.report = { ...execution.report, handoffReady: true }
  }
  return { ok: true, blockers: [], next }
}

/** Next finding code for an execution: FND-01, FND-02, ... in the order raised. */
export function nextFindingCode(execution: AuditExecutionData): string {
  const next = countFindingsRaised(execution) + 1
  return `FND-${String(next).padStart(2, '0')}`
}

/** Returns a new execution with the finding code recorded on the checklist item. */
export function attachFindingToItem(
  execution: AuditExecutionData,
  checklistItemId: string,
  findingCode: string,
): AuditExecutionData {
  return {
    ...execution,
    checklists: execution.checklists.map((section) => ({
      ...section,
      items: section.items.map((item) =>
        item.id === checklistItemId ? { ...item, findingCode } : item,
      ),
    })),
  }
}

/** Finds a checklist item and its section title across all assigned checklists. */
export function findChecklistItem(
  execution: AuditExecutionData,
  checklistItemId: string,
): { item: ChecklistItem; sectionTitle: string } | null {
  for (const section of execution.checklists) {
    const item = section.items.find((candidate) => candidate.id === checklistItemId)
    if (item) return { item, sectionTitle: section.title }
  }
  return null
}
