/**
 * Nonconformities register: pure rules (no storage, no network).
 *
 * A nonconformity is raised from a submitted finding of type "Nonconformity"
 * that is bound to an audit, or imported from a previous system. It keeps the
 * audit and the finding it came from. Its four corrective-action stages
 * (correction, root cause, corrective action, verification) are derived from
 * the response fields and the status, never typed in twice.
 */

export type NcClassification = 'critical' | 'major' | 'minor' | 'observation'
export type NcStoredStatus = 'open' | 'in_progress' | 'submitted' | 'closed'
export type NcStatus = NcStoredStatus | 'overdue'
export type NcStage = 'correction' | 'root_cause' | 'corrective_action' | 'verification'
export type NcStageStatus = 'pending' | 'submitted' | 'accepted' | 'rejected'
export type NcSource = 'finding' | 'import'
export type NcEventCode = 'raised' | 'imported' | 'saved' | 'submitted' | 'revision' | 'closed'
export type NcEffectiveness = 'not_reviewed' | 'effective' | 'partially_effective' | 'not_effective'

export const NC_STAGES: NcStage[] = ['correction', 'root_cause', 'corrective_action', 'verification']

/** Pipeline columns, left to right. */
export const NC_PIPELINE_COLUMNS: NcStatus[] = ['open', 'overdue', 'in_progress', 'submitted', 'closed']

export const NC_CLASSIFICATIONS: NcClassification[] = ['critical', 'major', 'minor', 'observation']

export interface NcEvent {
  id: string
  code: NcEventCode
  /** Finding code or file name the event refers to. */
  ref: string
  by: string
  /** ISO timestamp. */
  at: string
}

/** An evidence file kept with the nonconformity (the file itself is stored as a data URL). */
export interface StoredEvidence {
  id: string
  name: string
  version: number
  uploadedAt: string
  sizeLabel: string
  dataUrl: string
}

/** Largest evidence file the browser-only mock can keep; bigger files are refused, never dropped silently. */
export const NC_EVIDENCE_MAX_BYTES = 700 * 1024

export type NcBlocker =
  | 'closed' | 'notSubmitted' | 'correction' | 'rootCause' | 'correctiveAction'
  | 'responsible' | 'targetDate' | 'evidence' | 'verification' | 'notEffective'

/** Thrown by the mutators when a rule is not met. `blockers` lists every missing item. */
export class NcRuleError extends Error {
  blockers: NcBlocker[]
  constructor(blockers: NcBlocker[]) {
    super(`Nonconformity rule not met: ${blockers.join(', ')}`)
    this.name = 'NcRuleError'
    this.blockers = blockers
  }
}

/** What is kept in the browser for one nonconformity. */
export interface StoredNonconformity {
  id: string
  ncId: string
  cabId: string
  source: NcSource
  findingRecordId: string | null
  findingCode: string
  planId: string | null
  planNumber: string
  clientName: string
  clientId: string
  country: string
  siteName: string
  standard: string
  classification: NcClassification
  clause: string
  statement: string
  raisedDate: string
  dueDate: string
  ownerName: string
  status: NcStoredStatus
  revisionRequested: boolean
  contactName: string
  contactEmail: string
  responsiblePerson: string
  correction: string
  rootCause: string
  correctiveAction: string
  targetDate: string
  effectivenessReviewDate: string
  effectivenessResult: NcEffectiveness
  reviewerComments: string
  importRef: string
  evidence?: StoredEvidence[]
  events: NcEvent[]
}

export interface NcStageCard {
  stage: NcStage
  status: NcStageStatus
  text: string
  ownerName: string
  dueDate: string
}

export interface NcView extends StoredNonconformity {
  /** Status shown to people: an open or in-progress item past its due date reads as overdue. */
  displayStatus: NcStatus
  overdue: boolean
  stages: NcStageCard[]
  /** Stages with a response, out of four. */
  progress: number
}

const pad = (n: number, size = 4) => String(n).padStart(size, '0')

/** Next NC code: continues the highest NC-nnnn number already in use. */
export function nextNcCode(existing: string[]): string {
  const max = existing.reduce((m, code) => {
    const n = Number(/^NC-(\d+)$/i.exec(code.trim())?.[1] ?? 0)
    return n > m ? n : m
  }, 0)
  return `NC-${pad(max + 1)}`
}

