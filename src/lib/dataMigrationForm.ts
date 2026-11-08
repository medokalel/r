/**
 * Pure logic of the data migration: matching a file's columns to an area,
 * validating every cell and row, deciding what gets imported, building the
 * template and the issues report, and summarising progress for the hub.
 *
 * No React, no i18n and no storage here: text that the user reads comes in
 * through a `translate` function, and the records that already exist come in
 * through an `ImportContext`.
 */
import type {
  EntityMigrationStatus,
  ImportBatch,
  ImportColumn,
  ImportContext,
  ImportEntityDefinition,
  ImportEntityKey,
  ImportIssue,
  ImportIssueCode,
  ImportLists,
  ImportListOption,
  ImportMode,
  ImportRawRow,
  ImportRowResult,
  ImportRowStatus,
  ImportTable,
  ImportTotals,
  ImportValue,
  IncompleteRecord,
  MigrationOverview,
  ParsedImportFile,
} from '@/lib/dataMigrationTypes'
import { IMPORT_ENTITY_KEYS } from '@/lib/dataMigrationTypes'
import { toEnglishDigits } from '@/lib/englishDigits'
import { ImportFileError, MAX_IMPORT_ROWS } from '@/lib/importFileReader'
import { EMAIL_PATTERN } from '@/lib/validators'

export type Translate = (key: string, options?: Record<string, string | number>) => string

export type ImportLanguage = 'en' | 'ar'

// ---------------------------------------------------------------- small helpers

export function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** A cell as trimmed text, without invisible direction marks. */
function cellText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10)
  return String(value).replace(/[\u200B-\u200F\u061C\uFEFF]/g, '').trim()
}

function isEmptyValue(value: ImportValue | undefined): boolean {
  return value === undefined || value === '' || (Array.isArray(value) && value.length === 0)
}

export function optionsOf(column: ImportColumn, lists: ImportLists): ImportListOption[] {
  if (column.allowed) return column.allowed
  if (column.listSource) return lists[column.listSource] ?? []
  return []
}

function matchOption(value: string, options: ImportListOption[]): string | null {
  const wanted = normalizeText(value)
  const found = options.find(
    (option) =>
      normalizeText(option.value) === wanted ||
      normalizeText(option.labelEn) === wanted ||
      normalizeText(option.labelAr) === wanted,
  )
  return found ? found.value : null
}

// ---------------------------------------------------------------- cell parsing

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

/** An Excel date serial (days since 1899-12-30) as `YYYY-MM-DD`. */
export function excelSerialToIso(serial: number): string | null {
  if (!Number.isFinite(serial) || serial < 1 || serial > 2958465) return null
  const date = new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * 86_400_000)
  return date.toISOString().slice(0, 10)
}

export function parseDateCell(raw: unknown): string | null {
  if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? null : raw.toISOString().slice(0, 10)
  if (typeof raw === 'number') return excelSerialToIso(raw)
  const text = toEnglishDigits(cellText(raw))
  if (isIsoDate(text)) return text
  const dayFirst = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(text)
  if (dayFirst) {
    const iso = `${dayFirst[3]}-${dayFirst[2].padStart(2, '0')}-${dayFirst[1].padStart(2, '0')}`
    return isIsoDate(iso) ? iso : null
  }
  return /^\d+(\.\d+)?$/.test(text) ? excelSerialToIso(Number(text)) : null
}

export function parseNumberCell(raw: unknown): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null
  const text = toEnglishDigits(cellText(raw)).replace(/[\s,٬]/g, '').replace('٫', '.')
  return /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : null
}

export function parsePhoneCell(raw: unknown): string | null {
  const text = toEnglishDigits(cellText(raw)).replace(/[\s().-]/g, '')
  const international = text.startsWith('00') ? `+${text.slice(2)}` : text
  return /^\+\d{7,15}$/.test(international) ? international : null
}

