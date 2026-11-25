// Run: node --test tests/client-quotations.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function makeStorage() {
  const map = new Map()
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
  }
}

function load(session) {
  const exports = {}
  const source = readFileSync(new URL('../src/lib/api/clientQuotationsApi.ts', import.meta.url), 'utf8')
  const localStorage = makeStorage()
  runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports, localStorage, Date, JSON, Promise,
    require: (dependency) => (dependency === '@/lib/authStorage' ? { getAuthSession: () => session } : {}),
  })
  return exports
}

const ctx = { applicationId: 'app-1', applicationNumber: 'APP-1', clientName: 'ISSC', organizationId: 'org-1' }
const quotation = (over = {}) => ({
  id: 'q-1', quotationNumber: 'QUO-1', status: 'ISSUED', offerEndDate: '2999-01-01',
  currency: 'USD', totalAmount: '100', standardCodesUsed: ['ISO_9001'], events: [], additionalItems: [], ...over,
})
const clientSession = { organization: { id: 'org-1', name: 'Other name' } }

test('an issued quotation reaches the matching client only', async () => {
  const api = load(clientSession)
  api.syncQuotationToClient(quotation(), ctx)
  assert.equal((await api.listClientQuotations()).length, 1)
  assert.equal((await api.getClientQuotation('QUO-1')).quotationId, 'q-1')
  const other = load({ organization: { id: 'org-2', name: 'Someone Else' } })
  assert.equal((await other.listClientQuotations()).length, 0)
})

test('organization name match works without an id match, case-insensitive', async () => {
  const api = load({ organization: { id: 'x', name: '  issc ' } })
  api.syncQuotationToClient(quotation(), ctx)
  assert.equal((await api.listClientQuotations()).length, 1)
})

test('drafts are not published and cancelled quotations are withdrawn', async () => {
  const api = load(clientSession)
  api.syncQuotationToClient(quotation({ status: 'CREATED' }), ctx)
  assert.equal((await api.listClientQuotations()).length, 0)
  api.syncQuotationToClient(quotation(), ctx)
  api.syncQuotationToClient(quotation({ status: 'CANCELLED' }), ctx)
  assert.equal((await api.listClientQuotations()).length, 0)
})

test('accept records the decision and the CAB can read it', async () => {
  const api = load(clientSession)
  api.syncQuotationToClient(quotation(), ctx)
  const updated = await api.acceptClientQuotation('q-1')
  assert.equal(api.getClientQuotationState(updated), 'accepted')
  assert.equal(api.getQuotationClientRecord('q-1').decision.decision, 'accepted')
  assert.equal(await api.acceptClientQuotation('q-1'), null)
})

test('reject needs a reason of 10+ characters and stores it', async () => {
  const api = load(clientSession)
  api.syncQuotationToClient(quotation(), ctx)
  assert.equal(await api.rejectClientQuotation('q-1', 'too short'), null)
  const updated = await api.rejectClientQuotation('q-1', '  Price is above our budget  ')
  assert.equal(api.getClientQuotationState(updated), 'rejected')
  assert.equal(updated.decision.reason, 'Price is above our budget')
})

test('a re-sync keeps the client decision and the first publish time', async () => {
  const api = load(clientSession)
  api.syncQuotationToClient(quotation(), ctx)
  const first = api.getQuotationClientRecord('q-1').publishedAt
  await api.acceptClientQuotation('q-1')
  api.syncQuotationToClient(quotation({ totalAmount: '120' }), ctx)
  const record = api.getQuotationClientRecord('q-1')
  assert.equal(record.decision.decision, 'accepted')
  assert.equal(record.publishedAt, first)
  assert.equal(record.quotation.totalAmount, '120')
})

test('an expired quotation cannot be decided', async () => {
  const api = load(clientSession)
  api.syncQuotationToClient(quotation({ offerEndDate: '2000-01-01' }), ctx)
  const record = api.getQuotationClientRecord('q-1')
  assert.equal(api.getClientQuotationState(record), 'expired')
  assert.equal(await api.acceptClientQuotation('q-1'), null)
})

test('effective status shows the client decision to the CAB', () => {
  const api = load(clientSession)
  assert.equal(api.effectiveQuotationStatus('ISSUED', null), 'ISSUED')
  assert.equal(api.effectiveQuotationStatus('ISSUED', { decision: { decision: 'rejected' } }), 'REJECTED')
})
