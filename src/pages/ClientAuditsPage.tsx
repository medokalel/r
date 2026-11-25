import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { auditStageLabel } from '@/components/cab/auditPlanning/shared'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { TableFilterSelect } from '@/components/dashboard/TableFilterSelect'
import { TablePagination } from '@/components/dashboard/TablePagination'
import {
  AppIcon,
  ExcelFileIcon,
  FilterFunnelIcon,
  MoreIcon,
  PdfFileIcon,
  SearchIcon,
} from '@/components/icons'
import { AppLayout } from '@/components/layout/AppLayout'
import { DateRangePicker } from '@/components/ui'
import type { AuditPlan } from '@/lib/api/cabAuditPlanningApi'
import {
  getPlanConfirmation,
  listClientAudits,
  type ClientPlanConfirmation,
} from '@/lib/api/clientAuditsApi'
import {
  AUDITS_PAGE_SIZE,
  EMPTY_AUDIT_FILTERS,
  auditSpecifications,
  auditStages,
  filterClientAudits,
  paginateAudits,
  type ClientAuditFilters,
} from '@/lib/clientAuditsList'
import { clientAuditPlanPath } from '@/lib/routes'
import { downloadExcelCsv, downloadPdfFromTable, type TableColumn } from '@/lib/tableTools'
import { cn } from '@/lib/utils'

function formatAuditDate(value: string, language: string): string {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(language, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const confirmationStyles: Record<ClientPlanConfirmation, string> = {
  pending: 'bg-[#fef3c6] text-[#a58401]',
  confirmed: 'bg-[#e7f6ec] text-[#1e7e34]',
  objected: 'bg-[#fef2f2] text-[#b91c1c]',
}

const thClass =
  'overflow-hidden px-2 py-2.5 text-center text-[11px] font-normal leading-[1.3] break-words text-white'
const tdClass = 'overflow-hidden px-2 py-2.5 text-[11px] font-semibold leading-snug align-middle'
const tdTextClass = cn(tdClass, 'text-neutral-700')
const stageBtnClass =
  'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[4px] border border-[#B6D0FF] bg-[#E6EFFF] px-3 py-1.5 text-[10px] font-medium leading-none text-[#0D55D2]'

function SpecificationTag({ name }: { name: string }) {
  return (
    <span className="inline-flex min-w-[88px] max-w-full items-center justify-center whitespace-nowrap rounded-[4px] bg-[#E8EDFC] px-3.5 py-2 font-sans text-sm font-medium leading-none text-[#1236A3]">
      <bdi>{name}</bdi>
    </span>
  )
}

function ConfirmationPill({ confirmation, label }: { confirmation: ClientPlanConfirmation; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center justify-center rounded-full px-3 py-1 text-center text-[11px] font-medium leading-tight',
        confirmationStyles[confirmation],
      )}
    >
      {label}
    </span>
  )
}

