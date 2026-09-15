import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/Select'
import { DateRangePicker, type DateRange } from '@/components/ui/DateRangePicker'
import { Tooltip } from '@/components/ui'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { AddCircleIcon, AppIcon, ChevronDownIcon, ExcelFileIcon, ExportIcon, MoreIcon, PdfFileIcon, SearchIcon } from '@/components/icons'
import {
  MOCK_CLIENT_REGISTER_ENTRIES,
  type ClientRegisterEntry,
} from '@/lib/api/clientRegisterMockData'
import { APPLICATION_STATUS_LABEL_KEYS, APPLICATION_STATUS_STYLES } from '@/lib/applicationStatus'
import { getCountryOptions } from '@/lib/countries'
import { downloadExcelCsv, downloadPdfFromTable, matchesSearch, type TableColumn } from '@/lib/tableTools'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

/**
 * This page has no backend yet — it renders `MOCK_CLIENT_REGISTER_ENTRIES`
 * (see clientRegisterMockData.ts). The existing `/cab/clients` page
 * (CabClientsPage + clientRegistrationApi) is untouched and keeps its real
 * API; this page only replaces the "Audit Clients" tile's destination from
 * the workspace. Swap the mock data for a real `listX` API call once one
 * exists — the filtering/pagination logic below won't need to change.
 */

const PAGE_SIZE = 10

