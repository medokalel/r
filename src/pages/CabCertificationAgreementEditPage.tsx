import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { AgreementStatusBadge } from '@/components/dashboard/cab/agreements/AgreementStatusBadge'
import {
  AppIcon,
  BuildingsIcon,
  CheckIcon,
  FileTextIcon,
  InfoIcon,
} from '@/components/icons'
import { CabLayout } from '@/components/layout/CabLayout'
import { Button } from '@/components/ui/Button'
import { getAgreementStatusLabel } from '@/lib/agreementStatus'
import {
  getCertificationAgreementById,
  updateCertificationAgreementValues,
  type CertificationAgreement,
  type CertificationAgreementValues,
} from '@/lib/api/cabCertificationAgreementsApi'
import { getUserErrorMessage } from '@/lib/errorMessages'
import { ROUTES, cabCertificationAgreementDetailsPath } from '@/lib/routes'
import { toast } from '@/lib/toast'

interface FieldConfig {
  key: keyof CertificationAgreementValues
  labelAr: string
  labelEn: string
  dir: 'ltr' | 'rtl'
  numeric?: boolean
}

const CLIENT_FIELDS: FieldConfig[] = [
  { key: 'clientLegalNameAr', labelAr: 'الاسم القانوني للعميل (عربي)', labelEn: 'Client legal name (Arabic)', dir: 'rtl' },
  { key: 'clientLegalNameEn', labelAr: 'الاسم القانوني للعميل (إنجليزي)', labelEn: 'Client legal name (English)', dir: 'ltr' },
  { key: 'signatoryAr', labelAr: 'ممثل العميل (عربي)', labelEn: 'Client representative (Arabic)', dir: 'rtl' },
  { key: 'signatoryEn', labelAr: 'ممثل العميل (إنجليزي)', labelEn: 'Client representative (English)', dir: 'ltr' },
  { key: 'clientCityAr', labelAr: 'مدينة / عنوان العميل (عربي)', labelEn: 'Client city / address (Arabic)', dir: 'rtl' },
  { key: 'clientCityEn', labelAr: 'مدينة / عنوان العميل (إنجليزي)', labelEn: 'Client city / address (English)', dir: 'ltr' },
  { key: 'clientCrNumber', labelAr: 'رقم السجل التجاري', labelEn: 'Client CR number', dir: 'ltr' },
  { key: 'clientTradeName', labelAr: 'الاسم التجاري للعميل', labelEn: 'Client trade name', dir: 'ltr' },
  { key: 'clientAddress', labelAr: 'عنوان العميل', labelEn: 'Client address', dir: 'ltr' },
]

const OFFER_FIELDS: FieldConfig[] = [
  { key: 'offerRef', labelAr: 'مرجع العرض', labelEn: 'Offer reference', dir: 'ltr' },
  { key: 'totalFeeEn', labelAr: 'إجمالي الرسوم', labelEn: 'Total fee', dir: 'ltr' },
  { key: 'sitesCount', labelAr: 'عدد المواقع', labelEn: 'Number of sites', dir: 'ltr', numeric: true },
  { key: 'offerNumber', labelAr: 'رقم العرض', labelEn: 'Offer number', dir: 'ltr' },
  { key: 'applicationNumber', labelAr: 'رقم الطلب', labelEn: 'Application number', dir: 'ltr' },
  { key: 'currency', labelAr: 'العملة', labelEn: 'Currency', dir: 'ltr' },
  { key: 'paymentTerms', labelAr: 'شروط السداد', labelEn: 'Payment terms', dir: 'ltr' },
  { key: 'certificationCycleYears', labelAr: 'دورة الشهادة (بالسنوات)', labelEn: 'Certification cycle (years)', dir: 'ltr', numeric: true },
]

const SCOPE_FIELDS: FieldConfig[] = [
  { key: 'scopeAr', labelAr: 'نطاق الشهادة (عربي)', labelEn: 'Certification scope (Arabic)', dir: 'rtl' },
  { key: 'scopeEn', labelAr: 'نطاق الشهادة (إنجليزي)', labelEn: 'Certification scope (English)', dir: 'ltr' },
]

const inputClass =
  'h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-primary focus:outline-none'

const textareaClass =
  'min-h-[96px] w-full resize-y rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 py-2.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-primary focus:outline-none'

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-400 rtl-flip" aria-hidden>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CabCertificationAgreementEditPage() {
  const { agreementId } = useParams<{ agreementId: string }>()
  return <AgreementEditForm key={agreementId} agreementId={agreementId} />
}

