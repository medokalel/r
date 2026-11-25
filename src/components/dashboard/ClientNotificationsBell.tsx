import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  AppIcon,
  CalendarIcon,
  DocumentReceivedIcon,
  NotificationIcon,
  ReceiptIcon,
  type AppIconComponent,
} from '@/components/icons'
import {
  listClientPlanNotifications,
  markAllClientPlanNotificationsRead,
  markClientPlanNotificationRead,
  type ClientPlanNotification,
  type ClientPlanNotificationKind,
} from '@/lib/api/clientNotificationsApi'
import { cn } from '@/lib/utils'

const kindIconConfig: Record<ClientPlanNotificationKind, { icon: AppIconComponent; bgColor: string }> = {
  planSent: { icon: DocumentReceivedIcon, bgColor: 'bg-[#d0fae5]' },
  planRescheduled: { icon: CalendarIcon, bgColor: 'bg-[#fef3c6]' },
  quotationIssued: { icon: ReceiptIcon, bgColor: 'bg-[#dbeafe]' },
}

/** Same relative labels as the dashboard activity feed. */
function relativeTimeLabel(
  isoTimestamp: string,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime()
  const diffMinutes = Math.max(1, Math.round(diffMs / (60 * 1000)))
  if (diffMinutes < 60) return t('dashboard.activities.minutesAgo', { count: diffMinutes })
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours === 1) return t('dashboard.activities.hourAgo')
  return t('dashboard.activities.hoursAgo', { count: diffHours })
}

/**
 * The audit client's notification bell: planning events (plan sent, plan
 * rescheduled) and quotations received, with an unread badge, replacing the old static placeholder.
 * Tapping a notification marks it read and opens that audit plan or quotation.
 */
export function ClientNotificationsBell() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<ClientPlanNotification[]>([])

  const refresh = useCallback(() => {
    listClientPlanNotifications()
      .then(setNotifications)
      .catch(() => {
        // Keep the last known list if the read fails.
      })
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [refresh])

  const unreadCount = notifications.filter((notification) => !notification.readAt).length

  const toggleOpen = () => {
    if (!open) refresh()
    setOpen((prev) => !prev)
  }

  const handleOpenNotification = (notification: ClientPlanNotification) => {
    markClientPlanNotificationRead(notification.id)
    setOpen(false)
    navigate(notification.targetPath)
  }

  const handleMarkAllRead = () => {
    markAllClientPlanNotificationsRead().then(refresh)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className="relative flex size-10 items-center justify-center text-neutral-600 hover:text-primary"
        aria-label={t('accreditation.notifications')}
        aria-expanded={open}
      >
        <AppIcon icon={NotificationIcon} size={30} />
        {unreadCount > 0 && (
          <span className="absolute end-1 top-0.5 flex size-[18px] items-center justify-center rounded-full bg-[#1236a3] text-[11px] font-semibold leading-none text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div id="client-notifications-panel" className="fixed inset-x-3 top-20 z-40 mt-2 flex flex-col rounded-[var(--radius-md)] border border-[#ececec] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] sm:absolute sm:inset-x-auto sm:end-0 sm:top-full sm:w-[320px] sm:max-w-[calc(100vw-24px)]">
            <div className="flex items-center justify-between gap-2 border-b border-[#ececec] px-4 py-3">
              <p className="text-body-2-medium text-neutral-900">{t('clientNotifications.title')}</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-body-3 text-primary hover:underline"
                >
                  {t('clientNotifications.markAllRead')}
                </button>
              )}
            </div>

            <div className="max-h-[320px] overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-body-3 text-neutral-500">
                  {t('clientNotifications.empty')}
                </p>
              ) : (
                notifications.map((notification) => {
                  const { icon, bgColor } = kindIconConfig[notification.kind]
                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleOpenNotification(notification)}
                      className={cn(
                        'flex w-full items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-[#f3f6fd]',
                        !notification.readAt && 'bg-[#f8faff]',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[8px]',
                          bgColor,
                        )}
                      >
                        <AppIcon icon={icon} size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-body-3-medium leading-[1.5] text-neutral-900">
                          {t(`clientNotifications.items.${notification.kind}`, {
                            planNumber: notification.reference,
                            reference: notification.reference,
                          })}
                        </span>
                        <span className="mt-0.5 block text-[12px] text-neutral-500">
                          {relativeTimeLabel(notification.occurredAt, t)}
                        </span>
                      </span>
                      {!notification.readAt && (
                        <span className="mt-2 size-2 shrink-0 rounded-full bg-[#1236a3]" aria-hidden />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
