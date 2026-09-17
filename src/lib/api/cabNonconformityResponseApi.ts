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
  getNonconformities,
  type NonconformityItem,
  type NonconformityStatus,
} from '@/lib/api/cabNonconformitiesApi'

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

const CURRENT_USER = 'Sara Ali'

function buildResponse(nonconformity: NonconformityItem): NonconformityResponse {
  return {
    nonconformity,
    applicationId: `APP-${nonconformity.ncId.split('-')[1] ?? '0000'}`,
    originalFinding:
      'Food safety management system does not ensure adequate control of allergen risks. Allergen identification and segregation area were not consistently implemented, and records of cleaning verification were incomplete.',
    findingRaisedDate: nonconformity.raisedDate,
    targetClosureDate: '30 Jul 2024',
    daysOpen: 45,
    correction:
      'Segregated allergen-containing raw materials and updated line labeling. Conducted immediate cleaning of affected production area.',
    rootCause:
      'Insufficient training and unclear procedures for allergen control, leading to inconsistent implementation by production staff.',
    correctiveAction:
      'Revise allergen control procedure, deliver targeted training to production and cleaning staff, and implement a verification checklist to ensure consistent application.',
    evidence: [
      {
        id: 'ev-1',
        name: 'Allergen_Control_Procedure_v2.pdf',
        version: 2,
        uploadedAt: '28 Mar 2024',
        sizeLabel: '520 KB',
      },
      {
        id: 'ev-2',
        name: 'Training_Attendance.xlsx',
        version: 1,
        uploadedAt: '25 Mar 2024',
        sizeLabel: '210 KB',
      },
      {
        id: 'ev-3',
        name: 'Production_Area_Cleaning.jpg',
        version: 1,
        uploadedAt: '25 Mar 2024',
        sizeLabel: '1.3 MB',
      },
    ],
    responsiblePerson: CURRENT_USER,
    targetDate: '2024-04-30',
    effectivenessReviewDate: '2024-07-30',
    effectivenessResult: 'not_reviewed',
    reviewerComments: '',
    lastSavedAt: '28 Mar 2024, 14:32',
    lastSavedBy: CURRENT_USER,
    responsibleOptions: RESPONSIBLE_OPTIONS,
    related: [
      { id: 'rel-1', label: 'Audit finding', reference: nonconformity.findingId },
      { id: 'rel-2', label: 'Audit report', reference: nonconformity.auditId },
      { id: 'rel-3', label: 'Application', reference: `APP-${nonconformity.ncId.split('-')[1] ?? '0000'}` },
    ],
    activity: nonconformity.history.map((entry) => ({
      id: entry.id,
      text: entry.text,
      by: entry.by,
      at: entry.at,
    })),
  }
}

function timestamp(): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(new Date())
    .replace(',', ',')
}

export async function getNonconformityResponse(ncId: string): Promise<NonconformityResponse | null> {
  const register = await getNonconformities()
  const match = register.find((item) => item.id === ncId || item.ncId === ncId)
  return match ? buildResponse(match) : null
}

/**
 * The four mutations below are mock transports: they validate their arguments
 * and echo back the resulting audit stamp. Swap the body for a real request
 * when the endpoint lands — the signatures are already the contract.
 */
function stamp(status: NonconformityStatus): ResponseMutationResult {
  return { savedAt: timestamp(), savedBy: CURRENT_USER, status }
}

export async function saveResponseDraft(
  ncId: string,
  draft: ResponseDraftInput,
): Promise<ResponseMutationResult> {
  if (!ncId) throw new Error('saveResponseDraft: ncId is required')
  return stamp(draft.correction.trim() ? 'in_progress' : 'open')
}

export async function submitResponse(
  ncId: string,
  draft: ResponseDraftInput,
): Promise<ResponseMutationResult> {
  if (!ncId) throw new Error('submitResponse: ncId is required')
  if (!draft.correctiveAction.trim()) {
    throw new Error('submitResponse: corrective action is required')
  }
  return stamp('submitted')
}

export async function requestRevision(
  ncId: string,
  comments: string,
): Promise<ResponseMutationResult> {
  if (!ncId) throw new Error('requestRevision: ncId is required')
  void comments
  return stamp('in_progress')
}

export async function closeAfterVerification(
  ncId: string,
  comments: string,
): Promise<ResponseMutationResult> {
  if (!ncId) throw new Error('closeAfterVerification: ncId is required')
  void comments
  return stamp('closed')
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