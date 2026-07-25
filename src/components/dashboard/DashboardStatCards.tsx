import { useTranslation } from 'react-i18next'
import { ClipboardText, Refresh2, ShieldTick, Profile2User } from 'iconsax-reactjs'
import type { DashboardStats } from '@/lib/api/dashboardApi'
import { cn } from '@/lib/utils'

interface StatCardConfig {
  key: keyof DashboardStats
  labelKey: string
  bgColor: string
  iconColor: string
  icon: typeof ShieldTick
}

const statCards: StatCardConfig[] = [
  {
    key: 'approvedCertificates',
    labelKey: 'dashboard.stats.approvedCertificates',
    bgColor: 'bg-[#dbeafe]',
    iconColor: 'text-[#1447e6]',
    icon: ShieldTick,
  },
  {
    key: 'currentOrders',
    labelKey: 'dashboard.stats.currentOrders',
    bgColor: 'bg-[#fef3c6]',
    iconColor: 'text-[#a58401]',
    icon: ClipboardText,
  },
  {
    key: 'pendingRequests',
    labelKey: 'dashboard.stats.pendingRequests',
    bgColor: 'bg-[#d7f4f0]',
    iconColor: 'text-[#0f9488]',
    icon: Refresh2,
  },
  {
    key: 'users',
    labelKey: 'dashboard.stats.users',
    bgColor: 'bg-[#e2e5f9]',
    iconColor: 'text-[#3730a3]',
    icon: Profile2User,
  },
]

interface DashboardStatCardsProps {
  stats: DashboardStats | null
  loading: boolean
}

export function DashboardStatCards({ stats, loading }: DashboardStatCardsProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {statCards.map(({ key, labelKey, bgColor, iconColor, icon: Icon }) => (
        <div
          key={key}
          className={cn(
            'flex flex-col gap-6 rounded-[16px] p-5',
            bgColor
          )}
        >
          <Icon size={28} variant="Bulk" className={iconColor} />
          <div className="flex flex-col gap-1">
            <p className="text-[32px] font-semibold leading-[1.3] text-neutral-900">
              {loading || !stats ? '—' : stats[key].toLocaleString()}
            </p>
            <p className="text-[16px] font-medium text-neutral-700">{t(labelKey)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}