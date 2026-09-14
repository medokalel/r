import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCabSidebar } from '@/context/CabSidebarContext'
import {
  AppIcon,
  CalendarIcon,
  DashboardIcon,
  EditIcon,
  FileReviewIcon,
  FileTextIcon,
  HeadsetIcon,
  LogoutIcon,
  MapPinIcon,
  RefreshIcon,
  ReportIcon,
  SettingsIcon,
  ShieldIcon,
  TaskSquareIcon,
  UserOctagonIcon,
  UsersIcon,
  WalletIcon,
  SearchIcon,
} from '@/components/icons'
import { clearAuthSession } from '@/lib/authStorage'
import { cn } from '@/lib/utils'
import { useOptionalTour } from '@/context/TourContext'

export type CabSidebarVariant =
  | 'default'
  | 'applicationReview'
  | 'contacts'
  | 'offers'
  | 'invoices'
  | 'auditPlanning'
  | 'auditReporting'
  | 'clients'
  | 'audits'
  | 'certificates'
  | 'finance'
  | 'settings'

interface CabNavItem {
  icon: typeof DashboardIcon | React.FC<any>
  labelKey: string
  href: string
  stepId?: string
  subItems?: Array<{ labelKey: string; href: string }>
}

const standardNavItems: CabNavItem[] = [
  { icon: DashboardIcon, labelKey: 'cab.sidebar.dashboard', href: '/cab/dashboard' },
  { icon: UsersIcon, labelKey: 'cab.sidebar.clients', href: '/cab/clients/new' },
  { icon: FileReviewIcon, labelKey: 'cab.sidebar.applicationReview', href: '/cab/applications/review-queue' },
  { icon: SearchIcon, labelKey: 'cab.sidebar.audits', href: '/cab/applications/technical-feasibility' },
  { icon: ReportIcon, labelKey: 'cab.sidebar.auditReporting', href: '/cab/audit-reporting' },
  { icon: ShieldIcon, labelKey: 'cab.sidebar.certificates', href: '/cab/applications/receipt' },
  { icon: CalendarIcon, labelKey: 'cab.sidebar.scheduling', href: '/cab/applications/quotation' },
  { icon: UserOctagonIcon, labelKey: 'cab.sidebar.resources', href: '/users' },
  { icon: ReportIcon, labelKey: 'cab.sidebar.reports', href: '/cab/dashboard' },
  { icon: SettingsIcon, labelKey: 'cab.sidebar.settings', href: '/cab/company-profile' },
]

// Specialized sidebar for Audit Reporting module (matches Figma/Casco screenshots)
const auditReportingNavItems: CabNavItem[] = [
  { icon: DashboardIcon, labelKey: 'cab.sidebar.dashboard', href: '/cab/dashboard' },
  { icon: UsersIcon, labelKey: 'cab.sidebar.clients', href: '/cab/clients/new' },
  { icon: FileReviewIcon, labelKey: 'cab.sidebar.applications', href: '/cab/applications/review-queue' },
  { icon: SearchIcon, labelKey: 'cab.sidebar.audits', href: '/cab/applications/technical-feasibility' },
  { icon: ReportIcon, labelKey: 'cab.sidebar.auditReporting', href: '/cab/audit-reporting' },
  { icon: ShieldIcon, labelKey: 'cab.sidebar.certificates', href: '/cab/applications/receipt' },
  { icon: CalendarIcon, labelKey: 'cab.sidebar.schedules', href: '/cab/audit-planning/schedule' },
  { icon: FileTextIcon, labelKey: 'cab.sidebar.documents', href: '/cab/dashboard' },
  { icon: HeadsetIcon, labelKey: 'cab.sidebar.communications', href: '/cab/dashboard' },
  { icon: TaskSquareIcon, labelKey: 'cab.sidebar.tasks', href: '/dashboard/tasks' },
  { icon: ReportIcon, labelKey: 'cab.sidebar.reports', href: '/cab/dashboard' },
  { icon: SettingsIcon, labelKey: 'cab.sidebar.settings', href: '/cab/company-profile' },
]

