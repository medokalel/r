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
    { exports, Date, Math, Number, ...extra },
  )
  return exports
}
const sr = load('../src/lib/api/stageReport.ts')
const ws = load('../src/lib/api/auditReportingWorkspace.ts', {
  require: (m) => (m.endsWith('stageReport') ? sr : {}),
})
const plain = (v) => JSON.parse(JSON.stringify(v))

const item = (id, result, extra = {}) => ({ id, clauseRef: '8.' + id, title: 'T' + id, result, evidenceNotes: '', documentsSampled: '', peopleInterviewed: '', ...extra })
const exec = (extra = {}, report = {}) => ({
  started: true,
  checklists: [{ title: 'S', items: [item('1', 'Conforming', { evidenceNotes: 'seen' }), item('2', 'Minor NC'), item('3', 'Not audited'), item('4', '')] }],
  closingMeeting: {}, timeSpent: [],
  report: { executiveSummary: 'S', recommendation: 'R', reportFinalized: false, handoffReady: false, ...report },
  ...extra,
})
const plan = (n, over = {}) => ({ id: 'plan-' + n, planNumber: 'AUD-' + n, clientName: 'C' + n, siteName: 'HQ', stage: 'Stage 1', proposedStartDate: '2026-11-18', proposedEndDate: '2026-11-20', execution: exec(), ...over })
const rec = (planNumber, over = {}) => ({ id: 'f' + Math.random(), planId: null, planNumber, findingCode: 'FND-01', status: 'Submitted', classification: 'Major — per scheme rules', ...over })
const state = (status, extra = {}) => ({ version: 2, status, reviewer: 'Mona', events: [], ...extra })

test('status follows the stage report, or the hand-off when no report exists', () => {
  assert.equal(ws.getReportingStatus(plan('1')), 'handoffPending')
  assert.equal(ws.getReportingStatus(plan('1', { execution: exec({}, { handoffReady: true }) })), 'readyToCreate')
  for (const s of ['draft', 'inReview', 'returned', 'approved', 'issued'])
    assert.equal(ws.getReportingStatus(plan('1', { stageReport: state(s) })), s)
})

test('register lists only started audits or audits with a report', () => {
  const rows = ws.buildReportingRows(
    [plan('1'), plan('2', { execution: exec({ started: false }) }), plan('3', { execution: exec({ started: false }), stageReport: state('issued') })],
    [],
  )
  assert.deepEqual(plain(rows.map((r) => r.planNumber)), ['AUD-1', 'AUD-3'])
})

test('rows carry version, issue date, coverage and per-audit finding counts', () => {
  const p = plan('1', { stageReport: state('issued', { issuedAt: '2026-11-25T10:00:00Z' }) })
  const records = [rec('AUD-1'), rec('AUD-1', { status: 'Draft', findingCode: null }), rec('AUD-2'), rec(null, { planId: 'plan-1' })]
  const row = ws.buildReportingRow(p, records)
  assert.equal(row.version, 2)
  assert.equal(row.issuedAt, '2026-11-25T10:00:00Z')
  assert.equal(row.audited, 2)
  assert.equal(row.total, 4)
  assert.equal(row.submittedFindings, 2)
  assert.equal(row.draftFindings, 1)
})

test('findings never leak between audits', () => {
  const own = ws.findingsForPlan(plan('1'), [rec('AUD-1'), rec('AUD-2'), rec(null, { planId: 'plan-2' })])
  assert.equal(own.length, 1)
})

test('filters by search text and status', () => {
  const rows = ws.buildReportingRows([plan('1'), plan('2', { clientName: 'Nile Foods', stageReport: state('draft') })], [])
  assert.equal(ws.filterReportingRows(rows, { search: 'nile', status: 'all' }).length, 1)
  assert.equal(ws.filterReportingRows(rows, { search: '', status: 'draft' }).length, 1)
  assert.equal(ws.filterReportingRows(rows, { search: '', status: 'issued' }).length, 0)
})

test('the action matches the state, so the right stage report page opens', () => {
  const expected = { handoffPending: 'openExecution', readyToCreate: 'generate', draft: 'continueDraft', returned: 'continueDraft', inReview: 'review', approved: 'issue', issued: 'view' }
  for (const [status, action] of Object.entries(expected)) assert.equal(ws.getReportAction(status), action)
})

const readiness = (p, r = []) => Object.fromEntries(ws.buildReportReadiness(p, r).map((g) => [g.id, g.state]))

test('readiness before a report exists: prerequisites are judged, report-bound items wait', () => {
  const g = readiness(plan('1'))
  assert.equal(g.handoff, 'pending')
  assert.equal(g.summary, 'met')
  assert.equal(g.recommendation, 'met')
  assert.equal(g.sections, 'waiting')
  assert.equal(g.reviewer, 'waiting')
  assert.equal(g.approval, 'waiting')
  assert.equal(g.issued, 'waiting')
})

