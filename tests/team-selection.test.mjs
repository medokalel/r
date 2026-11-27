import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInThisContext } from 'node:vm'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

// Loads the TypeScript sources the way the app resolves them (`@/` = src/), with
// the plan store and localStorage replaced by small in-memory stubs.
const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../src')
const plansStore = []
const savedPlans = []
const stubs = {
  '@/lib/api/cabAuditPlanningApi': {
    fetchAuditPlans: async () => plansStore,
    fetchAuditPlanById: async (id) => plansStore.find((p) => p.id === id || p.planNumber === id) ?? null,
    saveAuditPlan: async (patch) => {
      savedPlans.push(patch)
      const plan = plansStore.find((p) => p.id === patch.id)
      Object.assign(plan, patch)
      return plan
    },
  },
}
stubs['@/lib/authStorage'] = { getAuthSession: () => null }
const storage = new Map()
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
}

const cache = new Map()
function load(file) {
  if (cache.has(file)) return cache.get(file)
  const exports = {}
  cache.set(file, exports)
  const js = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const require = (id) => {
    if (stubs[id]) return stubs[id]
    const base = id.startsWith('@/') ? resolve(SRC, id.slice(2)) : resolve(dirname(file), id)
    return load(`${base}.ts`)
  }
  runInThisContext(`(function (exports, require) {${js}\n})`)(exports, require)
  return exports
}

const catalog = load(`${SRC}/lib/teamSelection/catalog.ts`)
const rules = load(`${SRC}/lib/teamSelection/rules.ts`)
const personnel = load(`${SRC}/lib/teamSelection/personnel.ts`)
const api = load(`${SRC}/lib/api/teamSelectionApi.ts`)

const NOW = new Date('2026-11-21T10:00:00Z')
const plan = (overrides) => ({
  id: 'P1',
  planNumber: 'AUD-0001',
  clientName: 'ISSC',
  country: 'Egypt',
  standardName: 'ISO 9001:2015, ISO 14001:2015, ISO 45001:2018',
  proposedStartDate: '2026-12-08',
  proposedEndDate: '2026-12-12',
  leadAuditor: '',
  auditTeam: [],
  status: 'Planned',
  teamDeclarations: {},
  siteAllocation: {},
  ...overrides,
})

const context = (p = plan()) => personnel.buildPlanContext(p, catalog.DEFAULT_SETTINGS, {}, NOW)
const poolFor = (ctx, plans = []) =>
  personnel.buildPersonRecords({ context: ctx, plans, savedAssignments: {}, ids: undefined })
const everyone = (ctx) =>
  personnel.buildPersonRecords({
    context: ctx,
    plans: [],
    savedAssignments: {},
    ids: Array.from({ length: 19 }, (_, i) => `emp-${String(i + 1).padStart(4, '0')}`),
  })
const member = (pool, id, role) => {
  const person = pool.find((p) => p.id === id)
  return { personId: id, name: person.name, role, person }
}
const codes = (issues) => issues.map((i) => i.code)

beforeEach(() => {
  storage.clear()
  api.resetTeamSelectionStore()
  plansStore.length = 0
  savedPlans.length = 0
})

test('the catalog has 33 issue codes and only three can be overridden', () => {
  assert.equal(Object.keys(catalog.ISSUE_CATALOG).length, 33)
  assert.deepEqual(
    [...api.OVERRIDABLE_ISSUE_CODES].sort(),
    ['AUDIT_DECLARATION_MISSING', 'DECLARATION_MISSING', 'TRAVEL_BUFFER']
  )
  const weights = Object.values(catalog.SCORE_WEIGHTS).reduce((a, b) => a + b, 0)
  assert.equal(weights, 100)
})

test('standards and IAF codes are read from the standard name', () => {
  const standards = personnel.parseStandards('ISO 9001:2015, ISO/IEC 27001:2022 and ISO 9001')
  assert.deepEqual(standards.map((s) => s.key), ['9001', '27001'])
  assert.deepEqual(Array.from(personnel.iafCodesForStandards(['9001', '14001'])), ['14', '29', '31'])
  const ctx = context()
  assert.deepEqual(ctx.standards.map((s) => s.key), ['9001', '14001', '45001'])
  assert.deepEqual(Array.from(ctx.languages), ['ar', 'en'])
})