function AgreementEditForm({ agreementId }: { agreementId?: string }) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isAr = Boolean(i18n.language?.startsWith('ar'))

  const [agreement, setAgreement] = useState<CertificationAgreement | null>(null)
  const [draftValues, setDraftValues] = useState<CertificationAgreementValues | null>(null)
  const [standardsText, setStandardsText] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!agreementId) {
      setLoading(false)
      return
    }
    let active = true
    getCertificationAgreementById(agreementId)
      .then((loaded) => {
        if (!active) return
        setAgreement(loaded)
        setDraftValues(loaded.values)
        setStandardsText(loaded.values.standards.join(', '))
      })
      .catch(() => undefined)
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [agreementId])

  const backToDetails = () =>
    navigate(agreementId ? cabCertificationAgreementDetailsPath(agreementId) : ROUTES.cabCertificationAgreements)

  if (loading) {
    return (
      <CabLayout>
        <CabHeader title={isAr ? 'تعديل قيم الاتفاقية' : 'Edit agreement values'} />
      </CabLayout>
    )
  }

  if (!agreement || !draftValues) {
    return (
      <CabLayout>
        <CabHeader title={isAr ? 'تعديل قيم الاتفاقية' : 'Edit agreement values'} />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <p className="text-[16px] font-bold text-neutral-700">
            {isAr ? 'لم يتم العثور على الاتفاقية المطلوبة' : 'Agreement not found'}
          </p>
          <Button variant="primary" onClick={() => navigate(ROUTES.cabCertificationAgreements)}>
            {isAr ? 'العودة إلى الاتفاقيات' : 'Back to agreements'}
          </Button>
        </main>
      </CabLayout>
    )
  }

  if (agreement.status !== 'draft') {
    return (
      <CabLayout>
        <CabHeader title={isAr ? 'تعديل قيم الاتفاقية' : 'Edit agreement values'} />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <p className="text-[16px] font-bold text-neutral-700">
            {isAr ? 'يمكن تعديل القيم في مرحلة المسودة فقط.' : 'Values can only be edited while the agreement is a draft.'}
          </p>
          <Button variant="primary" onClick={backToDetails}>
            {isAr ? 'العودة إلى الاتفاقية' : 'Back to agreement'}
          </Button>
        </main>
      </CabLayout>
    )
  }

  const parsedStandards = standardsText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const handleFieldChange = (field: FieldConfig, raw: string) => {
    setDraftValues({
      ...draftValues,
      [field.key]: field.numeric ? Math.max(Number(raw.replace(/\D/g, '')), 1) : raw,
      ...(field.key === 'totalFeeEn' ? { totalFeeAr: raw.replace('SAR', 'ر.س') } : {}),
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await updateCertificationAgreementValues(agreement.id, {
        ...draftValues,
        standards: parsedStandards,
      })
      toast.success(isAr ? 'تم حفظ قيم الاتفاقية' : 'Agreement values saved')
      navigate(cabCertificationAgreementDetailsPath(agreement.id), { replace: true })
    } catch (error) {
      toast.error(getUserErrorMessage(error, t))
    } finally {
      setBusy(false)
    }
  }

  return (
    <CabLayout>
      <CabHeader title={isAr ? 'اتفاقيات منح الشهادة' : 'Certification agreements'} notificationCount={3} />

      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        {/* Breadcrumb */}
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]" aria-label="breadcrumb">
          <Link to={ROUTES.workspace} className="font-light text-neutral-400 hover:text-primary">
            {isAr ? 'مركز التطبيقات' : 'Application Hub'}
          </Link>
          <Chevron />
          <Link to={ROUTES.cabCertificationAgreements} className="font-light text-neutral-400 hover:text-primary">
            {isAr ? 'اتفاقيات منح الشهادة' : 'Certification agreements'}
          </Link>
          <Chevron />
          <Link to={cabCertificationAgreementDetailsPath(agreement.id)} className="font-light text-neutral-400 hover:text-primary" dir="ltr">
            {agreement.reference}
          </Link>
          <Chevron />
          <span className="font-medium text-neutral-700">{isAr ? 'تعديل القيم' : 'Edit values'}</span>
        </nav>

        {/* iCASCO Page Header Bar */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-[28px] font-bold leading-tight text-neutral-900">
              {isAr ? 'تعديل قيم الاتفاقية' : 'Edit agreement values'}{' '}
              <span className="text-primary" dir="ltr">{agreement.reference}</span>
            </h1>
            <p className="mt-1 text-[14px] text-neutral-500">
              {isAr
                ? 'تملأ هذه القيم متغيرات نص الاتفاقية، وتُطبّق التغييرات على هذه المسودة فقط.'
                : 'These values populate the agreement clause variables and apply to this draft only.'}
            </p>
          </div>

          <button
            type="button"
            onClick={backToDetails}
            className="flex h-11 shrink-0 items-center gap-2 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="rtl-flip"
              aria-hidden
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>{isAr ? 'العودة إلى الاتفاقية' : 'Back to agreement'}</span>
          </button>
        </div>

        <form onSubmit={(e) => void handleSave(e)} className="grid grid-cols-1 items-start gap-5 xl:grid-cols-12">
          {/* Left Form Columns (8 cols) */}
          <div className="flex flex-col gap-5 xl:col-span-8">
            {/* Section 1: Client & Signatory Details */}
            <section className="rounded-[16px] border border-[#ececec] bg-white p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-2.5 border-b border-[#f0f0f0] pb-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#e8edfc] text-primary">
                  <AppIcon icon={BuildingsIcon} size={18} />
                </span>
                <div>
                  <h2 className="text-[16px] font-bold text-neutral-900">
                    {isAr ? 'بيانات العميل والتمثيل القانوني' : 'Client & signatory information'}
                  </h2>
                  <p className="text-[12px] text-neutral-500">
                    {isAr ? 'الاسم القانوني والعنوان والسجل التجاري والمفوض بالتوقيع.' : 'Legal entity name, address, CR number, and authorised signatory.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {CLIENT_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-neutral-800">
                      {isAr ? field.labelAr : field.labelEn}
                    </label>
                    <input
                      type="text"
                      dir={field.dir}
                      value={String(draftValues[field.key] ?? '')}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Section 2: Standards, Scope & Offer */}
            <section className="rounded-[16px] border border-[#ececec] bg-white p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-2.5 border-b border-[#f0f0f0] pb-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#eafaf1] text-[#16a34a]">
                  <AppIcon icon={FileTextIcon} size={18} />
                </span>
                <div>
                  <h2 className="text-[16px] font-bold text-neutral-900">
                    {isAr ? 'نطاق الشهادة والمواصفات والعرض المالي' : 'Certification scope, standards & offer'}
                  </h2>
                  <p className="text-[12px] text-neutral-500">
                    {isAr ? 'المواصفات القياسية وعدد المواقع ونطاق المنح ومرجع العرض.' : 'Applicable standards, site count, scope wording, and offer reference.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {OFFER_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-neutral-800">
                      {isAr ? field.labelAr : field.labelEn}
                    </label>
                    <input
                      type="text"
                      dir={field.dir}
                      value={String(draftValues[field.key] ?? '')}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-1.5">
                <label className="block text-[13px] font-medium text-neutral-800">
                  {isAr ? 'المواصفات القياسية (افصل بينها بفاصلة)' : 'Standards (comma separated)'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={standardsText}
                  onChange={(e) => setStandardsText(e.target.value)}
                  className={inputClass}
                />
                {parsedStandards.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {parsedStandards.map((std) => (
                      <span
                        key={std}
                        dir="ltr"
                        className="rounded-[4px] bg-[#e8edfc] px-2.5 py-0.5 text-[12px] font-medium text-primary"
                      >
                        {std}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-4 border-t border-[#f0f0f0] pt-4">
                {SCOPE_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-neutral-800">
                      {isAr ? field.labelAr : field.labelEn}
                    </label>
                    <textarea
                      dir={field.dir}
                      value={String(draftValues[field.key] ?? '')}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      className={textareaClass}
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Sticky Summary & Actions Sidebar (4 cols) */}
          <aside className="flex flex-col gap-5 xl:col-span-4 xl:sticky xl:top-6">
            <section className="rounded-[16px] border border-[#ececec] bg-white p-5">
              <div className="flex items-center justify-between gap-2 border-b border-[#ececec] pb-3.5">
                <h3 className="text-[15px] font-bold text-neutral-900">
                  {isAr ? 'ملخص المسودة' : 'Draft summary'}
                </h3>
                <AgreementStatusBadge
                  status={agreement.status}
                  label={getAgreementStatusLabel(agreement.status, isAr)}
                />
              </div>

              <div className="mt-4 space-y-3 text-[13px]">
                <div>
                  <p className="text-[12px] font-medium text-neutral-500">{isAr ? 'مرجع الاتفاقية' : 'Reference'}</p>
                  <p className="mt-0.5 font-bold text-primary" dir="ltr">{agreement.reference}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium text-neutral-500">{isAr ? 'العميل' : 'Client'}</p>
                  <p className="mt-0.5 font-semibold text-neutral-900">
                    {(isAr ? draftValues.clientLegalNameAr : draftValues.clientLegalNameEn) || '—'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-[#f0f0f0] pt-3">
                  <div>
                    <p className="text-[12px] font-medium text-neutral-500">{isAr ? 'العرض المالي' : 'Offer ref'}</p>
                    <p className="mt-0.5 font-semibold text-neutral-900" dir="ltr">{draftValues.offerRef || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-neutral-500">{isAr ? 'عدد المواقع' : 'Sites'}</p>
                    <p className="mt-0.5 font-semibold text-neutral-900">{draftValues.sitesCount}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2.5 rounded-[10px] border border-[#d6e2ff] bg-[#f4f7ff] p-3 text-[12px] leading-relaxed text-primary">
                <AppIcon icon={InfoIcon} size={16} className="mt-0.5 shrink-0" />
                <span>
                  {isAr
                    ? 'تُحدّث هذه القيم متغيرات نص الاتفاقية لهذه المسودة فقط دون تعديل القالب العام.'
                    : 'Saving updates the clause variables for this draft only without altering the global template.'}
                </span>
              </div>

              <div className="mt-5 flex flex-col gap-2.5 border-t border-[#f0f0f0] pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={busy}
                  icon={<AppIcon icon={CheckIcon} size={18} />}
                  className="h-11 w-full"
                >
                  {isAr ? 'حفظ التغييرات' : 'Save changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={backToDetails}
                  className="h-11 w-full"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </section>
          </aside>
        </form>
      </main>
    </CabLayout>
  )
}

export default CabCertificationAgreementEditPage