test('readiness reuses the stage report submit rules', () => {
  const ready = plan('1', { leadAuditor: 'Omar', auditTeam: ['Omar'], execution: exec({}, { handoffReady: true }) })
  const withReport = (extra) => ({ ...ready, stageReport: sr.createStageReport({ scopeObjectives: 'a', teamDates: 'b', checklistCoverage: 'c', findings: 'd', closingMeeting: 'e' }, 'n'), ...extra })
  const base = withReport()
  assert.equal(readiness(base).reviewer, 'pending')
  const picked = withReport({ stageReport: { ...base.stageReport, reviewer: 'Mona' } })
  assert.equal(readiness(picked).reviewer, 'met')
  assert.equal(readiness(picked).sections, 'met')
  const ownReviewer = withReport({ stageReport: { ...base.stageReport, reviewer: 'Omar' } })
  assert.equal(readiness(ownReviewer).reviewer, 'pending')
  assert.equal(readiness(picked, [rec('AUD-1', { status: 'Draft', findingCode: null })]).findings, 'pending')
  assert.equal(readiness(picked, [rec('AUD-1')]).findings, 'met')
  const blocked = sr.getSubmitBlockers(picked, picked.execution, picked.stageReport, 1).map((b) => b.code)
  assert.ok(blocked.includes('findingsNotSubmitted'))
  const empty = withReport({ stageReport: { ...base.stageReport, sections: { ...base.stageReport.sections, findings: '' }, reviewer: 'Mona' } })
  assert.equal(readiness(empty).sections, 'pending')
  const noSummary = withReport({ execution: exec({}, { handoffReady: true, executiveSummary: ' ' }) })
  assert.equal(readiness(noSummary).summary, 'pending')
})

test('readiness after sending to review, approval and issue', () => {
  const p = (status) => plan('1', { execution: exec({}, { handoffReady: true }), stageReport: state(status) })
  const inReview = readiness(p('inReview'), [rec('AUD-1', { status: 'Draft' })])
  assert.equal(inReview.handoff, 'met')
  assert.equal(inReview.findings, 'met')
  assert.equal(inReview.approval, 'pending')
  assert.equal(inReview.issued, 'waiting')
  const approved = readiness(p('approved'))
  assert.equal(approved.approval, 'met')
  assert.equal(approved.issued, 'pending')
  const issued = readiness(p('issued'))
  assert.ok(Object.values(issued).every((v) => v === 'met'))
})

test('findings cannot be added once the report is in review, approved or issued', () => {
  assert.equal(ws.canAddFinding(plan('1')), true)
  for (const s of ['draft', 'returned']) assert.equal(ws.canAddFinding(plan('1', { stageReport: state(s) })), true)
  for (const s of ['inReview', 'approved', 'issued']) assert.equal(ws.canAddFinding(plan('1', { stageReport: state(s) })), false)
})

test('an issued report row shows the frozen snapshot, not later changes', () => {
  const snapshot = { counts: { audited: 30, total: 37, nc: 2, findings: 5 } }
  const p = plan('1', { stageReport: state('issued', { snapshot, issuedAt: '2026-11-25T10:00:00Z' }) })
  const row = ws.buildReportingRow(p, [rec('AUD-1'), rec('AUD-1', { status: 'Draft', findingCode: null })])
  assert.equal(row.audited, 30)
  assert.equal(row.total, 37)
  assert.equal(row.submittedFindings, 5)
  assert.equal(row.draftFindings, 0)
})

test('findings are scoped to the signed-in CAB by the record store', () => {
  const api = readFileSync(new URL('../src/lib/api/cabAuditReportingApi.ts', import.meta.url), 'utf8')
  assert.match(api, /filter\(\(r\) => r\.cabId === owner\)/)
  assert.match(api, /if \(!owner\) return \[\]/)
  const page = readFileSync(new URL('../src/pages/CabAuditReportingAuditPage.tsx', import.meta.url), 'utf8')
  assert.match(page, /listFindingRecords\(\)/)
  assert.doesNotMatch(page, /localStorage/)
})

test('evidence rows list audited items and flag missing evidence', () => {
  const rows = ws.buildEvidenceRows(plan('1'))
  assert.deepEqual(plain(rows.map((r) => [r.id, r.hasEvidence])), [['1', true], ['2', false]])
})

test('register findings continue the audit numbering without repeating a code', () => {
  const p = plan('1')
  assert.equal(ws.nextRegisterFindingCode(p, [], []), 'FND-01')
  assert.equal(ws.nextRegisterFindingCode(p, [rec('AUD-1', { findingCode: 'FND-02' })], ['FND-01']), 'FND-03')
  assert.equal(ws.nextRegisterFindingCode(p, [rec('AUD-9', { findingCode: 'FND-07' })], []), 'FND-01')
})

