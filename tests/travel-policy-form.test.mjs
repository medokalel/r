import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/lib/travelPolicyForm.ts', import.meta.url), 'utf8')
const exports = {}
runInNewContext(
  ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  { exports }
)
const form = exports

// Results come from another realm; normalise before deep comparisons.
const plain = (value) => JSON.parse(JSON.stringify(value))

function samplePolicy() {
  const settings = { longFlightCabin: 'BUSINESS', insuranceDomestic: false, perDiemOnLocalAudits: true }
  form.TRAVEL_NUMERIC_SETTINGS.forEach((key, index) => {
    settings[key] = index + 1.5
  })
  return {
    currency: 'SAR',
    settings,
    countries: [
      { country: 'SA', perDiem: 300, hotelCap: 650, visaFee: 535, note: 'e-visa', sample: true },
      { country: 'EG', perDiem: 220, hotelCap: 500, visaFee: 95, note: '', sample: false },
    ],
    cities: [{ cityKey: 'riyadh', hotelCap: 700, sample: true }],
    railRoutes: [{ from: 'cairo', to: 'alexandria', fare: 25, hours: 2.5, operator: 'ENR', sample: false }],
  }
}

test('the four setting groups cover every numeric setting exactly once', () => {
  const keys = form.TRAVEL_NUMERIC_SETTINGS
  assert.equal(keys.length, 31)
  assert.equal(new Set(keys).size, keys.length)
  assert.deepEqual(plain(form.TRAVEL_SETTING_GROUPS.map((group) => group.key)), ['transport', 'trip', 'costs', 'pricing'])
})

test('a policy becomes a draft with string numbers and confirmed = not sample', () => {
  const draft = form.policyToDraft(samplePolicy())
  assert.equal(draft.settings.carVsFlightKm, String(samplePolicy().settings.carVsFlightKm))
  assert.equal(draft.longFlightCabin, 'BUSINESS')
  assert.equal(draft.perDiemOnLocalAudits, true)
  assert.deepEqual(plain(draft.countries.map((row) => [row.country, row.perDiem, row.confirmed])), [
    ['SA', '300', false],
    ['EG', '220', true],
  ])
  assert.equal(new Set(draft.countries.map((row) => row.id)).size, 2)
})

test('a draft round-trips to the original API payload', () => {
  const policy = samplePolicy()
  assert.deepEqual(plain(form.draftToInput(form.policyToDraft(policy))), plain(policy))
})

test('the payload trims text and upper-cases currency and country codes', () => {
  const draft = form.policyToDraft(samplePolicy())
  draft.currency = ' sar '
  draft.countries[0].country = ' sa '
  draft.countries[0].note = '  needs a visa  '
  const input = form.draftToInput(draft)
  assert.equal(input.currency, 'SAR')
  assert.equal(input.countries[0].country, 'SA')
  assert.equal(input.countries[0].note, 'needs a visa')
})

test('a valid policy has no validation errors', () => {
  assert.deepEqual(plain(form.validateDraft(form.policyToDraft(samplePolicy()))), {})
})

test('empty, negative and non-numeric values are rejected with a code', () => {
  const draft = form.policyToDraft(samplePolicy())
  draft.settings.carVsFlightKm = ''
  draft.settings.fuelPerKm = '-1'
  draft.settings.roadFactor = 'abc'
  const errors = plain(form.validateDraft(draft))
  assert.equal(errors['settings.carVsFlightKm'], 'required')
  assert.equal(errors['settings.fuelPerKm'], 'number')
  assert.equal(errors['settings.roadFactor'], 'number')
  assert.equal(Object.keys(errors).length, 3)
})

test('currency and country codes must have the right length', () => {
  const draft = form.policyToDraft(samplePolicy())
  draft.currency = 'SR'
  draft.countries[0].country = 'SAU'
  const errors = plain(form.validateDraft(draft))
  assert.equal(errors.currency, 'currency')
  assert.equal(errors[form.rowErrorKey('countries', draft.countries[0].id, 'country')], 'country')
})

test('duplicate countries and cities, and a rail route to itself, are flagged on the rows involved', () => {
  const draft = form.policyToDraft(samplePolicy())
  draft.countries[1].country = 'sa'
  draft.cities.push(form.createCityRow('riyadh'))
  draft.railRoutes[0].to = draft.railRoutes[0].from
  const errors = plain(form.validateDraft(draft))
  assert.equal(errors[form.rowErrorKey('countries', draft.countries[0].id, 'country')], 'duplicateCountry')
  assert.equal(errors[form.rowErrorKey('countries', draft.countries[1].id, 'country')], 'duplicateCountry')
  assert.equal(errors[form.rowErrorKey('cities', draft.cities[1].id, 'cityKey')], 'duplicateCity')
  assert.equal(errors[form.rowErrorKey('railRoutes', draft.railRoutes[0].id, 'to')], 'sameCities')
})

test('new rows start confirmed and need a valid country code before saving', () => {
  const draft = form.policyToDraft(samplePolicy())
  const row = form.createCountryRow()
  assert.equal(row.confirmed, true)
  draft.countries.push(row)
  assert.equal(plain(form.validateDraft(draft))[form.rowErrorKey('countries', row.id, 'country')], 'country')
})

test('unconfirmed sample rows are counted across all three tables', () => {
  const draft = form.policyToDraft(samplePolicy())
  assert.equal(form.countSampleRows(draft), 2)
  draft.cities[0].confirmed = true
  assert.equal(form.countSampleRows(draft), 1)
})

test('the snapshot ignores row ids but notices real edits', () => {
  const policy = samplePolicy()
  const baseline = form.serializeDraft(form.policyToDraft(policy))
  assert.equal(form.serializeDraft(form.policyToDraft(policy)), baseline)

  const edited = form.policyToDraft(policy)
  edited.countries[0].perDiem = '301'
  assert.notEqual(form.serializeDraft(edited), baseline)
})

test('updateRow and removeRow return new arrays and leave the originals untouched', () => {
  const rows = [form.createCityRow('riyadh'), form.createCityRow('jeddah')]
  const updated = form.updateRow(rows, rows[0].id, { hotelCap: '900' })
  assert.equal(updated[0].hotelCap, '900')
  assert.equal(rows[0].hotelCap, '0')
  assert.equal(form.removeRow(rows, rows[1].id).length, 1)
  assert.equal(rows.length, 2)
})

test('an error key maps back to the id of the input that shows it', () => {
  const draft = form.policyToDraft(samplePolicy())
  const country = draft.countries[0]
  assert.equal(form.fieldIdForError('currency'), form.TRAVEL_CURRENCY_FIELD_ID)
  assert.equal(form.fieldIdForError(form.settingErrorKey('carVsFlightKm')), form.settingFieldId('carVsFlightKm'))
  assert.equal(
    form.fieldIdForError(form.rowErrorKey('countries', country.id, 'perDiem')),
    form.rowFieldId('countries', country.id, 'perDiem')
  )
})

test('the saved-at timestamp is formatted, and an invalid value is returned unchanged', () => {
  assert.match(form.formatPolicyTimestamp('2026-11-05T10:30:00.000Z', 'en'), /2026/)
  assert.equal(form.formatPolicyTimestamp('not a date', 'en'), 'not a date')
})
