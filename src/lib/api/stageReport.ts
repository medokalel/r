import type { AuditExecutionData, AuditPlan } from './cabAuditPlanningApi'

/**
 * Phase 3: the stage report of an audit. Pure functions so the page, the
 * execution hand-off and the unit tests share one source of truth for the
 * report's content, review rules and lifecycle.
 *
 * Lifecycle: draft -> inReview -> approved -> issued, with inReview -> returned
 * -> draft again when the technical reviewer returns it with comments.
 * Frontend-only for now (local plan store); the same codes are what the API
 * will return later. Technical review is a separate act from the audit team's
 * recommendation, and the recommendation is never a certification decision.
 */

export type StageReportStatus = 'draft' | 'inReview' | 'returned' | 'approved' | 'issued'

/** Sections written in this page. The executive summary and the recommendation live in `execution.report`. */
export const STAGE_REPORT_SECTION_IDS = [
  'scopeObjectives',
  'teamDates',
  'checklistCoverage',
  'findings',
  'closingMeeting',
] as const

export type StageReportSectionId = (typeof STAGE_REPORT_SECTION_IDS)[number]

export interface StageReportEvent {
  id: string
  at: string
  /** generated | submitted | approved | returned | issued | reopened */
  action: string
  actor?: string
  detail?: string
}

/** Everything the issued report shows, copied at issue time so later changes elsewhere never alter it. */
export interface StageReportSnapshot {
  planNumber: string
  clientName: string
  siteName: string
  stage: string
  standardName: string
  standards: string[]
  leadAuditor: string
  auditTeam: string[]
  proposedStartDate: string
  proposedEndDate: string
  executiveSummary: string
  recommendation: string
  sections: Record<StageReportSectionId, string>
  counts: { audited: number; total: number; nc: number; findings: number }
}

/** The audit client's acknowledgement that it received and read the issued report. */
export interface StageReportAcknowledgement {
  by: string
  note?: string
  at: string
}

export interface StageReportState {
  version: number
  status: StageReportStatus
  sections: Record<StageReportSectionId, string>
  reviewer: string
  /** The reviewer's latest comment (required when the report is returned). */
  reviewComment: string
  events: StageReportEvent[]
  issuedAt?: string
  /** Frozen copy of the report content, set when the report is issued. */
  snapshot?: StageReportSnapshot
  /** Set once by the audit client after issue. It never changes the report itself. */
  acknowledgement?: StageReportAcknowledgement
}

export type StageReportBlockerCode =
  | 'handoffNotReady'
  | 'summaryMissing'
  | 'recommendationMissing'
  | 'sectionsEmpty'
  | 'reviewerMissing'
  | 'reviewerOnTeam'
  | 'findingsNotSubmitted'

export interface StageReportBlocker {
  code: StageReportBlockerCode
  count?: number
}

export interface FindingSummary {
  code: string
  classification: string
  clauseRef: string
  statement: string
}

export type Translate = (key: string, params?: Record<string, string | number>) => string

type PlanLike = Pick<AuditPlan, 'planNumber' | 'clientName' | 'stage' | 'standards' | 'siteName' | 'leadAuditor' | 'auditTeam' | 'proposedStartDate' | 'proposedEndDate' | 'scopeSummary' | 'auditObjectives'>

const norm = (value: string) => value.trim().toLowerCase()

export function isEditable(state: StageReportState | undefined): boolean {
  const status = state?.status ?? 'draft'
  return status === 'draft' || status === 'returned'
}

/** Everyone on the audit team is excluded from reviewing its report. */
export function isReviewerEligible(reviewer: string, plan: Pick<AuditPlan, 'leadAuditor' | 'auditTeam'>): boolean {
  if (!reviewer.trim()) return false
  const team = [plan.leadAuditor, ...plan.auditTeam].map(norm)
  return !team.includes(norm(reviewer))
}

export function countChecklistResults(execution: AuditExecutionData) {
  const items = execution.checklists.flatMap((section) => section.items)
  const count = (...results: string[]) => items.filter((item) => results.includes(item.result)).length
  return {
    total: items.length,
    audited: items.filter((item) => item.result !== '' && item.result !== 'Not audited').length,
    conforming: count('Conforming'),
    minorNc: count('Minor NC'),
    majorNc: count('Major NC'),
    observations: count('Observation'),
    ofi: count('OFI'),
    notApplicable: count('N/A'),
  }
}