export function parseBooleanCell(raw: unknown): boolean | null {
  if (typeof raw === 'boolean') return raw
  const text = normalizeText(cellText(raw))
  if (['yes', 'y', 'true', '1', 'نعم'].includes(text)) return true
  if (['no', 'n', 'false', '0', 'لا'].includes(text)) return false
  return null
}

function splitList(raw: unknown): string[] {
  return cellText(raw)
    .split(/[,;،\n]/)
    .map((part) => part.trim())
    .filter(Boolean)
}

export interface CellResult {
  value?: ImportValue
  error?: ImportIssueCode
}

/** Validates one cell against its column. An empty cell is neither a value nor an error. */
export function validateCell(column: ImportColumn, raw: unknown, lists: ImportLists): CellResult {
  const text = cellText(raw)
  if (!text) return {}

  switch (column.type) {
    case 'text':
    case 'longtext':
      return column.max && text.length > column.max ? { error: 'TOO_LONG' } : { value: text }
    case 'email': {
      const email = toEnglishDigits(text).toLowerCase()
      return EMAIL_PATTERN.test(email) ? { value: email } : { error: 'INVALID_EMAIL' }
    }
    case 'phone': {
      const phone = parsePhoneCell(raw)
      return phone ? { value: phone } : { error: 'INVALID_PHONE' }
    }
    case 'date': {
      const date = parseDateCell(raw)
      return date ? { value: date } : { error: 'INVALID_DATE' }
    }
    case 'number':
    case 'integer': {
      const number = parseNumberCell(raw)
      if (number === null || (column.type === 'integer' && !Number.isInteger(number))) return { error: 'INVALID_NUMBER' }
      if (number < 0 && !column.allowNegative) return { error: 'NEGATIVE_NUMBER' }
      return { value: number }
    }
    case 'boolean': {
      const flag = parseBooleanCell(raw)
      return flag === null ? { error: 'INVALID_BOOLEAN' } : { value: flag }
    }
    case 'country': {
      const countries = lists.countries ?? []
      const code = text.length === 2 ? countries.find((option) => option.value === text.toUpperCase())?.value : null
      const country = code ?? matchOption(text, countries)
      return country ? { value: country } : { error: 'INVALID_COUNTRY' }
    }
    case 'enum': {
      const options = optionsOf(column, lists)
      if (!options.length) return { value: text }
      const match = matchOption(text, options)
      return match ? { value: match } : { error: 'INVALID_VALUE' }
    }
    case 'list': {
      const parts = splitList(raw)
      const options = optionsOf(column, lists)
      if (column.freeList || !options.length) return { value: Array.from(new Set(parts)) }
      const values: string[] = []
      for (const part of parts) {
        const match = matchOption(part, options)
        if (!match) return { error: 'UNKNOWN_ITEM' }
        if (!values.includes(match)) values.push(match)
      }
      return { value: values }
    }
    default:
      return { value: text }
  }
}

// ---------------------------------------------------------------- records

/** The key that tells two rows are the same record; empty when a key part is missing. */
export function naturalKeyOf(entity: ImportEntityDefinition, values: Record<string, ImportValue>): string {
  if (!entity.naturalKey.length) return ''
  const parts = entity.naturalKey.map((key) => {
    const value = values[key]
    return value === undefined || isEmptyValue(value) ? '' : normalizeText(String(value))
  })
  return parts.some((part) => !part) ? '' : parts.join('|')
}

/** Required columns weigh 2, needed-later columns 1, optional columns nothing. */
export function completenessOf(
  entity: ImportEntityDefinition,
  values: Record<string, ImportValue>,
): { filled: number; total: number; percent: number } {
  let filled = 0
  let total = 0
  for (const column of entity.columns) {
    const weight = column.required ? 2 : column.later ? 1 : 0
    if (!weight) continue
    total += weight
    if (!isEmptyValue(values[column.key])) filled += weight
  }
  return { filled, total, percent: total ? Math.round((filled / total) * 100) : 100 }
}

