import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { SelectField } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { fieldHeightClassName, fieldTextClassName } from '@/components/ui/fieldStyles'
import { cn } from '@/lib/utils'
import type { InvoiceLineItem } from './InteractiveInvoiceModal'

// TODO: replace with the real fee-schedule catalog once it's exposed by the
// API. Today the invoice table only ever shows this one description key
// (see MOCK_INVOICE_ITEMS in InteractiveInvoiceModal.tsx), so it's the only
// option offered here too.
const ITEM_DESCRIPTION_KEYS = ['certificationRequests.invoiceModal.lineItem'] as const

// TODO: replace with the real currency list once more than SAR is supported
// — the invoice table currently always renders the riyal icon regardless of
// the stored currency code.
const CURRENCY_OPTIONS = ['SAR'] as const

const EMPTY_FORM = {
  descriptionKey: '' as string,
  amount: '',
  quantity: '',
  currency: '' as string,
}

function isFormComplete(form: typeof EMPTY_FORM): boolean {
  return Boolean(
    form.descriptionKey && form.amount.trim() && form.quantity.trim() && form.currency
  )
}

interface AddInvoiceItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the fully-formed line item right before the dialog closes. */
  onAdd: (item: InvoiceLineItem) => void
}

/** "Add an interactive invoice" line-item form, opened from the invoice table's Add button. */
export function AddInvoiceItemModal({ open, onOpenChange, onAdd }: AddInvoiceItemModalProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState(EMPTY_FORM)

  const set = <K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const itemOptions = useMemo(
    () => ITEM_DESCRIPTION_KEYS.map((key) => ({ value: key, label: t(key) })),
    [t]
  )
  const currencyOptions = useMemo(
    () => CURRENCY_OPTIONS.map((code) => ({ value: code, label: code })),
    []
  )

  const amountValue = Number(form.amount)
  const quantityValue = Number(form.quantity)
  const total =
    Number.isFinite(amountValue) && Number.isFinite(quantityValue) ? amountValue * quantityValue : 0

  const resetForm = () => setForm(EMPTY_FORM)

  const onSubmit = () => {
    if (!isFormComplete(form)) return
    onAdd({
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : String(Date.now()),
      descriptionKey: form.descriptionKey,
      amount: amountValue,
      quantity: quantityValue,
      currency: form.currency,
    })
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm()
        onOpenChange(next)
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed start-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(735px,calc(100vw-40px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] bg-white shadow-xl focus:outline-none rtl:translate-x-1/2"
        >
          {/* Fixed header: title at start, circular close at end */}
          <div className="flex shrink-0 items-center justify-between px-6 pt-5">
            <Dialog.Title className="text-[24px] font-semibold leading-[1.6] text-neutral-900">
              {t('certificationRequests.invoiceModal.addItemTitle')}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t('common.close')}
                className="flex size-10 items-center justify-center rounded-full border-2 border-[#000000] text-[#000000] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          {/* Scrollable body */}
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
            <FormField label={t('certificationRequests.invoiceModal.item')}>
              <SelectField
                value={form.descriptionKey}
                onChange={(value) => set('descriptionKey', value)}
                options={itemOptions}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField label={t('certificationRequests.invoiceModal.amount')}>
                <TextField
                  type="text"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => set('amount', e.target.value)}
                />
              </FormField>
              <FormField label={t('certificationRequests.invoiceModal.number')}>
                <TextField
                  type="text"
                  inputMode="numeric"
                  value={form.quantity}
                  onChange={(e) => set('quantity', e.target.value)}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField label={t('certificationRequests.invoiceModal.currency')}>
                <SelectField
                  value={form.currency}
                  onChange={(value) => set('currency', value)}
                  options={currencyOptions}
                />
              </FormField>
              <FormField label={t('certificationRequests.invoiceModal.totalAmount')}>
                <div
                  className={cn(
                    fieldHeightClassName,
                    fieldTextClassName,
                    'flex items-center rounded-[var(--radius-sm)] bg-primary-subtle px-3 font-semibold text-primary'
                  )}
                >
                  {total.toLocaleString()}
                </div>
              </FormField>
            </div>

            {/* Footer actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="tertiary"
                size="lg"
                className="flex-1 bg-error-50 text-error-500 hover:bg-error-100"
                onClick={() => onOpenChange(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={onSubmit}
                disabled={!isFormComplete(form)}
              >
                {t('certificationRequests.invoiceModal.add')}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}