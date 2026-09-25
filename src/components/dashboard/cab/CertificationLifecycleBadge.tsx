import type { CertificationLifecycleStatus } from '@/lib/api/cabCertificationApi'
import { cn } from '@/lib/utils'

/**
 * Single source of truth for certification lifecycle status colors — was a
 * private helper inside CabCertificationCyclesPage; lifted out so the manage
 * page renders the exact same badge instead of redefining the color map.
 */
const LIFECYCLE_STATUS_STYLES: Record<CertificationLifecycleStatus, string> = {
  active: 'bg-[#eafaf1] text-[#16a34a]',
  upcoming: 'bg-[#e8edfc] text-primary',
  suspended: 'bg-[#fff7ed] text-[#ea580c]',
  expired: 'bg-[#fef2f2] text-[#dc2626]',
}

interface CertificationLifecycleBadgeProps {
  status: CertificationLifecycleStatus
  label: string
  className?: string
}

export function CertificationLifecycleBadge({ status, label, className }: CertificationLifecycleBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-[4px] px-3 py-1 text-[12px] font-medium whitespace-nowrap',
        LIFECYCLE_STATUS_STYLES[status],
        className,
      )}
    >
      {label}
    </span>
  )
}