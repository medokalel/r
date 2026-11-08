/**
 * Types for the CAB data migration: importing existing records (clients,
 * people, certificates, audits, ...) from Excel or CSV files into the platform.
 * The page currently runs on `lib/api/dataMigrationMockData.ts`; there is no
 * backend endpoint yet.
 */

/** The areas a CAB can migrate, in the order the hub suggests importing them. */
export const IMPORT_ENTITY_KEYS = [
  'accreditation_scope',
  'personnel',
  'trainings',
  'clients',
  'client_sites',
  'contacts',
  'certificates',
  'certification_cycles',
  'audit_plans',
  'nonconformities',
  'invoices',
  'fee_items',
  'checklists',
] as const

export type ImportEntityKey = (typeof IMPORT_ENTITY_KEYS)[number]

export type ImportColumnType =
  | 'text'
  | 'longtext'
  | 'email'
  | 'phone'
  | 'date'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'country'
  | 'enum'
  | 'list'

/** Where the allowed values of a column come from (shown on the template's Lists sheet). */
export type ImportListSource = 'standards' | 'roles' | 'iafCodes' | 'personnel' | 'clients' | 'currencies'

export interface ImportListOption {
  value: string
  labelEn: string
  labelAr: string
}

export type ImportLists = Partial<Record<ImportListSource | 'countries', ImportListOption[]>>

export interface ImportColumn {
  key: string
  labelEn: string
  labelAr: string
  type: ImportColumnType
  /** Value shown on the example row of the template. */
  example: string
  /** Rows without it are not imported. */
  required?: boolean
  /** Rows without it are imported and listed as "records to complete". */
  later?: boolean
  listSource?: ImportListSource
  /** Fixed allowed values (takes priority over `listSource`). */
  allowed?: ImportListOption[]
  /** A list column that accepts any values, not only the ones in `listSource`. */
  freeList?: boolean
  /** Numbers are not negative unless the column says so (e.g. longitude). */
  allowNegative?: boolean
  max?: number
  hintEn?: string
  hintAr?: string
}

export interface ImportEntityDefinition {
  key: ImportEntityKey
  labelEn: string
  labelAr: string
  descriptionEn: string
  descriptionAr: string
  /** The register the imported records end up in. */
  route: string
  /** Columns that identify a record; used to find duplicates. */
  naturalKey: string[]
  /** Columns used to name a record in lists. */
  labelColumns: string[]
  /** Several rows with the same key are lines of one record (e.g. invoice lines). */
  repeatedKeyIsLine?: boolean
  columns: ImportColumn[]
}

export type ImportValue = string | number | boolean | string[]

export type ImportIssueCode =
  | 'REQUIRED'
  | 'TOO_LONG'
  | 'INVALID_EMAIL'
  | 'INVALID_PHONE'
  | 'INVALID_DATE'
  | 'INVALID_NUMBER'
  | 'NEGATIVE_NUMBER'
  | 'INVALID_VALUE'
  | 'INVALID_COUNTRY'
  | 'INVALID_BOOLEAN'
  | 'INVALID_DATE_RANGE'
  | 'UNKNOWN_ITEM'
  | 'CLIENT_NOT_FOUND'
  | 'PERSON_NOT_FOUND'
  | 'PERSON_NOT_IN_REGISTER'
  | 'CERTIFICATE_NOT_FOUND'
  | 'DUPLICATE_IN_FILE'
  | 'DUPLICATE_EXISTING'

export interface ImportIssue {
  field: string
  code: ImportIssueCode
}

/** `ready` imports as is, `partial` misses "needed later" values, `invalid` is skipped, `duplicate` already exists. */
export type ImportRowStatus = 'ready' | 'partial' | 'invalid' | 'duplicate'

export interface ImportRawRow {
  /** The row number in the file (1-based), so errors point at the right line. */
  rowNumber: number
  raw: Record<string, unknown>
}

export interface ImportRowResult {
  rowNumber: number
  /** The cells as written in the file, by column key. */
  raw: Record<string, string>
  status: ImportRowStatus
  /** 0-100: how much of the required and needed-later data the row has. */
  completeness: number
  values: Record<string, ImportValue>
  /** Required or needed-later columns that are empty. */
  missing: string[]
  errors: ImportIssue[]
  warnings: ImportIssue[]
  matchedExistingId: string | null
}

export interface ImportTotals {
  rows: number
  ready: number
  partial: number
  invalid: number
  duplicates: number
}

export interface ImportPreview {
  importId: string
  entity: ImportEntityKey
  fileName: string
  createdAt: string
  totals: ImportTotals
  completeness: number
  columnsRecognised: string[]
  columnsMissing: string[]
  rows: ImportRowResult[]
}

/** `ready_only` skips rows that miss "needed later" values; `include_partial` imports them too. */
export type ImportMode = 'ready_only' | 'include_partial'
export type DuplicateMode = 'skip' | 'update'

export interface ImportCommitOptions {
  mode: ImportMode
  duplicates: DuplicateMode
}

export interface ImportCommitResult {
  importId: string
  entity: ImportEntityKey
  created: number
  updated: number
  skipped: number
  invalid: number
  mode: ImportMode
  duplicates: DuplicateMode
  /** How many created records still miss "needed later" values. */
  incomplete: number
}

/** One import that was carried out (a preview that was never imported is not a batch). */
export interface ImportBatch {
  id: string
  entity: ImportEntityKey
  fileName: string
  createdAt: string
  createdBy: string
  totals: ImportTotals
  completeness: number
  result: ImportCommitResult
}

/** A record that was imported without some "needed later" values. */
export interface IncompleteRecord {
  id: string
  entity: ImportEntityKey
  importId: string
  /** What the record is called in lists (e.g. the client name). */
  label: string
  completeness: number
  missing: string[]
  createdAt: string
  resolvedAt: string | null
}

export type EntityMigrationState = 'not_started' | 'in_progress' | 'completed'

export interface EntityMigrationStatus {
  entity: ImportEntityKey
  imported: number
  updated: number
  incomplete: number
  state: EntityMigrationState
  /** 0-100: share of imported records that are complete. */
  progress: number
  lastImport: ImportBatch | null
}

export interface MigrationOverview {
  entities: EntityMigrationStatus[]
  overall: {
    entities: number
    started: number
    completed: number
    imported: number
    incomplete: number
    progress: number
  }
}

export type ImportErrorCode =
  | 'FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'FILE_UNREADABLE'
  | 'XLS_NOT_SUPPORTED'
  | 'NO_COLUMNS'
  | 'WRONG_TEMPLATE'
  | 'NO_ROWS'
  | 'TOO_MANY_ROWS'
  | 'IMPORT_NOT_FOUND'
  | 'ALREADY_COMMITTED'

/** The first sheet of a file as plain cells; both CSV and XLSX are read into this. */
export interface ImportTable {
  rows: unknown[][]
}

export interface ParsedImportFile {
  rows: ImportRawRow[]
  /** Keys of the columns found in the file. */
  recognised: string[]
}

/** Lookups against records that already exist (used to find duplicates and unknown references). */
export interface ImportContext {
  lists: ImportLists
  /** Natural key of an existing record (see `naturalKeyOf`) to its id. */
  existing: Map<string, string>
  /** Normalised client name or code to the client id. */
  clients: Map<string, string>
  /** Normalised person email or name to the person id. */
  personnel: Map<string, string>
  /** Normalised certificate number to the certificate id. */
  certificates: Map<string, string>
}