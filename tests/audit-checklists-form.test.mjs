import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/lib/auditChecklistForm.ts', import.meta.url), 'utf8')
const exports = {}
runInNewContext(
  ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  { exports, Date }
)
const form = exports

const readJson = (name) =>
  JSON.parse(readFileSync(new URL(`../src/lib/api/auditChecklistLibrary/${name}`, import.meta.url), 'utf8'))

// Results come from another realm; normalise before deep comparisons.
const plain = (value) => JSON.parse(JSON.stringify(value))

const item = (id, clause, extra = {}) => ({
  ...form.createBlankItem(),
  id,
  clause,
  title: `Title ${id}`,
  requirement: `Requirement ${id}`,
  ...extra,
})

const checklist = (id, standardCode, extra = {}) => ({
  id,
  source: 'cab',
  kind: 'CUSTOM',
  status: 'ACTIVE',
  isDefault: false,
  reviewStatus: null,
  reviewNote: null,
  standardCode,
  standardLabel: '',
  name: `Checklist ${id}`,
  nameAr: '',
  description: '',
  version: '1',
  items: [],
  ...extra,
})

test('library files map to flat checklists with bilingual fields', () => {
  const iso = form.libraryFileToChecklist(readJson('iso-9001.json'))
  assert.equal(iso.id, 'iso-9001')
  assert.equal(iso.source, 'library')
  assert.equal(iso.items.length, 65)
  assert.equal(new Set(iso.items.map((entry) => entry.id)).size, 65)
  assert.ok(iso.name && iso.nameAr)
  assert.ok(iso.items.every((entry) => entry.title && entry.titleAr && entry.requirement && entry.requirementAr))

  const stage1 = form.libraryFileToChecklist(readJson('stage1-readiness.json'))
  assert.equal(stage1.kind, 'STAGE1_READINESS')
  assert.equal(stage1.items.length, 13)
  assert.deepEqual([...new Set(stage1.items.flatMap((entry) => entry.stages))], ['stage1'])
})

test('copyChecklist makes an independent, non-default copy with new ids', () => {
  const original = checklist('a', 'ISO_9001', {
    isDefault: true,
    reviewStatus: 'approved',
    nameAr: 'اسم',
    items: [item('a:1', '4.1', { stages: ['stage1'], evidencePrompts: ['x'] })],
  })
  const copy = form.copyChecklist(original, { en: '(copy)', ar: '(نسخة)' })
  assert.notEqual(copy.id, original.id)
  assert.equal(copy.source, 'cab')
  assert.equal(copy.isDefault, false)
  assert.equal(copy.reviewStatus, null)
  assert.equal(copy.name, 'Checklist a (copy)')
  assert.equal(copy.nameAr, 'اسم (نسخة)')
  assert.notEqual(copy.items[0].id, 'a:1')
  copy.items[0].stages.push('stage2')
  copy.items[0].evidencePrompts.push('y')
  assert.deepEqual(plain(original.items[0].stages), ['stage1'])
  assert.deepEqual(plain(original.items[0].evidencePrompts), ['x'])
})

test('only one active default per standard; archiving drops the default', () => {
  const list = [
    checklist('a', 'ISO_9001', { isDefault: true }),
    checklist('b', 'ISO_9001'),
    checklist('c', 'HALAL', { isDefault: true }),
    checklist('d', 'ISO_9001', { status: 'ARCHIVED' }),
  ]
  const next = form.setDefaultChecklist(list, 'b')
  assert.deepEqual(plain(next.map((entry) => entry.isDefault)), [false, true, true, false])
  assert.equal(form.setDefaultChecklist(list, 'd'), list)

  const archived = form.toggleArchived(next, 'b')
  assert.equal(archived[1].status, 'ARCHIVED')
  assert.equal(archived[1].isDefault, false)
  assert.equal(form.toggleArchived(archived, 'b')[1].status, 'ACTIVE')
})

test('filterChecklists hides archived unless asked and searches names and standards', () => {
  const list = [
    checklist('a', 'ISO_9001', { name: 'Quality', standardLabel: 'ISO 9001:2015' }),
    checklist('b', 'HALAL', { name: 'Halal scheme', nameAr: 'مخطط الحلال', status: 'ARCHIVED' }),
  ]
  assert.equal(form.filterChecklists(list, { search: '', includeArchived: false }).length, 1)
  assert.equal(form.filterChecklists(list, { search: '', includeArchived: true }).length, 2)
  assert.equal(form.filterChecklists(list, { search: 'iso 9001', includeArchived: false }).length, 1)
  assert.equal(form.filterChecklists(list, { search: 'الحلال', includeArchived: true })[0].id, 'b')
  assert.equal(form.filterChecklists(list, { search: 'nothing', includeArchived: true }).length, 0)
})

