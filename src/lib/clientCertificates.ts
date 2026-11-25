import type { CertificateRegisterItem, CertificateStatus } from '@/lib/api/cabCertificatesApi'
import { matchesSearch } from '@/lib/tableTools'

export const CERTIFICATES_PAGE_SIZE = 10

/** A certificate replaced by a newer issue shows as SUPERSEDED. The CAB register
 *  type does not carry it, so the client layer widens the status locally instead
 *  of touching the shared CertificateStatus union. */
export type ClientCertificateStatus = CertificateStatus | 'SUPERSEDED'

export interface ClientCertificateItem extends Omit<CertificateRegisterItem, 'status'> {
  status: ClientCertificateStatus
}

export interface ClientCertificateOrganization {
  id?: string | null
  name?: string | null
}

const normalize = (value: string | null | undefined) => (value ?? '').trim().toLowerCase()

/** Badge colors per status, mirroring the register palette. Kept client-local so
 *  the CAB status type and certificateStatus.ts stay exactly as they are. */
export const CLIENT_CERTIFICATE_STATUS_STYLES: Record<ClientCertificateStatus, string> = {
  DRAFT: 'bg-[#f3f4f6] text-[#4b5563]',
  ISSUED: 'bg-[#d0fae5] text-[#007a55]',
  SUSPENDED: 'bg-[#fef3c6] text-[#a58401]',
  WITHDRAWN: 'bg-[#fee2e2] text-[#dc2626]',
  SUPERSEDED: 'bg-[#f3f4f6] text-[#4b5563]',
}

/** Drafts are internal working copies: a client only ever sees issued records. */
export function clientVisibleCertificates(items: ClientCertificateItem[]): ClientCertificateItem[] {
  return items.filter((item) => item.status !== 'DRAFT')
}

/** Only the certificates that belong to the signed-in client organization (id, or the same name). */
export function scopeCertificatesToClient(
  items: ClientCertificateItem[],
  organization: ClientCertificateOrganization | null | undefined,
): ClientCertificateItem[] {
  if (!organization) return []
  const id = normalize(organization.id)
  const name = normalize(organization.name)
  return items.filter(
    (item) =>
      (Boolean(id) && normalize(item.clientId) === id) ||
      (Boolean(name) && normalize(item.clientName) === name),
  )
}

/** i18n key for a status badge: register keys where they exist, the client block for SUPERSEDED. */
export function clientCertificateStatusLabelKey(status: ClientCertificateStatus): string {
  if (status === 'SUPERSEDED') return 'clientCertificates.status.superseded'
  return `cab.certificateRegister.status.${status.toLowerCase()}`
}

/** "ISO 9001, ISO 14001" renders as one chip per standard; separators match the portal reference. */
export function splitStandards(standard: string): string[] {
  const seen = new Set<string>()
  const chips: string[] = []
  for (const part of standard.split(/[,;،\n]|\s\+\s/)) {
    const chip = part.trim()
    if (!chip) continue
    const key = chip.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    chips.push(chip)
  }
  return chips
}

/** Search matches the number, standard, scope or the localized status label. */
export function certificateMatchesSearch(
  item: ClientCertificateItem,
  search: string,
  statusLabel: string,
): boolean {
  return matchesSearch([item.certificateNumber, item.standard, item.scope, statusLabel], search)
}

export function formatCertificateDate(value: string | null | undefined, language: string): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(language, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function paginateCertificates(
  items: ClientCertificateItem[],
  page: number,
  pageSize = CERTIFICATES_PAGE_SIZE,
) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(Math.max(1, page), totalPages)
  return { items: items.slice((current - 1) * pageSize, current * pageSize), page: current, totalPages }
}
