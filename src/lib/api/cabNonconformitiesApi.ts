/**
 * CAB Nonconformities — corrective action register domain rules & mock API.
 * The register is built from the findings of the CAB's own audits and from imports.
 * It starts empty (no demo rows). Data stays in this browser until the backend exists.
 *
 * Classification values intentionally mirror `SCHEME_RULES.classifications`
 * in `cabAuditReportingApi` so a finding raised in the audit workspace and the
 * nonconformity it becomes here stay on the same vocabulary.
 */

export type NonconformityClassification = 'critical' | 'major' | 'minor' | 'observation'

export type NonconformityStatus = 'open' | 'in_progress' | 'submitted' | 'closed' | 'overdue'

export type CorrectiveActionStage = 'correction' | 'root_cause' | 'corrective_action' | 'verification'

export type CorrectiveActionStatus = 'pending' | 'submitted' | 'accepted' | 'rejected'

export interface CorrectiveAction {
  id: string
  stage: CorrectiveActionStage
  stageLabel: string
  description: string
  ownerName: string
  dueDate: string
  status: CorrectiveActionStatus
  statusLabel: string
}

export interface NonconformityAttachment {
  id: string
  name: string
  sizeLabel: string
  uploadedBy: string
  uploadedAt: string
}

export interface NonconformityHistoryEntry {
  id: string
  text: string
  by: string
  at: string
  /** Event code and its reference, so a page can translate the entry. */
  code?: string
  ref?: string
}

export interface NonconformityItem {
  id: string
  ncId: string
  findingId: string
  auditId: string
  clientName: string
  clientId: string
  country: string
  classification: NonconformityClassification
  classificationLabel: string
  description: string
  raisedDate: string
  raisedDateRaw: string
  dueDate: string
  dueDateRaw: string
  overdue: boolean
  ownerName: string
  status: NonconformityStatus
  statusLabel: string
  primaryContactName: string
  primaryContactEmail: string
  actions: CorrectiveAction[]
  attachments: NonconformityAttachment[]
  history: NonconformityHistoryEntry[]
  /** Binding to the audit and the finding the nonconformity was raised from. */
  planId?: string | null
  planNumber?: string
  findingRecordId?: string | null
  findingCode?: string
  clause?: string
  statement?: string
  source?: 'finding' | 'import'
  siteName?: string
  standard?: string
  progress?: number
}

export interface NonconformityFilterParams {
  searchQuery?: string
  startDate?: string
  endDate?: string
  country?: string
  status?: string
}

/** Stable field keys shared by CAB + client portal. Do not rename without migration. */
export const NONCONFORMITY_FIELD_KEYS = {
  classification: 'nonconformity.classification',
  description: 'nonconformity.description',
  dueDate: 'nonconformity.dueDate',
  owner: 'nonconformity.owner',
  status: 'nonconformity.status',
} as const

export const NONCONFORMITY_CLASSIFICATIONS: NonconformityClassification[] = [
  'critical',
  'major',
  'minor',
  'observation',
]

export const NONCONFORMITY_STATUSES: NonconformityStatus[] = [
  'open',
  'in_progress',
  'submitted',
  'closed',
  'overdue',
]

import { currentFindingsOwner, listFindingRecords } from '@/lib/api/cabAuditReportingApi'
import { fetchAuditPlans } from '@/lib/api/cabAuditPlanningApi'
import { getAuthSession } from '@/lib/authStorage'
import {
  buildFromFinding,
  buildFromImport,
  filterViews,
  findingsWithoutNonconformity,
  refreshFromFinding,
  toView,
  todayIso,
  updateFromImport,
  type NcEventCode,
  type NcView,
  type StoredEvidence,
  type StoredNonconformity,
  NcRuleError,
  closeBlockers,
  submitBlockers,
} from '@/lib/api/nonconformityRegister'

const STORAGE_KEY = 'icasco_cab_nonconformities_v1'

function owner(): string {
  return currentFindingsOwner() ?? 'local'
}

export function currentActor(): string {
  const user = getAuthSession()?.user as { name?: string; fullName?: string; email?: string } | undefined
  return user?.name || user?.fullName || user?.email || 'CAB user'
}

function readAll(): StoredNonconformity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as StoredNonconformity[]) : []
  } catch {
    return []
  }
}

function writeOwn(list: StoredNonconformity[]): void {
  const id = owner()
  const others = readAll().filter((nc) => nc.cabId !== id)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...others, ...list]))
  } catch {
    // Browser storage is full: say so instead of pretending the change was saved.
    throw new Error('NC_STORAGE_FULL')
  }
}

export function listStoredNonconformities(): StoredNonconformity[] {
  const id = owner()
  return readAll().filter((nc) => nc.cabId === id)
}

