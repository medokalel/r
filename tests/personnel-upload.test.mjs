// Run: node --test tests/personnel-upload.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

test('failed documents remain retryable without duplicating the employee; existing documents reload', async () => {
  const state = [], effects = [], exports = {}
  let cursor = 0, firstRender = true, creates = 0, uploads = 0, saved = 0, fail = true
  const employee = { id: 'employee-1', status: 'ACTIVE', schemes: [], user: { fullName: 'Test', email: 'test@example.test' } }
  const qualification = { id: 'doc-1', originalName: 'certificate.pdf', fileUrl: '/uploads/certificate.pdf', uploadedAt: '2026-10-21' }
  const api = {
    CAB_PROFESSIONAL_ROLES: [], toBackendRole: () => 'AUDITOR', cleanIafCodes: (v) => v,
    createCabEmployee: async () => { creates++; return { employee } },
    updateCabEmployee: async (id) => { assert.equal(id, employee.id); return { employee } },
    uploadCabEmployeeQualification: async (id, file) => {
      uploads++; assert.equal(id, employee.id); assert.equal(file.name, 'certificate.pdf')
      if (fail) throw new Error('Upload unavailable')
      return { qualification }
    },
    getCabEmployeeDetail: async () => ({ employee: { ...employee, qualifications: [qualification] } }),
  }
  const jsx = (type, props) => ({ type, props })
  const source = readFileSync(new URL('../src/components/dashboard/cab/PersonnelProfileForm.tsx', import.meta.url), 'utf8')
  runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText, {
    exports, Intl, Date, crypto, URL: { createObjectURL: () => 'blob:pending', revokeObjectURL() {} },
    require: (name) => {
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx }
      if (name === 'react') return {
        useState: (initial) => { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], (v) => { state[i] = typeof v === 'function' ? v(state[i]) : v }] },
        useEffect: (fn) => { if (firstRender) effects.push(fn) },
      }
      if (name === 'react-i18next') return { useTranslation: () => ({ t: (key) => key, i18n: { language: 'en', dir: () => 'ltr' } }) }
      if (name === 'libphonenumber-js') return { getCountryCallingCode: () => '966' }
      if (name.endsWith('/cabEmployeesApi')) return api
      if (name.endsWith('/client')) return { ApiError: Error }
      if (name.endsWith('/cabApi')) return { getCabProfile: async () => ({ cab: { schemes: [{ schemeName: 'ISO 27001' }] } }) }
      if (name.endsWith('/cabSetupApi')) return { CAB_ACTIVITY_OPTIONS: [], getSchemeOptions: () => [{ label: 'ISO 9001' }, { label: 'ISO 27001' }] }
      if (name.endsWith('/applicationDraftApi')) return { STANDARD_SCHEMA_OPTIONS: [] }
      if (name.endsWith('/constants')) return { SECTOR_OPTIONS: [] }
      if (name.endsWith('/countries')) return { getCountryOptions: () => [] }
      if (name.endsWith('/iafCodes')) return { getIafCodeOptions: () => [] }
      if (name.endsWith('/utils')) return { cn: () => '' }
      return {}
    },
  })
  const render = (person) => { cursor = 0; const tree = exports.PersonnelProfileForm({ person, onSaved: () => saved++, onCancel() {} }); firstRender = false; return tree }
  const nodes = (node) => !node || typeof node !== 'object' ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)]
  let tree = render()
  effects.splice(0).forEach((fn) => fn()); await Promise.resolve(); await Promise.resolve()
  state[0].name = 'Test'; state[0].email = 'test@example.test'
  tree = render()
  const schemes = nodes(tree).find((n) => n.props?.placeholder === 'cab.competence.columns.schemes')
  assert.ok(schemes.props.options.some((o) => o.value === 'ISO 9001'), 'catalog must not shrink to CAB schemes')
  await nodes(tree).find((n) => n.props?.onSelectFile).props.onSelectFile({ name: 'certificate.pdf', size: 100 })
  await render().props.onSubmit({ preventDefault() {} })
  assert.equal(creates, 1); assert.equal(saved, 0)
  assert.ok(nodes(render()).some((n) => String(n.props?.children).includes('saving is incomplete')))
  fail = false
  await render().props.onSubmit({ preventDefault() {} })
  assert.equal(creates, 1); assert.equal(uploads, 2); assert.equal(saved, 1)
  state.length = 0; firstRender = true
  render({ id: employee.id, name: 'Test' })
  effects.splice(0).forEach((fn) => fn()); await Promise.resolve(); await Promise.resolve()
  assert.equal(nodes(render({ id: employee.id })).find((n) => n.props?.onSelectFile).props.files[0].url, qualification.fileUrl)
})
