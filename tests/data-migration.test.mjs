import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { deflateRawSync } from 'node:zlib'
import ts from 'typescript'

// Loads a src/lib TypeScript file the way Vite resolves it ('@/...'), so the
// real modules run against each other. `stubs` replaces modules that need a
// browser (i18n, libphonenumber) or other registers.
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
const errorCode = (code) => (error) => error?.code === code

const { IMPORT_ENTITIES } = load('@/lib/dataMigrationEntities')
const { IMPORT_ENTITY_KEYS } = load('@/lib/dataMigrationTypes')
const form = load('@/lib/dataMigrationForm')
const reader = load('@/lib/importFileReader')

const option = (value, labelEn = value, labelAr = value) => ({ value, labelEn, labelAr })
const lists = {
  countries: [option('SA', 'Saudi Arabia', 'السعودية'), option('EG', 'Egypt', 'مصر')],
  currencies: [option('SAR'), option('USD')],
  standards: [option('ISO 9001:2015', 'ISO 9001:2015 - Quality Management')],
  roles: [option('LEAD_AUDITOR', 'Lead Auditor', 'قائد فريق التدقيق')],
  iafCodes: [option('IAF 03'), option('IAF 29')],
  personnel: [option('Ahmed Saleh', 'ahmed.saleh@cab-example.com', 'Ahmed Saleh')],
  clients: [option('Al Noor Food Industries Co.')],
}

function context(overrides = {}) {
  return {
    lists,
    existing: new Map(),
    clients: new Map([['al noor food industries co.', 'client-1']]),
    personnel: new Map([['ahmed.saleh@cab-example.com', 'person-1'], ['ahmed saleh', 'person-1']]),
    certificates: new Map([['cas-qms-2023-0142', 'cert-1']]),
    ...overrides,
  }
}

const exampleRow = (entity, rowNumber = 2) => ({
  rowNumber,
  raw: Object.fromEntries(entity.columns.map((column) => [column.key, column.example])),
})

const evaluate = (entityKey, rows, ctx = context()) =>
  form.evaluateRows(
    IMPORT_ENTITIES[entityKey],
    rows,
    ctx,
    IMPORT_ENTITIES[entityKey].columns.map((column) => column.key),
  )

// ---------------------------------------------------------------- definitions

test('every area has the same keys in the registry and the order list', () => {
  assert.deepEqual(Object.keys(IMPORT_ENTITIES), [...IMPORT_ENTITY_KEYS])
  for (const entity of Object.values(IMPORT_ENTITIES)) {
    const keys = entity.columns.map((column) => column.key)
    assert.equal(new Set(keys).size, keys.length, `${entity.key} repeats a column key`)
    for (const key of [...entity.naturalKey, ...entity.labelColumns]) assert.ok(keys.includes(key), `${entity.key}: ${key}`)
    assert.ok(entity.columns.some((column) => column.required), `${entity.key} has no required column`)
  }
})

test('the example row of every template is a valid row', () => {
  for (const entity of Object.values(IMPORT_ENTITIES)) {
    const [row] = evaluate(entity.key, [exampleRow(entity)]).rows
    assert.deepEqual(plain(row.errors), [], `${entity.key} example has errors`)
    assert.notEqual(row.status, 'invalid', entity.key)
  }
})

// ---------------------------------------------------------------- reading files

test('parseCsv handles quotes, delimiters, a BOM and CRLF', () => {
  assert.deepEqual(plain(reader.parseCsv('\uFEFFa,b\r\n"x, y","say ""hi"""\r\n')), [
    ['a', 'b'],
    ['x, y', 'say "hi"'],
  ])
  assert.deepEqual(plain(reader.parseCsv('a;b\n1;2')), [['a', 'b'], ['1', '2']])
  assert.deepEqual(plain(reader.parseCsv('a\tb\n1\t2')), [['a', 'b'], ['1', '2']])
  assert.deepEqual(plain(reader.parseCsv('a,b\n"line\nbreak",2')), [['a', 'b'], ['line\nbreak', '2']])
})

function crc32Placeholder() {
  return 0
}

