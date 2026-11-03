import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/lib/api/cabQuotationApi.ts', import.meta.url), 'utf8')
function apiFor(configs, fail = false) {
  const exports = {}, writes = []
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, require: () => ({ authorizedRequest: async (path, init) => {
      assert.equal(path, '/cab/pricing-config')
      if (!init) return configs
      const payload = JSON.parse(init.body)
      if (fail && payload.standardId) throw new Error('Cannot save scheme pricing')
      writes.push(payload)
      return payload
    } }),
  })
  return { api: exports, writes }
}
const global = { id: 'global', standardId: null, dailyRate: '100', taxRate: '0.15', currency: 'EGP', isActive: true }
const scheme = { id: 'scheme', standardId: 'iso9001', dailyRate: '250', taxRate: '0.05', currency: 'USD', isActive: true }

test('every profile currency is saved to active scheme pricing without changing rates or taxes', async () => {
  for (const currency of ['SAR', 'USD', 'EGP', 'EUR', 'GBP']) {
    const { api, writes } = apiFor([global, scheme, { ...scheme, standardId: 'inactive', isActive: false }])
    await api.upsertPricingConfig({ dailyRate: 100, taxRate: 0.15, currency })
    assert.deepEqual(writes.at(-1), { dailyRate: 100, taxRate: 0.15, currency })
    const override = writes.find((p) => p.standardId === 'iso9001')
    if (currency !== scheme.currency) assert.deepEqual(override, { standardId: 'iso9001', dailyRate: 250, taxRate: 0.05, currency })
    else assert.equal(override, undefined)
    assert.ok(!writes.some((p) => p.standardId === 'inactive'))
  }
})

test('quotation generation uses the latest profile currency even when daily rate did not change', async () => {
  const { api, writes } = apiFor([global, scheme])
  const saved = await api.prepareQuotationPricing(100)
  assert.equal(saved.currency, 'EGP')
  assert.ok(writes.every((p) => p.currency === 'EGP'))
  await assert.rejects(apiFor([]).api.prepareQuotationPricing(100), /profile first/)
  const broken = apiFor([global, scheme], true)
  await assert.rejects(broken.api.prepareQuotationPricing(100), /Cannot save/)
  assert.equal(broken.writes.length, 0)
})