test('the register, workspace and routes are wired to the audit', () => {
  const routes = readFileSync(new URL('../src/lib/routes.ts', import.meta.url), 'utf8')
  assert.match(routes, /cabAuditReportingAudit: "\/cab\/audit-reporting\/audit\/:planId"/)
  const page = readFileSync(new URL('../src/pages/CabAuditReportingPage.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(page, /SEED_|DEMO_SCOPE|Simulate offline|AUD-0024/)
  const addFinding = readFileSync(new URL('../src/pages/CabAddFindingPage.tsx', import.meta.url), 'utf8')
  assert.match(addFinding, /replace: true/)
  const stage = readFileSync(new URL('../src/pages/CabStageReportPage.tsx', import.meta.url), 'utf8')
  assert.match(stage, /cabAuditReportingPath\(plan\.planNumber\)/)
  assert.match(addFinding, /canAddFinding/)
})

test('finding submit gates return stable, translatable codes', () => {
  const rep = load('../src/lib/api/cabAuditReportingApi.ts')
  const bad = rep.validateFindingForSubmit({ findingType: '', classification: '', requirementRef: ' ', evidenceText: '', evidenceLinks: [], statement: '' })
  assert.equal(bad.ok, false)
  assert.deepEqual(plain(bad.errors), ['findingType', 'classification', 'requirementRef', 'statement', 'evidence'])
  const good = rep.validateFindingForSubmit({ findingType: 'Nonconformity', classification: 'major', requirementRef: '8.5.1', evidenceText: 'seen', evidenceLinks: [], statement: 's' })
  assert.deepEqual(plain(good), { ok: true, errors: [] })
})

test('the add-finding form stores classification values, not display labels', () => {
  const page = readFileSync(new URL('../src/pages/CabAddFindingPage.tsx', import.meta.url), 'utf8')
  assert.match(page, /option key=\{c\.value\} value=\{c\.value\}/)
  assert.doesNotMatch(page, /value=\{c\.label\}/)
})

test('a reopened draft updates in place: same id, no duplicate, findings gate clears', async () => {
  const store = new Map()
  const localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  }
  const api = load('../src/lib/api/cabAuditReportingApi.ts', { localStorage })
  localStorage.setItem('icasco_auth_session', JSON.stringify({ cab: { id: 'cab-1' } }))
  const draft = {
    id: 'find-1', cabId: 'cab-1', findingCode: null, status: 'Draft', planId: 'plan-1', planNumber: 'AUD-1',
    checklistItemId: null, clauseRef: '8.2', findingType: 'Nonconformity', classification: 'Major — per scheme rules',
    requirementRef: '8.2', evidenceText: '', evidenceLinks: [], statement: 's', dueDate: '', process: '', contact: '',
    comments: '', createdAt: '2026-11-20T10:00:00Z',
  }
  await api.saveFindingRecord(draft)
  const p = plan('1')
  assert.equal(ws.buildReportReadiness(p, api.listFindingRecords()).find((g) => g.id === 'findings').state, 'pending')
  // Reopen and resubmit the same record, as the edit form does.
  await api.saveFindingRecord({ ...draft, status: 'Submitted', findingCode: 'FND-01', evidenceText: 'seen', classification: 'major' })
  const listed = api.listFindingRecords()
  assert.equal(listed.length, 1)
  assert.equal(listed[0].id, 'find-1')
  assert.equal(listed[0].status, 'Submitted')
  assert.equal(listed[0].findingCode, 'FND-01')
  assert.equal(listed[0].createdAt, draft.createdAt)
  assert.equal(listed[0].planId, 'plan-1')
  assert.equal(listed[0].clauseRef, '8.2')
  assert.equal(ws.buildReportReadiness(p, listed).find((g) => g.id === 'findings').state, 'met')
})

test('draft findings reopen from the workspace and keep identity, binding and scope', () => {
  const page = readFileSync(new URL('../src/pages/CabAuditReportingAuditPage.tsx', import.meta.url), 'utf8')
  assert.match(page, /f\.status === 'Draft' && addAllowed/)
  assert.match(page, /findingId=\$\{encodeURIComponent\(f\.id\)\}/)
  const add = readFileSync(new URL('../src/pages/CabAddFindingPage.tsx', import.meta.url), 'utf8')
  assert.match(add, /searchParams\.get\('findingId'\)/)
  assert.match(add, /r\.id === findingId && r\.status === 'Draft'/)
  assert.match(add, /normalizeClassification\(existing\.classification\)/)
  assert.match(add, /existing\?\.cabId/)
  assert.match(add, /existing\?\.createdAt/)
  assert.match(add, /canAddFinding/)
})

test('a reopened draft binds strictly from its record and stays locked until the audit loads', () => {
  const add = readFileSync(new URL('../src/pages/CabAddFindingPage.tsx', import.meta.url), 'utf8')
  // With findingId the record alone decides plan/item/clause, including nulls; URL cannot rebind.
  assert.match(add, /findingId \? \(existing\?\.planId \?\? ''\)/)
  assert.match(add, /findingId \? \(existing\?\.checklistItemId \?\? ''\)/)
  assert.match(add, /findingId \? \(existing\?\.clauseRef \?\? ''\)/)
  // An unknown findingId always redirects, even when the URL also carries a planId.
  assert.match(add, /\(findingId && !existing\) \|\| !isBound/)
  // Save/submit stay disabled until the audit lookup resolves, so a pending or
  // failed lookup cannot bypass the report lock.
  assert.match(add, /planLookup !== 'ready'/)
  assert.match(add, /setPlanLookup\(data \? 'ready' : 'failed'\)/)
})
