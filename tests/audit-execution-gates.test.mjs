import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/lib/api/auditExecutionGates.ts', import.meta.url), 'utf8')
const exports = {}
runInNewContext(
  ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  { exports, Date }
)
const gates = exports

// Results come from another realm; normalise before deep comparisons.
const plain = (value) => JSON.parse(JSON.stringify(value))

const item = (id, extra = {}) => ({
  id,
  clause: '8.5',
  title: `Item ${id}`,
  requirement: `Requirement ${id}`,
  mandatory: true,
  result: '',
  note: '',
  ...extra,
})

const execution = (extra = {}) => ({
  started: false,
  completedSteps: [],
  preparation: {
    planSentToClient: false,
    planConfirmedByClient: false,
    declarationsCompleted: false,
    agreementActive: false,
    clientDocumentsReviewed: false,
  },
  checklists: [
    { id: 'cl1', title: 'Section 1', assignedAuditor: '', items: [item('i1'), item('i2')] },
  ],
  openingMeeting: {
    agendaConfirmed: false,
    confidentialityGiven: false,
    attendees: [],
  },
  teamReview: { dailyWrapUps: [], gradingConsensus: false },
  closingMeeting: {
    findingsPresented: false,
    clientPosition: '',
    attendees: [],
  },
  timeSpent: [],
  report: { executiveSummary: '', recommendation: '' },
  ...extra,
})

test('start blockers list every missing readiness prerequisite', () => {
  const codes = plain(gates.getStartBlockers(execution())).map((b) => b.code)
  assert.deepEqual(codes, ['planNotSent', 'clientNotConfirmed', 'teamNotDeclared', 'agreementMissing'])
})

test('start blockers empty once readiness is complete', () => {
  const exec = execution({
    preparation: {
      planSentToClient: true,
      planConfirmedByClient: true,
      declarationsCompleted: true,
      agreementActive: true,
      clientDocumentsReviewed: false,
    },
  })
  assert.deepEqual(plain(gates.getStartBlockers(exec)), [])
})

test('document review is a step 1 blocker, not a start blocker', () => {
  const exec = execution({
    preparation: {
      planSentToClient: true,
      planConfirmedByClient: true,
      declarationsCompleted: true,
      agreementActive: true,
      clientDocumentsReviewed: false,
    },
  })
  assert.equal(gates.getStartBlockers(exec).length, 0)
  const codes = plain(gates.getStepBlockers(exec, 1)).map((b) => b.code)
  assert.deepEqual(codes, ['documentsNotReviewed', 'checklistsUnassigned'])
})

test('step 1 blocks when no checklist is assigned and when an auditor is missing', () => {
  const noCl = execution({ checklists: [] })
  assert.ok(plain(gates.getStepBlockers(noCl, 1)).some((b) => b.code === 'noChecklists'))

  const unassigned = execution()
  assert.ok(plain(gates.getStepBlockers(unassigned, 1)).some((b) => b.code === 'checklistsUnassigned'))

  const assigned = execution({
    checklists: [{ id: 'cl1', title: 'Section 1', assignedAuditor: 'Lead', items: [item('i1')] }],
  })
  assert.ok(!plain(gates.getStepBlockers(assigned, 1)).some((b) => b.code === 'checklistsUnassigned'))
})

test('step 3 counts mandatory unaudited items; Not audited counts as open', () => {
  const exec = execution({
    completedSteps: [1, 2],
    checklists: [
      {
        id: 'cl1',
        title: 'S1',
        assignedAuditor: 'Lead',
        items: [item('i1', { result: 'Conforming' }), item('i2'), item('i3', { result: 'Not audited' })],
      },
    ],
  })
  const blockers = plain(gates.getStepBlockers(exec, 3))
  assert.deepEqual(blockers, [{ code: 'mandatoryItemsOpen', count: 2 }])
})

test('non-mandatory items do not block step 3', () => {
  const exec = execution({
    completedSteps: [1, 2, 3],
    checklists: [
      { id: 'cl1', title: 'S1', assignedAuditor: 'Lead', items: [item('i1', { mandatory: false })] },
    ],
  })
  assert.deepEqual(plain(gates.getStepBlockers(exec, 4)).filter((b) => b.code === 'ncWithoutFinding'), [])
  assert.deepEqual(plain(gates.getStepBlockers(exec, 3)), [])
})

test('step 4 blocks NC items without a finding, and counts them', () => {
  const exec = execution({
    completedSteps: [1, 2, 3],
    checklists: [
      {
        id: 'cl1',
        title: 'S1',
        assignedAuditor: 'Lead',
        items: [
          item('i1', { result: 'Minor NC' }),
          item('i2', { result: 'Major NC', findingCode: 'FND-01' }),
        ],
      },
    ],
    teamReview: { dailyWrapUps: [{ day: 1 }], gradingConsensus: true },
  })
  const blockers = plain(gates.getStepBlockers(exec, 4))
  assert.deepEqual(blockers, [{ code: 'ncWithoutFinding', count: 1 }])
})

test('nextFindingCode numbers findings in order', () => {
  assert.equal(gates.nextFindingCode(execution()), 'FND-01')
  const withOne = execution({
    checklists: [
      {
        id: 'cl1',
        title: 'S1',
        assignedAuditor: 'Lead',
        items: [item('i1', { findingCode: 'FND-01' }), item('i2')],
      },
    ],
  })
  assert.equal(gates.nextFindingCode(withOne), 'FND-02')
})

