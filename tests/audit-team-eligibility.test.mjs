import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function load(relativePath, requireMap = {}) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8')
  const module = { exports: {} }
  runInNewContext(
    ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { module, exports: module.exports, require: (id) => requireMap[id] ?? {}, Date, Math }
  )
  return module.exports
}

const mock = load('../src/lib/auditTeamMockData.ts')
const { evaluateMember, uncoveredStandards, summarizeTeam, findException } = load(
  '../src/lib/auditTeamEligibility.ts',
  { '@/lib/auditTeamMockData': mock }
)

// Arrays created inside the vm belong to another realm, so copy them before deepEqual.
const codes = (issues) => Array.from(issues, (issue) => issue.code)

const IMS = ['ISO 9001:2015', 'ISO 14001:2015', 'ISO 45001:2018']
const member = (overrides) => ({
  id: 'x',
  name: 'X',
  initials: 'X',
  role: 'Auditor',
  passesChecks: true,
  schemes: IMS,
  iafCodes: [],
  country: 'Egypt',
  ...overrides,
})
const ctx = { standards: IMS, startDate: '2026-12-05', endDate: '2026-12-07', clientCode: 'C1A00011' }

test('a lead auditor must be competent for every plan standard', () => {
  const lead = member({ role: 'Lead Auditor', schemes: ['ISO 9001:2015'] })
  const { issues } = evaluateMember(lead, ctx)
  assert.deepEqual(codes(issues), ['COMPETENCE'])
  assert.equal(issues[0].params.standards, 'ISO 14001:2015, ISO 45001:2018')
})

test('an auditor or technical expert needs at least one matching standard', () => {
  assert.equal(evaluateMember(member({ schemes: ['ISO 9001:2015'] }), ctx).issues.length, 0)
  const none = evaluateMember(member({ role: 'Technical Expert', schemes: ['ISO 22000:2018'] }), ctx)
  assert.deepEqual(codes(none.issues), ['COMPETENCE'])
})

test('observers and trainees are not checked for competence', () => {
  assert.equal(evaluateMember(member({ role: 'Observer', schemes: [] }), ctx).issues.length, 0)
  assert.equal(evaluateMember(member({ role: 'Trainee Auditor', schemes: [] }), ctx).issues.length, 0)
})

test('availability conflicts are detected when the dates overlap', () => {
  const karim = member({ id: 'aud-karim', role: 'Observer' })
  assert.deepEqual(codes(evaluateMember(karim, ctx).issues), ['AVAILABILITY'])
  const later = { ...ctx, startDate: '2026-12-15', endDate: '2026-12-16' }
  assert.equal(evaluateMember(karim, later).issues.length, 0)
})

test('impartiality conflicts are tied to the client code', () => {
  const tarek = member({ id: 'aud-tarek', role: 'Technical Expert' })
  assert.equal(evaluateMember(tarek, ctx).issues.length, 0)
  const alNoor = { ...ctx, clientCode: 'CL-0001' }
  assert.deepEqual(codes(evaluateMember(tarek, alNoor).issues), ['IMPARTIALITY'])
})

test('uncoveredStandards only counts members who audit', () => {
  const observer = member({ role: 'Observer', schemes: IMS })
  assert.deepEqual(uncoveredStandards([observer], IMS), IMS)
  const auditor = member({ schemes: ['ISO 9001:2015', 'ISO 14001:2015'] })
  assert.deepEqual(uncoveredStandards([auditor], IMS), ['ISO 45001:2018'])
})

test('exceptions cover an issue unless they were rejected', () => {
  const karim = member({ id: 'aud-karim', role: 'Observer' })
  const lead = member({ id: 'lead', role: 'Lead Auditor' })
  const before = summarizeTeam([lead, karim], ctx, [])
  assert.equal(before.unresolvedCount, 1)

  const pending = { id: 'e1', personId: 'aud-karim', issueCode: 'AVAILABILITY', status: 'Pending' }
  assert.equal(summarizeTeam([lead, karim], ctx, [pending]).unresolvedCount, 0)

  const rejected = { ...pending, status: 'Rejected' }
  assert.equal(findException([rejected], 'aud-karim', 'AVAILABILITY'), undefined)
  assert.equal(summarizeTeam([lead, karim], ctx, [rejected]).unresolvedCount, 1)
})

test('a team gap adds one unresolved item', () => {
  const observerOnly = member({ role: 'Observer' })
  assert.equal(summarizeTeam([observerOnly], ctx, []).unresolvedCount, 1)
})
