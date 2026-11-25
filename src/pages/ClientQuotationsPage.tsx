import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { ClientQuotationStatusBadge } from '@/components/dashboard/ClientQuotationStatusBadge'
import { TableFilterSelect } from '@/components/dashboard/TableFilterSelect'
import { TablePagination } from '@/components/dashboard/TablePagination'
import {
  AppIcon,
  DashboardGridIcon,
  DocumentTextOutlineIcon,
  DownloadTrayIcon,
  EyeIcon,
  FilterFunnelIcon,
  RequestsListIcon,
  SearchOutlineIcon,
} from '@/components/icons'
import { AppLayout } from '@/components/layout/AppLayout'
import {
  getClientQuotationState,
  listClientQuotations,
  quotationReference,
  type ClientQuotationRecord,
  type ClientQuotationState,
} from '@/lib/api/clientQuotationsApi'
import { formatQuotationDate, formatQuotationMoney } from '@/lib/clientQuotationFormat'
import {
  OFFERS_PAGE_SIZE,
  buildOffersCsv,
  filterClientOffers,
  paginateOffers,
  type OfferStateFilter,
} from '@/lib/clientOffersList'
import { clientQuotationPath } from '@/lib/routes'
import { cn } from '@/lib/utils'

type StateFilter = OfferStateFilter
type ViewMode = 'list' | 'pipeline'

const FILTERS: StateFilter[] = ['all', 'pending', 'accepted', 'rejected', 'expired']
const PIPELINE_STATES: ClientQuotationState[] = ['pending', 'accepted', 'rejected', 'expired']

const pipelineChip: Record<ClientQuotationState, string> = {
  pending: 'bg-[#e8edfc] text-primary',
  accepted: 'bg-[#dcfce7] text-[#15803d]',
  rejected: 'bg-[#fee2e2] text-[#dc2626]',
  expired: 'bg-[#f1f5f9] text-[#475569]',
}

