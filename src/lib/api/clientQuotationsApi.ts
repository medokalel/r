/**
 * Audit-client side of Quotations (client-side phase 1).
 *
 * Demo wiring only, same idea as `clientAuditsApi`: the CAB and the audit
 * client run inside the same demo frontend, so a quotation the CAB issues is
 * copied into a shared localStorage store (`icasco_client_quotations_v1`) and
 * the client reads, accepts or rejects it there. The CAB quotation screens read
 * the same store to show the client's decision. This is NOT real cross-account
 * delivery and it does NOT change the quotation on the backend. A real client
 * quotation API replaces the bodies of these functions later, not the pages.
 */

import type { Quotation, QuotationStatus } from '@/lib/api/cabQuotationApi'
import { getAuthSession } from '@/lib/authStorage'

export type ClientQuotationDecision = 'accepted' | 'rejected'
export type ClientQuotationState = 'pending' | 'accepted' | 'rejected' | 'expired'

export interface ClientQuotationRecord {
  quotationId: string
  applicationId: string
  applicationNumber: string
  clientName: string
  organizationId: string
  /** ISO timestamp of when the CAB issued it to the client. */
  publishedAt: string
  /** Latest copy of the quotation as the CAB issued it. */
  quotation: Quotation
  decision?: { decision: ClientQuotationDecision; reason?: string; at: string }
}

/** Where the quotation belongs: the application and its client organization. */
export interface ClientQuotationContext {
  applicationId: string
  applicationNumber: string
  clientName: string
  organizationId: string
}

export const QUOTATION_STORAGE_KEY = 'icasco_client_quotations_v1'

/** Minimum reason length for a rejection, mirroring the plan objection rule. */
export const QUOTATION_REJECTION_REASON_MIN_LENGTH = 10

function loadRecords(): ClientQuotationRecord[] {
  try {
    const raw = localStorage.getItem(QUOTATION_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ClientQuotationRecord[]) : []
  } catch {
    return []
  }
}

function saveRecords(records: ClientQuotationRecord[]): void {
  localStorage.setItem(QUOTATION_STORAGE_KEY, JSON.stringify(records))
}

