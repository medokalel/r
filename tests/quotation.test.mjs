// Run: node --test tests/quotation.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function load(name, dependencies = {}) {
  const exports = {}
  const source = readFileSync(new URL(`../src/${name}.ts`, import.meta.url), 'utf8')
  runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports, URL,
    require: (dependency) => dependencies[dependency] ?? {},
  })
  return exports
}

const pricing = { auditDays: 2.5, dailyRate: 100.10, currency: 'USD' }
const money = load('lib/cabQuotation')
const { REVIEW_SECTIONS } = load('lib/api/cabApplicationReviewApi')
const complete = Object.fromEntries(REVIEW_SECTIONS.map((key) => [key, 'complete']))

test('quotation workflow: precise prices, completed reviews, API failures, and profile persistence', async () => {
  const travel = { id: 'travel', description: 'Travel', amount: '50.20' }
  const other = { id: 'other', description: 'Other', amount: '0.10' }
  assert.equal(money.calculateQuotation(pricing, []).total, 250.25)
  assert.equal(money.calculateQuotation(pricing, [travel, other]).total, 300.55)
  assert.equal(money.calculateQuotation(pricing, [{ ...travel, amount: '25.00' }]).total, 275.25)
  assert.equal(money.calculateQuotation(pricing, [other]).total, 250.35)
  assert.equal(money.calculateQuotation({ ...pricing, auditDays: 0.5, dailyRate: 0.03 }, []).total, 0.02)
  for (const amount of ['', ' ', '-1', 'NaN', 'Infinity', '0.001', '9007199254740991']) {
    assert.equal(money.calculateQuotation(pricing, [{ ...travel, amount }]), null, amount)
  }
  assert.equal(money.calculateQuotation(pricing, [{ ...travel, description: ' ' }]), null)
  for (const value of [undefined, {}, { ...pricing, auditDays: 0 }, { ...pricing, dailyRate: -1 },
    { ...pricing, dailyRate: 0.001 }, { ...pricing, auditDays: Infinity },
    { ...pricing, currency: 'invalid' }]) {
    assert.equal(money.readQuotationPricing(value), null)
  }

  let currentSections = complete
  let currentPricing = pricing
  let fail = false
  const reviewRequests = []
  const applications = [
    { id: 'done', status: 'UNDER_REVIEW' },
    { id: 'incomplete', status: 'APPROVED' },
    { id: 'draft', status: 'DRAFT' },
    { id: 'rejected', status: 'REJECTED' },
  ]
  const api = load('lib/api/cabApplicationQuotationApi', {
    '@/lib/cabQuotation': money,
    '@/lib/api/cabApi': { getCabProfile: async () => ({
      cab: { legalEntityName: 'Real CAB', certificateSettings: { quotationDefaults: currentPricing } },
    }) },
    '@/lib/api/cabApplicationRegisterApi': { listCabApplications: async () => applications },
    '@/lib/api/cabCertificationApplicationApi': { getCabCertificationApplication: async (id) => ({
      id, status: 'UNDER_REVIEW', orderNumber: 'APP-123',
    }) },
    '@/lib/api/cabApplicationReviewApi': {
      REVIEW_SECTIONS,
      listSectionReviews: async (id) => {
        reviewRequests.push(id)
        if (fail) throw new Error('Unavailable')
        return id === 'incomplete' ? { ...complete, documents: 'partiallyComplete' } : currentSections
      },
    },
  })
  assert.equal(api.isQuotationReviewComplete('UNDER_REVIEW', complete), true)
  assert.equal(api.isQuotationReviewComplete('APPROVED', { ...complete, branches: 'notApplicable' }), true)
  assert.equal(api.isQuotationReviewComplete('DRAFT', complete), false)
  assert.equal(api.isQuotationReviewComplete('REJECTED', complete), false)
  for (const key of REVIEW_SECTIONS) {
    for (const status of [undefined, 'partiallyComplete', 'incomplete']) {
      assert.equal(api.isQuotationReviewComplete('UNDER_REVIEW', { ...complete, [key]: status }), false)
    }
  }
  const eligible = await api.listQuotationApplications()
  assert.equal(eligible.length, 1)
  assert.equal(eligible[0].id, 'done')
  assert.deepEqual(reviewRequests, ['done', 'incomplete'])
  const quote = await api.getCabApplicationQuotation('done')
  assert.equal(quote.application.orderNumber, 'APP-123')
  assert.equal(quote.cab.legalEntityName, 'Real CAB')
  assert.equal(quote.pricing.dailyRate, 100.10)
  assert.equal(quote.reviewComplete, true)
  currentSections = { ...complete, documents: 'incomplete' }
  assert.equal((await api.getCabApplicationQuotation('done')).reviewComplete, false)
  currentPricing = undefined
  assert.equal((await api.getCabApplicationQuotation('done')).pricing, null)
  fail = true
  await assert.rejects(api.listQuotationApplications(), /Unavailable/)
  await assert.rejects(api.getCabApplicationQuotation('done'), /Unavailable/)

  // A subsequent profile/onboarding save must retain pricing and other JSON settings.
  const setup = load('lib/cabSetupForm')
  const mapper = load('lib/cabSetupMapper', {
    '@/lib/cabSetupForm': setup,
    '@/lib/api/cabSetupApi': { getSchemeOptions: () => [] },
  })
  const form = { cabSetup: setup.emptyCabSetupForm, languages: [], legalEntityName: 'Updated CAB' }
  const draft = mapper.mapFormToCabSetupDraft(form, {
    certificateSettings: { quotationDefaults: pricing, retainedSetting: 'keep' },
  })
  assert.equal(draft.legalEntityName, 'Updated CAB')
  assert.equal(draft.certificateSettings.quotationDefaults, pricing)
  assert.equal(draft.certificateSettings.retainedSetting, 'keep')
})

