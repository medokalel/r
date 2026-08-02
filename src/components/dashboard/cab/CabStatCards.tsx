import { useTranslation } from 'react-i18next'
import {
  AppIcon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  PendingBurstIcon,
  SearchIcon,
  ShieldIcon,
  WalletIcon,
} from '@/components/icons'
import type { CabDashboardStats } from '@/lib/api/cabDashboardApi'
import { cn } from '@/lib/utils'

interface CabStatCardConfig {
  key: keyof CabDashboardStats
  labelKey: string
  bgColor: string
  iconColor: string
  icon: typeof FileTextIcon
  /** True for the payments card, which shows a currency amount instead of "View all". */
  currency?: boolean
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
    key: 'outstandingPaymentsEgp',
    labelKey: 'cab.dashboard.stats.outstandingPayments',
    bgColor: 'bg-[#fee2e2]',
    iconColor: 'text-[#dc2626]',
    icon: WalletIcon,
    currency: true,
  },
]

interface CabStatCardsProps {
  stats: CabDashboardStats | null
  loading: boolean
}

export function CabStatCards({ stats, loading }: CabStatCardsProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-7">
      {statCards.map(({ key, labelKey, bgColor, iconColor, icon: Icon, currency }) => (
        <div
          key={key}
          className="flex flex-col gap-4 rounded-[16px] border border-[#ececec] bg-white p-4"
        >
          <div className="flex items-center justify-between">
            <span className={cn('flex size-10 items-center justify-center rounded-[10px]', bgColor)}>
              <AppIcon icon={Icon} size={20} className={iconColor} />
            </span>
            <span className="text-[26px] font-bold leading-none text-neutral-900">
              {loading || !stats ? '—' : currency ? null : stats[key].toLocaleString()}
            </span>
          </div>

          <div>
            <p className="text-[14px] font-medium text-neutral-700">{t(labelKey)}</p>
            {currency ? (
              <p className="mt-1 text-[15px] font-semibold text-[#dc2626]">
                {loading || !stats
                  ? '—'
                  : `${t('cab.dashboard.stats.egp')} ${stats[key].toLocaleString()}`}
              </p>
            ) : (
              <button
                type="button"
                className="mt-1 text-[13px] text-neutral-400 transition-colors hover:text-primary"
              >
                {t('cab.dashboard.stats.viewAll')} →
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}