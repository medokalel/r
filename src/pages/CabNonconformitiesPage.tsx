import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useNonconformitiesTourSteps } from '@/config/nonconformitiesTourSteps'
import { NonconformityStatusBadge } from '@/components/dashboard/cab/NonconformityStatusBadge'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { Button } from '@/components/ui/Button'
import { ImportWizardDialog } from '@/components/dashboard/cab/dataMigration/ImportWizardDialog'
import { NC_PIPELINE_COLUMNS } from '@/lib/api/nonconformityRegister'
import { ExportMenuButton } from '@/components/ui/ExportMenuButton'
import { SelectField } from '@/components/ui/Select'
import { DateRangePicker, type DateRange } from '@/components/ui/DateRangePicker'
import { AppIcon, SearchIcon } from '@/components/icons'
import {
  getNonconformities,
  getNonconformityCountries,
  NONCONFORMITY_STATUSES,
  type NonconformityItem,
  type NonconformityRecord,
  type NonconformityStatus,
} from '@/lib/api/cabNonconformitiesApi'
import { downloadExcelCsv, downloadPdfFromTable, matchesSearch, type TableColumn } from '@/lib/tableTools'
import { ROUTES, cabNonconformityPath } from '@/lib/routes'
import { cn } from '@/lib/utils'

function Chevron() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-neutral-400 rtl-flip"
      aria-hidden
    >
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const PAGE_SIZE = 10