/** A minimal .xlsx: the zip is built by hand so the real reader is exercised. */
function makeZip(files, compress) {
  const parts = []
  const directory = []
  let offset = 0
  for (const [name, content] of Object.entries(files)) {
    const nameBytes = Buffer.from(name)
    const raw = Buffer.from(content)
    const data = compress ? deflateRawSync(raw) : raw
    const header = Buffer.alloc(30)
    header.writeUInt32LE(0x04034b50, 0)
    header.writeUInt16LE(20, 4)
    header.writeUInt16LE(compress ? 8 : 0, 8)
    header.writeUInt32LE(crc32Placeholder(), 14)
    header.writeUInt32LE(data.length, 18)
    header.writeUInt32LE(raw.length, 22)
    header.writeUInt16LE(nameBytes.length, 26)
    parts.push(header, nameBytes, data)
    const entry = Buffer.alloc(46)
    entry.writeUInt32LE(0x02014b50, 0)
    entry.writeUInt16LE(20, 4)
    entry.writeUInt16LE(20, 6)
    entry.writeUInt16LE(compress ? 8 : 0, 10)
    entry.writeUInt32LE(data.length, 20)
    entry.writeUInt32LE(raw.length, 24)
    entry.writeUInt16LE(nameBytes.length, 28)
    entry.writeUInt32LE(offset, 42)
    directory.push(entry, nameBytes)
    offset += header.length + nameBytes.length + data.length
  }
  const directoryBytes = Buffer.concat(directory)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(Object.keys(files).length, 8)
  end.writeUInt16LE(Object.keys(files).length, 10)
  end.writeUInt32LE(directoryBytes.length, 12)
  end.writeUInt32LE(offset, 16)
  const out = Buffer.concat([...parts, directoryBytes, end])
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength)
}

const workbookFiles = {
  'xl/workbook.xml':
    '<workbook xmlns:r="x"><sheets><sheet name="Lists" sheetId="1" r:id="rId1"/><sheet name="Data" sheetId="2" r:id="rId2"/></sheets></workbook>',
  'xl/_rels/workbook.xml.rels':
    '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="/xl/worksheets/sheet2.xml"/></Relationships>',
  'xl/sharedStrings.xml':
    '<sst><si><t>Full name</t></si><si><r><t>Rock </t></r><r><t>&amp; Roll</t></r></si></sst>',
  'xl/worksheets/sheet1.xml': '<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>ignored</t></is></c></row></sheetData></worksheet>',
  'xl/worksheets/sheet2.xml':
    '<worksheet><sheetData>' +
    '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="inlineStr"><is><t>Third</t></is></c></row>' +
    '<row r="3"><c r="A3" t="s"><v>1</v></c><c r="B3"><v>45000</v></c><c r="C3" t="b"><v>1</v></c><c r="D3" s="2"/></row>' +
    '</sheetData></worksheet>',
}

for (const compress of [false, true]) {
  test(`readXlsxTable reads the Data sheet (${compress ? 'deflated' : 'stored'} zip)`, async () => {
    const table = await reader.readXlsxTable(makeZip(workbookFiles, compress))
    assert.deepEqual(plain(table.rows), [['Full name', '', 'Third'], [], ['Rock & Roll', 45000, true, '']])
  })
}

test('readXlsxTable rejects a file that is not a workbook', async () => {
  await assert.rejects(reader.readXlsxTable(new TextEncoder().encode('just text, not a zip file at all').buffer), errorCode('FILE_UNREADABLE'))
})

test('readImportFile rejects unsupported and oversized files', async () => {
  const file = (name, size = 10) => ({ name, size, text: async () => 'a,b\n1,2', arrayBuffer: async () => new ArrayBuffer(0) })
  await assert.rejects(reader.readImportFile(file('old.xls')), errorCode('XLS_NOT_SUPPORTED'))
  await assert.rejects(reader.readImportFile(file('notes.pdf')), errorCode('FILE_TYPE'))
  await assert.rejects(reader.readImportFile(file('big.csv', reader.MAX_IMPORT_FILE_BYTES + 1)), errorCode('FILE_TOO_LARGE'))
  assert.deepEqual(plain((await reader.readImportFile(file('ok.csv'))).rows), [['a', 'b'], ['1', '2']])
})

// ---------------------------------------------------------------- matching columns

