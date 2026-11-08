import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, CalloutCard, type BadgeTone } from '@/components/dashboard/cab/ReviewPrimitives'
import { AppIcon, DownloadTrayIcon, InfoIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { getImportEntity } from '@/lib/dataMigrationEntities'
import { buildIssueReportRows, type Translate } from '@/lib/dataMigrationForm'
import type { ImportPreview, ImportRowResult, ImportRowStatus } from '@/lib/dataMigrationTypes'
import { reviewRowLabel } from '@/lib/dataMigrationWizard'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { downloadXlsxWorkbook } from '@/lib/xlsxDownload'
import { CompletenessBar } from './CompletenessBar'
import { MigrationProgressRing } from './MigrationProgressRing'

const STATUSES: ImportRowStatus[] = ['ready', 'partial', 'invalid', 'duplicate']
const PAGE_SIZE = 50

const STATUS_STYLE: Record<ImportRowStatus, { tone: BadgeTone; bar: string; dot: string }> = {
  ready: { tone: 'green', bar: 'bg-[#16a34a]', dot: 'bg-[#16a34a]' },
  partial: { tone: 'amber', bar: 'bg-[#d97706]', dot: 'bg-[#d97706]' },
  invalid: { tone: 'red', bar: 'bg-[#dc2626]', dot: 'bg-[#dc2626]' },
  duplicate: { tone: 'blue', bar: 'bg-primary', dot: 'bg-primary' },
}

interface ReviewStepProps {
  preview: ImportPreview
  isArabic: boolean
}

function countOf(preview: ImportPreview, status: ImportRowStatus): number {
  const { totals } = preview
  return status === 'duplicate' ? totals.duplicates : totals[status]
}

export function ReviewStep({ preview, isArabic }: ReviewStepProps) {
  const { t } = useTranslation()
  const entity = getImportEntity(preview.entity)
  const [filter, setFilter] = useState<'all' | ImportRowStatus>('all')
  const [visible, setVisible] = useState(PAGE_SIZE)

  const columnLabel = (key: string) => {
    const column = entity.columns.find((candidate) => candidate.key === key)
    return column ? (isArabic ? column.labelAr : column.labelEn) : key
  }
  const rows = preview.rows.filter((row) => filter === 'all' || row.status === filter)
  const hasIssues = preview.totals.rows > preview.totals.ready

  const toggleFilter = (status: ImportRowStatus) => {
    setFilter((current) => (current === status ? 'all' : status))
    setVisible(PAGE_SIZE)
  }

  const handleDownloadIssues = () => {
    const translate: Translate = (key, options) => t(key, options)
    downloadXlsxWorkbook(`iCASCO_${preview.entity}_issues.xlsx`, [
      { name: 'Issues', rows: buildIssueReportRows(entity, preview.rows, isArabic ? 'ar' : 'en', translate) },
    ])
    toast.success(t('cab.dataMigration.wizard.review.issuesDownloaded'))
  }

  const renderIssues = (row: ImportRowResult) => {
    const lines = [
      ...row.errors.map((item) => ({ ...item, tone: 'text-[#dc2626]' })),
      ...row.warnings.map((item) => ({ ...item, tone: 'text-[#a05a00]' })),
    ]
    const missing = row.status === 'partial' ? row.missing : []
    if (!lines.length && !missing.length) {
      return <span className="text-neutral-500">{t('cab.dataMigration.wizard.review.noIssues')}</span>
    }
    return (
      <ul className="space-y-0.5">
        {lines.map((item) => (
          <li key={`${item.field}-${item.code}`} className={item.tone}>
            {columnLabel(item.field)}: {t(`cab.dataMigration.issues.${item.code}`)}
          </li>
        ))}
        {missing.length > 0 && (
          <li className="text-[#a05a00]">
            {t('cab.dataMigration.wizard.review.missing', { fields: missing.map(columnLabel).join(', ') })}
          </li>
        )}
      </ul>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 rounded-[var(--radius-md)] border border-[#ececec] bg-white p-4 sm:p-5 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
        <div className="flex items-center gap-4">
          <MigrationProgressRing value={preview.completeness} label={t('cab.dataMigration.wizard.review.completeness')} />
          <div className="md:hidden">
            <p className="text-[14px] font-semibold text-neutral-900">{t('cab.dataMigration.wizard.review.completeness')}</p>
            <p className="text-[12px] text-neutral-600">{t('cab.dataMigration.wizard.review.rowsRead', { count: preview.totals.rows })}</p>
          </div>
        </div>
        <div className="min-w-0 space-y-3">
          <div className="hidden items-baseline justify-between gap-3 md:flex">
            <p className="text-[14px] font-semibold text-neutral-900">{t('cab.dataMigration.wizard.review.completeness')}</p>
            <p className="text-[12px] text-neutral-600">{t('cab.dataMigration.wizard.review.rowsRead', { count: preview.totals.rows })}</p>
          </div>
          <p className="text-[12px] text-neutral-600">{t('cab.dataMigration.wizard.review.completenessHint')}</p>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#f3f4f6]" aria-hidden>
            {STATUSES.map((status) =>
              countOf(preview, status) > 0 ? (
                <span
                  key={status}
                  className={cn('h-full transition-[width] duration-500', STATUS_STYLE[status].bar)}
                  style={{ width: `${(countOf(preview, status) / Math.max(1, preview.totals.rows)) * 100}%` }}
                />
              ) : null
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                aria-pressed={filter === status}
                onClick={() => toggleFilter(status)}
                className={cn(
                  'cursor-pointer rounded-[var(--radius-md)] border px-3 py-2 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  filter === status ? 'border-primary bg-[#f3f6fd]' : 'border-[#ececec] bg-[#fafbfd] hover:border-[#c9ced9]'
                )}
              >
                <span className="flex items-center gap-2 text-[12px] font-semibold text-neutral-600">
                  <span aria-hidden className={cn('size-2 rounded-full', STATUS_STYLE[status].dot)} />
                  {t(`cab.dataMigration.status.${status}`)}
                </span>
                <span className="mt-0.5 block text-[20px] font-bold tabular-nums text-neutral-900">{countOf(preview, status)}</span>
                <span className="block truncate text-[12px] text-neutral-600">
                  {t(`cab.dataMigration.wizard.review.statusHint.${status}`)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {preview.columnsMissing.length > 0 && (
        <CalloutCard
          tone="amber"
          icon={<AppIcon icon={InfoIcon} size={20} />}
          title={t('cab.dataMigration.wizard.review.columnsMissing', {
            columns: preview.columnsMissing.map(columnLabel).join(', '),
          })}
        >
          {t('cab.dataMigration.wizard.review.columnsRecognised', { count: preview.columnsRecognised.length })}
        </CalloutCard>
      )}

      <div className="space-y-3">
        {hasIssues && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12px] text-neutral-600">{t('cab.dataMigration.wizard.review.downloadIssuesHint')}</p>
            <Button size="sm" variant="outline" icon={<AppIcon icon={DownloadTrayIcon} size={16} />} onClick={handleDownloadIssues}>
              {t('cab.dataMigration.wizard.review.downloadIssues')}
            </Button>
          </div>
        )}

        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[#ececec]">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead>
              <tr className="bg-[#fafbfd] text-start text-[12px] font-medium text-neutral-500">
                <th className="px-3 py-2 text-start font-medium">{t('cab.dataMigration.wizard.review.table.row')}</th>
                <th className="px-3 py-2 text-start font-medium">{t('cab.dataMigration.wizard.review.table.record')}</th>
                <th className="px-3 py-2 text-start font-medium">{t('cab.dataMigration.wizard.review.table.status')}</th>
                <th className="px-3 py-2 text-start font-medium">{t('cab.dataMigration.wizard.review.table.completeness')}</th>
                <th className="px-3 py-2 text-start font-medium">{t('cab.dataMigration.wizard.review.table.issues')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, visible).map((row) => (
                <tr key={row.rowNumber} className="border-t border-[#ececec] align-top">
                  <td className="px-3 py-2 tabular-nums text-neutral-500">{row.rowNumber}</td>
                  <td className="max-w-[220px] break-words px-3 py-2 font-semibold text-neutral-900">
                    {reviewRowLabel(entity, row)}
                    {row.matchedExistingId && (
                      <span className="block text-[12px] font-normal text-primary">
                        {t('cab.dataMigration.wizard.review.matched')}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={STATUS_STYLE[row.status].tone}>{t(`cab.dataMigration.status.${row.status}`)}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <CompletenessBar value={row.completeness} label={t('cab.dataMigration.wizard.review.table.completeness')} />
                  </td>
                  <td className="px-3 py-2 text-[12px]">{renderIssues(row)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-neutral-600">
                    {t('cab.dataMigration.wizard.review.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {rows.length > visible && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] text-neutral-600">
              {t('cab.dataMigration.wizard.review.showing', { shown: visible, total: rows.length })}
            </p>
            <Button size="sm" variant="outline" onClick={() => setVisible((count) => count + PAGE_SIZE)}>
              {t('cab.dataMigration.wizard.review.showMore')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}