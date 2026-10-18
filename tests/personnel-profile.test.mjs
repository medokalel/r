// Run: node --test tests/personnel-profile.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
function loadCatalog(name) {
  if (name === '@/i18n') return { default: { language: 'en' } }
  const exports = {}
  const source = readFileSync(new URL(`../src/${name.slice(2)}.ts`, import.meta.url), 'utf8')
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, require: (dependency) => dependency.startsWith('@/') ? loadCatalog(dependency) : require(dependency),
  })
  return exports
}

test('profile saves optional dates, edits existing data, and preserves evaluation records', () => {
  let list = []
  let state = []
  let cursor = 0
  let saved
  let failStorage = false
  let tree
  const jsx = (type, props) => ({ type, props })
  const exports = {}
  const source = readFileSync(new URL('../src/components/dashboard/cab/PersonnelProfileForm.tsx', import.meta.url), 'utf8')
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, crypto: { randomUUID: () => 'new-person' },
    require: (name) => {
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx }
      if (name === 'react') return { useState: (initial) => {
        const index = cursor++
        if (!(index in state)) state[index] = initial
        return [state[index], (value) => { state[index] = typeof value === 'function' ? value(state[index]) : value }]
      } }
      if (name === 'react-i18next') return { useTranslation: () => ({ t: (key) => key, i18n: { language: 'en', dir: () => 'ltr' } }) }
      if (name.endsWith('cabCompetenceApi')) return {
        ...loadCatalog(name),
        getStoredPersonnel: () => list,
        savePersonnelList: (next) => { if (failStorage) throw Error('Quota'); list = next },
      }
      if (name.endsWith('SearchableSelect')) return { SearchableSelect: 'SearchableSelect' }
      if (name.endsWith('MultiSelect')) return { MultiSelect: 'MultiSelect' }
      if (['countries', 'cabSetupApi', 'applicationDraftApi', 'companyProfile/constants', 'iafCodes'].some((suffix) => name.endsWith(suffix))) return loadCatalog(name)
      return {}
    },
  })
  const findForm = (node) => {
    if (node?.type === 'form') return node
    const children = node?.props?.children
    return (Array.isArray(children) ? children : [children]).filter(Boolean).map(findForm).find(Boolean)
  }
  const submit = (person) => {
    cursor = 0
    tree = exports.PersonnelProfileForm({ person, onCancel() {}, onSaved: (value) => { saved = value } })
    findForm(tree).props.onSubmit({ preventDefault() {} })
  }
  submit()
  state[0] = { ...state[0], name: ' New Member ', email: 'member@example.com', phone: '+201001234567', iafCodes: ['IAF_01'], qualifications: 'Lead auditor', avatarUrl: 'data:image/png;base64,test' }
  submit()
  assert.equal(saved.name, 'New Member')
  const today = new Date()
  assert.equal(saved.employmentStartDate, `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`)
  const fields = []
  const collect = (node) => {
    if (!node || typeof node !== 'object') return
    if (node.props?.options) fields.push(node.props)
    const children = node.props?.children
    ;(Array.isArray(children) ? children : [children]).forEach(collect)
  }
  collect(tree)
  assert.ok(fields.find((field) => field.id === 'personnel-country').options.length > 200)
  assert.equal(fields.find((field) => field.id === 'personnel-sector').options.length, 39)
  assert.ok(fields.find((field) => field.id === 'personnel-qualifications').options.some((option) => option.value === 'Doctorate / PhD'))
  assert.ok(fields.some((field) => field.searchable && field.options.some((option) => option.value === 'ISO 50001')))
  assert.equal(saved.employmentEndDate, '')
  assert.equal(saved.iafCodes[0], 'IAF_01')
  list[0].evaluation = { comments: 'Keep this evaluation' }
  const original = list[0]
  state = []
  submit(original)
  state[0] = { ...state[0], name: 'Updated Member', employmentStartDate: '2026-10-01', employmentEndDate: '2026-09-01' }
  submit(original)
  assert.equal(list[0].name, 'New Member')
  assert.match(state[1], /dateError$/)
  state[0].employmentEndDate = '2026-11-01'
  submit(original)
  assert.equal(list.length, 1)
  assert.equal(list[0].name, 'Updated Member')
  assert.equal(list[0].evaluation.comments, 'Keep this evaluation')
  assert.equal(list[0].avatarUrl, original.avatarUrl)
  assert.equal(list[0].employmentStartDate, '2026-10-01')
  state[0].employmentStartDate = ''
  state[0].employmentEndDate = ''
  submit(list[0])
  assert.equal(list[0].employmentStartDate, '')
  state = []
  submit(list[0])
  assert.equal(list[0].employmentStartDate, '')
  failStorage = true
  state[0].name = 'Unsaved Member'
  submit(list[0])
  assert.equal(list[0].name, 'Updated Member')
  assert.match(state[1], /saveError$/)
})
