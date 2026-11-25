import { useTranslation } from 'react-i18next'
import type { ClientQuotationState } from '@/lib/api/clientQuotationsApi'
import { cn } from '@/lib/utils'

const stateStyles: Record<ClientQuotationState, string> = {
  pending: 'bg-[#e8edfc] text-primary',
  accepted: 'bg-[#dcfce7] text-[#15803d]',
  rejected: 'bg-[#fee2e2] text-[#dc2626]',
  expired: 'bg-[#f1f5f9] text-[#475569]',
}

/** The client's state on an issued offer, shown on the list and the detail page. */
export function ClientQuotationStatusBadge({
  state,
  className,
}: {
  state: ClientQuotationState
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[4px] px-3 py-1 text-[12px] font-medium',
        stateStyles[state],
        className,
      )}
    >
      {t(`clientQuotations.state.${state}`)}
    </span>
  )
}