export function recordLabel(entity: ImportEntityDefinition, values: Record<string, ImportValue>): string {
  return entity.labelColumns
    .map((key) => values[key])
    .filter((value): value is ImportValue => !isEmptyValue(value))
    .map((value) => (Array.isArray(value) ? value.join(', ') : String(value)))
    .join(' · ')
}

function issue(field: string, code: ImportIssueCode): ImportIssue {
  return { field, code }
}

function checkDateOrder(
  values: Record<string, ImportValue>,
  from: string,
  to: string,
  errors: ImportIssue[],
): void {
  const start = values[from]
  const end = values[to]
  if (typeof start === 'string' && typeof end === 'string' && end < start) errors.push(issue(to, 'INVALID_DATE_RANGE'))
}

/** Checks that reference other registers (clients, people, certificates) and that dates are in order. */
function crossChecks(
  entity: ImportEntityDefinition,
  values: Record<string, ImportValue>,
  context: ImportContext,
  errors: ImportIssue[],
  warnings: ImportIssue[],
): void {
  const client = values.client
  if (entity.columns.some((column) => column.key === 'client' && column.required) && typeof client === 'string') {
    if (!context.clients.has(normalizeText(client))) errors.push(issue('client', 'CLIENT_NOT_FOUND'))
  }

  switch (entity.key) {
    case 'trainings': {
      const person = values.person
      if (typeof person === 'string' && !context.personnel.has(normalizeText(person))) {
        errors.push(issue('person', 'PERSON_NOT_FOUND'))
      }
      break
    }
    case 'certification_cycles': {
      const number = values.certificateNumber
      if (typeof number === 'string' && !context.certificates.has(normalizeText(number))) {
        errors.push(issue('certificateNumber', 'CERTIFICATE_NOT_FOUND'))
      }
      break
    }
    case 'certificates':
      checkDateOrder(values, 'issueDate', 'expiryDate', errors)
      break
    case 'invoices':
      checkDateOrder(values, 'issueDate', 'dueDate', errors)
      break
    case 'audit_plans': {
      checkDateOrder(values, 'startDate', 'endDate', errors)
      const people = context.lists.personnel ?? []
      const lead = values.leadAuditor
      if (people.length && typeof lead === 'string' && !matchOption(lead, people)) {
        warnings.push(issue('leadAuditor', 'PERSON_NOT_IN_REGISTER'))
      }
      break
    }
    default:
      break
  }
}

export interface ImportEvaluation {
  totals: ImportTotals
  completeness: number
  columnsRecognised: string[]
  columnsMissing: string[]
  rows: ImportRowResult[]
}