export function ClientAuditsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [plans, setPlans] = useState<AuditPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState<ClientAuditFilters>(EMPTY_AUDIT_FILTERS)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    listClientAudits()
      .then((result) => {
        if (!cancelled) setPlans(result)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const visible = useMemo(() => filterClientAudits(plans, filters), [plans, filters])
  const pagination = paginateAudits(visible, page, AUDITS_PAGE_SIZE)
  const rows = pagination.items
  const hasFilters =
    Boolean(filters.search.trim()) ||
    filters.specification !== 'all' ||
    filters.stage !== 'all' ||
    filters.confirmation !== 'all' ||
    Boolean(filters.from) ||
    Boolean(filters.to)

  const updateFilters = (patch: Partial<ClientAuditFilters>) => {
    setPage(1)
    setFilters((current) => ({ ...current, ...patch }))
  }
  const applySearch = () => updateFilters({ search: searchInput })

  const pageIds = rows.map((plan) => plan.id)
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id))
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(pageIds))
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const dates = (plan: AuditPlan) =>
    `${formatAuditDate(plan.proposedStartDate, i18n.language)} - ${formatAuditDate(plan.proposedEndDate, i18n.language)}`

  const exportColumns: TableColumn<AuditPlan>[] = [
    { header: '#', value: (_, index) => index + 1 },
    { header: t('clientAudits.list.columns.planNumber'), value: (plan) => plan.planNumber },
    { header: t('clientAudits.list.columns.specification'), value: (plan) => plan.standards.join(', ') },
    { header: t('clientAudits.list.columns.site'), value: (plan) => plan.siteName },
    { header: t('clientAudits.list.columns.dates'), value: (plan) => dates(plan) },
    { header: t('clientAudits.list.columns.stage'), value: (plan) => auditStageLabel(t, plan.stage) },
    {
      header: t('clientAudits.list.columns.confirmation'),
      value: (plan) => t(`clientAudits.confirmation.${getPlanConfirmation(plan)}`),
    },
  ]
  const exportRows = () => {
    const chosen = visible.filter((plan) => selected.has(plan.id))
    return chosen.length > 0 ? chosen : visible
  }
  const exportPdf = () =>
    downloadPdfFromTable('audits.pdf', t('clientAudits.pageTitle'), exportColumns, exportRows())
  const exportExcel = () => downloadExcelCsv('audits.csv', exportColumns, exportRows())

  const openPlan = (plan: AuditPlan) => navigate(clientAuditPlanPath(plan.planNumber))
  const exportDisabled = loading || visible.length === 0
  const colCount = 8

  return (
    <AppLayout>
      <AccreditationHeader titleKey="clientAudits.pageTitle" />
      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 pb-28 sm:p-5 sm:pb-28 md:pb-5">
        <section className="flex min-w-0 flex-col gap-5 rounded-[16px] border border-[#ececec] bg-white p-3 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex min-w-0 w-full flex-col gap-3 sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative min-w-0 w-full sm:min-w-[240px] sm:max-w-[360px] sm:flex-1">
                <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400">
                  <AppIcon icon={SearchIcon} size={18} />
                </span>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && applySearch()}
                  placeholder={t('clientAudits.searchPlaceholder')}
                  aria-label={t('clientAudits.searchPlaceholder')}
                  className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white ps-10 pe-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={applySearch}
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
                    'flex size-11 shrink-0 items-center justify-center rounded-[8px] text-primary transition-colors md:hidden',
                    filtersOpen ? 'bg-[#e8edfc]' : 'bg-[#f3f6fd] hover:bg-[#e8edfc]',
                  )}
                >
                  <AppIcon icon={FilterFunnelIcon} size={20} />
                </button>
              </div>
            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
              <button
                type="button"
                onClick={exportPdf}
                disabled={exportDisabled}
                className="hidden h-10 items-center justify-center gap-1.5 rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[12px] font-medium text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-50 min-[950px]:flex"
              >
                <AppIcon icon={PdfFileIcon} size={20} />
                {t('periodicVisits.downloadPdf')}
              </button>
              <button
                type="button"
                onClick={exportExcel}
                disabled={exportDisabled}
                className="hidden h-10 items-center justify-center gap-1.5 rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[12px] font-medium text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-50 min-[950px]:flex"
              >
                <AppIcon icon={ExcelFileIcon} size={20} />
                {t('periodicVisits.exportExcel')}
              </button>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    disabled={exportDisabled}
                    aria-label={t('periodicVisits.downloadOptions')}
                    className="flex size-10 shrink-0 items-center justify-center rounded-[8px] border border-[#e2e2e2] bg-white text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 min-[950px]:hidden"
                  >
                    <AppIcon icon={MoreIcon} size={20} className="rotate-90" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={4}
                    className="z-50 min-w-[180px] rounded-[8px] border border-[#e2e2e2] bg-white p-1 shadow-lg"
                  >
                    <DropdownMenu.Item
                      onSelect={exportPdf}
                      className="flex cursor-pointer select-none items-center gap-2 rounded-[6px] px-3 py-2.5 text-[13px] font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                    >
                      <AppIcon icon={PdfFileIcon} size={18} />
                      {t('periodicVisits.downloadPdf')}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onSelect={exportExcel}
                      className="flex cursor-pointer select-none items-center gap-2 rounded-[6px] px-3 py-2.5 text-[13px] font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                    >
                      <AppIcon icon={ExcelFileIcon} size={18} />
                      {t('periodicVisits.exportExcel')}
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>

          {(
            <div
              className={cn(
                'flex-col gap-3 border-t border-[#ececec] pt-4 sm:flex-row sm:flex-wrap sm:items-center md:flex',
                filtersOpen ? 'flex' : 'hidden',
              )}
            >
              <TableFilterSelect
                label={t('periodicVisits.filters.specification')}
                value={filters.specification}
                onChange={(value) => updateFilters({ specification: value })}
                options={[
                  { value: 'all', label: t('periodicVisits.filters.allSpecifications') },
                  ...auditSpecifications(plans).map((name) => ({ value: name, label: name })),
                ]}
              />
              <TableFilterSelect
                label={t('clientAudits.list.filters.stage')}
                value={filters.stage}
                onChange={(value) => updateFilters({ stage: value })}
                options={[
                  { value: 'all', label: t('clientAudits.list.filters.allStages') },
                  ...auditStages(plans).map((stage) => ({ value: stage, label: auditStageLabel(t, stage) })),
                ]}
              />
              <TableFilterSelect
                label={t('clientAudits.list.filters.confirmation')}
                value={filters.confirmation}
                onChange={(value) => updateFilters({ confirmation: value as ClientAuditFilters['confirmation'] })}
                options={[
                  { value: 'all', label: t('clientAudits.list.filters.allConfirmations') },
                  { value: 'pending', label: t('clientAudits.confirmation.pending') },
                  { value: 'confirmed', label: t('clientAudits.confirmation.confirmed') },
                  { value: 'objected', label: t('clientAudits.confirmation.objected') },
                ]}
              />
              <DateRangePicker
                value={{ from: filters.from, to: filters.to }}
                onChange={(range) => updateFilters({ from: range.from, to: range.to })}
                className="sm:w-[300px] [&_button]:h-11"
              />
            </div>
          )}

          <div className="hidden min-w-0 overflow-x-auto md:block">
            <table className="w-full min-w-[900px] table-fixed border-collapse text-center">
              <colgroup>
                <col style={{ width: '4%' }} />
                <col style={{ width: '4%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '18%' }} />
              </colgroup>
              <thead>
                <tr className="bg-[#1236a3] text-white">
                  <th className={thClass}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="size-3 accent-white"
                      aria-label={t('common.selectAll')}
                    />
                  </th>
                  <th className={thClass}>#</th>
                  <th className={thClass}>{t('clientAudits.list.columns.planNumber')}</th>
                  <th className={thClass}>{t('clientAudits.list.columns.specification')}</th>
                  <th className={thClass}>{t('clientAudits.list.columns.site')}</th>
                  <th className={thClass}>{t('clientAudits.list.columns.dates')}</th>
                  <th className={thClass}>{t('clientAudits.list.columns.stage')}</th>
                  <th className={thClass}>{t('clientAudits.list.columns.confirmation')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={colCount} className="px-4 py-8 text-[11px] font-semibold text-neutral-500">
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={colCount} className="px-4 py-8 text-[11px] font-semibold text-neutral-500">
                      {hasFilters ? t('clientAudits.emptySearchTitle') : t('clientAudits.emptyTitle')}
                    </td>
                  </tr>
                ) : (
                  rows.map((plan, index) => {
                    const rowBg = (pagination.page - 1) * AUDITS_PAGE_SIZE + index
                    const bgClass = rowBg % 2 === 1 ? 'bg-[#eef1f6]' : 'bg-white'
                    const confirmation = getPlanConfirmation(plan)
                    return (
                      <tr key={plan.id} onClick={() => openPlan(plan)} className="cursor-pointer hover:brightness-[0.98]">
                        <td className={cn(tdClass, bgClass)} onClick={(event) => event.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selected.has(plan.id)}
                            onChange={() => toggleOne(plan.id)}
                            className="size-3 accent-[#1236A3]"
                            aria-label={plan.planNumber}
                          />
                        </td>
                        <td className={cn(tdTextClass, bgClass)}>{rowBg + 1}</td>
                        <td className={cn(tdClass, bgClass, 'text-primary')}>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              openPlan(plan)
                            }}
                            className="font-semibold text-primary hover:underline"
                          >
                            <bdi>{plan.planNumber}</bdi>
                          </button>
                        </td>
                        <td className={cn(tdClass, bgClass)}>
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {plan.standards.map((standard) => (
                              <SpecificationTag key={standard} name={standard} />
                            ))}
                          </div>
                        </td>
                        <td className={cn(tdTextClass, bgClass)}>
                          <bdi>{plan.siteName}</bdi>
                        </td>
                        <td className={cn(tdTextClass, bgClass)}>
                          <bdi>{formatAuditDate(plan.proposedStartDate, i18n.language)}</bdi>
                          {' - '}
                          <bdi>{formatAuditDate(plan.proposedEndDate, i18n.language)}</bdi>
                        </td>
                        <td className={cn(tdClass, bgClass)}>
                          <span className={stageBtnClass}>{auditStageLabel(t, plan.stage)}</span>
                        </td>
                        <td className={cn(tdClass, bgClass)}>
                          <ConfirmationPill
                            confirmation={confirmation}
                            label={t(`clientAudits.confirmation.${confirmation}`)}
                          />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-[12px] border border-[#ececec] bg-[#f9fafc] p-3 md:hidden">
            {loading ? (
              <p className="py-6 text-center text-[13px] font-semibold text-neutral-500">{t('common.loading')}</p>
            ) : rows.length === 0 ? (
              <p className="py-6 text-center text-[13px] font-semibold text-neutral-500">
                {hasFilters ? t('clientAudits.emptySearchTitle') : t('clientAudits.emptyTitle')}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 px-1 text-[12px] font-medium text-neutral-600">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="size-3.5 accent-[#1236A3]"
                  />
                  {t('common.selectAll')}
                </label>
                {rows.map((plan, index) => {
                  const confirmation = getPlanConfirmation(plan)
                  return (
                    <div
                      key={plan.id}
                      role="link"
                      tabIndex={0}
                      onClick={() => openPlan(plan)}
                      onKeyDown={(event) => event.key === 'Enter' && openPlan(plan)}
                      className="cursor-pointer rounded-[12px] border border-[#ececec] bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <label className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selected.has(plan.id)}
                            onChange={() => toggleOne(plan.id)}
                            className="size-3.5 accent-[#1236A3]"
                          />
                          <span className="text-[12px] text-neutral-500">
                            <bdi>#{(pagination.page - 1) * AUDITS_PAGE_SIZE + index + 1}</bdi>
                          </span>
                        </label>
                        <ConfirmationPill
                          confirmation={confirmation}
                          label={t(`clientAudits.confirmation.${confirmation}`)}
                        />
                      </div>
                      <p className="mt-3 text-[14px] font-semibold text-neutral-900">
                        <bdi>{plan.planNumber}</bdi>
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {plan.standards.map((standard) => (
                          <SpecificationTag key={standard} name={standard} />
                        ))}
                      </div>
                      <p className="mt-2 text-[13px] text-neutral-500">
                        <bdi>{plan.siteName}</bdi>
                      </p>
                      <p className="mt-1 text-[13px] text-neutral-500">
                        <bdi>{formatAuditDate(plan.proposedStartDate, i18n.language)}</bdi>
                        {' - '}
                        <bdi>{formatAuditDate(plan.proposedEndDate, i18n.language)}</bdi>
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={stageBtnClass}>{auditStageLabel(t, plan.stage)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {!loading && visible.length > 0 && (
            <TablePagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
              previousLabel={t('clientAudits.list.previous')}
              nextLabel={t('clientAudits.list.next')}
            />
          )}
        </section>
      </div>
    </AppLayout>
  )
}
