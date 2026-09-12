import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/Select'
import { DateRangePicker, type DateRange } from '@/components/ui/DateRangePicker'
import {
  AddCircleIcon,
  AppIcon,
  ChevronDownIcon,
  ExcelFileIcon,
  ExportIcon,
  MoreIcon,
  PdfFileIcon,
  SearchIcon,
} from '@/components/icons'
import {
  listCabApplications,
  type ApplicationRegisterItem,
  type ApplicationRegisterStatus,
} from '@/lib/api/cabApplicationRegisterApi'
import { getCountryOptions } from '@/lib/countries' 
import { downloadExcelCsv, downloadPdfFromTable, matchesSearch, type TableColumn } from '@/lib/tableTools'
import { cn } from '@/lib/utils'

const statusStyles: Record<ApplicationRegisterStatus, string> = {
  DRAFT: 'bg-[#f3f4f6] text-[#4b5563]',
  UNDER_REVIEW: 'bg-[#e0e7ff] text-[#1236a3]',
  ASSESSMENT: 'bg-[#dbeafe] text-[#1447e6]',
  APPROVED: 'bg-[#d0fae5] text-[#007a55]',
  IN_PROGRESS: 'bg-[#fef3c6] text-[#a58401]',
}

const STATUS_LABEL_KEYS: Record<ApplicationRegisterStatus, string> = {
  DRAFT: 'draft',
  UNDER_REVIEW: 'underReview',
  ASSESSMENT: 'assessment',
  APPROVED: 'approved',
  IN_PROGRESS: 'inProgress',
}

function applicationRoute(app: ApplicationRegisterItem): string {
  return app.status === 'DRAFT' ? '/cab/applications/draft' : `/cab/applications/${app.id}/review`
}

