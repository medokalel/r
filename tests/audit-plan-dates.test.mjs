import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/lib/auditPlanDates.ts', import.meta.url), 'utf8')
const exports = {}
runInNewContext(
  ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  { exports, Date, String }
)
const { todayIsoDate, validateAuditDates, auditDateErrorField } = exports

const TODAY = '2026-11-21'

test('todayIsoDate uses the local calendar date with zero padding', () => {
  assert.equal(todayIsoDate(new Date(2026, 0, 5)), '2026-01-05')
  assert.equal(todayIsoDate(new Date(2026, 10, 21, 23, 59)), '2026-11-21')
})

test('valid dates return no error, including a same-day audit', () => {
  assert.equal(validateAuditDates('2026-11-21', '2026-11-21', TODAY), null)
  assert.equal(validateAuditDates('2026-12-05', '2026-12-07', TODAY), null)
})

test('empty dates are reported before anything else', () => {
  assert.equal(validateAuditDates('', '2026-12-07', TODAY), 'startRequired')
  assert.equal(validateAuditDates('2026-12-05', '', TODAY), 'endRequired')
})

test('a start date in the past is rejected', () => {
  assert.equal(validateAuditDates('2026-11-20', '2026-12-07', TODAY), 'startInPast')
})

test('an end date before the start date is rejected', () => {
  assert.equal(validateAuditDates('2026-12-07', '2026-12-05', TODAY), 'endBeforeStart')
})

test('errors map to the field that shows them', () => {
  assert.equal(auditDateErrorField('startRequired'), 'start')
  assert.equal(auditDateErrorField('startInPast'), 'start')
  assert.equal(auditDateErrorField('endRequired'), 'end')
  assert.equal(auditDateErrorField('endBeforeStart'), 'end')
})
