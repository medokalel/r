import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { FormField, TextField, Textarea } from '@/components/ui'
import { DatePicker } from '@/components/ui/DatePicker'
import { toIsoDate } from '@/components/dashboard/companyProfile/mappers'
import { ApiError } from '@/lib/api/client'
import {
  getQuotation,
  overrideEventDays,
  transitionQuotation,
  updateQuotation,
  type Quotation,
  type QuotationStatus,
  type QuotationTransition,
} from '@/lib/api/cabQuotationApi'
import { cn } from '@/lib/utils'

const card = 'rounded-[10px] border border-[#ececec] bg-white p-5'

const STATUS_STYLE: Record<QuotationStatus, string> = {
  CREATED: 'bg-[#e8edfc] text-primary',
  DRAFT: 'bg-[#f3f4f6] text-neutral-600',
  ISSUED: 'bg-[#fff7e6] text-[#92400e]',
  ACCEPTED: 'bg-[#eafaf1] text-[#16a34a]',
  REJECTED: 'bg-[#fde8e8] text-[#e74c3c]',
  CANCELLED: 'bg-[#f3f4f6] text-neutral-500',
}

const asDate = (iso: string | null) => (iso ? new Date(`${iso.slice(0, 10)}T00:00:00`) : undefined)

export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  const { t } = useTranslation()
  return (
    <span className={cn('rounded px-2 py-1 text-[11px] font-semibold', STATUS_STYLE[status])}>
      {t(`cab.quotationFlow.status.${status}`)}
    </span>
  )
}

