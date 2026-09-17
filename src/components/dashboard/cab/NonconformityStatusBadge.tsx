import type { NonconformityStatus } from '@/lib/api/cabNonconformitiesApi'
import { cn } from '@/lib/utils'

/**
 * Single source of truth for nonconformity status colors. Mirrors
 * `CertificationLifecycleBadge` (same pill shape, same palette tokens) — it is
 * a separate component only because the status vocabulary is a different
 * domain, so the two must not share a status union.
 */
const STATUS_STYLES: Record<NonconformityStatus, { pill: string; dot: string }> = {
  open: { pill: 'bg-[#fef3c6] text-[#a58401]', dot: 'bg-[#a58401]' },
  in_progress: { pill: 'bg-[#e8edfc] text-primary', dot: 'bg-primary' },
  submitted: { pill: 'bg-[#fff7ed] text-[#ea580c]', dot: 'bg-[#ea580c]' },
  closed: { pill: 'bg-[#eafaf1] text-[#16a34a]', dot: 'bg-[#16a34a]' },
  overdue: { pill: 'bg-[#fef2f2] text-[#dc2626]', dot: 'bg-[#dc2626]' },
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
  const styles = STATUS_STYLES[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium',
        styles.pill,
        className,
      )}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', styles.dot)} aria-hidden />
      {label}
    </span>
  )
}