import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { QuotationStatusBadge } from '@/components/dashboard/cab/QuotationView'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui'
import { listQuotations, type QuotationList, type QuotationStatus } from '@/lib/api/cabQuotationApi'
import { cabApplicationQuotationPath, ROUTES } from '@/lib/routes'

const STATUSES: QuotationStatus[] = ['CREATED', 'ISSUED', 'ACCEPTED', 'REJECTED', 'CANCELLED']

/** Every quotation of this CAB (GET /cab/quotations) with its client decision status. */
export function CabQuotationsPage() {
  const { t, i18n } = useTranslation()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ key: string; list?: QuotationList; failed?: boolean } | null>(null)
  const key = `${status}|${page}|${attempt}`

  useEffect(() => {
    let cancelled = false
    listQuotations({ status: (status || undefined) as QuotationStatus | undefined, page, limit: 10 })
      .then((list) => { if (!cancelled) setResult({ key, list }) })
      .catch(() => { if (!cancelled) setResult({ key, failed: true }) })
    return () => { cancelled = true }
  }, [status, page, key])

  const loading = result?.key !== key
  const list = result?.list
  const money = (value: string, currency: string) =>
    new Intl.NumberFormat(i18n.language, { style: 'currency', currency }).format(Number(value))

  return (
    <CabLayout>
      <CabHeader title={t('cab.quotationFlow.allQuotations')} />
      <main className="flex flex-1 flex-col gap-6 overflow-auto bg-white p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="w-60">
            <SelectField
              id="quotation-status-filter"
              label={t('cab.quotationFlow.filterStatus')}
              value={status || 'ALL'}
              options={[{ value: 'ALL', label: t('cab.quotationFlow.allStatuses') }, ...STATUSES.map((value) => ({ value, label: t(`cab.quotationFlow.status.${value}`) }))]}
              onChange={(value) => { setStatus(value === 'ALL' ? '' : value); setPage(1) }}
            />
          </div>
          <Link className="text-[14px] font-semibold text-primary underline" to={ROUTES.cabApplicationQuotation}>
            + {t('cab.quotationFlow.newQuotation')}
          </Link>
        </div>

        {result?.failed ? (
          <p role="alert" className="text-error-500">{t('cab.quotationEditor.loadError')}</p>
        ) : loading ? (
          <p className="text-neutral-500">{t('common.loading')}</p>
        ) : !list || list.items.length === 0 ? (
          <p className="text-neutral-500">{t('cab.quotationFlow.empty')}</p>
        ) : (
          <div className="overflow-hidden rounded-[16px] border border-[#ececec] bg-white">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-start text-[13px]">
              <thead className="bg-[#1236a3] text-[11px] font-bold uppercase tracking-wide text-white">
                <tr>
                  {['number', 'standards', 'status', 'total', 'offerEnd', 'created'].map((col) => (
                    <th key={col} scope="col" className="px-4 py-3.5 text-start">{t(`cab.quotationFlow.list.${col}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.items.map((item) => (
                  <tr key={item.id} className="border-b border-[#ececec] text-[12px] text-[#000000] last:border-b-0 hover:bg-[#f8faff]">
                    <td className="px-4 py-3.5">
                      <Link className="font-semibold text-primary underline" to={cabApplicationQuotationPath(item.applicationId)}>
                        {item.quotationNumber ?? item.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">{item.standardCodesUsed.join(', ')}</td>
                    <td className="px-4 py-3.5"><QuotationStatusBadge status={item.status} /></td>
                    <td className="px-4 py-3.5 font-semibold">{money(item.totalAmount, item.currency)}</td>
                    <td className="px-4 py-3.5">{item.offerEndDate ? new Date(`${item.offerEndDate.slice(0, 10)}T00:00:00`).toLocaleDateString(i18n.language) : '—'}</td>
                    <td className="px-4 py-3.5">{new Date(item.createdAt).toLocaleDateString(i18n.language)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {list && list.totalPages > 1 && (
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('common.back')}</Button>
            <span className="text-[13px]">{page} / {list.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= list.totalPages} onClick={() => setPage(page + 1)}>{t('common.next')}</Button>
            <Button variant="outline" size="sm" onClick={() => setAttempt(attempt + 1)}>{t('cab.quotationFlow.refresh')}</Button>
          </div>
        )}
      </main>
    </CabLayout>
  )
}
