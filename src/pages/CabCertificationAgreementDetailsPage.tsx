import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { AgreementDocumentView } from '@/components/dashboard/cab/agreements/AgreementDocumentView'
import {
  AppIcon,
  BuildingsIcon,
  CheckIcon,
  EditIcon,
  ExportIcon,
  FileTextIcon,
  PdfFileIcon,
  RefreshIcon,
  SuccessCircleIcon,
  UserIcon,
} from '@/components/icons'
import { CabLayout } from '@/components/layout/CabLayout'
import { Button } from '@/components/ui/Button'
import { getAgreementTermsState } from '@/lib/api/cabAgreementTermsApi'
import { downloadAgreementPdf } from '@/lib/api/agreementPdfGenerator'
import {
  getCertificationAgreementById,
  updateCertificationAgreement,
  type CertificationAgreement,
  type CertificationAgreementStatus,
} from '@/lib/api/cabCertificationAgreementsApi'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-400 rtl-flip" aria-hidden>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SummaryDivider() {
  return <div className="hidden w-px self-stretch bg-[#ececec] lg:block" aria-hidden />
}

const STEPS: { key: CertificationAgreementStatus; labelEn: string; labelAr: string; subEn: string; subAr: string }[] = [
  { key: 'draft', labelEn: 'Draft prepared', labelAr: 'إعداد المسودة', subEn: 'Generated from accepted offer', subAr: 'مبنية على العرض المقبول' },
  { key: 'sent', labelEn: 'Sent to client', labelAr: 'إرسال للعميل', subEn: 'Awaiting client e-signature', subAr: 'بانتظار توقيع العميل' },
  { key: 'signed_by_client', labelEn: 'Signed by client', labelAr: 'توقيع العميل', subEn: 'Ready for CAB countersignature', subAr: 'جاهزة للتوقيع المشترك' },
  { key: 'active', labelEn: 'Active & in force', labelAr: 'سارية ونشطة', subEn: 'Audit plan gate unlocked', subAr: 'بوابة خطة التدقيق مفعّلة' },
]

const STATUS_BADGE_STYLES: Record<CertificationAgreementStatus, string> = {
  draft: 'bg-[#f1f5f9] text-[#475569]',
  sent: 'bg-[#fef9c3] text-[#a16207]',
  signed_by_client: 'bg-[#e8edfc] text-primary',
  active: 'bg-[#dcfce7] text-[#15803d]',
}

