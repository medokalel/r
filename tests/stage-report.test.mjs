import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/lib/api/stageReport.ts', import.meta.url), 'utf8')
const exports = {}
runInNewContext(
  ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  { exports, Date, Math },
)
const sr = exports
const plain = (v) => JSON.parse(JSON.stringify(v))

const plan = {
  planNumber: 'AUD-0310', clientName: 'ISSC', stage: 'Stage 1', standards: ['ISO 9001:2015'], siteName: 'HQ',
  leadAuditor: 'Omar Hassan', auditTeam: ['Omar Hassan', 'Sara Ali'],
  proposedStartDate: '2026-11-18', proposedEndDate: '2026-11-20', scopeSummary: 'Scope', auditObjectives: 'Obj',
}
const item = (result) => ({ id: result, result })
const execution = (extra = {}) => ({
  checklists: [{ items: [item('Conforming'), item('Minor NC'), item('Major NC'), item('Observation'), item('Not audited'), item('')] }],
  timeSpent: [{ hours: 8 }, { hours: 4 }],
  closingMeeting: { clientPosition: 'Agrees', clientComments: '', ncResponseDueBy: '2026-12-01' },
  report: { executiveSummary: 'Summary', recommendation: 'Proceed', reportFinalized: false, handoffReady: true },
  ...extra,
})
const tr = (key, p) => key + (p ? JSON.stringify(p) : '')
const snap = () => sr.buildSnapshot({ ...plan, standardName: 'IMS' }, execution(), ready(), 1)
const NOW = '2026-11-26T10:00:00.000Z'
const ready = (extra = {}) => ({ ...sr.createStageReport(sr.generateSections(plan, execution(), [], tr), NOW), reviewer: 'Mona Fathy', ...extra })

test('generates every section from plan, checklist results and findings', () => {
  const s = sr.generateSections(plan, execution(), [{ code: 'FND-01', classification: 'Major', clauseRef: '8.5', statement: 'x' }], tr)
  assert.deepEqual(plain(Object.keys(s)), plain([...sr.STAGE_REPORT_SECTION_IDS]))
  assert.match(s.checklistCoverage, /"audited":4,"total":6/)
  assert.match(s.checklistCoverage, /"minor":1,"major":1/)
  assert.match(s.teamDates, /"days":1.5/)
  assert.match(s.findings, /FND-01/)
  assert.match(sr.generateSections(plan, execution(), [], tr).findings, /noFindings/)
})

test('reviewer must not be on the audit team (lead included, case-insensitive)', () => {
  assert.equal(sr.isReviewerEligible('Sara Ali', plan), false)
  assert.equal(sr.isReviewerEligible(' omar hassan ', plan), false)
  assert.equal(sr.isReviewerEligible('Mona Fathy', plan), true)
  assert.equal(sr.isReviewerEligible('', plan), false)
})

test('submit blockers: hand-off, texts, sections, drafts, reviewer', () => {
  const ex = execution({ report: { executiveSummary: '', recommendation: '', reportFinalized: false, handoffReady: false } })
  const state = { ...ready(), reviewer: '', sections: { ...ready().sections, findings: '' } }
  const codes = sr.getSubmitBlockers(plan, ex, state, 2).map((b) => b.code)
  assert.deepEqual(plain(codes), ['handoffNotReady', 'summaryMissing', 'recommendationMissing', 'sectionsEmpty', 'findingsNotSubmitted', 'reviewerMissing'])
  assert.deepEqual(plain(sr.getSubmitBlockers(plan, execution(), ready({ reviewer: 'Sara Ali' }))), [{ code: 'reviewerOnTeam' }])
  assert.deepEqual(plain(sr.getSubmitBlockers(plan, execution(), ready())), [])
})

