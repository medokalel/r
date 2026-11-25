import { useTranslation } from 'react-i18next'
import type { NonconformityClassification } from '@/lib/api/cabNonconformitiesApi'
import { cn } from '@/lib/utils'

const CLASSIFICATION_STYLES: Record<NonconformityClassification, string> = {
  critical: 'bg-[#fef2f2] text-[#b91c1c]',
  major: 'bg-[#fef2f2] text-[#dc2626]',
  minor: 'bg-[#fef3c6] text-[#a58401]',
  observation: 'bg-[#f3f4f6] text-neutral-600',
}

export function ClassificationBadge({ classification }: { classification: NonconformityClassification }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-[4px] px-3 py-1 text-[12px] font-medium',
        CLASSIFICATION_STYLES[classification],
      )}
    >
      {t(`clientFindings.classification.${classification}`)}
    </span>
  )
}

export function OverdueTag() {
  const { t } = useTranslation()
  return (
    <span className="inline-flex items-center rounded-full bg-[#fef2f2] px-2 py-0.5 text-[11px] font-semibold text-[#dc2626]">
      {t('clientFindings.overdueTag')}
    </span>
  )
}
