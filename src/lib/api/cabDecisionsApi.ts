export type DecisionReviewStatus = 'awaiting_technical_review' | 'ready_for_decision' | 'decided_granted' | 'decided_deferred' | 'decided_refused'
export type DecisionOutcome = 'grant' | 'defer' | 'refuse'
export interface DecisionQueueItem {
  id: string; decisionId: string; applicationId: string
  clientName: string; clientId: string; scheme: string
  country: string; receivedDate: string; receivedDateRaw: string
  dueDate: string; dueDateRaw: string
  reviewStatus: DecisionReviewStatus; reviewStatusLabel: string
  decisionMakerName: string; decisionMakerId: string
}
export interface EvidenceDoc {
  id: string; name: string
  docType: 'audit_report' | 'technical_review' | 'audit_findings' | 'client_submission' | 'other'
  docTypeLabel: string; version: string; date: string
  status: 'Final' | 'Open' | 'Partial'
}
export interface DecisionFinding {
  id: string; requirement: string; description: string
  severity: 'Major' | 'Minor'; status: 'Open' | 'Closed' | 'Accepted'
}
export interface DecisionMakerOption {
  id: string; name: string; authorized: boolean
  independentFromAudit: boolean; roles: string[]
}
export interface DecisionRecord {
  outcome: DecisionOutcome | null; rationale: string
  decisionMakerId: string; decisionDate: string; confirmedScope: string
  version: number; recordedAt: string | null
  recordedBy: string | null; immutable: boolean
}
export interface DecisionDetail extends DecisionQueueItem {
  clientCountry: string; primaryContactName: string
  primaryContactEmail: string; primaryContactPhone: string
  applicationScheme: string; currentStage: string; currentStageDetail: string
  proposedScope: string; evidence: EvidenceDoc[]; findings: DecisionFinding[]
  recommendationBy: string; recommendationDate: string; recommendationText: string
  technicalReviewCompleted: boolean; record: DecisionRecord
  decisionMakers: DecisionMakerOption[]
  activity: Array<{ id: string; text: string; by: string; at: string }>
}
/** Stable field keys shared by CAB + portal. Do not rename without migration. */
export const DECISION_FIELD_KEYS = {
  outcome: 'decision.outcome',
  rationale: 'decision.rationale',
  decisionMaker: 'decision.decisionMaker',
  decisionDate: 'decision.decisionDate',
  confirmedScope: 'decision.confirmedScope',
} as const
export const DECISION_OUTCOME_OPTIONS: Array<{ value: DecisionOutcome; label: string }> = [
  { value: 'grant', label: 'Grant' },
  { value: 'defer', label: 'Defer' },
  { value: 'refuse', label: 'Refuse' },
]
export interface DecisionFilterParams {
  searchQuery?: string; startDate?: string; endDate?: string
  country?: string; status?: string
}
const MOCK_Q: DecisionQueueItem[] = [
  { id: 'dec-0024', decisionId: 'DEC-0024', applicationId: 'APP-0024', clientName: 'Al Noor Food Industries', clientId: 'CL-0001', scheme: 'ISO 9001', country: 'Saudi Arabia', receivedDate: '12 Feb 2024', receivedDateRaw: '2024-02-12', dueDate: '15 Mar 2024', dueDateRaw: '2024-03-15', reviewStatus: 'awaiting_technical_review', reviewStatusLabel: 'Awaiting technical review', decisionMakerName: 'Mohammed Khan', decisionMakerId: 'dm-khan' },
  { id: 'dec-0025', decisionId: 'DEC-0025', applicationId: 'APP-0031', clientName: 'GreenLeaf Pvt. Ltd.', clientId: 'CLT-2025-0148', scheme: 'ISO 22000', country: 'United Arab Emirates', receivedDate: '02 Mar 2024', receivedDateRaw: '2024-03-02', dueDate: '02 Apr 2024', dueDateRaw: '2024-04-02', reviewStatus: 'ready_for_decision', reviewStatusLabel: 'Ready for decision', decisionMakerName: 'Sara Ali', decisionMakerId: 'dm-sara' },
  { id: 'dec-0026', decisionId: 'DEC-0026', applicationId: 'APP-0019', clientName: 'Apex Health Systems', clientId: 'CL-0019', scheme: 'ISO 13485', country: 'Egypt', receivedDate: '20 Jan 2024', receivedDateRaw: '2024-01-20', dueDate: '20 Feb 2024', dueDateRaw: '2024-02-20', reviewStatus: 'decided_granted', reviewStatusLabel: 'Granted', decisionMakerName: 'Omar Khalid', decisionMakerId: 'dm-omar' },
]
const BASE_EVIDENCE: EvidenceDoc[] = [
  { id: 'ev-1', name: 'Audit Report - APP-0024', docType: 'audit_report', docTypeLabel: 'Audit report', version: '1.0', date: '2024-11-10', status: 'Final' },
  { id: 'ev-2', name: 'Technical Review Report', docType: 'technical_review', docTypeLabel: 'Technical review', version: '1.0', date: '2024-11-15', status: 'Final' },
  { id: 'ev-3', name: 'Findings Register', docType: 'audit_findings', docTypeLabel: 'Audit findings', version: '1.0', date: '2024-11-10', status: 'Open' },
  { id: 'ev-4', name: 'Management Response', docType: 'client_submission', docTypeLabel: 'Client submission', version: '1.0', date: '2024-11-12', status: 'Partial' },
  { id: 'ev-5', name: 'Supporting Evidence', docType: 'other', docTypeLabel: 'Other', version: '1.0', date: '2024-11-12', status: 'Final' },
]
const BASE_MAKERS: DecisionMakerOption[] = [
  { id: 'dm-khan', name: 'Mohammed Khan', authorized: true, independentFromAudit: true, roles: ['Decision maker'] },
  { id: 'dm-sara', name: 'Sara Ali', authorized: false, independentFromAudit: true, roles: ['Reviewer'] },
  { id: 'dm-omar', name: 'Omar Khalid', authorized: true, independentFromAudit: false, roles: ['Auditor', 'Decision maker'] },
]
const SCOPE_EX = 'Manufacture of dairy products, juices and related food products at Riyadh production facility, Saudi Arabia.'
function detailFor(q: DecisionQueueItem, extra: Partial<DecisionDetail>): DecisionDetail {
  return {
    ...q,
    clientCountry: q.country,
    primaryContactName: 'Sara Ali',
    primaryContactEmail: 'sara@alnoor.example',
    primaryContactPhone: '+966 11 234 5678',
    applicationScheme: 'Food Safety Management System (illustrative example)',
    currentStage: 'Certification decision',
    currentStageDetail: 'Audit completed',
    proposedScope: SCOPE_EX,
    evidence: BASE_EVIDENCE.map((e) => ({ ...e })),
    findings: [
      { id: 'F-0012', requirement: '7.2 Competence', description: 'Training records incomplete for critical staff.', severity: 'Major', status: 'Open' },
      { id: 'F-0015', requirement: '8.5.1 Control of production', description: 'Environmental monitoring results missing for Aug 2024.', severity: 'Minor', status: 'Open' },
    ],
    recommendationBy: 'Omar Khalid',
    recommendationDate: '2024-11-16',
    recommendationText: 'Grant certification subject to closure of outstanding findings (F-0012, F-0015).',
    technicalReviewCompleted: false,
    record: { outcome: null, rationale: '', decisionMakerId: '', decisionDate: '', confirmedScope: SCOPE_EX, version: 1, recordedAt: null, recordedBy: null, immutable: false },
    decisionMakers: BASE_MAKERS.map((m) => ({ ...m })),
    activity: [
      { id: 'a1', text: 'Audit completed', by: 'Audit team', at: '12 Feb 2024, 10:30' },
      { id: 'a2', text: 'Assigned to decision maker', by: 'System', at: '12 Feb 2024, 10:31' },
    ],
    ...extra,
  } as DecisionDetail
}
const DETAILS: Record<string, DecisionDetail> = {
  'dec-0024': detailFor(MOCK_Q[0], { currentStageDetail: 'Audit completed · Technical review pending' }),
  'dec-0025': detailFor(MOCK_Q[1], { technicalReviewCompleted: true, findings: [], currentStageDetail: 'Technical review completed' }),
  'dec-0026': detailFor(MOCK_Q[2], { technicalReviewCompleted: true, findings: [], currentStageDetail: 'Decision recorded', record: { outcome: 'grant', rationale: 'All gates satisfied. Scope confirmed.', decisionMakerId: 'dm-omar', decisionDate: '2024-02-18', confirmedScope: SCOPE_EX, version: 1, recordedAt: '2024-02-18, 14:00', recordedBy: 'Omar Khalid', immutable: true } }),
}
const wait = (ms = 220) => new Promise((r) => setTimeout(r, ms))
export interface GateResult {
  technicalReviewCompleted: boolean; findingsClosed: boolean
  makerAuthorized: boolean; makerIndependent: boolean
  scopeOk: boolean; rationaleOk: boolean; dateOk: boolean
  canRecord: boolean; canGrant: boolean; blockers: string[]
}
export interface DraftInput {
  outcome: DecisionOutcome | null; rationale: string
  decisionMakerId: string; decisionDate: string; confirmedScope: string
}
/** Certification-decision gates — distinct from application acceptance. */
export function evaluateGates(d: DecisionDetail, draft: DraftInput): GateResult {
  const open = d.findings.filter((f) => f.status === 'Open')
  const maker = d.decisionMakers.find((m) => m.id === draft.decisionMakerId) ?? null
  const blockers: string[] = []
  if (!d.technicalReviewCompleted) blockers.push('Technical review is not complete.')
  if (open.length > 0) blockers.push('There are unresolved findings. All findings must be closed or accepted before a decision can be recorded.')
  if (!maker) blockers.push('Select an authorized decision-maker.')
  else {
    if (!maker.authorized) blockers.push('Selected user is not authorized as decision-maker.')
    if (!maker.independentFromAudit) blockers.push('Decision-maker must be independent from the audit team.')
  }
  if (!draft.rationale.trim()) blockers.push('Rationale is required.')
  if (!draft.confirmedScope.trim()) blockers.push('Confirmed scope is required.')
  if (!draft.decisionDate) blockers.push('Decision date is required.')
  if (!draft.outcome) blockers.push('Outcome is required.')
  return {
    technicalReviewCompleted: d.technicalReviewCompleted,
    findingsClosed: open.length === 0,
    makerAuthorized: Boolean(maker?.authorized),
    makerIndependent: Boolean(maker?.independentFromAudit),
    scopeOk: draft.confirmedScope.trim().length > 0,
    rationaleOk: draft.rationale.trim().length > 0,
    dateOk: draft.decisionDate.length > 0,
    canRecord: blockers.length === 0,
    canGrant: blockers.length === 0 && draft.outcome === 'grant',
    blockers,
  }
}
export async function getDecisionQueue(p?: DecisionFilterParams): Promise<DecisionQueueItem[]> {
  await wait()
  let list = [...MOCK_Q]
  if (p?.searchQuery) {
    const q = p.searchQuery.toLowerCase().trim()
    list = list.filter((d) => d.decisionId.toLowerCase().includes(q) || d.applicationId.toLowerCase().includes(q) || d.clientName.toLowerCase().includes(q) || d.clientId.toLowerCase().includes(q))
  }
  if (p?.country && p.country !== 'all') list = list.filter((d) => d.country === p.country)
  if (p?.status && p.status !== 'all') list = list.filter((d) => d.reviewStatus === p.status)
  if (p?.startDate) list = list.filter((d) => d.receivedDateRaw >= p.startDate!)
  if (p?.endDate) list = list.filter((d) => d.receivedDateRaw <= p.endDate!)
  return list
}
export async function getDecisionById(id: string): Promise<DecisionDetail | null> {
  await wait()
  const k = Object.keys(DETAILS).find((x) => x === id || DETAILS[x].decisionId.toLowerCase() === id.toLowerCase())
  return k ? (JSON.parse(JSON.stringify(DETAILS[k])) as DecisionDetail) : null
}
/** Draft save permits incomplete later-stage data; never validates gates. */
export async function saveDecisionDraft(id: string, draft: Partial<DecisionRecord>): Promise<DecisionDetail> {
  await wait(300)
  const k = Object.keys(DETAILS).find((x) => x === id || DETAILS[x].decisionId === id)
  if (!k) throw new Error('Decision not found')
  if (DETAILS[k].record.immutable) {
    const e = new Error('Recorded outcome is immutable. Open a controlled correction version instead.') as Error & { code?: string }
    e.code = 'CONFLICT_IMMUTABLE'
    throw e
  }
  if (draft.rationale === '__fail__') throw new Error('Save failed. Your values were preserved — try again.')
  DETAILS[k] = { ...DETAILS[k], record: { ...DETAILS[k].record, ...draft, immutable: false } }
  return JSON.parse(JSON.stringify(DETAILS[k])) as DecisionDetail
}
/** Submission requires configured gates; no automated grant based on payment. */
export async function recordDecision(id: string, draft: DraftInput & { outcome: DecisionOutcome }): Promise<DecisionDetail> {
  await wait(350)
  const k = Object.keys(DETAILS).find((x) => x === id || DETAILS[x].decisionId === id)
  if (!k) throw new Error('Decision not found')
  const cur = DETAILS[k]
  if (cur.record.immutable) {
    const e = new Error('Already recorded. Corrections require a controlled version.') as Error & { code?: string }
    e.code = 'CONFLICT_IMMUTABLE'
    throw e
  }
  const g = evaluateGates(cur, draft)
  if (!g.canRecord) throw new Error(g.blockers[0] ?? 'Gates not satisfied')
  const maker = cur.decisionMakers.find((m) => m.id === draft.decisionMakerId)
  const next: DecisionDetail = {
    ...cur,
    reviewStatus: draft.outcome === 'grant' ? 'decided_granted' : draft.outcome === 'defer' ? 'ready_for_decision' : 'decided_refused',
    reviewStatusLabel: draft.outcome === 'grant' ? 'Granted' : draft.outcome === 'defer' ? 'Deferred' : 'Refused',
    record: { outcome: draft.outcome, rationale: draft.rationale, decisionMakerId: draft.decisionMakerId, decisionDate: draft.decisionDate, confirmedScope: draft.confirmedScope, version: cur.record.version, recordedAt: 'now', recordedBy: maker?.name ?? '', immutable: true },
  }
  const qi = MOCK_Q.findIndex((q) => q.id === k || q.decisionId === cur.decisionId)
  if (qi >= 0) MOCK_Q[qi] = { ...MOCK_Q[qi], reviewStatus: next.reviewStatus, reviewStatusLabel: next.reviewStatusLabel }
  DETAILS[k] = next
  return JSON.parse(JSON.stringify(next)) as DecisionDetail
}
/** Controlled correction version of an immutable recorded outcome. */
export async function openCorrectionVersion(id: string): Promise<DecisionDetail> {
  await wait(250)
  const k = Object.keys(DETAILS).find((x) => x === id || DETAILS[x].decisionId === id)
  if (!k) throw new Error('Decision not found')
  const cur = DETAILS[k]
  const next: DecisionDetail = { ...cur, reviewStatus: 'ready_for_decision', reviewStatusLabel: 'Correction v' + (cur.record.version + 1), record: { ...cur.record, version: cur.record.version + 1, immutable: false, recordedAt: null, recordedBy: null } }
  DETAILS[k] = next
  return JSON.parse(JSON.stringify(next)) as DecisionDetail
}
/** Exports apply current filters to ALL authorized matching records (not just page). */
export function decisionsToCsv(rows: DecisionQueueItem[]): string {
  const h = 'Decision ID,Application ID,Client,Client ID,Scheme,Country,Review status,Decision maker,Due date'
  const lines = rows.map((r) => [r.decisionId, r.applicationId, '"' + r.clientName + '"', r.clientId, r.scheme, r.country, '"' + r.reviewStatusLabel + '"', '"' + r.decisionMakerName + '"', r.dueDate].join(','))
  return [h, ...lines].join('\n')
}
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}