// Specialized sidebar for Audit Planning module (matches Figma/Casco screenshots)
const auditPlanningNavItems: CabNavItem[] = [
  { icon: DashboardIcon, labelKey: 'cab.sidebar.dashboard', href: '/cab/dashboard' },
  { icon: UsersIcon, labelKey: 'cab.sidebar.clients', href: '/cab/clients/new' },
  { icon: FileReviewIcon, labelKey: 'cab.sidebar.applications', href: '/cab/applications/review-queue' },
  {
    icon: CalendarIcon,
    labelKey: 'cab.sidebar.auditPlanning',
    href: '/cab/audit-planning',
    subItems: [
      { labelKey: 'cab.sidebar.auditSchedule', href: '/cab/audit-planning/schedule' },
      { labelKey: 'cab.sidebar.resourcePlanning', href: '/cab/audit-planning' },
      { labelKey: 'cab.sidebar.auditTemplates', href: '/cab/audit-planning' },
    ],
  },
  { icon: SearchIcon, labelKey: 'cab.sidebar.audits', href: '/cab/applications/technical-feasibility' },
  { icon: TaskSquareIcon, labelKey: 'cab.sidebar.findings', href: '/cab/dashboard' },
  { icon: ShieldIcon, labelKey: 'cab.sidebar.certificates', href: '/cab/applications/receipt' },
  { icon: ReportIcon, labelKey: 'cab.sidebar.reports', href: '/cab/dashboard' },
  { icon: SettingsIcon, labelKey: 'cab.sidebar.administration', href: '/cab/company-profile' },
]

// Specialized sidebar for Contacts module
const contactsNavItems: CabNavItem[] = [
  { icon: DashboardIcon, labelKey: 'cab.sidebar.dashboard', href: '/cab/dashboard' },
  { icon: UsersIcon, labelKey: 'cab.sidebar.clients', href: '/cab/clients/new' },
  { icon: FileReviewIcon, labelKey: 'cab.sidebar.applications', href: '/cab/applications/review-queue' },
  { icon: SearchIcon, labelKey: 'cab.sidebar.audits', href: '/cab/applications/technical-feasibility' },
  { icon: ShieldIcon, labelKey: 'cab.sidebar.certificates', href: '/cab/applications/receipt' },
  { icon: UserOctagonIcon, labelKey: 'cab.sidebar.contacts', href: '/cab/contacts' },
  { icon: MapPinIcon, labelKey: 'cab.sidebar.sites', href: '/cab/applications/draft/sites/new' },
  { icon: TaskSquareIcon, labelKey: 'cab.sidebar.tasks', href: '/dashboard/tasks' },
  { icon: ReportIcon, labelKey: 'cab.sidebar.reports', href: '/cab/dashboard' },
  { icon: SettingsIcon, labelKey: 'cab.sidebar.settings', href: '/cab/company-profile' },
]

// Specialized sidebar for Offers module (as shown in Offer register & Create offer screens)
const offersNavItems: CabNavItem[] = [
  { icon: DashboardIcon, labelKey: 'cab.sidebar.dashboard', href: '/cab/dashboard' },
  { icon: UsersIcon, labelKey: 'cab.sidebar.clients', href: '/cab/clients/new' },
  { icon: FileReviewIcon, labelKey: 'cab.sidebar.applications', href: '/cab/applications/review-queue' },
  { icon: ShieldIcon, labelKey: 'cab.sidebar.assessments', href: '/cab/applications/technical-feasibility' },
  { icon: FileTextIcon, labelKey: 'cab.sidebar.offers', href: '/cab/offers' },
  { icon: EditIcon, labelKey: 'cab.sidebar.contracts', href: '/cab/dashboard' },
  { icon: RefreshIcon, labelKey: 'cab.sidebar.surveillance', href: '/periodic-visits' },
  { icon: TaskSquareIcon, labelKey: 'cab.sidebar.tasks', href: '/dashboard/tasks' },
  { icon: WalletIcon, labelKey: 'cab.sidebar.finance', href: '/cab/invoices' },
  { icon: ReportIcon, labelKey: 'cab.sidebar.reports', href: '/cab/dashboard' },
  { icon: SettingsIcon, labelKey: 'cab.sidebar.settings', href: '/cab/company-profile' },
]