test('attachFindingToItem records the code on the item without mutating the input', () => {
  const exec = execution()
  const next = plain(gates.attachFindingToItem(exec, 'i2', 'FND-01'))
  assert.equal(plain(exec).checklists[0].items[1].findingCode, undefined)
  assert.equal(next.checklists[0].items[1].findingCode, 'FND-01')
  const found = plain(gates.findChecklistItem(next, 'i2'))
  assert.equal(found.sectionTitle, 'Section 1')
  assert.equal(found.item.findingCode, 'FND-01')
})

test('step 6 blocks while the opening meeting is not completed', () => {
  assert.deepEqual(plain(gates.getStepBlockers(execution({ completedSteps: [1, 3, 4, 5] }), 6)), [
    { code: 'previousStepsIncomplete', count: 1 },
    { code: 'reportNotOpen' },
  ])
  assert.deepEqual(plain(gates.getStepBlockers(execution({ completedSteps: [1, 2, 3, 4, 5] }), 6)), [])
})

test('step 5 requires findings presented, client position, signature and time', () => {
  const codes = plain(gates.getStepBlockers(execution({ completedSteps: [1, 2, 3, 4] }), 5)).map((b) => b.code)
  assert.deepEqual(codes, [
    'findingsNotPresented',
    'noClientPosition',
    'noClosingSignature',
    'noTimeRecorded',
  ])
})

test('result classification helpers', () => {
  assert.equal(gates.isNonconformingResult('Minor NC'), true)
  assert.equal(gates.isNonconformingResult('Major NC'), true)
  assert.equal(gates.isNonconformingResult('Conforming'), false)
  assert.equal(gates.isAuditedResultValue(''), false)
  assert.equal(gates.isAuditedResultValue('Not audited'), false)
  assert.equal(gates.isAuditedResultValue('Observation'), true)
})

test('applyStepCompletion refuses a blocked step without mutating state', () => {
  const exec = execution()
  const result = gates.applyStepCompletion(exec, 1)
  assert.equal(result.ok, false)
  assert.ok(result.blockers.length > 0)
  assert.equal(result.next, undefined)
  assert.deepEqual(plain(exec.completedSteps), [])
})

test('applyStepCompletion completes a ready step and moves to the next one', () => {
  const exec = execution({
    preparation: {
      planSentToClient: true,
      planConfirmedByClient: true,
      declarationsCompleted: true,
      agreementActive: true,
      clientDocumentsReviewed: true,
    },
    checklists: [
      { id: 'cl1', title: 'Section 1', assignedAuditor: 'Sara', items: [item('i1')] },
    ],
  })
  const result = gates.applyStepCompletion(exec, 1, 2)
  assert.equal(result.ok, true)
  assert.deepEqual(plain(result.next.completedSteps), [1])
  assert.equal(result.next.activeStep, 2)
  assert.deepEqual(plain(exec.completedSteps), [])
})

test('applyStepCompletion on step 6 prepares the hand-off without finalizing the report', () => {
  const exec = execution({ completedSteps: [1, 2, 3, 4, 5] })
  const result = gates.applyStepCompletion(exec, 6)
  assert.equal(result.ok, true)
  assert.deepEqual(plain(result.next.completedSteps), [1, 2, 3, 4, 5, 6])
  assert.equal(result.next.report.handoffReady, true)
  assert.equal(Boolean(result.next.report.reportFinalized), false)
})

test('applyStepCompletion on step 6 stays blocked while the opening meeting is incomplete', () => {
  const exec = execution()
  const result = gates.applyStepCompletion(exec, 6)
  assert.equal(result.ok, false)
  assert.deepEqual(plain(result.blockers).map((b) => b.code), ['previousStepsIncomplete', 'reportNotOpen'])
  assert.equal(result.next, undefined)
})

test('applyStepCompletion is idempotent for an already completed step', () => {
  const exec = execution({ completedSteps: [1, 2, 3, 4, 5, 6], report: { handoffReady: true } })
  const result = gates.applyStepCompletion(exec, 6)
  assert.equal(result.ok, true)
  assert.deepEqual(plain(result.next.completedSteps), [1, 2, 3, 4, 5, 6])
})

test('getStepBlockers requires previous steps completed, in addition to the step gates', () => {
  const codes = plain(gates.getStepBlockers(execution(), 3)).map((b) => b.code)
  assert.deepEqual(codes, ['previousStepsIncomplete', 'mandatoryItemsOpen'])
  assert.deepEqual(plain(gates.getStepBlockers(execution(), 3))[0], { code: 'previousStepsIncomplete', count: 2 })
  assert.deepEqual(plain(gates.getStepBlockers(execution({ completedSteps: [2] }), 6)).map((b) => b.code), [
    'previousStepsIncomplete',
  ])
})

test('applyStepCompletion refuses step 6 when only the opening meeting is complete (out-of-order direct call)', () => {
  const exec = execution({ completedSteps: [2] })
  const result = gates.applyStepCompletion(exec, 6)
  assert.equal(result.ok, false)
  assert.equal(result.blockers[0].code, 'previousStepsIncomplete')
  assert.equal(result.next, undefined)
  assert.deepEqual(plain(exec.completedSteps), [2])
  assert.equal(Boolean(exec.report.handoffReady), false)
})

test('applyStepCompletion refuses an out-of-order middle step even when its own gates are met', () => {
  const exec = execution({ completedSteps: [1, 2, 4, 5] })
  const result = gates.applyStepCompletion(exec, 6)
  assert.equal(result.ok, false)
  assert.deepEqual(plain(result.blockers), [{ code: 'previousStepsIncomplete', count: 1 }])
})
