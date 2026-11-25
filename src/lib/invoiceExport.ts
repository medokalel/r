import type { Invoice, PaginatedResult } from '@/lib/api/invoicesApi'

export const INVOICE_EXPORT_INCOMPLETE = 'Invoice export incomplete'
const MAX_EXPORT_PAGES = 50

/** Reads every page the API reports and fails if fewer rows than `total` arrive. */
export async function fetchAllInvoices(
  fetchPage: (page: number) => Promise<PaginatedResult<Invoice>>,
): Promise<Invoice[]> {
  const first = await fetchPage(1)
  const rows = [...first.items]
  const lastPage = Math.min(first.totalPages, MAX_EXPORT_PAGES)
  for (let page = 2; page <= lastPage; page += 1) {
    const next = await fetchPage(page)
    if (next.items.length === 0) break
    rows.push(...next.items)
  }
  if (rows.length < first.total) throw new Error(INVOICE_EXPORT_INCOMPLETE)
  return rows
}
