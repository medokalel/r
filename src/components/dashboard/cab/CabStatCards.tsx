import { useTranslation } from 'react-i18next'
import {
  AppIcon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  PendingBurstIcon,
  SearchIcon,
  ShieldIcon,
  TrendDownIcon,
  TrendUpIcon,
  UserIcon,
  WalletIcon,
} from '@/components/icons'
import { CardFooterLink } from '@/components/ui/CardFooterLink'
import type { CabDashboardStats } from '@/lib/api/cabDashboardApi'
import { cn } from '@/lib/utils'

type StatKey = keyof CabDashboardStats['trends']

interface CabStatCardConfig {
  key: StatKey
  labelKey: string
  bgColor: string
  iconColor: string
  icon: typeof FileTextIcon
  /** True for the payments card: shows a currency read-out instead of "View all". */
  currencyFooter?: boolean
  /** True for the freelancer payables card: the main value is an EGP amount, not a plain count. */
  currencyValue?: boolean
}

const statCards: CabStatCardConfig[] = [
  {
    key: 'newApplications',
    labelKey: 'cab.dashboard.stats.newApplications',
    bgColor: 'bg-[#dbeafe]',
    iconColor: 'text-[#1447e6]',
    icon: FileTextIcon,
  },
  {
    key: 'pendingReviews',
    labelKey: 'cab.dashboard.stats.pendingReviews',
    bgColor: 'bg-[#fef3c6]',
    iconColor: 'text-[#a58401]',
    icon: EyeIcon,
  },
  {
    key: 'upcomingAudits',
    labelKey: 'cab.dashboard.stats.upcomingAudits',
    bgColor: 'bg-[#d7f4f0]',
    iconColor: 'text-[#0f9488]',
    icon: PendingBurstIcon,
  },
  {
    key: 'technicalReviewsPending',
    labelKey: 'cab.dashboard.stats.technicalReviewsPending',
    bgColor: 'bg-[#ede9fe]',
    iconColor: 'text-[#6d28d9]',
    icon: SearchIcon,
  },
  {
    key: 'decisionsPending',
    labelKey: 'cab.dashboard.stats.decisionsPending',
    bgColor: 'bg-[#d7f4f0]',
    iconColor: 'text-[#0f9488]',
    icon: ShieldIcon,
  },
  {
    key: 'certificatesToIssue',
    labelKey: 'cab.dashboard.stats.certificatesToIssue',
    bgColor: 'bg-[#dbeafe]',
    iconColor: 'text-[#1447e6]',
    icon: DownloadIcon,
  },
  {
    key: 'outstandingPayments',
    labelKey: 'cab.dashboard.stats.outstandingPayments',
    bgColor: 'bg-[#fee2e2]',
    iconColor: 'text-[#dc2626]',
    icon: WalletIcon,
    currencyFooter: true,
  },
  {
    key: 'freelancerPayablesEgp',
    labelKey: 'cab.dashboard.stats.freelancerPayables',
    bgColor: 'bg-[#fce7f3]',
    iconColor: 'text-[#be185d]',
    icon: UserIcon,
    currencyValue: true,
  },
]

function TrendBadge({ direction, percentage }: { direction: 'up' | 'down'; percentage: number }) {
  const isUp = direction === 'up'
  return (
    <span
      className={cn(
        'flex items-center gap-1 text-[13px] font-medium',
        isUp ? 'text-[#22c55e]' : 'text-[#dc2626]'
      )}
    >
      <AppIcon icon={isUp ? TrendUpIcon : TrendDownIcon} size={14} />
      {percentage}%
    </span>
  )
}

interface CabStatCardsProps {
  stats: CabDashboardStats | null
  loading: boolean
}

export function CabStatCards({ stats, loading }: CabStatCardsProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      {statCards.map(({ key, labelKey, bgColor, iconColor, icon: Icon, currencyFooter, currencyValue }) => {
        const value = stats?.[key]
        const trend = stats?.trends[key]

        return (
          <div
            key={key}
            className="flex flex-col gap-4 rounded-[16px] border border-[#ececec] bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-medium text-neutral-700">{t(labelKey)}</p>
              <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-[10px]', bgColor)}>
                <AppIcon icon={Icon} size={20} className={iconColor} />
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-[26px] font-bold leading-none text-neutral-900">
                {loading || value === undefined ? '—' : value.toLocaleString()}
              </span>
              {currencyValue && !loading && <span className="text-[13px] text-neutral-500">{t('cab.dashboard.stats.egp')}</span>}
            </div>

            <div className="flex items-center justify-between">
              {trend && !loading ? <TrendBadge direction={trend.direction} percentage={trend.percentage} /> : <span />}

              {currencyFooter ? (
                <span className="text-[13px] font-semibold text-primary">
                  {loading || !stats
                    ? '—'
                    : `${t('cab.dashboard.stats.egp')} ${stats.outstandingPaymentsEgp.toLocaleString()}`}
                </span>
              ) : (
                <CardFooterLink label={t('cab.dashboard.stats.viewAll')} onClick={() => undefined} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}