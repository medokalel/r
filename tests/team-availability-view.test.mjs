import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/lib/teamAvailabilityView.ts', import.meta.url), 'utf8')
const exports = {}
runInNewContext(
  ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  { exports, Date, Math, Number, String },
)
const v = exports
const plain = (x) => JSON.parse(JSON.stringify(x))

const people = [
  { id: 'a', name: 'Omar Hassan', role: 'Lead Auditor' },
  { id: 'b', name: 'Sara Ali', role: 'Auditor' },
]
const base = { year: 2026, month: 12, today: '2026-12-10', people, bookings: [], unavailability: [] }
const cell = (view, id, day) => view.rows.find((r) => r.personId === id).cells.find((c) => c.day === day)

test('daysInMonth handles leap years and 30/31 day months', () => {
  assert.equal(v.daysInMonth(2024, 2), 29)
  assert.equal(v.daysInMonth(2026, 2), 28)
  assert.equal(v.daysInMonth(2026, 11), 30)
  assert.equal(v.daysInMonth(2026, 12), 31)
})

test('shiftMonth rolls the year over both ways', () => {
  assert.deepEqual(plain(v.shiftMonth(2026, 12, 1)), { year: 2027, month: 1 })
  assert.deepEqual(plain(v.shiftMonth(2026, 1, -1)), { year: 2025, month: 12 })
  assert.deepEqual(plain(v.shiftMonth(2026, 6, -18)), { year: 2024, month: 12 })
  assert.deepEqual(plain(v.shiftMonth(2026, 6, 0)), { year: 2026, month: 6 })
})

test('weekday uses the real calendar (2026-12-01 is Tuesday)', () => {
  assert.equal(v.weekdayOf(2026, 12, 1), 2)
})

test('empty month: every cell free, today flagged, totals zero', () => {
  const view = v.buildMonthView(base)
  assert.equal(view.days.length, 31)
  assert.equal(view.days.filter((d) => d.isToday).length, 1)
  assert.equal(view.days.find((d) => d.isToday).day, '2026-12-10')
  assert.ok(view.rows.every((r) => r.cells.every((c) => c.state === 'free')))
  assert.deepEqual(plain(view.totals), { people: 2, auditDays: 0, leaveDays: 0, conflictDays: 0, peopleWithConflicts: 0 })
})

test('leave period marks inclusive days only inside the month', () => {
  const view = v.buildMonthView({
    ...base,
    unavailability: [{ personId: 'a', start: '2026-11-28', end: '2026-12-02', reason: 'LEAVE' }],
  })
  assert.equal(cell(view, 'a', '2026-12-01').state, 'leave')
  assert.equal(cell(view, 'a', '2026-12-02').state, 'leave')
  assert.equal(cell(view, 'a', '2026-12-03').state, 'free')
  assert.equal(cell(view, 'b', '2026-12-01').state, 'free')
  assert.equal(view.rows[0].leaveDays, 2)
})

test('confirmed and unconfirmed audits are distinct states', () => {
  const view = v.buildMonthView({
    ...base,
    bookings: [
      { personId: 'a', planNumber: 'AUD-1', clientName: 'Acme', start: '2026-12-05', end: '2026-12-06', confirmed: true },
      { personId: 'a', planNumber: 'AUD-2', clientName: 'Beta', start: '2026-12-20', end: '2026-12-20', confirmed: false },
    ],
  })
  assert.equal(cell(view, 'a', '2026-12-05').state, 'auditConfirmed')
  assert.equal(cell(view, 'a', '2026-12-20').state, 'auditUnconfirmed')
  assert.equal(cell(view, 'a', '2026-12-05').entries[0].label, 'AUD-1')
  assert.equal(view.rows[0].auditDays, 3)
})

test('two overlapping audits and audit on leave are conflicts', () => {
  const view = v.buildMonthView({
    ...base,
    bookings: [
      { personId: 'a', planNumber: 'AUD-1', start: '2026-12-05', end: '2026-12-07', confirmed: true },
      { personId: 'a', planNumber: 'AUD-2', start: '2026-12-07', end: '2026-12-08', confirmed: false },
      { personId: 'b', planNumber: 'AUD-3', start: '2026-12-12', end: '2026-12-12', confirmed: true },
    ],
    unavailability: [{ personId: 'b', start: '2026-12-11', end: '2026-12-13', reason: 'TRAINING' }],
  })
  assert.equal(cell(view, 'a', '2026-12-06').state, 'auditConfirmed')
  assert.equal(cell(view, 'a', '2026-12-07').state, 'conflict')
  assert.equal(cell(view, 'a', '2026-12-08').state, 'auditUnconfirmed')
  assert.equal(cell(view, 'b', '2026-12-12').state, 'conflict')
  assert.equal(cell(view, 'b', '2026-12-11').state, 'leave')
  assert.equal(view.totals.conflictDays, 2)
  assert.equal(view.totals.peopleWithConflicts, 2)
})

test('booking with datetime strings and reversed/missing end still covers its start day', () => {
  const view = v.buildMonthView({
    ...base,
    bookings: [
      { personId: 'a', planNumber: 'AUD-1', start: '2026-12-05T00:00:00Z', end: '2026-12-04', confirmed: true },
      { personId: 'a', planNumber: 'AUD-9', start: 'garbage', end: '2026-12-09', confirmed: true },
    ],
  })
  assert.equal(cell(view, 'a', '2026-12-05').state, 'auditConfirmed')
  assert.equal(cell(view, 'a', '2026-12-04').state, 'free')
  assert.ok(view.rows[0].cells.every((c) => c.day === '2026-12-05' || c.state === 'free'))
})

test('search filters people case-insensitively; month of day falls back', () => {
  assert.equal(v.buildMonthView({ ...base, search: 'sara' }).rows.length, 1)
  assert.equal(v.buildMonthView({ ...base, search: 'zzz' }).rows.length, 0)
  assert.deepEqual(plain(v.monthOfDay('2027-03-09', { year: 2026, month: 1 })), { year: 2027, month: 3 })
  assert.deepEqual(plain(v.monthOfDay(null, { year: 2026, month: 1 })), { year: 2026, month: 1 })
})
