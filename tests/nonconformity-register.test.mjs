import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function load(path, extra = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8')
  const exports = {}
  runInNewContext(
    ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { exports, Date, Math, Number, String, Array, Set, JSON, ...extra },
  )
  return exports
}
const nc = load('../src/lib/api/nonconformityRegister.ts')
const plain = (v) => JSON.parse(JSON.stringify(v))

const finding = (over = {}) => ({
  id: 'f1', findingCode: 'FND-01', status: 'Submitted', planId: 'plan-1', planNumber: 'AUD-0001', clauseRef: '8.5.1',
  findingType: 'Nonconformity', classification: 'major', requirementRef: 'ISO 9001 8.5.1', statement: 'Records missing',
  dueDate: '2026-12-20', contact: 'Sara', createdAt: '2026-11-20T10:00:00.000Z', ...over,
})
const plan = { id: 'plan-1', planNumber: 'AUD-0001', clientName: 'Al Noor', clientCode: 'CL-1', country: 'Egypt', siteName: 'HQ', standardName: 'ISO 9001', leadAuditor: 'Omar', primaryContactName: 'Sara', primaryContactEmail: 's@x.com' }
const raise = (over = {}, codes = []) => nc.buildFromFinding({ record: finding(over), plan, cabId: 'cab', existingCodes: codes, now: '2026-11-21T09:00:00.000Z', by: 'Me' })

test('only submitted nonconformity findings bound to an audit raise an entry', () => {
  assert.equal(nc.isRaisingFinding(finding()), true)
  assert.equal(nc.isRaisingFinding(finding({ status: 'Draft' })), false)
  assert.equal(nc.isRaisingFinding(finding({ findingType: 'Observation' })), false)
  assert.equal(nc.isRaisingFinding(finding({ planId: null, planNumber: null })), false)
})

test('raised entry keeps audit and finding binding', () => {
  const n = raise()
  assert.equal(n.ncId, 'NC-0001')
  assert.equal(n.planId, 'plan-1')
  assert.equal(n.findingRecordId, 'f1')
  assert.equal(n.findingCode, 'FND-01')
  assert.equal(n.classification, 'major')
  assert.equal(n.clientName, 'Al Noor')
  assert.equal(n.raisedDate, '2026-11-20')
  assert.equal(n.events[0].code, 'raised')
})

test('NC codes continue the highest number', () => {
  assert.equal(nc.nextNcCode([]), 'NC-0001')
  assert.equal(nc.nextNcCode(['NC-0004', 'NC-2025-031', 'nc-0002']), 'NC-0005')
})

test('findings without an entry are found, bound ones are not', () => {
  const n = raise()
  assert.deepEqual(plain(nc.findingsWithoutNonconformity([finding(), finding({ id: 'f2' })], [n]).map((r) => r.id)), ['f2'])
})

test('refresh follows the finding and never touches the response', () => {
  const n = { ...raise(), correction: 'fixed', status: 'in_progress' }
  const r = nc.refreshFromFinding(n, finding({ classification: 'critical', statement: 'New text' }), plan)
  assert.equal(r.classification, 'critical')
  assert.equal(r.statement, 'New text')
  assert.equal(r.correction, 'fixed')
  assert.equal(r.status, 'in_progress')
})

test('overdue is computed from the due date for open and in-progress only', () => {
  const n = raise()
  assert.equal(nc.toView(n, '2026-12-21').displayStatus, 'overdue')
  assert.equal(nc.toView(n, '2026-12-20').displayStatus, 'open')
  assert.equal(nc.toView({ ...n, status: 'submitted' }, '2027-01-01').displayStatus, 'submitted')
  assert.equal(nc.toView({ ...n, status: 'closed' }, '2027-01-01').displayStatus, 'closed')
})

test('stage cards follow the response and status', () => {
  let n = { ...raise(), correction: 'c', rootCause: 'r', correctiveAction: 'a' }
  assert.deepEqual(plain(nc.deriveStages(n).map((s) => s.status)), ['pending', 'pending', 'pending', 'pending'])
  n = { ...n, status: 'submitted' }
  assert.deepEqual(plain(nc.deriveStages(n).map((s) => s.status)), ['submitted', 'submitted', 'submitted', 'pending'])
  n = { ...n, status: 'in_progress', revisionRequested: true, reviewerComments: 'fix it' }
  assert.deepEqual(plain(nc.deriveStages(n).map((s) => s.status)), ['rejected', 'rejected', 'rejected', 'rejected'])
  n = { ...n, status: 'closed', revisionRequested: false, effectivenessResult: 'effective' }
  assert.deepEqual(plain(nc.deriveStages(n).map((s) => s.status)), ['accepted', 'accepted', 'accepted', 'accepted'])
})

test('pipeline groups by displayed status', () => {
  const a = nc.toView(raise(), '2026-11-22')
  const b = nc.toView({ ...raise({}, ['NC-0001']), status: 'closed' }, '2026-11-22')
  const c = nc.toView(raise({ dueDate: '2026-01-01' }, ['NC-0001', 'NC-0002']), '2026-11-22')
  const g = nc.groupByStatus([a, b, c])
  assert.equal(g.open.length, 1)
  assert.equal(g.closed.length, 1)
  assert.equal(g.overdue.length, 1)
})