function ChevronSeparator() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-400 rtl-flip" aria-hidden>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ClientRegisterPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState<DateRange>({ from: null, to: null })
  const [countryFilter, setCountryFilter] = useState('all')
  const [page, setPage] = useState(1)

  const countryOptions = useMemo(() => getCountryOptions(i18n.language), [i18n.language])

  const filtered = useMemo(() => {
    return MOCK_CLIENT_REGISTER_ENTRIES.filter((client) => {
      const matchesQuery = matchesSearch(
        [client.code, client.name, client.applicationNumber, client.assignedTo.name],
        query
      )
      const matchesCountry = countryFilter === 'all' || client.countryCode === countryFilter
      const createdAt = new Date(client.createdAt)
      const matchesFrom = !period.from || createdAt >= period.from
      const matchesTo = !period.to || createdAt <= period.to
      return matchesQuery && matchesCountry && matchesFrom && matchesTo
    })
  }, [query, countryFilter, period])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const rangeFrom = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeTo = Math.min(currentPage * PAGE_SIZE, filtered.length)

  const hasActiveFilters = Boolean(query || period.from || period.to || countryFilter !== 'all')
  const clearFilters = () => {
    setQuery('')
    setPeriod({ from: null, to: null })
    setCountryFilter('all')
    setPage(1)
  }

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))

  const exportColumns: TableColumn<ClientRegisterEntry>[] = [
    { header: t('cab.clientRegister.table.serial'), value: (_row, index) => index + 1 },
    { header: t('cab.clientRegister.table.auditClient'), value: (row) => row.name },
    { header: t('cab.clientRegister.table.applicationNumber'), value: (row) => row.applicationNumber },
    { header: t('cab.clientRegister.table.assignedPerson'), value: (row) => row.assignedTo.name },
    {
      header: t('cab.clientRegister.table.status'),
      value: (row) => t(`cab.applicationRegister.status.${APPLICATION_STATUS_LABEL_KEYS[row.status]}`),
    },
    { header: t('cab.clientRegister.table.dateOfCreation'), value: (row) => formatDate(row.createdAt) },
  ]

  const handleExportPdf = () =>
    downloadPdfFromTable('client-register.pdf', t('cab.clientRegister.title'), exportColumns, filtered)
  const handleExportExcel = () => downloadExcelCsv('client-register.csv', exportColumns, filtered)

  const columns: { key: string; label: string }[] = [
    { key: 'serial', label: t('cab.clientRegister.table.serial') },
    { key: 'auditClient', label: t('cab.clientRegister.table.auditClient') },
    { key: 'applicationNumber', label: t('cab.clientRegister.table.applicationNumber') },
    { key: 'assignedPerson', label: t('cab.clientRegister.table.assignedPerson') },
    { key: 'status', label: t('cab.clientRegister.table.status') },
    { key: 'dateOfCreation', label: t('cab.clientRegister.table.dateOfCreation') },
  ]

  return (
    <CabLayout>
      <CabHeader title={t('cab.clientRegister.title')} notificationCount={3} />
      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]" aria-label="breadcrumb">
          <Link to={ROUTES.workspace} className="font-light text-neutral-400 hover:text-primary">
            {t('cab.clientRegister.breadcrumbParent')}
          </Link>
          <ChevronSeparator />
          <span className="font-medium text-neutral-700">{t('cab.clientRegister.title')}</span>
        </nav>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-[28px] font-bold leading-tight text-neutral-900">{t('cab.clientRegister.title')}</h1>
            <p className="mt-1 text-[14px] text-neutral-500">{t('cab.clientRegister.subtitle')}</p>
          </div>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <Button
              variant="primary"
              icon={<AppIcon icon={AddCircleIcon} size={20} />}
              onClick={() => navigate('/cab/clients/new')}
              className="flex-1 sm:flex-none"
            >
              {t('cab.clientRegister.newClient')}
            </Button>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button
                  variant="outline"
                  icon={<AppIcon icon={ExportIcon} size={20} />}
                  disabled={filtered.length === 0}
                  className="flex-1 sm:flex-none"
                >
                  {t('cab.clientRegister.export')}
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
                    {t('cab.clientRegister.exportPdf')}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onSelect={handleExportExcel}
                    className="flex cursor-pointer select-none items-center gap-2 rounded-[6px] px-3 py-2.5 text-[13px] font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                  >
                    <AppIcon icon={ExcelFileIcon} size={18} />
                    {t('cab.clientRegister.exportExcel')}
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>

        <section className="rounded-[16px] border border-[#ececec] bg-white p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.4fr_1.2fr_auto] lg:items-end">
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-neutral-700">
                {t('cab.clientRegister.filters.search')}
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
                  placeholder={t('cab.clientRegister.filters.searchPlaceholder')}
                  className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white ps-10 pe-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-neutral-700">
                {t('cab.clientRegister.filters.addedPeriod')}
              </span>
              <DateRangePicker
                value={period}
                onChange={(next) => {
                  setPage(1)
                  setPeriod(next)
                }}
                placeholder={t('cab.clientRegister.filters.addedPeriodPlaceholder')}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-neutral-700">
                {t('cab.clientRegister.filters.country')}
              </span>
              <SelectField
                value={countryFilter}
                onChange={(value) => {
                  setPage(1)
                  setCountryFilter(value)
                }}
                options={[
                  { value: 'all', label: t('cab.clientRegister.filters.allCountries') },
                  ...countryOptions.map((option) => ({
                    value: option.code,
                    label: `${option.flag} ${option.name}`,
                    textValue: option.name,
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
                {t('cab.clientRegister.clearFilters')}
              </button>
            </div>
          </div>
        </section>

        <section className="flex flex-col rounded-[16px] border border-[#ececec] bg-white py-5">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] border-collapse text-center">
              <thead>
                <tr className="bg-[#1236a3] text-white">
                  {columns.map((column) => (
                    <th key={column.key} className="px-4 py-4 text-[14px] font-medium">
                      {column.label}
                    </th>
                  ))}
                  <th className="px-4 py-4 text-[14px] font-medium">
                    <span className="sr-only">{t('cab.clientRegister.table.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-4 py-8 text-[15px] text-neutral-500">
                      {t('cab.clientRegister.empty')}
                    </td>
                  </tr>
                ) : (
                  paginated.map((client, index) => (
                    <tr key={client.id} className={cn(index % 2 ? 'bg-[#f9fafc]' : '')}>
                      <td className="px-4 py-4 text-[14px] text-neutral-700" dir="ltr">
                        {(currentPage - 1) * PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-4 py-4 font-medium text-[15px] text-neutral-900">{client.name}</td>
                      <td className="px-4 py-4 font-medium text-[15px] text-primary" dir="ltr">
                        {client.applicationNumber}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center justify-center gap-2">
                          <UserAvatar alt={client.assignedTo.name} src={client.assignedTo.avatarUrl} className="size-8" />
                          <span className="text-[14px] font-medium text-neutral-900">{client.assignedTo.name}</span>
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center justify-center rounded-[10px] px-3 py-1.5 text-[12px] font-medium',
                            APPLICATION_STATUS_STYLES[client.status]
                          )}
                        >
                          {t(`cab.applicationRegister.status.${APPLICATION_STATUS_LABEL_KEYS[client.status]}`)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[14px] text-neutral-700" dir="ltr">
                        {formatDate(client.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center">
                          <DropdownMenu.Root>
                            <Tooltip label={t('cab.clientRegister.rowActions.unavailable')}>
                              <DropdownMenu.Trigger asChild>
                                <button
                                  type="button"
                                  aria-label={t('cab.clientRegister.table.actions')}
                                  className="flex size-9 items-center justify-center rounded-[8px] text-neutral-500 hover:bg-neutral-50 hover:text-primary"
                                >
                                  <AppIcon icon={MoreIcon} size={20} className="rotate-90" />
                                </button>
                              </DropdownMenu.Trigger>
                            </Tooltip>
                            <DropdownMenu.Portal>
                              <DropdownMenu.Content
                                align="end"
                                sideOffset={4}
                                className="z-50 min-w-[170px] rounded-[8px] border border-[#e2e2e2] bg-white p-1 shadow-lg"
                              >
                                <DropdownMenu.Item
                                  disabled
                                  className="cursor-not-allowed select-none rounded-[6px] px-3 py-2.5 text-start text-[13px] font-medium text-neutral-400 outline-none"
                                >
                                  {t('cab.clientRegister.rowActions.view')}
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                  disabled
                                  className="cursor-not-allowed select-none rounded-[6px] px-3 py-2.5 text-start text-[13px] font-medium text-neutral-400 outline-none"
                                >
                                  {t('cab.clientRegister.rowActions.edit')}
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
            {paginated.length === 0 ? (
              <p className="py-6 text-center text-[14px] text-neutral-500">{t('cab.clientRegister.empty')}</p>
            ) : (
              paginated.map((client, index) => (
                <div key={client.id} className="w-full rounded-[12px] border border-[#ececec] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-[14px] text-primary" dir="ltr">
                      {client.applicationNumber}
                    </p>
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center justify-center rounded-[10px] px-3 py-1 text-[12px] font-medium',
                        APPLICATION_STATUS_STYLES[client.status]
                      )}
                    >
                      {t(`cab.applicationRegister.status.${APPLICATION_STATUS_LABEL_KEYS[client.status]}`)}
                    </span>
                  </div>
                  <p className="mt-2 text-[13px] text-neutral-500" dir="ltr">
                    #{(currentPage - 1) * PAGE_SIZE + index + 1}
                  </p>
                  <p className="mt-1 text-[14px] font-medium text-neutral-900">{client.name}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <UserAvatar alt={client.assignedTo.name} src={client.assignedTo.avatarUrl} className="size-7" />
                    <p className="text-[13px] text-neutral-600">{client.assignedTo.name}</p>
                  </div>
                  <p className="mt-2 text-[13px] text-neutral-500" dir="ltr">
                    {formatDate(client.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>

          {filtered.length > 0 && (
            <div className="mt-5 flex flex-col gap-3 border-t border-[#ececec] px-5 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13px] text-neutral-500">
                {t('cab.clientRegister.showingRange', { from: rangeFrom, to: rangeTo, total: filtered.length })}
              </p>
              <TablePagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </section>
      </main>
    </CabLayout>
  )
}