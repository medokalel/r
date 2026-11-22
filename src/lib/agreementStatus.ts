import type {
  CertificationAgreementKind,
  CertificationAgreementStatus,
} from '@/lib/api/cabCertificationAgreementsApi'

/** Every status, in the order shown in filters and the pipeline view. */
export const AGREEMENT_STATUSES: readonly CertificationAgreementStatus[] = [
  'draft',
  'sent',
  'client_signed',
  'active',
  'superseded',
  'terminated',
]

/** The statuses of the signing flow itself (superseded and terminated end it). */
export const AGREEMENT_FLOW_STATUSES: readonly CertificationAgreementStatus[] = [
  'draft',
  'sent',
  'client_signed',
  'active',
]

interface BilingualLabel {
  en: string
  ar: string
}

const STATUS_LABELS: Record<CertificationAgreementStatus, BilingualLabel> = {
  draft: { en: 'Draft', ar: 'مسودة' },
  sent: { en: 'Sent', ar: 'مُرسلة للعميل' },
  client_signed: { en: 'Signed by client', ar: 'موقعة من العميل' },
  active: { en: 'Active', ar: 'سارية ونشطة' },
  superseded: { en: 'Superseded', ar: 'تم استبدالها' },
  terminated: { en: 'Terminated', ar: 'مُنهاة' },
}

const NEXT_STEP_LABELS: Record<CertificationAgreementStatus, BilingualLabel> = {
  draft: { en: 'Review and send', ar: 'مراجعة وإرسال للعميل' },
  sent: { en: 'Waiting for the client to sign', ar: 'بانتظار توقيع العميل' },
  client_signed: { en: 'Countersign', ar: 'التوقيع المشترك والتفعيل' },
  active: { en: 'In force', ar: 'سارية المفعول' },
  superseded: { en: 'Replaced by a newer version', ar: 'استُبدلت بإصدار أحدث' },
  terminated: { en: 'No action', ar: 'لا يوجد إجراء' },
}

const KIND_LABELS: Record<CertificationAgreementKind, BilingualLabel> = {
  original: { en: 'Certification agreement', ar: 'اتفاقية منح شهادة' },
  amendment: { en: 'Amendment', ar: 'تعديل على الاتفاقية' },
}

const pick = (label: BilingualLabel, isAr: boolean) => (isAr ? label.ar : label.en)

export const getAgreementStatusLabel = (
  status: CertificationAgreementStatus,
  isAr: boolean,
) => pick(STATUS_LABELS[status], isAr)

export const getAgreementNextStepLabel = (
  status: CertificationAgreementStatus,
  isAr: boolean,
) => pick(NEXT_STEP_LABELS[status], isAr)

export const getAgreementKindLabel = (
  kind: CertificationAgreementKind,
  isAr: boolean,
) => pick(KIND_LABELS[kind], isAr)