export function CabCertificationAgreementDetailsPage() {
  const { agreementId } = useParams<{ agreementId: string }>()
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const isAr = Boolean(i18n.language?.startsWith('ar'))

  const [agreement, setAgreement] = useState<CertificationAgreement | null>(() =>
    agreementId ? getCertificationAgreementById(agreementId) : null,
  )
  const [docLang, setDocLang] = useState<'en' | 'ar'>(isAr ? 'ar' : 'en')
  const [isEditingValues, setIsEditingValues] = useState(false)
  const [draftValues, setDraftValues] = useState(() => agreement?.values ?? null)
  const [syncedNotice, setSyncedNotice] = useState(false)

  if (!agreement || !draftValues) {
    return (
      <CabLayout>
        <CabHeader title={isAr ? 'اتفاقيات منح الشهادة' : 'Certification agreements'} />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <p className="text-[16px] font-bold text-neutral-700">{isAr ? 'لم يتم العثور على الاتفاقية المطلوبة' : 'Agreement not found'}</p>
          <Button variant="primary" onClick={() => navigate(ROUTES.cabCertificationAgreements)}>{isAr ? 'العودة إلى الاتفاقيات' : 'Back to agreements'}</Button>
        </main>
      </CabLayout>
    )
  }

  const currentStepIndex = STEPS.findIndex((s) => s.key === agreement.status)

  const todayStamp = () => {
    const now = new Date()
    const d = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const t = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    return { dateOnly: d, full: `${d} · ${t}` }
  }

  const handleAdvanceLifecycle = () => {
    const stamp = todayStamp()
    let updated: CertificationAgreement = { ...agreement, lastChange: stamp.dateOnly }
    if (agreement.status === 'draft') {
      updated = { ...updated, status: 'sent' }
    } else if (agreement.status === 'sent') {
      const [namePart, titlePart] = agreement.values.signatoryEn.split('—').map((s) => s.trim())
      updated = {
        ...updated,
        status: 'signed_by_client',
        clientSignature: {
          signerName: namePart || agreement.values.signatoryEn,
          signerTitle: titlePart || 'Authorised Signatory',
          signedAt: stamp.full,
          fingerprint: 'SHA256:8c41e9a0b32f71d4...5a19',
        },
      }
    } else if (agreement.status === 'signed_by_client') {
      updated = {
        ...updated,
        status: 'active',
        cabSignature: {
          signerName: 'Mohamed El Manawahly',
          signerTitle: 'Certification Body Director',
          signedAt: stamp.full,
          fingerprint: 'SHA256:2f90d4c1e78a63b2...9c04',
        },
      }
    }
    updateCertificationAgreement(updated)
    setAgreement(updated)
  }

  const handleSaveValues = () => {
    const stamp = todayStamp()
    const updated: CertificationAgreement = { ...agreement, lastChange: stamp.dateOnly, values: draftValues }
    updateCertificationAgreement(updated)
    setAgreement(updated)
    setIsEditingValues(false)
  }

  const handleUseLatestTerms = () => {
    const latest = getAgreementTermsState()
    const stamp = todayStamp()
    const nextVer = agreement.version + 1
    const updated: CertificationAgreement = {
      ...agreement,
      version: nextVer,
      reference: `${agreement.id} v${nextVer}`,
      lastChange: stamp.dateOnly,
      sections: latest.sections,
      values: { ...agreement.values, agreementVersion: `v${latest.version}.0` },
    }
    updateCertificationAgreement(updated)
    setAgreement(updated)
    setDraftValues(updated.values)
    setSyncedNotice(true)
    setTimeout(() => setSyncedNotice(false), 2500)
  }

  const editableFields = [
    { key: 'clientLegalNameAr' as const, label: isAr ? 'اسم العميل (عربي)' : 'Client legal name (Arabic)', dir: 'rtl' as const },
    { key: 'clientLegalNameEn' as const, label: isAr ? 'اسم العميل (إنجليزي)' : 'Client legal name (English)', dir: 'ltr' as const },
    { key: 'clientCrNumber' as const, label: isAr ? 'رقم السجل التجاري' : 'Client CR number', dir: 'ltr' as const },
    { key: 'scopeAr' as const, label: isAr ? 'نطاق الشهادة (عربي)' : 'Certification scope (Arabic)', dir: 'rtl' as const },
    { key: 'scopeEn' as const, label: isAr ? 'نطاق الشهادة (إنجليزي)' : 'Certification scope (English)', dir: 'ltr' as const },
    { key: 'totalFeeEn' as const, label: isAr ? 'إجمالي الرسوم' : 'Total fee', dir: 'ltr' as const },
  ]

  return (
    <CabLayout>
      <CabHeader title={isAr ? 'اتفاقيات منح الشهادة' : 'Certification agreements'} notificationCount={3} />

      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]" aria-label="breadcrumb">
          <Link to={ROUTES.workspace} className="font-light text-neutral-400 hover:text-primary">{isAr ? 'مركز التطبيقات' : 'Application Hub'}</Link>
          <Chevron />
          <Link to={ROUTES.cabCertificationAgreements} className="font-light text-neutral-400 hover:text-primary">{isAr ? 'اتفاقيات منح الشهادة' : 'Certification agreements'}</Link>
          <Chevron />
          <span className="font-medium text-neutral-700" dir="ltr">{agreement.reference}</span>
        </nav>

        {/* iCASCO Page Title + Lifecycle Action Bar */}
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0">
            <h1 className="text-[28px] font-bold leading-tight text-neutral-900">
              {isAr ? 'اتفاقية منح الشهادة' : 'Certification agreement'} <span dir="ltr">{agreement.reference}</span>
            </h1>
            <p className="mt-1 text-[14px] text-neutral-500">
              {isAr ? 'إدارة دورة اعتماد الاتفاقية والتوقيعات الإلكترونية وبنود التعاقد وفق ISO/IEC 17021-1 (5.1.2).' : 'Manage the certification agreement lifecycle, electronic signatures, and clause values under ISO/IEC 17021-1 (5.1.2).'}
            </p>
          </div>

          <div className="flex w-full shrink-0 flex-wrap items-center gap-2.5 lg:w-auto lg:flex-nowrap">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingValues((p) => !p)} icon={<AppIcon icon={EditIcon} size={16} />} className="h-11 whitespace-nowrap">
              {isAr ? 'تعديل القيم' : 'Edit values'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleUseLatestTerms} icon={<AppIcon icon={syncedNotice ? CheckIcon : RefreshIcon} size={16} />} className="h-11 whitespace-nowrap">
              {syncedNotice ? (isAr ? 'تم التحديث' : 'Updated') : (isAr ? 'أحدث الشروط' : 'Use latest terms')}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => downloadAgreementPdf(agreement, docLang)} icon={<AppIcon icon={PdfFileIcon} size={18} />} className="h-11 whitespace-nowrap">
              {isAr ? 'تحميل PDF' : 'Download PDF'}
            </Button>
            {agreement.status !== 'active' && (
              <Button type="button" variant="primary" size="sm" onClick={handleAdvanceLifecycle} icon={<AppIcon icon={agreement.status === 'draft' ? ExportIcon : SuccessCircleIcon} size={18} />} className="h-11 whitespace-nowrap">
                {agreement.status === 'draft' ? (isAr ? 'إرسال للعميل' : 'Send to client') : agreement.status === 'sent' ? (isAr ? 'تسجيل توقيع العميل' : 'Record client signature') : (isAr ? 'التوقيع المشترك والتفعيل' : 'Countersign & activate')}
              </Button>
            )}
          </div>
        </div>

        {/* iCASCO Client + Agreement Summary Strip Card (Matches CabManageCertificationCyclePage) */}
        <section className="flex flex-col gap-5 rounded-[16px] border border-[#ececec] bg-white p-5 lg:flex-row lg:items-stretch lg:gap-6">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-[12px] bg-[#e8edfc] text-primary">
              <AppIcon icon={BuildingsIcon} size={26} />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-[18px] font-bold text-neutral-900">
                {isAr ? agreement.values.clientLegalNameAr : agreement.values.clientLegalNameEn}
              </h2>
              <p className="mt-0.5 text-[13px] text-neutral-500">
                {isAr ? 'سجل تجاري:' : 'CR:'} <span dir="ltr">{agreement.values.clientCrNumber}</span>
                <span className="mx-1.5 text-neutral-300">|</span>
                {isAr ? agreement.values.clientCityAr : agreement.values.clientCityEn}
              </p>
            </div>
          </div>

          <SummaryDivider />

          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="mt-0.5 shrink-0 text-neutral-400">
              <AppIcon icon={UserIcon} size={22} />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-neutral-500">{isAr ? 'المفوض بالتوقيع لدى العميل' : 'Authorised signatory'}</p>
              <p className="mt-0.5 truncate text-[15px] font-semibold text-neutral-900">
                {isAr ? agreement.values.signatoryAr : agreement.values.signatoryEn}
              </p>
              <p className="mt-0.5 text-[12px] text-neutral-500">{isAr ? `${agreement.values.sitesCount} مواقع مسجلة` : `${agreement.values.sitesCount} registered sites`}</p>
            </div>
          </div>

          <SummaryDivider />

          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="mt-0.5 shrink-0 text-neutral-400">
              <AppIcon icon={FileTextIcon} size={22} />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-neutral-500">{isAr ? 'العرض المالي المرتبط' : 'Linked offer & fee'}</p>
              <p className="mt-0.5 text-[16px] font-bold text-primary" dir="ltr">{agreement.values.offerRef}</p>
              <p className="mt-0.5 text-[13px] font-semibold text-neutral-800">{isAr ? agreement.values.totalFeeAr : agreement.values.totalFeeEn}</p>
            </div>
          </div>

          <SummaryDivider />

          <div className="flex shrink-0 flex-col justify-center">
            <span className={cn('inline-flex w-fit items-center justify-center rounded-[4px] px-3 py-1 text-[12px] font-medium whitespace-nowrap', STATUS_BADGE_STYLES[agreement.status])}>
              {isAr ? STEPS[currentStepIndex]?.labelAr : STEPS[currentStepIndex]?.labelEn}
            </span>
            <p className="mt-2 text-[12px] text-neutral-500">
              {isAr ? 'تاريخ الإصدار:' : 'Issued:'} <span dir="ltr">{agreement.values.agreementDate}</span>
            </p>
            <p className="text-[12px] text-neutral-500">
              {isAr ? 'آخر تحديث:' : 'Updated:'} <span dir="ltr">{agreement.lastChange}</span>
            </p>
          </div>
        </section>

        {/* iCASCO Connected Horizontal Lifecycle Timeline Card (Matches CertificationCycleTimeline) */}
        <section className="rounded-[16px] border border-[#ececec] bg-white p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-neutral-900">
              {isAr ? 'مراحل اعتماد الاتفاقية' : 'Agreement approval timeline'}
            </h2>
            <span className="text-[12px] text-neutral-500" dir="ltr">ISO/IEC 17021-1 · 5.1.2</span>
          </div>

          <ol className="flex w-full items-start">
            {STEPS.map((step, idx) => {
              const isLast = idx === STEPS.length - 1
              const isCompleted = idx < currentStepIndex || agreement.status === 'active'
              const isCurrent = idx === currentStepIndex && agreement.status !== 'active'
              return (
                <li key={step.key} className="relative flex min-w-0 flex-1 flex-col items-center text-center">
                  {!isLast && (
                    <span className={cn('absolute top-[15px] start-1/2 h-0.5 w-full', isCompleted ? 'bg-primary' : 'bg-[#e0e0e0]')} aria-hidden />
                  )}
                  <span className={cn('relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2', isCompleted && 'border-primary bg-primary text-white', isCurrent && 'border-primary bg-white text-primary', !isCompleted && !isCurrent && 'border-[#e0e0e0] bg-white text-neutral-400')}>
                    {isCompleted ? <AppIcon icon={CheckIcon} size={16} /> : <span className={cn('size-2 rounded-full', isCurrent ? 'bg-primary' : 'bg-[#e0e0e0]')} />}
                  </span>
                  <p className="mt-2.5 text-[13px] font-semibold text-neutral-900">{isAr ? step.labelAr : step.labelEn}</p>
                  <p className="mt-0.5 max-w-[160px] text-[11px] text-neutral-500">{isAr ? step.subAr : step.subEn}</p>
                  <span className={cn('mt-2 rounded-[4px] px-2.5 py-0.5 text-[11px] font-medium', isCompleted && 'bg-[#dcfce7] text-[#15803d]', isCurrent && 'bg-[#e8edfc] text-primary', !isCompleted && !isCurrent && 'bg-[#f1f5f9] text-[#475569]')}>
                    {isCompleted ? (isAr ? 'مكتمل' : 'Completed') : isCurrent ? (isAr ? 'المرحلة الحالية' : 'Current stage') : (isAr ? 'قادم' : 'Pending')}
                  </span>
                </li>
              )
            })}
          </ol>
        </section>

        {isEditingValues && (
          <section className="rounded-[16px] border-2 border-primary bg-white p-5 shadow-sm">
            <h3 className="mb-4 border-b border-[#f0f0f0] pb-3 text-[16px] font-bold text-neutral-900">
              {isAr ? 'تعديل قيم ومتغيرات الاتفاقية' : 'Edit agreement variable values'}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {editableFields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="block text-[12px] font-semibold text-neutral-700">{field.label}</label>
                  <input
                    type="text"
                    dir={field.dir}
                    value={String(draftValues[field.key])}
                    onChange={(e) => setDraftValues({ ...draftValues, [field.key]: e.target.value, ...(field.key === 'totalFeeEn' ? { totalFeeAr: e.target.value.replace('SAR', 'ر.س') } : {}) })}
                    className="h-11 w-full rounded-[10px] border border-[#e2e2e2] px-3.5 text-[14px] outline-none focus:border-primary"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2.5 border-t border-[#f0f0f0] pt-3.5">
              <Button type="button" variant="outline" onClick={() => setIsEditingValues(false)} className="h-10 rounded-[10px] px-4 text-[13px]">{isAr ? 'إلغاء' : 'Cancel'}</Button>
              <Button type="button" variant="primary" onClick={handleSaveValues} icon={<AppIcon icon={CheckIcon} size={16} />} className="h-10 rounded-[10px] px-5 text-[13px]">{isAr ? 'حفظ التغييرات' : 'Save changes'}</Button>
            </div>
          </section>
        )}

        <AgreementDocumentView agreement={agreement} docLang={docLang} onChangeDocLang={setDocLang} isAr={isAr} />
      </main>
    </CabLayout>
  )
}

export default CabCertificationAgreementDetailsPage
