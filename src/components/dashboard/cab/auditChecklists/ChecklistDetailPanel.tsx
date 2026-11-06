import { useDeferredValue, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, CalloutCard, SectionCard } from '@/components/dashboard/cab/ReviewPrimitives'
import { ChecklistItemAccordion } from '@/components/dashboard/cab/auditChecklists/ChecklistItemAccordion'
import { AddCircleIcon, AppIcon, CorrectiveActionIcon, InfoIcon, SearchIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { Textarea, TextField } from '@/components/ui/TextField'
import { FormLabel } from '@/components/ui/FormField'
import {
  CHECKLIST_DESCRIPTION_MAX_LENGTH,
  CHECKLIST_LARGE_ITEM_COUNT,
  CHECKLIST_NAME_MAX_LENGTH,
  CHECKLIST_STANDARD_CODE_MAX_LENGTH,
  checklistToDraft,
  createBlankItem,
  fieldIdForError,
  filterItems,
  firstInvalidItemId,
  groupItemsByClause,
  isAnnexGroup,
  itemErrorKey,
  moveItem,
  normalizeStandardCode,
  pickLocalized,
  removeItem,
  serializeDraft,
  updateItem,
  validateDraft,
  type ChecklistItemField,
} from '@/lib/auditChecklistForm'
import type { AuditChecklist, AuditChecklistDraft, ChecklistItem } from '@/lib/auditChecklistTypes'
import { toast } from '@/lib/toast'

interface ChecklistDetailPanelProps {
  checklist: AuditChecklist
  isArabic: boolean
  onSave: (draft: AuditChecklistDraft) => void
  onCopy: () => void
  onClose: () => void
}

function focusField(id: string) {
  requestAnimationFrame(() => {
    const element = document.getElementById(id)
    element?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    element?.focus({ preventScroll: true })
  })
}

/**
 * Opens one checklist. A library checklist is read-only (with "Copy to edit");
 * the CAB's own checklist is an edit form with its requirements. Remount it
 * (via `key`) when the selected checklist or its saved state changes.
 */
export function ChecklistDetailPanel({ checklist, isArabic, onSave, onCopy, onClose }: ChecklistDetailPanelProps) {
  const { t } = useTranslation()
  const readOnly = checklist.source === 'library'

  const baseline = useMemo(() => serializeDraft(checklistToDraft(checklist)), [checklist])
  const [draft, setDraft] = useState<AuditChecklistDraft>(() => checklistToDraft(checklist))
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [itemQuery, setItemQuery] = useState('')
  const [showErrors, setShowErrors] = useState(false)
  const deferredQuery = useDeferredValue(itemQuery)

  const dirty = !readOnly && serializeDraft(draft) !== baseline
  const errors = useMemo(() => validateDraft(draft), [draft])
  const isLarge = draft.items.length > CHECKLIST_LARGE_ITEM_COUNT
  const showGroups = isLarge && (checklist.kind === 'STANDARD' || checklist.kind === 'IMS')

  const visibleItems = useMemo(() => filterItems(draft.items, deferredQuery), [draft.items, deferredQuery])
  const groups = useMemo(
    () => (showGroups ? groupItemsByClause(visibleItems) : [{ group: '', items: visibleItems }]),
    [showGroups, visibleItems]
  )
  const indexById = useMemo(() => new Map(draft.items.map((item, index) => [item.id, index])), [draft.items])

  const getFieldError = (key: string) => {
    const code = errors[key]
    return showErrors && code ? t(`cab.auditChecklists.validation.${code}`) : undefined
  }

  const patchDraft = (patch: Partial<AuditChecklistDraft>) => setDraft((current) => ({ ...current, ...patch }))

  const handleSave = () => {
    const keys = Object.keys(errors)
    if (keys.length > 0) {
      setShowErrors(true)
      toast.error(t('cab.auditChecklists.invalidForm'))
      const invalidItemId = firstInvalidItemId(errors)
      if (invalidItemId) setExpandedId(invalidItemId)
      focusField(fieldIdForError(keys[0]))
      return
    }
    onSave(draft)
  }

  const handleClose = () => {
    if (dirty && !window.confirm(t('cab.auditChecklists.discardConfirm'))) return
    onClose()
  }

  const handleAddItem = () => {
    const item = createBlankItem()
    setItemQuery('')
    patchDraft({ items: [...draft.items, item] })
    setExpandedId(item.id)
    focusField(`checklist-item-${item.id}-clause`)
  }

  const groupLabel = (group: string) =>
    isAnnexGroup(group)
      ? t('cab.auditChecklists.groupAnnex', { group })
      : t('cab.auditChecklists.groupClause', { group })

  const renderItem = (item: ChecklistItem) => {
    const index = indexById.get(item.id) ?? 0
    return (
      <li key={item.id}>
        <ChecklistItemAccordion
          item={item}
          isArabic={isArabic}
          readOnly={readOnly}
          expanded={expandedId === item.id}
          isFirst={index === 0}
          isLast={index === draft.items.length - 1}
          getError={(field: ChecklistItemField) => getFieldError(itemErrorKey(item.id, field))}
          onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
          onChange={(patch) => patchDraft({ items: updateItem(draft.items, item.id, patch) })}
          onMove={(delta) => patchDraft({ items: moveItem(draft.items, index, delta) })}
          onRemove={() => patchDraft({ items: removeItem(draft.items, item.id) })}
        />
      </li>
    )
  }

  return (
    <SectionCard
      title={pickLocalized(isArabic, checklist.name, checklist.nameAr)}
      action={
        <div className="flex flex-wrap items-center gap-2">
          {checklist.reviewStatus && (
            <Badge tone={checklist.reviewStatus === 'approved' ? 'green' : 'amber'}>
              {t(`cab.auditChecklists.reviewStatus.${checklist.reviewStatus}`)}
            </Badge>
          )}
          {readOnly ? (
            <Button type="button" size="sm" onClick={onCopy}>
              {t('cab.auditChecklists.copyToEdit')}
            </Button>
          ) : (
            <Button type="button" size="sm" disabled={!dirty} onClick={handleSave}>
              {t('cab.auditChecklists.save')}
            </Button>
          )}
          <Button type="button" size="sm" variant="secondary" onClick={handleClose}>
            {t('cab.auditChecklists.close')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-neutral-500">
          <span dir="ltr">{checklist.standardLabel || checklist.standardCode}</span>
          {' · '}
          {t('cab.auditChecklists.itemCount', { count: draft.items.length })}
          {' · '}
          <span dir="ltr">v{checklist.version}</span>
        </p>

        {checklist.reviewNote && (
          <CalloutCard
            tone={checklist.reviewStatus === 'approved' ? 'blue' : 'amber'}
            icon={
              <AppIcon
                icon={checklist.reviewStatus === 'approved' ? InfoIcon : CorrectiveActionIcon}
                size={20}
                className={checklist.reviewStatus === 'approved' ? 'text-primary' : 'text-[#d97706]'}
              />
            }
            title={t('cab.auditChecklists.reviewNoteTitle')}
          >
            {pickLocalized(isArabic, checklist.reviewNote.en, checklist.reviewNote.ar)}
          </CalloutCard>
        )}

        {!readOnly && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField
              id="checklist-name"
              label={t('cab.auditChecklists.name')}
              required
              maxLength={CHECKLIST_NAME_MAX_LENGTH}
              value={draft.name}
              error={getFieldError('name')}
              onChange={(event) => patchDraft({ name: event.target.value })}
            />
            <TextField
              id="checklist-nameAr"
              label={t('cab.auditChecklists.nameAr')}
              dir="rtl"
              maxLength={CHECKLIST_NAME_MAX_LENGTH}
              value={draft.nameAr}
              onChange={(event) => patchDraft({ nameAr: event.target.value })}
            />
            <div className="space-y-2">
              <TextField
                id="checklist-standardCode"
                label={t('cab.auditChecklists.standardCode')}
                required
                dir="ltr"
                maxLength={CHECKLIST_STANDARD_CODE_MAX_LENGTH}
                value={draft.standardCode}
                error={getFieldError('standardCode')}
                onChange={(event) => patchDraft({ standardCode: normalizeStandardCode(event.target.value) })}
              />
              <p className="text-[12px] text-[var(--cab-muted)]">{t('cab.auditChecklists.standardCodeHint')}</p>
            </div>
            <TextField
              id="checklist-standardLabel"
              label={t('cab.auditChecklists.standardLabel')}
              maxLength={CHECKLIST_NAME_MAX_LENGTH}
              value={draft.standardLabel}
              onChange={(event) => patchDraft({ standardLabel: event.target.value })}
            />
            <div className="space-y-2 md:col-span-2">
              <FormLabel htmlFor="checklist-description">{t('cab.auditChecklists.description')}</FormLabel>
              <Textarea
                id="checklist-description"
                maxLength={CHECKLIST_DESCRIPTION_MAX_LENGTH}
                className="min-h-[96px]"
                value={draft.description}
                onChange={(event) => patchDraft({ description: event.target.value })}
              />
            </div>
          </div>
        )}

        {isLarge && (
          <TextField
            icon={SearchIcon}
            type="search"
            aria-label={t('cab.auditChecklists.searchItems')}
            placeholder={t('cab.auditChecklists.searchItems')}
            value={itemQuery}
            onChange={(event) => setItemQuery(event.target.value)}
          />
        )}

        {draft.items.length === 0 && (
          <p className="text-[13px] text-[var(--cab-muted)]">{t('cab.auditChecklists.noItems')}</p>
        )}
        {draft.items.length > 0 && visibleItems.length === 0 && (
          <p className="text-[13px] text-[var(--cab-muted)]">{t('cab.auditChecklists.noItemMatch')}</p>
        )}

        <ol className="flex flex-col gap-2">
          {groups.map(({ group, items }) =>
            showGroups ? (
              <li key={group} className="flex flex-col gap-2">
                <p className="mt-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-neutral-500">
                  <span dir="auto">{groupLabel(group)}</span>
                  <span className="rounded-full bg-neutral-50 px-2 py-0.5 tabular-nums">{items.length}</span>
                </p>
                <ol className="flex flex-col gap-2">{items.map(renderItem)}</ol>
              </li>
            ) : (
              items.map(renderItem)
            )
          )}
        </ol>

        {!readOnly && (
          <div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              icon={<AppIcon icon={AddCircleIcon} size={18} />}
              onClick={handleAddItem}
            >
              {t('cab.auditChecklists.addItem')}
            </Button>
          </div>
        )}
      </div>
    </SectionCard>
  )
}
