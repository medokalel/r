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

<<<<<<< HEAD

export interface EligibleClientOffer {
  clientId: string
  offerRef: string
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
}

export const ELIGIBLE_CLIENT_OFFERS: EligibleClientOffer[] = [
  {
    clientId: 'cl-alnoor',
    offerRef: 'OF-0201',
    clientLegalNameEn: 'Al Noor Food Industries',
    clientLegalNameAr: 'شركة النور للصناعات الغذائية',
    clientCrNumber: '4030192837',
    clientCityEn: 'Jeddah',
    clientCityAr: 'جدة',
    standards: ['ISO 9001:2015', 'ISO 22000:2018'],
    scopeEn: 'Food & Beverage Manufacturing and Packaging',
    scopeAr: 'تصنيع وتعبئة الأغذية والمشروبات',
    sitesCount: 3,
    totalFeeEn: '91,488 SAR',
    totalFeeAr: '91,488 ر.س',
    signatoryEn: 'Sara Ali — Quality Manager',
    signatoryAr: 'سارة علي — مديرة الجودة',
  },
  {
    clientId: 'cl-gulf',
    offerRef: 'OF-0205',
    clientLegalNameEn: 'Gulf Horizon Logistics',
    clientLegalNameAr: 'شركة آفاق الخليج للخدمات اللوجستية',
    clientCrNumber: '1010482910',
    clientCityEn: 'Riyadh',
    clientCityAr: 'الرياض',
    standards: ['ISO 9001:2015', 'ISO 14001:2015', 'ISO 45001:2018'],
    scopeEn: 'Freight Transport, Cold Chain & Warehousing Services',
    scopeAr: 'خدمات النقل البري والتخزين المبرد والإمداد',
    sitesCount: 4,
    totalFeeEn: '148,500 SAR',
    totalFeeAr: '148,500 ر.س',
    signatoryEn: 'Fahad Al-Mutairi — HSE Director',
    signatoryAr: 'فهد المطيري — مدير السلامة والجودة',
  },
  {
    clientId: 'cl-najd',
    offerRef: 'OF-0204',
    clientLegalNameEn: 'Najd Valley Foods Co.',
    clientLegalNameAr: 'شركة وادي نجد للأغذية',
    clientCrNumber: '1010992140',
    clientCityEn: 'Riyadh',
    clientCityAr: 'الرياض',
    standards: ['ISO 22000:2018'],
    scopeEn: 'Dairy & Fresh Produce Processing',
    scopeAr: 'تصنيع ومعالجة منتجات الألبان والأغذية الطازجة',
    sitesCount: 2,
    totalFeeEn: '64,200 SAR',
    totalFeeAr: '64,200 ر.س',
    signatoryEn: 'Khaled Al-Qahtani — Operations Director',
    signatoryAr: 'خالد القحطاني — مدير العمليات',
  },
  {
    clientId: 'cl-saudi-integrated',
    offerRef: 'OF-0203',
    clientLegalNameEn: 'Saudi Integrated Industries Group',
    clientLegalNameAr: 'المجموعة السعودية للصناعات المتكاملة',
    clientCrNumber: '2050118492',
    clientCityEn: 'Dammam',
    clientCityAr: 'الدمام',
    standards: [
      'ISO 9001:2015',
      'ISO 14001:2015',
      'ISO 45001:2018',
      'ISO 50001:2018',
    ],
    scopeEn: 'Industrial Equipment Manufacturing & Engineering Services',
    scopeAr: 'تصنيع المعدات الصناعية والخدمات الهندسية المتكاملة',
    sitesCount: 5,
    totalFeeEn: '215,000 SAR',
    totalFeeAr: '215,000 ر.س',
    signatoryEn: 'Eng. Tariq Al-Zahrani — VP Quality',
    signatoryAr: 'م. طارق الزهراني — نائب الرئيس للجودة',
  },
]


