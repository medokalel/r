import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import { ClientQuotationStatusBadge } from '@/components/dashboard/ClientQuotationStatusBadge'
import { AppIcon, DocumentTextOutlineIcon, SearchOutlineIcon } from '@/components/icons'
import { AppLayout } from '@/components/layout/AppLayout'
import {
  getClientQuotationState,
  listClientQuotations,
  quotationReference,
  type ClientQuotationRecord,
  type ClientQuotationState,
} from '@/lib/api/clientQuotationsApi'
import { formatQuotationDate, formatQuotationMoney } from '@/lib/clientQuotationFormat'
import { clientQuotationPath } from '@/lib/routes'
import { cn } from '@/lib/utils'

type StateFilter = 'all' | ClientQuotationState
const FILTERS: StateFilter[] = ['all', 'pending', 'accepted', 'rejected', 'expired']

function QuotationCard({ record, onOpen }: { record: ClientQuotationRecord; onOpen: () => void }) {
  const { t, i18n } = useTranslation()
  const { quotation } = record
  const state = getClientQuotationState(record)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col gap-4 rounded-[16px] border border-[#ececec] bg-white p-5 text-start transition-colors hover:border-[#c7d4f7] hover:bg-[#fafbff]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-[10px] bg-[#e8edfc] text-primary">
            <AppIcon icon={DocumentTextOutlineIcon} size={22} />
          </span>
          <span className="text-[16px] font-semibold text-neutral-900">
            <bdi>{quotationReference(record)}</bdi>
          </span>
          {quotation.standardCodesUsed.map((standard) => (
            <span
              key={standard}
              className="rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-0.5 text-[12px] font-medium text-neutral-600"
            >
              {standard.replaceAll('_', ' ')}
            </span>
          ))}
        </div>
        <ClientQuotationStatusBadge state={state} />
      </div>

      <dl className="grid grid-cols-1 gap-3 text-[13px] sm:grid-cols-3">
        <div>
          <dt className="text-neutral-500">{t('clientQuotations.fields.request')}</dt>
          <dd className="mt-0.5 font-medium text-neutral-900">
            <bdi>{record.applicationNumber}</bdi>
          </dd>
        </div>
        <div>
          <dt className="text-neutral-500">{t('clientQuotations.fields.validUntil')}</dt>
          <dd className="mt-0.5 font-medium text-neutral-900">
            <bdi>{formatQuotationDate(quotation.offerEndDate, i18n.language)}</bdi>
          </dd>
        </div>
        <div>
          <dt className="text-neutral-500">{t('clientQuotations.fields.total')}</dt>
          <dd className="mt-0.5 font-medium text-neutral-900">
            <bdi>{formatQuotationMoney(quotation.totalAmount, quotation.currency, i18n.language)}</bdi>
          </dd>
        </div>
      </dl>
    </button>
  )
}

export function ClientQuotationsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [records, setRecords] = useState<ClientQuotationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<StateFilter>('all')

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

  const counts = useMemo(() => {
    const result: Record<StateFilter, number> = { all: records.length, pending: 0, accepted: 0, rejected: 0, expired: 0 }
    for (const record of records) result[getClientQuotationState(record)] += 1
    return result
  }, [records])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return records.filter((record) => {
      if (filter !== 'all' && getClientQuotationState(record) !== filter) return false
      if (!q) return true
      return (
        quotationReference(record).toLowerCase().includes(q) ||
        record.applicationNumber.toLowerCase().includes(q) ||
        record.quotation.standardCodesUsed.some((standard) => standard.toLowerCase().replaceAll('_', ' ').includes(q))
      )
    })
  }, [records, search, filter])

  const filtered = Boolean(search.trim()) || filter !== 'all'

  return (
    <AppLayout>
      <AccreditationHeader titleKey="clientQuotations.pageTitle" />
      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 pb-28 sm:p-5 sm:pb-28 md:pb-5">
        <div className="flex flex-col gap-3">
          <div className="relative max-w-md">
            <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400">
              <AppIcon icon={SearchOutlineIcon} size={18} />
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('clientQuotations.searchPlaceholder')}
              aria-label={t('clientQuotations.searchPlaceholder')}
              className="h-11 w-full rounded-[10px] border border-[#e5e7eb] bg-white ps-10 pe-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('clientQuotations.filterLabel')}>
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                aria-pressed={filter === item}
                className={cn(
                  'h-9 rounded-full border px-4 text-[13px] font-medium transition-colors',
                  filter === item
                    ? 'border-primary bg-primary text-white'
                    : 'border-[#d7dce5] bg-white text-neutral-700 hover:border-[#c7d4f7] hover:bg-[#fafbff]',
                )}
              >
                {t(`clientQuotations.filters.${item}`)} <bdi>({counts[item]})</bdi>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[0, 1].map((key) => (
              <div key={key} className="h-[132px] animate-pulse rounded-[16px] border border-[#ececec] bg-white" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[16px] border border-dashed border-[#d7dce5] bg-white px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-[#eef2fd] text-primary">
              <AppIcon icon={DocumentTextOutlineIcon} size={26} />
            </span>
            <p className="text-[16px] font-semibold text-neutral-900">
              {filtered ? t('clientQuotations.emptySearchTitle') : t('clientQuotations.emptyTitle')}
            </p>
            <p className="max-w-md text-[13px] text-neutral-500">
              {filtered ? t('clientQuotations.emptySearchSubtitle') : t('clientQuotations.emptySubtitle')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {visible.map((record) => (
              <QuotationCard
                key={record.quotationId}
                record={record}
                onOpen={() => navigate(clientQuotationPath(record.quotationId))}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