test('standards come from the plan list even when its title is a label', () => {
  const labelled = plan({ standardName: 'Integrated Management System', standards: ['ISO 9001:2015', 'ISO 14001:2015', 'ISO 45001:2018'] })
  const ctx = context(labelled)
  assert.deepEqual(ctx.standards.map((s) => s.key), ['9001', '14001', '45001'])
  assert.deepEqual(Array.from(ctx.iafCodes), ['14', '28', '29', '31'])
  // A plan without any recognisable standard has nothing to check against.
  assert.equal(context(plan({ standardName: 'Special audit', standards: [] })).standards.length, 0)
})

test('a qualified lead is eligible and scores out of 100', () => {
  const ctx = context()
  const ranked = rules.rankCandidates(poolFor(ctx), 'TEAM_LEADER', ctx)
  const omar = ranked.find((c) => c.person.id === 'emp-0001')
  assert.equal(omar.eligible, true)
  assert.ok(omar.score > 0 && omar.score <= 100)
  assert.equal(omar.components.length, 6)
  assert.equal(omar.components.reduce((s, c) => s + c.max, 0), 100)
  // Eligible people always rank before blocked ones.
  const firstBlocked = ranked.findIndex((c) => !c.eligible)
  assert.ok(ranked.slice(firstBlocked).every((c) => !c.eligible))
})

test('someone who is not a team leader cannot lead', () => {
  const ctx = context()
  const khalid = rules.rankCandidates(poolFor(ctx), 'TEAM_LEADER', ctx).find((c) => c.person.id === 'emp-0003')
  assert.ok(codes(khalid.issues).includes('ROLE_NOT_QUALIFIED'))
  assert.equal(khalid.eligible, false)
})

test('leave overlapping the audit blocks scheduling and cannot be overridden', () => {
  const ctx = context(plan({ proposedStartDate: '2026-12-10', proposedEndDate: '2026-12-13' }))
  const khalid = rules.rankCandidates(poolFor(ctx), 'AUDITOR', ctx).find((c) => c.person.id === 'emp-0003')
  const issue = khalid.issues.find((i) => i.code === 'UNAVAILABLE')
  assert.equal(issue.severity, 'block')
  assert.equal(issue.mandatory, true)
  assert.equal(issue.overridable, false)
  // An approved exception never covers a mandatory issue.
  const withException = rules.rankCandidates(poolFor(ctx), 'AUDITOR', ctx, [
    { id: 'x', issueCode: 'UNAVAILABLE', personId: 'emp-0003', status: 'APPROVED' },
  ])
  assert.equal(withException.find((c) => c.person.id === 'emp-0003').eligible, false)
})

test('a consultancy that ended recently keeps its cooling-off period', () => {
  const ctx = context(plan({ clientName: 'Al Noor Food Industries', standardName: 'ISO 9001', country: 'Saudi Arabia' }))
  const khalid = rules.rankCandidates(poolFor(ctx), 'AUDITOR', ctx).find((c) => c.person.id === 'emp-0003')
  const conflict = khalid.issues.find((i) => i.code === 'IMPARTIALITY_CONFLICT')
  assert.ok(conflict)
  assert.match(conflict.message.en, /cooling-off until 2027-12-31/)
  assert.equal(conflict.mandatory, true)
  // Same person, another client: no conflict.
  const other = context(plan())
  const clean = rules.rankCandidates(poolFor(other), 'AUDITOR', other).find((c) => c.person.id === 'emp-0003')
  assert.ok(!codes(clean.issues).includes('IMPARTIALITY_CONFLICT'))
})

test('only approved exceptions cover an overridable issue', () => {
  const ctx = context()
  const pool = everyone(ctx)
  const team = [member(pool, 'emp-0001', 'TEAM_LEADER')]
  // Make the lead's annual declaration missing so the issue is blocking but overridable.
  team[0].person.annualDeclarationValidUntil = null
  const blocked = rules.validateTeam(ctx, team, { pool })
  const issue = blocked.members[0].issues.find((i) => i.code === 'DECLARATION_MISSING')
  assert.equal(issue.overridable, true)
  assert.equal(blocked.canConfirm, false)

  const pending = rules.validateTeam(ctx, team, {
    pool,
    exceptions: [{ id: 'e', issueCode: 'DECLARATION_MISSING', personId: 'emp-0001', status: 'PENDING' }],
  })
  assert.equal(pending.canConfirm, false)

  const approved = rules.validateTeam(ctx, team, {
    pool,
    exceptions: [{ id: 'e', issueCode: 'DECLARATION_MISSING', personId: 'emp-0001', status: 'APPROVED' }],
  })
  assert.equal(approved.canConfirm, true)
  assert.equal(approved.members[0].status, 'warn')
  assert.equal(approved.warningCount, 1)
})

