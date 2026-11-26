import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

// Same loader as data-migration.test.mjs: runs the real src/lib files against each other.
const nodeRequire = createRequire(import.meta.url)
const cache = new Map()

function load(specifier, stubs = {}) {
  if (specifier in stubs) return stubs[specifier]
  if (!specifier.startsWith('@/')) return nodeRequire(specifier)
  const cacheKey = `${specifier}|${Object.keys(stubs).join(',')}`
  if (cache.has(cacheKey)) return cache.get(cacheKey)
  const path = new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url)
  const exports = {}
  cache.set(cacheKey, exports)
  runInNewContext(
    ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    {
      exports,
      require: (next) => load(next, stubs),
      Date,
      TextDecoder,
      TextEncoder,
      document: { createElement: () => ({ click() {} }) },
      URL: { createObjectURL: (blob) => ((globalThis.__lastBlob = blob), 'blob:test'), revokeObjectURL() {} },
      Blob,
      Response,
      DecompressionStream,
      setTimeout,
      Math,
      Intl,
    },
  )
  return exports
}

const plain = (value) => JSON.parse(JSON.stringify(value))

const { IMPORT_ENTITIES } = load('@/lib/dataMigrationEntities')
const wizard = load('@/lib/dataMigrationWizard')
const form = load('@/lib/dataMigrationForm')

const row = (rowNumber, status, values = {}, raw = {}) => ({ rowNumber, status, values, raw })

test('the wizard has five steps in order', () => {
  assert.deepEqual(plain(wizard.WIZARD_STEPS), ['template', 'upload', 'review', 'import', 'result'])
})

test('countRecordsToImport follows the chosen options', () => {
  const entity = IMPORT_ENTITIES.clients
  const rows = [row(2, 'ready'), row(3, 'partial'), row(4, 'invalid'), row(5, 'duplicate')]
  assert.equal(wizard.countRecordsToImport(entity, rows, 'ready_only', false), 1)
  assert.equal(wizard.countRecordsToImport(entity, rows, 'include_partial', false), 2)
  assert.equal(wizard.countRecordsToImport(entity, rows, 'include_partial', true), 3)
  assert.equal(wizard.countRecordsToImport(entity, [row(2, 'invalid')], 'include_partial', true), 0)
})

test('countRecordsToImport counts the lines of one invoice once', () => {
  const entity = IMPORT_ENTITIES.invoices
  const line = (rowNumber, number) => row(rowNumber, 'ready', { invoiceNumber: number })
  assert.equal(wizard.countRecordsToImport(entity, [line(2, 'INV-1'), line(3, 'INV-1'), line(4, 'INV-2')], 'ready_only', false), 2)
})

test('reviewRowLabel names a row by its label columns, else by its first cell', () => {
  const clients = IMPORT_ENTITIES.clients
  assert.equal(wizard.reviewRowLabel(clients, row(2, 'ready', { legalName: 'Gamma Foods' })), 'Gamma Foods')
  assert.equal(wizard.reviewRowLabel(clients, row(3, 'invalid', {}, { contactEmail: 'x@y.co' })), 'x@y.co')
  assert.equal(wizard.reviewRowLabel(clients, row(4, 'invalid')), '—')
})

test('failed uploads and imports map to a known message, else generic', () => {
  assert.equal(wizard.uploadErrorCode({ code: 'WRONG_TEMPLATE' }), 'WRONG_TEMPLATE')
  assert.equal(wizard.uploadErrorCode({ code: 'NO_ROWS' }), 'NO_ROWS')
  assert.equal(wizard.uploadErrorCode(new Error('boom')), 'generic')
  assert.equal(wizard.uploadErrorCode(null), 'generic')
  assert.equal(wizard.commitErrorCode({ code: 'ALREADY_COMMITTED' }), 'ALREADY_COMMITTED')
  assert.equal(wizard.commitErrorCode({ code: 'FILE_TYPE' }), 'generic')
})

// The whole path of the wizard on the real code: the downloaded template is
// filled, read back from its bytes, reviewed and imported.
const mockStubs = {
  '@/lib/countries': { getCountryOptions: () => [{ code: 'SA', name: 'Saudi Arabia' }] },
  '@/lib/iafCodes': { IAF_CODES_LIST: [{ code: '03', en: 'Chemicals', ar: 'كيماويات' }] },
  '@/lib/api/applicationDraftApi': { STANDARD_OPTIONS: ['ISO 9001:2015 - Quality Management'] },
  '@/lib/api/cabEmployeesApi': { CAB_PROFESSIONAL_ROLES: [{ value: 'LEAD_AUDITOR', label: 'Lead Auditor' }] },
  '@/lib/authStorage': { getAuthSession: () => ({ user: { email: 'admin@cab-example.com' } }) },
  '@/lib/api/cabNonconformitiesApi': { importNonconformityRows: async () => ({ created: 0, updated: 0 }), importedReferences: () => [] },
}

test('upload a filled template file: preview, import, hub', async () => {
  const mock = load('@/lib/api/dataMigrationMockData', mockStubs)
  const { downloadXlsxWorkbook } = load('@/lib/xlsxDownload')
  const entity = IMPORT_ENTITIES.clients

  const sheets = form.buildTemplateSheets(entity, 'ar', mock.getImportLists(), (key) => key)
  const data = sheets.find((sheet) => sheet.name === 'Data')
  const filled = (name, overrides = {}) =>
    entity.columns.map((column) => overrides[column.key] ?? (column.key === 'legalName' ? name : column.example))
  data.rows.push(filled('Gamma Foods'), filled('Delta ??', { contactEmail: 'not-an-email' }), filled('Beta Trading', { city: '', contactName: '' }))
  downloadXlsxWorkbook('clients.xlsx', sheets)

  const bytes = await globalThis.__lastBlob.arrayBuffer()
  const file = { name: 'clients.xlsx', size: bytes.byteLength, arrayBuffer: async () => bytes, text: async () => '' }
  const preview = await mock.previewImport('clients', file)

  assert.equal(preview.fileName, 'clients.xlsx')
  assert.deepEqual(plain(preview.totals), { rows: 3, ready: 1, partial: 1, invalid: 1, duplicates: 0 })
  assert.deepEqual(plain(preview.rows.map((item) => item.rowNumber)), [4, 5, 6])
  assert.equal(wizard.countRecordsToImport(entity, preview.rows, 'ready_only', false), 1)
  assert.equal(wizard.countRecordsToImport(entity, preview.rows, 'include_partial', false), 2)

  const result = await mock.commitImport(preview.importId, { mode: 'include_partial', duplicates: 'skip' })
  assert.deepEqual(plain({ created: result.created, skipped: result.skipped, invalid: result.invalid, incomplete: result.incomplete }), {
    created: 2,
    skipped: 0,
    invalid: 1,
    incomplete: 1,
  })

  const hub = await mock.loadMigrationHub()
  assert.equal(hub.batches.length, 1)
  assert.equal(hub.incomplete[0].label, 'Beta Trading')
})