export function QuotationView({ quotation, onChange }: { quotation: Quotation; onChange: (next: Quotation) => void }) {
  const { t, i18n } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [days, setDays] = useState<Record<string, string>>({})
  const [travel, setTravel] = useState(String(Number(quotation.travelExpenses)))
  const [items, setItems] = useState<Array<{ key: string; name: string; cost: string }>>(
    quotation.additionalItems.map((item) => ({ key: crypto.randomUUID(), name: item.name, cost: String(item.cost) })),
  )
  const [offerEnd, setOfferEnd] = useState(quotation.offerEndDate?.slice(0, 10) ?? '')
  const [notes, setNotes] = useState('')

  const editable = quotation.status === 'CREATED'
  const money = (value: string | number) =>
    new Intl.NumberFormat(i18n.language, { style: 'currency', currency: quotation.currency, currencyDisplay: 'code' }).format(Number(value))
  const date = (value: string | null) =>
    value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString(i18n.language) : '—'

  const run = async (action: () => Promise<Quotation>) => {
    setBusy(true)
    setError(null)
    try {
      onChange(await action())
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : t('errors.generic'))
    } finally {
      setBusy(false)
    }
  }

  const itemsValid = items.every((item) => item.name.trim() && Number(item.cost) >= 0 && item.cost.trim() !== '')
  const travelValid = travel.trim() !== '' && Number(travel) >= 0
  const save = () =>
    run(() =>
      updateQuotation(quotation.id, {
        travelExpenses: Number(travel),
        additionalItems: items.map((item) => ({ name: item.name.trim(), cost: Number(item.cost) })),
        offerEndDate: offerEnd || null,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      }),
    )

  const commitDays = (eventId: string, current: string) => {
    const value = days[eventId]
    if (value === undefined || value.trim() === '' || Number(value) === Number(current) || Number(value) < 0) return
    void run(() => overrideEventDays(quotation.id, eventId, Number(value)))
  }

  const transition = (action: QuotationTransition) => {
    if (action !== 'issue' && !window.confirm(t(`cab.quotationFlow.confirm.${action}`))) return
    void run(() => transitionQuotation(quotation.id, action, note))
    setNote('')
  }

  const actions: QuotationTransition[] =
    quotation.status === 'CREATED' ? ['issue', 'cancel'] : quotation.status === 'ISSUED' ? ['cancel'] : []

  return (
    <div className="space-y-5">
      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-bold text-primary">
              {t('cab.quotationFlow.quotationNo')} {quotation.quotationNumber ?? quotation.id.slice(0, 8).toUpperCase()}
            </h2>
            <p className="mt-1 text-[13px] text-neutral-500">
              {t('cab.quotationFlow.startDate')}: {date(quotation.startDate)} · {t('cab.quotationFlow.offerEnd')}: {date(quotation.offerEndDate)} ·{' '}
              {quotation.standardCodesUsed.join(', ')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" disabled={busy} onClick={() => void run(() => getQuotation(quotation.id))} className="text-[12px] font-semibold text-primary hover:underline">
              {t('cab.quotationFlow.refresh')}
            </button>
            <QuotationStatusBadge status={quotation.status} />
          </div>
        </div>
        {quotation.isProvisional && (
          <p role="alert" className="mt-4 rounded-[8px] bg-[#fff7e6] p-3 text-[13px] text-[#92400e]">
            {quotation.provisionalDisclaimer ?? t('cab.quotationFlow.provisional')}
          </p>
        )}
      </section>

      <section className="overflow-hidden rounded-[16px] border border-[#ececec] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ececec] px-5 py-4">
          <h2 className="text-[16px] font-bold leading-5 text-primary">{t('cab.quotationFlow.programme', 'Audit programme by standard (3-year certification cycle)')}</h2>
          <span className="text-[12px] font-normal text-neutral-600">{quotation.standardCodesUsed.length} {t('cab.quotationFlow.standardCount', { count: quotation.standardCodesUsed.length, defaultValue: quotation.standardCodesUsed.length === 1 ? 'standard' : 'standards' })} · {Number(quotation.totalAuditDays)} {t('cab.quotationFlow.dayUnit', 'days')} · {money(quotation.totalAuditFee)}</span>
        </div>
        <div className="space-y-5 p-5">
          {quotation.standardCodesUsed.map((code) => {
            const events = quotation.events.filter((event) => event.standardCode === code)
            const breakdown = quotation.standardBreakdown?.find((row) => row.standardCode === code)
            const initial = events.filter((event) => ['STAGE_1', 'STAGE_2'].includes(event.auditEventType))
            const initialFee = breakdown?.initialAuditFee ?? (quotation.standardCodesUsed.length === 1 ? quotation.initialAuditFee : null)
            const phases = [
              { title: t('cab.quotationFlow.initialCertification', 'Initial certification'), hint: t('cab.quotationFlow.initialHint', 'Stage 1 + Stage 2, before the certificate'), events: initial },
              { title: t('cab.quotationFlow.event.SURVEILLANCE_1'), hint: t('cab.quotationFlow.surveillance1Hint', 'Year 1, within 12 months of the decision'), events: events.filter((event) => event.auditEventType === 'SURVEILLANCE_1') },
              { title: t('cab.quotationFlow.event.SURVEILLANCE_2'), hint: t('cab.quotationFlow.surveillance2Hint', 'Year 2'), events: events.filter((event) => event.auditEventType === 'SURVEILLANCE_2') },
              { title: t('cab.quotationFlow.event.RECERTIFICATION'), hint: t('cab.quotationFlow.recertificationHint', 'Year 3, before the certificate expires'), events: events.filter((event) => event.auditEventType === 'RECERTIFICATION') },
            ]
            return (
              <div key={code} className="overflow-hidden rounded-[16px] border border-[#cbd5ff]">
                <div className="flex min-h-[48px] flex-wrap items-center justify-between gap-3 bg-[#1636aa] px-4 py-2 text-[14px] leading-5 text-white">
                  <h3 className="rounded-[8px] border border-[#cbd5ff] bg-[#f5f7ff] px-2.5 py-1 text-[12px] font-medium leading-4 text-black">{code.replaceAll('_', ' ')}</h3>
                  {breakdown && <span>{Number(breakdown.totalAuditDays)} {t('cab.quotationFlow.dayUnit', 'days')} · <strong>{money(breakdown.totalAuditFee)}</strong></span>}
                </div>
                <div className="grid grid-cols-1 divide-y divide-[#ececec] md:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-y-0">
                  {phases.map((phase, index) => (
                    <div key={phase.title} className="flex min-w-0 flex-col px-4 py-4 text-[14px] leading-5">
                      {phase.events.length > 0 && <>
                      <div className="mb-3 flex items-start gap-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e8edfc] font-bold text-primary">{index + 1}</span>
                        <div><h4 className="text-[14px] font-semibold leading-5">{phase.title}</h4><p className="text-[12px] font-normal leading-4 text-neutral-600">{phase.hint}</p></div>
                      </div>
                      <div className="mb-3 flex-1 space-y-2">
                        {phase.events.map((event) => {
                          const included = Number(quotation.initialAuditDays) > 0 && index === 0 && Number(event.auditFee) === 0
                          return (
                            <div key={event.id}>
                              <div className="flex items-center justify-between gap-2">
                                <span className="whitespace-nowrap text-neutral-600">{index === 0 ? t(`cab.quotationFlow.event.${event.auditEventType}`) : t('cab.quotationEditor.auditDays')}</span>
                                <span className="flex shrink-0 items-center gap-2">
                                  {editable && !included ? <input type="number" min="0" step="0.5" disabled={busy} aria-label={`${code} ${phase.title} ${t('cab.quotationFlow.dayUnit', 'days')}`} className="h-6 w-12 rounded border border-transparent bg-transparent px-1 text-end font-semibold hover:border-neutral-200 focus:border-primary focus:outline-none" value={days[event.id] ?? String(Number(event.auditDays))} onChange={(e) => setDays((prev) => ({ ...prev, [event.id]: e.target.value }))} onBlur={() => commitDays(event.id, event.auditDays)} /> : <strong>{Number(event.auditDays)}</strong>}
                                  <span className="text-neutral-500">{t('cab.quotationFlow.dayUnit', 'days')}</span>
                                </span>
                              </div>
                              {!included && event.policyVerificationStatus !== 'VERIFIED' && <p className="text-[10px] text-[#92400e]">{event.policyVerificationStatus}</p>}
                              {event.manualOverride && <p className="text-[12px] font-normal leading-4 text-neutral-600">{t('cab.quotationFlow.overridden')}</p>}
                            </div>
                          )
                        })}
                      </div>
                      <div className="border-t border-dashed border-[#ececec] pt-2">
                        <p className="text-[16px] font-bold leading-6">{phase.events.length ? money(index === 0 && initialFee != null ? initialFee : phase.events.reduce((sum, event) => sum + Number(event.auditFee), 0)) : '—'}</p>
                        {phase.events.length > 0 && <p className="text-[12px] font-normal leading-4 text-neutral-600">{money(phase.events[0].dailyRate)} / {t('cab.quotationFlow.singleDay', 'day')}</p>}
                      </div>
                      </>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className={card}>
        <h2 className="text-[16px] font-bold text-primary">{t('cab.quotationEditor.summary')}</h2>
        <dl className="mt-4 space-y-3 text-[14px]">
          <div className="flex justify-between gap-3">
            <dt>{t('cab.quotationEditor.auditFee')} ({Number(quotation.totalAuditDays)} {t('cab.quotationEditor.auditDays')})</dt>
            <dd className="font-semibold">{money(quotation.totalAuditFee)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>{t('cab.quotationEditor.travelExpenses')}</dt><dd className="font-semibold">{money(quotation.travelExpenses)}</dd>
          </div>
          {quotation.additionalItems.map((item, index) => (
            <div key={index} className="flex justify-between gap-3">
              <dt>{item.name}</dt><dd className="font-semibold">{money(item.cost)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-3">
            <dt>{t('cab.quotationEditor.taxes')} ({Math.round(Number(quotation.taxRate) * 10000) / 100}%)</dt>
            <dd className="font-semibold">{money(quotation.taxAmount)}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-[#ececec] pt-3 text-[18px] font-bold text-primary">
            <dt>{t('cab.quotationEditor.total')}</dt><dd>{money(quotation.totalAmount)}</dd>
          </div>
        </dl>
      </section>

      {editable && (
        <section className={card}>
          <h2 className="text-[16px] font-bold text-primary">{t('cab.quotationFlow.editTitle')}</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <TextField
              id="edit-travel"
              label={`${t('cab.quotationEditor.travelExpenses')} (${quotation.currency})`}
              type="number" min="0" step="0.01" required
              value={travel}
              onChange={(e) => setTravel(e.target.value)}
            />
            <FormField label={t('cab.quotationFlow.offerEnd')}>
              <DatePicker value={asDate(offerEnd || null)} onChange={(d) => setOfferEnd(toIsoDate(d))} />
            </FormField>
          </div>
          <div className="mt-5 space-y-3">
            {items.map((item, index) => (
              <div key={item.key} className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_160px_auto]">
                <TextField
                  id={`edit-item-name-${item.key}`}
                  label={t('cab.quotationEditor.description', { number: index + 1 })}
                  maxLength={200}
                  value={item.name}
                  onChange={(e) => setItems((rows) => rows.map((row) => (row.key === item.key ? { ...row, name: e.target.value } : row)))}
                />
                <TextField
                  id={`edit-item-cost-${item.key}`}
                  label={`${t('cab.quotationEditor.amount')} (${quotation.currency})`}
                  type="number" min="0" step="0.01"
                  value={item.cost}
                  onChange={(e) => setItems((rows) => rows.map((row) => (row.key === item.key ? { ...row, cost: e.target.value } : row)))}
                />
                <Button type="button" variant="outline" onClick={() => setItems((rows) => rows.filter((row) => row.key !== item.key))}>
                  {t('cab.quotationEditor.remove')}
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setItems((rows) => [...rows, { key: crypto.randomUUID(), name: '', cost: '' }])}>
              + {t('cab.quotationEditor.addCharge')}
            </Button>
          </div>
          <div className="mt-5 space-y-2">
            <label htmlFor="edit-notes" className="text-[14px] font-medium">{t('cab.quotationFlow.notes')}</label>
            <Textarea id="edit-notes" rows={3} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button type="button" className="mt-5" disabled={busy || !travelValid || !itemsValid} onClick={() => void save()}>
            {t('cab.quotationFlow.saveChanges')}
          </Button>
        </section>
      )}

      {actions.length > 0 && (
        <section className={card}>
          <h2 className="text-[16px] font-bold text-primary">{t('cab.quotationFlow.actionsTitle')}</h2>
          <p className="mt-2 text-[13px] text-neutral-500">{t(`cab.quotationFlow.hint.${quotation.status}`)}</p>
          <div className="mt-4 space-y-2">
            <label htmlFor="transition-note" className="text-[14px] font-medium">{t('cab.quotationFlow.note')}</label>
            <Textarea id="transition-note" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {actions.map((action) => (
              <Button
                key={action}
                type="button"
                variant={action === 'issue' || action === 'accept' ? 'primary' : 'outline'}
                disabled={busy}
                onClick={() => transition(action)}
              >
                {t(`cab.quotationFlow.action.${action}`)}
              </Button>
            ))}
          </div>
        </section>
      )}

      {error && <p role="alert" className="text-[13px] text-error-500">{error}</p>}
    </div>
  )
}