test('tableToImportRows reads a template: key row, skips the example row, keeps real row numbers', () => {
  const entity = IMPORT_ENTITIES.fee_items
  const sheets = form.buildTemplateSheets(entity, 'en', lists, (key) => key)
  const data = sheets.find((sheet) => sheet.name === 'Data').rows
  const rows = [...data, ['Audit day', '', '', '2500', 'SAR']]
  const parsed = form.tableToImportRows(entity, { rows })
  assert.equal(parsed.rows.length, 1)
  assert.equal(parsed.rows[0].rowNumber, 4)
  assert.equal(parsed.rows[0].raw.name, 'Audit day')
  assert.ok(parsed.recognised.includes('defaultAmount'))
})

test('tableToImportRows with only the example row has nothing to import', () => {
  const entity = IMPORT_ENTITIES.fee_items
  const data = form.buildTemplateSheets(entity, 'ar', lists, (key) => key).find((sheet) => sheet.name === 'Data').rows
  assert.throws(() => form.tableToImportRows(entity, { rows: data }), errorCode('NO_ROWS'))
})

test('tableToImportRows rejects a template of another area', () => {
  const data = form.buildTemplateSheets(IMPORT_ENTITIES.clients, 'en', lists, (key) => key).find((sheet) => sheet.name === 'Data').rows
  assert.throws(() => form.tableToImportRows(IMPORT_ENTITIES.fee_items, { rows: data }), errorCode('WRONG_TEMPLATE'))
})

test('tableToImportRows matches plain headers by key, English or Arabic label', () => {
  const entity = IMPORT_ENTITIES.fee_items
  const parsed = form.tableToImportRows(entity, {
    rows: [['Name *', 'المبلغ الافتراضي', 'currency', 'Unknown column'], ['Day rate', '100', 'SAR', 'x'], [], ['', '', '', '']],
  })
  assert.deepEqual(plain(parsed.recognised), ['name', 'defaultAmount', 'currency'])
  assert.equal(parsed.rows.length, 1)
  assert.equal(parsed.rows[0].raw.defaultAmount, '100')
  assert.throws(() => form.tableToImportRows(entity, { rows: [['foo', 'bar'], ['1', '2']] }), errorCode('NO_COLUMNS'))
  assert.throws(() => form.tableToImportRows(entity, { rows: [] }), errorCode('NO_COLUMNS'))
})

test('tableToImportRows refuses more rows than the limit', () => {
  const rows = [['name'], ...Array.from({ length: reader.MAX_IMPORT_ROWS + 1 }, (_, index) => [`Item ${index}`])]
  assert.throws(() => form.tableToImportRows(IMPORT_ENTITIES.fee_items, { rows }), errorCode('TOO_MANY_ROWS'))
})

// ---------------------------------------------------------------- cells

test('validateCell reads dates in the formats Excel and people produce', () => {
  const column = { key: 'd', type: 'date' }
  const date = (raw) => form.validateCell(column, raw, lists)
  assert.deepEqual(plain(date('2024-02-29')), { value: '2024-02-29' })
  assert.deepEqual(plain(date('15/06/2023')), { value: '2023-06-15' })
  assert.deepEqual(plain(date('٠٥-٠٣-٢٠٢٤')), { value: '2024-03-05' })
  assert.deepEqual(plain(date(45000)), { value: '2023-03-15' })
  assert.deepEqual(plain(date('2023-02-30')), { error: 'INVALID_DATE' })
  assert.deepEqual(plain(date('soon')), { error: 'INVALID_DATE' })
  assert.deepEqual(plain(date('')), {})
})

