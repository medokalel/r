// Run: node --test tests/client-portal-routing.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const routesSource = readFileSync(new URL('../src/lib/routes.ts', import.meta.url), 'utf8')
const source = readFileSync(new URL('../src/lib/clientPortalRouting.ts', import.meta.url), 'utf8')
const compile = (code) =>
  ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText

const routesExports = {}
runInNewContext(compile(routesSource), { exports: routesExports })
const exports = {}
runInNewContext(compile(source), {
  exports,
  require: (dependency) => (dependency === '@/lib/routes' ? routesExports : {}),
})
const { resolveClientPortalRoute } = exports

test('portal paths map to the Audit Client screen of the same subject', () => {
  const expected = {
    '/portal': '/dashboard',
    '/portal/home': '/dashboard',
    '/portal/company-profile': '/settings/company-profile',
    '/portal/applications': '/certification-requests',
    '/portal/offers': '/offers',
    '/portal/invoices': '/invoices',
    '/portal/agreements': '/agreements',
    '/portal/audits': '/audits',
    '/portal/audits/': '/audits',
  }
  for (const [path, to] of Object.entries(expected)) {
    assert.deepEqual({ ...resolveClientPortalRoute(path) }, { kind: 'redirect', to }, path)
  }
})

test('sections the client layer does not have say so instead of redirecting', () => {
  assert.deepEqual({ ...resolveClientPortalRoute('/portal/findings') }, { kind: 'unavailable', section: 'findings' })
  assert.deepEqual({ ...resolveClientPortalRoute('/portal/certificates') }, { kind: 'unavailable', section: 'certificates' })
})

test('unknown portal paths are reported as not found', () => {
  assert.deepEqual({ ...resolveClientPortalRoute('/portal/nope') }, { kind: 'unavailable', section: 'notFound' })
})

test('every redirect target is a real client route', () => {
  const clientRoutes = new Set(['/dashboard', '/settings/company-profile', '/certification-requests', '/offers', '/agreements', '/invoices', '/audits'])
  for (const path of ['/portal', '/portal/home', '/portal/company-profile', '/portal/applications', '/portal/offers', '/portal/agreements', '/portal/invoices', '/portal/audits']) {
    const r = resolveClientPortalRoute(path)
    assert.ok(clientRoutes.has(r.to), path)
  }
})

test('client navigation has no dead entries', () => {
  for (const file of ['DashboardSidebar', 'MobileBottomNav']) {
    const text = readFileSync(new URL(`../src/components/dashboard/${file}.tsx`, import.meta.url), 'utf8')
    assert.ok(!text.includes('sidebar.documents'), `${file} documents`)
    assert.ok(!text.includes('sidebar.accreditation'), `${file} accreditation`)
    for (const line of text.split(/\r?\n/).filter((l) => l.includes("labelKey: '") && l.includes('icon:'))) {
      assert.ok(line.includes('href:'), `${file}: ${line.trim()}`)
    }
  }
})

test('client navigation has an Agreements entry after Offers on desktop and in the mobile More list', () => {
  for (const file of ['DashboardSidebar', 'MobileBottomNav']) {
    const text = readFileSync(new URL(`../src/components/dashboard/${file}.tsx`, import.meta.url), 'utf8')
    assert.ok(text.includes("labelKey: 'accreditation.sidebar.agreements', href: ROUTES.agreements"), file)
  }
})
