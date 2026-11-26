import type { AuditPlan, ChecklistItem } from './cabAuditPlanningApi'
import type { FindingRecord } from './cabAuditReportingApi'
import {
  STAGE_REPORT_SECTION_IDS,
  countChecklistResults,
  createStageReport,
  getSubmitBlockers,
  isEditable,
  type StageReportBlockerCode,
  type StageReportSectionId,
  type StageReportStatus,
} from './stageReport'

/**
 * Phase 4: the Audit Reporting register and per-audit workspace. Pure
 * functions over the audit plan and its raised findings, so the register,
 * the workspace and the unit tests read one source. Nothing here is demo
 * data: every row comes from the audit plans and finding records in the
 * local store (the same shape the API returns later).
 */

export type AuditReportingStatus = 'handoffPending' | 'readyToCreate' | StageReportStatus

export const AUDIT_REPORTING_STATUSES: AuditReportingStatus[] = [
  'handoffPending',
  'readyToCreate',
  'draft',
  'inReview',
  'returned',
  'approved',
  'issued',
]

/** A report can be opened only after the execution report step prepared its hand-off. */
export function getReportingStatus(plan: Pick<AuditPlan, 'execution' | 'stageReport'>): AuditReportingStatus {
  if (plan.stageReport) return plan.stageReport.status
  return plan.execution?.report?.handoffReady ? 'readyToCreate' : 'handoffPending'
}

/** The register lists audits that were started or already have a report; planned audits are not reporting yet. */
export function isReportingAudit(plan: Pick<AuditPlan, 'execution' | 'stageReport'>): boolean {
  return Boolean(plan.stageReport) || Boolean(plan.execution?.started)
}

/** Findings of one audit. Matches by plan id or plan number so older records still resolve. */
export function findingsForPlan(
  plan: Pick<AuditPlan, 'id' | 'planNumber'>,
  records: FindingRecord[],
): FindingRecord[] {
  return records.filter((r) => r.planId === plan.id || r.planNumber === plan.planNumber || r.planId === plan.planNumber)
}

export interface AuditReportingRow {
  id: string
  planNumber: string
  clientName: string
  siteName: string
  stage: string
  startDate: string
  endDate: string
  status: AuditReportingStatus
  /** 0 until a report exists. */
  version: number
  issuedAt?: string
  reviewer: string
  audited: number
  total: number
  submittedFindings: number
  draftFindings: number
}

export function buildReportingRow(plan: AuditPlan, records: FindingRecord[]): AuditReportingRow {
  const own = findingsForPlan(plan, records)
  const live = countChecklistResults(plan.execution)
  // An issued report is frozen: show what was issued, not later changes to the live audit.
  const snap = plan.stageReport?.status === 'issued' ? plan.stageReport.snapshot : undefined
  const counts = snap ? { audited: snap.counts.audited, total: snap.counts.total } : live
  return {
    id: plan.id,
    planNumber: plan.planNumber,
    clientName: plan.clientName,
    siteName: plan.siteName,
    stage: plan.stage,
    startDate: plan.proposedStartDate,
    endDate: plan.proposedEndDate,
    status: getReportingStatus(plan),
    version: plan.stageReport?.version ?? 0,
    issuedAt: plan.stageReport?.issuedAt,
    reviewer: plan.stageReport?.reviewer ?? '',
    audited: counts.audited,
    total: counts.total,
    submittedFindings: snap ? snap.counts.findings : own.filter((r) => r.status === 'Submitted').length,
    draftFindings: snap ? 0 : own.filter((r) => r.status === 'Draft').length,
  }
}

export function buildReportingRows(plans: AuditPlan[], records: FindingRecord[]): AuditReportingRow[] {
  return plans.filter(isReportingAudit).map((plan) => buildReportingRow(plan, records))
}

export interface ReportingFilters {
  search: string
  status: AuditReportingStatus | 'all'
}

export function filterReportingRows(rows: AuditReportingRow[], filters: ReportingFilters): AuditReportingRow[] {
  const q = filters.search.trim().toLowerCase()
  return rows.filter(
    (row) =>
      (filters.status === 'all' || row.status === filters.status) &&
      (q === '' || `${row.planNumber} ${row.clientName} ${row.siteName} ${row.stage}`.toLowerCase().includes(q)),
  )
}

/** What the "open report" action does for a given state. */
export type ReportAction = 'openExecution' | 'generate' | 'continueDraft' | 'review' | 'issue' | 'view'

export function getReportAction(status: AuditReportingStatus): ReportAction {
  switch (status) {
    case 'handoffPending':
      return 'openExecution'
    case 'readyToCreate':
      return 'generate'
    case 'draft':
    case 'returned':
      return 'continueDraft'
    case 'inReview':
      return 'review'
    case 'approved':
      return 'issue'
    case 'issued':
      return 'view'
  }
}

/** A finding can be added while the report is still the audit team's to edit (no report, draft or returned). */
export function canAddFinding(plan: Pick<AuditPlan, 'stageReport'>): boolean {
  return !plan.stageReport || isEditable(plan.stageReport)
}