/** Validates every row of a file against an area: the heart of the review step. */
export function evaluateRows(
  entity: ImportEntityDefinition,
  rows: ImportRawRow[],
  context: ImportContext,
  recognised: string[],
): ImportEvaluation {
  const seen = new Set<string>()
  const results: ImportRowResult[] = []
  let filledTotal = 0
  let weightTotal = 0

  for (const { rowNumber, raw } of rows) {
    const values: Record<string, ImportValue> = {}
    const errors: ImportIssue[] = []
    const warnings: ImportIssue[] = []
    const rawText: Record<string, string> = {}

    for (const column of entity.columns) {
      const cell = raw[column.key]
      const text = cellText(cell)
      if (text) rawText[column.key] = text
      const result = validateCell(column, cell, context.lists)
      if (result.error) (column.required ? errors : warnings).push(issue(column.key, result.error))
      else if (result.value !== undefined) values[column.key] = result.value
    }

    const missing: string[] = []
    for (const column of entity.columns) {
      if (!isEmptyValue(values[column.key])) continue
      if (column.required) {
        missing.push(column.key)
        // A required cell that was filled but invalid already has its own error.
        if (!errors.some((error) => error.field === column.key)) errors.push(issue(column.key, 'REQUIRED'))
      } else if (column.later) {
        missing.push(column.key)
      }
    }

    crossChecks(entity, values, context, errors, warnings)

    const key = naturalKeyOf(entity, values)
    let status: ImportRowStatus
    let matchedExistingId: string | null = null
    if (errors.length) {
      status = 'invalid'
    } else if (key && seen.has(key) && !entity.repeatedKeyIsLine) {
      errors.push(issue(entity.naturalKey[0], 'DUPLICATE_IN_FILE'))
      status = 'invalid'
    } else if (key && context.existing.has(key)) {
      matchedExistingId = context.existing.get(key) ?? null
      warnings.push(issue(entity.naturalKey[0], 'DUPLICATE_EXISTING'))
      status = 'duplicate'
    } else {
      const missesLater = missing.some((columnKey) => !entity.columns.find((column) => column.key === columnKey)?.required)
      status = missesLater ? 'partial' : 'ready'
    }
    if (key && status !== 'invalid') seen.add(key)

    const completeness = completenessOf(entity, values)
    filledTotal += completeness.filled
    weightTotal += completeness.total
    results.push({
      rowNumber,
      raw: rawText,
      status,
      completeness: completeness.percent,
      values,
      missing,
      errors,
      warnings,
      matchedExistingId,
    })
  }

  const count = (status: ImportRowStatus) => results.filter((row) => row.status === status).length
  return {
    totals: {
      rows: results.length,
      ready: count('ready'),
      partial: count('partial'),
      invalid: count('invalid'),
      duplicates: count('duplicate'),
    },
    completeness: weightTotal ? Math.round((filledTotal / weightTotal) * 100) : 0,
    columnsRecognised: recognised,
    columnsMissing: entity.columns.filter((column) => !recognised.includes(column.key)).map((column) => column.key),
    rows: results,
  }
}

/** The rows that the chosen options import. Duplicates are only included when they update existing records. */
export function selectRowsToImport(
  rows: ImportRowResult[],
  mode: ImportMode,
  updateDuplicates: boolean,
): ImportRowResult[] {
  return rows.filter(
    (row) =>
      row.status === 'ready' ||
      (mode === 'include_partial' && row.status === 'partial') ||
      (updateDuplicates && row.status === 'duplicate'),
  )
}

// ---------------------------------------------------------------- reading the file's table

const TEMPLATE_MARKER = /^__template:([a-z_]+):v(\d+)$/
const HEADER_SEARCH_ROWS = 5

function columnLookup(entity: ImportEntityDefinition): Map<string, string> {
  const lookup = new Map<string, string>()
  for (const column of entity.columns) {
    for (const name of [column.key, column.labelEn, column.labelAr]) {
      const normalized = normalizeText(name)
      if (!lookup.has(normalized)) lookup.set(normalized, column.key)
    }
  }
  return lookup
}

/** Finds the column a header cell stands for; handles `Label *` and `English / Arabic` headers. */
export function matchHeader(lookup: Map<string, string>, header: unknown): string | null {
  const text = cellText(header)
  if (!text) return null
  const whole = lookup.get(normalizeText(text.replace(/\*/g, '')))
  if (whole) return whole
  for (const part of text.split(' / ')) {
    const match = lookup.get(normalizeText(part.replace(/\*/g, '')))
    if (match) return match
  }
  return null
}

function isBlankRow(row: unknown[]): boolean {
  return row.every((cell) => !cellText(cell))
}

function isExampleRow(entity: ImportEntityDefinition, raw: Record<string, unknown>): boolean {
  const filled = entity.columns.filter((column) => cellText(raw[column.key]))
  const examples = entity.columns.filter((column) => column.example)
  return (
    filled.length > 0 &&
    filled.every((column) => normalizeText(cellText(raw[column.key])) === normalizeText(column.example)) &&
    examples.every((column) => normalizeText(cellText(raw[column.key])) === normalizeText(column.example))
  )
}

/**
 * Turns the cells of a file into rows keyed by column. For an iCASCO template
 * the key row is read and the example row is skipped; for any other file the
 * first row must hold headers that match column keys or labels.
 */