const STORAGE_KEY = 'icasco_cab_certification_agreements_v1'

const CAB_SIGNATORY = {
  name: 'Mohamed El Manawahly',
  title: 'Certification Body Director',
} as const

type SeedAgreement = Omit<
  CertificationAgreement,
  'kind' | 'events' | 'reminderCount' | 'sentAt'
>

/** Shape of a record saved before amendments, reminders and the audit trail existed. */
type StoredAgreement = Omit<
  CertificationAgreement,
  'status' | 'kind' | 'events' | 'reminderCount'
> & {
  status: CertificationAgreementStatus | 'signed_by_client'
  kind?: CertificationAgreementKind
  events?: AgreementEvent[]
  reminderCount?: number
}

const IN_PROGRESS_STATUSES: readonly CertificationAgreementStatus[] = [
  'draft',
  'sent',
  'client_signed',
]

const seedEvent = (
  agreementId: string,
  index: number,
  type: AgreementEventType,
  actor: AgreementEventActor,
  at: string,
): AgreementEvent => ({ id: `${agreementId}-seed-${index}`, type, actor, at })

const SEED_EVENTS: Record<string, AgreementEvent[]> = {
  'AGR-0005': [
    seedEvent('AGR-0005', 1, 'GENERATED', 'cab', '2026-11-04T09:00:00.000Z'),
  ],
  'AGR-0004': [
    seedEvent('AGR-0004', 1, 'GENERATED', 'cab', '2026-11-03T10:00:00.000Z'),
    seedEvent('AGR-0004', 2, 'SENT', 'cab', '2026-11-04T08:30:00.000Z'),
  ],
  'AGR-0003': [
    seedEvent('AGR-0003', 1, 'GENERATED', 'cab', '2026-10-30T10:00:00.000Z'),
    seedEvent('AGR-0003', 2, 'SENT', 'cab', '2026-10-31T09:00:00.000Z'),
    seedEvent('AGR-0003', 3, 'CLIENT_SIGNED', 'client', '2026-11-02T14:20:00.000Z'),
  ],
  'AGR-0002': [
    seedEvent('AGR-0002', 1, 'GENERATED', 'cab', '2026-05-02T10:00:00.000Z'),
    seedEvent('AGR-0002', 2, 'SENT', 'cab', '2026-05-03T09:00:00.000Z'),
    seedEvent('AGR-0002', 3, 'CLIENT_SIGNED', 'client', '2026-05-05T11:15:00.000Z'),
    seedEvent('AGR-0002', 4, 'COUNTERSIGNED', 'cab', '2026-05-06T09:40:00.000Z'),
  ],
  'AGR-0001': [
    seedEvent('AGR-0001', 1, 'GENERATED', 'cab', '2026-04-14T10:00:00.000Z'),
    seedEvent('AGR-0001', 2, 'SENT', 'cab', '2026-04-15T09:00:00.000Z'),
    seedEvent('AGR-0001', 3, 'CLIENT_SIGNED', 'client', '2026-04-17T16:05:00.000Z'),
    seedEvent('AGR-0001', 4, 'COUNTERSIGNED', 'cab', '2026-04-18T10:12:00.000Z'),
  ],
}

const SEED_SENT_AT: Record<string, string> = {
  'AGR-0004': '2026-11-04T08:30:00.000Z',
  'AGR-0003': '2026-10-31T09:00:00.000Z',
  'AGR-0002': '2026-05-03T09:00:00.000Z',
  'AGR-0001': '2026-04-15T09:00:00.000Z',
}


