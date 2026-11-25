import { getAuthSession } from '@/lib/authStorage'
import type { NonconformityItem } from '@/lib/api/cabNonconformitiesApi'
import { scopeFindingsToClient } from '@/lib/clientFindings'

/**
 * The client portal has no findings feed yet: nonconformities raised at an audit
 * reach the client only once the backend exists. Until then this returns nothing,
 * so a client never sees another client's records or demo rows presented as theirs.
 * Replace the body with the real request when the endpoint lands.
 */
async function loadFindingsSource(): Promise<NonconformityItem[]> {
  return []
}

/** Findings of the signed-in Audit Client only. */
export async function listClientFindings(): Promise<NonconformityItem[]> {
  const items = await loadFindingsSource()
  return scopeFindingsToClient(items, getAuthSession()?.organization)
}

export async function getClientFinding(ncId: string): Promise<NonconformityItem | null> {
  const key = ncId.trim().toLowerCase()
  const items = await listClientFindings()
  return items.find((item) => item.id.toLowerCase() === key || item.ncId.toLowerCase() === key) ?? null
}