export function tableToImportRows(entity: ImportEntityDefinition, table: ImportTable): ParsedImportFile {
  const cells = table.rows
  let headerIndex = -1
  let templateEntity: string | null = null

  for (let index = 0; index < Math.min(HEADER_SEARCH_ROWS, cells.length) && templateEntity === null; index += 1) {
    for (const cell of cells[index]) {
      const marker = TEMPLATE_MARKER.exec(cellText(cell))
      if (marker) {
        templateEntity = marker[1]
        headerIndex = index
        break
      }
    }
  }
  if (templateEntity !== null && templateEntity !== entity.key) {
    throw new ImportFileError('WRONG_TEMPLATE')
  }
  if (headerIndex < 0) headerIndex = cells.findIndex((row) => !isBlankRow(row))
  if (headerIndex < 0) throw new ImportFileError('NO_COLUMNS')

  const lookup = columnLookup(entity)
  const columnAt: Array<string | null> = cells[headerIndex].map((header) => matchHeader(lookup, header))
  const seenKeys = new Set<string>()
  const recognised: string[] = []
  columnAt.forEach((key, index) => {
    if (!key || seenKeys.has(key)) {
      columnAt[index] = null
      return
    }
    seenKeys.add(key)
    recognised.push(key)
  })
  if (!recognised.length) throw new ImportFileError('NO_COLUMNS')

  const rows: ImportRawRow[] = []
  for (let index = headerIndex + 1; index < cells.length; index += 1) {
    const row = cells[index]
    if (isBlankRow(row)) continue
    const raw: Record<string, unknown> = {}
    columnAt.forEach((key, columnIndex) => {
      if (key) raw[key] = row[columnIndex]
    })
    if (templateEntity !== null && isExampleRow(entity, raw)) continue
    rows.push({ rowNumber: index + 1, raw })
  }

  if (!rows.length) throw new ImportFileError('NO_ROWS')
  if (rows.length > MAX_IMPORT_ROWS) throw new ImportFileError('TOO_MANY_ROWS')
  return { rows, recognised }
}

// ---------------------------------------------------------------- template and report

function headerLabel(column: ImportColumn, language: ImportLanguage): string {
  const star = column.required ? ' *' : ''
  return language === 'ar'
    ? `${column.labelAr}${star} / ${column.labelEn}${star}`
    : `${column.labelEn}${star} / ${column.labelAr}${star}`
}

export function templateFileName(entity: ImportEntityKey): string {
  return `iCASCO_${entity}_template_v1.xlsx`
}

export function templateMarker(entity: ImportEntityKey): string {
  return `__template:${entity}:v1`
}

function columnNames(columns: ImportColumn[], language: ImportLanguage, none: string): string {
  return columns.map((column) => (language === 'ar' ? column.labelAr : column.labelEn)).join(', ') || none
}

export interface WorkbookSheet {
  name: string
  rows: string[][]
}

/** The sheets of the downloadable template: Instructions, Data (labels, keys, example) and Lists. */
export function buildTemplateSheets(
  entity: ImportEntityDefinition,
  language: ImportLanguage,
  lists: ImportLists,
  translate: Translate,
): WorkbookSheet[] {
  const none = translate('cab.dataMigration.template.none')
  const required = entity.columns.filter((column) => column.required)
  const later = entity.columns.filter((column) => column.later)

  const instructions: string[][] = [
    [translate('cab.dataMigration.template.title', { entity: language === 'ar' ? entity.labelAr : entity.labelEn })],
    [language === 'ar' ? entity.descriptionAr : entity.descriptionEn],
    [translate('cab.dataMigration.template.howTo')],
    [translate('cab.dataMigration.template.required', { columns: columnNames(required, language, none) })],
    [translate('cab.dataMigration.template.later', { columns: columnNames(later, language, none) })],
    [translate('cab.dataMigration.template.formats')],
    [translate('cab.dataMigration.template.lists')],
  ]

  const data: string[][] = [
    entity.columns.map((column) => headerLabel(column, language)),
    [...entity.columns.map((column) => column.key), templateMarker(entity.key)],
    entity.columns.map((column) => column.example),
  ]

  const listed = entity.columns
    .map((column) => ({ column, options: optionsOf(column, lists) }))
    .filter((item) => item.options.length > 0)
  const sheets: WorkbookSheet[] = [
    { name: 'Instructions', rows: instructions },
    { name: 'Data', rows: data },
  ]
  if (listed.length) {
    const height = Math.max(...listed.map((item) => item.options.length))
    const rows: string[][] = [listed.map((item) => headerLabel({ ...item.column, required: false }, language))]
    for (let index = 0; index < height; index += 1) rows.push(listed.map((item) => item.options[index]?.value ?? ''))
    sheets.push({ name: 'Lists', rows })
  }
  return sheets
}