export type ReadinessGroup = 'submit' | 'issue'
export type ReadinessId =
  | 'handoff'
  | 'summary'
  | 'recommendation'
  | 'sections'
  | 'findings'
  | 'reviewer'
  | 'approval'
  | 'issued'
/** met: done. pending: still blocks. waiting: cannot be judged until an earlier step is done. */
export type ReadinessState = 'met' | 'pending' | 'waiting'

export interface ReadinessItem {
  id: ReadinessId
  group: ReadinessGroup
  state: ReadinessState
  count?: number
}

const BLOCKER_FOR: Record<Exclude<ReadinessId, 'approval' | 'issued' | 'reviewer'>, StageReportBlockerCode> = {
  handoff: 'handoffNotReady',
  summary: 'summaryMissing',
  recommendation: 'recommendationMissing',
  sections: 'sectionsEmpty',
  findings: 'findingsNotSubmitted',
}

/**
 * What stands between the audit and an issued report. The "submit" group is
 * computed with the stage report's own getSubmitBlockers, so it is the same
 * rule set the stage report page enforces; the "issue" group is the technical
 * review approval and the issue itself. Once a report has been sent to review,
 * the submit group is shown as met (it was met to get there).
 */
export function buildReportReadiness(plan: AuditPlan, records: FindingRecord[]): ReadinessItem[] {
  const status = getReportingStatus(plan)
  const sentOn = status === 'inReview' || status === 'approved' || status === 'issued'
  const drafts = findingsForPlan(plan, records).filter((r) => r.status === 'Draft').length
  const emptySections = Object.fromEntries(STAGE_REPORT_SECTION_IDS.map((id) => [id, ''])) as Record<StageReportSectionId, string>
  const hasReport = Boolean(plan.stageReport)
  const state = plan.stageReport ?? createStageReport(emptySections, '')
  const blockers = sentOn ? [] : getSubmitBlockers(plan, plan.execution, state, drafts)
  const blocked = new Set(blockers.map((b) => b.code))
  const submitState = (id: keyof typeof BLOCKER_FOR): ReadinessState =>
    sentOn ? 'met' : blocked.has(BLOCKER_FOR[id]) ? 'pending' : 'met'
  // Sections and reviewer exist only on a created report.
  const reportBound = (pending: boolean): ReadinessState =>
    sentOn ? 'met' : !hasReport ? 'waiting' : pending ? 'pending' : 'met'
  const reviewerPending = blocked.has('reviewerMissing') || blocked.has('reviewerOnTeam')
  return [
    { id: 'handoff', group: 'submit', state: submitState('handoff') },
    { id: 'summary', group: 'submit', state: submitState('summary') },
    { id: 'recommendation', group: 'submit', state: submitState('recommendation') },
    { id: 'sections', group: 'submit', state: reportBound(blocked.has('sectionsEmpty')) },
    { id: 'findings', group: 'submit', state: submitState('findings'), count: sentOn ? 0 : drafts },
    { id: 'reviewer', group: 'submit', state: reportBound(reviewerPending) },
    { id: 'approval', group: 'issue', state: status === 'approved' || status === 'issued' ? 'met' : sentOn ? 'pending' : 'waiting' },
    { id: 'issued', group: 'issue', state: status === 'issued' ? 'met' : status === 'approved' ? 'pending' : 'waiting' },
  ]
}

export interface EvidenceRow {
  id: string
  clauseRef: string
  title: string
  result: string
  section: string
  hasEvidence: boolean
  evidenceNotes: string
  documentsSampled: string
  peopleInterviewed: string
  findingCode: string
}

const NOT_ASSESSED = new Set(['', 'Not audited'])

/** Evidence recorded while conducting the audit, one row per audited checklist item. */
export function buildEvidenceRows(plan: Pick<AuditPlan, 'execution'>): EvidenceRow[] {
  const rows: EvidenceRow[] = []
  for (const section of plan.execution.checklists) {
    for (const item of section.items as ChecklistItem[]) {
      if (NOT_ASSESSED.has(item.result)) continue
      const hasEvidence = Boolean(
        item.evidenceNotes.trim() || item.documentsSampled.trim() || item.peopleInterviewed.trim() || item.photoName,
      )
      rows.push({
        id: item.id,
        clauseRef: item.clauseRef,
        title: item.title,
        result: item.result,
        section: section.title,
        hasEvidence,
        evidenceNotes: item.evidenceNotes,
        documentsSampled: item.documentsSampled,
        peopleInterviewed: item.peopleInterviewed,
        findingCode: item.findingCode ?? '',
      })
    }
  }
  return rows
}

/** Code for a finding raised from the register: continues the audit's own numbering. */
export function nextRegisterFindingCode(
  plan: Pick<AuditPlan, 'id' | 'planNumber'>,
  records: FindingRecord[],
  itemCodes: string[],
): string {
  const used = [...findingsForPlan(plan, records).map((r) => r.findingCode ?? ''), ...itemCodes]
  const max = used.reduce((m, code) => {
    const n = Number(/^FND-(\d+)$/.exec(code)?.[1] ?? 0)
    return n > m ? n : m
  }, 0)
  return `FND-${String(max + 1).padStart(2, '0')}`
}
