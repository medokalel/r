import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { ClassificationBadge, OverdueTag } from '@/components/dashboard/ClientFindingBadges'
import { NonconformityStatusBadge } from '@/components/dashboard/cab/NonconformityStatusBadge'
import { TableFilterSelect } from '@/components/dashboard/TableFilterSelect'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { AppIcon, InfoIcon, SearchIcon } from '@/components/icons'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { NONCONFORMITY_STATUSES, type NonconformityItem } from '@/lib/api/cabNonconformitiesApi'
import { listClientFindings } from '@/lib/api/clientFindingsApi'
import {
  EMPTY_FINDING_FILTERS,
  awaitingResponseCount,
  filterClientFindings,
  isAwaitingResponse,
  paginateFindings,
  splitFindingDescription,
  type ClientFindingFilters,
} from '@/lib/clientFindings'
import { clientFindingPath } from '@/lib/routes'
import { cn } from '@/lib/utils'

const thClass = 'p-4 text-center text-[13px] font-medium text-white'

export function ClientFindingsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [items, setItems] = useState<NonconformityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [reload, setReload] = useState(0)
  const [filters, setFilters] = useState<ClientFindingFilters>(EMPTY_FINDING_FILTERS)
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    listClientFindings()
      .then((result) => {
        if (!cancelled) setItems(result)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reload])

  const visible = useMemo(() => filterClientFindings(items, filters), [items, filters])
  const pagination = paginateFindings(visible, page)
  const rows = pagination.items
  const awaiting = awaitingResponseCount(items)
  const isEmpty = !loading && !failed && items.length === 0
  const noMatch = !loading && !failed && items.length > 0 && visible.length === 0

  const updateFilters = (patch: Partial<ClientFindingFilters>) => {
    setPage(1)
    setFilters((current) => ({ ...current, ...patch }))
  }
  const retry = () => {
    setFailed(false)
    setLoading(true)
    setReload((value) => value + 1)
  }
  const open = (item: NonconformityItem) => navigate(clientFindingPath(item.ncId))
  const actionLabel = (item: NonconformityItem) =>
    isAwaitingResponse(item.status) ? t('clientFindings.respond') : t('clientFindings.view')
  const statusLabel = (item: NonconformityItem) => t(`cab.nonconformities.status.${item.status}`)

  return (
    <AppLayout>
      <AccreditationHeader titleKey="clientFindings.pageTitle" />
      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 pb-28 sm:p-5 sm:pb-28 md:pb-5">
        <p className="text-[14px] text-neutral-500">{t('clientFindings.subtitle')}</p>

        {!loading && !failed && awaiting > 0 ? (
          <p
            role="status"
            className="rounded-[10px] border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-[14px] font-medium text-[#a58401]"
          >
            {t('clientFindings.awaiting', { count: awaiting })}
          </p>
        ) : null}

        <section className="flex min-w-0 flex-col gap-5 rounded-[16px] border border-[#ececec] bg-white p-3 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative min-w-0 w-full sm:min-w-[240px] sm:max-w-[360px] sm:flex-1">
              <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400">
                <AppIcon icon={SearchIcon} size={18} />
              </span>
              <input
                type="search"
                value={filters.search}
                onChange={(event) => updateFilters({ search: event.target.value })}
                placeholder={t('clientFindings.searchPlaceholder')}
                aria-label={t('clientFindings.searchPlaceholder')}
                className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white ps-10 pe-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
              />
            </div>
            <TableFilterSelect
              label={t('clientFindings.columns.status')}
              value={filters.status}
              onChange={(value) => updateFilters({ status: value as ClientFindingFilters['status'] })}
              options={[
                { value: 'all', label: t('clientFindings.allStatuses') },
                ...NONCONFORMITY_STATUSES.map((status) => ({
                  value: status,
                  label: t(`cab.nonconformities.status.${status}`),
                })),
              ]}
              className="sm:w-[220px]"
            />
          </div>

          {failed ? (
            <ErrorState
              title={t('clientFindings.loadFailed')}
              retryLabel={t('clientFindings.retry')}
              onRetry={retry}
            />
          ) : isEmpty ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-[#f3f6fd] text-primary">
                <AppIcon icon={InfoIcon} size={28} />
              </span>
              <p className="text-[16px] font-semibold text-neutral-900">{t('clientFindings.emptyTitle')}</p>
              <p className="max-w-md text-[14px] text-neutral-600">{t('clientFindings.emptySubtitle')}</p>
            </div>
          ) : (
            <>
              <div className="hidden min-w-0 overflow-x-auto md:block">
                <table className="w-full min-w-[900px] border-collapse text-center">
                  <thead>
                    <tr className="bg-[#1236a3]">
                      <th className={thClass}>{t('clientFindings.columns.ncId')}</th>
                      <th className={thClass}>{t('clientFindings.columns.requirement')}</th>
                      <th className={thClass}>{t('clientFindings.columns.classification')}</th>
                      <th className={thClass}>{t('clientFindings.columns.raised')}</th>
                      <th className={thClass}>{t('clientFindings.columns.responseDue')}</th>
                      <th className={thClass}>{t('clientFindings.columns.status')}</th>
                      <th className={thClass}>{t('clientFindings.columns.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-[13px] text-neutral-500">
                          {t('common.loading')}
                        </td>
                      </tr>
                    ) : noMatch ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-[13px] text-neutral-500">
                          {t('clientFindings.noMatch')}
                        </td>
                      </tr>
                    ) : (
                      rows.map((item, index) => {
                        const { clause, text } = splitFindingDescription(item.description)
                        return (
                          <tr
                            key={item.id}
                            onClick={() => open(item)}
                            className={cn(
                              'cursor-pointer transition-colors hover:bg-[#f3f6fd]',
                              index % 2 === 1 && 'bg-[#eef1f6]',
                            )}
                          >
                            <td className="px-4 py-4">
                              <p className="whitespace-nowrap text-[14px] font-semibold text-primary" dir="ltr">
                                {item.ncId}
                              </p>
                              <p className="whitespace-nowrap text-[12px] text-neutral-500" dir="ltr">
                                {item.auditId}
                              </p>
                            </td>
                            <td className="max-w-[360px] px-4 py-4 text-start">
                              {clause ? <p className="text-[13px] font-medium text-neutral-900">{clause}</p> : null}
                              <p className="line-clamp-2 text-[13px] text-neutral-700">{text}</p>
                            </td>
                            <td className="px-4 py-4">
                              <ClassificationBadge classification={item.classification} />
                            </td>
                            <td className="px-4 py-4 text-[13px] text-neutral-800">
                              <bdi>{item.raisedDate}</bdi>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col items-center gap-1">
                                <span
                                  className={cn(
                                    'text-[13px]',
                                    item.overdue ? 'font-medium text-[#dc2626]' : 'text-neutral-800',
                                  )}
                                >
                                  <bdi>{item.dueDate}</bdi>
                                </span>
                                {item.overdue ? <OverdueTag /> : null}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <NonconformityStatusBadge status={item.status} label={statusLabel(item)} />
                            </td>
                            <td className="px-4 py-4" onClick={(event) => event.stopPropagation()}>
                              <Button
                                variant={isAwaitingResponse(item.status) ? 'primary' : 'outline'}
                                onClick={() => open(item)}
                                className="h-9 px-4 text-[12px]"
                              >
                                {actionLabel(item)}
                              </Button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 md:hidden">
                {loading ? (
                  <p className="py-6 text-center text-[13px] text-neutral-500">{t('common.loading')}</p>
                ) : noMatch ? (
                  <p className="py-6 text-center text-[13px] text-neutral-500">{t('clientFindings.noMatch')}</p>
                ) : (
                  rows.map((item) => {
                    const { clause, text } = splitFindingDescription(item.description)
                    return (
                      <div
                        key={item.id}
                        role="link"
                        tabIndex={0}
                        onClick={() => open(item)}
                        onKeyDown={(event) => event.key === 'Enter' && open(item)}
                        className="cursor-pointer rounded-[12px] border border-[#ececec] bg-white p-4"
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="text-[14px] font-bold text-primary" dir="ltr">
                            {item.ncId}
                          </span>
                          <NonconformityStatusBadge status={item.status} label={statusLabel(item)} />
                        </div>
                        {clause ? <p className="text-[13px] font-semibold text-neutral-900">{clause}</p> : null}
                        <p className="line-clamp-2 text-[13px] text-neutral-700">{text}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <ClassificationBadge classification={item.classification} />
                          {item.overdue ? <OverdueTag /> : null}
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#ececec] pt-2 text-[13px]">
                          <div>
                            <p className="text-neutral-500">{t('clientFindings.columns.raised')}</p>
                            <p className="font-medium text-neutral-900">
                              <bdi>{item.raisedDate}</bdi>
                            </p>
                          </div>
                          <div>
                            <p className="text-neutral-500">{t('clientFindings.columns.responseDue')}</p>
                            <p className={cn('font-medium', item.overdue ? 'text-[#dc2626]' : 'text-neutral-900')}>
                              <bdi>{item.dueDate}</bdi>
                            </p>
                          </div>
                        </div>
                        <span className="mt-3 block text-[13px] font-semibold text-primary">{actionLabel(item)}</span>
                      </div>
                    )
                  })
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
            </>
          )}
        </section>
      </div>
    </AppLayout>
  )
}
