import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/dashboard/cab/ReviewPrimitives'
import { AppIcon, DownloadTrayIcon, UploadTrayIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import type { EntityMigrationStatus, ImportEntityDefinition } from '@/lib/dataMigrationTypes'
import { cn } from '@/lib/utils'

interface MigrationEntityCardProps {
  /** Position in the suggested order, starting at 1. */
  index: number
  entity: ImportEntityDefinition
  status: EntityMigrationStatus | undefined
  loading: boolean
  isArabic: boolean
  onShowIncomplete: () => void
  onDownloadTemplate: () => void
  /** Opens the import wizard. Left out until the wizard exists. */
  onImport?: () => void
}

function CheckMark() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

export function MigrationEntityCard({
  index,
  entity,
  status,
  loading,
  isArabic,
  onShowIncomplete,
  onDownloadTemplate,
  onImport,
}: MigrationEntityCardProps) {
  const { t, i18n } = useTranslation()
  const imported = (status?.imported ?? 0) + (status?.updated ?? 0)
  const incomplete = status?.incomplete ?? 0
  const lastImport = status?.lastImport

  return (
    <div className="flex h-full flex-col rounded-[var(--radius-md)] border border-[#ececec] bg-white p-4 transition-shadow hover:shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold',
            imported && !incomplete ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#f3f4f6] text-neutral-600'
          )}
        >
          {imported && !incomplete ? <CheckMark /> : index}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-neutral-900">{isArabic ? entity.labelAr : entity.labelEn}</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">
            {isArabic ? entity.descriptionAr : entity.descriptionEn}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {loading ? (
          <span className="h-6 w-24 animate-pulse rounded-[4px] bg-[#f3f4f6]" aria-hidden />
        ) : imported === 0 ? (
          <Badge tone="neutral">{t('cab.dataMigration.entity.notStarted')}</Badge>
        ) : (
          <Badge tone="green">{t('cab.dataMigration.entity.imported', { count: imported })}</Badge>
        )}
        {incomplete > 0 && (
          <button
            type="button"
            onClick={onShowIncomplete}
            className="cursor-pointer rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Badge tone="amber">{t('cab.dataMigration.entity.toComplete', { count: incomplete })}</Badge>
          </button>
        )}
        {lastImport && (
          <span className="text-[12px] text-neutral-500">
            {t('cab.dataMigration.entity.lastImport', {
              date: new Date(lastImport.createdAt).toLocaleDateString(i18n.language),
            })}
          </span>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        {onImport && (
          <Button size="sm" icon={<AppIcon icon={UploadTrayIcon} size={16} />} onClick={onImport}>
            {t('cab.dataMigration.actions.import')}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          icon={<AppIcon icon={DownloadTrayIcon} size={16} />}
          onClick={onDownloadTemplate}
        >
          {t('cab.dataMigration.actions.template')}
        </Button>
        <Button asChild size="sm" variant="tertiary">
          <Link to={entity.route}>{t('cab.dataMigration.actions.open')}</Link>
        </Button>
      </div>
    </div>
  )
}