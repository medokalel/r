import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { AppIcon, CertificateBadgeIcon, SearchIcon } from '@/components/icons'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { listClientCertificates } from '@/lib/api/clientCertificatesApi'
import {
  CLIENT_CERTIFICATE_STATUS_STYLES,
  certificateMatchesSearch,
  clientCertificateStatusLabelKey,
  formatCertificateDate,
  paginateCertificates,
  splitStandards,
  type ClientCertificateItem,
  type ClientCertificateStatus,
} from '@/lib/clientCertificates'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

const thClass = 'p-4 text-center text-[13px] font-medium text-white'

function CertificateStatusBadge({ status }: { status: ClientCertificateStatus }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-[4px] px-3 py-1 text-[12px] font-medium',
        CLIENT_CERTIFICATE_STATUS_STYLES[status],
      )}
    >
      {t(clientCertificateStatusLabelKey(status))}
    </span>
  )
}

function StandardChips({ standards, className }: { standards: string; className?: string }) {
  const chips = splitStandards(standards)
  if (!chips.length) return <span className="text-[13px] text-neutral-500">—</span>
  return (
    <span className={cn('inline-flex min-w-0 max-w-full flex-wrap items-center gap-1.5 align-middle', className)}>
      {chips.map((chip) => (
        <span
          key={chip}
          dir="ltr"
          title={chip}
          className="inline-flex max-w-full items-center whitespace-nowrap rounded-[6px] border border-[#c7d5f5] bg-[#f3f6fd] px-2 py-0.5 text-[12px] font-medium leading-[1.6] text-neutral-900"
        >
          <span className="truncate">{chip}</span>
        </span>
      ))}
    </span>
  )
}

export function ClientCertificatesPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [items, setItems] = useState<ClientCertificateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [reload, setReload] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    listClientCertificates()
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

  const statusLabel = (item: ClientCertificateItem) => t(clientCertificateStatusLabelKey(item.status))
  const visible = useMemo(
    () => items.filter((item) => certificateMatchesSearch(item, search, statusLabel(item))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, search, i18n.language],
  )
  const pagination = paginateCertificates(visible, page)
  const rows = pagination.items
  const isEmpty = !loading && !failed && items.length === 0
  const noMatch = !loading && !failed && items.length > 0 && visible.length === 0

  const updateSearch = (value: string) => {
    setPage(1)
    setSearch(value)
  }
  const retry = () => {
    setFailed(false)
    setLoading(true)
    setReload((value) => value + 1)
  }
  const formatDate = (value: string | null | undefined) => formatCertificateDate(value, i18n.language)

  return (
    <AppLayout>
      <AccreditationHeader titleKey="clientCertificates.pageTitle" />
      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 pb-28 sm:p-5 sm:pb-28 md:pb-5">
        <p className="text-[14px] text-neutral-500">{t('clientCertificates.subtitle')}</p>

        <section className="flex min-w-0 flex-col gap-5 rounded-[16px] border border-[#ececec] bg-white p-3 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="relative min-w-0 w-full sm:min-w-[240px] sm:max-w-[360px] sm:flex-1">
              <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400">
                <AppIcon icon={SearchIcon} size={18} />
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder={t('clientCertificates.searchPlaceholder')}
                aria-label={t('clientCertificates.searchPlaceholder')}
                className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white ps-10 pe-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
              />
            </div>
            {!loading && !failed ? (
              <p className="text-[14px] text-neutral-600">
                {t('clientCertificates.resultCount', { count: visible.length })}
              </p>
            ) : null}
          </div>

          {failed ? (
            <ErrorState
              title={t('clientCertificates.loadFailed')}
              retryLabel={t('clientCertificates.retry')}
              onRetry={retry}
            />
          ) : isEmpty ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-[#f3f6fd] text-primary">
                <AppIcon icon={CertificateBadgeIcon} size={28} />
              </span>
              <p className="text-[16px] font-semibold text-neutral-900">{t('clientCertificates.emptyTitle')}</p>
              <p className="max-w-md text-[14px] text-neutral-600">{t('clientCertificates.emptySubtitle')}</p>
              <Button
                variant="outline"
                className="mt-1 min-w-[160px]"
                onClick={() => navigate(ROUTES.certificationRequests)}
              >
                {t('clientCertificates.viewApplications')}
              </Button>
            </div>
          ) : (
            <>
              <div className="hidden min-w-0 overflow-x-auto md:block">
                <table className="w-full min-w-[820px] border-collapse text-center">
                  <thead>
                    <tr className="bg-[#1236a3]">
                      <th className={thClass}>{t('cab.certificateRegister.table.number')}</th>
                      <th className={thClass}>{t('cab.certificateRegister.table.standard')}</th>
                      <th className={thClass}>{t('cab.certificateRegister.table.scope')}</th>
                      <th className={thClass}>{t('clientCertificates.issueDate')}</th>
                      <th className={thClass}>{t('clientCertificates.expiryDate')}</th>
                      <th className={thClass}>{t('cab.certificateRegister.table.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-[13px] text-neutral-500">
                          {t('common.loading')}
                        </td>
                      </tr>
                    ) : noMatch ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-[13px] text-neutral-500">
                          {t('clientCertificates.noMatch')}
                        </td>
                      </tr>
                    ) : (
                      rows.map((item, index) => (
                        <tr key={item.id} className={cn(index % 2 === 1 && 'bg-[#eef1f6]')}>
                          <td className="whitespace-nowrap px-4 py-4 text-[14px] font-semibold text-primary" dir="ltr">
                            {item.certificateNumber}
                          </td>
                          <td className="min-w-[140px] px-4 py-4">
                            <StandardChips standards={item.standard} className="justify-center" />
                          </td>
                          <td className="max-w-[320px] px-4 py-4 text-start text-[13px] text-neutral-700">
                            {item.scope}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-[13px] text-neutral-800">
                            <bdi>{formatDate(item.issuedAt)}</bdi>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-[13px] text-neutral-800">
                            <bdi>{formatDate(item.validUntil)}</bdi>
                          </td>
                          <td className="px-4 py-4">
                            <CertificateStatusBadge status={item.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 md:hidden">
                {loading ? (
                  <p className="py-6 text-center text-[13px] text-neutral-500">{t('common.loading')}</p>
                ) : noMatch ? (
                  <p className="py-6 text-center text-[13px] text-neutral-500">{t('clientCertificates.noMatch')}</p>
                ) : (
                  rows.map((item) => (
                    <div
                      key={item.id}
                      className="w-full rounded-[12px] border border-[#ececec] bg-white p-4 text-start"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-[14px] font-bold text-primary" dir="ltr">
                          {item.certificateNumber}
                        </span>
                        <CertificateStatusBadge status={item.status} />
                      </div>
                      <StandardChips standards={item.standard} />
                      <p className="mt-1 text-[13px] text-neutral-600">{item.scope}</p>
                      <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#ececec] pt-2 text-[13px]">
                        <div>
                          <p className="text-neutral-500">{t('clientCertificates.issueDate')}</p>
                          <p className="font-medium text-neutral-900">
                            <bdi>{formatDate(item.issuedAt)}</bdi>
                          </p>
                        </div>
                        <div>
                          <p className="text-neutral-500">{t('clientCertificates.expiryDate')}</p>
                          <p className="font-medium text-neutral-900">
                            <bdi>{formatDate(item.validUntil)}</bdi>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
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