export function CabApplicationRegisterPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const [applications, setApplications] = useState<ApplicationRegisterItem[]>([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState<DateRange>({ from: null, to: null })
  const [countryFilter, setCountryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const pageSize = 10
  const [page, setPage] = useState(1)

  const countryOptions = useMemo(() => getCountryOptions(i18n.language), [i18n.language])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listCabApplications()
      .then((data) => {
        if (!cancelled) setApplications(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      const matchesQuery = matchesSearch([app.applicationCode, app.clientCode, app.clientName], query)
      const matchesCountry = countryFilter === 'all' || app.countryCode === countryFilter
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter
      const updatedAt = new Date(app.updatedAt)
      const matchesFrom = !period.from || updatedAt >= period.from
      const matchesTo = !period.to || updatedAt <= period.to
      return matchesQuery && matchesCountry && matchesStatus && matchesFrom && matchesTo
    })
  }, [applications, query, countryFilter, statusFilter, period])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const rangeFrom = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeTo = Math.min(currentPage * pageSize, filtered.length)

  const hasActiveFilters = Boolean(
    query || period.from || period.to || countryFilter !== 'all' || statusFilter !== 'all'
  )

  const clearFilters = () => {
    setQuery('')
    setPeriod({ from: null, to: null })
    setCountryFilter('all')
    setStatusFilter('all')
    setPage(1)
  }

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))

  const exportColumns: TableColumn<ApplicationRegisterItem>[] = [
    { header: t('cab.applicationRegister.table.applicationCode'), value: (row) => row.applicationCode },
    { header: t('cab.applicationRegister.table.clientCode'), value: (row) => row.clientCode },
    { header: t('cab.applicationRegister.table.clientName'), value: (row) => row.clientName },
    { header: t('cab.applicationRegister.table.standards'), value: (row) => row.standards.join(', ') },
    {
      header: t('cab.applicationRegister.table.stage'),
      value: (row) => t(`cab.applicationRegister.status.${STATUS_LABEL_KEYS[row.status]}`),
    },
    { header: t('cab.applicationRegister.table.updated'), value: (row) => formatDate(row.updatedAt) },
  ]

  const handleExportPdf = () =>
    downloadPdfFromTable(
      'application-register.pdf',
      t('cab.applicationRegister.title'),
      exportColumns,
      filtered
    )
  const handleExportExcel = () => downloadExcelCsv('application-register.csv', exportColumns, filtered)

  return (
    <CabLayout>
      <CabHeader title={t('cab.applicationRegister.title')} notificationCount={3} />
      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-[28px] font-bold leading-tight text-neutral-900">
              {t('cab.applicationRegister.title')}
            </h1>
            <p className="mt-1 text-[14px] text-neutral-500">{t('cab.applicationRegister.subtitle')}</p>
          </div>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <Button
              variant="primary"
              icon={<AppIcon icon={AddCircleIcon} size={20} />}
              onClick={() => navigate('/cab/applications/draft')}
              className="flex-1 sm:flex-none"
            >
              {t('cab.applicationRegister.newApplication')}
            </Button>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button
                  variant="outline"
                  icon={<AppIcon icon={ExportIcon} size={20} />}
                  disabled={filtered.length === 0}
                  className="flex-1 sm:flex-none"
                >
                  {t('cab.applicationRegister.export')}
                  <AppIcon icon={ChevronDownIcon} size={16} />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={4}
                  className="z-50 min-w-[180px] rounded-[8px] border border-[#e2e2e2] bg-white p-1 shadow-lg"
                >
                  <DropdownMenu.Item
                    onSelect={handleExportPdf}
                    className="flex cursor-pointer select-none items-center gap-2 rounded-[6px] px-3 py-2.5 text-[13px] font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                  >
                    <AppIcon icon={PdfFileIcon} size={18} />
                    {t('cab.applicationRegister.exportPdf')}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onSelect={handleExportExcel}
                    className="flex cursor-pointer select-none items-center gap-2 rounded-[6px] px-3 py-2.5 text-[13px] font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                  >
                    <AppIcon icon={ExcelFileIcon} size={18} />
                    {t('cab.applicationRegister.exportExcel')}
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>

        <section className="rounded-[16px] border border-[#ececec] bg-white p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.6fr_1fr_1fr_auto] lg:items-end">
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-neutral-700">
                {t('cab.applicationRegister.filters.search')}
              </span>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400">
                  <AppIcon icon={SearchIcon} size={18} />
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(event) => {
                    setPage(1)
                    setQuery(event.target.value)
                  }}
                  placeholder={t('cab.applicationRegister.filters.searchPlaceholder')}
                  className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white ps-10 pe-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-neutral-700">
                {t('cab.applicationRegister.filters.createdPeriod')}
              </span>
              <DateRangePicker
                value={period}
                onChange={(next) => {
                  setPage(1)
                  setPeriod(next)
                }}
                placeholder={t('cab.applicationRegister.filters.createdPeriodPlaceholder')}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-neutral-700">
                {t('cab.applicationRegister.filters.country')}
              </span>
              <SelectField
                value={countryFilter}
                onChange={(value) => {
                  setPage(1)
                  setCountryFilter(value)
                }}
                options={[
                  { value: 'all', label: t('cab.applicationRegister.filters.allCountries') },
                  ...countryOptions.map((option) => ({
                    value: option.code,
                    label: `${option.flag} ${option.name}`,
                    textValue: option.name,
                  })),
                ]}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-neutral-700">
                {t('cab.applicationRegister.filters.status')}
              </span>
              <SelectField
                value={statusFilter}
                onChange={(value) => {
                  setPage(1)
                  setStatusFilter(value)
                }}
                options={[
                  { value: 'all', label: t('cab.applicationRegister.filters.allStatuses') },
                  ...(Object.keys(STATUS_LABEL_KEYS) as ApplicationRegisterStatus[]).map((status) => ({
                    value: status,
                    label: t(`cab.applicationRegister.status.${STATUS_LABEL_KEYS[status]}`),
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
                {t('cab.applicationRegister.clearFilters')}
              </button>
            </div>
          </div>
        </section>

        <section className="flex flex-col rounded-[16px] border border-[#ececec] bg-white py-5">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] border-collapse text-center">
              <thead>
                <tr className="bg-[#1236a3] text-white">
                  <th className="px-4 py-4 text-[14px] font-medium">
                    {t('cab.applicationRegister.table.applicationCode')}
                  </th>
                  <th className="px-4 py-4 text-[14px] font-medium">
                    {t('cab.applicationRegister.table.clientCode')}
                  </th>
                  <th className="px-4 py-4 text-[14px] font-medium">
                    {t('cab.applicationRegister.table.clientName')}
                  </th>
                  <th className="px-4 py-4 text-[14px] font-medium">
                    {t('cab.applicationRegister.table.standards')}
                  </th>
                  <th className="px-4 py-4 text-[14px] font-medium">
                    {t('cab.applicationRegister.table.stage')}
                  </th>
                  <th className="px-4 py-4 text-[14px] font-medium">
                    {t('cab.applicationRegister.table.updated')}
                  </th>
                  <th className="px-4 py-4 text-[14px] font-medium">
                    <span className="sr-only">{t('cab.applicationRegister.table.actions')}</span>
                  </th>
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
                      {t('cab.applicationRegister.empty')}
                    </td>
                  </tr>
                ) : (
                  paginated.map((app, index) => (
                    <tr
                      key={app.id}
                      onClick={() => navigate(applicationRoute(app))}
                      className={cn('cursor-pointer', index % 2 ? 'bg-[#f9fafc]' : '')}
                    >
                      <td className="px-4 py-4 font-medium text-[15px] text-primary" dir="ltr">
                        {app.applicationCode}
                      </td>
                      <td className="px-4 py-4 font-medium text-[15px] text-primary" dir="ltr">
                        {app.clientCode}
                      </td>
                      <td className="px-4 py-4 font-medium text-[15px] text-neutral-900">{app.clientName}</td>
                      <td className="px-4 py-4 text-[15px] text-neutral-700">{app.standards.join(', ')}</td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center justify-center rounded-[10px] px-3 py-1.5 text-[12px] font-medium',
                            statusStyles[app.status]
                          )}
                        >
                          {t(`cab.applicationRegister.status.${STATUS_LABEL_KEYS[app.status]}`)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[15px] text-neutral-700" dir="ltr">
                        {formatDate(app.updatedAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div
                          className="flex items-center justify-center"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                              <button
                                type="button"
                                aria-label={t('cab.applicationRegister.table.actions')}
                                className="flex size-9 items-center justify-center rounded-[8px] text-neutral-500 hover:bg-neutral-50 hover:text-primary"
                              >
                                <AppIcon icon={MoreIcon} size={20} className="rotate-90" />
                              </button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                              <DropdownMenu.Content
                                align="end"
                                sideOffset={4}
                                className="z-50 min-w-[170px] rounded-[8px] border border-[#e2e2e2] bg-white p-1 shadow-lg"
                              >
                                <DropdownMenu.Item
                                  onSelect={() => navigate(applicationRoute(app))}
                                  className="cursor-pointer select-none rounded-[6px] px-3 py-2.5 text-start text-[13px] font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                                >
                                  {app.status === 'DRAFT'
                                    ? t('cab.applicationRegister.rowActions.continueDraft')
                                    : t('cab.applicationRegister.rowActions.view')}
                                </DropdownMenu.Item>
                              </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                          </DropdownMenu.Root>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 px-5 md:hidden">
            {loading ? (
              <p className="py-6 text-center text-[14px] text-neutral-500">{t('common.loading')}</p>
            ) : paginated.length === 0 ? (
              <p className="py-6 text-center text-[14px] text-neutral-500">{t('cab.applicationRegister.empty')}</p>
            ) : (
              paginated.map((app) => (
                <div key={app.id} className="w-full rounded-[12px] border border-[#ececec] p-4">
                  <button
                    type="button"
                    onClick={() => navigate(applicationRoute(app))}
                    className="w-full text-start"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-[14px] text-primary" dir="ltr">
                        {app.applicationCode}
                      </p>
                      <span
                        className={cn(
                          'inline-flex shrink-0 items-center justify-center rounded-[10px] px-3 py-1 text-[12px] font-medium',
                          statusStyles[app.status]
                        )}
                      >
                        {t(`cab.applicationRegister.status.${STATUS_LABEL_KEYS[app.status]}`)}
                      </span>
                    </div>
                    <p className="text-[13px] text-neutral-500" dir="ltr">
                      {app.clientCode}
                    </p>
                    <p className="mt-2 text-[14px] font-medium text-neutral-900">{app.clientName}</p>
                    <p className="text-[13px] text-neutral-500">{app.standards.join(', ')}</p>
                    <p className="mt-2 text-[13px] text-neutral-500" dir="ltr">
                      {formatDate(app.updatedAt)}
                    </p>
                  </button>
                </div>
              ))
            )}
          </div>

          {!loading && filtered.length > 0 && (
            <div className="mt-5 flex flex-col gap-3 border-t border-[#ececec] px-5 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13px] text-neutral-500">
                {t('cab.applicationRegister.showingRange', {
                  from: rangeFrom,
                  to: rangeTo,
                  total: filtered.length,
                })}
              </p>
              <TablePagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </section>
      </main>
    </CabLayout>
  )
}