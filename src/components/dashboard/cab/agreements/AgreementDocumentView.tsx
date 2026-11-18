import {
  AppIcon,
  CheckIcon,
  FileTextIcon,
  ShieldIcon,
  SuccessCircleIcon,
  UserIcon,
} from '@/components/icons'
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
}

export function AgreementDocumentView({
  agreement,
  docLang,
  onChangeDocLang,
  isAr,
}: AgreementDocumentViewProps) {
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
              { role: isAr ? 'توقيع العميل' : 'Client signatory', expected: isAr ? agreement.values.signatoryAr : agreement.values.signatoryEn, sig: agreement.clientSignature },
              { role: isAr ? 'توقيع جهة المنح (iCASCO)' : 'Certification body (iCASCO)', expected: 'Mohamed El Manawahly', sig: agreement.cabSignature },
            ].map((box, i) => (
              <div key={i} className={cn('rounded-[12px] border p-4', box.sig ? 'border-[#bbf7d0] bg-[#eafaf1]/50' : 'border-[#ececec] bg-[#f9fafc]')}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-semibold text-neutral-500">{box.role}</span>
                  <span className={cn('inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[11px] font-medium', box.sig ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#f1f5f9] text-[#475569]')}>
                    {box.sig ? <><AppIcon icon={CheckIcon} size={12} /> {isAr ? 'موقع' : 'Signed'}</> : (isAr ? 'بانتظار التوقيع' : 'Pending')}
                  </span>
                </div>

                {box.sig ? (
                  <div className="mt-2.5 space-y-1">
                    <p className="text-[14px] font-bold text-neutral-900">{box.sig.signerName}</p>
                    <p className="text-[12px] text-neutral-600">{box.sig.signerTitle}</p>
                    <p className="pt-1 text-[12px] font-medium text-[#15803d]" dir="ltr">{box.sig.signedAt}</p>
                    <p className="truncate font-mono text-[11px] text-neutral-400" dir="ltr">{box.sig.fingerprint}</p>
                  </div>
                ) : (
                  <div className="mt-2.5 flex items-center gap-2 text-[13px] text-neutral-500">
                    <AppIcon icon={UserIcon} size={15} className="text-neutral-400" />
                    <span className="truncate">{box.expected}</span>
                  </div>
                )}
              </div>
            ))}
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
      </div>
    </div>
  )
}
