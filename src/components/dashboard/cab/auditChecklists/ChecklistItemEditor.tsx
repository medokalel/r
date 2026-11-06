import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, ChevronDownIcon, TrashIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { FormLabel } from '@/components/ui/FormField'
import { Textarea, TextField } from '@/components/ui/TextField'
import {
  CHECKLIST_CLAUSE_MAX_LENGTH,
  CHECKLIST_ITEM_CODE_MAX_LENGTH,
  CHECKLIST_ITEM_TEXT_MAX_LENGTH,
  CHECKLIST_ITEM_TITLE_MAX_LENGTH,
  itemFieldId,
  linesToList,
  listToLines,
} from '@/lib/auditChecklistForm'
import { AUDIT_STAGES, type ChecklistItem } from '@/lib/auditChecklistTypes'

interface ChecklistItemEditorProps {
  item: ChecklistItem
  isFirst: boolean
  isLast: boolean
  getError: (field: 'clause' | 'title' | 'requirement') => string | undefined
  onChange: (patch: Partial<ChecklistItem>) => void
  onMove: (delta: -1 | 1) => void
  onRemove: () => void
}

interface LabeledTextareaProps {
  id: string
  label: string
  hint?: string
  required?: boolean
  dir?: 'rtl' | 'ltr'
  value: string
  error?: string
  onChange: (value: string) => void
  children?: ReactNode
}

/** The UI kit has a bare Textarea but no labelled one, so this pairs it with the shared FormLabel. */
function LabeledTextarea({ id, label, hint, required, dir, value, error, onChange }: LabeledTextareaProps) {
  return (
    <div className="space-y-2">
      <FormLabel htmlFor={id} required={required}>
        {label}
      </FormLabel>
      {hint && <p className="text-[12px] text-[var(--cab-muted)]">{hint}</p>}
      <Textarea
        id={id}
        dir={dir}
        maxLength={CHECKLIST_ITEM_TEXT_MAX_LENGTH}
        className="min-h-[96px]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
      />
      {error && <p className="text-small-light text-error-500">{error}</p>}
    </div>
  )
}

