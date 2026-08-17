import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, ExcelFileIcon, FilterFunnelIcon, PdfFileIcon, SearchIcon } from '@/components/icons'
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

const thClass =
  'overflow-hidden px-2 py-2.5 text-center text-[11px] font-normal leading-[1.3] break-words text-white'
const tdClass = 'overflow-hidden px-2 py-2.5 text-[11px] font-semibold leading-snug align-middle'
const tdTextClass = cn(tdClass, 'text-neutral-700')
const tdActionsClass = 'overflow-hidden px-2 py-2.5 align-middle'
const periodicBtnClass =
  'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[4px] border border-[#FFDAB9] bg-[#FFF0E0] px-3 py-1.5 text-[10px] font-medium leading-none text-[#B54D1D]'
const expandingBtnClass =
  'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[4px] border border-[#B6D0FF] bg-[#E6EFFF] px-3 py-1.5 text-[10px] font-medium leading-none text-[#0D55D2]'

function SectorBadge({ code }: { code: string }) {
  const variant = sectorBadgeVariant(code)
  return (
    <span
      className={cn(
        'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-[9px] font-semibold leading-none tabular-nums',
        variant === 'red' ? 'bg-[#fde8e8] text-[#e74c3c]' : 'bg-[#eafaf1] text-[#2ecc70]'
      )}
    >
      {code}
    </span>
  )
}

