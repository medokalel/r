// Run: node --test tests/client-audits-list.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function transpile(path, requireFn) {
  const exports = {}
  const source = readFileSync(new URL(path, import.meta.url), 'utf8')
  runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    { exports, Date, Math, Set, Promise, JSON, require: requireFn },
  )
  return exports
}

const api = transpile('../src/lib/api/clientAuditsApi.ts', () => ({}))
const list = transpile('../src/lib/clientAuditsList.ts', (dep) =>
  dep === '@/lib/api/clientAuditsApi' ? api : {},
)

const plan = (id, over = {}, prep = {}) => ({
  id,
  planNumber: `AUD-${id}`,
  stage: 'Stage 1',
  standards: ['ISO 9001:2015'],
  siteName: 'ISSC Head Office',
  leadAuditor: 'Omar Hassan',
  proposedStartDate: '2026-12-05',
  proposedEndDate: '2026-12-07',
  execution: { preparation: { planSentToClient: true, ...prep } },
  ...over,
})

const plans = [
  plan('0310'),
  plan('0311', { stage: 'Stage 2', standards: ['ISO 14001:2015', 'ISO 45001:2018'], proposedStartDate: '2027-01-18', proposedEndDate: '2027-01-21' }, { planConfirmedByClient: true }),
  plan('0312', { stage: 'Surveillance 1', siteName: 'ISSC Alexandria Plant', proposedStartDate: '2027-03-02', proposedEndDate: '2027-03-03' }, { clientResponse: { decision: 'objection' } }),
]
const none = list.EMPTY_AUDIT_FILTERS
const ids = (result) => result.map((p) => p.id)

test('no filters keeps every plan', () => {
  assert.deepEqual(ids(list.filterClientAudits(plans, none)), ['0310', '0311', '0312'])
})

test('search matches plan number, site, auditor, stage and specification', () => {
  assert.deepEqual(ids(list.filterClientAudits(plans, { ...none, search: 'aud-0311' })), ['0311'])
  assert.deepEqual(ids(list.filterClientAudits(plans, { ...none, search: 'alexandria' })), ['0312'])
  assert.deepEqual(ids(list.filterClientAudits(plans, { ...none, search: 'iso 45001' })), ['0311'])
  assert.deepEqual(ids(list.filterClientAudits(plans, { ...none, search: 'nothing' })), [])
})

test('specification, stage and confirmation filters', () => {
  assert.deepEqual(ids(list.filterClientAudits(plans, { ...none, specification: 'ISO 14001:2015' })), ['0311'])
  assert.deepEqual(ids(list.filterClientAudits(plans, { ...none, stage: 'Surveillance 1' })), ['0312'])
  assert.deepEqual(ids(list.filterClientAudits(plans, { ...none, confirmation: 'pending' })), ['0310'])
  assert.deepEqual(ids(list.filterClientAudits(plans, { ...none, confirmation: 'confirmed' })), ['0311'])
  assert.deepEqual(ids(list.filterClientAudits(plans, { ...none, confirmation: 'objected' })), ['0312'])
})

test('date range keeps plans whose dates overlap it', () => {
  const range = (from, to) => ({ ...none, from: new Date(from), to: to ? new Date(to) : null })
  assert.deepEqual(ids(list.filterClientAudits(plans, range('2026-12-07T00:00:00', '2027-01-18T00:00:00'))), ['0310', '0311'])
  assert.deepEqual(ids(list.filterClientAudits(plans, range('2027-02-01T00:00:00', '2027-03-01T00:00:00'))), [])
  assert.deepEqual(ids(list.filterClientAudits(plans, range('2027-01-01T00:00:00', null))), ['0311', '0312'])
})

test('pagination clamps the page and reports page count', () => {
  const many = Array.from({ length: 23 }, (_, i) => i)
  assert.equal(list.paginateAudits(many, 1).items.length, 10)
  assert.equal(list.paginateAudits(many, 3).items.length, 3)
  assert.equal(list.paginateAudits(many, 9).page, 3)
  assert.equal(list.paginateAudits([], 1).totalPages, 1)
})

test('specification and stage options come from the plans', () => {
  assert.deepEqual([...list.auditSpecifications(plans)], ['ISO 14001:2015', 'ISO 45001:2018', 'ISO 9001:2015'])
  assert.deepEqual([...list.auditStages(plans)], ['Stage 1', 'Stage 2', 'Surveillance 1'])
})
