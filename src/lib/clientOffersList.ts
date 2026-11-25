import {
  getClientQuotationState,
  quotationReference,
  type ClientQuotationRecord,
  type ClientQuotationState,
} from '@/lib/api/clientQuotationsApi'

export type OfferStateFilter = 'all' | ClientQuotationState

export const OFFERS_PAGE_SIZE = 10

/** Offers matching the status filter and the search text (offer number or request number). */
export function filterClientOffers(
  records: ClientQuotationRecord[],
  search: string,
  filter: OfferStateFilter,
  now: Date = new Date(),
): ClientQuotationRecord[] {
  const q = search.trim().toLowerCase()
  return records.filter((record) => {
    if (filter !== 'all' && getClientQuotationState(record, now) !== filter) return false
    if (!q) return true
    return (
      quotationReference(record).toLowerCase().includes(q) ||
      record.applicationNumber.toLowerCase().includes(q)
    )
  })
}

export function paginateOffers<T>(items: T[], page: number, pageSize: number = OFFERS_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(Math.max(1, page), totalPages)
  return { page: current, totalPages, items: items.slice((current - 1) * pageSize, current * pageSize) }
}

/** One CSV cell: quoted, inner quotes doubled, and text that a spreadsheet would
 *  run as a formula (starts with = + - @) is neutralised with a leading apostrophe. */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return `"${safe.replaceAll('"', '""')}"`
}

export function buildOffersCsv(
  records: ClientQuotationRecord[],
  headers: string[],
  stateLabel: (state: ClientQuotationState) => string,
  now: Date = new Date(),
): string {
  const rows = records.map((record) =>
    [
      quotationReference(record),
      String(Number(record.quotation.totalAmount)),
      record.quotation.currency,
      (record.quotation.offerEndDate ?? '').slice(0, 10),
      stateLabel(getClientQuotationState(record, now)),
    ].map(csvCell),
  )
  return `\uFEFF${[headers.map(csvCell), ...rows].map((row) => row.join(',')).join('\r\n')}`
}
