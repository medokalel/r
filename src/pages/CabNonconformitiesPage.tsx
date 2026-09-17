import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { NonconformityStatusBadge } from '@/components/dashboard/cab/NonconformityStatusBadge'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/Select'
import { DateRangePicker, type DateRange } from '@/components/ui/DateRangePicker'
import { AppIcon, AttachIcon, DownloadTrayIcon, HistoryIcon, SearchIcon } from '@/components/icons'
import {
  getNonconformities,
  getNonconformityCountries,
  NONCONFORMITY_STATUSES,
  type NonconformityItem,
  type NonconformityStatus,
} from '@/lib/api/cabNonconformitiesApi'
import { downloadExcelCsv, matchesSearch, type TableColumn } from '@/lib/tableTools'
import { ROUTES, cabNonconformityResponsePath } from '@/lib/routes'
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

const DETAIL_TABS = ['details', 'actions', 'attachments', 'history'] as const
type DetailTab = (typeof DETAIL_TABS)[number]

const PAGE_SIZE = 10

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-3">
      <p className="text-[13px] text-neutral-500">{label}</p>
      <div className="text-[13px] font-medium text-neutral-900">{children || '—'}</div>
    </div>
  )
}

export function CabNonconformitiesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [nonconformities, setNonconformities] = useState<NonconformityItem[]>([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState<DateRange>({ from: null, to: null })
  const [countryFilter, setCountryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<DetailTab>('details')
  const [exporting, setExporting] = useState(false)

  const countryOptions = useMemo(() => getNonconformityCountries(), [])

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
  }, [])

  const filtered = useMemo(() => {
    return nonconformities.filter((item) => {
      const matchesQuery = matchesSearch(
        [item.ncId, item.findingId, item.clientName, item.clientId],
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

  const selected = useMemo(
    () => filtered.find((item) => item.id === selectedId) ?? null,
    [filtered, selectedId],
  )

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

  const handleExport = () => {
    setExporting(true)
    try {
      downloadExcelCsv('nonconformities.csv', exportColumns, filtered)
    } finally {
      setExporting(false)
    }
  }

  const tabLabels: Record<DetailTab, string> = {
    details: t('cab.nonconformities.tabs.details'),
    actions: t('cab.nonconformities.tabs.actions'),
    attachments: t('cab.nonconformities.tabs.attachments'),
    history: t('cab.nonconformities.tabs.history'),
  }

  return (
    <CabLayout>
      <CabHeader title={t('cab.nonconformities.title')} notificationCount={3} />
      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]" aria-label="breadcrumb">
          <Link to={ROUTES.workspace} className="font-light text-neutral-400 hover:text-primary">
            {t('cab.nonconformities.breadcrumbParent')}
          </Link>
          <Chevron />
          <span className="font-medium text-neutral-700">{t('cab.nonconformities.title')}</span>
        </nav>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-[28px] font-bold leading-tight text-neutral-900">
              {t('cab.nonconformities.title')}
            </h1>
            <p className="mt-1 text-[14px] text-neutral-500">{t('cab.nonconformities.subtitle')}</p>
          </div>
          <Button
            variant="outline"
            icon={<AppIcon icon={DownloadTrayIcon} size={20} />}
            onClick={handleExport}
            disabled={exporting || filtered.length === 0}
            className="w-full sm:w-auto"
          >
            {exporting ? t('common.exporting') : t('common.export')}
          </Button>
        </div>

        {/* Filters */}
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

        <div className={cn('grid grid-cols-1 gap-5', selected && 'xl:grid-cols-[minmax(0,1fr)_400px]')}>
          {/* Register table */}
          <section className="flex min-w-0 flex-col rounded-[16px] border border-[#ececec] bg-white py-5">
            <p className="mb-4 px-5 text-[13px] text-neutral-500">
              {loading
                ? t('common.loading')
                : t('cab.nonconformities.resultCount', { count: filtered.length })}
            </p>

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
                        {t('cab.nonconformities.empty')}
                      </td>
                    </tr>
                  ) : (
                    paginated.map((row, index) => (
                      <tr
                        key={row.id}
                        onClick={() => {
                          setSelectedId(row.id)
                          setTab('details')
                        }}
                        className={cn(
                          'cursor-pointer transition-colors hover:bg-[#e8edfc]/50',
                          selected?.id === row.id
                            ? 'bg-[#e8edfc]/50'
                            : index % 2
                              ? 'bg-[#f9fafc]'
                              : '',
                        )}
                      >
                        <td className="px-4 py-4 text-[15px] font-medium text-primary" dir="ltr">
                          {row.ncId}
                        </td>
                        <td className="px-4 py-4 text-[15px] text-neutral-700" dir="ltr">
                          {row.findingId}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-[15px] font-medium text-neutral-900">{row.clientName}</div>
                          <div className="text-[12px] text-neutral-500" dir="ltr">{row.clientId}</div>
                        </td>
                        <td className="px-4 py-4 text-[15px] text-neutral-700">{row.classificationLabel}</td>
                        <td
                          className={cn(
                            'px-4 py-4 text-[15px]',
                            row.overdue ? 'font-medium text-[#dc2626]' : 'text-neutral-700',
                          )}
                          dir="ltr"
                        >
                          {row.dueDate}
                        </td>
                        <td className="px-4 py-4 text-[15px] text-neutral-700">{row.ownerName}</td>
                        <td className="px-4 py-4">
                          <NonconformityStatusBadge status={row.status} label={statusLabel(row.status)} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <TablePagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              className="mt-5 px-5"
            />
          </section>

          {/* Selected nonconformity detail panel */}
          {selected && (
            <aside className="flex min-w-0 flex-col rounded-[16px] border border-[#ececec] bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-[22px] font-bold text-neutral-900">{selected.ncId}</h2>
                    <NonconformityStatusBadge
                      status={selected.status}
                      label={statusLabel(selected.status)}
                    />
                  </div>
                  <p className="mt-1 text-[13px] text-neutral-500">
                    {t('cab.nonconformities.fields.finding')}: {selected.findingId}
                    <span className="mx-2 text-neutral-200">|</span>
                    {t('cab.nonconformities.table.client')}: {selected.clientId}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  aria-label={t('common.close')}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div
                className="mt-4 flex gap-1.5 overflow-x-auto border-b border-[#ececec]"
                role="tablist"
                aria-label={t('cab.nonconformities.tabsLabel')}
              >
                {DETAIL_TABS.map((tabId) => (
                  <button
                    key={tabId}
                    type="button"
                    role="tab"
                    aria-selected={tab === tabId}
                    onClick={() => setTab(tabId)}
                    className={cn(
                      'whitespace-nowrap border-b-2 px-4 py-2.5 text-[14px] font-medium transition-colors',
                      tab === tabId
                        ? 'border-primary text-primary'
                        : 'border-transparent text-neutral-600 hover:text-neutral-900',
                    )}
                  >
                    {tabLabels[tabId]}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex-1">
                {tab === 'details' && (
                  <div className="space-y-3">
                    <Field label={t('cab.nonconformities.table.client')}>
                      {selected.clientName} ({selected.clientId})
                    </Field>
                    <Field label={t('cab.nonconformities.fields.country')}>{selected.country}</Field>
                    <Field label={t('cab.nonconformities.fields.finding')}>
                      <span className="text-primary">{selected.findingId}</span>
                    </Field>
                    <Field label={t('cab.nonconformities.table.classification')}>
                      {selected.classificationLabel}
                    </Field>
                    <Field label={t('cab.nonconformities.fields.description')}>
                      <span className="font-normal">{selected.description}</span>
                    </Field>
                    <Field label={t('cab.nonconformities.fields.raisedDate')}>{selected.raisedDate}</Field>
                    <Field label={t('cab.nonconformities.table.due')}>
                      <span className={cn(selected.overdue && 'text-[#dc2626]')}>{selected.dueDate}</span>
                    </Field>
                    <Field label={t('cab.nonconformities.table.owner')}>{selected.ownerName}</Field>
                    <Field label={t('cab.nonconformities.table.status')}>
                      <NonconformityStatusBadge
                        status={selected.status}
                        label={statusLabel(selected.status)}
                      />
                    </Field>
                    <Field label={t('cab.nonconformities.fields.primaryContact')}>
                      {selected.primaryContactName}
                    </Field>
                    <Field label={t('cab.nonconformities.fields.email')}>
                      <a
                        href={`mailto:${selected.primaryContactEmail}`}
                        className="text-primary hover:underline"
                      >
                        {selected.primaryContactEmail}
                      </a>
                    </Field>
                  </div>
                )}

                {tab === 'actions' &&
                  (selected.actions.length === 0 ? (
                    <p className="py-6 text-center text-[13px] text-neutral-400">
                      {t('cab.nonconformities.noActions')}
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {selected.actions.map((action) => (
                        <li
                          key={action.id}
                          className="rounded-[10px] border border-[#ececec] bg-[#f9fafc] p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[13px] font-semibold text-neutral-900">
                              {t(`cab.nonconformities.actionStage.${action.stage}`)}
                            </p>
                            <span className="shrink-0 text-[12px] font-medium text-neutral-500">
                              {t(`cab.nonconformities.actionStatus.${action.status}`)}
                            </span>
                          </div>
                          <p className="mt-1 text-[13px] text-neutral-700">{action.description}</p>
                          <p className="mt-2 text-[12px] text-neutral-500">
                            {action.ownerName}
                            <span className="mx-2 text-neutral-200">|</span>
                            {t('cab.nonconformities.table.due')}: {action.dueDate}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ))}

                {tab === 'attachments' &&
                  (selected.attachments.length === 0 ? (
                    <p className="py-6 text-center text-[13px] text-neutral-400">
                      {t('cab.nonconformities.noAttachments')}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {selected.attachments.map((attachment) => (
                        <li
                          key={attachment.id}
                          className="flex items-start gap-3 rounded-[10px] border border-[#ececec] p-3"
                        >
                          <AppIcon icon={AttachIcon} size={18} className="mt-0.5 shrink-0 text-primary" />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-neutral-900">
                              {attachment.name}
                            </p>
                            <p className="mt-0.5 text-[12px] text-neutral-500">
                              {attachment.sizeLabel}
                              <span className="mx-2 text-neutral-200">|</span>
                              {attachment.uploadedBy}
                              <span className="mx-2 text-neutral-200">|</span>
                              {attachment.uploadedAt}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ))}

                {tab === 'history' && (
                  <ul className="space-y-4">
                    {selected.history.map((entry) => (
                      <li key={entry.id} className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e8edfc] text-primary">
                          <AppIcon icon={HistoryIcon} size={16} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-neutral-900">{entry.text}</p>
                          <p className="mt-0.5 text-[12px] text-neutral-500">
                            {entry.by}
                            <span className="mx-2 text-neutral-200">|</span>
                            {entry.at}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-[#ececec] pt-5 sm:flex-row">
                <Button
                  variant="primary"
                  onClick={() => navigate(cabNonconformityResponsePath(selected.id))}
                  className="h-11 flex-1 text-[14px]"
                >
                  {t('cab.nonconformities.openResponse')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedId(null)}
                  className="h-11 flex-1 text-[14px]"
                >
                  {t('common.close')}
                </Button>
              </div>
            </aside>
          )}
        </div>
      </main>
    </CabLayout>
  )
}