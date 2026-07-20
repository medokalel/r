import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AppIcon,
  DashboardGridIcon,
  RequestsListIcon,
  WalletCardIcon,
  DocumentsSidebarIcon,
  ShieldIcon,
  RenewalsIcon,
  LogoutIcon,
  ReceiptIcon,
  SettingsIcon,
  UsersIcon,
} from '@/components/icons'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { clearAuthSession } from '@/lib/authStorage'
import { cn } from '@/lib/utils'

const navItems: { icon: typeof DashboardGridIcon; labelKey: string; href?: string }[] = [
  { icon: DashboardGridIcon, labelKey: 'nav.dashboard', href: '/certification-request' },
  { icon: RequestsListIcon, labelKey: 'accreditation.sidebar.requests', href: '/certification-requests' },
  { icon: UsersIcon, labelKey: 'accreditation.sidebar.clients' },
  { icon: WalletCardIcon, labelKey: 'accreditation.sidebar.payments' },
  { icon: DocumentsSidebarIcon, labelKey: 'accreditation.sidebar.documents' },
  { icon: ShieldIcon, labelKey: 'accreditation.sidebar.accreditation' },
  { icon: RenewalsIcon, labelKey: 'accreditation.sidebar.renewals' },
  { icon: ReceiptIcon, labelKey: 'accreditation.sidebar.invoices' },
  { icon: SettingsIcon, labelKey: 'nav.settings', href: '/settings/company-profile' },
]

export function DashboardSidebar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [expanded, setExpanded] = useState(false)

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className={cn(
        'relative hidden shrink-0 flex-col bg-white py-6 shadow-[0_5px_1px_rgba(0,0,0,0.13)] transition-[width] duration-300 ease-in-out',
        'md:flex md:w-[112px] md:items-center md:gap-10',
        expanded
          ? 'lg:w-[236px] lg:items-stretch lg:gap-8 lg:px-4'
          : 'lg:w-[112px] lg:items-center lg:gap-10'
      )}
    >
      {/* Collapse toggle — desktop only, tablet stays permanently collapsed */}
      <div className="hidden shrink-0 w-full justify-end px-2 lg:flex">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-label={t(expanded ? 'accreditation.sidebar.collapse' : 'accreditation.sidebar.expand')}
          className={cn(
            'flex size-7 items-center justify-center',
            'rounded-[var(--radius-sm)] border border-neutral-200 bg-white text-neutral-600 shadow-sm',
            'transition-colors hover:border-neutral-300 hover:text-primary'
          )}
        >
          {expanded ? (
            <svg width="16" height="18" viewBox="0 0 16 18" fill="none" style={{ transform: 'scaleX(-1)' }}>
              <path d="M7.33447 12.667L11.3345 8.66699L7.33447 4.66699" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11.3332 8.66699H0.666504" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.9946 16.667C15.728 11.4803 15.728 5.85366 13.9946 0.666992" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
              <path d="M7.33447 12.667L11.3345 8.66699L7.33447 4.66699" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11.3332 8.66699H0.666504" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.9946 16.667C15.728 11.4803 15.728 5.85366 13.9946 0.666992" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>

      {/* Logo */}
      <div className={cn('shrink-0', expanded ? 'w-full px-4' : 'w-[116px] px-[6px]')}>
        <img
          src="/casco-logo.svg"
          alt={t('common.appName')}
          width={114}
          height={93}
          className="h-[93px] w-full shrink-0 object-contain"
        />
      </div>

      <nav
        className={cn(
          'flex flex-1 flex-col gap-10',
          expanded ? 'items-stretch px-1' : 'w-[70px] items-center'
        )}
        aria-label={t('nav.dashboard')}
      >
        <div className={cn('flex flex-col', expanded ? 'gap-2' : 'items-center gap-10')}>
          {navItems.map(({ icon, labelKey, href }) => {
            const isActive = href ? location.pathname === href : false
            return (
              <button
                key={labelKey}
                type="button"
                title={t(labelKey)}
                aria-label={t(labelKey)}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => href && navigate(href)}
                className={cn(
                  'flex items-center transition-colors',
                  expanded
                    ? cn(
                        'w-full gap-3 rounded-[var(--radius-md)] px-3 py-2 text-neutral-500',
                        'hover:bg-primary-subtle hover:text-primary',
                        isActive && 'bg-primary-subtle text-primary'
                      )
                    : cn(
                        isActive
                          ? 'size-14 justify-center rounded-[16px] bg-[#f3f6fd] text-primary'
                          : 'size-8 justify-center text-neutral-500 hover:text-primary'
                      )
                )}
              >
                <AppIcon
                  icon={icon}
                  size={expanded ? 20 : 28}
                  className="shrink-0"
                />
                {expanded && (
                  <span className="truncate text-body-3-medium">{t(labelKey)}</span>
                )}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          title={t('nav.logout')}
          aria-label={t('nav.logout')}
          className={cn(
            'flex items-center text-error-500 transition-colors hover:text-error-600',
            expanded ? 'gap-3 px-3 py-2' : 'size-11 justify-center'
          )}
        >
          <AppIcon icon={LogoutIcon} size={expanded ? 20 : 28} className="shrink-0" />
          {expanded && <span className="truncate text-body-3-medium">{t('nav.logout')}</span>}
        </button>
      </nav>

      <UserAvatar
        alt="Muhammad Al-Manawahli"
        className={cn('size-[53px]', expanded && 'self-center')}
      />
    </aside>
  )
}
