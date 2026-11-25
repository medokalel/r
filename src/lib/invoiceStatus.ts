import type { InvoiceStatus } from '@/lib/api/invoicesApi'

/** Translation key for each invoice status the API returns. */
export function invoiceStatusLabelKey(status: InvoiceStatus): string {
  switch (status) {
    case 'PENDING':
      return 'invoicesLegacy.filters.pending'
    case 'OVERDUE':
      return 'invoicesLegacy.filters.overdue'
    default:
      return 'invoicesLegacy.paymentMade'
  }
}

/** Badge colors per status, same palette as the other client list pages. */
export const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  PAYMENT_MADE: 'bg-[#d0fae5] text-[#007a55]',
  PENDING: 'bg-[#fef3c6] text-[#a58401]',
  OVERDUE: 'bg-[#fee2e2] text-[#dc2626]',
}
