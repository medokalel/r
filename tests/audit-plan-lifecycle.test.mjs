import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/lib/api/auditPlanLifecycleApi.ts', import.meta.url), 'utf8')
const module = { exports: {} }
runInNewContext(
  ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  {
    module,
    exports: module.exports,
    require: () => ({ saveAuditPlan: async (plan) => ({ ...plan }) }),
    Date,
    Math,
  }
)
const { getLifecycleBlock, applyLifecycleAction } = module.exports

const plan = (status, planSentToClient) => ({
  id: 'p1',
  planNumber: 'AUD-0001',
  status,
  leadAuditor: 'Omar Hassan',
  auditTeam: ['Omar Hassan', 'Mostafa Adel'],
  execution: { preparation: { planSentToClient } },
})

test('the audit cannot start before the plan is sent to the client', () => {
  assert.equal(getLifecycleBlock(plan('Draft', false), 'start'), 'notSent')
  assert.equal(getLifecycleBlock(plan('Planned', true), 'start'), null)
})

test('review and completion need a started audit', () => {
  assert.equal(getLifecycleBlock(plan('Planned', true), 'review'), 'notStarted')
  assert.equal(getLifecycleBlock(plan('Planned', true), 'complete'), 'notStarted')
  assert.equal(getLifecycleBlock(plan('In progress', true), 'review'), null)
  assert.equal(getLifecycleBlock(plan('Under review', true), 'complete'), null)
})

test('finished steps report why they are unavailable', () => {
  assert.equal(getLifecycleBlock(plan('In progress', true), 'start'), 'done')
  assert.equal(getLifecycleBlock(plan('Under review', true), 'review'), 'done')
  for (const action of ['start', 'review', 'complete']) {
    assert.equal(getLifecycleBlock(plan('Completed', true), action), 'completed')
  }
})

test('completing an audit logs it for every team member and records history', async () => {
  const result = await applyLifecycleAction(plan('In progress', true), 'complete')
  assert.equal(result.plan.status, 'Completed')
  assert.equal(result.competenceLogged, 2)
  assert.deepEqual(result.plan.competenceLoggedFor, ['Omar Hassan', 'Mostafa Adel'])
  assert.equal(result.plan.events.at(-1).action, 'lifecycle.complete')
})

test('an unavailable action is rejected', async () => {
  await assert.rejects(() => applyLifecycleAction(plan('Draft', false), 'start'))
})