/** Texts the report opens with, built from the plan, checklist results and findings. */
export function generateSections(
  plan: PlanLike,
  execution: AuditExecutionData,
  findings: FindingSummary[],
  tr: Translate,
): Record<StageReportSectionId, string> {
  const counts = countChecklistResults(execution)
  const hours = execution.timeSpent.reduce((sum, entry) => sum + entry.hours, 0)
  const days = Number((hours / 8).toFixed(2))
  const findingLines = findings.map((f) =>
    tr('stageReport.generated.findingLine', {
      code: f.code,
      classification: f.classification,
      clause: f.clauseRef,
      statement: f.statement,
    }),
  )
  return {
    scopeObjectives: [
      tr('stageReport.generated.scope', { scope: plan.scopeSummary || '-' }),
      tr('stageReport.generated.objectives', { objectives: plan.auditObjectives || '-' }),
      tr('stageReport.generated.standards', { standards: plan.standards.join(', ') }),
    ].join('\n'),
    teamDates: [
      tr('stageReport.generated.lead', { name: plan.leadAuditor }),
      tr('stageReport.generated.team', { names: plan.auditTeam.join(', ') }),
      tr('stageReport.generated.dates', { start: plan.proposedStartDate, end: plan.proposedEndDate, site: plan.siteName }),
      tr('stageReport.generated.days', { days }),
    ].join('\n'),
    checklistCoverage: [
      tr('stageReport.generated.coverage', { audited: counts.audited, total: counts.total }),
      tr('stageReport.generated.results', {
        conforming: counts.conforming,
        minor: counts.minorNc,
        major: counts.majorNc,
        observations: counts.observations,
        ofi: counts.ofi,
      }),
    ].join('\n'),
    findings: findingLines.length > 0 ? findingLines.join('\n') : tr('stageReport.generated.noFindings'),
    closingMeeting: [
      tr('stageReport.generated.position', { position: execution.closingMeeting.clientPosition || '-' }),
      execution.closingMeeting.clientComments
        ? tr('stageReport.generated.clientComments', { comments: execution.closingMeeting.clientComments })
        : '',
      execution.closingMeeting.ncResponseDueBy
        ? tr('stageReport.generated.ncDue', { date: execution.closingMeeting.ncResponseDueBy })
        : '',
    ]
      .filter(Boolean)
      .join('\n'),
  }
}

function newEvent(action: string, at: string, actor?: string, detail?: string): StageReportEvent {
  return {
    id: `sre-${at}-${action}-${Math.random().toString(36).slice(2, 6)}`,
    at,
    action,
    ...(actor ? { actor } : {}),
    ...(detail ? { detail } : {}),
  }
}

export function createStageReport(sections: Record<StageReportSectionId, string>, now: string): StageReportState {
  return {
    version: 1,
    status: 'draft',
    sections,
    reviewer: '',
    reviewComment: '',
    events: [newEvent('generated', now)],
  }
}

/** What stops the report from being sent to technical review. */
export function getSubmitBlockers(
  plan: Pick<AuditPlan, 'leadAuditor' | 'auditTeam'>,
  execution: AuditExecutionData,
  state: StageReportState,
  draftFindingsCount = 0,
): StageReportBlocker[] {
  const blockers: StageReportBlocker[] = []
  if (!execution.report.handoffReady) blockers.push({ code: 'handoffNotReady' })
  if (!execution.report.executiveSummary.trim()) blockers.push({ code: 'summaryMissing' })
  if (!execution.report.recommendation.trim()) blockers.push({ code: 'recommendationMissing' })
  const empty = STAGE_REPORT_SECTION_IDS.filter((id) => !state.sections[id]?.trim()).length
  if (empty > 0) blockers.push({ code: 'sectionsEmpty', count: empty })
  if (draftFindingsCount > 0) blockers.push({ code: 'findingsNotSubmitted', count: draftFindingsCount })
  if (!state.reviewer.trim()) blockers.push({ code: 'reviewerMissing' })
  else if (!isReviewerEligible(state.reviewer, plan)) blockers.push({ code: 'reviewerOnTeam' })
  return blockers
}

export interface StageReportResult {
  ok: boolean
  blockers: StageReportBlocker[]
  next?: StageReportState
  /** Set for reject reasons that are not blockers (wrong state, missing comment). */
  error?: 'wrongState' | 'commentRequired' | 'reviewerNotAllowed' | 'nameRequired' | 'alreadyAcknowledged'
}

