import { useState } from 'react'
import {
  renderAgreementClauseText,
  type CertificationAgreementValues,
} from '@/lib/api/cabCertificationAgreementsApi'
import type { AgreementSection } from '@/lib/api/cabAgreementTermsApi'
import { cn } from '@/lib/utils'

interface AgreementTermsPreviewProps {
  sections: AgreementSection[]
  /** What a new agreement for the selected client would contain; null while it loads. */
  values: CertificationAgreementValues | null
  failed: boolean
  isAr: boolean
  onClose: () => void
}

/** The agreement as the selected client would receive it, in the same style as the agreement page. */
export function AgreementTermsPreview({ sections, values, failed, isAr, onClose }: AgreementTermsPreviewProps) {
  // Follows the site language; the switch only overrides it until the site language changes.
  const siteLang = isAr ? 'ar' : 'en'
  const [picked, setPicked] = useState<{ lang: 'en' | 'ar'; siteLang: 'en' | 'ar' } | null>(null)
  const docLang = picked?.siteLang === siteLang ? picked.lang : siteLang
  const setDocLang = (lang: 'en' | 'ar') => setPicked({ lang, siteLang })

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <span className="text-[14px] font-semibold text-neutral-800">{isAr ? 'معاينة' : 'Preview'}</span>
        <button type="button" onClick={onClose} className="text-[13px] font-medium text-primary hover:underline">
          {isAr ? 'إغلاق المعاينة' : 'Close preview'}
        </button>
      </div>

      <div className="rounded-[16px] border border-[#ececec] bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] font-semibold text-neutral-600">{isAr ? 'نص الاتفاقية' : 'Agreement text'}</span>
          <div className="inline-flex h-9 items-center gap-1 rounded-[8px] border border-[#e2e2e2] bg-[#f9fafc] p-1">
            {(['en', 'ar'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setDocLang(lang)}
                className={cn(
                  'h-full rounded-[6px] px-3 text-[13px] font-medium transition-colors',
                  docLang === lang ? 'bg-[#1236a3] text-white shadow-xs' : 'text-neutral-600 hover:bg-white hover:text-neutral-900',
                )}
              >
                {lang === 'en' ? 'English' : 'العربية'}
              </button>
            ))}
          </div>
        </div>

        {!values ? (
          <p className="mt-6 text-[14px] text-neutral-500">
            {failed
              ? isAr ? 'تعذّر تحميل بيانات العميل للمعاينة.' : "Couldn't load this client's data for the preview."
              : isAr ? 'جارٍ تحميل بيانات العميل…' : "Loading the client's data…"}
          </p>
        ) : (
          <>
            <div dir={docLang === 'ar' ? 'rtl' : 'ltr'} className="mt-6 border-b border-[#ececec] pb-5 text-center">
              <h2 className="text-[20px] font-bold text-neutral-900">
                {docLang === 'ar' ? 'اتفاقية منح الشهادة' : 'Certification agreement'}
              </h2>
              <p className="mt-1 text-[13px] font-medium tracking-wide text-neutral-500" dir="ltr">
                {values.agreementNumber} v1
              </p>
            </div>

            <div dir={docLang === 'ar' ? 'rtl' : 'ltr'} className="mt-6 space-y-5">
              {sections.map((sec, idx) => {
                const title = docLang === 'ar' ? sec.titleAr || sec.titleEn : sec.titleEn || sec.titleAr
                const rawText = docLang === 'ar' ? sec.textAr || sec.textEn : sec.textEn || sec.textAr
                return (
                  <article key={sec.id} className="space-y-1.5">
                    <h3 className="text-[15px] font-bold text-primary">
                      {idx + 1}. {title || (isAr ? 'بند بدون عنوان' : 'Untitled section')}
                    </h3>
                    <p className="whitespace-pre-line text-[14px] leading-[1.7] text-neutral-700">
                      {renderAgreementClauseText(rawText, values, true) || '—'}
                    </p>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
