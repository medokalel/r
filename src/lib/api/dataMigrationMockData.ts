/**
 * Mock of the data migration backend, used until the endpoints exist (same
 * approach as `auditChecklistMockData` and `travelPolicyMockData`).
 *
 * State lives in memory, so it resets on reload. It starts with a few records
 * in the clients, people and certificates registers: that is what lets the
 * review step find unknown clients, unknown people and duplicates. A committed
 * import adds its records to those registers, so importing clients first and
 * their sites afterwards works as it will with the real backend.
 *
 * Replace the bodies of the exported functions with real requests when the
 * endpoints are ready; their signatures are what the page relies on.
 */
import { getCountryOptions } from '@/lib/countries'
import { getImportEntity } from '@/lib/dataMigrationEntities'
import {
  buildOverview,
  completenessOf,
  evaluateRows,
  naturalKeyOf,
  normalizeText,
  openIncompleteRecords,
  recordLabel,
  selectRowsToImport,
  tableToImportRows,
} from '@/lib/dataMigrationForm'
import type {
  ImportBatch,
  ImportCommitOptions,
  ImportCommitResult,
  ImportContext,
  ImportEntityKey,
  ImportLists,
  ImportPreview,
  ImportRowResult,
  ImportTable,
  ImportValue,
  IncompleteRecord,
  MigrationOverview,
} from '@/lib/dataMigrationTypes'
import { IMPORT_ENTITY_KEYS } from '@/lib/dataMigrationTypes'
import { IAF_CODES_LIST } from '@/lib/iafCodes'
import { STANDARD_OPTIONS } from '@/lib/api/applicationDraftApi'
import { CAB_PROFESSIONAL_ROLES } from '@/lib/api/cabEmployeesApi'
import { ImportFileError, readImportFile } from '@/lib/importFileReader'
import { getAuthSession } from '@/lib/authStorage'
import { importNonconformityRows, importedReferences } from '@/lib/api/cabNonconformitiesApi'

const MOCK_LATENCY_MS = 250
const MAX_BATCHES = 30

const wait = (ms = MOCK_LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms))

const ROLE_LABELS_AR: Record<string, string> = {
  GENERAL_MANAGER: 'المدير العام',
  APPLICATIONS_RECEIVER: 'مستلم الطلبات',
  TECHNICAL_MANAGER: 'المدير الفني',
  CERTIFICATION_MANAGER: 'مدير منح الشهادات',
  BUSINESS_DEVELOPMENT_MANAGER: 'مدير تطوير الأعمال',
  LEAD_AUDITOR: 'قائد فريق التدقيق',
  AUDITOR: 'مدقق',
  ACCOUNTANT: 'محاسب',
  COMMITTEE_MEMBER: 'عضو لجنة',
  FREELANCE_AUDITOR: 'مدقق مستقل',
}

const CURRENCIES = ['SAR', 'AED', 'EGP', 'USD', 'EUR', 'KWD', 'QAR', 'OMR', 'BHD', 'JOD']

interface ClientRecord {
  id: string
  legalName: string
  aliases: string[]
}

interface PersonRecord {
  id: string
  fullName: string
  email: string
}

interface MockStore {
  existing: Record<ImportEntityKey, Map<string, string>>
  clients: ClientRecord[]
  personnel: PersonRecord[]
  certificates: Map<string, string>
  previews: Map<string, ImportPreview>
  batches: ImportBatch[]
  incomplete: IncompleteRecord[]
  counter: number
}

function createStore(): MockStore {
  const existing = Object.fromEntries(IMPORT_ENTITY_KEYS.map((key) => [key, new Map<string, string>()])) as MockStore['existing']
  const clients: ClientRecord[] = [
    { id: 'client-1', legalName: 'Al Noor Food Industries Co.', aliases: ['Al Noor Foods', '4030123456'] },
    { id: 'client-2', legalName: 'Delta Steel Works', aliases: ['Delta Steel', '1010456789'] },
    { id: 'client-3', legalName: 'Nile Logistics Group', aliases: ['Nile Logistics', '2050987654'] },
  ]
  const personnel: PersonRecord[] = [
    { id: 'person-1', fullName: 'Ahmed Saleh', email: 'ahmed.saleh@cab-example.com' },
    { id: 'person-2', fullName: 'Mona Fathy', email: 'mona.fathy@cab-example.com' },
    { id: 'person-3', fullName: 'Khaled Omar', email: 'khaled.omar@cab-example.com' },
  ]
  const certificates = new Map<string, string>([
    [normalizeText('CAS-QMS-2023-0142'), 'cert-1'],
    [normalizeText('CAS-EMS-2022-0087'), 'cert-2'],
  ])
  for (const client of clients) existing.clients.set(normalizeText(client.legalName), client.id)
  for (const person of personnel) existing.personnel.set(normalizeText(person.email), person.id)
  for (const [key, id] of certificates) existing.certificates.set(key, id)
  return {
    existing,
    clients,
    personnel,
    certificates,
    previews: new Map(),
    batches: [],
    incomplete: [],
    counter: 0,
  }
}