test('validateCell checks numbers, phones, emails, flags and lists', () => {
  const check = (column, raw) => plain(form.validateCell(column, raw, lists))
  assert.deepEqual(check({ type: 'integer' }, '1,200'), { value: 1200 })
  assert.deepEqual(check({ type: 'integer' }, '12.5'), { error: 'INVALID_NUMBER' })
  assert.deepEqual(check({ type: 'number' }, '-3'), { error: 'NEGATIVE_NUMBER' })
  assert.deepEqual(check({ type: 'number', allowNegative: true }, '-3.5'), { value: -3.5 })
  assert.deepEqual(check({ type: 'phone' }, '00966 50 123 4567'), { value: '+966501234567' })
  assert.deepEqual(check({ type: 'phone' }, '0501234567'), { error: 'INVALID_PHONE' })
  assert.deepEqual(check({ type: 'email' }, ' Sara@Example.com '), { value: 'sara@example.com' })
  assert.deepEqual(check({ type: 'email' }, 'sara@'), { error: 'INVALID_EMAIL' })
  assert.deepEqual(check({ type: 'boolean' }, 'نعم'), { value: true })
  assert.deepEqual(check({ type: 'boolean' }, 'maybe'), { error: 'INVALID_BOOLEAN' })
  assert.deepEqual(check({ type: 'country' }, 'sa'), { value: 'SA' })
  assert.deepEqual(check({ type: 'country' }, 'مصر'), { value: 'EG' })
  assert.deepEqual(check({ type: 'country' }, 'Atlantis'), { error: 'INVALID_COUNTRY' })
  assert.deepEqual(check({ type: 'text', max: 3 }, 'abcd'), { error: 'TOO_LONG' })
  const enumColumn = { type: 'enum', allowed: [option('ISSUED', 'Issued', 'صادرة')] }
  assert.deepEqual(check(enumColumn, 'issued'), { value: 'ISSUED' })
  assert.deepEqual(check(enumColumn, 'صادرة'), { value: 'ISSUED' })
  assert.deepEqual(check(enumColumn, 'other'), { error: 'INVALID_VALUE' })
  const listColumn = { type: 'list', listSource: 'iafCodes' }
  assert.deepEqual(check(listColumn, 'IAF 03, IAF 29; IAF 03'), { value: ['IAF 03', 'IAF 29'] })
  assert.deepEqual(check(listColumn, 'IAF 03, IAF 99'), { error: 'UNKNOWN_ITEM' })
  assert.deepEqual(check({ ...listColumn, freeList: true }, 'anything, goes'), { value: ['anything', 'goes'] })
})

// ---------------------------------------------------------------- rows

const clientRow = (rowNumber, overrides = {}) => ({
  rowNumber,
  raw: { ...exampleRow(IMPORT_ENTITIES.clients).raw, legalName: `Client ${rowNumber}`, ...overrides },
})

test('evaluateRows tells ready, partial, invalid and duplicate rows apart', () => {
  const ctx = context({ existing: new Map([['old client', 'client-9']]) })
  const evaluation = evaluate(
    'clients',
    [
      clientRow(2),
      clientRow(3, { city: '', contactName: '' }),
      clientRow(4, { contactEmail: '' }),
      clientRow(5, { contactEmail: 'not-an-email' }),
      clientRow(6, { legalName: 'Old Client' }),
      clientRow(7, { legalName: 'Client 2' }),
      clientRow(8, { employeeCount: 'many' }),
    ],
    ctx,
  )
  const [ready, partial, noEmail, badEmail, existing, repeated, badOptional] = evaluation.rows
  assert.equal(ready.status, 'ready')
  assert.equal(ready.completeness, 100)
  assert.equal(partial.status, 'partial')
  assert.deepEqual(plain(partial.missing), ['city', 'contactName'])
  assert.equal(noEmail.status, 'invalid')
  assert.deepEqual(plain(noEmail.errors), [{ field: 'contactEmail', code: 'REQUIRED' }])
  assert.deepEqual(plain(badEmail.errors), [{ field: 'contactEmail', code: 'INVALID_EMAIL' }])
  assert.equal(existing.status, 'duplicate')
  assert.equal(existing.matchedExistingId, 'client-9')
  assert.equal(repeated.status, 'invalid')
  assert.deepEqual(plain(repeated.errors), [{ field: 'legalName', code: 'DUPLICATE_IN_FILE' }])
  // An invalid value in a column that is only "needed later" does not reject the row.
  assert.equal(badOptional.status, 'partial')
  assert.deepEqual(plain(badOptional.warnings), [{ field: 'employeeCount', code: 'INVALID_NUMBER' }])
  assert.deepEqual(plain(evaluation.totals), { rows: 7, ready: 1, partial: 2, invalid: 3, duplicates: 1 })
  assert.equal(ready.raw.legalName, 'Client 2')
})

test('evaluateRows reports columns the file does not have', () => {
  const entity = IMPORT_ENTITIES.clients
  const evaluation = form.evaluateRows(entity, [{ rowNumber: 2, raw: { legalName: 'A', contactEmail: 'a@b.co' } }], context(), ['legalName', 'contactEmail'])
  assert.ok(evaluation.columnsMissing.includes('city'))
  assert.ok(!evaluation.columnsMissing.includes('legalName'))
})

