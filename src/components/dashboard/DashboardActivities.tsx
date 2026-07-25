import { useTranslation } from 'react-i18next'
import { Refresh2, Sms, TickCircle } from 'iconsax-reactjs'
import type { DashboardActivity, DashboardActivityType } from '@/lib/api/dashboardApi'
import { cn } from '@/lib/utils'

const activityIconConfig: Record<
  DashboardActivityType,
  { icon: typeof TickCircle; bgColor: string; iconColor: string }
> = {
  documentReceived: { icon: TickCircle, bgColor: 'bg-[#d0fae5]', iconColor: 'text-[#00994d]' },
  correspondenceSent: { icon: Sms, bgColor: 'bg-[#dbeafe]', iconColor: 'text-[#1447e6]' },
  statusChanged: { icon: Refresh2, bgColor: 'bg-[#fef3c6]', iconColor: 'text-[#a58401]' },
}

function relativeTimeLabel(
  isoTimestamp: string,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime()
  const diffMinutes = Math.max(1, Math.round(diffMs / (60 * 1000)))
  if (diffMinutes < 60) return t('dashboard.activities.minutesAgo', { count: diffMinutes })
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours === 1) return t('dashboard.activities.hourAgo')
  return t('dashboard.activities.hoursAgo', { count: diffHours })
}

interface DashboardActivitiesProps {
  activities: DashboardActivity[]
  loading: boolean
  onViewAll?: () => void
}

export function DashboardActivities({ activities, loading, onViewAll }: DashboardActivitiesProps) {
  const { t } = useTranslation()

  return (
    <div className="flex w-full max-w-[400px] flex-col rounded-[16px] border border-[#ececec] bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <Refresh2 size={20} variant="Bulk" className="text-primary" />
        <h2 className="text-[18px] font-semibold text-neutral-900">
          {t('dashboard.activities.title')}
        </h2>
      </div>

      <div className="flex flex-1 flex-col">
        {loading ? (
          <p className="py-6 text-center text-neutral-500">{t('common.loading')}</p>
        ) : activities.length === 0 ? (
          <p className="py-6 text-center text-neutral-500">—</p>
        ) : (
          activities.map((activity, index) => {
            const { icon: Icon, bgColor, iconColor } = activityIconConfig[activity.type]
            return (
              <div
                key={activity.id}
                className={cn(
                  'flex gap-3 py-4',
                  index < activities.length - 1 && 'border-b border-[#f0f0f0]'
                )}
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full',
                    bgColor
                  )}
                >
                  <Icon size={18} variant="Bold" className={iconColor} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-neutral-500">
                    {relativeTimeLabel(activity.occurredAt, t)}
                  </p>
                  <p className="text-[15px] leading-[1.6] text-neutral-900">
                    {t(activity.titleKey)}{' '}
                    <span className="font-medium text-primary">{activity.entityName}</span>
                  </p>
                  {activity.statusNote && (
                    <p className="text-[13px] text-neutral-500">{t(activity.statusNote)}</p>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="mt-2 flex h-12 w-full items-center justify-center rounded-[8px] bg-[#f3f6fd] text-[15px] font-medium text-primary transition-colors hover:bg-[#e8edfc]"
        >
          {t('dashboard.activities.viewAll')}
        </button>
      )}
    </div>
  )
}