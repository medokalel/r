import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AppIcon, NotificationIcon, LogoutIcon } from '@/components/icons'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { getAuthSession, clearAuthSession } from '@/lib/authStorage'
import { cn } from '@/lib/utils'

function HeaderDivider({ className }: { className?: string }) {
  return <div className={cn('h-14 w-px shrink-0 bg-neutral-200', className)} aria-hidden />
}

interface CabHeaderProps {
  title: string
  subtitle?: string
  notificationCount?: number
}

/** Matches AccreditationHeader's style/layout exactly, scoped to the CAB dashboard's simpler title+subtitle. */
export function CabHeader({ title, subtitle, notificationCount = 0 }: CabHeaderProps) {
  const { t, i18n } = useTranslation()
  const session = getAuthSession()
  const navigate = useNavigate()
  const [now, setNow] = useState(() => new Date())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const timeLabel = new Intl.DateTimeFormat(i18n.language, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(now)
  const dateLabel = new Intl.DateTimeFormat(i18n.language, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(now)

  const userName = session?.user?.email ?? ''
  const roleName = session?.role?.name ?? ''

  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-4 border-b-2 border-[#ececec] bg-white px-5 py-4">
      <div>
        <h1 className="text-h3-semi text-primary whitespace-nowrap">{title}</h1>
        {subtitle && <p className="text-body-3 text-neutral-500">{subtitle}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* Time and date container */}
        <div className="hidden lg:flex flex-col items-start gap-1">
          <span className="w-fit rounded-[6px] bg-[#e8edfc] px-2 py-0.5 text-[12px] font-medium leading-[1.6] text-[#1236a3]">
            {t('cab.header.timeAndDate')}
          </span>
          <p className="text-body-2-medium text-neutral-600 whitespace-nowrap">
            {timeLabel} <span className="text-neutral-100">|</span> {dateLabel}
          </p>
        </div>

        <HeaderDivider className="hidden lg:block" />

        <button
          type="button"
          className="relative flex size-10 items-center justify-center text-neutral-600 hover:text-primary"
          aria-label={t('cab.header.notifications')}
        >
          <AppIcon icon={NotificationIcon} size={30} />
          {notificationCount > 0 && (
            <span className="absolute end-1 top-0.5 flex size-[18px] items-center justify-center rounded-full bg-[#1236a3] px-2.5 py-2.5 text-[11px] font-semibold leading-none text-white">
              {notificationCount}
            </span>
          )}
        </button>

        <HeaderDivider className="hidden min-[400px]:block" />

        <div className="hidden min-[400px]:block">
          <LanguageToggle variant="icon" />
        </div>

        <HeaderDivider className="hidden min-[400px]:block" />

        <div className="flex items-center gap-6">
          {/* Name + role — desktop only */}
          <div className="hidden text-end min-[924px]:block">
            <p className="text-body-3-medium text-neutral-900">{userName}</p>
            {roleName && (
              <p className="text-body-3 text-neutral-600" dir="ltr">
                {roleName}
              </p>
            )}
          </div>

          {/* Avatar — tapping it on mobile opens name/role/logout */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="min-[924px]:pointer-events-none"
              aria-label={userName}
              aria-expanded={mobileMenuOpen}
            >
              <UserAvatar alt={userName} className="size-14 border-2" />
            </button>

            {mobileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30 min-[924px]:hidden"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-hidden
                />
                <div className="absolute end-0 top-full z-40 mt-2 w-56 rounded-[var(--radius-md)] border border-[#ececec] bg-white p-3 shadow-[0_10px_30px_rgba(0,0,0,0.12)] min-[924px]:hidden">
                  <p className="truncate text-body-3-medium text-neutral-900">{userName}</p>
                  {roleName && (
                    <p className="truncate text-body-3 text-neutral-600" dir="ltr">
                      {roleName}
                    </p>
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