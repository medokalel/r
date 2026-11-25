import type { NonconformityItem, NonconformityStatus } from '@/lib/api/cabNonconformitiesApi'
import { matchesSearch } from '@/lib/tableTools'

export const FINDINGS_PAGE_SIZE = 10

export interface ClientFindingFilters {
  search: string
  status: 'all' | NonconformityStatus
}

export const EMPTY_FINDING_FILTERS: ClientFindingFilters = { search: '', status: 'all' }

export interface ClientFindingOrganization {
  id?: string | null
  name?: string | null
}

const normalize = (value: string | null | undefined) => (value ?? '').trim().toLowerCase()

/** Only the findings that belong to the signed-in client organization (id, or the same name). */
export function scopeFindingsToClient(
  items: NonconformityItem[],
  organization: ClientFindingOrganization | null | undefined,
): NonconformityItem[] {
  if (!organization) return []
  const id = normalize(organization.id)
  const name = normalize(organization.name)
  return items.filter(
    (item) =>
      (Boolean(id) && normalize(item.clientId) === id) ||
      (Boolean(name) && normalize(item.clientName) === name),
  )
}

/** A finding waits for the client's response while it is open, in progress or overdue. */
export function isAwaitingResponse(status: NonconformityStatus): boolean {
  return status === 'open' || status === 'in_progress' || status === 'overdue'
}

export function awaitingResponseCount(items: NonconformityItem[]): number {
  return items.filter((item) => isAwaitingResponse(item.status)).length
}

/** "ISO 22000 8.5.1: text" splits into clause and text; any other description has no clause. */
export function splitFindingDescription(description: string): { clause: string; text: string } {
  const match = /^([^:]{1,60}\d[^:]{0,40}):\s*([\s\S]+)$/.exec(description.trim())
  if (match) return { clause: match[1].trim(), text: match[2].trim() }
  return { clause: '', text: description.trim() }
}

export function filterClientFindings(
  items: NonconformityItem[],
  filters: ClientFindingFilters,
): NonconformityItem[] {
  return items.filter((item) => {
    if (filters.status !== 'all' && item.status !== filters.status) return false
    const { clause, text } = splitFindingDescription(item.description)
    return matchesSearch([item.ncId, item.findingId, item.auditId, clause, text], filters.search)
  })
}

export function paginateFindings(items: NonconformityItem[], page: number, pageSize = FINDINGS_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(Math.max(1, page), totalPages)
  return { items: items.slice((current - 1) * pageSize, current * pageSize), page: current, totalPages }
}