export function ClientQuotationsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [records, setRecords] = useState<ClientQuotationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<StateFilter>('all')
  const [view, setView] = useState<ViewMode>('list')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    listClientQuotations()
      .then((result) => {
        if (!cancelled) setRecords(result)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const visible = useMemo(() => filterClientOffers(records, search, filter), [records, search, filter])

  const pagination = paginateOffers(visible, page, OFFERS_PAGE_SIZE)
  const totalPages = pagination.totalPages
  const paginated = pagination.items
  const filtered = Boolean(search.trim()) || filter !== 'all'

  const applySearch = () => {
    setPage(1)
    setSearch(searchInput)
  }

  const openOffer = (record: ClientQuotationRecord) => navigate(clientQuotationPath(record.quotationId))

  const exportOffers = () => {
    const headers = ['offer', 'amount', 'currency', 'validUntil', 'status'].map((key) =>
      t(`clientQuotations.table.${key}`),
    )
    const csv = buildOffersCsv(visible, headers, (state) => t(`clientQuotations.state.${state}`))
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'offers.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const money = (record: ClientQuotationRecord) =>
    formatQuotationMoney(record.quotation.totalAmount, record.quotation.currency, i18n.language)
  const amountOnly = (record: ClientQuotationRecord) =>
    new Intl.NumberFormat(i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
      Number(record.quotation.totalAmount),
    )

  return (
    <AppLayout>
      <AccreditationHeader titleKey="clientQuotations.pageTitle" />
      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 pb-28 sm:p-5 sm:pb-28 md:pb-5">
        <div>
          <h2 className="text-[24px] font-bold text-neutral-900">{t('clientQuotations.pageTitle')}</h2>
          <p className="mt-1 text-[14px] text-neutral-500">{t('clientQuotations.subtitle')}</p>
        </div>

        <div className="flex min-w-0 flex-col gap-5 rounded-[16px] border border-[#ececec] bg-white p-3 sm:p-5">
          <div className="flex flex-wrap items-center gap-3 border-b border-[#ececec] pb-4">
            <span className="text-[14px] font-medium text-neutral-700">{t('clientQuotations.viewLabel')}</span>
            <div className="inline-flex rounded-[10px] border border-[#e2e2e2] bg-white p-1" role="group">
              {(['list', 'pipeline'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={view === mode}
                  onClick={() => setView(mode)}
                  className={cn(
                    'flex h-9 items-center gap-2 rounded-[8px] px-4 text-[14px] font-medium transition-colors',
                    view === mode ? 'bg-primary text-white' : 'text-neutral-600 hover:bg-[#f3f6fd]',
                  )}
                >
                  <AppIcon icon={mode === 'list' ? RequestsListIcon : DashboardGridIcon} size={16} />
                  {t(`clientQuotations.views.${mode}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <form
              className="flex min-w-0 w-full flex-col gap-3 sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center"
              onSubmit={(event) => {
                event.preventDefault()
                applySearch()
              }}
            >
              <div className="relative min-w-0 w-full sm:min-w-[240px] sm:max-w-[360px] sm:flex-1">
                <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400">
                  <AppIcon icon={SearchOutlineIcon} size={18} />
                </span>
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder={t('clientQuotations.searchPlaceholder')}
                  aria-label={t('clientQuotations.searchPlaceholder')}
                  className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white ps-10 pe-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="h-11 flex-1 shrink-0 rounded-[8px] bg-primary px-6 text-[14px] font-medium text-white hover:opacity-90 sm:flex-none"
                >
                  {t('clientQuotations.search')}
                </button>
                <TableFilterSelect
                  label={t('clientQuotations.filterLabel')}
                  value={filter}
                  onChange={(value) => {
                    setPage(1)
                    setFilter(value as StateFilter)
                  }}
                  options={FILTERS.map((item) => ({
                    value: item,
                    label: t(`clientQuotations.filters.${item}`),
                  }))}
                />
                <button
                  type="submit"
                  aria-label={t('clientQuotations.search')}
                  className="flex size-11 shrink-0 items-center justify-center rounded-[8px] bg-[#f3f6fd] text-primary hover:bg-[#e8edfc]"
                >
                  <AppIcon icon={FilterFunnelIcon} size={20} />
                </button>
              </div>
            </form>
            <button
              type="button"
              onClick={exportOffers}
              disabled={visible.length === 0}
              className="flex h-11 items-center gap-2 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <AppIcon icon={DownloadTrayIcon} size={18} />
              <span>{t('clientQuotations.export')}</span>
            </button>
          </div>

          {view === 'list' ? (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] border-collapse text-center">
                  <thead className="border-b border-[#ececec]">
                    <tr className="bg-[#1236a3] text-white">
                      {['offer', 'amount', 'currency', 'validUntil', 'status', 'actions'].map((column) => (
                        <th key={column} scope="col" className="p-[18px] text-center text-[14px] font-medium">
                          {t(`clientQuotations.table.${column}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                          {t('common.loading', 'Loading...')}
                        </td>
                      </tr>
                    ) : paginated.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                          {filtered ? t('clientQuotations.emptySearchTitle') : t('clientQuotations.emptyTitle')}
                        </td>
                      </tr>
                    ) : (
                      paginated.map((record, index) => (
                        <tr
                          key={record.quotationId}
                          onClick={() => openOffer(record)}
                          className={cn('cursor-pointer hover:bg-[#f3f6fd]', index % 2 === 1 && 'bg-[#f9fafc]')}
                        >
                          <td className="px-4 py-4">
                            <span className="text-[15px] font-semibold text-primary">
                              <bdi>{quotationReference(record)}</bdi>
                            </span>
                          </td>
                          <td className="px-4 py-4 text-[15px] font-medium text-neutral-900">
                            <bdi>{amountOnly(record)}</bdi>
                          </td>
                          <td className="px-4 py-4 text-[15px] text-neutral-700">
                            <bdi>{record.quotation.currency}</bdi>
                          </td>
                          <td className="px-4 py-4 text-[13px] text-neutral-700">
                            <bdi>{formatQuotationDate(record.quotation.offerEndDate, i18n.language)}</bdi>
                          </td>
                          <td className="px-4 py-4">
                            <ClientQuotationStatusBadge state={getClientQuotationState(record)} />
                          </td>
                          <td className="px-4 py-4">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                openOffer(record)
                              }}
                              className="inline-flex size-8 items-center justify-center rounded-[6px] text-primary transition-colors hover:bg-[#e8edfc]"
                              aria-label={t('clientQuotations.viewOffer')}
                              title={t('clientQuotations.viewOffer')}
                            >
                              <AppIcon icon={EyeIcon} size={20} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">
                {loading && <p className="py-6 text-center text-neutral-500">{t('common.loading', 'Loading...')}</p>}
                {!loading && visible.length === 0 && (
                  <p className="py-6 text-center text-neutral-500">
                    {filtered ? t('clientQuotations.emptySearchTitle') : t('clientQuotations.emptyTitle')}
                  </p>
                )}
                {!loading &&
                  paginated.map((record) => (
                    <button
                      key={record.quotationId}
                      type="button"
                      onClick={() => openOffer(record)}
                      className="w-full rounded-[12px] border border-[#ececec] bg-white p-4 text-start"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-[15px] font-bold text-primary">
                          <bdi>{quotationReference(record)}</bdi>
                        </span>
                        <ClientQuotationStatusBadge state={getClientQuotationState(record)} />
                      </div>
                      <div className="flex items-center justify-between gap-2 border-t border-[#ececec] pt-2 text-[13px]">
                        <span className="text-neutral-500">
                          {t('clientQuotations.table.validUntil')}:{' '}
                          <bdi>{formatQuotationDate(record.quotation.offerEndDate, i18n.language)}</bdi>
                        </span>
                        <span className="font-bold text-neutral-900">
                          <bdi>{money(record)}</bdi>
                        </span>
                      </div>
                    </button>
                  ))}
              </div>

              <TablePagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                previousLabel={t('clientQuotations.previous')}
                nextLabel={t('clientQuotations.next')}
              />
            </>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="rounded-[10px] border-s-4 border-primary bg-[#eef2fd] px-4 py-3 text-[13px] text-neutral-700">
                {t('clientQuotations.pipelineNote')}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {PIPELINE_STATES.map((state) => (
                  <span
                    key={state}
                    className={cn('rounded-[6px] px-3 py-1 text-[13px] font-medium', pipelineChip[state])}
                  >
                    {t(`clientQuotations.state.${state}`)} · <bdi>{visible.filter((r) => getClientQuotationState(r) === state).length}</bdi>
                  </span>
                ))}
                <span className="ms-auto text-[12px] text-neutral-400">
                  {t('clientQuotations.records', { count: visible.length })}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {PIPELINE_STATES.map((state) => {
                  const column = visible.filter((record) => getClientQuotationState(record) === state)
                  return (
                    <div key={state} className="flex min-h-[160px] flex-col gap-3 rounded-[12px] border border-[#ececec] bg-[#fafbfd] p-3">
                      <div className="flex items-center justify-between">
                        <span className={cn('rounded-[6px] px-3 py-1 text-[13px] font-medium', pipelineChip[state])}>
                          {t(`clientQuotations.state.${state}`)}
                        </span>
                        <span className="text-[13px] text-neutral-500"><bdi>{column.length}</bdi></span>
                      </div>
                      {column.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center rounded-[10px] border border-dashed border-[#d7dce5] py-8 text-[13px] text-neutral-400">
                          {t('clientQuotations.pipelineEmpty')}
                        </div>
                      ) : (
                        column.map((record) => (
                          <button
                            key={record.quotationId}
                            type="button"
                            onClick={() => openOffer(record)}
                            className="flex flex-col gap-1 rounded-[10px] border border-[#ececec] bg-white p-3 text-start transition-colors hover:border-[#c7d4f7] hover:bg-[#fafbff]"
                          >
                            <span className="flex items-center gap-2 text-[14px] font-semibold text-primary">
                              <AppIcon icon={DocumentTextOutlineIcon} size={16} />
                              <bdi>{quotationReference(record)}</bdi>
                            </span>
                            <span className="text-[13px] font-medium text-neutral-900"><bdi>{money(record)}</bdi></span>
                            <span className="text-[12px] text-neutral-500">
                              {t('clientQuotations.table.validUntil')}:{' '}
                              <bdi>{formatQuotationDate(record.quotation.offerEndDate, i18n.language)}</bdi>
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
