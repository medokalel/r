import { useTranslation } from 'react-i18next'
import {
  AppIcon,
  CertificateBadgeIcon,
  OrdersFolderIcon,
  PendingBurstIcon,
  UsersShieldIcon,
} from '@/components/icons'
import type { DashboardStats } from '@/lib/api/dashboardApi'
import { cn } from '@/lib/utils'

interface StatCardConfig {
  key: keyof DashboardStats
  labelKey: string
  bgColor: string
  iconColor: string
  icon: typeof CertificateBadgeIcon
}

const statCards: StatCardConfig[] = [
  {
    key: 'approvedCertificates',
    labelKey: 'dashboard.stats.approvedCertificates',
    bgColor: 'bg-[#dbeafe]',
    iconColor: 'text-[#1447e6]',
    icon: CertificateBadgeIcon,
  },
  {
    key: 'currentOrders',
    labelKey: 'dashboard.stats.currentOrders',
    bgColor: 'bg-[#fef3c6]',
    iconColor: 'text-[#a58401]',
    icon: OrdersFolderIcon,
  },
  {
    key: 'pendingRequests',
    labelKey: 'dashboard.stats.pendingRequests',
    bgColor: 'bg-[#d7f4f0]',
    iconColor: 'text-[#0f9488]',
    icon: PendingBurstIcon,
  },
  {
    key: 'users',
    labelKey: 'dashboard.stats.users',
    bgColor: 'bg-[#e2e5f9]',
    iconColor: 'text-[#3730a3]',
    icon: UsersShieldIcon,
  },
]

interface DashboardStatCardsProps {
  stats: DashboardStats | null
  loading: boolean
}

export function DashboardStatCards({ stats, loading }: DashboardStatCardsProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
      {statCards.map(({ key, labelKey, bgColor, iconColor, icon: Icon }) => (
        <div
          key={key}
          className={cn(
            'flex min-h-[120px] flex-col justify-between gap-3 rounded-[16px] p-4 sm:justify-start sm:gap-6 sm:p-5',
            bgColor
          )}
        >
          <AppIcon icon={Icon} size={38} className={cn('size-8 sm:size-[38px]', iconColor)} />
          <div className="flex flex-col gap-1">
            <p className="text-[clamp(1.4rem,4vw,2rem)] font-semibold leading-[1.3] text-neutral-900">
              {loading || !stats ? '—' : stats[key].toLocaleString()}
            </p>
            <p className="text-[clamp(0.785rem,1.5vw,1rem)] font-medium text-neutral-700">{t(labelKey)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}