test('rows that point at unknown clients, people or certificates are invalid', () => {
  const site = { rowNumber: 2, raw: { ...exampleRow(IMPORT_ENTITIES.client_sites).raw, client: 'Nobody Ltd' } }
  assert.deepEqual(plain(evaluate('client_sites', [site]).rows[0].errors), [{ field: 'client', code: 'CLIENT_NOT_FOUND' }])
  const training = { rowNumber: 2, raw: { ...exampleRow(IMPORT_ENTITIES.trainings).raw, person: 'ghost@nowhere.com' } }
  assert.deepEqual(plain(evaluate('trainings', [training]).rows[0].errors), [{ field: 'person', code: 'PERSON_NOT_FOUND' }])
  const cycle = { rowNumber: 2, raw: { ...exampleRow(IMPORT_ENTITIES.certification_cycles).raw, certificateNumber: 'NOPE-1' } }
  assert.deepEqual(plain(evaluate('certification_cycles', [cycle]).rows[0].errors), [{ field: 'certificateNumber', code: 'CERTIFICATE_NOT_FOUND' }])
})

test('end dates cannot come before start dates', () => {
  const certificate = { rowNumber: 2, raw: { ...exampleRow(IMPORT_ENTITIES.certificates).raw, expiryDate: '2020-01-01' } }
  assert.deepEqual(plain(evaluate('certificates', [certificate]).rows[0].errors), [{ field: 'expiryDate', code: 'INVALID_DATE_RANGE' }])
  const plan = { rowNumber: 2, raw: { ...exampleRow(IMPORT_ENTITIES.audit_plans).raw, endDate: '2026-11-01' } }
  assert.deepEqual(plain(evaluate('audit_plans', [plan]).rows[0].errors), [{ field: 'endDate', code: 'INVALID_DATE_RANGE' }])
})

test('an unknown lead auditor is a warning, not an error', () => {
  const plan = { rowNumber: 2, raw: { ...exampleRow(IMPORT_ENTITIES.audit_plans).raw, leadAuditor: 'Someone New' } }
  const [row] = evaluate('audit_plans', [plan]).rows
  assert.notEqual(row.status, 'invalid')
  assert.deepEqual(plain(row.warnings), [{ field: 'leadAuditor', code: 'PERSON_NOT_IN_REGISTER' }])
})

test('invoice lines with the same number are one record, not duplicates', () => {
  const line = (rowNumber) => ({ rowNumber, raw: exampleRow(IMPORT_ENTITIES.invoices).raw })
  const rows = evaluate('invoices', [line(2), line(3)]).rows
  assert.deepEqual(plain(rows.map((row) => row.status)), [rows[0].status, rows[0].status])
  assert.notEqual(rows[0].status, 'invalid')
})

test('selectRowsToImport follows the chosen options', () => {
  const rows = ['ready', 'partial', 'invalid', 'duplicate'].map((status, index) => ({ rowNumber: index + 2, status }))
  const numbers = (mode, update) => form.selectRowsToImport(rows, mode, update).map((row) => row.status)
  assert.deepEqual(numbers('ready_only', false), ['ready'])
  assert.deepEqual(numbers('include_partial', false), ['ready', 'partial'])
  assert.deepEqual(numbers('ready_only', true), ['ready', 'duplicate'])
  assert.deepEqual(numbers('include_partial', true), ['ready', 'partial', 'duplicate'])
})

test('completeness counts required values double and needed-later values once', () => {
  const entity = IMPORT_ENTITIES.fee_items
  const required = entity.columns.filter((column) => column.required).length
  const later = entity.columns.filter((column) => column.later).length
  assert.equal(form.completenessOf(entity, {}).total, required * 2 + later)
  const onlyRequired = Object.fromEntries(entity.columns.filter((column) => column.required).map((column) => [column.key, 'x']))
  const { filled, total, percent } = form.completenessOf(entity, onlyRequired)
  assert.equal(filled, required * 2)
  assert.equal(percent, Math.round((filled / total) * 100))
})

// ---------------------------------------------------------------- template and report