/** Raises a register entry for every submitted nonconformity finding that has none, and refreshes the others. */
export async function syncNonconformitiesFromFindings(): Promise<StoredNonconformity[]> {
  const stored = listStoredNonconformities()
  const records = listFindingRecords()
  const plans = await fetchAuditPlans()
  const planOf = (r: { planId: string | null; planNumber: string | null }) =>
    plans.find((p) => p.id === r.planId || p.planNumber === r.planNumber || p.planNumber === r.planId) ?? null
  let changed = false
  const next = stored.map((nc) => {
    const record = nc.findingRecordId ? records.find((r) => r.id === nc.findingRecordId) : undefined
    if (!record) return nc
    const refreshed = refreshFromFinding(nc, record, planOf(record))
    if (JSON.stringify(refreshed) !== JSON.stringify(nc)) changed = true
    return refreshed
  })
  const now = new Date().toISOString()
  for (const record of findingsWithoutNonconformity(records, next)) {
    next.push(
      buildFromFinding({ record, plan: planOf(record), cabId: owner(), existingCodes: next.map((n) => n.ncId), now, by: currentActor() }),
    )
    changed = true
  }
  if (changed) writeOwn(next)
  return next
}

const STATUS_KEYS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In progress',
  submitted: 'Submitted',
  closed: 'Closed',
  overdue: 'Overdue',
}
const CLASS_LABELS: Record<string, string> = { critical: 'Critical', major: 'Major', minor: 'Minor', observation: 'Observation' }
const STAGE_LABELS: Record<string, string> = {
  correction: 'Correction',
  root_cause: 'Root cause analysis',
  corrective_action: 'Corrective action',
  verification: 'Verification',
}
const STAGE_STATUS_LABELS: Record<string, string> = { pending: 'Pending', submitted: 'Submitted', accepted: 'Accepted', rejected: 'Rejected' }
const EVENT_TEXT: Record<NcEventCode, string> = {
  raised: 'Raised from finding {ref}',
  imported: 'Imported from {ref}',
  saved: 'Response saved',
  submitted: 'Response submitted for review',
  revision: 'Revision requested',
  closed: 'Closed after verification',
}

const fmtDate = (iso: string) =>
  iso && /^\d{4}-\d{2}-\d{2}/.test(iso)
    ? new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : ''

export type NonconformityRecord = NonconformityItem & { view: NcView }

export function toItem(nc: StoredNonconformity, today = todayIso()): NonconformityRecord {
  const view = toView(nc, today)
  return {
    id: nc.id,
    ncId: nc.ncId,
    findingId: nc.findingCode || nc.importRef || nc.ncId,
    auditId: nc.planNumber,
    clientName: nc.clientName,
    clientId: nc.clientId,
    country: nc.country,
    classification: nc.classification,
    classificationLabel: CLASS_LABELS[nc.classification],
    description: nc.statement,
    raisedDate: fmtDate(nc.raisedDate),
    raisedDateRaw: nc.raisedDate,
    dueDate: fmtDate(nc.dueDate),
    dueDateRaw: nc.dueDate,
    overdue: view.overdue,
    ownerName: nc.ownerName,
    status: view.displayStatus,
    statusLabel: STATUS_KEYS[view.displayStatus],
    primaryContactName: nc.contactName,
    primaryContactEmail: nc.contactEmail,
    actions: view.stages.map((s) => ({
      id: `${nc.id}-${s.stage}`,
      stage: s.stage,
      stageLabel: STAGE_LABELS[s.stage],
      description: s.text,
      ownerName: s.ownerName,
      dueDate: fmtDate(s.dueDate),
      status: s.status,
      statusLabel: STAGE_STATUS_LABELS[s.status],
    })),
    attachments: [],
    history: nc.events.map((e) => ({
      id: e.id,
      text: EVENT_TEXT[e.code].replace('{ref}', e.ref),
      by: e.by,
      at: new Date(e.at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }),
      code: e.code,
      ref: e.ref,
    })),
    planId: nc.planId,
    planNumber: nc.planNumber,
    findingRecordId: nc.findingRecordId,
    findingCode: nc.findingCode,
    clause: nc.clause,
    statement: nc.statement,
    source: nc.source,
    siteName: nc.siteName,
    standard: nc.standard,
    progress: view.progress,
    view,
  }
}

/** The register, newest raised first. Raises entries from submitted findings first. */
export async function getNonconformities(params?: NonconformityFilterParams): Promise<NonconformityRecord[]> {
  const stored = await syncNonconformitiesFromFindings()
  const today = todayIso()
  const views = filterViews(
    stored.map((nc) => toView(nc, today)),
    { query: params?.searchQuery, country: params?.country, status: params?.status, from: params?.startDate, to: params?.endDate },
  )
  const order = new Map(views.map((v) => [v.id, v]))
  return stored
    .filter((nc) => order.has(nc.id))
    .map((nc) => toItem(nc, today))
    .sort((a, b) => (a.raisedDateRaw < b.raisedDateRaw ? 1 : a.raisedDateRaw > b.raisedDateRaw ? -1 : b.ncId.localeCompare(a.ncId)))
}

