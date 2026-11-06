import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/dashboard/cab/ReviewPrimitives'
import { Button } from '@/components/ui/Button'
import { pickLocalized } from '@/lib/auditChecklistForm'
import type { AuditChecklist } from '@/lib/auditChecklistTypes'

interface ChecklistCardProps {
  checklist: AuditChecklist
  isArabic: boolean
  onOpen: () => void
  onCopy: () => void
  onMakeDefault: () => void
  onToggleArchive: () => void
  onDelete: () => void
}

/** One checklist in the list: name, standard, badges and its actions. */
export function ChecklistCard({
  checklist,
  isArabic,
  onOpen,
  onCopy,
  onMakeDefault,
  onToggleArchive,
  onDelete,
}: ChecklistCardProps) {
  const { t } = useTranslation()
  const isOwn = checklist.source === 'cab'
  const archived = checklist.status === 'ARCHIVED'

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[#ececec] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-neutral-900">
            {pickLocalized(isArabic, checklist.name, checklist.nameAr)}
          </p>
          <p className="mt-1 text-[13px] text-neutral-500">
            <span dir="ltr">{checklist.standardLabel || checklist.standardCode}</span>
            {' · '}
            {t('cab.auditChecklists.itemCount', { count: checklist.items.length })}
            {' · '}
            <span dir="ltr">v{checklist.version}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {checklist.reviewStatus && (
            <Badge tone={checklist.reviewStatus === 'approved' ? 'green' : 'amber'}>
              {t(`cab.auditChecklists.reviewStatus.${checklist.reviewStatus}`)}
            </Badge>
          )}
          {checklist.isDefault && <Badge tone="blue">{t('cab.auditChecklists.default')}</Badge>}
          {archived && <Badge tone="neutral">{t('cab.auditChecklists.archived')}</Badge>}
          <Badge tone="neutral">{t(`cab.auditChecklists.kinds.${checklist.kind}`)}</Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={onOpen}>
          {isOwn ? t('cab.auditChecklists.edit') : t('cab.auditChecklists.view')}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onCopy}>
          {t('cab.auditChecklists.copy')}
        </Button>
        {isOwn && !archived && !checklist.isDefault && (
          <Button type="button" size="sm" variant="secondary" onClick={onMakeDefault}>
            {t('cab.auditChecklists.makeDefault')}
          </Button>
        )}
        {isOwn && (
          <Button type="button" size="sm" variant="secondary" onClick={onToggleArchive}>
            {archived ? t('cab.auditChecklists.restore') : t('cab.auditChecklists.archive')}
          </Button>
        )}
        {isOwn && (
          <Button type="button" size="sm" variant="destructive" onClick={onDelete}>
            {t('cab.auditChecklists.delete')}
          </Button>
        )}
      </div>
    </div>
  )
}