test('previous and next follow the list', () => {
  const l = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  assert.deepEqual(plain(nc.neighbours(l, 'a')), { prev: null, next: 'b', index: 0 })
  assert.deepEqual(plain(nc.neighbours(l, 'c')), { prev: 'b', next: null, index: 2 })
  assert.equal(nc.neighbours(l, 'zzz').index, -1)
})

test('filters match code, audit, client, status, country and raised period', () => {
  const v = (o) => nc.toView(o, '2026-11-22')
  const a = v(raise())
  const b = v({ ...raise({}, ['NC-0001']), country: 'Saudi Arabia', raisedDate: '2026-01-05' })
  assert.equal(nc.filterViews([a, b], { query: 'aud-0001' }).length, 2)
  assert.equal(nc.filterViews([a, b], { query: 'noor' }).length, 2)
  assert.equal(nc.filterViews([a, b], { country: 'Egypt' }).length, 1)
  assert.equal(nc.filterViews([a, b], { from: '2026-11-01' }).length, 1)
  assert.equal(nc.filterViews([a, b], { status: 'closed' }).length, 0)
})

const row = (over = {}) => ({ client: 'Al Noor', reference: 'NC-2025-031', auditReference: 'aud-0001', clause: '8.5.1', grade: 'MAJOR', description: 'Old', dueDate: '2026-12-01', status: 'IN_PROGRESS', ...over })
const imp = (values, codes = []) => nc.buildFromImport({ values, plans: [plan], cabId: 'cab', existingCodes: codes, fileName: 'old.xlsx', now: '2026-11-21T09:00:00.000Z', by: 'Me' })

test('import maps grade, status and links the audit by reference', () => {
  const n = imp(row())
  assert.equal(n.ncId, 'NC-2025-031')
  assert.equal(n.source, 'import')
  assert.equal(n.classification, 'major')
  assert.equal(n.status, 'in_progress')
  assert.equal(n.planId, 'plan-1')
  assert.equal(n.clientName, 'Al Noor')
  assert.equal(n.events[0].code, 'imported')
})

test('import without a matching audit keeps the typed reference and client', () => {
  const n = imp(row({ auditReference: 'SV1-2025', client: 'Delta Steel' }))
  assert.equal(n.planId, null)
  assert.equal(n.planNumber, 'SV1-2025')
  assert.equal(n.clientName, 'Delta Steel')
})

test('import with a taken reference gets a fresh NC code; unknown status is open', () => {
  const n = imp(row({ status: 'whatever' }), ['NC-2025-031'])
  assert.equal(n.ncId, 'NC-0001')
  assert.equal(n.status, 'open')
})

test('import update changes only the values the row has', () => {
  const n = imp(row())
  const u = nc.updateFromImport(n, { description: 'New', clause: '' })
  assert.equal(u.statement, 'New')
  assert.equal(u.clause, '8.5.1')
  assert.equal(u.classification, 'major')
})

// ---- close / submit gates ----
const complete = (over = {}) => ({
  ...raise(),
  status: 'submitted', correction: 'Fixed', rootCause: 'Training gap', correctiveAction: 'Retrain', responsiblePerson: 'Sara', targetDate: '2026-12-01',
  evidence: [{ id: 'e1', name: 'a.pdf', version: 1, uploadedAt: '', sizeLabel: '1 KB', dataUrl: 'data:' }],
  reviewerComments: 'Checked on site', effectivenessResult: 'effective', ...over,
})

test('close needs a submitted, complete response and a verification record', () => {
  assert.deepEqual(plain(nc.closeBlockers(complete())), [])
  assert.deepEqual(plain(nc.closeBlockers(complete({ status: 'in_progress' }))), ['notSubmitted'])
  assert.deepEqual(plain(nc.closeBlockers(complete({ status: 'open', correction: '', rootCause: '', correctiveAction: '', evidence: [] }))), ['notSubmitted', 'correction', 'rootCause', 'correctiveAction', 'evidence'])
  assert.deepEqual(plain(nc.closeBlockers(complete({ evidence: [] }))), ['evidence'])
  assert.deepEqual(plain(nc.closeBlockers(complete({ reviewerComments: '  ' }))), ['verification'])
  assert.deepEqual(plain(nc.closeBlockers(complete({ effectivenessResult: 'not_reviewed' }))), ['verification'])
  assert.deepEqual(plain(nc.closeBlockers(complete({ effectivenessResult: 'not_effective' }))), ['notEffective'])
  assert.deepEqual(plain(nc.closeBlockers(complete({ effectivenessResult: 'partially_effective' }))), ['notEffective'])
  assert.deepEqual(plain(nc.closeBlockers(complete({ status: 'closed' }))), ['closed'])
})

test('submit needs every part of the response, including evidence', () => {
  assert.deepEqual(plain(nc.submitBlockers(complete({ status: 'in_progress' }))), [])
  assert.deepEqual(plain(nc.submitBlockers(complete({ evidence: undefined, rootCause: '' }))), ['rootCause', 'evidence'])
  assert.deepEqual(plain(nc.submitBlockers(complete({ status: 'closed' }))), ['closed'])
})

