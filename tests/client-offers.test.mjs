// Run: node --test tests/client-offers.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function transpile(path) {
  return ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
}
function run(path, requires, extra = {}) {
  const exports = {}
  runInNewContext(transpile(path), { exports, Date, JSON, Promise, Number, String, Math, RegExp, ...extra,
    require: (name) => requires[name] ?? {} })
  return exports
}

const api = run('../src/lib/api/clientQuotationsApi.ts', {}, { localStorage: { getItem: () => null, setItem() {} } })
const offers = run('../src/lib/clientOffersList.ts', { '@/lib/api/clientQuotationsApi': api })
const routes = run('../src/lib/routes.ts', { '@/lib/authStorage': {} })

const NOW = new Date('2026-11-25T12:00:00')
const rec = (n, over = {}, decision) => ({
  quotationId: `id-${n}`, applicationId: `a${n}`, applicationNumber: `APP-${n}`, clientName: 'ISSC', organizationId: 'o',
  publishedAt: '2026-11-20T10:00:00Z',
  quotation: { id: `id-${n}`, quotationNumber: `QUO-${n}`, status: 'ISSUED', offerEndDate: '2999-01-01', currency: 'USD',
    totalAmount: '100', standardCodesUsed: [], events: [], additionalItems: [], ...over },
  ...(decision ? { decision } : {}),
})
const set = [
  rec('001'),
  rec('002', {}, { decision: 'accepted', at: 'x' }),
  rec('003', {}, { decision: 'rejected', reason: 'too expensive!', at: 'x' }),
  rec('004', { offerEndDate: '2026-10-01' }),
]

test('client routes use /offers and the old /quotations address is still registered as an alias', () => {
  assert.equal(routes.ROUTES.quotations, '/offers')
  assert.equal(routes.ROUTES.quotationDetails, '/offers/:quotationId')
  assert.equal(routes.ROUTES.legacyQuotations, '/quotations')
  assert.equal(routes.ROUTES.legacyQuotationDetails, '/quotations/:quotationId')
  assert.equal(routes.clientQuotationPath('a b/1'), '/offers/a%20b%2F1')
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
  assert.match(app, /path=\{ROUTES\.legacyQuotations\}/)
  assert.match(app, /path=\{ROUTES\.legacyQuotationDetails\}/)
  assert.match(app, /Navigate to=\{quotationId \? clientQuotationPath\(quotationId\) : ROUTES\.quotations\}/)
})

test('filter by status uses client states (issued, accepted, rejected, expired)', () => {
  const ids = (filter) => offers.filterClientOffers(set, '', filter, NOW).map((r) => r.quotationId)
  assert.deepEqual(ids('all'), ['id-001', 'id-002', 'id-003', 'id-004'])
  assert.deepEqual(ids('pending'), ['id-001'])
  assert.deepEqual(ids('accepted'), ['id-002'])
  assert.deepEqual(ids('rejected'), ['id-003'])
  assert.deepEqual(ids('expired'), ['id-004'])
})

test('search matches offer number or request number, case-insensitive, and combines with the filter', () => {
  const ids = (s, f = 'all') => offers.filterClientOffers(set, s, f, NOW).map((r) => r.quotationId)
  assert.deepEqual(ids('quo-002'), ['id-002'])
  assert.deepEqual(ids('  APP-003 '), ['id-003'])
  assert.deepEqual(ids('QUO'), ['id-001', 'id-002', 'id-003', 'id-004'])
  assert.deepEqual(ids('QUO', 'rejected'), ['id-003'])
  assert.deepEqual(ids('nothing'), [])
})

test('pagination: 10 per page, page clamps into range, empty list still has 1 page', () => {
  const items = Array.from({ length: 23 }, (_, i) => i)
  const p1 = offers.paginateOffers(items, 1)
  assert.equal(p1.totalPages, 3)
  assert.equal(p1.items.length, 10)
  assert.deepEqual(offers.paginateOffers(items, 3).items, [20, 21, 22])
  assert.equal(offers.paginateOffers(items, 99).page, 3)
  assert.equal(offers.paginateOffers(items, 0).page, 1)
  const empty = offers.paginateOffers([], 1)
  assert.equal(empty.totalPages, 1)
  assert.deepEqual(empty.items, [])
})

test('CSV: BOM, CRLF rows, quotes doubled, commas kept inside the cell, formulas neutralised', () => {
  assert.equal(offers.csvCell('a,"b"'), '"a,""b"""')
  assert.equal(offers.csvCell('=SUM(A1)'), '"\'=SUM(A1)"')
  assert.equal(offers.csvCell('-5'), '"\'-5"')
  assert.equal(offers.csvCell('QUO-1'), '"QUO-1"')
  const weird = rec('5', { quotationNumber: 'Q,"5"', totalAmount: '1250.5' })
  const csv = offers.buildOffersCsv([weird, set[1]], ['Offer', 'Amount', 'Currency', 'Valid until', 'Status'], (s) => s.toUpperCase(), NOW)
  assert.equal(csv.charCodeAt(0), 0xfeff)
  const lines = csv.slice(1).split('\r\n')
  assert.equal(lines.length, 3)
  assert.equal(lines[0], '"Offer","Amount","Currency","Valid until","Status"')
  assert.equal(lines[1], '"Q,""5""","1250.5","USD","2999-01-01","PENDING"')
  assert.equal(lines[2], '"QUO-002","100","USD","2999-01-01","ACCEPTED"')
})