/** Edit form for one requirement of the CAB's own checklist (English and Arabic side by side). */
export function ChecklistItemEditor({
  item,
  isFirst,
  isLast,
  getError,
  onChange,
  onMove,
  onRemove,
}: ChecklistItemEditorProps) {
  const { t } = useTranslation()
  // The evidence boxes keep the raw text so Enter can start a new line; the item gets the cleaned list.
  const [evidenceText, setEvidenceText] = useState(() => listToLines(item.evidencePrompts))
  const [evidenceTextAr, setEvidenceTextAr] = useState(() => listToLines(item.evidencePromptsAr))
  const fieldId = (field: string) => itemFieldId(item.id, field)

  const toggleStage = (stage: (typeof AUDIT_STAGES)[number]) =>
    onChange({
      stages: item.stages.includes(stage) ? item.stages.filter((current) => current !== stage) : [...item.stages, stage],
    })

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <TextField
        id={fieldId('clause')}
        label={t('cab.auditChecklists.clause')}
        required
        dir="ltr"
        maxLength={CHECKLIST_CLAUSE_MAX_LENGTH}
        value={item.clause}
        error={getError('clause')}
        onChange={(event) => onChange({ clause: event.target.value })}
      />
      <TextField
        id={fieldId('code')}
        label={t('cab.auditChecklists.itemCode')}
        dir="ltr"
        maxLength={CHECKLIST_ITEM_CODE_MAX_LENGTH}
        value={item.code}
        onChange={(event) => onChange({ code: event.target.value })}
      />
      <TextField
        id={fieldId('title')}
        label={t('cab.auditChecklists.itemTitle')}
        required
        maxLength={CHECKLIST_ITEM_TITLE_MAX_LENGTH}
        value={item.title}
        error={getError('title')}
        onChange={(event) => onChange({ title: event.target.value })}
      />
      <TextField
        id={fieldId('titleAr')}
        label={t('cab.auditChecklists.itemTitleAr')}
        dir="rtl"
        maxLength={CHECKLIST_ITEM_TITLE_MAX_LENGTH}
        value={item.titleAr}
        onChange={(event) => onChange({ titleAr: event.target.value })}
      />
      <LabeledTextarea
        id={fieldId('requirement')}
        label={t('cab.auditChecklists.requirement')}
        hint={t('cab.auditChecklists.ownWords')}
        required
        value={item.requirement}
        error={getError('requirement')}
        onChange={(requirement) => onChange({ requirement })}
      />
      <LabeledTextarea
        id={fieldId('requirementAr')}
        label={t('cab.auditChecklists.requirementAr')}
        dir="rtl"
        value={item.requirementAr}
        onChange={(requirementAr) => onChange({ requirementAr })}
      />
      <LabeledTextarea
        id={fieldId('guidance')}
        label={t('cab.auditChecklists.guidance')}
        value={item.guidance}
        onChange={(guidance) => onChange({ guidance })}
      />
      <LabeledTextarea
        id={fieldId('guidanceAr')}
        label={t('cab.auditChecklists.guidanceAr')}
        dir="rtl"
        value={item.guidanceAr}
        onChange={(guidanceAr) => onChange({ guidanceAr })}
      />
      <LabeledTextarea
        id={fieldId('evidence')}
        label={t('cab.auditChecklists.evidence')}
        hint={t('cab.auditChecklists.onePerLine')}
        value={evidenceText}
        onChange={(text) => {
          setEvidenceText(text)
          onChange({ evidencePrompts: linesToList(text) })
        }}
      />
      <LabeledTextarea
        id={fieldId('evidenceAr')}
        label={t('cab.auditChecklists.evidenceAr')}
        hint={t('cab.auditChecklists.onePerLine')}
        dir="rtl"
        value={evidenceTextAr}
        onChange={(text) => {
          setEvidenceTextAr(text)
          onChange({ evidencePromptsAr: linesToList(text) })
        }}
      />
      <TextField
        id={fieldId('samplingHint')}
        label={t('cab.auditChecklists.sampling')}
        value={item.samplingHint}
        onChange={(event) => onChange({ samplingHint: event.target.value })}
      />
      <TextField
        id={fieldId('samplingHintAr')}
        label={t('cab.auditChecklists.samplingAr')}
        dir="rtl"
        value={item.samplingHintAr}
        onChange={(event) => onChange({ samplingHintAr: event.target.value })}
      />

      <fieldset className="flex flex-col gap-2 md:col-span-2">
        <legend className="mb-2 text-[14px] font-medium text-neutral-900">{t('cab.auditChecklists.stagesLabel')}</legend>
        <div className="flex flex-wrap gap-2">
          {AUDIT_STAGES.map((stage) => (
            <label
              key={stage}
              className="flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-[#ececec] px-3 text-[14px] text-neutral-900"
            >
              <Checkbox checked={item.stages.includes(stage)} onChange={() => toggleStage(stage)} />
              {t(`cab.auditChecklists.stages.${stage}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-x-6 gap-y-2 md:col-span-2">
        <label className="flex min-h-11 items-center gap-2 text-[14px] text-neutral-900">
          <Checkbox checked={item.mandatory} onChange={() => onChange({ mandatory: !item.mandatory })} />
          {t('cab.auditChecklists.mandatoryLabel')}
        </label>
        <label className="flex min-h-11 items-center gap-2 text-[14px] text-neutral-900">
          <Checkbox checked={item.common} onChange={() => onChange({ common: !item.common })} />
          {t('cab.auditChecklists.commonLabel')}
        </label>
      </div>

      <div className="flex flex-wrap gap-2 md:col-span-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={isFirst}
          icon={<AppIcon icon={ChevronDownIcon} size={16} className="rotate-180" />}
          onClick={() => onMove(-1)}
        >
          {t('cab.auditChecklists.moveUp')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={isLast}
          icon={<AppIcon icon={ChevronDownIcon} size={16} />}
          onClick={() => onMove(1)}
        >
          {t('cab.auditChecklists.moveDown')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          icon={<AppIcon icon={TrashIcon} size={16} />}
          onClick={onRemove}
        >
          {t('cab.auditChecklists.removeItem')}
        </Button>
      </div>
    </div>
  )
}
