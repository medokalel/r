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

interface AccreditationHeaderProps {
  titleKey?: string
}

export function AccreditationHeader({ titleKey = 'accreditation.title' }: AccreditationHeaderProps) {
  const { t } = useTranslation()
  const session = getAuthSession()
  const [user, setUser] = useState<UserProfile | null>(session?.user ?? null)

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

  return (
    <header className="flex shrink-0 items-center justify-between border-b-2 border-[#ececec] bg-white px-5 py-4">
      <div className="flex items-center gap-4">
        <h1 className="text-h3-semi text-primary whitespace-nowrap">{t(titleKey)}</h1>
      </div>

      <div className="flex items-center gap-4">
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