function normalizeName(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

/** Demo scoping: the client sees quotations addressed to its own organization
 *  (organization id, or the same organization name as a fallback). */
export function isQuotationForSessionClient(record: ClientQuotationRecord): boolean {
  const organization = getAuthSession()?.organization
  if (!organization) return false
  if (record.organizationId && organization.id === record.organizationId) return true
  const name = normalizeName(organization.name)
  return Boolean(name) && name === normalizeName(record.clientName)
}

/** True once the offer's last valid day has passed. */
export function isQuotationExpired(quotation: Quotation, now: Date = new Date()): boolean {
  if (!quotation.offerEndDate) return false
  const end = new Date(`${quotation.offerEndDate.slice(0, 10)}T23:59:59`)
  return !Number.isNaN(end.getTime()) && end < now
}

/** The client's current state on an issued quotation. A recorded decision wins;
 *  a decision made on the backend itself still reads as accepted or rejected. */
export function getClientQuotationState(
  record: ClientQuotationRecord,
  now: Date = new Date(),
): ClientQuotationState {
  if (record.decision) return record.decision.decision
  if (record.quotation.status === 'ACCEPTED') return 'accepted'
  if (record.quotation.status === 'REJECTED') return 'rejected'
  return isQuotationExpired(record.quotation, now) ? 'expired' : 'pending'
}

/**
 * CAB side: keeps the client copy in step with the quotation. An issued (or
 * already decided) quotation is published or refreshed, keeping any decision the
 * client already made. A cancelled quotation is withdrawn. Drafts are ignored.
 */
export function syncQuotationToClient(
  quotation: Quotation,
  context: ClientQuotationContext,
): void {
  const records = loadRecords()
  const index = records.findIndex((record) => record.quotationId === quotation.id)
  if (quotation.status === 'CANCELLED') {
    if (index !== -1) saveRecords(records.filter((record) => record.quotationId !== quotation.id))
    return
  }
  if (quotation.status !== 'ISSUED' && quotation.status !== 'ACCEPTED' && quotation.status !== 'REJECTED') {
    return
  }
  const existing = index === -1 ? null : records[index]
  const next: ClientQuotationRecord = {
    ...context,
    quotationId: quotation.id,
    publishedAt: existing?.publishedAt ?? new Date().toISOString(),
    quotation,
    ...(existing?.decision ? { decision: existing.decision } : {}),
  }
  if (index === -1) records.push(next)
  else records[index] = next
  saveRecords(records)
}

/** CAB side: the client's record for one quotation, or null when none was published. */
export function getQuotationClientRecord(quotationId: string): ClientQuotationRecord | null {
  return loadRecords().find((record) => record.quotationId === quotationId) ?? null
}

/** Every quotation of this CAB that has a published client copy, by quotation id. */
export function getQuotationClientRecords(): Record<string, ClientQuotationRecord> {
  return Object.fromEntries(loadRecords().map((record) => [record.quotationId, record]))
}

/** Every quotation issued to THIS client, newest first. */
export async function listClientQuotations(): Promise<ClientQuotationRecord[]> {
  return loadRecords()
    .filter(isQuotationForSessionClient)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

/** One issued quotation by id or quotation number; null when missing or
 *  addressed to a different client. */
export async function getClientQuotation(idOrNumber: string): Promise<ClientQuotationRecord | null> {
  const key = normalizeName(idOrNumber)
  const record = loadRecords().find(
    (item) =>
      normalizeName(item.quotationId) === key ||
      (item.quotation.quotationNumber != null && normalizeName(item.quotation.quotationNumber) === key),
  )
  return record && isQuotationForSessionClient(record) ? record : null
}

/** The quotation record for a client request (application), if one was issued. */
export function getRequestQuotationRecord(applicationId: string): ClientQuotationRecord | null {
  const matches = loadRecords()
    .filter((record) => record.applicationId === applicationId)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
  return matches[0] ?? null
}

function decide(
  idOrNumber: string,
  decision: ClientQuotationDecision,
  reason?: string,
): Promise<ClientQuotationRecord | null> {
  const key = normalizeName(idOrNumber)
  const records = loadRecords()
  const index = records.findIndex(
    (item) =>
      normalizeName(item.quotationId) === key ||
      (item.quotation.quotationNumber != null && normalizeName(item.quotation.quotationNumber) === key),
  )
  const record = index === -1 ? null : records[index]
  // Only the owner can decide, and only while the quotation is still open.
  if (!record || !isQuotationForSessionClient(record) || getClientQuotationState(record) !== 'pending') {
    return Promise.resolve(null)
  }
  const updated: ClientQuotationRecord = {
    ...record,
    decision: {
      decision,
      ...(reason ? { reason: reason.trim() } : {}),
      at: new Date().toISOString(),
    },
  }
  records[index] = updated
  saveRecords(records)
  return Promise.resolve(updated)
}

/** The client accepts the quotation as issued. */
export function acceptClientQuotation(idOrNumber: string): Promise<ClientQuotationRecord | null> {
  return decide(idOrNumber, 'accepted')
}

/** The client rejects the quotation with a reason. */
export function rejectClientQuotation(
  idOrNumber: string,
  reason: string,
): Promise<ClientQuotationRecord | null> {
  if (reason.trim().length < QUOTATION_REJECTION_REASON_MIN_LENGTH) return Promise.resolve(null)
  return decide(idOrNumber, 'rejected', reason)
}

/** The status the CAB should read: the client's recorded decision (demo bridge) wins over the backend status. */
export function effectiveQuotationStatus(
  status: QuotationStatus,
  record: ClientQuotationRecord | null | undefined,
): QuotationStatus {
  if (record?.decision) return record.decision.decision === 'accepted' ? 'ACCEPTED' : 'REJECTED'
  return status
}

export type ClientQuotationActivityKind = 'quotationIssued' | 'quotationAccepted' | 'quotationRejected'

export interface ClientQuotationActivity {
  id: string
  kind: ClientQuotationActivityKind
  reference: string
  occurredAt: string
}

export function quotationReference(record: ClientQuotationRecord): string {
  return record.quotation.quotationNumber ?? record.quotationId.slice(0, 8).toUpperCase()
}

/** Quotation events for this client's home activity feed: issued, then the
 *  client's own decision. */
export async function listClientQuotationActivities(): Promise<ClientQuotationActivity[]> {
  const activities: ClientQuotationActivity[] = []
  for (const record of await listClientQuotations()) {
    const reference = quotationReference(record)
    activities.push({
      id: `quotation-issued-${record.quotationId}`,
      kind: 'quotationIssued',
      reference,
      occurredAt: record.publishedAt,
    })
    if (record.decision) {
      activities.push({
        id: `quotation-${record.decision.decision}-${record.quotationId}`,
        kind: record.decision.decision === 'accepted' ? 'quotationAccepted' : 'quotationRejected',
        reference,
        occurredAt: record.decision.at,
      })
    }
  }
  return activities
}