test('a team needs exactly one leader and covers every standard and code', () => {
  const ctx = context()
  const pool = everyone(ctx)

  const noLeader = rules.validateTeam(ctx, [member(pool, 'emp-0011', 'AUDITOR')], { pool })
  assert.ok(codes(noLeader.teamIssues).includes('NO_TEAM_LEADER'))
  assert.equal(noLeader.canConfirm, false)
  assert.ok(noLeader.teamIssues.find((i) => i.code === 'NO_TEAM_LEADER').alternatives.length > 0)

  const twoLeaders = rules.validateTeam(ctx, [member(pool, 'emp-0001', 'TEAM_LEADER'), member(pool, 'emp-0002', 'TEAM_LEADER')], { pool })
  assert.ok(codes(twoLeaders.teamIssues).includes('MULTIPLE_TEAM_LEADERS'))

  const good = rules.validateTeam(ctx, [member(pool, 'emp-0001', 'TEAM_LEADER')], { pool })
  assert.equal(good.coverage.standards.every((s) => s.coveredBy.includes('emp-0001')), true)
  assert.equal(good.coverage.iafCodes.every((c) => c.coveredBy.length > 0), true)
  assert.equal(good.canConfirm, true)
})

test('a trainee needs a qualified auditor in the team', () => {
  const ctx = context()
  const pool = everyone(ctx)
  const result = rules.validateTeam(ctx, [member(pool, 'emp-0001', 'TEAM_LEADER'), member(pool, 'emp-0004', 'TRAINEE')], { pool })
  assert.ok(!codes(result.teamIssues).includes('TRAINEE_WITHOUT_AUDITOR'))
  const alone = rules.validateTeam(ctx, [member(pool, 'emp-0004', 'TRAINEE')], { pool })
  assert.ok(codes(alone.teamIssues).includes('TRAINEE_WITHOUT_AUDITOR'))
})

test('workload and travel buffer come from other plans', () => {
  const busy = plan({
    id: 'P2',
    planNumber: 'AUD-0002',
    proposedStartDate: '2026-12-13',
    proposedEndDate: '2026-12-14',
    leadAuditor: 'Omar Hassan',
    auditTeam: ['Omar Hassan'],
  })
  const ctx = context()
  const omar = poolFor(ctx, [busy]).find((p) => p.id === 'emp-0001')
  assert.equal(omar.bookings.length, 1)
  const result = rules.rankCandidates([omar], 'TEAM_LEADER', ctx).at(0)
  assert.ok(codes(result.issues).includes('TRAVEL_BUFFER'))
  assert.equal(result.eligible, false)
})

// ---------------------------------------------------------------- API

const seedPlan = (overrides) => {
  const p = plan(overrides)
  plansStore.push(p)
  return p
}

test('API: exceptions cannot be requested for mandatory issues', async () => {
  seedPlan()
  await assert.rejects(
    () => api.requestTeamException({ auditPlanId: 'P1', personId: 'emp-0003', issueCode: 'UNAVAILABLE', justification: 'Needed urgently' }),
    (error) => error.code === 'EXCEPTION_NOT_ALLOWED' && error.status === 400
  )
})