test('the template has instructions, data (labels, keys, example) and lists', () => {
  const entity = IMPORT_ENTITIES.certificates
  const sheets = form.buildTemplateSheets(entity, 'ar', lists, (key, options) => `${key}${options ? JSON.stringify(options) : ''}`)
  assert.deepEqual(plain(sheets.map((sheet) => sheet.name)), ['Instructions', 'Data', 'Lists'])
  const data = sheets[1].rows
  assert.equal(data.length, 3)
  const first = entity.columns[0]
  assert.equal(data[0][0], `${first.labelAr} * / ${first.labelEn} *`)
  assert.equal(data[1].at(-1), '__template:certificates:v1')
  assert.deepEqual(plain(data[1].slice(0, -1)), plain(entity.columns.map((column) => column.key)))
  assert.deepEqual(plain(data[2]), plain(entity.columns.map((column) => column.example)))
  const listSheet = sheets[2].rows
  assert.ok(listSheet[0].length >= 3 && listSheet.length > 1)
  assert.equal(form.templateFileName('clients'), 'iCASCO_clients_template_v1.xlsx')
})

test('a template downloaded with downloadXlsxWorkbook is read back by the importer', async () => {
  const { downloadXlsxWorkbook } = load('@/lib/xlsxDownload')
  const entity = IMPORT_ENTITIES.clients
  for (const language of ['en', 'ar']) {
    const sheets = form.buildTemplateSheets(entity, language, lists, (key) => key)
    // The user fills one row under the example row.
    const data = sheets.find((sheet) => sheet.name === 'Data')
    data.rows.push(entity.columns.map((column) => (column.key === 'legalName' ? 'Beta & Sons <Trading>' : column.key === 'contactEmail' ? 'beta@example.com' : '')))
    downloadXlsxWorkbook('template.xlsx', sheets)
    const table = await reader.readXlsxTable(await globalThis.__lastBlob.arrayBuffer())
    assert.equal(table.rows.length, 4)
    const parsed = form.tableToImportRows(entity, table)
    assert.equal(parsed.rows.length, 1)
    assert.equal(parsed.rows[0].rowNumber, 4)
    assert.equal(parsed.rows[0].raw.legalName, 'Beta & Sons <Trading>')
    assert.equal(parsed.recognised.length, entity.columns.length)
  }
})

test('an area with no list columns has no Lists sheet', () => {
  const sheets = form.buildTemplateSheets({ ...IMPORT_ENTITIES.fee_items, columns: [{ key: 'name', labelEn: 'Name', labelAr: 'الاسم', type: 'text', example: 'x', required: true }] }, 'en', lists, (key) => key)
  assert.deepEqual(plain(sheets.map((sheet) => sheet.name)), ['Instructions', 'Data'])
})

test('the issues report lists every problem of rows that are not ready', () => {
  const entity = IMPORT_ENTITIES.clients
  const { rows } = evaluate('clients', [clientRow(2), clientRow(3, { contactEmail: '' }), clientRow(4, { city: '' })])
  const report = form.buildIssueReportRows(entity, rows, 'en', (key) => key)
  assert.equal(report.length, 3)
  assert.deepEqual(plain(report[1].slice(0, 4)), ['3', 'cab.dataMigration.status.invalid', entity.columns.find((column) => column.key === 'contactEmail').labelEn, 'cab.dataMigration.issues.REQUIRED'])
  assert.deepEqual(plain(report[2].slice(0, 4)), ['4', 'cab.dataMigration.status.partial', entity.columns.find((column) => column.key === 'city').labelEn, 'cab.dataMigration.report.missingLater'])
})

// ---------------------------------------------------------------- hub summary

const batch = (entity, created, updated = 0) => ({
  id: `b-${entity}-${created}`,
  entity,
  result: { created, updated },
})
const incomplete = (entity, resolvedAt = null) => ({ id: `i-${entity}-${Math.random()}`, entity, resolvedAt })

test('buildOverview shows progress per area and overall', () => {
  const overview = form.buildOverview(
    [batch('clients', 4), batch('personnel', 2), batch('fee_items', 0, 3)],
    [incomplete('clients'), incomplete('clients'), incomplete('personnel', '2026-11-01'), incomplete('personnel', '2026-11-02')],
  )
  const by = (key) => overview.entities.find((status) => status.entity === key)
  assert.equal(overview.entities.length, IMPORT_ENTITY_KEYS.length)
  assert.equal(by('clients').state, 'in_progress')
  assert.equal(by('clients').progress, 50)
  assert.equal(by('personnel').state, 'completed')
  assert.equal(by('personnel').progress, 100)
  assert.equal(by('fee_items').state, 'completed')
  assert.equal(by('invoices').state, 'not_started')
  assert.equal(by('clients').lastImport.id, 'b-clients-4')
  assert.deepEqual(plain(overview.overall), {
    entities: IMPORT_ENTITY_KEYS.length,
    started: 3,
    completed: 2,
    imported: 6,
    incomplete: 2,
    progress: Math.round((50 + 100 + 100) / IMPORT_ENTITY_KEYS.length),
  })
})

