// Run: node --test tests/client-audit-results.test.mjs
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
    { exports, Date, Math, Set, Promise, JSON, Boolean, require: requireFn },
  )
  return exports
}

const stage = transpile('../src/lib/api/stageReport.ts', () => ({}))
const results = transpile('../src/lib/clientAuditResults.ts', () => ({}))

let session = { organization: { name: 'Al Noor Food Industries' } }
let store = []
const saved = []
const planning = {
  fetchAuditPlanById: async (id) => store.find((p) => p.id === id || p.planNumber === id) ?? null,
  fetchAuditPlans: async () => store,
  saveAuditPlan: async (partial) => {
    const i = store.findIndex((p) => p.id === partial.id)
    store[i] = { ...store[i], ...partial }
    saved.push(partial)
    return store[i]
  },
}
const api = transpile('../src/lib/api/clientAuditsApi.ts', (dep) => {
  if (dep === '@/lib/api/cabAuditPlanningApi') return planning
  if (dep === '@/lib/api/auditPlanLifecycleApi') return { createPlanEvent: () => ({}) }
  if (dep === '@/lib/authStorage') return { getAuthSession: () => session }
  if (dep === '@/lib/api/stageReport') return stage
  if (dep === '@/lib/clientAuditResults') return results
  return {}
})

const snapshot = { planNumber: 'AUD-0310', clientName: 'Al Noor Food Industries', executiveSummary: 'S' }
const issued = (over = {}) => ({
  version: 1, status: 'issued', sections: {}, reviewer: 'R', reviewComment: '',
  issuedAt: '2026-12-10T10:00:00.000Z', snapshot, events: [], ...over,
})
const NOW = '2026-12-11T09:00:00.000Z'

test('acknowledge needs an issued report with a snapshot', () => {
  for (const status of ['draft', 'inReview', 'approved', 'returned']) {
    const r = stage.acknowledgeReport(issued({ status }), { name: 'Sara' }, NOW)
    assert.equal(r.ok, false)
    assert.equal(r.error, 'wrongState')
  }
  assert.equal(stage.acknowledgeReport(issued({ snapshot: undefined }), { name: 'Sara' }, NOW).ok, false)
})

test('acknowledge requires a name and trims input', () => {
  assert.equal(stage.acknowledgeReport(issued(), { name: '   ' }, NOW).error, 'nameRequired')
  const r = stage.acknowledgeReport(issued(), { name: '  Sara  ', note: '  thanks ' }, NOW)
  assert.equal(r.ok, true)
  assert.deepEqual({ ...r.next.acknowledgement }, { by: 'Sara', note: 'thanks', at: NOW })
  const events = r.next.events
  assert.equal(events[events.length - 1].action, 'acknowledged')
})

test('acknowledge works once and leaves the snapshot untouched', () => {
  const first = stage.acknowledgeReport(issued(), { name: 'Sara' }, NOW)
  assert.equal(first.next.snapshot, snapshot)
  assert.equal(first.next.status, 'issued')
  const second = stage.acknowledgeReport(first.next, { name: 'Other' }, NOW)
  assert.equal(second.ok, false)
  assert.equal(second.error, 'alreadyAcknowledged')
})

test('report status: hidden until issued, then issued, then acknowledged', () => {
  assert.equal(results.getClientReportStatus({}), 'notIssued')
  assert.equal(results.getClientReportStatus({ stageReport: issued({ status: 'approved' }) }), 'notIssued')
  assert.equal(results.getClientReportStatus({ stageReport: issued() }), 'issued')
  const ack = stage.acknowledgeReport(issued(), { name: 'Sara' }, NOW).next
  assert.equal(results.getClientReportStatus({ stageReport: ack }), 'acknowledged')
  assert.equal(results.getClientReportAcknowledgement({ stageReport: ack }).by, 'Sara')
  assert.equal(results.getClientReportAcknowledgement({}), null)
})

test('execution summary maps meetings and hides internal data', () => {
  const plan = {
    execution: {
      started: true,
      completedSteps: [1, 2, 3],
      internalNotes: 'secret',
      openingMeeting: { attendees: [{ id: 'a', name: 'Sara', position: 'QA', organization: 'Client', attendedRemotely: true, signature: 'sig' }] },
      closingMeeting: { findingsPresented: true, clientPosition: 'Agrees', clientComments: 'ok', ncResponseDueBy: '2027-01-10', attendees: [] },
    },
  }
  const s = results.getClientExecutionSummary(plan)
  assert.equal(s.started, true)
  assert.equal(s.opening.held, true)
  assert.equal(s.closing.held, false)
  assert.deepEqual(Object.keys(s.opening.attendees[0]).sort(), ['attendedRemotely', 'id', 'name', 'organization', 'position'])
  assert.equal(s.closing.clientPosition, 'Agrees')
  assert.equal(JSON.stringify(s).includes('secret'), false)
  assert.equal(results.getClientExecutionSummary({}).started, false)
  assert.equal(results.getClientExecutionSummary({ execution: { started: true, completedSteps: [5] } }).closing.held, true)
})

const mkPlan = (over = {}) => ({
  id: 'p1', planNumber: 'AUD-0310', clientName: 'Al Noor Food Industries',
  execution: { preparation: { planSentToClient: true } }, stageReport: issued(), ...over,
})

test('client report is visible only to the addressed client and only when issued', async () => {
  store = [mkPlan()]
  assert.equal((await api.getClientAuditReport('AUD-0310')).id, 'p1')
  session = { organization: { name: 'Another Client Co' } }
  assert.equal(await api.getClientAuditReport('AUD-0310'), null)
  session = { organization: { name: 'Al Noor Food Industries' } }
  store = [mkPlan({ stageReport: issued({ status: 'approved' }) })]
  assert.equal(await api.getClientAuditReport('AUD-0310'), null)
  store = [mkPlan({ execution: { preparation: { planSentToClient: false } } })]
  assert.equal(await api.getClientAuditReport('AUD-0310'), null)
})

test('client acknowledgement is saved once through the plan store', async () => {
  store = [mkPlan()]
  saved.length = 0
  const first = await api.acknowledgeClientAuditReport('AUD-0310', { name: 'Sara', note: 'n' })
  assert.equal(first.ok, true)
  assert.equal(saved.length, 1)
  assert.equal(store[0].stageReport.acknowledgement.by, 'Sara')
  const second = await api.acknowledgeClientAuditReport('AUD-0310', { name: 'Again' })
  assert.equal(second.ok, false)
  assert.equal(saved.length, 1)
  session = { organization: { name: 'Another Client Co' } }
  store = [mkPlan()]
  assert.equal((await api.acknowledgeClientAuditReport('AUD-0310', { name: 'X' })).error, 'notFound')
  session = { organization: { name: 'Al Noor Food Industries' } }
})