test('a closed item without a verification record does not show verification as accepted', () => {
  const legacy = nc.toView({ ...complete({ status: 'closed', reviewerComments: '', effectivenessResult: 'not_reviewed' }) }, '2026-11-26')
  assert.equal(legacy.stages.find((s) => s.stage === 'verification').status, 'pending')
  const done = nc.toView(complete({ status: 'closed' }), '2026-11-26')
  assert.equal(done.stages.find((s) => s.stage === 'verification').status, 'accepted')
  assert.equal(done.progress, 4)
})

// ---- the mutator cannot go around the gates ----
function loadApi(records = [], plans = [plan]) {
  const store = new Map()
  const localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => void store.set(k, v) }
  const source = readFileSync(new URL('../src/lib/api/cabNonconformitiesApi.ts', import.meta.url), 'utf8')
  const exports = {}
  const mods = {
    '@/lib/api/nonconformityRegister': nc,
    '@/lib/api/cabAuditReportingApi': { currentFindingsOwner: () => 'cab', listFindingRecords: () => records },
    '@/lib/api/cabAuditPlanningApi': { fetchAuditPlans: async () => plans },
    '@/lib/authStorage': { getAuthSession: () => null },
  }
  runInNewContext(
    ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { exports, require: (m) => mods[m], localStorage, Date, Math, Number, String, Array, Set, JSON, Promise, Map, Error },
  )
  return { api: exports, store }
}

test('updateNonconformity refuses submit and close that skip the rules, even with no event', async () => {
  const { api, store } = loadApi()
  const base = { ...raise(), cabId: 'cab' }
  store.set('icasco_cab_nonconformities_v1', JSON.stringify([base]))
  await assert.rejects(api.updateNonconformity(base.id, { status: 'closed' }), /notSubmitted/)
  await assert.rejects(api.updateNonconformity(base.id, { status: 'submitted' }, { code: 'submitted' }), /correction/)
  await assert.rejects(api.updateNonconformity(base.id, { status: 'closed' }, { code: 'closed' }), /notSubmitted/)
  await assert.rejects(api.updateNonconformity(base.id, {}, { code: 'revision' }), /notSubmitted/)
  assert.equal(JSON.parse(store.get('icasco_cab_nonconformities_v1'))[0].status, 'open')
  // fill everything, submit, then close
  await api.setNonconformityEvidence(base.id, complete().evidence)
  const fields = { correction: 'Fixed', rootCause: 'Gap', correctiveAction: 'Retrain', responsiblePerson: 'Sara', targetDate: '2026-12-01' }
  await api.updateNonconformity(base.id, { ...fields, status: 'submitted' }, { code: 'submitted' })
  await assert.rejects(api.updateNonconformity(base.id, { status: 'closed' }, { code: 'closed' }), /verification/)
  await assert.rejects(api.updateNonconformity(base.id, { status: 'closed', reviewerComments: 'x', effectivenessResult: 'not_effective' }, { code: 'closed' }), /notEffective/)
  const closed = await api.updateNonconformity(base.id, { status: 'closed', reviewerComments: 'ok', effectivenessResult: 'effective' }, { code: 'closed' })
  assert.equal(closed.status, 'closed')
  await assert.rejects(api.updateNonconformity(base.id, { correction: 'changed' }), /closed/)
  await assert.rejects(api.setNonconformityEvidence(base.id, []), /closed/)
})

test('evidence persists with the nonconformity and is kept across a reload', async () => {
  const { api, store } = loadApi()
  const base = { ...raise(), cabId: 'cab' }
  store.set('icasco_cab_nonconformities_v1', JSON.stringify([base]))
  await api.setNonconformityEvidence(base.id, complete().evidence)
  assert.equal(api.listStoredNonconformities()[0].evidence[0].name, 'a.pdf')
})

test('an import row binds only to a plan of the current CAB, else stays unlinked', () => {
  const row = (ref) => nc.buildFromImport({ values: { reference: 'X-1', auditReference: ref, description: 'd' }, plans: [plan], cabId: 'cab', existingCodes: [], fileName: 'f.csv', now: '2026-11-21T09:00:00.000Z', by: 'Me' })
  assert.equal(row('aud-0001').planId, 'plan-1')
  assert.equal(row('AUD-9999').planId, null)
  assert.equal(row('').planId, null)
})

test('import links only to a plan that one of the current CAB findings proves it owns', async () => {
  const other = { ...plan, id: 'plan-9', planNumber: 'AUD-0900' }
  const run = async (records, ref) => {
    const { api } = loadApi(records, [plan, other])
    await api.importNonconformityRows([{ values: { reference: 'X-1', auditReference: ref, description: 'd' }, update: false }], 'f.csv')
    return api.listStoredNonconformities()[0]
  }
  assert.equal((await run([finding()], 'AUD-0001')).planId, 'plan-1')
  assert.equal((await run([finding()], 'AUD-0900')).planId, null)
  assert.equal((await run([], 'AUD-0001')).planId, null)
})
