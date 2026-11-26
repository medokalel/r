import { AgreementAuditTrail } from '@/components/dashboard/cab/agreements/AgreementAuditTrail'
import { AgreementIntegrityCard } from '@/components/dashboard/cab/agreements/AgreementIntegrityCard'
import {
  AppIcon,
  CheckIcon,
  ErrorCircleIcon,
  FileTextIcon,
  ShieldIcon,
  SuccessCircleIcon,
  UserIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/Button'
import {
  renderAgreementClauseText,
  type CertificationAgreement,
} from '@/lib/api/cabCertificationAgreementsApi'
import { cn } from '@/lib/utils'

interface AgreementDocumentViewProps {
  agreement: CertificationAgreement
  docLang: 'en' | 'ar'
  onChangeDocLang: (lang: 'en' | 'ar') => void
  isAr: boolean
  onRequestTerminate?: () => void
  busy?: boolean
}

interface LocalSignatureData {
  signerName?: string
  signerTitle?: string
  method?: 'draw' | 'type' | 'upload'
  signatureDataUrl?: string
  typedSignature?: string
}

function getLocalCabSignature(agreementId: string): LocalSignatureData | null {
  try {
    const raw = localStorage.getItem(`icasco_cab_sig_${agreementId}`)
    return raw ? (JSON.parse(raw) as LocalSignatureData) : null
  } catch {
    return null
  }
}

function getSignatureMethodLabel(method: string | undefined, isArabic: boolean): string {
  if (method === 'draw') return isArabic ? 'توقيع يدوي' : 'Hand-drawn'
  if (method === 'upload') return isArabic ? 'صورة مرفوعة' : 'Uploaded image'
  if (method === 'type') return isArabic ? 'اسم مكتوب' : 'Typed name'
  return isArabic ? 'توقيع إلكتروني' : 'Electronic signature'
}

function SignaturePreview({
  sigImg,
  typedSig,
  signerName,
  compact = false,
}: {
  sigImg?: string
  typedSig?: string
  signerName: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-[8px] bg-[#f9fafc] px-3',
        compact ? 'h-12' : 'h-16',
      )}
    >
      {sigImg ? (
        <img
          src={sigImg}
          alt={signerName}
          className={cn('object-contain', compact ? 'max-h-9' : 'max-h-12')}
        />
      ) : (
        <span className={cn('font-serif italic text-primary', compact ? 'text-[18px]' : 'text-[22px]')}>
          {typedSig || signerName}
        </span>
      )}
    </div>
  )
}

