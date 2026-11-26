import type { CertificationAgreementStatus } from '@/lib/api/cabCertificationAgreementsApi'
import { cn } from '@/lib/utils'

interface AgreementStatusBadgeProps {
  status: CertificationAgreementStatus
  label: string
  className?: string
}

const STATUS_STYLES: Record<CertificationAgreementStatus, string> = {
  draft: 'bg-[#f1f5f9] text-[#475569]',
  sent: 'bg-[#fef3c7] text-[#b45309]',
  client_signed: 'bg-[#e8edfc] text-primary',
  active: 'bg-[#dcfce7] text-[#15803d]',
  superseded: 'bg-[#f3f4f6] text-[#6b7280]',
  terminated: 'bg-[#fee2e2] text-[#b91c1c]',
}

export function AgreementStatusBadge({ status, label, className }: AgreementStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[6px] px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap',
        STATUS_STYLES[status] ?? STATUS_STYLES.draft,
        className,
      )}
    >
      {label}
    </span>
  )
}