const store = createStore()

function nextId(prefix: string): string {
  store.counter += 1
  return `${prefix}-${Date.now().toString(36)}-${store.counter}`
}

function currentUser(): string {
  return getAuthSession()?.user?.email ?? 'admin'
}

let countryOptions: ImportLists['countries']

/** The values a column accepts when it is a list; they also fill the template's Lists sheet. */
export function getImportLists(): ImportLists {
  if (!countryOptions) {
    const arabic = new Map(getCountryOptions('ar').map((country) => [country.code, country.name]))
    countryOptions = getCountryOptions('en').map((country) => ({
      value: country.code,
      labelEn: country.name,
      labelAr: arabic.get(country.code) ?? country.name,
    }))
  }
  return {
    countries: countryOptions,
    currencies: CURRENCIES.map((code) => ({ value: code, labelEn: code, labelAr: code })),
    standards: STANDARD_OPTIONS.map((label) => ({ value: label.split(' - ')[0], labelEn: label, labelAr: label })),
    roles: CAB_PROFESSIONAL_ROLES.map((role) => ({
      value: role.value,
      labelEn: role.label,
      labelAr: ROLE_LABELS_AR[role.value] ?? role.label,
    })),
    iafCodes: IAF_CODES_LIST.map((item) => ({
      value: `IAF ${item.code}`,
      labelEn: `IAF ${item.code} • ${item.en}`,
      labelAr: `IAF ${item.code} • ${item.ar}`,
    })),
    personnel: store.personnel.map((person) => ({ value: person.fullName, labelEn: person.email, labelAr: person.fullName })),
    clients: store.clients.map((client) => ({ value: client.legalName, labelEn: client.legalName, labelAr: client.legalName })),
  }
}

function buildContext(entity: ImportEntityKey): ImportContext {
  const clients = new Map<string, string>()
  for (const client of store.clients) {
    for (const name of [client.legalName, ...client.aliases]) clients.set(normalizeText(name), client.id)
  }
  const personnel = new Map<string, string>()
  for (const person of store.personnel) {
    personnel.set(normalizeText(person.email), person.id)
    personnel.set(normalizeText(person.fullName), person.id)
  }
  const existing = store.existing[entity]
  if (entity === 'nonconformities') {
    // Imported nonconformities live in the register, so a later import (or a reload) still finds them as duplicates.
    for (const reference of importedReferences()) existing.set(normalizeText(reference), `nc-${reference}`)
  }
  return {
    lists: getImportLists(),
    existing,
    clients,
    personnel,
    certificates: store.certificates,
  }
}

/** Adds an imported record to the registers other areas look things up in. */
function registerRecord(entity: ImportEntityKey, values: Record<string, ImportValue>, id: string): void {
  const text = (key: string) => (typeof values[key] === 'string' ? (values[key] as string) : '')
  if (entity === 'clients') {
    store.clients.push({ id, legalName: text('legalName'), aliases: [text('tradeName'), text('registrationNumber')].filter(Boolean) })
  } else if (entity === 'personnel') {
    store.personnel.push({ id, fullName: text('fullName'), email: text('email') })
  } else if (entity === 'certificates') {
    store.certificates.set(normalizeText(text('certificateNumber')), id)
  }
}

// ---------------------------------------------------------------- the calls the page makes

export interface MigrationHubData {
  overview: MigrationOverview
  /** Imports that were carried out, newest first. */
  batches: ImportBatch[]
  /** Records imported without some "needed later" values, newest first. */
  incomplete: IncompleteRecord[]
}

