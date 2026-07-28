import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/Button'
import { AppIcon, RiyalSymbolIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

export interface InvoiceLineItem {
  id: string
  descriptionKey: string
  amount: number
  quantity: number
  currency: string
}

const MOCK_INVOICE_ITEMS: InvoiceLineItem[] = [
  { id: '1', descriptionKey: 'certificationRequests.invoiceModal.lineItem', amount: 3000, quantity: 1, currency: 'SAR' },
  { id: '2', descriptionKey: 'certificationRequests.invoiceModal.lineItem', amount: 3000, quantity: 1, currency: 'SAR' },
  { id: '3', descriptionKey: 'certificationRequests.invoiceModal.lineItem', amount: 3000, quantity: 1, currency: 'SAR' },
]

interface InteractiveInvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items?: InvoiceLineItem[]
  onAdd?: () => void
}

export function InteractiveInvoiceModal({
  open,
  onOpenChange,
  items = MOCK_INVOICE_ITEMS,
  onAdd,
}: InteractiveInvoiceModalProps) {
  const { t } = useTranslation()
  const total = items.reduce((sum, item) => sum + item.amount * item.quantity, 0)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed start-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(1150px,calc(100vw-40px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] bg-white shadow-xl focus:outline-none rtl:translate-x-1/2"
        >
          {/* Fixed header: title at start, circular close at end */}
          <div className="flex shrink-0 items-center justify-between px-6 py-5">
            <Dialog.Title className="text-[28px] font-semibold leading-[1.6] text-neutral-900">
              {t('certificationRequests.invoiceModal.title')}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t('common.close')}
                className="flex size-10 items-center justify-center rounded-full border-2 border-[#000000] text-[#000000] transition-colors "
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          {/* Scrollable body */}
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 pb-6">
            <div className="overflow-x-auto rounded-[10px] border border-[#ececec]">
              <table className="w-full min-w-[720px] border-collapse text-center">
                <thead>
                  <tr className="bg-[#1236a3] text-white">
                    <th className="p-[18px] text-center text-[14px] font-medium">
                      {t('certificationRequests.invoiceModal.index')}
                    </th>
                    <th className="p-[18px] text-center text-[14px] font-medium">
                      {t('certificationRequests.invoiceModal.item')}
                    </th>
                    <th className="p-[18px] text-center text-[14px] font-medium">
                      {t('certificationRequests.invoiceModal.amount')}
                    </th>
                    <th className="p-[18px] text-center text-[14px] font-medium">
                      {t('certificationRequests.invoiceModal.number')}
                    </th>
                    <th className="p-[18px] text-center text-[14px] font-medium">
                      {t('certificationRequests.invoiceModal.totalAmount')}
                    </th>
                    <th className="p-[18px] text-center text-[14px] font-medium">
                      {t('certificationRequests.invoiceModal.currency')}
                    </th>
                    <th className="p-[18px] text-center text-[14px] font-medium">
                      {t('certificationRequests.invoiceModal.procedures')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className={cn(index % 2 === 1 && 'bg-[#f9fafc]')}>
                      <td className="px-4 py-4 text-[15px] font-medium text-neutral-900">
                        {index + 1}
                      </td>
                      <td className="max-w-[420px] px-4 py-4 text-start text-[15px] text-neutral-700">
                        {t(item.descriptionKey)}
                      </td>
                      <td className="px-4 py-4 text-[15px] text-neutral-700">{item.amount.toLocaleString()}</td>
                      <td className="px-4 py-4 text-[15px] text-neutral-700">{item.quantity}</td>
                      <td className="px-4 py-4 text-[15px] text-neutral-700">
                        {(item.amount * item.quantity).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center text-primary">
                          <AppIcon icon={RiyalSymbolIcon} size={18} />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[15px] text-neutral-500">
                        {t('certificationRequests.invoiceModal.noProcedure')}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#e8edfc]">
                    <td colSpan={2} className="px-4 py-5 text-[18px] font-semibold text-primary">
                      {t('certificationRequests.invoiceModal.total')}
                    </td>
                    <td />
                    <td />
                    <td className="px-4 py-5 text-[18px] font-semibold text-primary">
                      {total.toLocaleString()}
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center justify-center text-primary">
                        <AppIcon icon={RiyalSymbolIcon} size={18} />
                      </div>
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-4">
              <Button
                variant="tertiary"
                size="lg"
                className="min-w-[160px] bg-error-50 text-error-500 hover:bg-error-100"
                onClick={() => onOpenChange(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="min-w-[160px]"
                onClick={() => {
                  onAdd?.()
                  onOpenChange(false)
                }}
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