export function AgreementDocumentView({
  agreement,
  docLang,
  onChangeDocLang,
  isAr,
  onRequestTerminate,
  busy,
}: AgreementDocumentViewProps) {
  const isClosed = agreement.status === 'terminated' || agreement.status === 'superseded'
  const localCabSig = getLocalCabSignature(agreement.id)
  return (
    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-12">
      {/* Main Clause Document Card (8 cols) */}
      <section className="rounded-[16px] border border-[#ececec] bg-white p-6 xl:col-span-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ececec] pb-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#e8edfc] text-primary">
              <AppIcon icon={FileTextIcon} size={20} />
            </span>
            <div>
              <h2 className="text-[16px] font-bold text-neutral-900">
                {isAr ? 'وثيقة اتفاقية منح الشهادة' : 'Certification agreement document'}
              </h2>
              <p className="text-[12px] text-neutral-500">
                {isAr ? `${agreement.sections.length} بنداً قانونياً وفق ISO/IEC 17021-1 (5.1.2)` : `${agreement.sections.length} legal clauses under ISO/IEC 17021-1 (5.1.2)`}
              </p>
            </div>
          </div>

          <div className="inline-flex h-10 items-center gap-1 rounded-[8px] border border-[#e2e2e2] bg-[#f9fafc] p-1">
            {(['en', 'ar'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => onChangeDocLang(lang)}
                className={cn(
                  'h-full rounded-[6px] px-3.5 text-[13px] font-medium transition-colors',
                  docLang === lang ? 'bg-[#1236a3] text-white shadow-xs' : 'text-neutral-600 hover:bg-white hover:text-neutral-900',
                )}
              >
                {lang === 'en' ? 'English' : 'العربية'}
              </button>
            ))}
          </div>
        </div>

        {/* Document Clauses */}
        <div dir={docLang === 'ar' ? 'rtl' : 'ltr'} className="mt-5 space-y-3">
          {agreement.sections.map((sec, idx) => {
            const title = docLang === 'ar' ? sec.titleAr || sec.titleEn : sec.titleEn || sec.titleAr
            const rawText = docLang === 'ar' ? sec.textAr || sec.textEn : sec.textEn || sec.textAr
            return (
              <div key={sec.id} className="rounded-[12px] border border-[#ececec] bg-[#f9fafc] p-4 transition-colors hover:bg-white">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-[6px] bg-[#e8edfc] text-[12px] font-bold text-primary">
                    {idx + 1}
                  </span>
                  <h4 className="text-[15px] font-bold text-neutral-900">{title}</h4>
                </div>
                <p className="mt-2 ps-8 text-[14px] leading-relaxed text-neutral-700">
                  {renderAgreementClauseText(rawText, agreement.values)}
                </p>
              </div>
            )
          })}
        </div>

        {/* Document Bottom Signatures Block */}
        <div dir={docLang === 'ar' ? 'rtl' : 'ltr'} className="mt-6 border-t border-[#ececec] pt-6">
          <h3 className="mb-4 text-[15px] font-bold text-neutral-900">
            {docLang === 'ar' ? 'التوقيعات' : 'Signatures'}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(() => {
              const shortFp = (fp?: string) =>
                fp && fp.length > 18 ? `${fp.slice(0, 8)}...${fp.slice(-8)}` : fp || '—'

              return [
                {
                  role: docLang === 'ar' ? 'العميل' : 'Client',
                  sig: agreement.clientSignature,
                  local: null as LocalSignatureData | null,
                },
                {
                  role: docLang === 'ar' ? 'جهة منح الشهادات' : 'Certification body',
                  sig: agreement.cabSignature,
                  local: localCabSig,
                },
              ].map((box, i) => {
                const sigImg = box.local?.signatureDataUrl || box.sig?.signatureDataUrl
                const typedSig = box.local?.typedSignature
                const signerName = box.local?.signerName || box.sig?.signerName || ''
                const signerTitle = box.local?.signerTitle || box.sig?.signerTitle || ''
                const methodText = getSignatureMethodLabel(box.local?.method || box.sig?.method, docLang === 'ar')

                return (
                  <div
                    key={i}
                    className="flex min-h-[210px] flex-col rounded-[12px] border border-[#ececec] bg-white p-4"
                  >
                    <p className="text-[12px] font-semibold text-neutral-500">{box.role}</p>

                    {box.sig ? (
                      <div className="mt-3 flex flex-1 flex-col justify-between gap-3">
                        <SignaturePreview sigImg={sigImg} typedSig={typedSig} signerName={signerName} />

                        <div className="space-y-1 text-[12px]">
                          <p className="text-[14px] font-bold text-neutral-900">{signerName}</p>
                          {signerTitle && <p className="text-neutral-500">{signerTitle}</p>}

                          <div className="space-y-1 pt-2 text-[12px]">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-neutral-500">{docLang === 'ar' ? 'تاريخ التوقيع' : 'Signed at'}</span>
                              <span className="font-medium text-neutral-800" dir="ltr">{box.sig.signedAt}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-neutral-500">{docLang === 'ar' ? 'الطريقة' : 'Method'}</span>
                              <span className="font-medium text-neutral-800">{methodText}</span>
                            </div>
                            {box.sig.ipAddress && (
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-neutral-500">{docLang === 'ar' ? 'عنوان IP' : 'IP address'}</span>
                                <span className="font-mono text-neutral-700" dir="ltr">{box.sig.ipAddress}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-neutral-500">{docLang === 'ar' ? 'بصمة المستند' : 'Fingerprint'}</span>
                              <span className="font-mono text-neutral-700" dir="ltr">{shortFp(box.sig.fingerprint)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-1 items-center justify-center">
                        <p className="text-[13px] font-medium text-neutral-400">
                          {docLang === 'ar' ? 'لم يوقّع بعد' : 'Not signed yet'}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })
            })()}
          </div>
        </div>
      </section>

      {/* Right Column: Electronic Signatures + Scope Details (4 cols) */}
      <div className="flex flex-col gap-5 xl:col-span-4 xl:sticky xl:top-6">
        {/* Electronic Signatures Card */}
        <section className="rounded-[16px] border border-[#ececec] bg-white p-5">
          <div className="flex items-center justify-between border-b border-[#ececec] pb-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#e8edfc] text-primary">
                <AppIcon icon={ShieldIcon} size={18} />
              </span>
              <div>
                <h3 className="text-[15px] font-bold text-neutral-900">
                  {isAr ? 'التوقيعات الإلكترونية' : 'Electronic signatures'}
                </h3>
                <p className="text-[11px] text-neutral-500">SHA-256 Cryptographic Proof</p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {[
              { role: isAr ? 'توقيع العميل' : 'Client signatory', expected: isAr ? agreement.values.signatoryAr : agreement.values.signatoryEn, sig: agreement.clientSignature, local: null as LocalSignatureData | null },
              { role: isAr ? 'توقيع جهة المنح (iCASCO)' : 'Certification body (iCASCO)', expected: agreement.values.cabLegalNameEn || 'iCASCO', sig: agreement.cabSignature, local: localCabSig },
            ].map((box, i) => {
              const sigImg = box.local?.signatureDataUrl || box.sig?.signatureDataUrl
              const typedSig = box.local?.typedSignature
              const signerName = box.local?.signerName || box.sig?.signerName || ''
              const signerTitle = box.local?.signerTitle || box.sig?.signerTitle || ''
              const methodText = getSignatureMethodLabel(box.local?.method || box.sig?.method, isAr)
              return (
                <div key={i} className={cn('rounded-[12px] border p-4', box.sig ? 'border-[#bbf7d0] bg-[#eafaf1]/50' : 'border-[#ececec] bg-[#f9fafc]')}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-semibold text-neutral-500">{box.role}</span>
                    <span className={cn('inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[11px] font-medium', box.sig ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#f1f5f9] text-[#475569]')}>
                      {box.sig ? <><AppIcon icon={CheckIcon} size={12} /> {isAr ? 'موقع' : 'Signed'}</> : (isAr ? 'بانتظار التوقيع' : 'Pending')}
                    </span>
                  </div>

                  {box.sig ? (
                    <div className="mt-2.5 space-y-1.5">
                      <SignaturePreview sigImg={sigImg} typedSig={typedSig} signerName={signerName} compact />
                      <p className="text-[14px] font-bold text-neutral-900">{signerName}</p>
                      {signerTitle && <p className="text-[12px] text-neutral-600">{signerTitle}</p>}
                      <p className="text-[11px] font-medium text-neutral-500">{methodText}</p>
                      <p className="pt-0.5 text-[12px] font-medium text-[#15803d]" dir="ltr">{box.sig.signedAt}</p>
                      <p className="truncate font-mono text-[11px] text-neutral-400" dir="ltr">{box.sig.fingerprint}</p>
                    </div>
                  ) : (
                    <div className="mt-2.5 flex items-center gap-2 text-[13px] text-neutral-500">
                      <AppIcon icon={UserIcon} size={15} className="text-neutral-400" />
                      <span className="truncate">{box.expected}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Scope & Financial Summary Card */}
        <section className="rounded-[16px] border border-[#ececec] bg-white p-5">
          <div className="flex items-center gap-2.5 border-b border-[#ececec] pb-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#eafaf1] text-[#16a34a]">
              <AppIcon icon={SuccessCircleIcon} size={18} />
            </span>
            <h3 className="text-[15px] font-bold text-neutral-900">
              {isAr ? 'بيانات النطاق والعرض' : 'Scope & offer details'}
            </h3>
          </div>

          <div className="mt-4 space-y-3.5 text-[13px]">
            <div>
              <p className="text-[12px] font-medium text-neutral-500">{isAr ? 'العميل' : 'Client'}</p>
              <p className="mt-0.5 font-semibold text-neutral-900">
                {isAr ? agreement.values.clientLegalNameAr : agreement.values.clientLegalNameEn}
              </p>
            </div>

            <div>
              <p className="text-[12px] font-medium text-neutral-500">{isAr ? 'المواصفات القياسية المعتمدة' : 'Certified standards'}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {agreement.values.standards.map((std) => (
                  <span key={std} dir="ltr" className="rounded-[4px] bg-[#e8edfc] px-2.5 py-0.5 text-[12px] font-medium text-primary">
                    {std}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[12px] font-medium text-neutral-500">{isAr ? 'نطاق منح الشهادة' : 'Certification scope'}</p>
              <p className="mt-1 font-semibold text-neutral-900">{isAr ? agreement.values.scopeAr : agreement.values.scopeEn}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-[#f0f0f0] pt-3">
              <div>
                <p className="text-[12px] font-medium text-neutral-500">{isAr ? 'العرض المالي' : 'Offer ref'}</p>
                <p className="mt-0.5 font-semibold text-primary" dir="ltr">{agreement.values.offerRef || '—'}</p>
              </div>
              <div>
                <p className="text-[12px] font-medium text-neutral-500">{isAr ? 'تاريخ الإرسال' : 'Sent at'}</p>
                <p className="mt-0.5 font-semibold text-neutral-900">
                  {agreement.sentAt
                    ? new Date(agreement.sentAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', {
                        day: 'numeric',
                        month: isAr ? 'long' : 'short',
                        year: 'numeric',
                      })
                    : isAr
                      ? 'غير محدد'
                      : 'Not sent'}
                </p>
              </div>
              <div>
                <p className="text-[12px] font-medium text-neutral-500">{isAr ? 'إصدار القالب' : 'Template version'}</p>
                <p className="mt-0.5 font-semibold text-neutral-900" dir="ltr">{agreement.values.agreementVersion}</p>
              </div>
              <div>
                <p className="text-[12px] font-medium text-neutral-500">{isAr ? 'تاريخ الاتفاقية' : 'Agreement date'}</p>
                <p className="mt-0.5 font-semibold text-neutral-900" dir="ltr">{agreement.values.agreementDate}</p>
              </div>
              <div>
                <p className="text-[12px] font-medium text-neutral-500">{isAr ? 'عدد المواقع' : 'Registered sites'}</p>
                <p className="mt-0.5 font-semibold text-neutral-900">{agreement.values.sitesCount}</p>
              </div>
              <div>
                <p className="text-[12px] font-medium text-neutral-500">{isAr ? 'آخر تحديث' : 'Last updated'}</p>
                <p className="mt-0.5 font-semibold text-neutral-900" dir="ltr">{agreement.lastChange}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Document Integrity (SHA-256) */}
        <AgreementIntegrityCard agreement={agreement} isAr={isAr} />

        {/* Audit Trail */}
        <AgreementAuditTrail events={agreement.events} isAr={isAr} />

        {/* Terminate Agreement Action */}
        {!isClosed && onRequestTerminate && (
          <Button
            type="button"
            variant="outline"
            onClick={onRequestTerminate}
            disabled={busy}
            icon={<AppIcon icon={ErrorCircleIcon} size={18} />}
            className="h-12 w-full rounded-[12px] border-[#fca5a5] bg-white text-[14px] font-semibold text-[#dc2626] hover:border-[#ef4444] hover:bg-[#fef2f2] hover:text-[#b91c1c]"
          >
            {isAr ? 'إنهاء الاتفاقية' : 'Terminate agreement'}
          </Button>
        )}
      </div>
    </div>
  )
}