test('sortChecklists puts the default first, then sorts by name', () => {
  const sorted = form.sortChecklists([
    checklist('b', 'X', { name: 'B' }),
    checklist('c', 'X', { name: 'C', isDefault: true }),
    checklist('a', 'X', { name: 'A' }),
  ])
  assert.deepEqual(plain(sorted.map((entry) => entry.id)), ['c', 'a', 'b'])
})

test('clauses are grouped by their heading, annex clauses by their first two segments', () => {
  assert.equal(form.clauseGroup('4.4.1'), '4')
  assert.equal(form.clauseGroup('A.5.12'), 'A.5')
  assert.equal(form.clauseGroup('  '), '·')
  assert.equal(form.isAnnexGroup('A.5'), true)
  const groups = form.groupItemsByClause([item('1', '4.1'), item('2', '4.2'), item('3', '5.1'), item('4', '4.3')])
  assert.deepEqual(plain(groups.map((entry) => [entry.group, entry.items.length])), [['4', 2], ['5', 1], ['4', 1]])
})

test('filterItems matches clause, titles and requirements', () => {
  const items = [item('1', '4.1', { title: 'Context' }), item('2', '5.2', { titleAr: 'السياسة' })]
  assert.equal(form.filterItems(items, '').length, 2)
  assert.equal(form.filterItems(items, '5.2')[0].id, '2')
  assert.equal(form.filterItems(items, 'context')[0].id, '1')
  assert.equal(form.filterItems(items, 'السياسة')[0].id, '2')
})

test('moveItem swaps neighbours and ignores out-of-range moves', () => {
  const items = [item('1', '1'), item('2', '2'), item('3', '3')]
  assert.deepEqual(plain(form.moveItem(items, 1, -1).map((entry) => entry.id)), ['2', '1', '3'])
  assert.deepEqual(plain(form.moveItem(items, 1, 1).map((entry) => entry.id)), ['1', '3', '2'])
  assert.equal(form.moveItem(items, 0, -1), items)
  assert.equal(form.moveItem(items, 2, 1), items)
})

test('validateDraft reports every missing required field and clears when valid', () => {
  const bad = form.validateDraft({
    name: ' ',
    nameAr: '',
    standardCode: '',
    standardLabel: '',
    description: '',
    items: [{ ...form.createBlankItem(), id: 'x' }],
  })
  assert.deepEqual(plain(bad), {
    name: 'nameRequired',
    standardCode: 'standardCodeRequired',
    'items.x.clause': 'clauseRequired',
    'items.x.title': 'titleRequired',
    'items.x.requirement': 'requirementRequired',
  })
  assert.equal(form.firstInvalidItemId(bad), 'x')
  assert.equal(form.fieldIdForError('items.x.clause'), 'checklist-item-x-clause')
  assert.equal(form.fieldIdForError('standardCode'), 'checklist-standardCode')
  assert.equal(form.firstInvalidItemId({ name: 'nameRequired' }), null)

  const ok = form.validateDraft({
    name: 'A',
    nameAr: '',
    standardCode: 'A',
    standardLabel: '',
    description: '',
    items: [item('1', '4.1')],
  })
  assert.deepEqual(plain(ok), {})
})

test('standard codes are normalised and applyDraft trims text', () => {
  assert.equal(form.normalizeStandardCode('halal scheme-1'), 'HALAL_SCHEME-1')
  const base = checklist('a', 'OLD', { items: [item('1', '4.1')] })
  const saved = form.applyDraft(base, {
    name: '  New name ',
    nameAr: '',
    standardCode: 'new code',
    standardLabel: ' ISO ',
    description: ' d ',
    items: [item('1', ' 4.2 ', { title: ' T ' })],
  })
  assert.equal(saved.name, 'New name')
  assert.equal(saved.standardCode, 'NEW_CODE')
  assert.equal(saved.standardLabel, 'ISO')
  assert.equal(saved.items[0].clause, '4.2')
  assert.equal(saved.items[0].title, 'T')
})

test('createCustomChecklist starts empty, active and not default', () => {
  const created = form.createCustomChecklist({ name: ' Halal ', standardCode: 'halal' })
  assert.equal(created.name, 'Halal')
  assert.equal(created.standardCode, 'HALAL')
  assert.equal(created.kind, 'CUSTOM')
  assert.equal(created.status, 'ACTIVE')
  assert.equal(created.isDefault, false)
  assert.equal(created.items.length, 0)
})

test('pickLocalized and line helpers', () => {
  assert.equal(form.pickLocalized(true, 'en', 'ar'), 'ar')
  assert.equal(form.pickLocalized(true, 'en', ' '), 'en')
  assert.equal(form.pickLocalized(false, 'en', 'ar'), 'en')
  assert.deepEqual(plain(form.linesToList(' a \n\n b\n')), ['a', 'b'])
  assert.equal(form.listToLines(['a', 'b']), 'a\nb')
})
