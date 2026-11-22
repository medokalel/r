import { authorizedRequest } from '@/lib/api/authorizedClient'

export type AuditPlanGateMode = 'block' | 'warn'

export interface AgreementSection {
  id: string
  titleEn: string
  titleAr: string
  textEn: string
  textAr: string
}

export interface AgreementTermsState {
  version: number
  savedBy: string
  savedAt: string
  auditPlanGate: AuditPlanGateMode
  sections: AgreementSection[]
}

export interface AgreementVariable {
  key: string
  tokenEn: string
  tokenAr: string
  labelEn: string
  labelAr: string
}

export const AGREEMENT_VARIABLES: AgreementVariable[] = [
  {
    key: 'agreementNumber',
    tokenEn: '{{agreement_number}}',
    tokenAr: '{{رقم_الاتفاقية}}',
    labelEn: 'Agreement number',
    labelAr: 'رقم الاتفاقية',
  },
  {
    key: 'agreementVersion',
    tokenEn: '{{agreement_version}}',
    tokenAr: '{{إصدار_الاتفاقية}}',
    labelEn: 'Agreement version',
    labelAr: 'إصدار الاتفاقية',
  },
  {
    key: 'agreementDate',
    tokenEn: '{{agreement_date}}',
    tokenAr: '{{تاريخ_الاتفاقية}}',
    labelEn: 'Agreement date',
    labelAr: 'تاريخ الاتفاقية',
  },
  {
    key: 'cabName',
    tokenEn: '{{cab_legal_name}}',
    tokenAr: '{{اسم_جهة_المنح}}',
    labelEn: 'CAB legal name',
    labelAr: 'الاسم القانوني لجهة المنح',
  },
  {
    key: 'clientName',
    tokenEn: '{{client_legal_name}}',
    tokenAr: '{{اسم_العميل}}',
    labelEn: 'Client legal name',
    labelAr: 'الاسم القانوني للعميل',
  },
  {
    key: 'clientCr',
    tokenEn: '{{client_cr_number}}',
    tokenAr: '{{السجل_التجاري}}',
    labelEn: 'Client CR number',
    labelAr: 'رقم السجل التجاري للعميل',
  },
  {
    key: 'clientCity',
    tokenEn: '{{client_city}}',
    tokenAr: '{{مدينة_العميل}}',
    labelEn: 'Client city',
    labelAr: 'مدينة العميل',
  },
  {
    key: 'standards',
    tokenEn: '{{standards}}',
    tokenAr: '{{المواصفات_القياسية}}',
    labelEn: 'Standards',
    labelAr: 'المواصفات القياسية',
  },
  {
    key: 'scope',
    tokenEn: '{{certification_scope}}',
    tokenAr: '{{نطاق_الشهادة}}',
    labelEn: 'Certification scope',
    labelAr: 'نطاق الشهادة',
  },
  {
    key: 'sitesCount',
    tokenEn: '{{sites_count}}',
    tokenAr: '{{عدد_المواقع}}',
    labelEn: 'Sites count',
    labelAr: 'عدد المواقع',
  },
  {
    key: 'totalFee',
    tokenEn: '{{total_fee}}',
    tokenAr: '{{إجمالي_الرسوم}}',
    labelEn: 'Total fee',
    labelAr: 'إجمالي الرسوم',
  },
  {
    key: 'signatory',
    tokenEn: '{{client_signatory}}',
    tokenAr: '{{المفوض_بالتوقيع}}',
    labelEn: 'Client signatory',
    labelAr: 'المفوض بالتوقيع',
  },
]

