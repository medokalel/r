import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, ExcelFileIcon, PdfFileIcon, SearchIcon } from '@/components/icons'
import { TableFilterSelect } from '@/components/dashboard/TableFilterSelect'
import { TablePagination } from '@/components/dashboard/TablePagination'
import {
  formatVisitDate,
  sectorBadgeVariant,
  type PeriodicVisit,
} from '@/lib/api/periodicVisitsApi'
import {
  downloadExcelCsv,
  downloadPdfFromTable,
  type TableColumn,
} from '@/lib/tableTools'
import { cn } from '@/lib/utils'

interface PeriodicVisitsTableProps {
  visits: PeriodicVisit[]
  loading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  search: string
  onSearchChange: (value: string) => void
  onSearch: () => void
  procedureFilter: string
  onProcedureFilterChange: (value: string) => void
  specificationFilter: string
  onSpecificationFilterChange: (value: string) => void
  onExportAll: () => Promise<PeriodicVisit[]>
}

function SectorBadge({ code }: { code: string }) {
  const variant = sectorBadgeVariant(code)
  return (
    <span
      className={cn(
        'inline-flex min-w-[28px] items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
        variant === 'red' ? 'bg-[#fde8e8] text-[#e74c3c]' : 'bg-[#eafaf1] text-[#2ecc70]'
      )}
    >
      {code}
    </span>
  )
}

export function PeriodicVisitsTable({
  visits,
  loading,
  page,
  totalPages,
  onPageChange,
  search,
  onSearchChange,
  onSearch,
  procedureFilter,
  onProcedureFilterChange,
  specificationFilter,
  onSpecificationFilterChange,
  onExportAll,
}: PeriodicVisitsTableProps) {
  const { t } = useTranslation()
  const [exporting, setExporting] = useState(false)

  const exportColumns: TableColumn<PeriodicVisit>[] = useMemo(
    () => [
      { header: '#', value: (_, index) => index + 1 },
      { header: t('periodicVisits.columns.certificateNumber'), value: (row) => row.certificateNumber },
      { header: t('periodicVisits.columns.specificationName'), value: (row) => row.specificationName },
      {
        header: t('periodicVisits.columns.economicSector'),
        value: (row) => row.economicSectors.join(', '),
      },
      { header: t('periodicVisits.columns.visitingDate'), value: (row) => formatVisitDate(row.visitingDate) },
      {
        header: t('periodicVisits.columns.procedures'),
        value: (row) =>
          row.procedure === 'PERIODIC_AND_EXPANDING'
            ? t('periodicVisits.procedurePeriodicExpanding')
            : t('periodicVisits.procedurePeriodic'),
      },
    ],
    [t]
  )

  const runExport = async (mode: 'pdf' | 'excel') => {
    setExporting(true)
    try {
      const rows = await onExportAll()
      if (mode === 'pdf') {
        downloadPdfFromTable('periodic-visits.pdf', t('periodicVisits.pageTitle'), exportColumns, rows)
      } else {
        downloadExcelCsv('periodic-visits.csv', exportColumns, rows)
      }
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="flex flex-col rounded-[16px] border border-[#ececec] bg-white py-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-5">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <AppIcon
              icon={SearchIcon}
              size={18}
              className="pointer-events-none absolute inset-y-0 start-3 my-auto text-neutral-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              placeholder={t('periodicVisits.searchPlaceholder')}
              className="w-full rounded-[var(--radius-sm)] border border-neutral-200 bg-white py-2.5 ps-10 pe-3 text-[14px] outline-none focus:border-primary"
            />
          </div>
          <button
            type="button"
            onClick={onSearch}
            className="rounded-[var(--radius-sm)] bg-primary px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-primary-hover"
          >
            {t('common.search')}
          </button>
          <TableFilterSelect
            label={t('periodicVisits.filters.specification')}
            value={specificationFilter}
            onChange={onSpecificationFilterChange}
            options={[
              { value: 'all', label: t('periodicVisits.filters.allSpecifications') },
              { value: 'ISO 45001', label: 'ISO 45001' },
              { value: 'ISO 14001', label: 'ISO 14001' },
              { value: 'ISO 9001', label: 'ISO 9001' },
            ]}
          />
          <TableFilterSelect
            label={t('periodicVisits.filters.procedure')}
            value={procedureFilter}
            onChange={onProcedureFilterChange}
            options={[
              { value: 'all', label: t('periodicVisits.filters.allProcedures') },
              { value: 'PERIODIC', label: t('periodicVisits.procedurePeriodic') },
              { value: 'PERIODIC_AND_EXPANDING', label: t('periodicVisits.procedurePeriodicExpanding') },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => runExport('pdf')}
            disabled={exporting || loading}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-neutral-200 bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 disabled:opacity-50"
          >
            <AppIcon icon={PdfFileIcon} size={22} />
            {t('periodicVisits.downloadPdf')}
          </button>
          <button
            type="button"
            onClick={() => runExport('excel')}
            disabled={exporting || loading}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-neutral-200 bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 disabled:opacity-50"
          >
            <AppIcon icon={ExcelFileIcon} size={22} />
            {t('periodicVisits.exportExcel')}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-center">
          <thead>
            <tr className="bg-[#1236a3] text-white">
              <th className="px-4 py-4 text-[14px] font-medium">{t('periodicVisits.columns.index')}</th>
              <th className="px-4 py-4 text-[14px] font-medium">{t('periodicVisits.columns.certificateNumber')}</th>
              <th className="px-4 py-4 text-[14px] font-medium">{t('periodicVisits.columns.specificationName')}</th>
              <th className="px-4 py-4 text-[14px] font-medium">{t('periodicVisits.columns.economicSector')}</th>
              <th className="px-4 py-4 text-[14px] font-medium">{t('periodicVisits.columns.visitingDate')}</th>
              <th className="px-4 py-4 text-[14px] font-medium">{t('periodicVisits.columns.procedures')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-neutral-500">
                  {t('common.loading')}
                </td>
              </tr>
            ) : visits.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-neutral-500">
                  —
                </td>
              </tr>
            ) : (
              visits.map((visit, index) => (
                <tr key={visit.id} className={cn(index % 2 === 1 && 'bg-[#f9fafc]')}>
                  <td className="px-4 py-4 text-[14px] text-neutral-700">
                    {(page - 1) * 10 + index + 1}
                  </td>
                  <td className="px-4 py-4 text-[14px] font-medium text-neutral-900" dir="ltr">
                    {visit.certificateNumber}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex rounded-full bg-[#e8edfc] px-3 py-1 text-[13px] font-medium text-primary">
                      {visit.specificationName}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      {visit.economicSectors.map((sector) => (
                        <SectorBadge key={sector} code={sector} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[14px] text-neutral-700" dir="ltr">
                    {formatVisitDate(visit.visitingDate)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <span className="rounded-full bg-[#fef5e7] px-3 py-1 text-[12px] font-medium text-[#f39c12]">
                        {t('periodicVisits.procedurePeriodic')}
                      </span>
                      {visit.procedure === 'PERIODIC_AND_EXPANDING' && (
                        <span className="rounded-full bg-[#e8edfc] px-3 py-1 text-[12px] font-medium text-primary">
                          {t('periodicVisits.procedurePeriodicExpanding')}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 px-5">
        <TablePagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </section>
  )
}
