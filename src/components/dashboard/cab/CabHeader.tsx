import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, GlobeIcon, NotificationIcon } from '@/components/icons'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { getAuthSession } from '@/lib/authStorage'

interface CabHeaderProps {
  title: string
  subtitle?: string
  notificationCount?: number
}

export function CabHeader({ title, subtitle, notificationCount = 0 }: CabHeaderProps) {
  const { t, i18n } = useTranslation()
  const session = getAuthSession()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const timeLabel = new Intl.DateTimeFormat(i18n.language, { hour: '2-digit', minute: '2-digit', hour12: true }).format(now)
  const dateLabel = new Intl.DateTimeFormat(i18n.language, { day: '2-digit', month: 'long', year: 'numeric' }).format(now)

  const userName = session?.user?.email ?? ''
  const roleName = session?.role?.name ?? ''

  return (
    <header className="flex items-center justify-between border-b border-[#ececec] bg-white px-6 py-4">
      <div>
        <h1 className="text-[22px] font-bold text-primary">{title}</h1>
        {subtitle && <p className="text-[14px] text-neutral-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden flex-col items-end text-[13px] sm:flex">
          <span className="rounded-full bg-primary-subtle px-2 py-0.5 text-[11px] font-medium text-primary">
            {t('cab.header.timeAndDate')}
          </span>
          <span className="mt-1 text-neutral-600">
            {timeLabel} · {dateLabel}
          </span>
        </div>

        <button
          type="button"
          aria-label={t('cab.header.notifications')}
          className="relative flex size-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-50"
        >
          <AppIcon icon={NotificationIcon} size={22} />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 end-0 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white">
              {notificationCount}
            </span>
          )}
        </button>

        <AppIcon icon={GlobeIcon} size={20} className="text-neutral-500" />

        <div className="flex items-center gap-2">
          <div className="hidden text-end sm:block">
            <p className="text-[14px] font-medium text-neutral-900">{userName}</p>
            <p className="text-[12px] text-neutral-500">{roleName}</p>
          </div>
          <UserAvatar alt={userName} className="size-10" />
        </div>
      </div>
    </header>
  )
}