function SpecificationTag({ name }: { name: string }) {
  return (
    <span className="inline-flex min-w-[88px] max-w-full items-center justify-center whitespace-nowrap rounded-[4px] bg-[#E8EDFC] px-3.5 py-2 font-sans text-sm font-medium leading-none text-[#1236A3] sm:w-[108px]">
      {name}
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
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const toggleAll = () => {
    if (selected.size === visits.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(visits.map((visit) => visit.id)))
    }
  }

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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

  const getExportRows = async () => {
    const selectedRows = visits.filter((visit) => selected.has(visit.id))
    if (selectedRows.length > 0) return selectedRows
    return onExportAll()
  }

  const handleExportPdf = async () => {
    setExporting(true)
    try {
      const rows = await getExportRows()
      downloadPdfFromTable('periodic-visits.pdf', t('periodicVisits.pageTitle'), exportColumns, rows)
    } finally {
      setExporting(false)
    }
  }

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      const rows = await getExportRows()
      downloadExcelCsv('periodic-visits.csv', exportColumns, rows)
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="flex min-w-0 flex-col gap-5 rounded-[16px] border border-[#ececec] bg-white p-3 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 w-full flex-col gap-3 sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-0 w-full sm:min-w-[240px] sm:max-w-[360px] sm:flex-1">
            <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400">
              <AppIcon icon={SearchIcon} size={18} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              placeholder={t('periodicVisits.searchPlaceholder')}
              className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white ps-10 pe-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onSearch}
              className="h-11 flex-1 rounded-[8px] bg-primary px-6 text-[14px] font-medium text-white transition-colors hover:bg-primary-hover sm:flex-none"
            >
              {t('common.search')}
            </button>
            <button
              type="button"
              aria-label={t('common.filter')}
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((open) => !open)}
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-[8px] text-primary transition-colors',
                filtersOpen ? 'bg-[#e8edfc]' : 'bg-[#f3f6fd] hover:bg-[#e8edfc]'
              )}
            >
              <AppIcon icon={FilterFunnelIcon} size={20} />
            </button>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exporting || loading}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[12px] font-medium text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-50 sm:w-auto"
          >
            <AppIcon icon={PdfFileIcon} size={20} />
            {t('periodicVisits.downloadPdf')}
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting || loading}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[12px] font-medium text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-50 sm:w-auto"
          >
            <AppIcon icon={ExcelFileIcon} size={20} />
            {t('periodicVisits.exportExcel')}
          </button>
        </div>
      </div>

      {filtersOpen && (
        <div className="flex flex-wrap items-center gap-3 border-t border-[#ececec] pt-4">
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
      )}

      {/* Desktop: table */}
      <div className="hidden min-w-0 overflow-x-auto md:block">
        <table className="w-full min-w-[900px] table-fixed border-collapse text-center">
          <colgroup>
            <col style={{ width: '4%' }} />
            <col style={{ width: '4%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '21%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '25%' }} />
          </colgroup>
          <thead>
            <tr className="bg-[#1236a3] text-white">
              <th className={thClass}>
                <input
                  type="checkbox"
                  checked={visits.length > 0 && selected.size === visits.length}
                  onChange={toggleAll}
                  className="size-3 accent-white"
                  aria-label="Select all"
                />
              </th>
              <th className={thClass}>{t('periodicVisits.columns.index')}</th>
              <th className={thClass}>{t('periodicVisits.columns.certificateNumber')}</th>
              <th className={thClass}>{t('periodicVisits.columns.specificationName')}</th>
              <th className={thClass}>{t('periodicVisits.columns.economicSector')}</th>
              <th className={thClass}>{t('periodicVisits.columns.visitingDate')}</th>
              <th className={thClass}>{t('periodicVisits.columns.procedures')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-[11px] font-semibold text-neutral-500">
                  {t('common.loading')}
                </td>
              </tr>
            ) : visits.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-[11px] font-semibold text-neutral-500">
                  —
                </td>
              </tr>
            ) : (
              visits.map((visit, index) => {
                const rowBgClass =
                  ((page - 1) * 10 + index) % 2 === 1 ? 'bg-[#eef1f6]' : 'bg-white'

                return (
                <tr key={visit.id}>
                  <td className={cn(tdClass, rowBgClass)}>
                    <input
                      type="checkbox"
                      checked={selected.has(visit.id)}
                      onChange={() => toggleOne(visit.id)}
                      className="size-3 accent-[#1236A3]"
                    />
                  </td>
                  <td className={cn(tdTextClass, rowBgClass)}>{(page - 1) * 10 + index + 1}</td>
                  <td className={cn(tdClass, rowBgClass, 'text-neutral-900')} dir="ltr">
                    {visit.certificateNumber}
                  </td>
                  <td className={cn(tdClass, rowBgClass)}>
                    <SpecificationTag name={visit.specificationName} />
                  </td>
                  <td className={cn(tdClass, rowBgClass)}>
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      {visit.economicSectors.map((sector) => (
                        <SectorBadge key={sector} code={sector} />
                      ))}
                    </div>
                  </td>
                  <td className={cn(tdTextClass, rowBgClass)} dir="ltr">
                    {formatVisitDate(visit.visitingDate)}
                  </td>
                  <td className={cn(tdActionsClass, rowBgClass)}>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <span className={periodicBtnClass}>{t('periodicVisits.procedurePeriodic')}</span>
                      <span className={expandingBtnClass}>
                        {t('periodicVisits.procedurePeriodicExpanding')}
                      </span>
                    </div>
                  </td>
                </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="rounded-[12px] border border-[#ececec] bg-[#f9fafc] p-3 md:hidden">
        {loading ? (
          <p className="py-6 text-center text-[13px] font-semibold text-neutral-500">
            {t('common.loading')}
          </p>
        ) : visits.length === 0 ? (
          <p className="py-6 text-center text-[13px] font-semibold text-neutral-500">—</p>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 px-1 text-[12px] font-medium text-neutral-600">
              <input
                type="checkbox"
                checked={visits.length > 0 && selected.size === visits.length}
                onChange={toggleAll}
                className="size-3.5 accent-[#1236A3]"
              />
              {t('common.selectAll')}
            </label>

            {visits.map((visit, index) => (
              <div key={visit.id} className="rounded-[12px] border border-[#ececec] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.has(visit.id)}
                      onChange={() => toggleOne(visit.id)}
                      className="size-3.5 accent-[#1236A3]"
                    />
                    <span className="text-[12px] text-neutral-500">
                      #{(page - 1) * 10 + index + 1}
                    </span>
                  </label>
                  <SpecificationTag name={visit.specificationName} />
                </div>

                <p className="mt-3 text-[14px] font-semibold text-neutral-900" dir="ltr">
                  {visit.certificateNumber}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {visit.economicSectors.map((sector) => (
                    <SectorBadge key={sector} code={sector} />
                  ))}
                </div>

                <p className="mt-2 text-[13px] text-neutral-500" dir="ltr">
                  {formatVisitDate(visit.visitingDate)}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={periodicBtnClass}>{t('periodicVisits.procedurePeriodic')}</span>
                  <span className={expandingBtnClass}>
                    {t('periodicVisits.procedurePeriodicExpanding')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && visits.length > 0 && (
        <TablePagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}
    </section>
  )
}
