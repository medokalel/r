/**
 * Small pure helpers of the import wizard: the steps, how many records a
 * choice imports, how a row is named in the review table, and which message a
 * failed upload shows.
 */
import { naturalKeyOf, recordLabel, selectRowsToImport } from '@/lib/dataMigrationForm'
import type {
  ImportEntityDefinition,
  ImportMode,
  ImportRowResult,
} from '@/lib/dataMigrationTypes'

export const WIZARD_STEPS = ['template', 'upload', 'review', 'import', 'result'] as const

export type WizardStep = (typeof WIZARD_STEPS)[number]

/** Rows of one record (e.g. invoice lines) count once. */
export function countRecordsToImport(
  entity: ImportEntityDefinition,
  rows: ImportRowResult[],
  mode: ImportMode,
  updateDuplicates: boolean,
): number {
  const selected = selectRowsToImport(rows, mode, updateDuplicates)
  if (!entity.repeatedKeyIsLine) return selected.length
  return new Set(selected.map((row) => naturalKeyOf(entity, row.values) || `row-${row.rowNumber}`)).size
}

/** What a row is called in the review table: its label columns, else its first filled cell. */
export function reviewRowLabel(entity: ImportEntityDefinition, row: ImportRowResult): string {
  return recordLabel(entity, row.values) || Object.values(row.raw)[0] || '—'
}

const UPLOAD_ERROR_CODES = [
  'FILE_TOO_LARGE',
  'FILE_TYPE',
  'FILE_UNREADABLE',
  'NO_COLUMNS',
  'NO_ROWS',
  'TOO_MANY_ROWS',
  'WRONG_TEMPLATE',
  'XLS_NOT_SUPPORTED',
] as const

/** The translation key suffix for a failed upload; anything unexpected is `generic`. */
export function uploadErrorCode(error: unknown): (typeof UPLOAD_ERROR_CODES)[number] | 'generic' {
  const code = (error as { code?: unknown } | null)?.code
  return UPLOAD_ERROR_CODES.find((known) => known === code) ?? 'generic'
}

const COMMIT_ERROR_CODES = ['ALREADY_COMMITTED', 'IMPORT_NOT_FOUND'] as const

/** The translation key suffix for a failed import; anything unexpected is `generic`. */
export function commitErrorCode(error: unknown): (typeof COMMIT_ERROR_CODES)[number] | 'generic' {
  const code = (error as { code?: unknown } | null)?.code
  return COMMIT_ERROR_CODES.find((known) => known === code) ?? 'generic'
}