import { renderAgreementClauseText, type CertificationAgreement } from '@/lib/api/cabCertificationAgreementsApi'
import { cn } from '@/lib/utils'

interface AgreementTextCardProps {
  agreement: Pick<CertificationAgreement, 'sections' | 'values' | 'reference'>
  docLang: 'en' | 'ar'
  onChangeDocLang: (lang: 'en' | 'ar') => void
  isAr: boolean
}

/** The agreement text itself: label, English/العربية switch, centered title and the numbered clauses. */
export function AgreementTextCard({ agreement, docLang, onChangeDocLang, isAr }: AgreementTextCardProps) {
  const dir = docLang === 'ar' ? 'rtl' : 'ltr'
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-neutral-600">{isAr ? 'نص الاتفاقية' : 'Agreement text'}</span>
        <div className="inline-flex h-9 items-center gap-1 rounded-[8px] border border-[#e2e2e2] bg-[#f9fafc] p-1">
          {(['en', 'ar'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => onChangeDocLang(lang)}
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

      <div dir={dir} className="mt-6 border-b border-[#ececec] pb-5 text-center">
        <h2 className="text-[20px] font-bold text-neutral-900">
          {docLang === 'ar' ? 'اتفاقية منح الشهادة' : 'Certification agreement'}
        </h2>
        <p className="mt-1 text-[13px] font-medium tracking-wide text-neutral-500" dir="ltr">
          {agreement.reference}
        </p>
      </div>

      <div dir={dir} className="mt-6 space-y-5">
        {agreement.sections.map((sec, idx) => {
          const title = docLang === 'ar' ? sec.titleAr || sec.titleEn : sec.titleEn || sec.titleAr
          const rawText = docLang === 'ar' ? sec.textAr || sec.textEn : sec.textEn || sec.textAr
          return (
            <article key={sec.id} className="space-y-1.5">
              <h3 className="text-[15px] font-bold text-primary">
                {idx + 1}. {title}
              </h3>
              <p className="whitespace-pre-line text-[14px] leading-[1.7] text-neutral-700">
                {renderAgreementClauseText(rawText, agreement.values)}
              </p>
            </article>
          )
        })}
      </div>
    </>
  )
}
