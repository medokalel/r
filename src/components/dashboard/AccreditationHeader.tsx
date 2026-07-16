import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, NotificationIcon } from '@/components/icons'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { getAuthSession } from '@/lib/authStorage'
import { getUserProfile, type UserProfile } from '@/lib/api/userApi'

function HeaderDivider() {
  return <div className="h-14 w-px shrink-0 bg-neutral-200" aria-hidden />
}

function getPeriodKey(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

interface AccreditationHeaderProps {
  titleKey?: string
}

export function AccreditationHeader({ titleKey = 'accreditation.title' }: AccreditationHeaderProps) {
  const { t, i18n } = useTranslation()
  const session = getAuthSession()
  const [user, setUser] = useState<UserProfile | null>(session?.user ?? null)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let cancelled = false
    getUserProfile()
      .then((profile) => {
        if (!cancelled) setUser(profile)
      })
      .catch(() => {
        // Keep the cached session user if the request fails
      })
    return () => {
      cancelled = true
    }
  }, [])

  const displayName = session?.organization?.name ?? user?.email ?? ''
  const secondaryLine = session?.organization?.name ? (user?.email ?? '') : (session?.role?.name ?? '')

  const timeLabel = new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', minute: '2-digit', hour12: true })
    .formatToParts(now)
    .filter((part) => part.type !== 'dayPeriod')
    .map((part) => part.value)
    .join('')
    .trim()
  const periodLabel = t(`accreditation.${getPeriodKey(now.getHours())}`)
  const dateParts = new Intl.DateTimeFormat(i18n.language, { day: '2-digit', month: 'long', year: 'numeric' })
  .formatToParts(now)

  const day = dateParts.find((part) => part.type === 'day')?.value ?? ''
  const month = dateParts.find((part) => part.type === 'month')?.value ?? ''
  const year = dateParts.find((part) => part.type === 'year')?.value ?? ''

  const dateLabel = `${day} ${month} ${year}`

  return (
    <header className="flex shrink-0 items-center justify-between border-b-2 border-[#ececec] bg-white px-5 py-4">
      <div className="flex items-center gap-4">
        <h1 className="text-h3-semi text-primary whitespace-nowrap">{t(titleKey)}</h1>
      </div>

      <div className="flex items-center gap-4">
        
        {/* Time and date container */}
        <div className="flex flex-col items-start gap-1">
          {/* badge */}
          <span className="w-fit rounded-[6px] bg-[#e8edfc] px-2 py-0.5 text-[12px] font-medium leading-[1.6] text-[#1236a3]">
            {t('accreditation.timeAndDate')}
          </span>
          {/* time and date */}
          <p className="text-body-2-medium text-neutral-600 whitespace-nowrap">
            {timeLabel} {periodLabel} <span className="text-neutral-300">|</span> {dateLabel}
          </p>
        </div>

        <HeaderDivider />

        <button
          type="button"
          className="relative flex size-10 items-center justify-center text-neutral-600 hover:text-primary"
          aria-label={t('accreditation.notifications')}
        >
          <AppIcon icon={NotificationIcon} size={32} />
          <span className="absolute -end-0.5 -top-0.5 flex size-[18px] items-center justify-center rounded-full bg-error-500 text-[11px] font-semibold leading-none text-white">
            3
          </span>
        </button>

        <HeaderDivider />

        <LanguageToggle variant="icon" />

        <HeaderDivider />

        <div className="flex items-center gap-6">
          <div className="text-end">
            <p className="text-body-3-medium text-neutral-900">{displayName}</p>
            {secondaryLine && (
              <p className="text-body-3 text-neutral-600" dir="ltr">{secondaryLine}</p>
            )}
          </div>
          <UserAvatar alt={displayName} className="size-14 border-2" />
        </div>
      </div>
    </header>
  )
}