export const VARIABLE_PRESETS: Record<string, Record<string, string>> = {
  sample: {
    '{{agreement_number}}': 'AGR-2026-0104',
    '{{رقم_الاتفاقية}}': 'AGR-2026-0104',
    '{{agreement_version}}': 'v1.0',
    '{{إصدار_الاتفاقية}}': '1.0',
    '{{agreement_date}}': '04 Nov 2026',
    '{{تاريخ_الاتفاقية}}': '04 نوفمبر 2026',
    '{{cab_legal_name}}': 'iCASCO Certification Body Co.',
    '{{اسم_جهة_المنح}}': 'شركة أي كاسكو لمنح الشهادات',
    '{{client_legal_name}}': 'Al Noor Food Industries',
    '{{اسم_العميل}}': 'شركة النور للصناعات الغذائية',
    '{{client_cr_number}}': '4030192837',
    '{{السجل_التجاري}}': '4030192837',
    '{{client_city}}': 'Jeddah',
    '{{مدينة_العميل}}': 'جدة',
    '{{standards}}': 'ISO 9001:2015, ISO 22000:2018',
    '{{المواصفات_القياسية}}': 'ISO 9001:2015، ISO 22000:2018',
    '{{certification_scope}}': 'Food & Beverage Manufacturing',
    '{{نطاق_الشهادة}}': 'تصنيع وتعبئة الأغذية والمشروبات',
    '{{sites_count}}': '3',
    '{{عدد_المواقع}}': '3',
    '{{total_fee}}': '91,488 SAR',
    '{{إجمالي_الرسوم}}': '91,488 ر.س',
    '{{client_signatory}}': 'Sara Ali — Quality Manager',
    '{{المفوض_بالتوقيع}}': 'سارة علي — مديرة الجودة',
  },
}