function buildSeedAgreements(): SeedAgreement[] {
  const terms = getAgreementTermsState()
  return [
    {
      id: 'AGR-0005',
      reference: 'AGR-0005 v1',
      version: 1,
      status: 'draft',
      lastChange: '04 Nov 2026',
      sections: terms.sections,
      values: {
        agreementNumber: 'AGR-0005',
        agreementVersion: 'v1.0',
        agreementDate: '04 Nov 2026',
        cabLegalNameEn: 'iCASCO Certification Body Co.',
        cabLegalNameAr: 'شركة أي كاسكو لمنح الشهادات',
        ...ELIGIBLE_CLIENT_OFFERS[0],
      },
    },
    {
      id: 'AGR-0004',
      reference: 'AGR-0004 v1',
      version: 1,
      status: 'sent',
      lastChange: '04 Nov 2026',
      sections: terms.sections,
      values: {
        agreementNumber: 'AGR-0004',
        agreementVersion: 'v1.0',
        agreementDate: '04 Nov 2026',
        cabLegalNameEn: 'iCASCO Certification Body Co.',
        cabLegalNameAr: 'شركة أي كاسكو لمنح الشهادات',
        ...ELIGIBLE_CLIENT_OFFERS[1],
      },
    },
    {
      id: 'AGR-0003',
      reference: 'AGR-0003 v1',
      version: 1,
      status: 'client_signed',
      lastChange: '02 Nov 2026',
      sections: terms.sections,
      values: {
        agreementNumber: 'AGR-0003',
        agreementVersion: 'v1.0',
        agreementDate: '02 Nov 2026',
        cabLegalNameEn: 'iCASCO Certification Body Co.',
        cabLegalNameAr: 'شركة أي كاسكو لمنح الشهادات',
        ...ELIGIBLE_CLIENT_OFFERS[2],
      },
      clientSignature: {
        signerName: 'Khaled Al-Qahtani',
        signerTitle: 'Operations Director',
        signedAt: '02 Nov 2026 · 14:20',
        fingerprint: 'SHA256:9f84c2e1b7a048d3...4e21',
      },
    },
    {
      id: 'AGR-0002',
      reference: 'AGR-0002 v1',
      version: 1,
      status: 'active',
      lastChange: '06 May 2026',
      sections: terms.sections,
      values: {
        agreementNumber: 'AGR-0002',
        agreementVersion: 'v1.0',
        agreementDate: '06 May 2026',
        cabLegalNameEn: 'iCASCO Certification Body Co.',
        cabLegalNameAr: 'شركة أي كاسكو لمنح الشهادات',
        ...ELIGIBLE_CLIENT_OFFERS[3],
      },
      clientSignature: {
        signerName: 'Eng. Tariq Al-Zahrani',
        signerTitle: 'VP Quality',
        signedAt: '05 May 2026 · 11:15',
        fingerprint: 'SHA256:3c91a0f8e21b77d4...8a10',
      },
      cabSignature: {
        signerName: 'Mohamed El Manawahly',
        signerTitle: 'Certification Body Director',
        signedAt: '06 May 2026 · 09:40',
        fingerprint: 'SHA256:7d42b1c9a05e33f1...2b99',
      },
    },
    {
      id: 'AGR-0001',
      reference: 'AGR-0001 v1',
      version: 1,
      status: 'active',
      lastChange: '18 Apr 2026',
      sections: terms.sections,
      values: {
        agreementNumber: 'AGR-0001',
        agreementVersion: 'v1.0',
        agreementDate: '18 Apr 2026',
        cabLegalNameEn: 'iCASCO Certification Body Co.',
        cabLegalNameAr: 'شركة أي كاسكو لمنح الشهادات',
        ...ELIGIBLE_CLIENT_OFFERS[0],
      },
      clientSignature: {
        signerName: 'Sara Ali',
        signerTitle: 'Quality Manager',
        signedAt: '17 Apr 2026 · 16:05',
        fingerprint: 'SHA256:5a18d7e3c902f41b...6c34',
      },
      cabSignature: {
        signerName: 'Mohamed El Manawahly',
        signerTitle: 'Certification Body Director',
        signedAt: '18 Apr 2026 · 10:12',
        fingerprint: 'SHA256:1e67f4a2b819c03d...9d02',
      },
    },
  ]
}