export function CabNonconformitiesPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const tourSteps = useNonconformitiesTourSteps()

  const [nonconformities, setNonconformities] = useState<NonconformityRecord[]>([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState<DateRange>({ from: null, to: null })
  const [countryFilter, setCountryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list')
  const [importOpen, setImportOpen] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [exporting, setExporting] = useState(false)

  const countryOptions = useMemo(() => getNonconformityCountries(nonconformities), [nonconformities])
  const fmt = (iso: string) =>
    iso
      ? new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : ''
  const w = (key: string, fallback: string, opts?: Record<string, unknown>) =>
    t(`cab.nonconformities.workflow.${key}`, { defaultValue: fallback, ...opts }) as string

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getNonconformities()
      .then((data) => {
        if (!cancelled) setNonconformities(data)
      })
      .catch((error) => console.error('Failed to load nonconformities:', error))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const filtered = useMemo(() => {
    return nonconformities.filter((item) => {
      const matchesQuery = matchesSearch(
        [item.ncId, item.findingId, item.auditId, item.clientName, item.clientId],
        query,
      )
      const matchesCountry = countryFilter === 'all' || item.country === countryFilter
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const raisedAt = new Date(item.raisedDateRaw)
      const matchesFrom = !period.from || raisedAt >= period.from
      const matchesTo = !period.to || raisedAt <= period.to
      return matchesQuery && matchesCountry && matchesStatus && matchesFrom && matchesTo
    })
  }, [nonconformities, query, countryFilter, statusFilter, period])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const hasActiveFilters = Boolean(
    query || period.from || period.to || countryFilter !== 'all' || statusFilter !== 'all',
  )

  const clearFilters = () => {
    setQuery('')
    setPeriod({ from: null, to: null })
    setCountryFilter('all')
    setStatusFilter('all')
    setPage(1)
  }

  const statusLabel = (status: NonconformityStatus) => t(`cab.nonconformities.status.${status}`)

  const exportColumns: TableColumn<NonconformityItem>[] = [
    { header: t('cab.nonconformities.table.ncId'), value: (row) => row.ncId },
    { header: t('cab.nonconformities.table.finding'), value: (row) => row.findingId },
    { header: t('cab.nonconformities.table.client'), value: (row) => row.clientName },
    { header: t('cab.nonconformities.fields.clientId'), value: (row) => row.clientId },
    { header: t('cab.nonconformities.fields.country'), value: (row) => row.country },
    { header: t('cab.nonconformities.table.classification'), value: (row) => row.classificationLabel },
    { header: t('cab.nonconformities.fields.raisedDate'), value: (row) => row.raisedDate },
    { header: t('cab.nonconformities.table.due'), value: (row) => row.dueDate },
    { header: t('cab.nonconformities.table.owner'), value: (row) => row.ownerName },
    { header: t('cab.nonconformities.table.status'), value: (row) => statusLabel(row.status) },
  ]

  const handleExportExcel = () => {
    setExporting(true)
    try {
      downloadExcelCsv('nonconformities.xlsx', exportColumns, filtered)
    } finally {
      setExporting(false)
    }
  }
  const handleExportPdf = () => {
    setExporting(true)
    try {
      downloadPdfFromTable('nonconformities.pdf', t('cab.nonconformities.title'), exportColumns, filtered)
    } finally {
      setExporting(false)
    }
  }

  return (
    <CabLayout tourId="cab-nonconformities" tourSteps={tourSteps}>
      <CabHeader title={t('cab.nonconformities.title')} notificationCount={3} />
      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]" aria-label={t('common.breadcrumb', 'Breadcrumb')}>
          <Link to={ROUTES.workspace} className="font-light text-neutral-400 hover:text-primary">
            {t('cab.nonconformities.breadcrumbParent')}
          </Link>
          <Chevron />
          <span className="font-medium text-neutral-700">{t('cab.nonconformities.title')}</span>
        </nav>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <CabTourStep steps={tourSteps} stepId="nonconformities-header">
            <div>
              <h1 className="text-[28px] font-bold leading-tight text-neutral-900">
                {t('cab.nonconformities.title')}
              </h1>
              <p className="mt-1 text-[14px] text-neutral-500">{t('cab.nonconformities.subtitle')}</p>
            </div>
          </CabTourStep>
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <Button variant="outline" className="h-11 flex-1 text-[14px] sm:flex-none" onClick={() => setImportOpen(true)}>
            {t('common.import')}
          </Button>
          <CabTourStep steps={tourSteps} stepId="nonconformities-export">
            <ExportMenuButton
              exporting={exporting}
              disabled={filtered.length === 0}
              onExportExcel={handleExportExcel}
              onExportPdf={handleExportPdf}
              className="w-full sm:w-auto"
            />
          </CabTourStep>
          </div>
        </div>

        {/* Filters */}
        <CabTourStep steps={tourSteps} stepId="nonconformities-filters">
          <section className="rounded-[16px] border border-[#ececec] bg-white p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.6fr_1fr_1fr_auto] lg:items-end">
              <div className="flex flex-col gap-2">
                <label htmlFor="nonconformity-search" className="text-[13px] font-semibold text-neutral-700">
                  {t('cab.nonconformities.filters.search')}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400">
                    <AppIcon icon={SearchIcon} size={18} />
                  </span>
                  <input
                    id="nonconformity-search"
                    type="text"
                    value={query}
                    onChange={(event) => {
                      setPage(1)
                      setQuery(event.target.value)
                    }}
                    placeholder={t('cab.nonconformities.filters.searchPlaceholder')}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white ps-10 pe-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-neutral-700">
                  {t('cab.nonconformities.filters.raisedPeriod')}
                </span>
                <DateRangePicker
                  value={period}
                  onChange={(next) => {
                    setPage(1)
                    setPeriod(next)
                  }}
                  className="[&_button]:h-11"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-neutral-700">
                  {t('cab.nonconformities.fields.country')}
                </span>
                <SelectField
                  value={countryFilter}
                  onChange={(value) => {
                    setPage(1)
                    setCountryFilter(value)
                  }}
                  className="h-11"
                  options={[
                    { value: 'all', label: t('cab.nonconformities.filters.allCountries') },
                    ...countryOptions.map((country) => ({ value: country, label: country })),
                  ]}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-neutral-700">
                  {t('cab.nonconformities.table.status')}
                </span>
                <SelectField
                  value={statusFilter}
                  onChange={(value) => {
                    setPage(1)
                    setStatusFilter(value)
                  }}
                  className="h-11"
                  options={[
                    { value: 'all', label: t('cab.nonconformities.filters.allStatuses') },
                    ...NONCONFORMITY_STATUSES.map((status) => ({
                      value: status,
                      label: statusLabel(status),
                    })),
                  ]}
                />
              </div>

              <div className="flex items-end justify-start lg:justify-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="h-11 whitespace-nowrap text-[14px] font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-neutral-300 disabled:no-underline"
                >
                  {t('cab.nonconformities.filters.clear')}
                </button>
              </div>
            </div>
          </section>
        </CabTourStep>

        <div className="grid grid-cols-1 gap-5">
          {/* Register table */}
          <CabTourStep steps={tourSteps} stepId="nonconformities-table">
            <section className="flex min-w-0 flex-col rounded-[16px] border border-[#ececec] bg-white py-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-5">
                <p className="text-[13px] text-neutral-500">
                  {loading
                    ? t('common.loading')
                    : t('cab.nonconformities.resultCount', { count: filtered.length })}
                </p>
                <div role="group" aria-label={w('viewLabel', 'View')} className="inline-flex rounded-[8px] border border-[#e2e2e2] p-0.5">
                  {(['list', 'pipeline'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      aria-pressed={viewMode === mode}
                      onClick={() => setViewMode(mode)}
                      className={cn(
                        'rounded-[6px] px-4 py-1.5 text-[13px] font-medium transition-colors',
                        viewMode === mode ? 'bg-primary text-white' : 'text-neutral-600 hover:text-neutral-900',
                      )}
                    >
                      {w(`view.${mode}`, mode === 'list' ? 'List' : 'Pipeline')}
                    </button>
                  ))}
                </div>
              </div>

              {viewMode === 'pipeline' ? (
                <div className="grid grid-cols-1 gap-4 overflow-x-auto px-5 md:grid-cols-5">
                  {NC_PIPELINE_COLUMNS.map((column) => {
                    const cards = filtered.filter((item) => item.status === column)
                    return (
                      <div key={column} className="flex min-w-[200px] flex-col gap-3 rounded-[12px] bg-[#f9fafc] p-3" data-column={column}>
                        <div className="flex items-center justify-between">
                          <NonconformityStatusBadge status={column} label={statusLabel(column)} />
                          <span className="text-[13px] font-semibold text-neutral-600" dir="ltr">{cards.length}</span>
                        </div>
                        {cards.length === 0 && <p className="py-4 text-center text-[12px] text-neutral-400">{w('columnEmpty', 'Nothing here')}</p>}
                        {cards.map((item) => (
                          <Link
                            key={item.id}
                            to={cabNonconformityPath(item.id)}
                            className="rounded-[10px] border border-[#ececec] bg-white p-3 transition-colors hover:border-primary"
                          >
                            <p className="text-[14px] font-semibold text-primary" dir="ltr">{item.ncId}</p>
                            <p className="mt-0.5 truncate text-[13px] text-neutral-800">{item.clientName || '—'}</p>
                            <p className="mt-0.5 text-[12px] text-neutral-500">
                              {w(`class.${item.classification}`, item.classificationLabel)}
                              {item.clause ? ` · ${item.clause}` : ''}
                            </p>
                            <p className={cn('mt-1 text-[12px]', item.overdue ? 'font-medium text-[#dc2626]' : 'text-neutral-500')}>
                              {fmt(item.dueDateRaw) || '—'}
                            </p>
                          </Link>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ) : (

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-center">
                  <thead>
                    <tr className="bg-[#1236a3] text-white">
                      <th className="px-4 py-4 text-[14px] font-medium">{t('cab.nonconformities.table.ncId')}</th>
                      <th className="px-4 py-4 text-[14px] font-medium">{t('cab.nonconformities.table.finding')}</th>
                      <th className="px-4 py-4 text-[14px] font-medium">{t('cab.nonconformities.table.client')}</th>
                      <th className="px-4 py-4 text-[14px] font-medium">{t('cab.nonconformities.table.classification')}</th>
                      <th className="px-4 py-4 text-[14px] font-medium">{t('cab.nonconformities.table.due')}</th>
                      <th className="px-4 py-4 text-[14px] font-medium">{t('cab.nonconformities.table.owner')}</th>
                      <th className="px-4 py-4 text-[14px] font-medium">{t('cab.nonconformities.table.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-[15px] text-neutral-500">
                          {t('common.loading')}
                        </td>
                      </tr>
                    ) : paginated.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-[15px] text-neutral-500">
                          {nonconformities.length === 0 ? w('emptyRegister', 'No nonconformities yet. They appear here when a nonconformity finding is submitted in an audit, or when you import them.') : t('cab.nonconformities.empty')}
                        </td>
                      </tr>
                    ) : (
                      paginated.map((row, index) => (
                        <tr
                          key={row.id}
                          onClick={() => navigate(cabNonconformityPath(row.id))}
                          className={cn(
                            'cursor-pointer transition-colors hover:bg-[#e8edfc]/50',
                            index % 2 ? 'bg-[#f9fafc]' : '',
                          )}
                        >
                          <td className="px-4 py-4 text-[15px] font-medium text-primary" dir="ltr">
                            <Link to={cabNonconformityPath(row.id)} onClick={(event) => event.stopPropagation()} className="hover:underline">
                              {row.ncId}
                            </Link>
                          </td>
                          <td className="px-4 py-4 text-[15px] text-neutral-700" dir="ltr">
                            {row.findingId}
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-[15px] font-medium text-neutral-900">{row.clientName}</div>
                            <div className="text-[12px] text-neutral-500" dir="ltr">{row.clientId || row.auditId}</div>
                          </td>
                          <td className="px-4 py-4 text-[15px] text-neutral-700">{row.classificationLabel}</td>
                          <td
                            className={cn(
                              'px-4 py-4 text-[15px]',
                              row.overdue ? 'font-medium text-[#dc2626]' : 'text-neutral-700',
                            )}
                            
                          >
                            {fmt(row.dueDateRaw) || '—'}
                          </td>
                          <td className="px-4 py-4 text-[15px] text-neutral-700">{row.ownerName}</td>
                          <td className="px-4 py-4">
                            <CabTourStep
                              steps={tourSteps}
                              stepId={index === 0 ? 'nonconformities-status' : undefined}
                            >
                              <NonconformityStatusBadge status={row.status} label={statusLabel(row.status)} />
                            </CabTourStep>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              )}

              {viewMode === 'list' && (
                <TablePagination
                  page={currentPage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  className="mt-5 px-5"
                />
              )}
            </section>
          </CabTourStep>

        </div>

        {importOpen && (
          <ImportWizardDialog
            key="nonconformities"
            entityKey="nonconformities"
            isArabic={i18n.language === 'ar'}
            onClose={() => setImportOpen(false)}
            onImported={() => setReloadKey((k) => k + 1)}
          />
        )}
      </main>
    </CabLayout>
  )
}