test('full lifecycle: submit, return needs comment, resubmit bumps version, approve, issue', () => {
  const submitted = sr.submitForReview(plan, execution(), ready(), NOW)
  assert.equal(submitted.ok, true)
  assert.equal(submitted.next.status, 'inReview')
  assert.equal(sr.isEditable(submitted.next, 'Under review'), false)

  assert.equal(sr.decideReview(plan, submitted.next, 'return', '  ', NOW).error, 'commentRequired')
  const returned = sr.decideReview(plan, submitted.next, 'return', 'Fix clause 8.5', NOW)
  assert.equal(returned.next.status, 'returned')
  assert.equal(returned.next.reviewComment, 'Fix clause 8.5')
  assert.equal(sr.isEditable(returned.next, 'In progress'), true)

  const resubmitted = sr.submitForReview(plan, execution(), returned.next, NOW)
  assert.equal(resubmitted.next.version, 2)
  assert.equal(resubmitted.next.reviewComment, '')

  assert.equal(sr.issueReport(resubmitted.next, NOW, snap()).error, 'wrongState')
  const approved = sr.decideReview(plan, resubmitted.next, 'approve', '', NOW)
  assert.equal(approved.next.status, 'approved')
  const issued = sr.issueReport(approved.next, NOW, snap())
  assert.equal(issued.next.status, 'issued')
  assert.equal(issued.next.issuedAt, NOW)
  assert.equal(sr.isEditable(issued.next, 'Completed'), false)
  assert.deepEqual(plain(issued.next.events.map((e) => e.action)), ['generated', 'submitted', 'returned', 'submitted', 'approved', 'issued'])
})

test('cannot skip review or review as a team member', () => {
  assert.equal(sr.issueReport(ready(), NOW, snap()).error, 'wrongState')
  assert.equal(sr.decideReview(plan, ready(), 'approve', '', NOW).error, 'wrongState')
  const forced = { ...ready({ reviewer: 'Sara Ali' }), status: 'inReview' }
  assert.equal(sr.decideReview(plan, forced, 'approve', '', NOW).error, 'reviewerNotAllowed')
  assert.equal(sr.submitForReview(plan, execution(), ready({ reviewer: 'Sara Ali' }), NOW).ok, false)
  assert.equal(sr.submitForReview(plan, execution(), { ...ready(), status: 'approved' }, NOW).error, 'wrongState')
})

test('editable only in draft/returned; a plan completed elsewhere does not lock the report', () => {
  assert.equal(sr.isEditable(ready()), true)
  assert.equal(sr.isEditable(undefined), true)
  assert.equal(sr.isEditable({ ...ready(), status: 'issued' }), false)
  assert.equal(sr.isEditable({ ...ready(), status: 'inReview' }), false)
})

test('checklist counts use the real result values (Conforming, Minor NC, Major NC, Observation, OFI, N/A)', () => {
  const ex = execution({ checklists: [{ items: [item('Conforming'), item('Conforming'), item('Minor NC'), item('Major NC'), item('Observation'), item('OFI'), item('N/A'), item('Not audited'), item('')] }] })
  assert.deepEqual(plain(sr.countChecklistResults(ex)), { total: 9, audited: 7, conforming: 2, minorNc: 1, majorNc: 1, observations: 1, ofi: 1, notApplicable: 1 })
  assert.match(sr.generateSections(plan, ex, [], tr).checklistCoverage, /"conforming":2/)
})

test('issuing stores a frozen snapshot that later source changes cannot alter', () => {
  const ex = execution()
  const state = ready({ status: 'approved' })
  const snapshot = sr.buildSnapshot({ ...plan, standardName: 'IMS' }, ex, state, 3)
  const issued = sr.issueReport(state, NOW, snapshot).next
  ex.report.executiveSummary = 'CHANGED'
  ex.report.recommendation = 'CHANGED'
  plan.clientName = 'CHANGED'
  plan.auditTeam.push('Someone New')
  state.sections.findings = 'CHANGED'
  assert.equal(issued.snapshot.executiveSummary, 'Summary')
  assert.equal(issued.snapshot.recommendation, 'Proceed')
  assert.equal(issued.snapshot.clientName, 'ISSC')
  assert.deepEqual(plain(issued.snapshot.auditTeam), ['Omar Hassan', 'Sara Ali'])
  assert.notEqual(issued.snapshot.sections.findings, 'CHANGED')
  assert.deepEqual(plain(issued.snapshot.counts), { audited: 4, total: 6, nc: 2, findings: 3 })
  plan.clientName = 'ISSC'; plan.auditTeam.pop()
})