export function todayIso(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1, 2)}-${pad(now.getDate(), 2)}`
}

const isIsoDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v)

export function normalizeClassification(value: string): NcClassification | null {
  const v = String(value ?? '').trim().toLowerCase()
  if ((NC_CLASSIFICATIONS as string[]).includes(v)) return v as NcClassification
  // Records saved before classifications were stored as values carry the display label
  // ("Major — per scheme rules"); read the classification word off the front of it.
  const legacy = NC_CLASSIFICATIONS.find((c) => v.startsWith(`${c} `) || v.startsWith(`${c}—`) || v.startsWith(`${c}-`))
  return legacy ?? null
}

export function normalizeStatus(value: string): NcStoredStatus {
  const v = String(value ?? '').trim().toLowerCase().replace(/\s+/g, '_')
  return v === 'in_progress' || v === 'submitted' || v === 'closed' ? v : 'open'
}

interface FindingLike {
  id: string
  findingCode: string | null
  status: string
  planId: string | null
  planNumber: string | null
  clauseRef: string | null
  findingType: string
  classification: string
  requirementRef: string
  statement: string
  dueDate: string
  contact: string
  createdAt: string
}

interface PlanLike {
  id: string
  planNumber: string
  clientName: string
  clientCode: string
  country: string
  siteName: string
  standardName: string
  leadAuditor: string
  primaryContactName: string
  primaryContactEmail: string
}

/** A submitted nonconformity finding bound to an audit becomes (or already is) a register entry. */
export function isRaisingFinding(record: FindingLike): boolean {
  return record.status === 'Submitted' && record.findingType === 'Nonconformity' && Boolean(record.planId || record.planNumber)
}

function event(code: NcEventCode, ref: string, by: string, at: string, seed: string): NcEvent {
  return { id: `ev-${seed}-${code}-${at}`, code, ref, by, at }
}

function blankRecord(): Omit<StoredNonconformity, 'id' | 'ncId' | 'cabId' | 'source' | 'events'> {
  return {
    findingRecordId: null,
    findingCode: '',
    planId: null,
    planNumber: '',
    clientName: '',
    clientId: '',
    country: '',
    siteName: '',
    standard: '',
    classification: 'minor',
    clause: '',
    statement: '',
    raisedDate: '',
    dueDate: '',
    ownerName: '',
    status: 'open',
    revisionRequested: false,
    contactName: '',
    contactEmail: '',
    responsiblePerson: '',
    correction: '',
    rootCause: '',
    correctiveAction: '',
    targetDate: '',
    effectivenessReviewDate: '',
    effectivenessResult: 'not_reviewed',
    reviewerComments: '',
    importRef: '',
  }
}

export function buildFromFinding(args: {
  record: FindingLike
  plan: PlanLike | null
  cabId: string
  existingCodes: string[]
  now: string
  by: string
}): StoredNonconformity {
  const { record, plan, cabId, existingCodes, now, by } = args
  const ncId = nextNcCode(existingCodes)
  const code = record.findingCode ?? ''
  return {
    ...blankRecord(),
    id: ncId.toLowerCase(),
    ncId,
    cabId,
    source: 'finding',
    findingRecordId: record.id,
    findingCode: code,
    planId: plan?.id ?? record.planId,
    planNumber: plan?.planNumber ?? record.planNumber ?? '',
    clientName: plan?.clientName ?? '',
    clientId: plan?.clientCode ?? '',
    country: plan?.country ?? '',
    siteName: plan?.siteName ?? '',
    standard: plan?.standardName ?? '',
    classification: normalizeClassification(record.classification) ?? 'minor',
    clause: record.clauseRef || record.requirementRef || '',
    statement: record.statement,
    raisedDate: (record.createdAt || now).slice(0, 10),
    dueDate: isIsoDate(record.dueDate) ? record.dueDate : '',
    ownerName: plan?.leadAuditor ?? '',
    contactName: plan?.primaryContactName ?? record.contact ?? '',
    contactEmail: plan?.primaryContactEmail ?? '',
    events: [event('raised', code, by, now, ncId)],
  }
}

/** The finding stays the source of truth for what was found; the response is never touched. */
export function refreshFromFinding(nc: StoredNonconformity, record: FindingLike, plan: PlanLike | null): StoredNonconformity {
  if (nc.source !== 'finding') return nc
  return {
    ...nc,
    findingCode: record.findingCode ?? nc.findingCode,
    classification: normalizeClassification(record.classification) ?? nc.classification,
    clause: record.clauseRef || record.requirementRef || nc.clause,
    statement: record.statement || nc.statement,
    dueDate: isIsoDate(record.dueDate) ? record.dueDate : nc.dueDate,
    clientName: plan?.clientName ?? nc.clientName,
    clientId: plan?.clientCode ?? nc.clientId,
    country: plan?.country ?? nc.country,
    siteName: plan?.siteName ?? nc.siteName,
    standard: plan?.standardName ?? nc.standard,
    ownerName: nc.ownerName || plan?.leadAuditor || '',
  }
}

const str = (values: Record<string, unknown>, key: string) =>
  typeof values[key] === 'string' ? (values[key] as string).trim() : ''

/** An imported row (already validated by the import wizard) becomes a register entry. */
export function buildFromImport(args: {
  values: Record<string, unknown>
  plans: PlanLike[]
  cabId: string
  existingCodes: string[]
  fileName: string
  now: string
  by: string
}): StoredNonconformity {
  const { values, plans, cabId, existingCodes, fileName, now, by } = args
  const reference = str(values, 'reference')
  const taken = new Set(existingCodes.map((c) => c.toLowerCase()))
  const ncId = reference && !taken.has(reference.toLowerCase()) ? reference : nextNcCode(existingCodes)
  const auditRef = str(values, 'auditReference')
  const plan = auditRef ? plans.find((p) => p.planNumber.toLowerCase() === auditRef.toLowerCase()) ?? null : null
  const status = normalizeStatus(str(values, 'status'))
  const raised = str(values, 'raisedDate')
  return {
    ...blankRecord(),
    id: ncId.toLowerCase(),
    ncId,
    cabId,
    source: 'import',
    planId: plan?.id ?? null,
    planNumber: plan?.planNumber ?? auditRef,
    clientName: plan?.clientName ?? str(values, 'client'),
    clientId: plan?.clientCode ?? '',
    country: plan?.country ?? '',
    siteName: plan?.siteName ?? '',
    standard: str(values, 'standard') || plan?.standardName || '',
    classification: normalizeClassification(str(values, 'grade')) ?? 'minor',
    clause: str(values, 'clause'),
    statement: str(values, 'description'),
    raisedDate: isIsoDate(raised) ? raised : now.slice(0, 10),
    dueDate: str(values, 'dueDate'),
    ownerName: str(values, 'owner') || plan?.leadAuditor || '',
    status,
    responsiblePerson: str(values, 'responsiblePerson'),
    correction: str(values, 'correction'),
    rootCause: str(values, 'rootCause'),
    correctiveAction: str(values, 'correctiveAction'),
    importRef: reference,
    events: [event('imported', fileName, by, now, ncId)],
  }
}

/** Applies a later import row to an existing imported record (duplicate mode "update"). */
export function updateFromImport(nc: StoredNonconformity, values: Record<string, unknown>): StoredNonconformity {
  const pick = (key: string, current: string) => str(values, key) || current
  return {
    ...nc,
    clause: pick('clause', nc.clause),
    statement: pick('description', nc.statement),
    dueDate: pick('dueDate', nc.dueDate),
    standard: pick('standard', nc.standard),
    ownerName: pick('owner', nc.ownerName),
    responsiblePerson: pick('responsiblePerson', nc.responsiblePerson),
    correction: pick('correction', nc.correction),
    rootCause: pick('rootCause', nc.rootCause),
    correctiveAction: pick('correctiveAction', nc.correctiveAction),
    classification: normalizeClassification(str(values, 'grade')) ?? nc.classification,
    status: str(values, 'status') ? normalizeStatus(str(values, 'status')) : nc.status,
  }
}

const filled = (v: string) => v.trim().length > 0

/** A verification record exists once the reviewer has written comments and chosen an effectiveness result. */
export function hasVerificationRecord(nc: Pick<StoredNonconformity, 'reviewerComments' | 'effectivenessResult'>): boolean {
  return filled(nc.reviewerComments) && nc.effectivenessResult !== 'not_reviewed'
}

/** What stops a response from being submitted. Empty means it can be submitted. */
export function submitBlockers(nc: StoredNonconformity): NcBlocker[] {
  const out: NcBlocker[] = []
  if (nc.status === 'closed') out.push('closed')
  if (!filled(nc.correction)) out.push('correction')
  if (!filled(nc.rootCause)) out.push('rootCause')
  if (!filled(nc.correctiveAction)) out.push('correctiveAction')
  if (!filled(nc.responsiblePerson)) out.push('responsible')
  if (!filled(nc.targetDate)) out.push('targetDate')
  if ((nc.evidence ?? []).length === 0) out.push('evidence')
  return out
}

/** What stops a nonconformity from being closed. It must be submitted, complete and verified. */
export function closeBlockers(nc: StoredNonconformity): NcBlocker[] {
  const out: NcBlocker[] = []
  if (nc.status === 'closed') return ['closed']
  if (nc.status !== 'submitted') out.push('notSubmitted')
  if (!filled(nc.correction)) out.push('correction')
  if (!filled(nc.rootCause)) out.push('rootCause')
  if (!filled(nc.correctiveAction)) out.push('correctiveAction')
  if ((nc.evidence ?? []).length === 0) out.push('evidence')
  if (!hasVerificationRecord(nc)) out.push('verification')
  // Closing needs a successful verification: partially effective and not effective go back for another round.
  else if (nc.effectivenessResult !== 'effective') out.push('notEffective')
  return out
}

/** The four stage cards, derived from the response fields and the status. */
export function deriveStages(nc: StoredNonconformity): NcStageCard[] {
  const text: Record<NcStage, string> = {
    correction: nc.correction,
    root_cause: nc.rootCause,
    corrective_action: nc.correctiveAction,
    verification: nc.reviewerComments,
  }
  const owner = nc.responsiblePerson || nc.ownerName
  return NC_STAGES.map((stage) => {
    const has = text[stage].trim().length > 0
    let status: NcStageStatus = 'pending'
    if (stage === 'verification') {
      status = nc.status === 'closed' ? (hasVerificationRecord(nc) ? 'accepted' : 'pending') : nc.revisionRequested && has ? 'rejected' : 'pending'
    } else if (has) {
      if (nc.status === 'closed') status = 'accepted'
      else if (nc.status === 'submitted') status = 'submitted'
      else if (nc.revisionRequested) status = 'rejected'
    }
    return {
      stage,
      status,
      text: text[stage],
      ownerName: stage === 'verification' ? nc.ownerName || owner : owner,
      dueDate: stage === 'verification' ? nc.effectivenessReviewDate || nc.dueDate : stage === 'corrective_action' ? nc.targetDate || nc.dueDate : nc.dueDate,
    }
  })
}

export function toView(nc: StoredNonconformity, today: string): NcView {
  const open = nc.status === 'open' || nc.status === 'in_progress'
  const overdue = open && isIsoDate(nc.dueDate) && nc.dueDate < today
  const stages = deriveStages(nc)
  return {
    ...nc,
    overdue,
    displayStatus: overdue ? 'overdue' : nc.status,
    stages,
    progress: stages.filter((s) => (s.stage === 'verification' ? s.status === 'accepted' : s.text.trim())).length,
  }
}

export interface NcFilters {
  query?: string
  country?: string
  status?: string
  from?: string
  to?: string
}

export function filterViews(list: NcView[], f: NcFilters): NcView[] {
  const q = (f.query ?? '').trim().toLowerCase()
  return list.filter((nc) => {
    if (q && ![nc.ncId, nc.findingCode, nc.planNumber, nc.clientName, nc.clientId, nc.clause].some((v) => v.toLowerCase().includes(q))) return false
    if (f.country && f.country !== 'all' && nc.country !== f.country) return false
    if (f.status && f.status !== 'all' && nc.displayStatus !== f.status) return false
    if (f.from && nc.raisedDate < f.from) return false
    if (f.to && nc.raisedDate > f.to) return false
    return true
  })
}

export function groupByStatus(list: NcView[]): Record<NcStatus, NcView[]> {
  const out: Record<NcStatus, NcView[]> = { open: [], overdue: [], in_progress: [], submitted: [], closed: [] }
  for (const nc of list) out[nc.displayStatus].push(nc)
  return out
}

export function neighbours(list: Array<{ id: string }>, id: string): { prev: string | null; next: string | null; index: number } {
  const index = list.findIndex((item) => item.id === id)
  if (index < 0) return { prev: null, next: null, index: -1 }
  return { prev: index > 0 ? list[index - 1].id : null, next: index < list.length - 1 ? list[index + 1].id : null, index }
}

/** Finding records that are submitted nonconformities but have no register entry yet. */
export function findingsWithoutNonconformity<T extends FindingLike>(records: T[], stored: StoredNonconformity[]): T[] {
  const bound = new Set(stored.map((nc) => nc.findingRecordId).filter(Boolean))
  return records.filter((r) => isRaisingFinding(r) && !bound.has(r.id))
}
