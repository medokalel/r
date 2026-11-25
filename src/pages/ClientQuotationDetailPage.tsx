import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { AccreditationHeader } from '@/components/dashboard/AccreditationHeader'
import {
  ClientQuotationDecisionDialog,
  type ClientQuotationDecisionMode,
} from '@/components/dashboard/ClientQuotationDecisionDialog'
import { ClientQuotationStatusBadge } from '@/components/dashboard/ClientQuotationStatusBadge'
import { AppIcon, DocumentTextOutlineIcon } from '@/components/icons'
import { AppLayout } from '@/components/layout/AppLayout'
import {
  acceptClientQuotation,
  getClientQuotation,
  getClientQuotationState,
  quotationReference,
  rejectClientQuotation,
  type ClientQuotationRecord,
} from '@/lib/api/clientQuotationsApi'
import { formatQuotationDate, formatQuotationMoney } from '@/lib/clientQuotationFormat'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[12px] text-neutral-500">{label}</dt>
      <dd dir="auto" className="mt-0.5 text-start text-[14px] font-medium text-neutral-900">{value}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-[16px] border border-[#ececec] bg-white p-5">
      <h2 className="text-[16px] font-semibold text-neutral-900">{title}</h2>
      {children}
    </section>
  )
}

export function ClientQuotationDetailPage() {
  const { t, i18n } = useTranslation()
  const { quotationId } = useParams<{ quotationId: string }>()
  const [record, setRecord] = useState<ClientQuotationRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [decisionMode, setDecisionMode] = useState<ClientQuotationDecisionMode | null>(null)

  useEffect(() => {
    let cancelled = false
    getClientQuotation(quotationId ?? '')
      .then((result) => {
        if (!cancelled) setRecord(result)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [quotationId])

  const state = record ? getClientQuotationState(record) : null
  const quotation = record?.quotation
  const money = (value: string | number) =>
    formatQuotationMoney(value, quotation?.currency ?? 'USD', i18n.language)
  const date = (value: string | null | undefined) => formatQuotationDate(value, i18n.language)

  const applyDecision = (updated: ClientQuotationRecord | null) => {
    if (updated) setRecord(updated)
    setDecisionMode(null)
  }

  return (
    <AppLayout>
      <AccreditationHeader titleKey="clientQuotations.detail.pageTitle" />
      <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto p-3 pb-28 sm:p-5 sm:pb-28 md:pb-5">
        <Link
          to={ROUTES.quotations}
          className="self-start text-[14px] font-medium text-primary hover:underline"
        >
          {t('clientQuotations.detail.backToList')}
        </Link>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[0, 1, 2].map((key) => (
              <div key={key} className="h-[160px] animate-pulse rounded-[16px] border border-[#ececec] bg-white" />
            ))}
          </div>
        ) : !record || !quotation || !state ? (
          <div className="flex flex-col items-center gap-2 rounded-[16px] border border-dashed border-[#d7dce5] bg-white px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-[#eef2fd] text-primary">
              <AppIcon icon={DocumentTextOutlineIcon} size={26} />
            </span>
            <p className="text-[16px] font-semibold text-neutral-900">
              {t('clientQuotations.detail.notFoundTitle')}
            </p>
            <p className="max-w-md text-[13px] text-neutral-500">
              {t('clientQuotations.detail.notFoundSubtitle')}
            </p>
          </div>
        ) : (
          <>
            <div
              className={cn(
                'rounded-[12px] border px-4 py-3 text-[13px] font-medium',
                state === 'accepted' && 'border-[#bbe5c8] bg-[#e7f6ec] text-[#1e7e34]',
                state === 'rejected' && 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]',
                state === 'pending' && 'border-[#fde68a] bg-[#fffbeb] text-[#92400e]',
                state === 'expired' && 'border-[#e5e7eb] bg-[#f3f4f6] text-[#4b5563]',
              )}
            >
              {t(`clientQuotations.detail.banner.${state}`)}
              {state === 'rejected' && record.decision?.reason && (
                <span dir="auto" className="mt-1 block text-start text-[12px] font-normal">
                  {t('clientQuotations.detail.rejectionReason')}: {record.decision.reason}
                </span>
              )}
              {record.decision && (
                <span className="mt-1 block text-[12px] font-normal">
                  {t('clientQuotations.detail.decidedOn')}:{' '}
                  <bdi>{date(record.decision.at)}</bdi>
                </span>
              )}
            </div>

            {state === 'pending' && (
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setDecisionMode('accept')}
                  className="h-10 rounded-[8px] bg-primary px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#0f2d8a]"
                >
                  {t('clientQuotations.detail.acceptButton')}
                </button>
                <button
                  type="button"
                  onClick={() => setDecisionMode('reject')}
                  className="h-10 rounded-[8px] border border-[#e2e2e2] bg-white px-5 text-[13px] font-semibold text-[#b91c1c] transition-colors hover:bg-[#fef2f2]"
                >
                  {t('clientQuotations.detail.rejectButton')}
                </button>
              </div>
            )}

            <Section title={t('clientQuotations.detail.sections.summary')}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[18px] font-bold text-neutral-900">
                  <bdi>{quotationReference(record)}</bdi>
                </span>
                <ClientQuotationStatusBadge state={state} />
              </div>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Fact label={t('clientQuotations.fields.request')} value={<bdi>{record.applicationNumber}</bdi>} />
                {quotation.cabName && (
                  <Fact label={t('clientQuotations.fields.certificationBody')} value={quotation.cabName} />
                )}
                <Fact
                  label={t('clientQuotations.fields.standards')}
                  value={quotation.standardCodesUsed.map((code) => code.replaceAll('_', ' ')).join(', ')}
                />
                <Fact label={t('clientQuotations.fields.issuedOn')} value={<bdi>{date(record.publishedAt)}</bdi>} />
                <Fact label={t('clientQuotations.fields.startDate')} value={<bdi>{date(quotation.startDate)}</bdi>} />
                <Fact label={t('clientQuotations.fields.validUntil')} value={<bdi>{date(quotation.offerEndDate)}</bdi>} />
              </dl>
              {quotation.isProvisional && (
                <p role="alert" className="rounded-[8px] bg-[#fff7e6] p-3 text-[13px] text-[#92400e]">
                  {quotation.provisionalDisclaimer ?? t('clientQuotations.detail.provisional')}
                </p>
              )}
            </Section>

            {quotation.events.length > 0 && (
              <Section title={t('clientQuotations.detail.sections.programme')}>
                <ul className="flex flex-col gap-3 sm:hidden">
                  {[...quotation.events]
                    .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                    .map((event) => (
                      <li key={event.id} className="rounded-[12px] border border-[#ececec] p-3 text-[13px]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-neutral-900"><bdi>{event.standardCode.replaceAll('_', ' ')}</bdi></span>
                          <span className="text-neutral-600">{t(`cab.quotationFlow.event.${event.auditEventType}`)}</span>
                        </div>
                        <dl className="mt-2 grid grid-cols-3 gap-2">
                          <div>
                            <dt className="text-[11px] text-neutral-500">{t('clientQuotations.detail.programme.days')}</dt>
                            <dd className="font-medium"><bdi>{Number(event.auditDays)}</bdi></dd>
                          </div>
                          <div>
                            <dt className="text-[11px] text-neutral-500">{t('clientQuotations.detail.programme.dailyRate')}</dt>
                            <dd className="font-medium"><bdi>{money(event.dailyRate)}</bdi></dd>
                          </div>
                          <div>
                            <dt className="text-[11px] text-neutral-500">{t('clientQuotations.detail.programme.fee')}</dt>
                            <dd className="font-semibold"><bdi>{money(event.auditFee)}</bdi></dd>
                          </div>
                        </dl>
                      </li>
                    ))}
                </ul>
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full min-w-[480px] border-collapse text-start text-[13px]">
                    <thead className="bg-[#f3f6fd] text-neutral-600">
                      <tr>
                        {['standard', 'stage', 'days', 'dailyRate', 'fee'].map((column) => (
                          <th key={column} scope="col" className="px-2 py-2.5 sm:px-3 text-start font-medium">
                            {t(`clientQuotations.detail.programme.${column}`)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...quotation.events]
                        .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                        .map((event) => (
                          <tr key={event.id} className="border-b border-[#ececec] last:border-b-0">
                            <td className="px-2 py-2.5 sm:px-3"><bdi>{event.standardCode.replaceAll('_', ' ')}</bdi></td>
                            <td className="px-2 py-2.5 sm:px-3">{t(`cab.quotationFlow.event.${event.auditEventType}`)}</td>
                            <td className="px-2 py-2.5 sm:px-3"><bdi>{Number(event.auditDays)}</bdi></td>
                            <td className="px-2 py-2.5 sm:px-3"><bdi>{money(event.dailyRate)}</bdi></td>
                            <td className="px-2 py-2.5 sm:px-3 font-medium"><bdi>{money(event.auditFee)}</bdi></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}

            <Section title={t('clientQuotations.detail.sections.costs')}>
              <dl className="flex flex-col gap-3 text-[14px]">
                <div className="flex justify-between gap-3">
                  <dt>
                    {t('cab.quotationEditor.auditFee')} (<bdi>{Number(quotation.totalAuditDays)}</bdi>{' '}
                    {t('cab.quotationEditor.auditDays')})
                  </dt>
                  <dd className="font-semibold"><bdi>{money(quotation.totalAuditFee)}</bdi></dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>{t('cab.quotationEditor.travelExpenses')}</dt>
                  <dd className="font-semibold"><bdi>{money(quotation.travelExpenses)}</bdi></dd>
                </div>
                {quotation.additionalItems.map((item, index) => (
                  <div key={index} className="flex justify-between gap-3">
                    <dt dir="auto">{item.name}</dt>
                    <dd className="font-semibold"><bdi>{money(item.cost)}</bdi></dd>
                  </div>
                ))}
                <div className="flex justify-between gap-3">
                  <dt>
                    {t('cab.quotationEditor.taxes')} (<bdi>{Math.round(Number(quotation.taxRate) * 10000) / 100}%</bdi>)
                  </dt>
                  <dd className="font-semibold"><bdi>{money(quotation.taxAmount)}</bdi></dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-[#ececec] pt-3 text-[18px] font-bold text-primary">
                  <dt>{t('cab.quotationEditor.total')}</dt>
                  <dd><bdi>{money(quotation.totalAmount)}</bdi></dd>
                </div>
              </dl>
            </Section>
          </>
        )}
      </div>

      {record && decisionMode && (
        <ClientQuotationDecisionDialog
          mode={decisionMode}
          quotationNumber={quotationReference(record)}
          onClose={() => setDecisionMode(null)}
          onAccept={async () => applyDecision(await acceptClientQuotation(record.quotationId))}
          onReject={async (reason) =>
            applyDecision(await rejectClientQuotation(record.quotationId, reason))
          }
        />
      )}
    </AppLayout>
  )
}
