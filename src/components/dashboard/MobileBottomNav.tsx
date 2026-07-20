import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AppIcon,
  DashboardGridIcon,
  RequestsListIcon,
  UsersIcon,
  DocumentsSidebarIcon,
  WalletCardIcon,
  ShieldIcon,
  RenewalsIcon,
  ReceiptIcon,
  SettingsIcon,
  LogoutIcon,
  MoreIcon,
} from '@/components/icons'
import { clearAuthSession } from '@/lib/authStorage'
import { cn } from '@/lib/utils'

const primaryItems = [
  { icon: DashboardGridIcon, labelKey: 'nav.dashboard', href: '/certification-request' },
  { icon: RequestsListIcon, labelKey: 'accreditation.sidebar.requests', href: '/certification-requests' },
  { icon: UsersIcon, labelKey: 'accreditation.sidebar.clients' },
  { icon: DocumentsSidebarIcon, labelKey: 'accreditation.sidebar.documents' },
]

const moreItems = [
  { icon: WalletCardIcon, labelKey: 'accreditation.sidebar.payments' },
  { icon: ShieldIcon, labelKey: 'accreditation.sidebar.accreditation' },
  { icon: RenewalsIcon, labelKey: 'accreditation.sidebar.renewals' },
  { icon: ReceiptIcon, labelKey: 'accreditation.sidebar.invoices' },
  { icon: SettingsIcon, labelKey: 'nav.settings', href: '/settings/company-profile' },
]

export function MobileBottomNav() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex h-[64px] items-center justify-around border-t border-neutral-100 bg-white pb-[env(safe-area-inset-bottom)] max-[922px]:flex min-[923px]:hidden"
        aria-label={t('nav.dashboard')}
      >
        {primaryItems.map(({ icon, labelKey, href }) => {
          const isActive = href ? location.pathname === href : false
          return (
            <button
              key={labelKey}
              type="button"
              onClick={() => href && navigate(href)}
              aria-label={t(labelKey)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex size-11 items-center justify-center rounded-[12px]',
                isActive ? 'bg-[#f3f6fd] text-primary' : 'text-neutral-500'
              )}
            >
              <AppIcon icon={icon} size={24} />
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label={t('common.more')}
          className="flex size-11 items-center justify-center rounded-[12px] text-neutral-500"
        >
          <AppIcon icon={MoreIcon} size={24} />
        </button>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-40 min-[923px]:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMoreOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[20px] bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-200" />
            <div className="flex flex-col gap-1">
              {moreItems.map(({ icon, labelKey, href }) => (
                <button
                  key={labelKey}
                  type="button"
                  onClick={() => {
                    setMoreOpen(false)
                    if (href) navigate(href)
                  }}
                  className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-3 text-neutral-700 hover:bg-[#f4f4f4]"
                >
                  <AppIcon icon={icon} size={22} />
                  <span className="text-body-2-medium">{t(labelKey)}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false)
                  handleLogout()
                }}
                className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-3 text-error-500 hover:bg-[#fef2f2]"
              >
                <AppIcon icon={LogoutIcon} size={22} />
                <span className="text-body-2-medium">{t('nav.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}