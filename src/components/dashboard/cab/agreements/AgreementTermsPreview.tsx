import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  interpolateAgreementText,
  type AgreementSection,
} from '@/lib/api/cabAgreementTermsApi'
import { cn } from '@/lib/utils'

interface AgreementTermsPreviewProps {
  sections: AgreementSection[]
  presetKey: string
  presets?: Record<string, Record<string, string>>
  onClose: () => void
  initialLang?: 'en' | 'ar'
}

export function AgreementTermsPreview({
  sections,
  presetKey,
  presets,
  onClose,
  initialLang = 'en',
}: AgreementTermsPreviewProps) {
  const { t, i18n } = useTranslation()
  const isUiAr = i18n.language?.startsWith('ar')
  const [docLang, setDocLang] = useState<'en' | 'ar'>(initialLang)

  return (
    <section className="flex flex-col gap-3">
      {/* Top Preview Bar */}
      <div className="flex items-center justify-between gap-3 px-1">
        <span className="text-[14px] font-semibold text-neutral-800">
          {t('cab.agreementTerms.preview.label', isUiAr ? 'معاينة' : 'Preview')}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-[13px] font-medium text-primary transition-colors hover:text-[#0d2775] hover:underline"
        >
          {t('cab.agreementTerms.preview.close', isUiAr ? 'إغلاق المعاينة' : 'Close preview')}
        </button>
      </div>

      {/* Document Card */}
      <div className="rounded-[16px] border border-[#ececec] bg-white p-6 sm:p-8">
        {/* Card Top Row: Label + Language Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] font-semibold text-neutral-600">
            {t('cab.agreementTerms.preview.agreementText', isUiAr ? 'نص الاتفاقية' : 'Agreement text')}
          </span>

          <div className="inline-flex h-9 items-center gap-1 rounded-[8px] border border-[#e2e2e2] bg-[#f9fafc] p-1">
            {(['en', 'ar'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setDocLang(lang)}
                className={cn(
                  'h-full rounded-[6px] px-3 text-[13px] font-medium transition-colors',
                  docLang === lang
                    ? 'bg-[#1236a3] text-white shadow-xs'
                    : 'text-neutral-600 hover:bg-white hover:text-neutral-900',
                )}
              >
                {lang === 'en' ? 'English' : 'العربية'}
              </button>
            ))}
          </div>
        </div>

        {/* Centered Document Header */}
        <div
          dir={docLang === 'ar' ? 'rtl' : 'ltr'}
          className="mt-6 border-b border-[#ececec] pb-5 text-center"
        >
          <h2 className="text-[20px] font-bold text-neutral-900">
            {docLang === 'ar' ? 'اتفاقية منح الشهادة' : 'Certification agreement'}
          </h2>
          <p className="mt-1 text-[13px] font-medium tracking-wide text-neutral-500" dir="ltr">
            AGR-PREVIEW
          </p>
        </div>

        {/* Numbered Document Clauses */}
        <div
          dir={docLang === 'ar' ? 'rtl' : 'ltr'}
          className="mt-6 space-y-5"
        >
          {sections.map((sec, idx) => {
            const title =
              docLang === 'ar' ? sec.titleAr || sec.titleEn : sec.titleEn || sec.titleAr
            const rawBody =
              docLang === 'ar' ? sec.textAr || sec.textEn : sec.textEn || sec.textAr
            const body = interpolateAgreementText(rawBody, presetKey || 'sample', presets)

            return (
              <article key={sec.id} className="space-y-1.5">
                <h3 className="text-[15px] font-bold text-primary">
                  {idx + 1}.{' '}
                  {title || t('cab.agreementTerms.untitledSection', 'Untitled section')}
                </h3>
                <p className="whitespace-pre-line text-[14px] leading-[1.7] text-neutral-700">
                  {body || '—'}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
