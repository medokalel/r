import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppIcon, MailIcon, NotificationIcon, LogoutIcon } from '@/components/icons'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { Tooltip } from '@/components/ui/Tooltip'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { getAuthSession, clearAuthSession } from '@/lib/authStorage'
import { getUserProfile, type UserProfile } from '@/lib/api/userApi'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

function HeaderDivider({ className }: { className?: string }) {
  return <div className={cn('h-14 w-px shrink-0 bg-neutral-200', className)} aria-hidden />
}

function getPeriodKey(hour: number): 'am' | 'pm' {
  return hour < 12 ? 'am' : 'pm'
}

interface AccreditationHeaderProps {
  titleKey?: string
  orderNumber?: string
  officerName?: string
  officerEmail?: string
}

export function AccreditationHeader({
  titleKey = 'accreditation.title',
  orderNumber,
  officerName,
  officerEmail,
}: AccreditationHeaderProps) {
  const { t, i18n } = useTranslation()
  const session = getAuthSession()
  const [user, setUser] = useState<UserProfile | null>(session?.user ?? null)
  const [now, setNow] = useState(() => new Date())
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

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

  const timeLabel = new Intl.DateTimeFormat(i18n.language, { hour: '2-digit', minute: '2-digit', hour12: true })
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
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-4 border-b-2 border-[#ececec] bg-white px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <img
          src="/casco-logo.svg"
          alt={t('common.appName')}
          className="h-20 w-auto md:hidden"
        />
        <h1 className="hidden text-h3-semi text-primary whitespace-nowrap md:block">
          {t(titleKey)}
        </h1>

        {orderNumber && <HeaderDivider className="hidden lg:block" />}
        {orderNumber && (
          <div className="hidden min-w-0 flex-col items-start gap-1 lg:flex">
            <span className="w-fit rounded-[6px] bg-[#e8edfc] px-3 py-1 text-[13px] font-medium leading-[1.6] text-[#1236a3]">
              {t('accreditation.orderNumber')}
            </span>
            <Tooltip label={orderNumber} side="bottom" align="start">
              <p className="max-w-[220px] truncate text-h3-semi text-neutral-900" dir="ltr">
                {orderNumber}
              </p>
            </Tooltip>
          </div>
        )}

        {orderNumber && officerName && <HeaderDivider className="hidden lg:block" />}

        {officerName && (
          <div className="hidden flex-col items-start lg:flex">
            <span className="w-fit rounded-[6px] bg-[#e8edfc] px-2 py-0.5 text-[12px] font-medium leading-[1.6] text-[#1236a3]">
              {t('accreditation.assignedOfficer')}
            </span>
            <p className="text-body-2-medium text-neutral-900 whitespace-nowrap">{officerName}</p>
            {officerEmail && (
              <p className="flex items-center gap-1 text-body-3 text-primary whitespace-nowrap" dir="ltr">
                <AppIcon icon={MailIcon} size={14} />
                {officerEmail}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">

        {/* Time and date container */}
        <div className="hidden lg:flex flex-col items-start gap-1">
          {/* badge */}
          <span className="w-fit rounded-[6px] bg-[#e8edfc] px-2 py-0.5 text-[12px] font-medium leading-[1.6] text-[#1236a3]">
            {t('accreditation.timeAndDate')}
          </span>
          {/* time and date */}
          <p className="text-body-2-medium text-neutral-600 whitespace-nowrap">
            {timeLabel} {periodLabel} <span className="text-neutral-100">|</span> {dateLabel}
          </p>
        </div>

        <HeaderDivider className="hidden lg:block" />

        <button
          type="button"
          className="relative flex size-10 items-center justify-center text-neutral-600 hover:text-primary"
          aria-label={t('accreditation.notifications')}
        >
          <AppIcon icon={NotificationIcon} size={30} />
          <span className="absolute end-1 top-0.5 flex size-[18px] items-center justify-center rounded-full bg-[#1236a3] px-2.5 py-2.5 text-[11px] font-semibold leading-none text-white">
            3
          </span>
        </button>

        <HeaderDivider className="hidden min-[400px]:block" />

        <div className="hidden min-[400px]:block">
          <LanguageToggle variant="icon" />
        </div>

        <HeaderDivider className="hidden min-[400px]:block" />

        <div className="flex items-center gap-6">
          {/* Name + email — desktop only */}
          <div className="hidden text-end min-[924px]:block">
            <p className="text-body-3-medium text-neutral-900">{displayName}</p>
            {secondaryLine && (
              <p className="text-body-3 text-neutral-600" dir="ltr">{secondaryLine}</p>
            )}
          </div>

          {/* Avatar — tapping it on mobile opens name/email/logout */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="min-[924px]:pointer-events-none"
              aria-label={displayName}
              aria-expanded={mobileMenuOpen}
            >
              <UserAvatar alt={displayName} className="size-14 border-2" />
            </button>

            {mobileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30 min-[924px]:hidden"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-hidden
                />
                <div className="absolute end-0 top-full z-40 mt-2 w-56 rounded-[var(--radius-md)] border border-[#ececec] bg-white p-3 shadow-[0_10px_30px_rgba(0,0,0,0.12)] min-[924px]:hidden">
                  <p className="truncate text-body-3-medium text-neutral-900">{displayName}</p>
                  {secondaryLine && (
                    <p className="truncate text-body-3 text-neutral-600" dir="ltr">{secondaryLine}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-3 flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-error-500 hover:bg-[#fef2f2]"
                  >
                    <AppIcon icon={LogoutIcon} size={18} />
                    <span className="text-body-3">{t('nav.logout')}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}