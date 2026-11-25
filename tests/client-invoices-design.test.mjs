// Run: node --test tests/client-invoices-design.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const compile = (code) =>
  ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText

const lib = {}
runInNewContext(compile(read('src/lib/invoiceStatus.ts')), { exports: lib, require: () => ({}) })

test('every API invoice status has its own label key and badge style', () => {
  assert.equal(lib.invoiceStatusLabelKey('PAYMENT_MADE'), 'invoicesLegacy.paymentMade')
  assert.equal(lib.invoiceStatusLabelKey('PENDING'), 'invoicesLegacy.filters.pending')
  assert.equal(lib.invoiceStatusLabelKey('OVERDUE'), 'invoicesLegacy.filters.overdue')
  for (const status of ['PAYMENT_MADE', 'PENDING', 'OVERDUE']) assert.ok(lib.INVOICE_STATUS_STYLES[status])
  assert.notEqual(lib.INVOICE_STATUS_STYLES.PENDING, lib.INVOICE_STATUS_STYLES.PAYMENT_MADE)
})

test('the invoices table keeps every legacy column and function', () => {
  const src = read('src/components/dashboard/invoices/InvoicesTable.tsx')
  for (const key of [
    'commercialRegister', 'username', 'email', 'orderNumber', 'orderStatus', 'invoiceType',
    'paymentNumber', 'paymentDate', 'totalAmount', 'currency', 'invoiceStatus', 'details',
  ]) assert.ok(src.includes(`invoicesLegacy.columns.${key}`), key)
  for (const fn of ['previewFieldsDocument', 'printFieldsDocument', 'downloadPdfFromTable', 'downloadExcelCsv', 'onExportAll', 'toggleAll'])
    assert.ok(src.includes(fn), fn)
  assert.ok(src.includes("value: 'PENDING'") && src.includes("value: 'OVERDUE'") && src.includes("value: 'GBP'"))
})

test('invoices data source and params are unchanged', () => {
  const api = read('src/lib/api/invoicesApi.ts')
  assert.ok(api.includes('/billing/invoices'))
  const page = read('src/pages/InvoicesPage.tsx')
  assert.ok(page.includes('limit: PAGE_SIZE') && page.includes('listInvoices'))
})

test('new locale block exists in both languages', () => {
  for (const lang of ['en', 'ar']) {
    const json = JSON.parse(read(`src/i18n/locales/${lang}.json`))
    for (const k of ['subtitle', 'export', 'empty']) assert.ok(json.clientInvoices[k], `${lang}.${k}`)
  }
})

const exp = {}
runInNewContext(compile(read('src/lib/invoiceExport.ts')), { exports: exp, require: () => ({}), Error, Math })
const mkRows = (n, from = 0) => Array.from({ length: n }, (_, i) => ({ id: `r${from + i}` }))

test('export fetches every page and keeps all rows', async () => {
  const calls = []
  const rows = await exp.fetchAllInvoices(async (page) => {
    calls.push(page)
    // API clamps the requested limit to 100 per page, 250 rows total
    const size = page === 3 ? 50 : 100
    return { items: mkRows(size, (page - 1) * 100), total: 250, page, limit: 100, totalPages: 3 }
  })
  assert.deepEqual(calls, [1, 2, 3])
  assert.equal(rows.length, 250)
})

test('export fails instead of returning a partial file', async () => {
  await assert.rejects(
    exp.fetchAllInvoices(async (page) => ({ items: mkRows(100), total: 300, page, limit: 100, totalPages: 1 })),
    /incomplete/,
  )
  await assert.rejects(
    exp.fetchAllInvoices(async (page) => ({ items: page === 1 ? mkRows(100) : [], total: 300, page, limit: 100, totalPages: 3 })),
    /incomplete/,
  )
  await assert.rejects(
    exp.fetchAllInvoices(async (page) => {
      if (page === 2) throw new Error('network')
      return { items: mkRows(100), total: 200, page, limit: 100, totalPages: 2 }
    }),
    /network/,
  )
})

test('mobile cards show order status and invoice type', () => {
  const src = read('src/components/dashboard/invoices/InvoicesTable.tsx')
  const mobile = src.slice(src.indexOf('{invoices.map((invoice, index) => ('))
  assert.ok(mobile.includes('invoice.orderStatus') && mobile.includes('invoice.invoiceType'))
})
