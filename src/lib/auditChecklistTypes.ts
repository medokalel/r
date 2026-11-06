/**
 * Types for the CAB audit checklists: a read-only library of ready checklists
 * and the CAB's own editable copies. The page currently runs on
 * `lib/api/auditChecklistMockData.ts`; there is no backend endpoint yet.
 */
export type ChecklistKind = 'STANDARD' | 'IMS' | 'STAGE1_READINESS' | 'CUSTOM'
export type ChecklistStatus = 'ACTIVE' | 'ARCHIVED'
export type ChecklistSource = 'library' | 'cab'
export type ChecklistReviewStatus = 'draft' | 'approved'

export type AuditStage = 'stage1' | 'stage2' | 'surveillance' | 'recertification' | 'special'

export const AUDIT_STAGES: readonly AuditStage[] = ['stage1', 'stage2', 'surveillance', 'recertification', 'special']

export interface Localized {
  en: string
  ar: string
}

export interface LocalizedList {
  en: string[]
  ar: string[]
}

/** One requirement as it ships in the library files (English and Arabic side by side). */
export interface LibraryChecklistItemFile {
  code: string
  clause: string
  title: Localized
  requirement: Localized
  guidance: Localized
  evidence: LocalizedList
  sampling: Localized | null
  stages: AuditStage[]
  mandatory: boolean
  common: boolean
}

/** A library checklist file (`lib/api/auditChecklistLibrary/*.json`). */
export interface LibraryChecklistFile {
  key: string
  standardCode: string
  kind: ChecklistKind
  standard: string
  name: Localized
  version: string
  status: ChecklistReviewStatus
  reviewNote: Localized
  items: LibraryChecklistItemFile[]
}

/** One requirement in the shape the page edits: English and Arabic as separate fields. */
export interface ChecklistItem {
  id: string
  code: string
  clause: string
  title: string
  titleAr: string
  requirement: string
  requirementAr: string
  guidance: string
  guidanceAr: string
  evidencePrompts: string[]
  evidencePromptsAr: string[]
  samplingHint: string
  samplingHintAr: string
  stages: AuditStage[]
  mandatory: boolean
  common: boolean
}

export interface AuditChecklist {
  id: string
  source: ChecklistSource
  kind: ChecklistKind
  status: ChecklistStatus
  /** At most one active default per `standardCode`. */
  isDefault: boolean
  /** Only library checklists are reviewed; the CAB's own copies have none. */
  reviewStatus: ChecklistReviewStatus | null
  reviewNote: Localized | null
  standardCode: string
  standardLabel: string
  name: string
  nameAr: string
  description: string
  version: string
  items: ChecklistItem[]
}

/** The part of a checklist the detail panel edits. */
export interface AuditChecklistDraft {
  name: string
  nameAr: string
  standardCode: string
  standardLabel: string
  description: string
  items: ChecklistItem[]
}

export interface ChecklistFilters {
  search: string
  includeArchived: boolean
}

export interface ChecklistItemGroup {
  group: string
  items: ChecklistItem[]
}
