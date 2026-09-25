import type { NonconformityStatus } from '@/lib/api/cabNonconformitiesApi'
import { cn } from '@/lib/utils'

/**
 * Single source of truth for nonconformity status colors.
 * Rectangular badge styled to match the standard across CAB tables.
 */
const STATUS_STYLES: Record<NonconformityStatus, string> = {
  open: 'bg-[#fef3c6] text-[#a58401]',
  in_progress: 'bg-[#e8edfc] text-primary',
  submitted: 'bg-[#fff7ed] text-[#ea580c]',
  closed: 'bg-[#eafaf1] text-[#16a34a]',
  overdue: 'bg-[#fef2f2] text-[#dc2626]',
}

interface NonconformityStatusBadgeProps {
  status: NonconformityStatus
  label: string
  className?: string
}

export function NonconformityStatusBadge({
  status,
  label,
  className,
}: NonconformityStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-[4px] px-3 py-1 text-[12px] font-medium whitespace-nowrap',
        STATUS_STYLES[status],
        className,
      )}
    >
      {label}
    </span>
  )
}