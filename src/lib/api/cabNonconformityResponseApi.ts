/**
 * CAB Nonconformity response — the corrective-action response workspace opened
 * from the register's "Open response" action.
 *
 * Vocabulary is deliberately shared with `cabNonconformitiesApi`: a response is
 * the editable face of a `NonconformityItem`, so classification/status unions
 * are imported rather than redeclared. Only the response-side concepts
 * (effectiveness review, evidence versions, reviewer outcome) live here.
 */

import {
  currentActor,
  setNonconformityEvidence,
  syncNonconformitiesFromFindings,
  toItem,
  updateNonconformity,
  type NonconformityItem,
  type NonconformityPatch,
  type NonconformityStatus,
} from '@/lib/api/cabNonconformitiesApi'
import { toView, todayIso, type NcEventCode, type StoredEvidence, type StoredNonconformity } from '@/lib/api/nonconformityRegister'
import { cabAuditReportingPath } from '@/lib/routes'

export type EffectivenessResult = 'not_reviewed' | 'effective' | 'partially_effective' | 'not_effective'

export type ResponseTab = 'corrective_action' | 'activity' | 'related' | 'attachments'

export const RESPONSE_TABS: ResponseTab[] = [
  'corrective_action',
  'activity',
  'related',
  'attachments',
]

export const EFFECTIVENESS_RESULTS: EffectivenessResult[] = [
  'not_reviewed',
  'effective',
  'partially_effective',
  'not_effective',
]

/** Free-text limit shared by every response textarea and the reviewer comment. */
export const RESPONSE_TEXT_LIMIT = 1000

export const EVIDENCE_ACCEPT = '.pdf,.docx,.jpg,.jpeg,.png'
export const EVIDENCE_MAX_BYTES = 10 * 1024 * 1024

export interface EvidenceFile {
  id: string
  name: string
  version: number
  uploadedAt: string
  sizeLabel: string
  url?: string | null
}

export interface RelatedRecord {
  id: string
  label: string
  reference: string
  href?: string
}

export interface ResponseActivityEntry {
  id: string
  text: string
  by: string
  at: string
  code?: string
  ref?: string
}

export interface NonconformityResponse {
  /** Register row this response belongs to — drives the header + status rail. */
  nonconformity: NonconformityItem
  applicationId: string
  originalFinding: string
  findingRaisedDate: string
  targetClosureDate: string
  daysOpen: number
  correction: string
  rootCause: string
  correctiveAction: string
  evidence: EvidenceFile[]
  responsiblePerson: string
  targetDate: string
  effectivenessReviewDate: string
  effectivenessResult: EffectivenessResult
  reviewerComments: string
  lastSavedAt: string | null
  lastSavedBy: string | null
  responsibleOptions: string[]
  related: RelatedRecord[]
  activity: ResponseActivityEntry[]
}

export interface ResponseDraftInput {
  correction: string
  rootCause: string
  correctiveAction: string
  responsiblePerson: string
  targetDate: string
  effectivenessReviewDate: string
  effectivenessResult: EffectivenessResult
  reviewerComments: string
}

export interface ResponseMutationResult {
  savedAt: string
  savedBy: string
  status: NonconformityStatus
}

const RESPONSIBLE_OPTIONS = ['Sara Ali', 'Omar Hassan', 'Layla Ibrahim', 'Khalid Al-Rashid']

function daysBetween(fromIso: string, to = new Date()): number {
  const from = new Date(`${fromIso}T00:00:00`)
  if (Number.isNaN(from.getTime())) return 0
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86_400_000))
}

function buildResponse(nc: StoredNonconformity, nonconformity: NonconformityItem): NonconformityResponse {
  const options = Array.from(new Set([nc.responsiblePerson, nc.ownerName, ...RESPONSIBLE_OPTIONS].filter(Boolean)))
  const last = nc.events.filter((e) => e.code === 'saved' || e.code === 'submitted').at(-1)
  return {
    nonconformity,
    applicationId: nc.planNumber,
    originalFinding: nc.statement,
    findingRaisedDate: nonconformity.raisedDate,
    targetClosureDate: nonconformity.dueDate,
    daysOpen: daysBetween(nc.raisedDate),
    correction: nc.correction,
    rootCause: nc.rootCause,
    correctiveAction: nc.correctiveAction,
    evidence: (nc.evidence ?? []).map((e) => ({ id: e.id, name: e.name, version: e.version, uploadedAt: e.uploadedAt, sizeLabel: e.sizeLabel, url: e.dataUrl })),
    responsiblePerson: nc.responsiblePerson || nc.ownerName,
    targetDate: nc.targetDate || nc.dueDate,
    effectivenessReviewDate: nc.effectivenessReviewDate,
    effectivenessResult: nc.effectivenessResult,
    reviewerComments: nc.reviewerComments,
    lastSavedAt: last ? new Date(last.at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : null,
    lastSavedBy: last?.by ?? null,
    responsibleOptions: options,
    related: [
      { id: 'rel-1', label: 'Audit finding', reference: nonconformity.findingId },
      { id: 'rel-2', label: 'Audit report', reference: nc.planNumber, href: nc.planId ? cabAuditReportingPath(nc.planNumber || nc.planId) : undefined },
    ].filter((r) => r.reference),
    activity: nonconformity.history.map((entry) => ({ id: entry.id, text: entry.text, by: entry.by, at: entry.at, code: entry.code, ref: entry.ref })),
  }
}

function stamp(nc: StoredNonconformity): ResponseMutationResult {
  const last = nc.events.at(-1)
  const at = last ? new Date(last.at) : new Date()
  return {
    savedAt: at.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }),
    savedBy: last?.by ?? currentActor(),
    status: toView(nc, todayIso()).displayStatus,
  }
}

