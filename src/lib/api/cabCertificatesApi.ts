/*
 * No backend endpoint exists yet for the CAB certificate register, so this is
 * mock data shaped like the eventual response — only the function bodies
 * (listCabCertificates, getCertificatePreparation, issueCertificate) need to
 * change to call `authorizedClient`; the pages themselves need no edits.
 */

export type CertificateStatus = 'DRAFT' | 'ISSUED' | 'SUSPENDED' | 'WITHDRAWN'

export interface CertificateRegisterItem {
  id: string
  certificateNumber: string
  clientId: string
  clientName: string
  standard: string
  scope: string
  status: CertificateStatus
  /** ISO 3166-1 alpha-2 code, matched against getCountryOptions(). */
  countryCode: string
  issuedAt: string
  /** Empty until the certificate is issued. */
  validUntil: string | null
}

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const MOCK_CERTIFICATES: CertificateRegisterItem[] = [
  {
    id: '24',
    certificateNumber: 'CERT-0024',
    clientId: 'CL-0001',
    clientName: 'Al Noor Food Industries',
    standard: 'ISO 9001',
    scope: 'Manufacture and supply of food products, including processing, packaging and distribution.',
    status: 'DRAFT',
    countryCode: 'SA',
    issuedAt: '2025-04-15T10:24:00Z',
    validUntil: null,
  },
  {
    id: '23',
    certificateNumber: 'CERT-0023',
    clientId: 'CL-0005',
    clientName: 'Riyadh Packaging Co.',
    standard: 'ISO 22000',
    scope: 'Design and manufacture of food-grade packaging materials.',
    status: 'ISSUED',
    countryCode: 'SA',
    issuedAt: '2025-04-14T16:12:00Z',
    validUntil: '2028-04-13T00:00:00Z',
  },
  {
    id: '22',
    certificateNumber: 'CERT-0022',
    clientId: 'CL-0003',
    clientName: 'Green Fields Trading',
    standard: 'ISO 14001',
    scope: 'Import and distribution of agricultural equipment.',
    status: 'ISSUED',
    countryCode: 'EG',
    issuedAt: '2025-04-12T11:03:00Z',
    validUntil: '2028-04-11T00:00:00Z',
  },
  {
    id: '21',
    certificateNumber: 'CERT-0021',
    clientId: 'CL-0004',
    clientName: 'Desert Chemicals Ltd.',
    standard: 'ISO 45001',
    scope: 'Manufacture of industrial chemicals and solvents.',
    status: 'SUSPENDED',
    countryCode: 'AE',
    issuedAt: '2025-04-10T09:41:00Z',
    validUntil: '2027-04-09T00:00:00Z',
  },
  {
    id: '20',
    certificateNumber: 'CERT-0020',
    clientId: 'CL-0002',
    clientName: 'Red Sea Logistics',
    standard: 'ISO 9001',
    scope: 'Freight forwarding and warehousing services.',
    status: 'ISSUED',
    countryCode: 'SA',
    issuedAt: '2025-04-08T14:27:00Z',
    validUntil: '2028-04-07T00:00:00Z',
  },
  {
    id: '19',
    certificateNumber: 'CERT-0019',
    clientId: 'CL-0019',
    clientName: 'Apex Health Systems',
    standard: 'ISO 13485',
    scope: 'Manufacture of medical devices and accessories.',
    status: 'WITHDRAWN',
    countryCode: 'EG',
    issuedAt: '2022-01-20T00:00:00Z',
    validUntil: '2025-01-19T00:00:00Z',
  },
  {
    id: '17',
    certificateNumber: 'CERT-0017',
    clientId: 'CL-0008',
    clientName: 'Eastern Medical Supplies',
    standard: 'ISO 13485',
    scope: 'Distribution of medical consumables.',
    status: 'DRAFT',
    countryCode: 'QA',
    issuedAt: '2025-04-02T15:32:00Z',
    validUntil: null,
  },
  {
    id: '15',
    certificateNumber: 'CERT-0015',
    clientId: 'CL-0010',
    clientName: 'Sunrise Textiles',
    standard: 'ISO 9001',
    scope: 'Weaving and finishing of cotton textiles.',
    status: 'ISSUED',
    countryCode: 'EG',
    issuedAt: '2025-03-28T09:07:00Z',
    validUntil: '2028-03-27T00:00:00Z',
  },
]

export function listCabCertificates(): Promise<CertificateRegisterItem[]> {
  return delay().then(() => MOCK_CERTIFICATES)
}

/* ── Prepare certificate ──────────────────────────────────────────────── */

/** Languages a certificate document can be issued in. */
export type CertificateLanguage = 'en' | 'ar'

export interface CertificateSite {
  id: string
  name: string
  address: string
  scope: string
}

export interface CertificateOption {
  id: string
  name: string
}

export interface CertificateSignatory extends CertificateOption {
  /** Job title printed under the signatory's name, e.g. "Certification Director". */
  title: string
}

