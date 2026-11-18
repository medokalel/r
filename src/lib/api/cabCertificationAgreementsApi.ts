import {
  getAgreementTermsState,
  type AgreementSection,
} from '@/lib/api/cabAgreementTermsApi'

export type CertificationAgreementStatus =
  | 'draft'
  | 'sent'
  | 'signed_by_client'
  | 'active'

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
  lastChange: string
  values: CertificationAgreementValues
  sections: AgreementSection[]
  clientSignature?: AgreementSignRecord
  cabSignature?: AgreementSignRecord
}

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

function buildDefaultAgreements(): CertificationAgreement[] {
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
      status: 'signed_by_client',
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

export function listCertificationAgreements(): CertificationAgreement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const defaults = buildDefaultAgreements()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
      return defaults
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : buildDefaultAgreements()
  } catch {
    return buildDefaultAgreements()
  }
}

export function saveCertificationAgreements(
  items: CertificationAgreement[],
): CertificationAgreement[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Ignore storage errors
  }
  return items
}

export function getCertificationAgreementById(
  id: string,
): CertificationAgreement | null {
  const all = listCertificationAgreements()
  return all.find((item) => item.id === id) ?? null
}

export function generateCertificationAgreement(
  clientId: string,
): CertificationAgreement {
  const all = listCertificationAgreements()
  const offer =
    ELIGIBLE_CLIENT_OFFERS.find((c) => c.clientId === clientId) ??
    ELIGIBLE_CLIENT_OFFERS[0]
  const terms = getAgreementTermsState()
  const nextNumber = all.length + 1
  const id = `AGR-${String(nextNumber).padStart(4, '0')}`
  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const created: CertificationAgreement = {
    id,
    reference: `${id} v1`,
    version: 1,
    status: 'draft',
    lastChange: today,
    sections: terms.sections,
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
}

export function updateCertificationAgreement(
  updated: CertificationAgreement,
): CertificationAgreement {
  const all = listCertificationAgreements()
  const next = all.map((item) => (item.id === updated.id ? updated : item))
  saveCertificationAgreements(next)
  return updated
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