/** One line per problem, so the user can fix the file and upload it again. */
export function buildIssueReportRows(
  entity: ImportEntityDefinition,
  rows: ImportRowResult[],
  language: ImportLanguage,
  translate: Translate,
): string[][] {
  const labelOf = (key: string) => {
    const column = entity.columns.find((candidate) => candidate.key === key)
    return column ? (language === 'ar' ? column.labelAr : column.labelEn) : key
  }
  const report: string[][] = [
    [
      translate('cab.dataMigration.report.row'),
      translate('cab.dataMigration.report.status'),
      translate('cab.dataMigration.report.column'),
      translate('cab.dataMigration.report.problem'),
      translate('cab.dataMigration.report.value'),
    ],
  ]
  for (const row of rows) {
    if (row.status === 'ready') continue
    const status = translate(`cab.dataMigration.status.${row.status}`)
    const line = (field: string, problem: string) =>
      report.push([String(row.rowNumber), status, labelOf(field), problem, row.raw[field] ?? ''])
    for (const item of [...row.errors, ...row.warnings]) {
      line(item.field, translate(`cab.dataMigration.issues.${item.code}`))
    }
    if (row.status === 'partial') {
      for (const field of row.missing) line(field, translate('cab.dataMigration.report.missingLater'))
    }
  }
  return report
}

// ---------------------------------------------------------------- hub summary

/** Records that were imported incomplete and still wait for the missing values. */
export function openIncompleteRecords(records: IncompleteRecord[]): IncompleteRecord[] {
  return records.filter((record) => !record.resolvedAt)
}

/** `batches` are the imports that were carried out, newest first. */
export function buildOverview(batches: ImportBatch[], incomplete: IncompleteRecord[]): MigrationOverview {
  const open = openIncompleteRecords(incomplete)

  const entities: EntityMigrationStatus[] = IMPORT_ENTITY_KEYS.map((key) => {
    const done = batches.filter((batch) => batch.entity === key)
    const imported = done.reduce((sum, batch) => sum + batch.result.created, 0)
    const updated = done.reduce((sum, batch) => sum + batch.result.updated, 0)
    const waiting = open.filter((record) => record.entity === key).length
    const started = imported > 0 || updated > 0
    return {
      entity: key,
      imported,
      updated,
      incomplete: waiting,
      state: !started ? 'not_started' : waiting ? 'in_progress' : 'completed',
      progress: imported ? Math.round(((imported - Math.min(waiting, imported)) / imported) * 100) : updated ? 100 : 0,
      lastImport: done[0] ?? null,
    }
  })

  const started = entities.filter((status) => status.state !== 'not_started')
  return {
    entities,
    overall: {
      entities: entities.length,
      started: started.length,
      completed: entities.filter((status) => status.state === 'completed').length,
      imported: entities.reduce((sum, status) => sum + status.imported, 0),
      incomplete: entities.reduce((sum, status) => sum + status.incomplete, 0),
      progress: Math.round(entities.reduce((sum, status) => sum + status.progress, 0) / entities.length),
    },
  }
}