import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Badge, SectionCard } from '@/components/dashboard/cab/ReviewPrimitives'
import { TableFilterSelect, type TableFilterOption } from '@/components/dashboard/TableFilterSelect'
import { Button } from '@/components/ui/Button'
import { getImportEntity } from '@/lib/dataMigrationEntities'
import type { ImportEntityKey, IncompleteRecord } from '@/lib/dataMigrationTypes'
import { CompletenessBar } from './CompletenessBar'

export const RECORDS_TO_COMPLETE_ID = 'migration-to-complete'

interface RecordsToCompleteSectionProps {
  records: IncompleteRecord[]
  loading: boolean
  isArabic: boolean
  filter: 'all' | ImportEntityKey
  onFilterChange: (filter: 'all' | ImportEntityKey) => void
  resolvingId: string | null
  onMarkDone: (record: IncompleteRecord) => void
}

export function RecordsToCompleteSection({
  records,
  loading,
  isArabic,
  filter,
  onFilterChange,
  resolvingId,
  onMarkDone,
}: RecordsToCompleteSectionProps) {
  const { t } = useTranslation()
  const labelOf = (key: ImportEntityKey) => {
    const entity = getImportEntity(key)
    return isArabic ? entity.labelAr : entity.labelEn
  }
  const columnLabel = (key: ImportEntityKey, column: string) => {
    const match = getImportEntity(key).columns.find((candidate) => candidate.key === column)
    return match ? (isArabic ? match.labelAr : match.labelEn) : column
  }

  const entitiesWithRecords = Array.from(new Set(records.map((record) => record.entity)))
  const filterOptions: TableFilterOption[] = [
    { value: 'all', label: t('cab.dataMigration.toComplete.filterAll') },
    ...entitiesWithRecords.map((key) => ({ value: key, label: labelOf(key) })),
  ]
  const visible = records.filter((record) => filter === 'all' || record.entity === filter)

  return (
    <div id={RECORDS_TO_COMPLETE_ID} className="scroll-mt-4">
      <SectionCard
        title={t('cab.dataMigration.toComplete.title')}
        action={records.length > 0 ? <Badge tone="amber">{records.length}</Badge> : undefined}
      >
        <div className="flex flex-col gap-4">
          <p className="max-w-3xl text-[13px] leading-relaxed text-neutral-600">
            {t('cab.dataMigration.toComplete.hint')}
          </p>

          {entitiesWithRecords.length > 1 && (
            <TableFilterSelect
              className="sm:w-64"
              label={t('cab.dataMigration.toComplete.filterLabel')}
              value={filter}
              options={filterOptions}
              onChange={(value) => onFilterChange(value as 'all' | ImportEntityKey)}
            />
          )}

          {loading ? (
            <div className="h-16 animate-pulse rounded-[var(--radius-md)] bg-[#f3f4f6]" aria-busy="true" />
          ) : visible.length === 0 ? (
            <p className="rounded-[var(--radius-md)] border border-dashed border-[#e2e2e2] px-4 py-8 text-center text-[14px] text-neutral-600">
              {t('cab.dataMigration.toComplete.empty')}
            </p>
          ) : (
            <ul className="divide-y divide-[#ececec]">
              {visible.map((record) => (
                <li key={record.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-neutral-500">{labelOf(record.entity)}</p>
                    <p className="break-words text-[14px] font-semibold text-neutral-900">{record.label}</p>
                    <p className="text-[12px] text-[#a05a00]">
                      {t('cab.dataMigration.toComplete.missing', {
                        fields: record.missing.map((column) => columnLabel(record.entity, column)).join(', '),
                      })}
                    </p>
                  </div>
                  <CompletenessBar value={record.completeness} label={t('cab.dataMigration.toComplete.completeness')} />
                  <div className="flex items-center gap-1">
                    <Button asChild size="sm" variant="outline">
                      <Link to={getImportEntity(record.entity).route}>{t('cab.dataMigration.actions.open')}</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="tertiary"
                      title={t('cab.dataMigration.actions.markDoneHint')}
                      disabled={resolvingId === record.id}
                      onClick={() => onMarkDone(record)}
                    >
                      {t('cab.dataMigration.actions.markDone')}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SectionCard>
    </div>
  )
}