function buildDefaultAgreements(): CertificationAgreement[] {
  return buildSeedAgreements().map((seed) => ({
    ...seed,
    kind: 'original',
    reminderCount: 0,
    sentAt: SEED_SENT_AT[seed.id],
    events: SEED_EVENTS[seed.id] ?? [],
  }))
}

/** Upgrades records saved by an older version of the mock (renamed status, no trail). */
function normalizeAgreement(item: StoredAgreement): CertificationAgreement {
  return {
    ...item,
    status: item.status === 'signed_by_client' ? 'client_signed' : item.status,
    kind: item.kind ?? 'original',
    reminderCount: item.reminderCount ?? 0,
    events: item.events ?? [],
  }
}

export function listCertificationAgreements(): CertificationAgreement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const defaults = buildDefaultAgreements()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
      return defaults
    }
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed)
      ? (parsed as StoredAgreement[]).map(normalizeAgreement)
      : buildDefaultAgreements()
  } catch {
    return buildDefaultAgreements()
=======
// --- Backend (/cab/certification-agreements) ---

interface SignatureDto extends Omit<AgreementSignRecord, 'signedAt'> {
  signedAt: string
}

interface CertificationAgreementDto extends Omit<CertificationAgreement, 'lastChange' | 'clientSignature' | 'cabSignature'> {
  lastChange: string
  clientSignature?: SignatureDto
  cabSignature?: SignatureDto
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const formatDateTime = (iso: string) =>
  `${formatDate(iso)} · ${new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`

function fromDto(dto: CertificationAgreementDto): CertificationAgreement {
  const signature = (record?: SignatureDto): AgreementSignRecord | undefined =>
    record ? { ...record, signedAt: formatDateTime(record.signedAt) } : undefined
  return {
    ...dto,
    lastChange: formatDate(dto.lastChange),
    clientSignature: signature(dto.clientSignature),
    cabSignature: signature(dto.cabSignature),
>>>>>>> origin/main
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

<<<<<<< HEAD
const formatDisplayDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

const formatDisplayStamp = (iso: string) =>
  `${formatDisplayDate(iso)} · ${new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })}`

const createEvent = (
  type: AgreementEventType,
  actor: AgreementEventActor,
  at: string,
  reason?: string,
): AgreementEvent => ({
  id: `${type}-${at}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  actor,
  at,
  ...(reason ? { reason } : {}),
})

const withEvent = (
  current: CertificationAgreement,
  event: AgreementEvent,
): AgreementEvent[] => [...current.events, event]

const agreementNumeric = (item: CertificationAgreement) =>
  Number.parseInt(item.values.agreementNumber.replace(/\D/g, ''), 10) || 0

export function generateCertificationAgreement(
  clientId: string,
): CertificationAgreement {
  const all = listCertificationAgreements()
  const offer =
    ELIGIBLE_CLIENT_OFFERS.find((c) => c.clientId === clientId) ??
    ELIGIBLE_CLIENT_OFFERS[0]
  const terms = getAgreementTermsState()
  // Highest existing number + 1: amendments add records, so `length + 1` could collide.
  const nextNumber = Math.max(0, ...all.map(agreementNumeric)) + 1
  const id = `AGR-${String(nextNumber).padStart(4, '0')}`
  const now = new Date().toISOString()
  const today = formatDisplayDate(now)

  const created: CertificationAgreement = {
    id,
    reference: `${id} v1`,
    version: 1,
    status: 'draft',
    kind: 'original',
    lastChange: today,
    sections: terms.sections,
    reminderCount: 0,
    events: [createEvent('GENERATED', 'cab', now)],
    values: {
      agreementNumber: id,
      agreementVersion: `v${terms.version}.0`,
      agreementDate: today,
      cabLegalNameEn: 'iCASCO Certification Body Co.',
      cabLegalNameAr: 'شركة أي كاسكو لمنح الشهادات',
      ...offer,
    },
  }
  saveCertificationAgreements([created, ...all])
  return created
=======
/** Draft only: re-snapshots the CAB's current agreement terms and starts a new agreement version. */
export function refreshAgreementTerms(id: string): Promise<CertificationAgreement> {
  return request(`${agreementPath(id)}/use-latest-terms`, post({ sections: DEFAULT_AGREEMENT_SECTIONS }))
>>>>>>> origin/main
}

export const sendCertificationAgreement = (id: string) => request(`${agreementPath(id)}/send`, post())
export const recordClientSignature = (id: string) => request(`${agreementPath(id)}/client-signature`, post())
export const countersignCertificationAgreement = (id: string) => request(`${agreementPath(id)}/countersign`, post())

/**
 * Applies one lifecycle step to an agreement. Returns `null` (and saves nothing)
 * when the agreement is missing or not in a status that allows the step.
 */
function applyTransition(
  id: string,
  allowedFrom: readonly CertificationAgreementStatus[],
  apply: (current: CertificationAgreement, now: string) => CertificationAgreement,
): CertificationAgreement | null {
  const all = listCertificationAgreements()
  const current = all.find((item) => item.id === id)
  if (!current || !allowedFrom.includes(current.status)) return null
  const updated = apply(current, new Date().toISOString())
  saveCertificationAgreements(all.map((item) => (item.id === id ? updated : item)))
  return updated
}

export function updateAgreementValues(
  id: string,
  values: CertificationAgreementValues,
): CertificationAgreement | null {
  return applyTransition(id, ['draft'], (current, now) => ({
    ...current,
    values,
    lastChange: formatDisplayDate(now),
    events: withEvent(current, createEvent('UPDATED', 'cab', now)),
  }))
}

/** Re-applies the latest agreement terms to a draft. */
export function refreshAgreementTerms(
  id: string,
): CertificationAgreement | null {
  const latest = getAgreementTermsState()
  return applyTransition(id, ['draft'], (current, now) => ({
    ...current,
    sections: latest.sections,
    lastChange: formatDisplayDate(now),
    values: { ...current.values, agreementVersion: `v${latest.version}.0` },
    events: withEvent(current, createEvent('UPDATED', 'cab', now)),
  }))
}

export function sendCertificationAgreement(
  id: string,
): CertificationAgreement | null {
  return applyTransition(id, ['draft'], (current, now) => ({
    ...current,
    status: 'sent',
    sentAt: now,
    lastChange: formatDisplayDate(now),
    events: withEvent(current, createEvent('SENT', 'cab', now)),
  }))
}

export function remindAgreementClient(
  id: string,
): CertificationAgreement | null {
  return applyTransition(id, ['sent'], (current, now) => ({
    ...current,
    reminderCount: current.reminderCount + 1,
    lastReminderAt: now,
    lastChange: formatDisplayDate(now),
    events: withEvent(current, createEvent('REMINDED', 'cab', now)),
  }))
}

/** Mock of the client signing from their portal, so the flow can be walked end to end. */
export function recordClientSignature(
  id: string,
): CertificationAgreement | null {
  return applyTransition(id, ['sent'], (current, now) => {
    const [namePart, titlePart] = current.values.signatoryEn
      .split('—')
      .map((part) => part.trim())
    return {
      ...current,
      status: 'client_signed',
      lastChange: formatDisplayDate(now),
      clientSignature: {
        signerName: namePart || current.values.signatoryEn,
        signerTitle: titlePart || 'Authorised Signatory',
        signedAt: formatDisplayStamp(now),
        fingerprint: 'SHA256:8c41e9a0b32f71d4...5a19',
      },
      events: withEvent(current, createEvent('CLIENT_SIGNED', 'client', now)),
    }
  })
}

/** Countersigns the agreement. An amendment also replaces the version it amends. */
export function countersignAgreement(
  id: string,
): CertificationAgreement | null {
  const all = listCertificationAgreements()
  const current = all.find((item) => item.id === id)
  if (!current || current.status !== 'client_signed') return null

  const now = new Date().toISOString()
  const activated: CertificationAgreement = {
    ...current,
    status: 'active',
    lastChange: formatDisplayDate(now),
    cabSignature: {
      signerName: CAB_SIGNATORY.name,
      signerTitle: CAB_SIGNATORY.title,
      signedAt: formatDisplayStamp(now),
      fingerprint: 'SHA256:2f90d4c1e78a63b2...9c04',
    },
    events: withEvent(current, createEvent('COUNTERSIGNED', 'cab', now)),
  }

  const replacedId = current.amendmentOf?.id
  saveCertificationAgreements(
    all.map((item): CertificationAgreement => {
      if (item.id === id) return activated
      if (item.id === replacedId && item.status === 'active') {
        return {
          ...item,
          status: 'superseded',
          lastChange: formatDisplayDate(now),
          supersededBy: { id: current.id, reference: current.reference },
          events: withEvent(item, createEvent('SUPERSEDED', 'system', now)),
        }
      }
      return item
    }),
  )
  return activated
}

export function terminateAgreement(
  id: string,
  reason: string,
): CertificationAgreement | null {
  return applyTransition(id, ['sent', 'client_signed', 'active'], (current, now) => ({
    ...current,
    status: 'terminated',
    terminatedAt: now,
    terminationReason: reason.trim(),
    lastChange: formatDisplayDate(now),
    events: withEvent(current, createEvent('TERMINATED', 'cab', now, reason.trim())),
  }))
}

/** The amendment of this agreement that is still being drafted, sent or signed, if any. */
export function getAmendmentInProgress(
  id: string,
): CertificationAgreement | null {
  return (
    listCertificationAgreements().find(
      (item) =>
        item.amendmentOf?.id === id && IN_PROGRESS_STATUSES.includes(item.status),
    ) ?? null
  )
}

/** Creates a draft amendment (a new version) of an active agreement. */
export function createAgreementAmendment(
  id: string,
  reason: string,
): CertificationAgreement | null {
  const all = listCertificationAgreements()
  const current = all.find((item) => item.id === id)
  if (!current || current.status !== 'active') return null
  if (getAmendmentInProgress(id)) return null

  const now = new Date().toISOString()
  const number = current.values.agreementNumber
  const nextVersion =
    Math.max(
      ...all
        .filter((item) => item.values.agreementNumber === number)
        .map((item) => item.version),
    ) + 1

  const amendment: CertificationAgreement = {
    ...current,
    id: `${number}-V${nextVersion}`,
    reference: `${number} v${nextVersion}`,
    version: nextVersion,
    status: 'draft',
    kind: 'amendment',
    lastChange: formatDisplayDate(now),
    values: {
      ...current.values,
      agreementVersion: `v${nextVersion}.0`,
      agreementDate: formatDisplayDate(now),
    },
    clientSignature: undefined,
    cabSignature: undefined,
    sentAt: undefined,
    reminderCount: 0,
    lastReminderAt: undefined,
    supersededBy: undefined,
    terminatedAt: undefined,
    terminationReason: undefined,
    amendmentOf: {
      id: current.id,
      reference: current.reference,
      reason: reason.trim(),
    },
    events: [createEvent('AMENDMENT_CREATED', 'cab', now, reason.trim())],
  }
  saveCertificationAgreements([amendment, ...all])
  return amendment
}

/** Every version of the same agreement (original and amendments), oldest first. */
export function listAgreementVersions(
  agreement: CertificationAgreement,
): CertificationAgreement[] {
  return listCertificationAgreements()
    .filter(
      (item) => item.values.agreementNumber === agreement.values.agreementNumber,
    )
    .sort((a, b) => a.version - b.version)
}


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
