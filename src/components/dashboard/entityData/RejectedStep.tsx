import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'

function InfoCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="#e74d3c" strokeWidth="1.2" />
      <path d="M8 5.5v.5M8 7v4" stroke="#e74d3c" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function MessageMinusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M5.33 13.33 2 14l.67-3.33A6 6 0 1 1 5.33 13.33Z" stroke="#6b7280" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M6 8h4" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

const rejectionReasons = [
  { key: 'commercialExpired', num: '01' },
  { key: 'nonCompliance', num: '02' },
] as const

export function RejectedStep() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-1 flex-col gap-5 rounded-[16px] border border-[#ececec] bg-white p-[21px]">
      {/* Banner */}
      <div className="flex items-center justify-between gap-5 rounded-[16px] bg-[rgba(252,234,232,0.5)] px-5 py-6">
        <div className="flex items-center gap-5">
          <img src="/icon-rejected.svg" alt="" width={96} height={96} aria-hidden className="shrink-0" />
          <div>
            <h2 className="text-[24px] font-medium leading-[1.6] tracking-[-0.6px] text-error-500">
              {t('accreditation.status.rejected.title')}
            </h2>
            <p className="text-[18px] font-light leading-[1.6] text-neutral-500">
              {t('accreditation.status.rejected.subtitle')}
            </p>
          </div>
        </div>
        <Button variant="secondary" size="lg" className="shrink-0 rounded-[8px] text-[16px]">
          {t('accreditation.status.rejected.contactUs')}
        </Button>
      </div>

      {/* Rejection file section */}
      <div className="overflow-clip rounded-[16px] border border-[#ececec] bg-[#fcfcfc]">
        {/* Section header */}
        <div className="flex items-center justify-between border-b border-[#ececec] bg-[#f4f4f4] px-5 py-6 text-[16px]">
          <p className="font-bold text-neutral-500">
            {t('accreditation.status.rejected.fileTitle')}
          </p>
          <div className="flex items-center gap-1 text-neutral-500">
            <span className="font-bold text-primary">
              {t('accreditation.status.rejected.reviewDate')}
            </span>
            <span className="font-semibold">04 : 24</span>
            <span className="font-semibold">2026 / 01 / 26</span>
          </div>
        </div>

        {/* Rejection items */}
        <div className="flex flex-col gap-10 px-5 pb-10 pt-10">
          {rejectionReasons.map(({ key, num }, index) => (
            <Fragment key={key}>
              {index > 0 && <hr className="border-[#ececec]" />}
              <div className="flex items-start gap-[17px]">
                <div className="flex h-14 w-[82px] shrink-0 items-center justify-center rounded-[8px] bg-[#ececec] text-[18px] font-medium leading-[1.6] text-neutral-900">
                  {num}
                </div>
                <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
                  <p className="text-[18px] font-medium leading-[1.6] tracking-[-0.6px] text-neutral-900">
                    {t(`accreditation.status.rejected.reasons.${key}.title`)}
                  </p>
                  <p className="text-[16px] leading-[1.6] text-neutral-500">
                    {t(`accreditation.status.rejected.reasons.${key}.description`)}
                  </p>
                  <div className="flex items-center gap-1 rounded-[8px] bg-[rgba(252,234,232,0.5)] p-2">
                    <InfoCircleIcon />
                    <span className="text-[14px] leading-[1.6] text-error-500">
                      {t(`accreditation.status.rejected.reasons.${key}.tag`)}
                    </span>
                  </div>
                </div>
              </div>
            </Fragment>
          ))}
        </div>
      </div>

      {/* Are you ready for correction? */}
      <div className="overflow-clip rounded-[16px] border border-[#ececec] bg-[#fcfcfc] py-10">
        <div className="mx-auto flex max-w-[616px] flex-col items-center gap-5 text-center">
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-[24px] font-medium leading-[1.6] tracking-[-0.6px] text-neutral-900">
              {t('accreditation.status.rejected.correctionTitle')}
            </h3>
            <p className="whitespace-pre-line text-[16px] font-light leading-[1.6] text-neutral-500">
              {t('accreditation.status.rejected.correctionSubtitle')}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Button variant="primary" size="lg" className="w-[293px] rounded-[8px]">
              {t('accreditation.status.rejected.editAndResubmit')}
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-[16px] leading-[1.6] text-neutral-500">
                {t('accreditation.status.rejected.downloadReportSuffix')}
              </span>
              <button type="button" className="text-[14px] font-bold leading-[1.6] text-neutral-500 underline underline-offset-2">
                {t('accreditation.status.rejected.downloadReport')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Help footer strip */}
      <div className="flex items-center justify-center gap-4 rounded-[16px] border border-[#d1dbfa] bg-[#f3f6fd] py-5">
        <button type="button" className="text-[14px] font-medium leading-[1.6] text-neutral-900 underline underline-offset-2">
          {t('accreditation.status.rejected.talkToSupport')}
        </button>
        <div className="h-[29px] w-px bg-[#ececec]" />
        <div className="flex items-center gap-3">
          <p className="text-[14px] font-light leading-[1.6] text-neutral-500">
            {t('accreditation.status.rejected.helpText')}
          </p>
          <MessageMinusIcon />
        </div>
      </div>
    </div>
  )
}
