// Run: node --test tests/client-activity-history.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const compile = (code) =>
  ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText

function makeStorage() {
  const map = new Map()
  return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)) }
}

/** Loads the real quotation bridge and dashboard API against one shared storage and a switchable session. */
function load(planNotifications = []) {
  const state = { session: null }
  const localStorage = makeStorage()
  const quotations = {}
  runInNewContext(compile(read('src/lib/api/clientQuotationsApi.ts')), {
    exports: quotations, localStorage, Date, JSON, Promise,
    require: (d) => (d === '@/lib/authStorage' ? { getAuthSession: () => state.session } : {}),
  })
  const dashboard = {}
  runInNewContext(compile(read('src/lib/api/dashboardApi.ts')), {
    exports: dashboard, Date, Promise, setTimeout,
    require: (d) => {
      if (d === '@/lib/api/clientQuotationsApi') return quotations
      if (d === '@/lib/api/clientNotificationsApi') return { listClientPlanNotifications: async () => planNotifications }
      return {}
    },
  })
  return { state, quotations, dashboard }
}

const quotation = (id, over = {}) => ({
  id, quotationNumber: `QUO-${id}`, status: 'ISSUED', offerEndDate: '2999-01-01', currency: 'USD',
  totalAmount: '100', standardCodesUsed: [], events: [], additionalItems: [], ...over,
})
const names = (feed) => Array.from(feed, (a) => a.entityName)
const ctx = (org) => ({ applicationId: 'a', applicationNumber: 'A', clientName: org, organizationId: org })

test('feed holds only real events, newest first, with no placeholder entries', async () => {
  const { state, quotations, dashboard } = load([
    { id: 'p1', kind: 'planSent', reference: 'AP-1', occurredAt: '2020-01-01T00:00:00.000Z' },
  ])
  state.session = { organization: { id: 'org-1', name: 'org-1' } }
  quotations.syncQuotationToClient(quotation('1'), ctx('org-1'))
  const feed = await dashboard.getDashboardActivities()
  assert.equal(feed.length, 2)
  assert.deepEqual(names(feed).sort(), ['AP-1', 'QUO-1'])
  assert.ok(!Array.from(feed).some((a) => ['Food Solutions Company', 'Arab Factory', 'Food factory'].includes(a.entityName)))
  const times = Array.from(feed, (a) => new Date(a.occurredAt).getTime())
  assert.deepEqual(times, [...times].sort((a, b) => b - a))
})

test('a client with no events gets an empty feed', async () => {
  const { state, dashboard } = load()
  state.session = { organization: { id: 'org-1', name: 'org-1' } }
  assert.equal((await dashboard.getDashboardActivities()).length, 0)
})

test('the feed never shows another client\'s offers', async () => {
  const { state, quotations, dashboard } = load()
  state.session = { organization: { id: 'org-1', name: 'org-1' } }
  quotations.syncQuotationToClient(quotation('mine'), ctx('org-1'))
  quotations.syncQuotationToClient(quotation('theirs'), ctx('org-2'))
  const mine = await dashboard.getDashboardActivities()
  assert.deepEqual(names(mine), ['QUO-mine'])
  state.session = { organization: { id: 'org-2', name: 'org-2' } }
  assert.deepEqual(names(await dashboard.getDashboardActivities()), ['QUO-theirs'])
})

test('dashboard previews 3 and links to the history page, which links back', () => {
  assert.match(read('src/components/dashboard/DashboardActivities.tsx'), /DASHBOARD_ACTIVITIES_PREVIEW_COUNT = 3/)
  const page = read('src/pages/DashboardPage.tsx')
  assert.match(page, /activities\.slice\(0, DASHBOARD_ACTIVITIES_PREVIEW_COUNT\)/)
  assert.match(page, /onViewAll=\{\(\) => navigate\(ROUTES\.dashboardActivities\)\}/)
  const history = read('src/pages/DashboardActivitiesPage.tsx')
  assert.match(history, /to=\{ROUTES\.dashboard\}/)
  assert.doesNotMatch(history, /slice\(/)
  const routes = {}
  runInNewContext(compile(read('src/lib/routes.ts')), { exports: routes })
  assert.equal(routes.ROUTES.dashboardActivities, '/dashboard/activities')
  assert.match(read('src/App.tsx'), /path=\{ROUTES\.dashboardActivities\}/)
  assert.match(read('src/components/auth/RequireAuth.tsx'), /ROUTES\.dashboardActivities/)
})
