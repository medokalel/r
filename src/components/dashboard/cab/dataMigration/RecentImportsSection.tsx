import { useTranslation } from 'react-i18next'
import { Badge, SectionCard } from '@/components/dashboard/cab/ReviewPrimitives'
import { AppIcon, ExcelFileIcon } from '@/components/icons'
import { getImportEntity } from '@/lib/dataMigrationEntities'
import type { ImportBatch } from '@/lib/dataMigrationTypes'

const VISIBLE_BATCHES = 8

interface RecentImportsSectionProps {
  batches: ImportBatch[]
  loading: boolean
  isArabic: boolean
}

export function RecentImportsSection({ batches, loading, isArabic }: RecentImportsSectionProps) {
  const { t, i18n } = useTranslation()

  return (
    <SectionCard title={t('cab.dataMigration.history.title')}>
      {batches.length === 0 ? (
        <p className="text-[14px] text-neutral-600">{loading ? '' : t('cab.dataMigration.history.empty')}</p>
      ) : (
        <ul className="divide-y divide-[#ececec]">
          {batches.slice(0, VISIBLE_BATCHES).map((batch) => {
            const entity = getImportEntity(batch.entity)
            return (
              <li key={batch.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5">
                <AppIcon icon={ExcelFileIcon} size={22} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-neutral-900" dir="ltr">
                    {batch.fileName}
                  </p>
                  <p className="text-[12px] text-neutral-500">
                    {isArabic ? entity.labelAr : entity.labelEn}
                    {' · '}
                    {new Date(batch.createdAt).toLocaleString(i18n.language)}
                    {' · '}
                    {t('cab.dataMigration.history.rows', { count: batch.totals.rows })}
                  </p>
                </div>
                <Badge tone="green">
                  {t('cab.dataMigration.history.summary', {
                    created: batch.result.created,
                    updated: batch.result.updated,
                  })}
                </Badge>
              </li>
            )
          })}
        </ul>
      )}
    </SectionCard>
  )
}