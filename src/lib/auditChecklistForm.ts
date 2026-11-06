import type {
  AuditChecklist,
  AuditChecklistDraft,
  ChecklistFilters,
  ChecklistItem,
  ChecklistItemGroup,
  LibraryChecklistFile,
} from '@/lib/auditChecklistTypes'

/**
 * Pure helpers behind the audit checklists page: mapping the library files,
 * copying, filtering, grouping and validating. Kept free of React and of
 * value imports so it can be unit-tested on its own.
 */

export const CHECKLIST_NAME_MAX_LENGTH = 120
export const CHECKLIST_STANDARD_CODE_MAX_LENGTH = 40
export const CHECKLIST_DESCRIPTION_MAX_LENGTH = 500
export const CHECKLIST_ITEM_TITLE_MAX_LENGTH = 200
export const CHECKLIST_CLAUSE_MAX_LENGTH = 40
export const CHECKLIST_ITEM_CODE_MAX_LENGTH = 40
export const CHECKLIST_ITEM_TEXT_MAX_LENGTH = 2000

/** Above this many items the detail panel shows a search box and clause group headers. */
export const CHECKLIST_LARGE_ITEM_COUNT = 12

let localIdCounter = 0

/** Local id for rows that have no server id yet. */
export function createLocalId(prefix: string): string {
  localIdCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${localIdCounter}`
}

/** Standard codes are upper-case ASCII with digits, `_` and `-` (e.g. `ISO_9001`, `HALAL`). */
export function normalizeStandardCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9_-]/g, '_')
}

/** Picks the Arabic text for the Arabic UI and falls back to English when it is empty. */
export function pickLocalized(isArabic: boolean, en: string, ar: string): string {
  return isArabic && ar.trim() ? ar : en
}

/** Textarea text -> list: one entry per non-empty line. */
export function linesToList(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function listToLines(list: string[]): string {
  return list.join('\n')
}

/** Maps a library file (bilingual objects) to the flat shape the page works with. */
export function libraryFileToChecklist(file: LibraryChecklistFile): AuditChecklist {
  return {
    id: file.key,
    source: 'library',
    kind: file.kind,
    status: 'ACTIVE',
    isDefault: false,
    reviewStatus: file.status,
    reviewNote: file.reviewNote,
    standardCode: file.standardCode,
    standardLabel: file.standard,
    name: file.name.en,
    nameAr: file.name.ar,
    description: '',
    version: file.version,
    items: file.items.map((item) => ({
      id: `${file.key}:${item.code}`,
      code: item.code,
      clause: item.clause,
      title: item.title.en,
      titleAr: item.title.ar,
      requirement: item.requirement.en,
      requirementAr: item.requirement.ar,
      guidance: item.guidance.en,
      guidanceAr: item.guidance.ar,
      evidencePrompts: [...item.evidence.en],
      evidencePromptsAr: [...item.evidence.ar],
      samplingHint: item.sampling?.en ?? '',
      samplingHintAr: item.sampling?.ar ?? '',
      stages: [...item.stages],
      mandatory: item.mandatory,
      common: item.common,
    })),
  }
}

export function createBlankItem(): ChecklistItem {
  return {
    id: createLocalId('item'),
    code: '',
    clause: '',
    title: '',
    titleAr: '',
    requirement: '',
    requirementAr: '',
    guidance: '',
    guidanceAr: '',
    evidencePrompts: [],
    evidencePromptsAr: [],
    samplingHint: '',
    samplingHintAr: '',
    stages: [],
    mandatory: true,
    common: false,
  }
}

export function createCustomChecklist(input: {
  name: string
  standardCode: string
  standardLabel?: string
}): AuditChecklist {
  return {
    id: createLocalId('checklist'),
    source: 'cab',
    kind: 'CUSTOM',
    status: 'ACTIVE',
    isDefault: false,
    reviewStatus: null,
    reviewNote: null,
    standardCode: normalizeStandardCode(input.standardCode.trim()),
    standardLabel: input.standardLabel?.trim() ?? '',
    name: input.name.trim(),
    nameAr: '',
    description: '',
    version: '1',
    items: [],
  }
}

/** An editable copy (library or CAB checklist) with fresh ids; never the default. */
export function copyChecklist(source: AuditChecklist, suffix: { en: string; ar: string }): AuditChecklist {
  const id = createLocalId('checklist')
  return {
    ...source,
    id,
    source: 'cab',
    status: 'ACTIVE',
    isDefault: false,
    reviewStatus: null,
    reviewNote: null,
    version: '1',
    name: `${source.name} ${suffix.en}`.trim(),
    nameAr: source.nameAr ? `${source.nameAr} ${suffix.ar}`.trim() : '',
    items: source.items.map((item, index) => ({
      ...item,
      id: `${id}:${index + 1}`,
      stages: [...item.stages],
      evidencePrompts: [...item.evidencePrompts],
      evidencePromptsAr: [...item.evidencePromptsAr],
    })),
  }
}

/** Active default first, then by name. */
export function sortChecklists(list: AuditChecklist[]): AuditChecklist[] {
  return [...list].sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

export function filterChecklists(list: AuditChecklist[], filters: ChecklistFilters): AuditChecklist[] {
  const query = filters.search.trim().toLowerCase()
  return list.filter((checklist) => {
    if (!filters.includeArchived && checklist.status === 'ARCHIVED') return false
    if (!query) return true
    return `${checklist.name} ${checklist.nameAr} ${checklist.standardCode} ${checklist.standardLabel}`
      .toLowerCase()
      .includes(query)
  })
}

/** Marks one active checklist as the default for its standard and clears the others. */
export function setDefaultChecklist(list: AuditChecklist[], id: string): AuditChecklist[] {
  const target = list.find((checklist) => checklist.id === id)
  if (!target || target.status !== 'ACTIVE') return list
  return list.map((checklist) => {
    if (checklist.id === id) return { ...checklist, isDefault: true }
    if (checklist.standardCode === target.standardCode && checklist.isDefault) return { ...checklist, isDefault: false }
    return checklist
  })
}

/** Archiving also drops the default flag, so an archived checklist is never the default. */
export function toggleArchived(list: AuditChecklist[], id: string): AuditChecklist[] {
  return list.map((checklist) => {
    if (checklist.id !== id) return checklist
    return checklist.status === 'ACTIVE'
      ? { ...checklist, status: 'ARCHIVED', isDefault: false }
      : { ...checklist, status: 'ACTIVE' }
  })
}

export function removeChecklist(list: AuditChecklist[], id: string): AuditChecklist[] {
  return list.filter((checklist) => checklist.id !== id)
}

export function replaceChecklist(list: AuditChecklist[], updated: AuditChecklist): AuditChecklist[] {
  return list.map((checklist) => (checklist.id === updated.id ? updated : checklist))
}

export function checklistToDraft(checklist: AuditChecklist): AuditChecklistDraft {
  return {
    name: checklist.name,
    nameAr: checklist.nameAr,
    standardCode: checklist.standardCode,
    standardLabel: checklist.standardLabel,
    description: checklist.description,
    items: checklist.items,
  }
}

/** Applies a saved draft to its checklist (trims the text fields). */
export function applyDraft(checklist: AuditChecklist, draft: AuditChecklistDraft): AuditChecklist {
  return {
    ...checklist,
    name: draft.name.trim(),
    nameAr: draft.nameAr.trim(),
    standardCode: normalizeStandardCode(draft.standardCode.trim()),
    standardLabel: draft.standardLabel.trim(),
    description: draft.description.trim(),
    items: draft.items.map((item) => ({
      ...item,
      code: item.code.trim(),
      clause: item.clause.trim(),
      title: item.title.trim(),
      titleAr: item.titleAr.trim(),
      requirement: item.requirement.trim(),
      requirementAr: item.requirementAr.trim(),
      guidance: item.guidance.trim(),
      guidanceAr: item.guidanceAr.trim(),
      samplingHint: item.samplingHint.trim(),
      samplingHintAr: item.samplingHintAr.trim(),
    })),
  }
}

/** Stable string used to tell whether a draft differs from the saved checklist. */
export function serializeDraft(draft: AuditChecklistDraft): string {
  return JSON.stringify(draft)
}

/** "4.1" -> "4", "A.5.12" -> "A.5": the heading a requirement is listed under. */
export function clauseGroup(clause: string): string {
  const value = clause.trim()
  if (!value) return '·'
  if (/^A\./i.test(value)) return value.split('.').slice(0, 2).join('.')
  return value.split('.')[0].trim() || '·'
}

export function isAnnexGroup(group: string): boolean {
  return /^A\./i.test(group)
}

/** Groups consecutive items that share a clause heading, keeping the original order. */
export function groupItemsByClause(items: ChecklistItem[]): ChecklistItemGroup[] {
  const groups: ChecklistItemGroup[] = []
  for (const item of items) {
    const group = clauseGroup(item.clause)
    const last = groups[groups.length - 1]
    if (last && last.group === group) last.items.push(item)
    else groups.push({ group, items: [item] })
  }
  return groups
}

export function filterItems(items: ChecklistItem[], query: string): ChecklistItem[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return items
  return items.filter((item) =>
    `${item.clause} ${item.title} ${item.titleAr} ${item.requirement} ${item.requirementAr}`
      .toLowerCase()
      .includes(needle)
  )
}

/** Moves an item up (-1) or down (+1); out-of-range moves return the list unchanged. */
export function moveItem(items: ChecklistItem[], index: number, delta: -1 | 1): ChecklistItem[] {
  const target = index + delta
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return items
  const next = [...items]
  const [moved] = next.splice(index, 1)
  next.splice(target, 0, moved)
  return next
}

export function updateItem(items: ChecklistItem[], id: string, patch: Partial<ChecklistItem>): ChecklistItem[] {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item))
}

export function removeItem(items: ChecklistItem[], id: string): ChecklistItem[] {
  return items.filter((item) => item.id !== id)
}

export type ChecklistItemField = 'clause' | 'title' | 'requirement'

export function itemErrorKey(id: string, field: ChecklistItemField): string {
  return `items.${id}.${field}`
}

/** DOM id of an item's field, used to focus the first invalid field. */
export function itemFieldId(id: string, field: string): string {
  return `checklist-item-${id}-${field}`
}

/** Validation error codes keyed by field (`name`, `standardCode`, `items.<id>.<field>`); empty when valid. */
export function validateDraft(draft: AuditChecklistDraft): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!draft.name.trim()) errors.name = 'nameRequired'
  if (!draft.standardCode.trim()) errors.standardCode = 'standardCodeRequired'
  for (const item of draft.items) {
    if (!item.clause.trim()) errors[itemErrorKey(item.id, 'clause')] = 'clauseRequired'
    if (!item.title.trim()) errors[itemErrorKey(item.id, 'title')] = 'titleRequired'
    if (!item.requirement.trim()) errors[itemErrorKey(item.id, 'requirement')] = 'requirementRequired'
  }
  return errors
}

/** The id of the item the first item error belongs to, or null when the errors are not about items. */
export function firstInvalidItemId(errors: Record<string, string>): string | null {
  const key = Object.keys(errors).find((candidate) => candidate.startsWith('items.'))
  return key ? key.split('.')[1] : null
}

/** DOM id to focus for an error key. */
export function fieldIdForError(key: string): string {
  if (key.startsWith('items.')) {
    const [, id, field] = key.split('.')
    return itemFieldId(id, field)
  }
  return `checklist-${key}`
}