test('API: an exception is requested once, then approved or rejected with a reason', async () => {
  seedPlan()
  const request = { auditPlanId: 'P1', personId: 'emp-0001', issueCode: 'TRAVEL_BUFFER', justification: 'Same city, no travel needed' }
  const withText = await api.requestTeamException({ ...request, issueText: { en: 'Seen message', ar: 'رسالة' } })
  assert.equal(withText.issueText.en, 'Seen message')
  await api.decideTeamException(withText.id, 'reject', 'Retry without text')
  const exception = await api.requestTeamException(request)
  assert.equal(exception.status, 'PENDING')
  assert.ok(!exception.issueText.en.includes('{{') && !exception.issueText.ar.includes('{{'), 'no raw placeholders')
  await assert.rejects(() => api.requestTeamException(request), (e) => e.code === 'EXCEPTION_EXISTS')

  await assert.rejects(() => api.decideTeamException(exception.id, 'reject'), (e) => e.status === 400)
  const rejected = await api.decideTeamException(exception.id, 'reject', 'Not justified')
  assert.equal(rejected.status, 'REJECTED')
  await assert.rejects(() => api.decideTeamException(exception.id, 'approve'), (e) => e.status === 409)

  // A rejected exception can be requested again and approved.
  const again = await api.requestTeamException(request)
  assert.equal((await api.decideTeamException(again.id, 'approve')).status, 'APPROVED')
  const events = await api.listTeamEvents({ auditPlanId: 'P1' })
  assert.deepEqual(
    events.map((e) => e.action).reverse(),
    [
      'EXCEPTION_REQUESTED',
      'EXCEPTION_REJECTED',
      'EXCEPTION_REQUESTED',
      'EXCEPTION_REJECTED',
      'EXCEPTION_REQUESTED',
      'EXCEPTION_APPROVED',
    ]
  )
})

test('API: a blocked team cannot be confirmed', async () => {
  seedPlan()
  await assert.rejects(
    () => api.confirmPlanTeam('P1', [{ personId: 'emp-0003', role: 'TEAM_LEADER' }]),
    (error) => error.code === 'TEAM_BLOCKED' && error.status === 422 && error.validation.canConfirm === false
  )
  assert.equal(savedPlans.length, 0)
})

test('API: confirming a valid team saves it on the plan and logs the change', async () => {
  seedPlan()
  const result = await api.confirmPlanTeam(
    'P1',
    [
      { personId: 'emp-0001', role: 'TEAM_LEADER' },
      { personId: 'emp-0004', role: 'OBSERVER' },
    ],
    'Agreed with the technical manager'
  )
  assert.equal(result.confirmed, true)
  assert.deepEqual(result.members.map((m) => m.role), ['TEAM_LEADER', 'OBSERVER'])

  const saved = savedPlans.at(-1)
  assert.equal(saved.leadAuditor, 'Omar Hassan')
  assert.deepEqual(Array.from(saved.auditTeam), ['Omar Hassan'], 'observers are not on-site personnel')
  assert.equal(saved.teamConfirmed, true)
  assert.deepEqual(saved.teamMembers.map((m) => [m.id, m.role]), [['emp-0001', 'Lead Auditor'], ['emp-0004', 'Observer']])
  assert.equal(saved.teamDeclarations.noConflictsDeclared, true)

  const actions = (await api.listTeamEvents({ auditPlanId: 'P1' })).map((e) => e.action)
  assert.ok(actions.includes('TEAM_CONFIRMED') && actions.includes('MEMBER_ADDED'))
})

test('API: the team of a completed audit cannot be changed', async () => {
  seedPlan({ status: 'Completed' })
  await assert.rejects(() => api.confirmPlanTeam('P1', [{ personId: 'emp-0001', role: 'TEAM_LEADER' }]), (e) => e.status === 409)
})

test('API: recommendations are ranked, and excluded people are left out', async () => {
  seedPlan()
  const all = await api.fetchTeamRecommendations('P1', 'AUDITOR')
  assert.ok(all.candidates.length > 5)
  assert.deepEqual(all.candidates.map((c) => c.rank), all.candidates.map((_, i) => i + 1))
  const without = await api.fetchTeamRecommendations('P1', 'AUDITOR', { exclude: ['emp-0001'] })
  assert.ok(!without.candidates.some((c) => c.personId === 'emp-0001'))
})

test('API: settings changes are saved and logged', async () => {
  const updated = await api.updateTeamSelectionSettings({ travelBufferDays: 2 })
  assert.equal(updated.travelBufferDays, 2)
  assert.equal((await api.getTeamSelectionSettings()).travelBufferDays, 2)
  assert.equal((await api.listTeamEvents()).at(0).action, 'SETTINGS_UPDATED')
})

test('API: an unknown plan is reported as not found', async () => {
  await assert.rejects(() => api.fetchPlanTeam('missing'), (e) => e.status === 404)
})
