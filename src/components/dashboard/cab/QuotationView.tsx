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

const card = 'rounded-[16px] border border-[#ececec] bg-white p-5 sm:p-6'

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
    new Intl.NumberFormat(i18n.language, { style: 'currency', currency: quotation.currency }).format(Number(value))
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
    <div className="space-y-6">
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
        <h2 className="border-b border-[#ececec] px-5 py-4 text-[16px] font-bold text-primary">{t('cab.quotationFlow.events')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-start text-[12px]">
            <thead className="bg-[#fafafa] text-[11px] uppercase">
              <tr>
                {['seq', 'standard', 'event', 'days', 'rate', 'fee'].map((key) => (
                  <th key={key} scope="col" className="px-4 py-3 text-start">{t(`cab.quotationFlow.col.${key}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Number(quotation.initialAuditDays) > 0 && (
                <tr className="border-t border-[#ececec] bg-[#f8faff]">
                  <td className="px-4 py-3" colSpan={3}>{t('cab.quotationFlow.initialAudit')}</td>
                  <td className="px-4 py-3">{Number(quotation.initialAuditDays)}</td>
                  <td className="px-4 py-3">{money(quotation.dailyRate)}</td>
                  <td className="px-4 py-3 font-semibold">{money(quotation.initialAuditFee ?? 0)}</td>
                </tr>
              )}
              {quotation.events.map((event) => {
                // Stage 1 + Stage 2 are billed together as the initial audit above; the backend rejects edits on them.
                const included = Number(quotation.initialAuditDays) > 0 && (event.auditEventType === 'STAGE_1' || event.auditEventType === 'STAGE_2') && Number(event.auditFee) === 0
                return (
                <tr key={event.id} className="border-t border-[#ececec]">
                  <td className="px-4 py-3">{event.sequenceOrder}</td>
                  <td className="px-4 py-3">{event.standardCode.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    {t(`cab.quotationFlow.event.${event.auditEventType}`)}
                    {!included && event.policyVerificationStatus !== 'VERIFIED' && (
                      <span className="ms-2 text-[#92400e]">({event.policyVerificationStatus})</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {included ? (
                      <span className="text-neutral-500">{t('cab.quotationFlow.includedInitial')}</span>
                    ) : editable ? (
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        disabled={busy}
                        aria-label={t('cab.quotationFlow.col.days')}
                        className="h-9 w-24 rounded-[8px] border border-neutral-200 px-2"
                        value={days[event.id] ?? String(Number(event.auditDays))}
                        onChange={(e) => setDays((prev) => ({ ...prev, [event.id]: e.target.value }))}
                        onBlur={() => commitDays(event.id, event.auditDays)}
                      />
                    ) : (
                      Number(event.auditDays)
                    )}
                    {event.manualOverride && <span className="ms-2 text-neutral-500">{t('cab.quotationFlow.overridden')}</span>}
                  </td>
                  <td className="px-4 py-3">{included ? '—' : money(event.dailyRate)}</td>
                  <td className="px-4 py-3 font-semibold">{included ? '—' : money(event.auditFee)}</td>
                </tr>
                )
              })}
            </tbody>
          </table>
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