// ---------------------------------------------------------------- the mock backend, end to end

const mockStubs = {
  '@/lib/countries': { getCountryOptions: () => [{ code: 'SA', name: 'Saudi Arabia' }, { code: 'EG', name: 'Egypt' }] },
  '@/lib/iafCodes': { IAF_CODES_LIST: [{ code: '03', en: 'Chemicals', ar: 'كيماويات' }, { code: '29', en: 'Wholesale', ar: 'تجارة' }] },
  '@/lib/api/applicationDraftApi': { STANDARD_OPTIONS: ['ISO 9001:2015 - Quality Management'] },
  '@/lib/api/cabEmployeesApi': { CAB_PROFESSIONAL_ROLES: [{ value: 'LEAD_AUDITOR', label: 'Lead Auditor' }] },
  '@/lib/authStorage': { getAuthSession: () => ({ user: { email: 'admin@cab-example.com' } }) },
}

test('the mock backend: preview, import, then the next area sees the new records', async () => {
  const mock = load('@/lib/api/dataMigrationMockData', mockStubs)
  const clients = IMPORT_ENTITIES.clients
  const header = clients.columns.map((column) => column.key)
  const full = (name) => clients.columns.map((column) => (column.key === 'legalName' ? name : column.example))
  const partial = ['Beta Trading', ...header.slice(1).map((key) => (key === 'contactEmail' ? 'beta@example.com' : ''))]

  const hubBefore = await mock.loadMigrationHub()
  assert.equal(hubBefore.overview.overall.started, 0)
  assert.equal(hubBefore.batches.length, 0)

  const preview = await mock.previewImportTable('clients', { rows: [header, full('Gamma Foods'), partial, full('Al Noor Food Industries Co.')] }, 'clients.xlsx')
  assert.deepEqual(plain(preview.totals), { rows: 3, ready: 1, partial: 1, invalid: 0, duplicates: 1 })

  const result = await mock.commitImport(preview.importId, { mode: 'include_partial', duplicates: 'skip' })
  assert.deepEqual(plain({ c: result.created, u: result.updated, s: result.skipped, i: result.incomplete }), { c: 2, u: 0, s: 1, i: 1 })
  await assert.rejects(mock.commitImport(preview.importId, { mode: 'include_partial', duplicates: 'skip' }), errorCode('ALREADY_COMMITTED'))
  await assert.rejects(mock.commitImport('imp-unknown', { mode: 'ready_only', duplicates: 'skip' }), errorCode('IMPORT_NOT_FOUND'))

  const hub = await mock.loadMigrationHub()
  assert.equal(hub.batches[0].createdBy, 'admin@cab-example.com')
  assert.equal(hub.incomplete.length, 1)
  assert.equal(hub.incomplete[0].label, 'Beta Trading')
  assert.equal(hub.overview.entities.find((status) => status.entity === 'clients').state, 'in_progress')

  // Importing the same file again finds the records that now exist.
  const again = await mock.previewImportTable('clients', { rows: [header, full('Gamma Foods')] }, 'again.xlsx')
  assert.equal(again.rows[0].status, 'duplicate')

  // A site of the client that was just imported is accepted; one of an unknown client is not.
  const sites = IMPORT_ENTITIES.client_sites
  const siteRow = (client) => sites.columns.map((column) => (column.key === 'client' ? client : column.example))
  const sitePreview = await mock.previewImportTable('client_sites', { rows: [sites.columns.map((column) => column.key), siteRow('Gamma Foods'), siteRow('Nobody Ltd')] }, 'sites.xlsx')
  assert.deepEqual(plain(sitePreview.rows.map((row) => row.status)), ['ready', 'invalid'])

  await mock.resolveIncompleteRecord(hub.incomplete[0].id)
  const hubAfter = await mock.loadMigrationHub()
  assert.equal(hubAfter.incomplete.length, 0)
  assert.equal(hubAfter.overview.entities.find((status) => status.entity === 'clients').state, 'completed')
})