// Specialized sidebar for Invoices module (as shown in Invoice register & Invoice details screens)
const invoicesNavItems: CabNavItem[] = [
  { icon: DashboardIcon, labelKey: 'cab.sidebar.dashboard', href: '/cab/dashboard' },
  { icon: UsersIcon, labelKey: 'cab.sidebar.clients', href: '/cab/clients/new' },
  { icon: FileReviewIcon, labelKey: 'cab.sidebar.applications', href: '/cab/applications/review-queue' },
  { icon: ShieldIcon, labelKey: 'cab.sidebar.assessments', href: '/cab/applications/technical-feasibility' },
  { icon: ShieldIcon, labelKey: 'cab.sidebar.certificates', href: '/cab/applications/receipt' },
  { icon: EditIcon, labelKey: 'cab.sidebar.ordersContracts', href: '/cab/dashboard' },
  { icon: FileTextIcon, labelKey: 'cab.sidebar.invoices', href: '/cab/invoices' },
  { icon: WalletIcon, labelKey: 'cab.sidebar.payments', href: '/cab/invoices' },
  { icon: TaskSquareIcon, labelKey: 'cab.sidebar.productsServices', href: '/cab/dashboard' },
  { icon: UserOctagonIcon, labelKey: 'cab.sidebar.users', href: '/users' },
  { icon: ReportIcon, labelKey: 'cab.sidebar.reports', href: '/cab/dashboard' },
  { icon: SettingsIcon, labelKey: 'cab.sidebar.settings', href: '/cab/company-profile' },
]

export interface CabSidebarProps {
  variant?: CabSidebarVariant
}

