import type { CertificationAgreementStatus } from '@/lib/api/cabCertificationAgreementsApi'
import { cn } from '@/lib/utils'

/**
 * Single source of truth for certification agreement status colors.
 * Rectangular badge styled to match the standard across CAB tables.
 */
const STATUS_STYLES: Record<CertificationAgreementStatus, string> = {
  draft: 'bg-[#f1f5f9] text-[#475569]',
  sent: 'bg-[#fef9c3] text-[#a16207]',
  client_signed: 'bg-[#e8edfc] text-primary',
  active: 'bg-[#dcfce7] text-[#15803d]',
  superseded: 'bg-[#f1f5f9] text-[#64748b]',
  terminated: 'bg-[#fde8e8] text-[#dc2626]',
}

interface AgreementStatusBadgeProps {
  status: CertificationAgreementStatus
  label: string
  className?: string
}

export function AgreementStatusBadge({
  status,
  label,
  className,
}: AgreementStatusBadgeProps) {
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
