import { useTranslation } from 'react-i18next'
import { AppIcon, UserIcon, UsersIcon } from '@/components/icons'
import type { UsersStats } from '@/lib/api/usersApi'
import { cn } from '@/lib/utils'

interface StatCardConfig {
  key: keyof UsersStats
  labelKey: string
  bgColor: string
  iconColor: string
  icon: typeof UserIcon
}

// Colors reused from the main Dashboard's stat cards for visual consistency
const statCards: StatCardConfig[] = [
  {
    key: 'total',
    labelKey: 'users.stats.total',
    bgColor: 'bg-[#fef3c6]',
    iconColor: 'text-[#a58401]',
    icon: UsersIcon,
  },
  {
    key: 'active',
    labelKey: 'users.stats.active',
    bgColor: 'bg-[#d7f4f0]',
    iconColor: 'text-[#0f9488]',
    icon: UserIcon,
  },
  {
    key: 'inactive',
    labelKey: 'users.stats.inactive',
    bgColor: 'bg-neutral-100',
    iconColor: 'text-neutral-500',
    icon: UserIcon,
  },
]

interface UsersStatCardsProps {
  stats: UsersStats | null
  loading: boolean
}

export function UsersStatCards({ stats, loading }: UsersStatCardsProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-3">
      {statCards.map(({ key, labelKey, bgColor, iconColor, icon: Icon }) => (
        <div
          key={key}
          className={cn(
            'flex min-h-[110px] flex-col justify-between gap-3 rounded-[16px] p-4 sm:min-h-0 sm:gap-6 sm:p-5',
            bgColor
          )}
        >
          <div className="flex justify-start">
            <AppIcon icon={Icon} size={28} className={cn('size-6 sm:size-[28px]', iconColor)} />
          </div>
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