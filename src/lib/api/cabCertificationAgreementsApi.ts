import { authorizedRequest } from '@/lib/api/authorizedClient'
import { DEFAULT_AGREEMENT_SECTIONS, type AgreementSection } from '@/lib/api/cabAgreementTermsApi'

export type CertificationAgreementStatus =
  | 'draft'
  | 'sent'
  | 'client_signed'
  | 'active'
  | 'superseded'
  | 'terminated'

export type CertificationAgreementKind = 'original' | 'amendment'

export type AgreementEventType =
  | 'GENERATED'
  | 'UPDATED'
  | 'SENT'
  | 'REMINDED'
  | 'OPENED'
  | 'VIEWED'
  | 'CLIENT_OPENED'
  | 'OTP_SENT'
  | 'CODE_SENT'
  | 'SIGNATURE_CODE_SENT'
  | 'CLIENT_SIGNED'
  | 'COUNTERSIGNED'
  | 'SUPERSEDED'
  | 'TERMINATED'
  | 'AMENDMENT_CREATED'

export type AgreementEventActor = 'cab' | 'client' | 'system'

export interface AgreementEvent {
  id: string
  type: AgreementEventType
  actor: AgreementEventActor
  actorName?: string
  ipAddress?: string
  /** ISO timestamp. */
  at: string
  reason?: string
}

export interface AgreementVersionRef {
  id: string
  reference: string
}

export interface AgreementSignRecord {
  signerName: string
  signerTitle: string
  signedAt: string
  fingerprint: string
  method?: string
  ipAddress?: string
  signatureDataUrl?: string
}

export interface CertificationAgreementValues {
  agreementNumber: string
  agreementVersion: string
  agreementDate: string
  cabLegalNameEn: string
  cabLegalNameAr: string
  clientLegalNameEn: string
  clientLegalNameAr: string
  clientCrNumber: string
  clientCityEn: string
  clientCityAr: string
  standards: string[]
  scopeEn: string
  scopeAr: string
  sitesCount: number
  totalFeeEn: string
  totalFeeAr: string
  signatoryEn: string
  signatoryAr: string
  offerRef: string
}

export interface CertificationAgreement {
  id: string
  reference: string
  version: number
  status: CertificationAgreementStatus
  kind: CertificationAgreementKind
  lastChange: string
  values: CertificationAgreementValues
  sections: AgreementSection[]
  clientSignature?: AgreementSignRecord
  cabSignature?: AgreementSignRecord
  /** ISO timestamp of the first send to the client. */
  sentAt?: string
  reminderCount: number
  /** ISO timestamp of the latest reminder. */
  lastReminderAt?: string
  /** Set on an amendment: the version it replaces once both parties sign. */
  amendmentOf?: AgreementVersionRef & { reason: string }
  /** Set on a replaced version: the version that superseded it. */
  supersededBy?: AgreementVersionRef
  terminatedAt?: string
  terminationReason?: string
  events: AgreementEvent[]
}

// --- Backend (/cab/certification-agreements) ---

interface SignatureDto extends Omit<AgreementSignRecord, 'signedAt'> {
  signedAt: string
}

interface CertificationAgreementDto extends Omit<CertificationAgreement, 'lastChange' | 'clientSignature' | 'cabSignature'> {
  lastChange: string
  clientSignature?: SignatureDto
  cabSignature?: SignatureDto
  auditTrail?: AgreementEvent[]
  auditLogs?: AgreementEvent[]
  history?: AgreementEvent[]
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const formatDateTime = (iso: string) =>
  `${formatDate(iso)} · ${new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`

function normalizeStatus(status: string): CertificationAgreementStatus {
  const normalized = status?.toLowerCase?.() ?? 'draft'
  if (normalized === 'signed_by_client') return 'client_signed'
  return normalized as CertificationAgreementStatus
}

function buildFallbackEvents(dto: CertificationAgreementDto): AgreementEvent[] {
  const events: AgreementEvent[] = []
  if (dto.lastChange || dto.values?.agreementDate) {
    events.push({
      id: `${dto.id}-generated`,
      type: 'GENERATED',
      actor: 'cab',
      at: dto.lastChange || dto.values.agreementDate,
    })
  }
  if (dto.sentAt) {
    events.push({
      id: `${dto.id}-sent`,
      type: 'SENT',
      actor: 'cab',
      at: dto.sentAt,
    })
  }
  if (dto.lastReminderAt) {
    events.push({
      id: `${dto.id}-reminded`,
      type: 'REMINDED',
      actor: 'cab',
      at: dto.lastReminderAt,
    })
  }
  if (dto.clientSignature?.signedAt) {
    events.push({
      id: `${dto.id}-client-signed`,
      type: 'CLIENT_SIGNED',
      actor: 'client',
      actorName: dto.clientSignature.signerName,
      at: dto.clientSignature.signedAt,
    })
  }
  if (dto.cabSignature?.signedAt) {
    events.push({
      id: `${dto.id}-countersigned`,
      type: 'COUNTERSIGNED',
      actor: 'cab',
      actorName: dto.cabSignature.signerName,
      at: dto.cabSignature.signedAt,
    })
  }
  if (dto.terminatedAt) {
    events.push({
      id: `${dto.id}-terminated`,
      type: 'TERMINATED',
      actor: 'cab',
      at: dto.terminatedAt,
      reason: dto.terminationReason,
    })
  }
  return events
}

function fromDto(dto: CertificationAgreementDto): CertificationAgreement {
  const signature = (record?: SignatureDto): AgreementSignRecord | undefined =>
    record ? { ...record, signedAt: formatDateTime(record.signedAt) } : undefined
  const rawEvents = dto.events ?? dto.auditTrail ?? dto.auditLogs ?? dto.history
  const events = Array.isArray(rawEvents) && rawEvents.length > 0 ? rawEvents : buildFallbackEvents(dto)
  return {
    ...dto,
    status: normalizeStatus(dto.status),
    values: {
      ...dto.values,
      standards: Array.isArray(dto.values?.standards) ? dto.values.standards : [],
    },
    sections: Array.isArray(dto.sections) ? dto.sections : [],
    events,
    lastChange: formatDate(dto.lastChange),
    clientSignature: signature(dto.clientSignature),
    cabSignature: signature(dto.cabSignature),
  }
}

const agreementPath = (id: string) => `/cab/certification-agreements/${encodeURIComponent(id)}`
const post = (body?: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body ?? {}) })

