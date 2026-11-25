// Run: node --test tests/client-findings.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const compile = (code) =>
  ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText

const matchesSearch = (values, query) => {
  const q = query.trim().toLowerCase()
  return !q || values.some((v) => String(v ?? '').toLowerCase().includes(q))
}
const lib = {}
runInNewContext(compile(read('src/lib/clientFindings.ts')), {
  exports: lib,
  require: (d) => (d === '@/lib/tableTools' ? { matchesSearch } : {}),
})

const state = { session: null }
const api = {}
runInNewContext(compile(read('src/lib/api/clientFindingsApi.ts')), {
  exports: api,
  Promise,
  require: (d) => {
    if (d === '@/lib/authStorage') return { getAuthSession: () => state.session }
    if (d === '@/lib/clientFindings') return lib
    return {}
  },
})

const nc = (n, over = {}) => ({
  id: `nc-${n}`, ncId: `NC-${n}`, findingId: `F-${n}`, auditId: `AUD-${n}`,
  clientName: 'Al Noor Food Industries', clientId: 'org-1', classification: 'minor',
  description: `ISO 22000 8.5.1: text ${n}`, raisedDate: '12 Mar 2024', dueDate: '30 Apr 2024',
  overdue: false, status: 'open', actions: [], attachments: [], history: [], ...over,
})

test('findings are scoped to the signed-in client by organization id or name', () => {
  const items = [nc(1), nc(2, { clientId: 'org-2', clientName: 'Other Co' }), nc(3, { clientId: 'x', clientName: ' al noor food industries ' })]
  const mine = lib.scopeFindingsToClient(items, { id: 'org-1', name: 'Al Noor Food Industries' })
  assert.deepEqual(Array.from(mine, (i) => i.ncId), ['NC-1', 'NC-3'])
  assert.deepEqual(Array.from(lib.scopeFindingsToClient(items, { id: 'org-2', name: 'Other Co' }), (i) => i.ncId), ['NC-2'])
  assert.equal(lib.scopeFindingsToClient(items, null).length, 0)
  assert.equal(lib.scopeFindingsToClient(items, {}).length, 0)
})

test('the client feed has no source yet: it is empty for every client, never demo rows', async () => {
  for (const organization of [{ id: 'org-1', name: 'Al Noor Food Industries' }, { id: 'CL-0001', name: 'Al Noor Food Industries' }, null]) {
    state.session = { organization }
    assert.equal((await api.listClientFindings()).length, 0)
  }
  assert.equal(await api.getClientFinding('NC-0024'), null)
})

test('awaiting count covers open, in progress and overdue only', () => {
  const items = ['open', 'in_progress', 'overdue', 'submitted', 'closed'].map((status, i) => nc(i, { status }))
  assert.equal(lib.awaitingResponseCount(items), 3)
  assert.equal(lib.isAwaitingResponse('submitted'), false)
})

test('search covers NC id, audit id, clause and text; status filter narrows', () => {
  const items = [
    nc(1),
    nc(2, { status: 'closed', description: 'No clause text here' }),
    nc(3, { status: 'submitted', auditId: 'AUD-ZED' }),
  ]
  const run = (search, status = 'all') => Array.from(lib.filterClientFindings(items, { search, status }), (i) => i.ncId)
  assert.deepEqual(run(''), ['NC-1', 'NC-2', 'NC-3'])
  assert.deepEqual(run('nc-2'), ['NC-2'])
  assert.deepEqual(run('aud-zed'), ['NC-3'])
  assert.deepEqual(run('8.5.1'), ['NC-1', 'NC-3'])
  assert.deepEqual(run('no clause'), ['NC-2'])
  assert.deepEqual(run('', 'closed'), ['NC-2'])
  assert.deepEqual(run('nc-1', 'closed'), [])
})

test('descriptions split into clause and text only when a clause is present', () => {
  assert.deepEqual({ ...lib.splitFindingDescription('ISO 22000 8.5.1: Records missing') }, { clause: 'ISO 22000 8.5.1', text: 'Records missing' })
  assert.deepEqual({ ...lib.splitFindingDescription('Incomplete temperature monitoring records.') }, { clause: '', text: 'Incomplete temperature monitoring records.' })
})

test('pages hold 10 rows and the page number is clamped', () => {
  const items = Array.from({ length: 23 }, (_, i) => nc(i))
  const first = lib.paginateFindings(items, 1)
  assert.equal(first.items.length, 10)
  assert.equal(first.totalPages, 3)
  assert.equal(lib.paginateFindings(items, 3).items.length, 3)
  assert.equal(lib.paginateFindings(items, 99).page, 3)
  assert.equal(lib.paginateFindings([], 1).totalPages, 1)
})

test('source checks: routes, nav, guard, no response persistence, CAB page untouched', () => {
  const routes = read('src/lib/routes.ts')
  assert.match(routes, /findings: "\/findings"/)
  assert.match(routes, /findingDetails: "\/findings\/:ncId"/)
  const app = read('src/App.tsx')
  assert.match(app, /path=\{ROUTES\.findings\}[\s\S]*?<ClientFindingsPage/)
  assert.match(app, /path=\{ROUTES\.findingDetails\}[\s\S]*?<ClientFindingResponsePage/)
  assert.match(read('src/components/auth/RequireAuth.tsx'), /ROUTES\.findings,/)
  assert.match(read('src/components/dashboard/DashboardSidebar.tsx'), /clientFindings\.navLabel[\s\S]*?ROUTES\.findings/)
  assert.match(read('src/components/dashboard/MobileBottomNav.tsx'), /clientFindings\.navLabel[\s\S]*?ROUTES\.findings/)
  const response = read('src/pages/ClientFindingResponsePage.tsx')
  // Artifact client-mode layout: tabs, response form, evidence, more details, status rail, no reviewer actions.
  assert.match(response, /RESPONSE_TABS\.map/)
  assert.match(response, /EvidenceUploadField/)
  assert.match(response, /cab\.nonconformityResponse\.moreDetails/)
  assert.match(response, /cab\.nonconformityResponse\.effectivenessReview/)
  assert.match(response, /cab\.nonconformityResponse\.statusCard/)
  assert.ok(!/reviewerAction|requestRevision|closeAfterVerification/.test(response))
  assert.equal((response.match(/^\s+disabled$/gm) ?? []).length >= 8, true)
  assert.match(response, /disabled\n\s+className="h-11 w-full text-\[14px\]"/)
  assert.ok(!/saveResponseDraft|submitResponse\(|localStorage/.test(response))
  assert.ok(!/localStorage|MOCK_REGISTER/.test(read('src/lib/api/clientFindingsApi.ts')))
})