export function submitForReview(
  plan: Pick<AuditPlan, 'leadAuditor' | 'auditTeam'>,
  execution: AuditExecutionData,
  state: StageReportState,
  now: string,
  draftFindingsCount = 0,
): StageReportResult {
  if (state.status !== 'draft' && state.status !== 'returned') return { ok: false, blockers: [], error: 'wrongState' }
  const blockers = getSubmitBlockers(plan, execution, state, draftFindingsCount)
  if (blockers.length > 0) return { ok: false, blockers }
  return {
    ok: true,
    blockers: [],
    next: {
      ...state,
      status: 'inReview',
      version: state.status === 'returned' ? state.version + 1 : state.version,
      reviewComment: '',
      events: [...state.events, newEvent('submitted', now, undefined, state.reviewer)],
    },
  }
}

/** The assigned technical reviewer approves or returns the report. Returning needs a comment. */
export function decideReview(
  plan: Pick<AuditPlan, 'leadAuditor' | 'auditTeam'>,
  state: StageReportState,
  decision: 'approve' | 'return',
  comment: string,
  now: string,
): StageReportResult {
  if (state.status !== 'inReview') return { ok: false, blockers: [], error: 'wrongState' }
  if (!isReviewerEligible(state.reviewer, plan)) return { ok: false, blockers: [], error: 'reviewerNotAllowed' }
  const text = comment.trim()
  if (decision === 'return' && !text) return { ok: false, blockers: [], error: 'commentRequired' }
  return {
    ok: true,
    blockers: [],
    next: {
      ...state,
      status: decision === 'approve' ? 'approved' : 'returned',
      reviewComment: text,
      events: [...state.events, newEvent(decision === 'approve' ? 'approved' : 'returned', now, state.reviewer, text || undefined)],
    },
  }
}

/** Issuing freezes the version. Only an approved report can be issued. */
export function buildSnapshot(
  plan: PlanLike & { standardName: string },
  execution: AuditExecutionData,
  state: StageReportState,
  findingsCount: number,
): StageReportSnapshot {
  const counts = countChecklistResults(execution)
  return {
    planNumber: plan.planNumber,
    clientName: plan.clientName,
    siteName: plan.siteName,
    stage: plan.stage,
    standardName: plan.standardName,
    standards: [...plan.standards],
    leadAuditor: plan.leadAuditor,
    auditTeam: [...plan.auditTeam],
    proposedStartDate: plan.proposedStartDate,
    proposedEndDate: plan.proposedEndDate,
    executiveSummary: execution.report.executiveSummary,
    recommendation: execution.report.recommendation,
    sections: { ...state.sections },
    counts: { audited: counts.audited, total: counts.total, nc: counts.minorNc + counts.majorNc, findings: findingsCount },
  }
}

export function issueReport(
  state: StageReportState,
  now: string,
  snapshot: StageReportSnapshot,
): StageReportResult {
  if (state.status !== 'approved') return { ok: false, blockers: [], error: 'wrongState' }
  return {
    ok: true,
    blockers: [],
    next: {
      ...state,
      status: 'issued',
      issuedAt: now,
      snapshot,
      events: [...state.events, newEvent('issued', now, undefined, `v${state.version}`)],
    },
  }
}

/** The report becomes read-only once it leaves draft/returned; this is the one state that is final. */
export function isFinal(state: StageReportState | undefined): boolean {
  return state?.status === 'issued'
}

/**
 * The audit client acknowledges an issued report. Allowed once, only after the
 * report is issued, and only with a name. The frozen snapshot is not touched.
 */
export function acknowledgeReport(
  state: StageReportState,
  input: { name: string; note?: string },
  now: string,
): StageReportResult {
  if (state.status !== 'issued' || !state.snapshot) return { ok: false, blockers: [], error: 'wrongState' }
  if (state.acknowledgement) return { ok: false, blockers: [], error: 'alreadyAcknowledged' }
  const by = input.name.trim()
  if (!by) return { ok: false, blockers: [], error: 'nameRequired' }
  const note = input.note?.trim() || undefined
  return {
    ok: true,
    blockers: [],
    next: {
      ...state,
      acknowledgement: { by, ...(note ? { note } : {}), at: now },
      events: [...state.events, newEvent('acknowledged', now, by, note)],
    },
  }
}