export async function getNonconformityResponse(ncId: string): Promise<NonconformityResponse | null> {
  const stored = (await syncNonconformitiesFromFindings()).find((item) => item.id === ncId || item.ncId === ncId)
  return stored ? buildResponse(stored, toItem(stored)) : null
}

function patchOf(draft: ResponseDraftInput): NonconformityPatch {
  return {
    correction: draft.correction,
    rootCause: draft.rootCause,
    correctiveAction: draft.correctiveAction,
    responsiblePerson: draft.responsiblePerson,
    targetDate: draft.targetDate,
    effectivenessReviewDate: draft.effectivenessReviewDate,
    effectivenessResult: draft.effectivenessResult,
    reviewerComments: draft.reviewerComments,
  }
}

async function save(ncId: string, patch: NonconformityPatch, code: NcEventCode): Promise<ResponseMutationResult> {
  const saved = await updateNonconformity(ncId, patch, { code })
  if (!saved) throw new Error(`Nonconformity ${ncId} was not found`)
  return stamp(saved)
}

/** The mutations keep the response in this browser until the backend exists; the signatures are the contract. */
export async function saveResponseDraft(ncId: string, draft: ResponseDraftInput): Promise<ResponseMutationResult> {
  if (!ncId) throw new Error('saveResponseDraft: ncId is required')
  return save(ncId, { ...patchOf(draft), status: draft.correction.trim() ? 'in_progress' : 'open' }, 'saved')
}

export async function submitResponse(ncId: string, draft: ResponseDraftInput): Promise<ResponseMutationResult> {
  if (!ncId) throw new Error('submitResponse: ncId is required')
  if (!draft.correctiveAction.trim()) {
    throw new Error('submitResponse: corrective action is required')
  }
  return save(ncId, { ...patchOf(draft), status: 'submitted', revisionRequested: false }, 'submitted')
}

export async function requestRevision(ncId: string, comments: string): Promise<ResponseMutationResult> {
  if (!ncId) throw new Error('requestRevision: ncId is required')
  return save(ncId, { status: 'in_progress', revisionRequested: true, reviewerComments: comments }, 'revision')
}

export async function closeAfterVerification(
  ncId: string,
  comments: string,
  effectivenessResult?: EffectivenessResult,
): Promise<ResponseMutationResult> {
  if (!ncId) throw new Error('closeAfterVerification: ncId is required')
  return save(
    ncId,
    { status: 'closed', revisionRequested: false, reviewerComments: comments, ...(effectivenessResult ? { effectivenessResult } : {}) },
    'closed',
  )
}

const toStored = (e: EvidenceFile): StoredEvidence => ({
  id: e.id, name: e.name, version: e.version, uploadedAt: e.uploadedAt, sizeLabel: e.sizeLabel, dataUrl: e.url ?? '',
})

/** Keeps the evidence list with the nonconformity so it survives a reload. */
export async function saveResponseEvidence(ncId: string, evidence: EvidenceFile[]): Promise<void> {
  const saved = await setNonconformityEvidence(ncId, evidence.map(toStored))
  if (!saved) throw new Error(`Nonconformity ${ncId} was not found`)
}

/** Response is only submittable once every mandatory narrative + evidence exists. */
export function isResponseComplete(
  draft: ResponseDraftInput,
  evidence: EvidenceFile[],
): boolean {
  return Boolean(
    draft.correction.trim() &&
      draft.rootCause.trim() &&
      draft.correctiveAction.trim() &&
      draft.responsiblePerson &&
      draft.targetDate &&
      evidence.length > 0,
  )
}