export async function loadMigrationHub(): Promise<MigrationHubData> {
  await wait()
  return {
    overview: buildOverview(store.batches, store.incomplete),
    batches: [...store.batches],
    incomplete: openIncompleteRecords(store.incomplete),
  }
}

/** Validates the rows of an already read file and keeps the result so it can be imported next. */
export async function previewImportTable(entityKey: ImportEntityKey, table: ImportTable, fileName: string): Promise<ImportPreview> {
  const entity = getImportEntity(entityKey)
  const parsed = tableToImportRows(entity, table)
  const evaluation = evaluateRows(entity, parsed.rows, buildContext(entityKey), parsed.recognised)
  const preview: ImportPreview = {
    importId: nextId('imp'),
    entity: entityKey,
    fileName,
    createdAt: new Date().toISOString(),
    ...evaluation,
  }
  store.previews.set(preview.importId, preview)
  await wait()
  return preview
}

/** Reads the file the user chose and validates it. Throws an `ImportFileError` when it cannot be read. */
export async function previewImport(entityKey: ImportEntityKey, file: File): Promise<ImportPreview> {
  return previewImportTable(entityKey, await readImportFile(file), file.name)
}

function groupLines(rows: ImportRowResult[], entityKey: ImportEntityKey): ImportRowResult[][] {
  const entity = getImportEntity(entityKey)
  if (!entity.repeatedKeyIsLine) return rows.map((row) => [row])
  const groups = new Map<string, ImportRowResult[]>()
  for (const row of rows) {
    const key = naturalKeyOf(entity, row.values) || `row-${row.rowNumber}`
    groups.set(key, [...(groups.get(key) ?? []), row])
  }
  return Array.from(groups.values())
}

export async function commitImport(importId: string, options: ImportCommitOptions): Promise<ImportCommitResult> {
  const preview = store.previews.get(importId)
  if (!preview) throw new ImportFileError('IMPORT_NOT_FOUND')
  if (store.batches.some((batch) => batch.id === importId)) throw new ImportFileError('ALREADY_COMMITTED')

  const entity = getImportEntity(preview.entity)
  const selected = selectRowsToImport(preview.rows, options.mode, options.duplicates === 'update')
  const selectedNumbers = new Set(selected.map((row) => row.rowNumber))
  const createdAt = new Date().toISOString()
  let created = 0
  let updated = 0
  let incomplete = 0
  const ncRows: Array<{ values: Record<string, unknown>; update: boolean }> = []

  for (const lines of groupLines(selected, preview.entity)) {
    const first = lines[0]
    if (preview.entity === 'nonconformities') ncRows.push({ values: first.values, update: first.status === 'duplicate' })
    if (first.status === 'duplicate') {
      updated += 1
      continue
    }
    created += 1
    const recordId = nextId('rec')
    const key = naturalKeyOf(entity, first.values)
    if (key) store.existing[preview.entity].set(key, recordId)
    registerRecord(preview.entity, first.values, recordId)

    const missingLater = first.missing.filter((columnKey) => !entity.columns.find((column) => column.key === columnKey)?.required)
    if (missingLater.length) {
      incomplete += 1
      store.incomplete.unshift({
        id: nextId('inc'),
        entity: preview.entity,
        importId,
        label: recordLabel(entity, first.values),
        completeness: completenessOf(entity, first.values).percent,
        missing: missingLater,
        createdAt,
        resolvedAt: null,
      })
    }
  }

  if (ncRows.length) await importNonconformityRows(ncRows, preview.fileName)

  const result: ImportCommitResult = {
    importId,
    entity: preview.entity,
    created,
    updated,
    skipped: preview.rows.filter((row) => row.status !== 'invalid' && !selectedNumbers.has(row.rowNumber)).length,
    invalid: preview.totals.invalid,
    mode: options.mode,
    duplicates: options.duplicates,
    incomplete,
  }
  store.batches.unshift({
    id: importId,
    entity: preview.entity,
    fileName: preview.fileName,
    createdAt,
    createdBy: currentUser(),
    totals: preview.totals,
    completeness: preview.completeness,
    result,
  })
  store.batches.splice(MAX_BATCHES)
  await wait()
  return result
}

/** Marks a record as completed (the user filled its missing values in the register). */
export async function resolveIncompleteRecord(id: string): Promise<void> {
  const record = store.incomplete.find((item) => item.id === id)
  if (record && !record.resolvedAt) record.resolvedAt = new Date().toISOString()
  await wait(120)
}