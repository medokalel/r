// Run: node --test tests/client-certificates.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const compile = (code) =>
  ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText

const matchesSearch = (values, query) => {
  const q = query.trim().toLowerCase()
  return !q || values.some((v) => String(v ?? '').toLowerCase().includes(q))
}
const lib = {}
runInNewContext(compile(read('src/lib/clientCertificates.ts')), {
  exports: lib,
  require: (d) => (d === '@/lib/tableTools' ? { matchesSearch } : {}),
})

const state = { session: null }
const api = {}
runInNewContext(compile(read('src/lib/api/clientCertificatesApi.ts')), {
  exports: api,
  Promise,
  require: (d) => {
    if (d === '@/lib/authStorage') return { getAuthSession: () => state.session }
    if (d === '@/lib/clientCertificates') return lib
    return {}
  },
})

const cert = (n, over = {}) => ({
  id: `cert-${n}`,
  certificateNumber: `CERT-${String(n).padStart(4, '0')}`,
  clientId: 'CL-0001',
  clientName: 'Al Noor Food Industries',
  standard: 'ISO 9001',
  scope: `Scope ${n}`,
  status: 'ISSUED',
  countryCode: 'SA',
  issuedAt: '2025-04-15T10:24:00Z',
  validUntil: '2028-04-13T00:00:00Z',
  ...over,
})

test('certificates are scoped to the signed-in client by organization id or name', () => {
  const items = [cert(1), cert(2, { clientId: 'CL-0002', clientName: 'Other Co' }), cert(3, { clientId: 'x', clientName: ' al noor food industries ' })]
  const mine = lib.scopeCertificatesToClient(items, { id: 'CL-0001', name: 'Al Noor Food Industries' })
  assert.deepEqual(Array.from(mine, (i) => i.certificateNumber), ['CERT-0001', 'CERT-0003'])
  assert.deepEqual(
    Array.from(lib.scopeCertificatesToClient(items, { id: 'CL-0002', name: 'Other Co' }), (i) => i.certificateNumber),
    ['CERT-0002'],
  )
  assert.equal(lib.scopeCertificatesToClient(items, null).length, 0)
  assert.equal(lib.scopeCertificatesToClient(items, {}).length, 0)
})

test('the client feed has no source yet: it is empty for every client, never demo rows', async () => {
  for (const organization of [{ id: 'CL-0001', name: 'Al Noor Food Industries' }, { id: 'CL-0002', name: 'Other Co' }, null]) {
    state.session = { organization }
    assert.equal((await api.listClientCertificates()).length, 0)
  }
})

test('draft certificates never reach the client view', () => {
  const items = [cert(1), cert(2, { status: 'DRAFT' }), cert(3, { status: 'SUPERSEDED' })]
  assert.deepEqual(Array.from(lib.clientVisibleCertificates(items), (i) => i.certificateNumber), ['CERT-0001', 'CERT-0003'])
})

test('search matches number, standard, scope and the localized status label', () => {
  const item = cert(1, { standard: 'ISO 22000', scope: 'Food packaging' })
  for (const q of ['cert-0001', '22000', 'packaging', 'issued']) {
    assert.ok(lib.certificateMatchesSearch(item, q, 'Issued'), q)
  }
  assert.ok(!lib.certificateMatchesSearch(item, 'withdrawn', 'Issued'))
  assert.ok(lib.certificateMatchesSearch(item, '', 'Issued'))
})

test('superseded keeps a client-local label key and every status has a badge style', () => {
  assert.equal(lib.clientCertificateStatusLabelKey('SUPERSEDED'), 'clientCertificates.status.superseded')
  assert.equal(lib.clientCertificateStatusLabelKey('ISSUED'), 'cab.certificateRegister.status.issued')
  assert.equal(lib.clientCertificateStatusLabelKey('WITHDRAWN'), 'cab.certificateRegister.status.withdrawn')
  for (const status of ['DRAFT', 'ISSUED', 'SUSPENDED', 'WITHDRAWN', 'SUPERSEDED']) {
    assert.ok(lib.CLIENT_CERTIFICATE_STATUS_STYLES[status], status)
  }
})

test('standards split into one chip each without duplicates', () => {
  assert.deepEqual(Array.from(lib.splitStandards('ISO 9001, ISO 14001; ISO 9001')), ['ISO 9001', 'ISO 14001'])
  assert.deepEqual(Array.from(lib.splitStandards('ISO 9001:2015 + ISO 45001:2018')), ['ISO 9001:2015', 'ISO 45001:2018'])
  assert.deepEqual(Array.from(lib.splitStandards('')), [])
})

test('pagination shows 10 per page and clamps the page number', () => {
  const items = Array.from({ length: 23 }, (_, i) => cert(i + 1))
  const first = lib.paginateCertificates(items, 1)
  assert.equal(first.items.length, 10)
  assert.equal(first.totalPages, 3)
  assert.equal(lib.paginateCertificates(items, 3).items.length, 3)
  assert.equal(lib.paginateCertificates(items, 9).page, 3)
  assert.equal(lib.paginateCertificates([], 1).totalPages, 1)
})

test('dates format in the active language and show a dash when empty or invalid', () => {
  const stamp = '2025-04-15T10:24:00Z'
  assert.equal(
    lib.formatCertificateDate(stamp, 'en'),
    new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(stamp)),
  )
  assert.equal(lib.formatCertificateDate(null, 'en'), '—')
  assert.equal(lib.formatCertificateDate('not-a-date', 'en'), '—')
})
