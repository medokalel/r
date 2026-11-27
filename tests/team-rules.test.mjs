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
let sessionUser = { id: 'u1', name: 'Admin One', email: 'one@cab.test' }
stubs['@/lib/authStorage'] = { getAuthSession: () => (sessionUser ? { user: sessionUser } : null) }
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

const api = load(`${SRC}/lib/api/teamSelectionApi.ts`)
const view = load(`${SRC}/lib/teamRulesView.ts`)

const plan = { id: 'P1', planNumber: 'AUD-0001', clientName: 'ISSC', country: 'Egypt',
  standardName: 'ISO 9001:2015', proposedStartDate: '2026-12-08', proposedEndDate: '2026-12-12',
  leadAuditor: '', auditTeam: [], status: 'Planned', teamDeclarations: {}, siteAllocation: {} }
const request = { auditPlanId: 'P1', personId: 'emp-0001', issueCode: 'TRAVEL_BUFFER', justification: 'Same city' }

beforeEach(() => {
  storage.clear()
  api.resetTeamSelectionStore()
  plansStore.length = 0
  plansStore.push({ ...plan })
  sessionUser = { id: 'u1', name: 'Admin One', email: 'one@cab.test' }
})

test('rules draft validation: required, integer and range', () => {
  const ok = { coolingOffMonths: '24', travelBufferDays: '1', workloadWindowDays: '90', maxAuditDaysInWindow: '30', declarationValidityMonths: '12', expiryWarningDays: '30' }
  assert.deepEqual(view.validateRulesDraft(ok), [])
  const bad = view.validateRulesDraft({ ...ok, coolingOffMonths: '', travelBufferDays: '1.5', workloadWindowDays: '0', declarationValidityMonths: '61' })
  assert.deepEqual(bad.map((e) => [e.key, e.code]), [['coolingOffMonths', 'required'], ['travelBufferDays', 'integer'], ['workloadWindowDays', 'range'], ['declarationValidityMonths', 'range']])
  assert.deepEqual(view.validateRulesDraft({ ...ok, coolingOffMonths: '0', expiryWarningDays: '365' }), [])
})

test('self decision is blocked only when the rule is on and the actor requested it', () => {
  assert.equal(view.isSelfDecisionBlocked({ secondApprover: true, isRequester: true }), true)
  assert.equal(view.isSelfDecisionBlocked({ secondApprover: true, isRequester: false }), false)
  assert.equal(view.isSelfDecisionBlocked({ secondApprover: false, isRequester: true }), false)
})

test('API: invalid rules are refused and nothing is saved', async () => {
  await assert.rejects(() => api.updateTeamSelectionSettings({ coolingOffMonths: -1 }), (e) => e.code === 'INVALID_SETTINGS' && e.status === 400)
  assert.equal((await api.getTeamSelectionSettings()).coolingOffMonths, 24)
  assert.equal((await api.listTeamEvents()).length, 0)
})

test('API: rules are saved and logged', async () => {
  const saved = await api.updateTeamSelectionSettings({ coolingOffMonths: 12, exceptionSecondApprover: true })
  assert.equal(saved.coolingOffMonths, 12)
  assert.equal((await api.getTeamSelectionSettings()).exceptionSecondApprover, true)
  assert.equal((await api.listTeamEvents()).at(0).action, 'SETTINGS_UPDATED')
})

test('API: with the rule off the requester can still decide their own exception', async () => {
  const ex = await api.requestTeamException(request)
  assert.equal((await api.decideTeamException(ex.id, 'approve')).status, 'APPROVED')
})

test('API: with the rule on the requester cannot approve or reject, another admin can', async () => {
  await api.updateTeamSelectionSettings({ exceptionSecondApprover: true })
  const ex = await api.requestTeamException(request)
  assert.equal(ex.requestedBy, api.getActingAdmin())
  for (const decision of ['approve', 'reject']) {
    await assert.rejects(() => api.decideTeamException(ex.id, decision, 'because'), (e) => e.code === 'SECOND_APPROVER_REQUIRED' && e.status === 403)
  }
  assert.equal((await api.listTeamExceptions({}))[0].status, 'PENDING')
  sessionUser = { id: 'u2', name: 'Admin Two', email: 'two@cab.test' }
  const decided = await api.decideTeamException(ex.id, 'approve')
  assert.equal(decided.status, 'APPROVED')
  assert.equal(decided.decidedBy, 'Admin Two')
  assert.notEqual(decided.decidedBy, decided.requestedBy)
})

test('API: turning the rule on blocks a request that was already pending', async () => {
  const ex = await api.requestTeamException(request)
  await api.updateTeamSelectionSettings({ exceptionSecondApprover: true })
  await assert.rejects(() => api.decideTeamException(ex.id, 'approve'), (e) => e.code === 'SECOND_APPROVER_REQUIRED')
})

test('API: the actor is the signed-in user, with the demo name only as fallback', () => {
  assert.equal(api.getActingAdmin(), 'Admin One')
  assert.equal(api.getActingAdminId(), 'u1')
  sessionUser = { email: 'B@Cab.test' }
  assert.equal(api.getActingAdmin(), 'B@Cab.test')
  assert.equal(api.getActingAdminId(), 'b@cab.test')
  sessionUser = null
  assert.equal(api.getActingAdmin(), 'Mohamed El Manawahly')
  assert.equal(api.getActingAdminId(), null)
})

test('API: the check uses stable ids, so a same display name does not bypass it', async () => {
  await api.updateTeamSelectionSettings({ exceptionSecondApprover: true })
  const ex = await api.requestTeamException(request)
  assert.equal(ex.requestedById, 'u1')
  // A different person who happens to share the display name is a second approver.
  sessionUser = { id: 'u9', name: 'Admin One', email: 'nine@cab.test' }
  assert.equal(api.isRequesterOf(ex), false)
  assert.equal((await api.decideTeamException(ex.id, 'approve')).status, 'APPROVED')
})

test('API: a renamed account is still the requester', async () => {
  await api.updateTeamSelectionSettings({ exceptionSecondApprover: true })
  const ex = await api.requestTeamException(request)
  sessionUser = { id: 'u1', name: 'Admin One (renamed)', email: 'one@cab.test' }
  await assert.rejects(() => api.decideTeamException(ex.id, 'approve'), (e) => e.code === 'SECOND_APPROVER_REQUIRED')
})

test('API: older exceptions without an id fall back to the display name', async () => {
  await api.updateTeamSelectionSettings({ exceptionSecondApprover: true })
  const legacy = { requestedBy: 'Admin One', requestedById: undefined }
  assert.equal(api.isRequesterOf(legacy), true)
  sessionUser = { id: 'u2', name: 'Admin Two' }
  assert.equal(api.isRequesterOf(legacy), false)
})
