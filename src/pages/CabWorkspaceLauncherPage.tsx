import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCabSidebar } from '@/context/CabSidebarContext'
import { AppIcon, LogoutIcon } from '@/components/icons'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { getAuthSession, clearAuthSession } from '@/lib/authStorage'

interface AppItem {
  id: string
  titleKey: string
  icon: React.ReactNode
  path: string
  badge?: string
}

export function CabWorkspaceLauncherPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const session = getAuthSession()
  const { setActiveSection } = useCabSidebar()
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const userName = session?.user?.email?.split('@')[0] || 'Mohamed'
  const userRole = session?.role?.name || 'Admin'

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const apps: AppItem[] = [
    {
      id: 'applications',
      titleKey: 'cab.workspace.apps.applications',
      path: '/cab/applications/receipt',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      id: 'audit-clients',
      titleKey: 'cab.workspace.apps.auditClients',
      path: '/cab/clients',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: 'application-review',
      titleKey: 'cab.workspace.apps.applicationReview',
      path: '/cab/applications/review-queue',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="m9 15 2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 'contacts',
      titleKey: 'cab.workspace.apps.contacts',
      path: '/cab/contacts',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M7 7h.01" />
          <path d="M17 7h.01" />
          <path d="M7 17h.01" />
          <path d="M17 17h.01" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
    {
      id: 'offers',
      titleKey: 'cab.workspace.apps.offers',
      path: '/cab/offers',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
          <path d="M11 3 8 9l4 12 4-12-3-6" />
          <path d="M2 9h20" />
        </svg>
      ),
    },
    {
      id: 'invoices',
      titleKey: 'cab.workspace.apps.invoices',
      path: '/cab/invoices',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
    {
      id: 'audit-planning',
      titleKey: 'cab.workspace.apps.auditPlanning',
      path: '/cab/audit-planning',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      id: 'audit-reporting',
      titleKey: 'cab.workspace.apps.auditReporting',
      path: '/cab/audit-reporting',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M12 18v-4" />
          <path d="M8 18v-2" />
          <path d="M16 18v-6" />
        </svg>
      ),
    },
    {
      id: 'decisions',
      titleKey: 'cab.workspace.apps.decisions',
      path: '/cab/quotations/approval',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 'certificates',
      titleKey: 'cab.workspace.apps.certificates',
      path: '/cab/applications/receipt',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      ),
    },
    {
      id: 'nonconformities',
      titleKey: 'cab.workspace.apps.nonconformities',
      path: '/cab/audit-reporting',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    {
      id: 'certification',
      titleKey: 'cab.workspace.apps.certification',
      path: '/cab/applications/review-queue',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 'reports-analytics',
      titleKey: 'cab.workspace.apps.reportsAnalytics',
      path: '/cab/audit-reporting',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      id: 'client-portal',
      titleKey: 'cab.workspace.apps.clientPortal',
      path: '/cab/clients',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      id: 'competence',
      titleKey: 'cab.workspace.apps.competence',
      path: '/cab/contacts',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      ),
    },
    {
      id: 'company-profile',
      titleKey: 'cab.workspace.apps.companyProfile',
      path: '/cab/company-profile',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01" />
          <path d="M16 6h.01" />
          <path d="M8 10h.01" />
          <path d="M16 10h.01" />
          <path d="M8 14h.01" />
          <path d="M16 14h.01" />
        </svg>
      ),
    },
    {
      id: 'settings',
      titleKey: 'cab.workspace.apps.settings',
      path: '/cab/company-profile',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ]

  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) return apps
    const q = searchQuery.toLowerCase().trim()
    return apps.filter((app) => t(app.titleKey).toLowerCase().includes(q))
  }, [searchQuery, apps, t])

  return (
    <div className="min-h-screen bg-[#f8fafd] text-[#1a1a1a]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#e9edf5] bg-white px-6 py-3.5 shadow-sm sm:px-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[22px] font-black tracking-tight text-[#1236a3]">iCASCO</span>
            <span className="text-[14px] font-semibold text-neutral-400">Workspace</span>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <span className="hidden text-[13px] font-medium text-neutral-600 md:inline">
            CASCO / CAB workspace
          </span>

          <div className="hidden sm:block">
            <LanguageToggle variant="icon" showChevron={false} />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="flex items-center gap-2.5 rounded-full p-1 transition-colors hover:bg-neutral-50"
            >
              <UserAvatar alt={userName} className="size-9 border border-[#d6e2fb]" />
              <div className="hidden text-start md:block">
                <p className="text-[13px] font-semibold text-neutral-900 leading-tight">{userName}</p>
                <p className="text-[11px] text-neutral-500">{userRole}</p>
              </div>
            </button>

            {mobileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-hidden
                />
                <div className="absolute end-0 top-full z-50 mt-2 w-52 rounded-[14px] border border-[#e9edf5] bg-white p-2 shadow-xl">
                  <div className="border-b border-neutral-100 px-3 py-2">
                    <p className="text-[13px] font-bold text-neutral-900">{userName}</p>
                    <p className="text-[11px] text-neutral-500">{userRole}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/cab/dashboard')}
                    className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-[13px] font-medium text-neutral-700 hover:bg-[#f2f6fe] hover:text-[#1236a3]"
                  >
                    {t('cab.sidebar.dashboard')}
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-[13px] font-medium text-error-500 hover:bg-error-50"
                  >
                    <AppIcon icon={LogoutIcon} size={16} />
                    {t('nav.logout')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-6 py-10 sm:px-10">
        {/* Hero Section */}
        <div className="mb-8 max-w-3xl">
          <h1 className="text-[32px] font-bold tracking-tight text-[#0f2d88] sm:text-[38px]">
            {t('cab.workspace.heroTitle', 'Your workspace, connected.')}
          </h1>
          <p className="mt-2 text-[15px] text-neutral-500 sm:text-[16px]">
            {t('cab.workspace.heroSubtitle', 'Everything you need to manage your conformity assessment operations.')}
          </p>
        </div>

        {/* Search & Actions Bar */}
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute start-4 top-1/2 -translate-y-1/2 text-neutral-400"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('cab.workspace.searchPlaceholder', 'Search applications...')}
              className="w-full rounded-[12px] border border-[#e2e8f0] bg-white py-3.5 pe-4 ps-11 text-[14px] text-neutral-900 shadow-sm transition-all focus:border-[#1236a3] focus:outline-none focus:ring-2 focus:ring-[#1236a3]/20"
            />
          </div>

          <button
            type="button"
            className="flex items-center justify-center rounded-[12px] bg-[#1236a3] px-6 py-3.5 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-[#0e2c85] active:scale-[0.98]"
          >
            {t('cab.workspace.customize', 'Customize')}
          </button>
        </div>

        {/* Section Label */}
        <div className="mb-6 flex items-center justify-between">
          <span className="text-[12px] font-bold uppercase tracking-wider text-neutral-400">
            {t('cab.workspace.allApplications', 'ALL APPLICATIONS')}
          </span>
          <span className="text-[12px] font-medium text-neutral-500">
            {filteredApps.length} {t('common.applications', 'applications')}
          </span>
        </div>

        {/* Applications Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
          {filteredApps.map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => {
                if (app.id === 'audit-planning') {
                  setActiveSection('auditPlanning')
                } else if (app.id === 'contacts') {
                  setActiveSection('contacts')
                } else if (app.id === 'offers') {
                  setActiveSection('offers')
                } else if (app.id === 'invoices') {
                  setActiveSection('invoices')
                } else {
                  setActiveSection('applicationReview')
                }
                navigate(app.path)
              }}
              className="group flex flex-col items-center justify-center gap-3.5 rounded-[18px] border border-[#eaf0fa] bg-white p-6 shadow-[0_2px_12px_rgba(18,54,163,0.03)] transition-all duration-200 hover:-translate-y-1 hover:border-[#bfdbfe] hover:shadow-[0_12px_24px_rgba(18,54,163,0.08)] active:translate-y-0"
            >
              <div className="flex size-14 items-center justify-center rounded-[14px] bg-[#f0f5ff] text-[#1236a3] transition-all duration-200 group-hover:bg-[#1236a3] group-hover:text-white group-hover:shadow-md">
                {app.icon}
              </div>
              <span className="text-center text-[13px] font-semibold text-neutral-800 transition-colors group-hover:text-[#1236a3]">
                {t(app.titleKey)}
              </span>
            </button>
          ))}
        </div>

        {filteredApps.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-[#d1d5db] bg-white p-12 text-center">
            <p className="text-[15px] font-medium text-neutral-600">
              {t('cab.workspace.noResults', 'No applications found matching your search')}
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-3 text-[13px] font-semibold text-[#1236a3] hover:underline"
            >
              {t('common.clearAll', 'Clear search')}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