export interface CertificatePreparation {
  certificateId: string
  certificateNumber: string
  status: CertificateStatus
  standard: {
    code: string
    /** Localised standard title, printed on the certificate in its own language. */
    titles: Record<CertificateLanguage, string>
  }
  application: {
    number: string
    clientNumber: string
    legalName: string
    /** ISO 3166-1 alpha-2 code, matched against getCountryOptions(). */
    countryCode: string
    /** Legal address printed under the client name; empty falls back to the country. */
    legalAddress: string
    primaryContact: string
    email: string
  }
  decision: {
    number: string
    /** ISO date (YYYY-MM-DD). */
    date: string
    outcome: 'GRANTED'
    approvedScope: string
    approvedScopeDescription: string
    sites: CertificateSite[]
  }
  /** Values the form opens with — ISO dates (YYYY-MM-DD). */
  defaults: {
    issueDate: string
    effectiveDate: string
    expiryDate: string
    templateId: string
    language: CertificateLanguage
    signatoryId: string
    includeQrCode: boolean
    markIds: string[]
  }
  options: {
    templates: CertificateOption[]
    signatories: CertificateSignatory[]
    /** Marks the CAB is authorised to apply (configured in the CAB setup). */
    marks: CertificateOption[]
  }
}

export interface IssueCertificatePayload {
  issueDate: string
  effectiveDate: string
  expiryDate: string
  templateId: string
  language: CertificateLanguage
  signatoryId: string
  markIds: string[]
  includeQrCode: boolean
}

const STANDARD_TITLES: Record<string, Record<CertificateLanguage, string>> = {
  'ISO 9001': { en: 'Quality Management Systems', ar: 'أنظمة إدارة الجودة' },
  'ISO 14001': { en: 'Environmental Management Systems', ar: 'أنظمة الإدارة البيئية' },
  'ISO 22000': { en: 'Food Safety Management Systems', ar: 'أنظمة إدارة سلامة الغذاء' },
  'ISO 45001': {
    en: 'Occupational Health and Safety Management Systems',
    ar: 'أنظمة إدارة الصحة والسلامة المهنية',
  },
  'ISO 13485': {
    en: 'Medical Devices — Quality Management Systems',
    ar: 'الأجهزة الطبية — أنظمة إدارة الجودة',
  },
}

const MOCK_PREPARATION_OPTIONS: CertificatePreparation['options'] = {
  templates: [
    { id: 'tpl-controlled', name: 'Example CAB controlled template' },
    { id: 'tpl-accredited', name: 'Example CAB accredited template' },
  ],
  signatories: [
    { id: 'sig-rahman', name: 'Dr. Ahmed Rahman', title: 'Certification Director' },
    { id: 'sig-hassan', name: 'Layla Hassan', title: 'Quality Manager' },
  ],
  marks: [
    { id: 'mark-accreditation', name: 'Accreditation mark' },
    { id: 'mark-scheme', name: 'Scheme mark' },
  ],
}

function buildPreparation(item: CertificateRegisterItem): CertificatePreparation {
  const number = item.id.padStart(4, '0')
  // The first draft mirrors the design handoff so the page can be reviewed against it.
  const isHandoffSample = item.id === '24'

  return {
    certificateId: item.id,
    certificateNumber: item.certificateNumber,
    status: item.status,
    standard: {
      code: item.standard,
      titles: STANDARD_TITLES[item.standard] ?? { en: '', ar: '' },
    },
    application: {
      number: `APP-${number}`,
      clientNumber: item.clientId,
      legalName: item.clientName,
      countryCode: item.countryCode,
      legalAddress: isHandoffSample ? 'Riyadh, Saudi Arabia' : '',
      primaryContact: isHandoffSample ? 'Sara Ali' : '—',
      email: isHandoffSample ? 'sara@alnoor.example' : '—',
    },
    decision: {
      number: `DEC-${number}`,
      date: '2025-03-10',
      outcome: 'GRANTED',
      approvedScope: isHandoffSample ? 'Food packaging manufacture' : item.scope,
      approvedScopeDescription: isHandoffSample ? 'Manufacture of food packaging products.' : '',
      sites: [
        {
          id: 'SITE-001',
          name: `${item.clientName} - Main Facility`,
          address: isHandoffSample ? 'Riyadh, Saudi Arabia' : '—',
          scope: isHandoffSample ? 'Food packaging manufacture' : item.scope,
        },
      ],
    },
    defaults: {
      issueDate: '2025-03-10',
      effectiveDate: '2025-03-10',
      expiryDate: '2028-03-09',
      templateId: MOCK_PREPARATION_OPTIONS.templates[0].id,
      language: 'en',
      signatoryId: MOCK_PREPARATION_OPTIONS.signatories[0].id,
      includeQrCode: true,
      markIds: [],
    },
    options: MOCK_PREPARATION_OPTIONS,
  }
}

/** Returns null when the certificate does not exist (or is not visible to this CAB). */
export function getCertificatePreparation(certificateId: string): Promise<CertificatePreparation | null> {
  return delay().then(() => {
    const item = MOCK_CERTIFICATES.find((certificate) => certificate.id === certificateId)
    return item ? buildPreparation(item) : null
  })
}

/** Issues a prepared certificate. Only drafts can be issued; rejects otherwise. */
export function issueCertificate(certificateId: string, payload: IssueCertificatePayload): Promise<void> {
  void payload
  return delay(600).then(() => {
    const item = MOCK_CERTIFICATES.find((certificate) => certificate.id === certificateId)
    if (!item) throw new Error('Certificate not found.')
    if (item.status !== 'DRAFT') throw new Error('Only draft certificates can be issued.')
  })
}