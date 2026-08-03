import { useTranslation } from 'react-i18next'
import {
  AppIcon,
  CertificateBadgeIcon,
  CorrectiveActionIcon,
  FileReviewIcon,
  SuccessCircleIcon,
  WalletIcon,
} from '@/components/icons'
import type { CabActivityItem, CabActivityType } from '@/lib/api/cabDashboardApi'
import { cn } from '@/lib/utils'

const activityIconConfig: Record<CabActivityType, { icon: typeof CertificateBadgeIcon; bgColor: string; iconColor: string }> = {
  certificateIssued: { icon: CertificateBadgeIcon, bgColor: 'bg-[#dcfce7]', iconColor: 'text-[#16a34a]' },
  auditCompleted: { icon: SuccessCircleIcon, bgColor: 'bg-[#dbeafe]', iconColor: 'text-[#1447e6]' },
  infoRequested: { icon: CorrectiveActionIcon, bgColor: 'bg-[#fef3c6]', iconColor: 'text-[#a58401]' },
  reviewAssigned: { icon: FileReviewIcon, bgColor: 'bg-[#ede9fe]', iconColor: 'text-[#6d28d9]' },
  paymentReceived: { icon: WalletIcon, bgColor: 'bg-[#d7f4f0]', iconColor: 'text-[#0f9488]' },
}

const bylineKeyByType: Record<CabActivityType, string> = {
  certificateIssued: 'cab.dashboard.recentActivity.byline.by',
  auditCompleted: 'cab.dashboard.recentActivity.byline.by',
  infoRequested: 'cab.dashboard.recentActivity.byline.by',
  reviewAssigned: 'cab.dashboard.recentActivity.byline.for',
  paymentReceived: 'cab.dashboard.recentActivity.byline.plain',
}

function relativeTimeLabel(
  isoTimestamp: string,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime()
  const diffMinutes = Math.max(1, Math.round(diffMs / (60 * 1000)))
  if (diffMinutes < 60) return t('cab.dashboard.recentActivity.minutesAgo', { count: diffMinutes })
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours === 1) return t('cab.dashboard.recentActivity.hourAgo')
  return t('cab.dashboard.recentActivity.hoursAgo', { count: diffHours })
}

interface CabRecentActivityProps {
  activities: CabActivityItem[]
  onViewAll?: () => void
}

export function CabRecentActivity({ activities, onViewAll }: CabRecentActivityProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col rounded-[16px] border border-[#ececec] bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-neutral-900">
          {t('cab.dashboard.recentActivity.title')}
        </h3>
        {onViewAll && (
          <button type="button" onClick={onViewAll} className="text-[13px] text-primary hover:underline">
            {t('cab.dashboard.viewAll')}
          </button>
        )}
      </div>

      <ul className="flex flex-col gap-4">
        {activities.map((activity) => {
          const { icon, bgColor, iconColor } = activityIconConfig[activity.type]
          return (
            <li key={activity.id} className="flex items-start gap-3">
              <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', bgColor)}>
                <AppIcon icon={icon} size={16} className={iconColor} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium leading-[1.5] text-neutral-900">
                  {t(activity.titleKey, { entityName: activity.entityName })}
                </p>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  {activity.actorName && (
                    <span className="text-[12px] text-neutral-500">
                      {t(bylineKeyByType[activity.type], { value: activity.actorName })}
                    </span>
                  )}
                  <span className="shrink-0 text-[12px] text-neutral-400">
                    {relativeTimeLabel(activity.occurredAt, t)}
                  </span>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}