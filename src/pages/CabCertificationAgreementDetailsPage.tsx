import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { AgreementDocumentView } from '@/components/dashboard/cab/agreements/AgreementDocumentView'
import { AgreementStatusBadge } from '@/components/dashboard/cab/agreements/AgreementStatusBadge'
import { CalloutCard } from '@/components/dashboard/cab/ReviewPrimitives'
import {
  AppIcon,
  BuildingsIcon,
  CheckIcon,
  EditIcon,
  ErrorCircleIcon,
  ExportIcon,
  FileTextIcon,
  InfoIcon,
  NotificationIcon,
  PdfFileIcon,
  RefreshIcon,
  SuccessCircleIcon,
  UserIcon,
} from '@/components/icons'
import { CabLayout } from '@/components/layout/CabLayout'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { downloadAgreementPdf } from '@/lib/api/agreementPdfGenerator'
import {
  countersignCertificationAgreement,
  getCertificationAgreementById,
  recordClientSignature,
  refreshAgreementTerms,
  remindCertificationAgreement,
  sendCertificationAgreement,
  terminateCertificationAgreement,
  type CertificationAgreement,
  type CertificationAgreementStatus,
} from '@/lib/api/cabCertificationAgreementsApi'
import { getAgreementKindLabel, getAgreementStatusLabel } from '@/lib/agreementStatus'
import { getUserErrorMessage } from '@/lib/errorMessages'
import {
  ROUTES,
  cabCertificationAgreementCountersignPath,
  cabCertificationAgreementDetailsPath,
  cabCertificationAgreementEditPath,
} from '@/lib/routes'
import { toast } from '@/lib/toast'
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
  { key: 'client_signed', labelEn: 'Signed by client', labelAr: 'توقيع العميل', subEn: 'Ready for CAB countersignature', subAr: 'جاهزة للتوقيع المشترك' },
  { key: 'active', labelEn: 'Active & in force', labelAr: 'سارية ونشطة', subEn: 'Audit plan gate unlocked', subAr: 'بوابة خطة التدقيق مفعّلة' },
]

const formatDisplayDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : ''

export function CabCertificationAgreementDetailsPage() {
  const { agreementId } = useParams<{ agreementId: string }>()
  // Keyed by id so the page state resets when navigating between versions of an agreement.
  return <AgreementDetails key={agreementId} agreementId={agreementId} />
}

