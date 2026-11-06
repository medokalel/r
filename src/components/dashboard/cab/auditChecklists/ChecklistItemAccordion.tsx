import { useTranslation } from 'react-i18next'
import { AppIcon, ChevronDownIcon } from '@/components/icons'
import { ChecklistItemEditor } from '@/components/dashboard/cab/auditChecklists/ChecklistItemEditor'
import { pickLocalized } from '@/lib/auditChecklistForm'
import type { ChecklistItem } from '@/lib/auditChecklistTypes'
import { cn } from '@/lib/utils'

interface ChecklistItemAccordionProps {
  item: ChecklistItem
  isArabic: boolean
  readOnly: boolean
  expanded: boolean
  isFirst: boolean
  isLast: boolean
  getError: (field: 'clause' | 'title' | 'requirement') => string | undefined
  onToggle: () => void
  onChange: (patch: Partial<ChecklistItem>) => void
  onMove: (delta: -1 | 1) => void
  onRemove: () => void
}

/** One requirement: a collapsed summary row that opens into a read view (library) or an edit form (own checklist). */
export function ChecklistItemAccordion({
  item,
  isArabic,
  readOnly,
  expanded,
  isFirst,
  isLast,
  getError,
  onToggle,
  onChange,
  onMove,
  onRemove,
}: ChecklistItemAccordionProps) {
  const { t } = useTranslation()
  const bodyId = `checklist-item-body-${item.id}`
  const evidence = isArabic && item.evidencePromptsAr.length ? item.evidencePromptsAr : item.evidencePrompts
  const sampling = pickLocalized(isArabic, item.samplingHint, item.samplingHintAr)
  const guidance = pickLocalized(isArabic, item.guidance, item.guidanceAr)

  const meta = [
    item.stages.length
      ? item.stages.map((stage) => t(`cab.auditChecklists.stages.${stage}`)).join(', ')
      : t('cab.auditChecklists.allStages'),
    item.mandatory ? t('cab.auditChecklists.mandatory') : null,
    item.common ? t('cab.auditChecklists.common') : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className={cn('rounded-[var(--radius-sm)] border', expanded ? 'border-primary' : 'border-[#ececec]')}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={bodyId}
        className="flex min-h-11 w-full items-start gap-3 px-3 py-2.5 text-start"
      >
        <span className="shrink-0 rounded-[4px] bg-[#f3f6fd] px-2 py-0.5 text-[12px] font-bold text-primary" dir="ltr">
          {item.clause || '·'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold text-neutral-900">
            {pickLocalized(isArabic, item.title, item.titleAr) || t('cab.auditChecklists.untitled')}
          </span>
          <span className="mt-0.5 block text-[12px] text-neutral-500">{meta}</span>
        </span>
        <AppIcon
          icon={ChevronDownIcon}
          size={16}
          className={cn('mt-1 shrink-0 transition-transform', expanded && 'rotate-180')}
        />
      </button>

      {expanded && (
        <div id={bodyId} className="border-t border-[#ececec] p-3">
          {readOnly ? (
            <div className="flex flex-col gap-3 text-[14px] text-neutral-900">
              <p className="leading-relaxed">{pickLocalized(isArabic, item.requirement, item.requirementAr)}</p>
              {guidance && (
                <p className="text-neutral-600">
                  <span className="font-semibold">{t('cab.auditChecklists.guidanceLabel')}: </span>
                  {guidance}
                </p>
              )}
              {evidence.length > 0 && (
                <div>
                  <p className="font-semibold">{t('cab.auditChecklists.evidenceLabel')}</p>
                  <ul className="mt-1 list-disc ps-5 text-neutral-600">
                    {evidence.map((entry) => (
                      <li key={entry}>{entry}</li>
                    ))}
                  </ul>
                </div>
              )}
              {sampling && (
                <p className="text-neutral-600">
                  <span className="font-semibold">{t('cab.auditChecklists.samplingLabel')}: </span>
                  {sampling}
                </p>
              )}
            </div>
          ) : (
            <ChecklistItemEditor
              key={item.id}
              item={item}
              isFirst={isFirst}
              isLast={isLast}
              getError={getError}
              onChange={onChange}
              onMove={onMove}
              onRemove={onRemove}
            />
          )}
        </div>
      )}
    </div>
  )
}
