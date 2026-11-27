import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/lib/impartialityRegisterView.ts', import.meta.url), 'utf8')
const exports = {}
runInNewContext(
  ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  { exports, Date, Math, JSON, Number, Map },
)
const view = exports
const plain = (v) => JSON.parse(JSON.stringify(v))

const TODAY = '2026-11-27'

const person = (extra = {}) => ({
  employeeId: 'emp-1',
  employeeCode: 'EMP-001',
  fullName: 'Omar Hassan',
  email: 'omar@cab.example',
  professionalRole: 'LEAD_AUDITOR',
  ...extra,
})

test('declaration state: missing, expired, valid (boundary inclusive)', () => {
  assert.equal(view.classifyDeclaration(person({ annualDeclaration: null }), TODAY), 'missing')
  assert.equal(view.classifyDeclaration(person({}), TODAY), 'missing')
  assert.equal(
    view.classifyDeclaration(
      person({ annualDeclaration: { validUntil: '2026-11-26', isActive: true } }),
      TODAY,
    ),
    'expired',
  )
  assert.equal(
    view.classifyDeclaration(
      person({ annualDeclaration: { validUntil: '2026-11-27', isActive: true } }),
      TODAY,
    ),
    'valid',
  )
  assert.equal(
    view.classifyDeclaration(
      person({ annualDeclaration: { validUntil: '2027-05-01T00:00:00Z' } }),
      TODAY,
    ),
    'valid',
  )
  assert.equal(
    view.classifyDeclaration(person({ annualDeclaration: { validUntil: null } }), TODAY),
    'valid',
  )
})

test('addMonthsClamped rolls over exactly like the eligibility engine addMonths', () => {
  // rules.ts addMonths uses setUTCMonth rollover: Jan 31 + 1 month => Mar 3 (2025
  // not a leap year) and Mar 2 in leap 2024. The register must not disagree.
  assert.equal(view.addMonthsClamped('2025-01-31', 1), '2025-03-03')
  assert.equal(view.addMonthsClamped('2024-01-31', 1), '2024-03-02')
  assert.equal(view.addMonthsClamped('2025-08-31', 6), '2026-03-03')
  assert.equal(view.addMonthsClamped('2025-03-15', 24), '2027-03-15')
  assert.equal(view.addMonthsClamped('not-a-date', 3), null)
})

test('relationship classification: ongoing blocks, ended inside cooling-off needs review, older is clear', () => {
  assert.equal(
    view.classifyRelationship({ endDate: null, isOngoing: true }, TODAY, 24),
    'blocking',
  )
  assert.equal(view.classifyRelationship({ endDate: null }, TODAY, 24), 'blocking')
  // Future end date: the engine counts it as ongoing, so it blocks.
  assert.equal(
    view.classifyRelationship({ endDate: '2027-01-15', isOngoing: false }, TODAY, 24),
    'blocking',
  )
  // Ended today: boundary counts as ongoing in the engine, so it blocks.
  assert.equal(
    view.classifyRelationship({ endDate: '2026-11-27', isOngoing: false }, TODAY, 24),
    'blocking',
  )
  // Ended yesterday: still inside the 24-month cooling-off window.
  assert.equal(
    view.classifyRelationship({ endDate: '2026-11-26', isOngoing: false }, TODAY, 24),
    'coolingOff',
  )
  // Ended exactly 24 months ago today: boundary counts as still needing review.
  assert.equal(
    view.classifyRelationship({ endDate: '2024-11-27', isOngoing: false }, TODAY, 24),
    'coolingOff',
  )
  // Ended more than 24 months ago: clear.
  assert.equal(
    view.classifyRelationship({ endDate: '2024-11-26', isOngoing: false }, TODAY, 24),
    'clear',
  )
})

test('view aggregation: KPIs and per-person counters derive from entry fields only', () => {
  const entries = [
    person({
      employeeId: 'emp-1',
      annualDeclaration: { validUntil: '2027-01-01' },
      relationshipsCount: 3,
      relationships: [
        { id: 'r1', client: { id: 'c1', name: 'ISSC' }, relationshipType: 'CONSULTANCY', startDate: '2026-01-01', endDate: null, isOngoing: true },
        { id: 'r2', client: { id: 'c2', name: 'Nile Foods' }, relationshipType: 'EMPLOYMENT', startDate: '2022-01-01', endDate: '2026-06-01', isOngoing: false },
        { id: 'r3', client: { id: 'c3', name: 'Old Co' }, relationshipType: 'INTERNAL_AUDIT', startDate: '2020-01-01', endDate: '2021-06-01', isOngoing: false },
      ],
    }),
    person({
      employeeId: 'emp-2',
      employeeCode: 'EMP-002',
      fullName: 'Sara Ali',
      annualDeclaration: { validUntil: '2026-01-01' },
      relationships: [],
    }),
    person({
      employeeId: 'emp-3',
      employeeCode: 'EMP-003',
      fullName: 'Mona Fathy',
      annualDeclaration: null,
      relationships: [
        { id: 'r4', clientId: 'c4', relationshipType: 'EMPLOYMENT', startDate: '2025-01-01', endDate: null },
      ],
    }),
  ]
  const result = view.buildImpartialityRegisterView({
    entries,
    exceptions: [
      { id: 'ex-1', personId: 'emp-1', status: 'PENDING', requestedBy: 'admin', requestedAt: '2026-11-20T10:00:00Z' },
      { id: 'ex-2', personId: 'unknown', status: 'APPROVED' },
      { id: 'ex-3', personId: null, status: 'REJECTED' },
    ],
    coolingOffMonths: 24,
    today: TODAY,
  })

  assert.deepEqual(plain(result.kpis), {
    totalPeople: 3,
    validDeclarations: 1,
    missingOrExpired: 2,
    relationshipsToReview: 1,
    blockingRelationships: 2,
  })

  const [p1, p2, p3] = result.peopleRows
  assert.equal(p1.declarationState, 'valid')
  assert.equal(p1.relationshipsCount, 3)
  assert.equal(p1.toReviewCount, 1)
  assert.equal(p1.blockingCount, 1)
  assert.equal(p2.declarationState, 'expired')
  assert.equal(p3.declarationState, 'missing')
  assert.equal(p3.blockingCount, 1)

  assert.equal(result.relationshipRows.length, 4)
  const r3 = result.relationshipRows.find((row) => row.id === 'r3')
  assert.equal(r3.classification, 'clear')
  const r4 = result.relationshipRows.find((row) => row.id === 'r4')
  assert.equal(r4.clientName, 'c4')
  assert.equal(r4.ongoing, true)

  assert.equal(result.exceptionRows.length, 3)
  assert.equal(result.exceptionRows[0].personName, 'Omar Hassan')
  assert.equal(result.exceptionRows[1].personName, '')
  assert.equal(result.exceptionRows[2].personName, '')
})

test('empty input yields zeroed KPIs and empty rows', () => {
  const result = view.buildImpartialityRegisterView({
    entries: [],
    exceptions: [],
    coolingOffMonths: 24,
    today: TODAY,
  })
  assert.deepEqual(plain(result.kpis), {
    totalPeople: 0,
    validDeclarations: 0,
    missingOrExpired: 0,
    relationshipsToReview: 0,
    blockingRelationships: 0,
  })
  assert.equal(result.peopleRows.length, 0)
  assert.equal(result.relationshipRows.length, 0)
  assert.equal(result.exceptionRows.length, 0)
})