export function CabSidebar({ variant }: CabSidebarProps = {}) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { expanded, setExpanded, activeSection } = useCabSidebar()
  const tour = useOptionalTour()

  const activeStepId = tour?.isTourActive ? tour.activeStepId : null
  const isSidebarStepActive = Boolean(activeStepId && activeStepId.startsWith('sidebar-'))
  const isExpanded = expanded

  const isAuditReportingSection =
    variant === 'auditReporting' ||
    (activeSection as string) === 'auditReporting' ||
    location.pathname.startsWith('/cab/audit-reporting')

  const isAuditPlanningSection =
    variant === 'auditPlanning' ||
    activeSection === 'auditPlanning' ||
    location.pathname.startsWith('/cab/audit-planning')

  const isInvoicesSection =
    variant === 'invoices' ||
    activeSection === 'invoices' ||
    location.pathname.startsWith('/cab/invoices') ||
    location.pathname === '/invoices'

  const isOffersSection =
    variant === 'offers' ||
    activeSection === 'offers' ||
    location.pathname.startsWith('/cab/offers')

  const isContactsSection =
    variant === 'contacts' ||
    activeSection === 'contacts' ||
    location.pathname.startsWith('/cab/contacts')

  const currentNavItems = isAuditReportingSection
    ? auditReportingNavItems
    : isAuditPlanningSection
    ? auditPlanningNavItems
    : isInvoicesSection
    ? invoicesNavItems
    : isOffersSection
    ? offersNavItems
    : isContactsSection
    ? contactsNavItems
    : standardNavItems

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const isActive = (href: string) => {
    if (href === '/cab/audit-reporting') {
      return location.pathname.startsWith('/cab/audit-reporting')
    }
    if (href === '/cab/audit-planning') {
      return location.pathname.startsWith('/cab/audit-planning')
    }
    if (href === '/cab/dashboard') {
      return location.pathname === '/cab/dashboard'
    }
    if (href === '/cab/offers') {
      return location.pathname.startsWith('/cab/offers')
    }
    if (href === '/cab/contacts') {
      return location.pathname.startsWith('/cab/contacts')
    }
    if (href === '/cab/clients/new') {
      return location.pathname.startsWith('/cab/clients')
    }
    if (href === '/cab/applications/review-queue') {
      return (
        location.pathname.startsWith('/cab/applications/review') ||
        location.pathname.startsWith('/cab/applications/information-required')
      )
    }
    if (href === '/cab/applications/receipt') {
      return (
        location.pathname.startsWith('/cab/applications/receipt') ||
        location.pathname.startsWith('/cab/applications/draft')
      )
    }
    if (href === '/cab/applications/technical-feasibility') {
      return location.pathname.startsWith('/cab/applications/technical-feasibility')
    }
    if (href === '/cab/applications/quotation') {
      return (
        location.pathname.startsWith('/cab/applications/quotation') ||
        location.pathname.startsWith('/cab/quotations')
      )
    }
    if (href === '/cab/applications/draft/sites/new') {
      return location.pathname.startsWith('/cab/applications/draft/sites')
    }
    if (href === '/periodic-visits') {
      return location.pathname.startsWith('/periodic-visits')
    }
    if (href === '/dashboard/tasks') {
      return location.pathname.startsWith('/dashboard/tasks')
    }
    if (href === '/wallet') {
      return location.pathname.startsWith('/wallet')
    }
    if (href === '/users') {
      return location.pathname.startsWith('/users')
    }
    if (href === '/invoices' || href === '/cab/invoices') {
      return location.pathname.startsWith('/cab/invoices') || location.pathname.startsWith('/invoices')
    }
    if (href === '/settings/company-profile') {
      return location.pathname.startsWith('/settings')
    }
    return location.pathname === href
  }

  const labelDefaults: Record<string, { en: string; ar: string }> = {
    'cab.sidebar.dashboard': { en: 'Dashboard', ar: 'لوحة التحكم' },
    'cab.sidebar.clients': { en: 'Clients', ar: 'العملاء' },
    'cab.sidebar.applicationReview': { en: 'Applications', ar: 'الطلبات والتطبيقات' },
    'cab.sidebar.applications': { en: 'Applications', ar: 'الطلبات والتطبيقات' },
    'cab.sidebar.audits': { en: 'Audits', ar: 'عمليات التدقيق' },
    'cab.sidebar.auditPlanning': { en: 'Audit Planning', ar: 'تخطيط التدقيق' },
    'cab.sidebar.auditReporting': { en: 'Audit Reporting', ar: 'تقارير التدقيق' },
    'cab.sidebar.certificates': { en: 'Certificates', ar: 'الشهادات' },
    'cab.sidebar.scheduling': { en: 'Scheduling', ar: 'جدول التدقيق' },
    'cab.sidebar.schedules': { en: 'Schedules', ar: 'الجداول والتحضير' },
    'cab.sidebar.documents': { en: 'Documents', ar: 'المستندات والوثائق' },
    'cab.sidebar.communications': { en: 'Communications', ar: 'المراسلات والتواصل' },
    'cab.sidebar.resources': { en: 'Resources', ar: 'الموارد والخبراء' },
    'cab.sidebar.tasks': { en: 'Tasks', ar: 'المهام' },
    'cab.sidebar.reports': { en: 'Reports', ar: 'التقارير' },
    'cab.sidebar.settings': { en: 'Settings', ar: 'الإعدادات' },
    'cab.sidebar.contacts': { en: 'Contacts', ar: 'جهات الاتصال' },
    'cab.sidebar.sites': { en: 'Sites', ar: 'المواقع والفروع' },
    'cab.sidebar.offers': { en: 'Offers', ar: 'العروض المالية' },
    'cab.sidebar.contracts': { en: 'Contracts', ar: 'العقود والاتفاقيات' },
    'cab.sidebar.invoices': { en: 'Invoices', ar: 'الفواتير' },
    'cab.sidebar.finance': { en: 'Finance', ar: 'المالية' },
    'cab.sidebar.administration': { en: 'Administration', ar: 'الإدارة' },
  }

  const getLabel = (key: string) => {
    const defaults = labelDefaults[key]
    const fallbackText = i18n.language === 'ar' ? defaults?.ar : defaults?.en
    return t(key, fallbackText || key)
  }

  const renderItem = (item: CabNavItem) => {
    const active = isActive(item.href)
    const hasSubItems = Boolean(item.subItems && item.subItems.length > 0)
    const itemText = getLabel(item.labelKey)

    return (
      <div key={item.labelKey + item.href} className="w-full flex flex-col">
        <button
          type="button"
          title={itemText}
          aria-label={itemText}
          aria-current={active ? 'page' : undefined}
          onClick={() => navigate(item.href)}
          className={cn(
            'relative flex items-center transition-all duration-150',
            isExpanded
              ? cn(
                  'w-full gap-3.5 rounded-[12px] px-3.5 py-2.5 font-medium',
                  active
                    ? 'bg-[#1236a3] text-white shadow-sm font-semibold'
                    : 'text-neutral-600 hover:bg-[#f2f6fe] hover:text-[#1236a3]'
                )
              : cn(
                  active
                    ? 'size-11 justify-center rounded-[14px] bg-[#1236a3] text-white shadow-sm mx-auto'
                    : 'size-10 justify-center rounded-[10px] text-neutral-600 hover:bg-[#f2f6fe] hover:text-[#1236a3] mx-auto'
                )
          )}
        >
          <AppIcon icon={item.icon} size={isExpanded ? 20 : 22} className="shrink-0" />
          {isExpanded && (
            <>
              <span className="min-w-0 flex-1 truncate text-start text-[14px]">{itemText}</span>
              {hasSubItems && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className={cn('transition-transform duration-200', active ? 'rotate-180 text-white' : 'text-neutral-400')}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              )}
            </>
          )}
        </button>

        {/* Sub-items list (e.g. Audit schedule, Resource planning, Audit Templates) */}
        {hasSubItems && isExpanded && active && (
          <div className="flex flex-col gap-1 ps-9 pe-1 pt-1.5 pb-1">
            {item.subItems!.map((sub) => {
              const isSubActive =
                location.pathname === sub.href ||
                (sub.href === '/cab/audit-planning/schedule' &&
                  (location.pathname === '/cab/audit-planning' || location.pathname.startsWith('/cab/audit-planning/build')))
              const subText = getLabel(sub.labelKey)

              return (
                <button
                  key={sub.href}
                  type="button"
                  onClick={() => navigate(sub.href)}
                  className={cn(
                    'text-start text-[13px] py-1.5 px-3 rounded-[8px] transition-all font-medium',
                    isSubActive
                      ? 'bg-[#e8edfc] text-[#1236a3] font-semibold'
                      : 'text-neutral-600 hover:text-[#1236a3] hover:bg-neutral-50'
                  )}
                >
                  {subText}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside
      className={cn(
        'relative hidden shrink-0 flex-col bg-white py-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border-e border-[#eaedf3] transition-[width] duration-300 ease-in-out',
        isExpanded
          ? 'md:flex md:w-[260px] md:items-stretch md:gap-5 md:px-4'
          : 'md:flex md:w-[90px] md:items-center md:gap-5 md:px-2',
        isSidebarStepActive &&
          '!flex fixed inset-y-0 start-0 z-[1001] w-[260px] max-w-[85vw] items-stretch gap-5 px-4 shadow-2xl overflow-y-auto md:relative md:inset-auto md:z-auto md:w-auto md:max-w-none'
      )}
    >
      {/* Collapse toggle */}
      <div className="hidden shrink-0 w-full justify-end px-2 md:flex">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-label={t(isExpanded ? 'accreditation.sidebar.collapse' : 'accreditation.sidebar.expand')}
          className={cn(
            'flex size-7 items-center justify-center',
            'rounded-[8px] border border-neutral-200 bg-white text-neutral-500 shadow-sm',
            'transition-colors hover:border-[#1236a3] hover:text-[#1236a3]',
            !isExpanded && 'mx-auto'
          )}
        >
          {isExpanded ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
        </button>
      </div>

      {/* Logo */}
      <div className={cn('shrink-0 flex items-center justify-center overflow-hidden', isExpanded ? 'w-full px-2 py-1' : 'w-12 h-12 mx-auto')}>
        {isExpanded ? (
          <img
            src="/casco-logo.svg"
            alt={t('common.appName')}
            className="h-[75px] w-auto shrink-0 object-contain transition-all"
          />
        ) : (
          <div className="h-10 w-10 overflow-hidden flex items-start justify-center" title={t('common.appName')}>
            <img
              src="/casco-logo.svg"
              alt={t('common.appName')}
              className="h-[65px] max-w-none object-top shrink-0 -mt-1"
            />
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav
        className={cn(
          'flex flex-1 flex-col gap-1.5 overflow-y-auto pt-2',
          isExpanded ? 'w-full items-stretch px-1' : 'w-full items-center px-1'
        )}
        aria-label={t('cab.sidebar.dashboard')}
      >
        {currentNavItems.map(renderItem)}

        {/* Bottom actions: Help & Support + Logout */}
        <div className="mt-auto flex flex-col gap-1 border-t border-neutral-100 pt-4 w-full">
          <button
            type="button"
            onClick={() => undefined}
            title={t('cab.sidebar.helpSupport', 'Help & Support')}
            aria-label={t('cab.sidebar.helpSupport', 'Help & Support')}
            className={cn(
              'flex items-center text-neutral-600 transition-all rounded-[10px] hover:bg-[#f2f6fe] hover:text-[#1236a3]',
              isExpanded ? 'w-full gap-3 px-3 py-2 text-[14px]' : 'size-10 justify-center mx-auto'
            )}
          >
            <AppIcon icon={HeadsetIcon} size={isExpanded ? 19 : 21} className="shrink-0" />
            {isExpanded && (
              <span className="whitespace-nowrap text-start font-medium">
                {t('cab.sidebar.helpSupport', 'Help & Support')}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            title={t('nav.logout')}
            aria-label={t('nav.logout')}
            className={cn(
              'flex items-center text-error-500 transition-all rounded-[10px] hover:bg-error-50',
              isExpanded ? 'w-full gap-3 px-3 py-2 text-[14px]' : 'size-10 justify-center mx-auto'
            )}
          >
            <AppIcon icon={LogoutIcon} size={isExpanded ? 19 : 21} className="shrink-0" />
            {isExpanded && <span className="whitespace-nowrap font-medium">{t('nav.logout')}</span>}
          </button>
        </div>
      </nav>
    </aside>
  )
}