export const DEFAULT_AGREEMENT_SECTIONS: AgreementSection[] = [
  {
    id: 'sec-1',
    titleEn: 'Parties and purpose',
    titleAr: 'الأطراف والغرض من الاتفاقية',
    textEn:
      'This Certification Agreement ({{agreement_number}}) is entered into on {{agreement_date}} between {{cab_legal_name}} and {{client_legal_name}} (CR: {{client_cr_number}}, {{client_city}}) in accordance with ISO/IEC 17021-1 clause 5.1.2.',
    textAr:
      'تُبرم اتفاقية منح الشهادة رقم {{رقم_الاتفاقية}} بتاريخ {{تاريخ_الاتفاقية}} بين {{اسم_جهة_المنح}} والعميل {{اسم_العميل}} المقيد بالسجل التجاري رقم {{السجل_التجاري}} في مدينة {{مدينة_العميل}}، وذلك لتنظيم إجراءات التدقيق ومنح الشهادة وفق متطلبات المواصفة القياسية الدولية البند 5.1.2.',
  },
  {
    id: 'sec-2',
    titleEn: 'Scope of certification',
    titleAr: 'نطاق منح الشهادة',
    textEn:
      'Certification covers {{standards}} for the scope "{{certification_scope}}" across {{sites_count}} registered site(s).',
    textAr:
      'يشمل نطاق منح الشهادة المواصفات القياسية {{المواصفات_القياسية}} لنشاط {{نطاق_الشهادة}} عبر {{عدد_المواقع}} مواقع مسجلة ومعتمدة لدى العميل.',
  },
  {
    id: 'sec-3',
    titleEn: 'Audit programme and surveillance',
    titleAr: 'برنامج التدقيق والمراقبة الدورية',
    textEn:
      'The certification cycle spans three (3) years including Stage 1, Stage 2, annual surveillance audits, and a recertification audit prior to expiry.',
    textAr:
      'تمتد دورة منح الشهادة لمدة ثلاث سنوات تشمل تدقيق المرحلة الأولى والمرحلة الثانية، وتدقيقات المراقبة السنوية الدورية، وتدقيق إعادة المنح قبل انتهاء صلاحية الشهادة.',
  },
  {
    id: 'sec-4',
    titleEn: 'Client obligations and access',
    titleAr: 'التزامات العميل وتمكين فريق التدقيق',
    textEn:
      '{{client_legal_name}} shall always fulfil the certification requirements, provide full access to all processes, sites, records, and personnel, and accommodate observers when required.',
    textAr:
      'يلتزم {{اسم_العميل}} باستيفاء متطلبات منح الشهادة بصفة مستمرة، وإتاحة الوصول الكامل لجميع العمليات والمواقع والسجلات والموظفين، وتمكين المراقبين المرافقين لفريق التدقيق عند الطلب.',
  },
  {
    id: 'sec-5',
    titleEn: 'Impartiality and independence',
    titleAr: 'الحيادية والاستقلالية',
    textEn:
      '{{cab_legal_name}} conducts all audit and certification decision activities impartially and independently from any consultancy or commercial pressure.',
    textAr:
      'تؤدي {{اسم_جهة_المنح}} جميع أنشطة التدقيق وقرارات منح الشهادة بحيادية واستقلالية تامة بعيداً عن أي ضغوط تجارية أو أعمال استشارية.',
  },
  {
    id: 'sec-6',
    titleEn: 'Confidentiality and data protection',
    titleAr: 'السرية وحماية البيانات',
    textEn:
      'All non-public information obtained during audit activities is treated as strictly confidential by {{cab_legal_name}} and its auditors.',
    textAr:
      'تُعامل جميع المعلومات والوثائق غير المعلنة التي يتم الاطلاع عليها أثناء أنشطة التدقيق بسرية تامة من قِبل {{اسم_جهة_المنح}} وفرق التدقيق التابعة لها.',
  },
  {
    id: 'sec-7',
    titleEn: 'Use of certificates and marks',
    titleAr: 'استخدام الشهادات وعلامات الاعتماد',
    textEn:
      '{{client_legal_name}} shall make claims regarding certification only in respect of the certified scope ({{certification_scope}}) and shall not use the mark in a misleading manner.',
    textAr:
      'يلتزم {{اسم_العميل}} بقصر الإشارة إلى الشهادة وعلامة المطابقة على النطاق المعتمد فقط وهو {{نطاق_الشهادة}}، وعدم استخدام الشهادة أو العلامة بأي طريقة مضللة.',
  },
  {
    id: 'sec-8',
    titleEn: 'Notification of changes',
    titleAr: 'الإخطار بالتغييرات الجوهرية',
    textEn:
      '{{client_legal_name}} shall inform {{cab_legal_name}} without delay of any change to legal status, ownership, management system, sites ({{sites_count}}), or scope.',
    textAr:
      'يلتزم {{اسم_العميل}} بإخطار {{اسم_جهة_المنح}} فوراً بأي تغيير يطرأ على الوضع القانوني أو الملكية أو نظام الإدارة أو عدد المواقع البالغ {{عدد_المواقع}} أو نطاق الأعمال.',
  },
  {
    id: 'sec-9',
    titleEn: 'Complaints and appeals',
    titleAr: 'الشكاوى والالتماسات',
    textEn:
      'Appeals against certification decisions and complaints are handled through an independent, documented process published by {{cab_legal_name}}.',
    textAr:
      'تُعالج الالتماسات ضد قرارات منح الشهادة والشكاوى وفق إجراءات موثقة ومستقلة ومعلنة لدى {{اسم_جهة_المنح}}.',
  },
  {
    id: 'sec-10',
    titleEn: 'Fees and payment terms',
    titleAr: 'الرسوم المالية وشروط السداد',
    textEn:
      'The agreed total certification fee is {{total_fee}}, payable according to the approved quotation and invoice schedule.',
    textAr:
      'تبلغ إجمالي رسوم منح الشهادة المتفق عليها {{إجمالي_الرسوم}}، وتُسدد وفق عرض السعر المعتمد وجدول الفواتير الصادر عن المنصة.',
  },
  {
    id: 'sec-11',
    titleEn: 'Suspension, withdrawal and reduction of scope',
    titleAr: 'تعليق أو سحب الشهادة أو تقليص النطاق',
    textEn:
      '{{cab_legal_name}} may suspend, withdraw, or reduce the scope of certification if {{client_legal_name}} fails to close major nonconformities or meet financial or surveillance obligations.',
    textAr:
      'يحق لـ {{اسم_جهة_المنح}} تعليق الشهادة أو سحبها أو تقليص نطاقها في حال عدم إغلاق حالات عدم المطابقة الجسيمة أو الإخلال بالتزامات المراقبة الدورية أو السداد المالي.',
  },
  {
    id: 'sec-12',
    titleEn: 'Transfer of certification',
    titleAr: 'نقل الشهادات المعتمدة',
    textEn:
      'Any transfer of an accredited certificate to or from {{cab_legal_name}} is subject to pre-transfer review in accordance with IAF MD 2.',
    textAr:
      'يخضع نقل أي شهادة معتمدة من أو إلى {{اسم_جهة_المنح}} لإجراءات المراجعة المسبقة وفق متطلبات الوثيقة الإلزامية الدولية لنقل الشهادات.',
  },
  {
    id: 'sec-13',
    titleEn: 'Term and termination',
    titleAr: 'مدة الاتفاقية وإنهاؤها',
    textEn:
      'This agreement remains valid throughout the active certification cycle unless terminated by either party with thirty (30) days written notice.',
    textAr:
      'تظل هذه الاتفاقية سارية طوال دورة الشهادة النشطة ما لم يتم إنهاؤها من قبل أحد الطرفين بموجب إشعار خطي مسبق مدته ثلاثون يوماً.',
  },
  {
    id: 'sec-14',
    titleEn: 'Electronic signature and governing terms',
    titleAr: 'التوقيع الإلكتروني والأحكام الختامية',
    textEn:
      'Executed electronically by {{client_signatory}} on behalf of {{client_legal_name}} under version {{agreement_version}}.',
    textAr:
      'تم التوقيع والاعتماد إلكترونياً بواسطة {{المفوض_بالتوقيع}} نيابةً عن {{اسم_العميل}} بموجب الإصدار {{إصدار_الاتفاقية}} من هذه الاتفاقية.',
  },
]

