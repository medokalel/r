import { useTranslation } from 'react-i18next'
import { Tooltip } from '@/components/ui/Tooltip'

export function CvvHintTooltip() {
  const { t } = useTranslation()

  return (
    <Tooltip
      side="top"
      align="start"
      contentClassName="max-w-[240px] p-3"
      label={
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-normal leading-[1.5] text-neutral-800">
            {t('wallet.addPaymentModal.cvvHint')}
          </p>
          <img
            src="/images/cvv-hint.png"
            alt=""
            className="w-full rounded-[6px]"
            width={216}
            height={136}
          />
        </div>
      }
    >
      <button
        type="button"
        aria-label={t('wallet.addPaymentModal.cvvHint')}
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-[11px] font-semibold leading-none text-neutral-500 transition-colors hover:border-primary hover:text-primary"
      >
        i
      </button>
    </Tooltip>
  )
}