test('clickable quotation headers preserve inputs and display dates and team', () => {
  const source = readFileSync(new URL('../src/pages/CabApplicationQuotationPage.tsx', import.meta.url), 'utf8')
  const state = [{ application: { id: 'app', legalInfo: {}, certificates: [] }, cab: {}, pricing, reviewComplete: true }, false, false, [], 0, 1, '', '', '', '']
  let cursor = 0
  const exports = {}
  const jsx = (type, props) => ({ type, props })
  runInNewContext(ts.transpileModule(source + '\nexport { QuotationEditor }', {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    exports, Intl, Date,
    require: (name) => {
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx }
      if (name === 'react') return { useEffect() {}, useState: () => {
        const index = cursor++
        return [state[index], (value) => { state[index] = typeof value === 'function' ? value(state[index]) : value }]
      } }
      if (name === 'react-i18next') return { useTranslation: () => ({ t: (key) => key, i18n: { language: 'en' } }) }
      if (name.endsWith('/cabQuotation')) return money
      if (name.endsWith('/routes')) return { ROUTES: {} }
      if (name.endsWith('/workflowSteps')) return { buildCabWorkflowSteps: () => [] }
      return {}
    },
  })
  const render = () => { cursor = 0; return exports.QuotationEditor({ applicationId: 'app' }) }
  const nodes = (node) => !node || typeof node !== 'object' ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)]
  const selectHeader = (label) => nodes(render()).find((node) => node.type === 'button' && node.props.children === label).props.onClick()
  selectHeader('cab.sidebar.quotation')
  assert.equal(state[5], 3)
  assert.equal(nodes(render()).find((node) => node.type?.name === 'SummaryStatCard' && node.props.icon === 'team').props.primary, 'cab.quotationEditor.notSet')
  selectHeader('cab.applications.quotation.stats.proposedAuditDates')
  state[6] = '2026-11-05'; state[7] = '2026-11-04'
  assert.ok(nodes(render()).some((node) => node.props?.role === 'alert'))
  state[7] = '2026-11-07'
  selectHeader('cab.applications.quotation.stats.auditTeam')
  assert.equal(state[5], 2)
  state[8] = 'Lead Auditor\nSecond Auditor'; state[9] = 'Technical Expert'
  selectHeader('cab.sidebar.quotation')
  assert.equal(state[5], 3)
  const cards = nodes(render()).filter((node) => node.type?.name === 'SummaryStatCard')
  assert.equal(cards.find((node) => node.props.icon === 'team').props.primary, 'Lead Auditor, Second Auditor')
  assert.match(cards.find((node) => node.props.icon === 'team').props.secondary, /Technical Expert/)
  assert.match(cards.find((node) => node.props.icon === 'calendar').props.primary, /11\/5\/2026/)
  assert.equal(cards.find((node) => node.props.icon === 'amount').props.primary, '$250.25')
  selectHeader('cab.applications.quotation.stats.proposedAuditDates')
  assert.equal(state[5], 1)
  assert.equal(state[8], 'Lead Auditor\nSecond Auditor')
})