function AgreementDetails({ agreementId }: { agreementId?: string }) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isAr = Boolean(i18n.language?.startsWith('ar'))

  const [agreement, setAgreement] = useState<CertificationAgreement | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [docLang, setDocLang] = useState<'en' | 'ar'>(isAr ? 'ar' : 'en')
  const [isTerminating, setIsTerminating] = useState(false)
  const [terminationReason, setTerminationReason] = useState('')
  const [syncedNotice, setSyncedNotice] = useState(false)

  useEffect(() => {
    if (!agreementId) return
    let active = true
    getCertificationAgreementById(agreementId)
      .then((loaded) => {
        if (!active) return
        setAgreement(loaded)
      })
      .catch(() => undefined) // not found: the "Agreement not found" view below
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [agreementId])

  if (loading) {
    return (
      <CabLayout>
        <CabHeader title={isAr ? 'اتفاقيات منح الشهادة' : 'Certification agreements'} />
      </CabLayout>
    )
  }

  if (!agreement) {
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

  const isClosed = agreement.status === 'superseded' || agreement.status === 'terminated'
  const currentStepIndex = isClosed ? STEPS.length : STEPS.findIndex((s) => s.key === agreement.status)
  const statusLabel = getAgreementStatusLabel(agreement.status, isAr)

  /** Runs a backend action on this agreement and shows the result (or the error). */
  const run = async (action: () => Promise<CertificationAgreement>, after?: (updated: CertificationAgreement) => void) => {
    setBusy(true)
    try {
      const updated = await action()
      setAgreement(updated)
      after?.(updated)
    } catch (error) {
      toast.error(getUserErrorMessage(error, t))
    } finally {
      setBusy(false)
    }
  }

  const handleAdvanceLifecycle = () =>
    run(() =>
      agreement.status === 'draft'
        ? sendCertificationAgreement(agreement.id)
        : agreement.status === 'sent'
          ? recordClientSignature(agreement.id)
          : countersignCertificationAgreement(agreement.id),
    )

  const handleUseLatestTerms = () =>
    run(() => refreshAgreementTerms(agreement.id), () => {
      setSyncedNotice(true)
      setTimeout(() => setSyncedNotice(false), 2500)
    })

  const handleSendReminder = () =>
    run(
      () => remindCertificationAgreement(agreement.id),
      () => toast.success(isAr ? 'تم إرسال التذكير إلى العميل' : 'Reminder sent to client'),
    )

  const handleTerminate = () =>
    run(
      () => terminateCertificationAgreement(agreement.id, terminationReason.trim()),
      () => {
        setIsTerminating(false)
        setTerminationReason('')
        toast.success(isAr ? 'تم إنهاء الاتفاقية' : 'Agreement terminated')
      },
    )

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
              {getAgreementKindLabel(agreement.kind, isAr)} <span dir="ltr">{agreement.reference}</span>
            </h1>
            <p className="mt-1 text-[14px] text-neutral-500">
              {isAr ? 'إدارة دورة اعتماد الاتفاقية والتوقيعات الإلكترونية وبنود التعاقد وفق ISO/IEC 17021-1 (5.1.2).' : 'Manage the certification agreement lifecycle, electronic signatures, and clause values under ISO/IEC 17021-1 (5.1.2).'}
            </p>
          </div>

          <div className="flex w-full shrink-0 flex-wrap items-center gap-2.5 lg:w-auto lg:flex-nowrap">
            {agreement.status === 'draft' && (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => navigate(cabCertificationAgreementEditPath(agreement.id))} icon={<AppIcon icon={EditIcon} size={16} />} className="h-11 whitespace-nowrap">
                  {isAr ? 'تعديل القيم' : 'Edit values'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => void handleUseLatestTerms()} disabled={busy} icon={<AppIcon icon={syncedNotice ? CheckIcon : RefreshIcon} size={16} />} className="h-11 whitespace-nowrap">
                  {syncedNotice ? (isAr ? 'تم التحديث' : 'Updated') : (isAr ? 'أحدث الشروط' : 'Use latest terms')}
                </Button>
              </>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => downloadAgreementPdf(agreement, docLang)} icon={<AppIcon icon={PdfFileIcon} size={18} />} className="h-11 whitespace-nowrap">
              {isAr ? 'تنزيل PDF' : 'Download PDF'}
            </Button>
            {agreement.status === 'sent' && (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => void handleAdvanceLifecycle()} disabled={busy} icon={<AppIcon icon={SuccessCircleIcon} size={18} />} className="h-11 whitespace-nowrap">
                  {isAr ? 'تسجيل توقيع العميل' : 'Record client signature'}
                </Button>
                <Button type="button" variant="primary" size="sm" onClick={() => void handleSendReminder()} disabled={busy} icon={<AppIcon icon={NotificationIcon} size={18} />} className="h-11 whitespace-nowrap">
                  {isAr ? 'إرسال تذكير' : 'Send reminder'}
                </Button>
              </>
            )}
            {agreement.status === 'draft' && (
              <Button type="button" variant="primary" size="sm" onClick={() => void handleAdvanceLifecycle()} disabled={busy} icon={<AppIcon icon={ExportIcon} size={18} />} className="h-11 whitespace-nowrap">
                {isAr ? 'إرسال للعميل' : 'Send to client'}
              </Button>
            )}
            {agreement.status === 'client_signed' && (
              <Button type="button" variant="primary" size="sm" onClick={() => navigate(cabCertificationAgreementCountersignPath(agreement.id))} disabled={busy} icon={<AppIcon icon={SuccessCircleIcon} size={18} />} className="h-11 whitespace-nowrap">
                {isAr ? 'التوقيع المقابل' : 'Countersign'}
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
            <AgreementStatusBadge status={agreement.status} label={statusLabel} className="w-fit" />
            <p className="mt-2 text-[12px] text-neutral-500">
              {isAr ? 'تاريخ الإصدار:' : 'Issued:'} <span dir="ltr">{agreement.values.agreementDate}</span>
            </p>
            <p className="text-[12px] text-neutral-500">
              {isAr ? 'آخر تحديث:' : 'Updated:'} <span dir="ltr">{agreement.lastChange}</span>
            </p>
            {agreement.sentAt && (
              <p className="text-[12px] text-neutral-500">
                {isAr ? 'تاريخ الإرسال:' : 'Sent:'} <span dir="ltr">{formatDisplayDate(agreement.sentAt)}</span>
              </p>
            )}
            {agreement.reminderCount > 0 && (
              <p className="text-[12px] text-neutral-500">
                {isAr ? 'التذكيرات:' : 'Reminders:'}{' '}
                <span dir="ltr">
                  {agreement.reminderCount} · {formatDisplayDate(agreement.lastReminderAt)}
                </span>
              </p>
            )}
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

        {agreement.status === 'terminated' && (
          <CalloutCard
            tone="red"
            icon={<AppIcon icon={ErrorCircleIcon} size={20} />}
            title={isAr ? 'تم إنهاء الاتفاقية' : 'Agreement terminated'}
          >
            {isAr
              ? `أُنهيت بتاريخ ${formatDisplayDate(agreement.terminatedAt)}. السبب: ${agreement.terminationReason ?? ''}`
              : `Terminated on ${formatDisplayDate(agreement.terminatedAt)}. Reason: ${agreement.terminationReason ?? ''}`}
          </CalloutCard>
        )}

        {agreement.supersededBy && (
          <CalloutCard
            tone="blue"
            icon={<AppIcon icon={InfoIcon} size={20} />}
            title={isAr ? 'تم استبدال هذا الإصدار' : 'This version was replaced'}
          >
            {isAr ? 'استُبدل هذا الإصدار بـ ' : 'This version was replaced by '}
            <Link to={cabCertificationAgreementDetailsPath(agreement.supersededBy.id)} className="font-semibold text-primary hover:underline" dir="ltr">
              {agreement.supersededBy.reference}
            </Link>
          </CalloutCard>
        )}

        {agreement.amendmentOf && (
          <CalloutCard
            tone="blue"
            icon={<AppIcon icon={InfoIcon} size={20} />}
            title={isAr ? 'تعديل على الاتفاقية' : 'Amendment'}
          >
            {isAr ? 'يستبدل ' : 'Replaces '}
            <Link to={cabCertificationAgreementDetailsPath(agreement.amendmentOf.id)} className="font-semibold text-primary hover:underline" dir="ltr">
              {agreement.amendmentOf.reference}
            </Link>
            {agreement.amendmentOf.reason ? ` · ${agreement.amendmentOf.reason}` : ''}
          </CalloutCard>
        )}

        {agreement.status === 'client_signed' && (
          <CalloutCard
            tone="amber"
            icon={<AppIcon icon={InfoIcon} size={20} />}
            title={isAr ? 'الخطوة التالية' : 'Next step'}
          >
            {isAr
              ? 'وقّع العميل. وقّع من جهة المنح لتفعيل الاتفاقية.'
              : 'Signed by client. Countersign on behalf of the certification body to activate the agreement.'}
          </CalloutCard>
        )}

        {agreement.status === 'draft' && (
          <CalloutCard
            tone="blue"
            icon={<AppIcon icon={InfoIcon} size={20} />}
            title={isAr ? 'مسودة' : 'Draft'}
          >
            {isAr
              ? 'هذه مسودة. راجع القيم ثم أرسلها إلى العميل للتوقيع.'
              : 'This is a draft. Check the values, then send it to the client for signature.'}
          </CalloutCard>
        )}

        <AgreementDocumentView
          agreement={agreement}
          docLang={docLang}
          onChangeDocLang={setDocLang}
          isAr={isAr}
          onRequestTerminate={() => setIsTerminating(true)}
          busy={busy}
        />
      </main>

      <ConfirmDialog
        open={isTerminating}
        destructive
        title={isAr ? 'إنهاء الاتفاقية' : 'Terminate agreement'}
        description={
          isAr
            ? 'سيتم إنهاء هذه الاتفاقية بشكل دائم ولن يمكن التراجع عن هذا الإجراء. يرجى ذكر سبب الإنهاء.'
            : 'This will permanently terminate the agreement and cannot be undone. Please provide a reason.'
        }
        confirmLabel={isAr ? 'تأكيد الإنهاء' : 'Confirm termination'}
        cancelLabel={isAr ? 'إلغاء' : 'Cancel'}
        confirmDisabled={!terminationReason.trim()}
        onConfirm={handleTerminate}
        onClose={() => {
          setIsTerminating(false)
          setTerminationReason('')
        }}
      >
        <div className="space-y-1.5">
          <label className="block text-[13px] font-semibold text-neutral-700">
            {isAr ? 'سبب الإنهاء' : 'Termination reason'}
          </label>
          <textarea
            value={terminationReason}
            onChange={(e) => setTerminationReason(e.target.value)}
            placeholder={isAr ? 'أدخل سبب إنهاء الاتفاقية...' : 'Enter the reason for terminating this agreement...'}
            className="min-h-[88px] w-full resize-y rounded-[10px] border border-[#e2e2e2] px-3.5 py-2.5 text-[14px] text-neutral-900 outline-none focus:border-primary"
          />
        </div>
      </ConfirmDialog>
    </CabLayout>
  )
}

export default CabCertificationAgreementDetailsPage