export async function getNonconformityById(id: string): Promise<NonconformityItem | null> {
  const stored = await syncNonconformitiesFromFindings()
  const match = stored.find((nc) => nc.id === id || nc.ncId.toLowerCase() === id.toLowerCase())
  return match ? toItem(match) : null
}

/** Countries present in the register: keeps the filter aligned with the data. */
export function getNonconformityCountries(items: Array<{ country: string }>): string[] {
  return Array.from(new Set(items.map((item) => item.country).filter(Boolean)))
}

export interface NonconformityPatch {
  status?: StoredNonconformity['status']
  revisionRequested?: boolean
  correction?: string
  rootCause?: string
  correctiveAction?: string
  responsiblePerson?: string
  targetDate?: string
  effectivenessReviewDate?: string
  effectivenessResult?: StoredNonconformity['effectivenessResult']
  reviewerComments?: string
}

/** Saves a change to one nonconformity and records the event, if any, in its history. */
export async function updateNonconformity(
  id: string,
  patch: NonconformityPatch,
  event?: { code: NcEventCode; ref?: string },
): Promise<StoredNonconformity | null> {
  const stored = listStoredNonconformities()
  const index = stored.findIndex((nc) => nc.id === id || nc.ncId === id)
  if (index < 0) return null
  const at = new Date().toISOString()
  const current = stored[index]
  const events = event
    ? [...current.events, { id: `ev-${current.id}-${event.code}-${at}`, code: event.code, ref: event.ref ?? '', by: currentActor(), at }]
    : current.events
  const merged = { ...current, ...patch, events }
  if (current.status === 'closed') throw new NcRuleError(['closed'])
  // The rules follow the status being set, so no caller can reach submitted or closed around them.
  const blockers =
    merged.status === 'closed' ? closeBlockers({ ...merged, status: current.status })
    : merged.status === 'submitted' ? submitBlockers(merged)
    : event?.code === 'revision' && current.status !== 'submitted' ? (['notSubmitted'] as const)
    : []
  if (blockers.length) throw new NcRuleError([...blockers])
  stored[index] = merged
  writeOwn(stored)
  return stored[index]
}

/** Replaces the evidence kept with a nonconformity. Throws NC_STORAGE_FULL when the browser cannot keep it. */
export async function setNonconformityEvidence(id: string, evidence: StoredEvidence[]): Promise<StoredNonconformity | null> {
  const stored = listStoredNonconformities()
  const index = stored.findIndex((nc) => nc.id === id || nc.ncId === id)
  if (index < 0) return null
  if (stored[index].status === 'closed') throw new NcRuleError(['closed'])
  stored[index] = { ...stored[index], evidence }
  writeOwn(stored)
  return stored[index]
}

/**
 * The audit plan store has no CAB id, so a plan number alone proves nothing about ownership.
 * A plan counts as this CAB's only when one of this CAB's own findings points at it.
 */
async function provableOwnPlans() {
  const records = listFindingRecords()
  const plans = await fetchAuditPlans()
  return plans.filter((p) => records.some((r) => r.planId === p.id || r.planNumber === p.planNumber || r.planId === p.planNumber))
}

/** Imports validated rows from the data migration wizard into the register. */
export async function importNonconformityRows(
  rows: Array<{ values: Record<string, unknown>; update: boolean }>,
  fileName: string,
): Promise<{ created: number; updated: number }> {
  const plans = await provableOwnPlans()
  const list = listStoredNonconformities()
  const now = new Date().toISOString()
  let created = 0
  let updated = 0
  for (const row of rows) {
    const ref = typeof row.values.reference === 'string' ? row.values.reference.trim().toLowerCase() : ''
    const existing = ref ? list.findIndex((nc) => nc.importRef.toLowerCase() === ref) : -1
    if (existing >= 0) {
      if (row.update) {
        list[existing] = updateFromImport(list[existing], row.values)
        updated += 1
      }
      continue
    }
    list.push(buildFromImport({ values: row.values, plans, cabId: owner(), existingCodes: list.map((n) => n.ncId), fileName, now, by: currentActor() }))
    created += 1
  }
  writeOwn(list)
  return { created, updated }
}

/** Natural keys (previous-system references) of imported records, so a second import finds its duplicates. */
export function importedReferences(): string[] {
  return listStoredNonconformities().map((nc) => nc.importRef.trim().toLowerCase()).filter(Boolean)
}
