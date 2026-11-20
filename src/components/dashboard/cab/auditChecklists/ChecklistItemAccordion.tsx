import { useTranslation } from 'react-i18next'
import { AppIcon, ChevronDownIcon } from '@/components/icons'
import { ChecklistItemEditor } from '@/components/dashboard/cab/auditChecklists/ChecklistItemEditor'
import { pickLocalized } from '@/lib/auditChecklistForm'
import { AUDIT_STAGES, type ChecklistItem } from '@/lib/auditChecklistTypes'
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

  const allStagesSelected =
    item.stages.length === 0 || item.stages.length >= AUDIT_STAGES.length
  const stagesText = allStagesSelected
    ? t('cab.auditChecklists.allStages')
    : item.stages.map((stage) => t(`cab.auditChecklists.stages.${stage}`)).join(', ')

  const meta = [
    stagesText,
    item.mandatory ? t('cab.auditChecklists.mandatory') : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div
      className={cn(
        'rounded-[8px] border bg-white transition-colors',
        expanded ? 'border-[#1236a3] shadow-xs' : 'border-[#e2e2e2] hover:border-[#c7d2fe]'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={bodyId}
        className="flex min-h-11 w-full items-center gap-3 px-3.5 py-2.5 text-start"
      >
        <span
          className="shrink-0 rounded-[6px] bg-[#e8edfc] px-2.5 py-0.5 text-[12px] font-bold text-[#1236a3]"
          dir="ltr"
        >
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
          className={cn('shrink-0 text-neutral-400 transition-transform', expanded && 'rotate-180 text-[#1236a3]')}
        />
      </button>

      {expanded && (
        <div id={bodyId} className="border-t border-[#ececec] bg-[#f9fafc] p-4">
          {readOnly ? (
            <div className="flex flex-col gap-3 text-[13px] text-neutral-800">
              <p className="text-[14px] leading-relaxed text-neutral-900">
                {pickLocalized(isArabic, item.requirement, item.requirementAr)}
              </p>
              {guidance && (
                <div className="rounded-[6px] border border-[#e2e2e2] bg-white p-3">
                  <span className="font-semibold text-neutral-900">{t('cab.auditChecklists.guidanceLabel')}: </span>
                  <span className="text-neutral-600">{guidance}</span>
                </div>
              )}
              {evidence.length > 0 && (
                <div className="rounded-[6px] border border-[#e2e2e2] bg-white p-3">
                  <p className="font-semibold text-neutral-900">{t('cab.auditChecklists.evidenceLabel')}</p>
                  <ul className="mt-1.5 list-disc space-y-1 ps-5 text-neutral-600">
                    {evidence.map((entry) => (
                      <li key={entry}>{entry}</li>
                    ))}
                  </ul>
                </div>
              )}
              {sampling && (
                <p className="text-neutral-600">
                  <span className="font-semibold text-neutral-900">{t('cab.auditChecklists.samplingLabel')}: </span>
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
