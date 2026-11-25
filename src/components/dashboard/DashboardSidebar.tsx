import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AppIcon,
  CalendarIcon,
  CertificateBadgeIcon,
  DashboardGridIcon,
  DocumentFileIcon,
  DocumentTextOutlineIcon,
  InfoIcon,
  LogoutIcon,
  ReceiptIcon,
  RenewalsIcon,
  RequestsListIcon,
  SettingsIcon,
  UsersIcon,
  WalletCardIcon,
} from '@/components/icons'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { clearAuthSession, getAuthSession } from '@/lib/authStorage'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

const navItems: { icon: typeof DashboardGridIcon; labelKey: string; href: string }[] = [
  { icon: DashboardGridIcon, labelKey: 'nav.dashboard', href: ROUTES.dashboard },
  { icon: RequestsListIcon, labelKey: 'accreditation.sidebar.requests', href: ROUTES.certificationRequests },
  { icon: DocumentTextOutlineIcon, labelKey: 'accreditation.sidebar.quotations', href: ROUTES.quotations },
  { icon: DocumentFileIcon, labelKey: 'accreditation.sidebar.agreements', href: ROUTES.agreements },
  { icon: CalendarIcon, labelKey: 'accreditation.sidebar.audits', href: ROUTES.audits },
  { icon: InfoIcon, labelKey: 'clientFindings.navLabel', href: ROUTES.findings },
  { icon: CertificateBadgeIcon, labelKey: 'clientCertificates.navLabel', href: ROUTES.certificates },
  { icon: UsersIcon, labelKey: 'accreditation.sidebar.users', href: ROUTES.users },
  { icon: WalletCardIcon, labelKey: 'accreditation.sidebar.payments', href: ROUTES.wallet },
  { icon: RenewalsIcon, labelKey: 'accreditation.sidebar.renewals', href: ROUTES.periodicVisits },
  { icon: ReceiptIcon, labelKey: 'accreditation.sidebar.invoices', href: ROUTES.invoices },
  { icon: SettingsIcon, labelKey: 'nav.settings', href: ROUTES.companyProfile },
]

export function DashboardSidebar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const session = getAuthSession()
  const [expanded, setExpanded] = useState(false)
  const displayName = session?.organization?.name ?? ''
  const handleLogout = () => {
    clearAuthSession()
    navigate(ROUTES.login, { replace: true })
  }

  const toggleIcon = (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="none" style={expanded ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M7.33447 12.667L11.3345 8.66699L7.33447 4.66699" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.3332 8.66699H0.666504" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.9946 16.667C15.728 11.4803 15.728 5.85366 13.9946 0.666992" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

  return (
    <aside
      className={cn(
        'hidden min-h-screen shrink-0 flex-col border-e border-[#edf0f5] bg-white py-6 transition-[width] duration-300 ease-in-out md:flex',
        expanded ? 'w-[284px] px-[14px]' : 'w-[112px] items-center px-2'
      )}
    >
      <div className={cn('mb-2 flex w-full shrink-0 px-2', expanded ? 'justify-end' : 'justify-center')}>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-label={t(expanded ? 'accreditation.sidebar.collapse' : 'accreditation.sidebar.expand')}
          className="flex size-7 items-center justify-center rounded-[var(--radius-sm)] border border-neutral-200 bg-white text-neutral-600 shadow-sm transition-colors hover:border-neutral-300 hover:text-primary"
        >
          {toggleIcon}
        </button>
      </div>

      <div className={cn('mb-5 flex shrink-0 items-center justify-center', expanded ? 'h-[110px]' : 'h-[93px] w-[100px]')}>
        <img
          src="/casco-logo.svg"
          alt={t('common.appName')}
          width={114}
          height={93}
          className="h-[93px] w-[114px] object-contain"
        />
      </div>

      <nav
        className={cn('flex min-h-0 flex-1 flex-col gap-2', !expanded && 'items-center')}
        aria-label={t('nav.dashboard')}
      >
        {navItems.map(({ icon, labelKey, href }) => {
          const active =
            location.pathname === href ||
            (href !== ROUTES.dashboard && location.pathname.startsWith(`${href}/`))

          return (
            <button
              key={labelKey}
              type="button"
              onClick={() => navigate(href)}
              title={t(labelKey)}
              aria-label={t(labelKey)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center transition-colors',
                expanded
                  ? 'h-12 w-full gap-4 rounded-[24px] px-4 text-start text-[18px]'
                  : 'size-11 justify-center rounded-[14px]',
                active
                  ? 'bg-[#e8edfc] font-medium text-primary'
                  : 'text-neutral-600 hover:bg-[#f5f7fc] hover:text-primary'
              )}
            >
              <AppIcon icon={icon} size={24} className="shrink-0" />
              {expanded && <span className="truncate">{t(labelKey)}</span>}
            </button>
          )
        })}

        <button
          type="button"
          onClick={handleLogout}
          title={t('nav.logout')}
          aria-label={t('nav.logout')}
          className={cn(
            'mt-auto flex items-center text-error-500 transition-colors hover:bg-error-50',
            expanded
              ? 'h-12 w-full gap-4 rounded-[24px] px-4 text-start text-[18px]'
              : 'size-11 justify-center rounded-[14px]'
          )}
        >
          <AppIcon icon={LogoutIcon} size={24} className="shrink-0" />
          {expanded && <span>{t('nav.logout')}</span>}
        </button>
      </nav>

      <UserAvatar
        alt={displayName}
        className="size-[53px] self-center"
      />
    </aside>
  )
}
