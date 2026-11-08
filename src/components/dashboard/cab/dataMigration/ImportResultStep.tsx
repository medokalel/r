import { useTranslation } from 'react-i18next'
import { CalloutCard } from '@/components/dashboard/cab/ReviewPrimitives'
import { AppIcon, InfoIcon } from '@/components/icons'
import { getImportEntity } from '@/lib/dataMigrationEntities'
import type { ImportCommitResult } from '@/lib/dataMigrationTypes'
import { cn } from '@/lib/utils'

interface ImportResultStepProps {
  result: ImportCommitResult
  fileName: string
  isArabic: boolean
}

export function ImportResultStep({ result, fileName, isArabic }: ImportResultStepProps) {
  const { t } = useTranslation()
  const entity = getImportEntity(result.entity)
  const tiles = [
    { key: 'created', value: result.created, className: 'text-[#16a34a]' },
    { key: 'updated', value: result.updated, className: 'text-primary' },
    { key: 'skipped', value: result.skipped, className: 'text-neutral-900' },
    { key: 'invalid', value: result.invalid, className: 'text-[#dc2626]' },
  ] as const

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h3 className="text-[18px] font-bold text-neutral-900">{t('cab.dataMigration.wizard.result.title')}</h3>
        <p className="mt-1 text-[13px] text-neutral-600" dir="auto">
          {t('cab.dataMigration.wizard.result.subtitle', {
            file: fileName,
            entity: isArabic ? entity.labelAr : entity.labelEn,
          })}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.key} className="rounded-[var(--radius-md)] border border-[#ececec] bg-white p-4">
            <dt className="text-[12px] font-medium text-neutral-500">{t(`cab.dataMigration.wizard.result.${tile.key}`)}</dt>
            <dd className={cn('mt-1 text-[24px] font-bold tabular-nums', tile.className)}>{tile.value}</dd>
          </div>
        ))}
      </dl>

      {result.incomplete > 0 ? (
        <CalloutCard
          tone="amber"
          icon={<AppIcon icon={InfoIcon} size={20} />}
          title={t('cab.dataMigration.wizard.result.completeTitle', { count: result.incomplete })}
        >
          {t('cab.dataMigration.wizard.result.completeHint')}
        </CalloutCard>
      ) : (
        <CalloutCard tone="green" icon={<AppIcon icon={InfoIcon} size={20} />} title={t('cab.dataMigration.wizard.result.allDone')}>
          {t('cab.dataMigration.wizard.result.allDoneHint')}
        </CalloutCard>
      )}
    </div>
  )
}