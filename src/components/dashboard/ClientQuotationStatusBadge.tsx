import { useTranslation } from 'react-i18next'
import type { ClientQuotationState } from '@/lib/api/clientQuotationsApi'
import { cn } from '@/lib/utils'

const stateStyles: Record<ClientQuotationState, string> = {
  pending: 'bg-[#fef3c6] text-[#92400e]',
  accepted: 'bg-[#e7f6ec] text-[#1e7e34]',
  rejected: 'bg-[#fef2f2] text-[#b91c1c]',
  expired: 'bg-[#f3f4f6] text-[#4b5563]',
}

/** The client's state on an issued quotation, shown on the list and the detail page. */
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
        'shrink-0 rounded-full px-3 py-1 text-[12px] font-medium',
        stateStyles[state],
        className,
      )}
    >
      {t(`clientQuotations.state.${state}`)}
    </span>
  )
}