/** What the page shows until the CAB saves its own version: the default clauses, version 1. */
export const DEFAULT_AGREEMENT_TERMS: AgreementTermsState = {
  version: 1,
  savedBy: '',
  savedAt: '',
  auditPlanGate: 'block',
  sections: DEFAULT_AGREEMENT_SECTIONS,
}

/** Preview values for one registered audit client: its own data over the sample values for everything else. */
export function buildClientPreset(
  client: { name: string; city?: string | null; ownerName?: string | null },
  profile?: { commercialRegisterNumber?: string | null; authorizedPersonName?: string | null; city?: string | null } | null,
): Record<string, string> {
  const name = client.name
  const city = profile?.city || client.city || ''
  const signatory = profile?.authorizedPersonName || client.ownerName || ''
  const cr = profile?.commercialRegisterNumber || ''
  const own: Record<string, string> = {
    '{{client_legal_name}}': name,
    '{{اسم_العميل}}': name,
    '{{client_city}}': city,
    '{{مدينة_العميل}}': city,
    '{{client_cr_number}}': cr,
    '{{السجل_التجاري}}': cr,
    '{{client_signatory}}': signatory,
    '{{المفوض_بالتوقيع}}': signatory,
  }
  // Only override the sample when the client actually has a value.
  return { ...VARIABLE_PRESETS.sample, ...Object.fromEntries(Object.entries(own).filter(([, value]) => value)) }
}

export function interpolateAgreementText(
  text: string,
  presetKey: string,
  presets: Record<string, Record<string, string>> = VARIABLE_PRESETS,
): string {
  const map = presets[presetKey] ?? VARIABLE_PRESETS.sample
  return Object.entries(map).reduce(
    (acc, [token, val]) => acc.split(token).join(val),
    text,
  )
}

// --- Backend (GET/PUT /cab/agreement-terms) ---

interface AgreementTermsDto {
  auditPlanGate: AuditPlanGateMode
  version: number
  sections: AgreementSection[]
  savedBy: string | null
  savedAt: string
}

function fromDto(dto: AgreementTermsDto): AgreementTermsState {
  const savedAt = new Date(dto.savedAt)
  return {
    version: dto.version,
    savedBy: dto.savedBy ?? '',
    savedAt: `${savedAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} · ${savedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
    auditPlanGate: dto.auditPlanGate,
    sections: dto.sections,
  }
}

/** The CAB's saved terms, or null when it has not saved any yet. */
export async function fetchAgreementTerms(): Promise<AgreementTermsState | null> {
  const dto = await authorizedRequest<AgreementTermsDto | null>('/cab/agreement-terms')
  return dto ? fromDto(dto) : null
}

/** Saves the whole template; the backend bumps the version and records who saved it. */
export async function persistAgreementTerms(state: AgreementTermsState): Promise<AgreementTermsState> {
  const dto = await authorizedRequest<AgreementTermsDto>('/cab/agreement-terms', {
    method: 'PUT',
    body: JSON.stringify({ auditPlanGate: state.auditPlanGate, sections: state.sections }),
  })
  return fromDto(dto)
}