async function request(path: string, init?: RequestInit): Promise<CertificationAgreement> {
  return fromDto(await authorizedRequest<CertificationAgreementDto>(path, init))
}

export async function listCertificationAgreements(): Promise<CertificationAgreement[]> {
  const items = await authorizedRequest<CertificationAgreementDto[]>('/cab/certification-agreements')
  return items.map(fromDto)
}

export function getCertificationAgreementById(id: string): Promise<CertificationAgreement> {
  return request(agreementPath(id))
}

/**
 * Drafts an agreement for a registered audit client. The backend numbers it, fills the client's
 * details from its own records and snapshots the CAB's saved terms (or these default sections).
 */
export function generateCertificationAgreement(clientId: string): Promise<CertificationAgreement> {
  return request('/cab/certification-agreements', post({ clientId, sections: DEFAULT_AGREEMENT_SECTIONS }))
}

/** Draft only: edits the client, offer and scope values. */
export function updateCertificationAgreementValues(
  id: string,
  values: Partial<CertificationAgreementValues>,
): Promise<CertificationAgreement> {
  return request(agreementPath(id), { method: 'PATCH', body: JSON.stringify({ values }) })
}

/** Draft only: re-snapshots the CAB's current agreement terms and starts a new agreement version. */
export function refreshAgreementTerms(id: string): Promise<CertificationAgreement> {
  return request(`${agreementPath(id)}/use-latest-terms`, post({ sections: DEFAULT_AGREEMENT_SECTIONS }))
}

export const sendCertificationAgreement = (id: string) => request(`${agreementPath(id)}/send`, post())
export const remindCertificationAgreement = (id: string) => request(`${agreementPath(id)}/remind`, post())
export const recordClientSignature = (id: string) => request(`${agreementPath(id)}/client-signature`, post())
export const countersignCertificationAgreement = (id: string) =>
  request(`${agreementPath(id)}/countersign`, post())
export const terminateCertificationAgreement = (id: string, reason: string) =>
  request(`${agreementPath(id)}/terminate`, post({ reason }))

/** Replaces the {{tokens}} of a clause with the values of the agreement. */
export function renderAgreementClauseText(
  text: string | undefined,
  values: CertificationAgreementValues,
): string {
  const safeText = text ?? ''
  const map: Record<string, string> = {
    '{{agreement_number}}': values.agreementNumber ?? '',
    '{{رقم_الاتفاقية}}': values.agreementNumber ?? '',
    '{{agreement_version}}': values.agreementVersion ?? '',
    '{{إصدار_الاتفاقية}}': values.agreementVersion ?? '',
    '{{agreement_date}}': values.agreementDate ?? '',
    '{{تاريخ_الاتفاقية}}': values.agreementDate ?? '',
    '{{cab_legal_name}}': values.cabLegalNameEn ?? '',
    '{{اسم_جهة_المنح}}': values.cabLegalNameAr ?? '',
    '{{client_legal_name}}': values.clientLegalNameEn ?? '',
    '{{اسم_العميل}}': values.clientLegalNameAr ?? '',
    '{{client_cr_number}}': values.clientCrNumber ?? '',
    '{{السجل_التجاري}}': values.clientCrNumber ?? '',
    '{{client_city}}': values.clientCityEn ?? '',
    '{{مدينة_العميل}}': values.clientCityAr ?? '',
    '{{standards}}': (values.standards ?? []).join(', '),
    '{{المواصفات_القياسية}}': (values.standards ?? []).join('، '),
    '{{certification_scope}}': values.scopeEn ?? '',
    '{{نطاق_الشهادة}}': values.scopeAr ?? '',
    '{{sites_count}}': String(values.sitesCount ?? 1),
    '{{عدد_المواقع}}': String(values.sitesCount ?? 1),
    '{{total_fee}}': values.totalFeeEn ?? '',
    '{{إجمالي_الرسوم}}': values.totalFeeAr ?? '',
    '{{client_signatory}}': values.signatoryEn ?? '',
    '{{المفوض_بالتوقيع}}': values.signatoryAr ?? '',
  }
  return Object.entries(map).reduce(
    (acc, [token, val]) => acc.split(token).join(val),
    safeText,
  )
}
