import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCabSidebar } from '@/context/CabSidebarContext'
import {
  AccreditationFieldIcon,
  AppIcon,
  BuildingsIcon,
  CertificateBadgeIcon,
  ChevronDownIcon,
  CorrectiveActionIcon,
  DashboardIcon,
  ExportIcon,
  FileTextIcon,
  LogoutIcon,
  MailIcon,
  ReceiptIcon,
  ReportIcon,
  SettingsIcon,
  ShieldIcon,
  SuccessCircleIcon,
  TaskSquareIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
} from '@/components/icons'
import { clearAuthSession, getAuthSession } from '@/lib/authStorage'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { useOptionalTour } from '@/context/TourContext'

interface CabNavItem {
  icon?: typeof DashboardIcon
  labelKey: string
  href?: string
  disabled?: boolean
  stepId?: string
  children?: CabNavItem[]
}

interface CabNavGroup {
  id: string
  labelKey: string
  items: CabNavItem[]
}

const homeItem: CabNavItem = {
  icon: DashboardIcon,
  labelKey: 'nav.home',
  href: ROUTES.workspace,
  stepId: 'sidebar-navigation',
}

const navGroups: CabNavGroup[] = [
  {
    id: 'customer-commercial',
    labelKey: 'cab.sidebar.groups.customerCommercial',
    items: [
      { icon: UsersIcon, labelKey: 'cab.sidebar.auditClients', href: ROUTES.cabAuditClients },
      { icon: MailIcon, labelKey: 'cab.sidebar.contacts', href: ROUTES.cabContacts },
      {
        icon: FileTextIcon,
        labelKey: 'cab.sidebar.applications',
        href: ROUTES.cabApplicationRegister,
        children: [
          {
            labelKey: 'cab.sidebar.applicationReview',
            href: ROUTES.cabApplicationReviewQueue,
            stepId: 'sidebar-app-review',
          },
          {
            labelKey: 'cab.sidebar.applicationDraft',
            href: '/cab/applications/draft',
            stepId: 'sidebar-app-draft',
          },
          {
            labelKey: 'cab.sidebar.applicationSubmission',
            href: '/cab/applications/submission',
            stepId: 'sidebar-app-submission',
          },
          {
            labelKey: 'cab.sidebar.applicationReceipt',
            href: '/cab/applications/receipt',
            stepId: 'sidebar-app-receipt',
          },
        ],
      },
      {
        icon: CorrectiveActionIcon,
        labelKey: 'cab.sidebar.informationRequired',
        href: ROUTES.cabApplicationInformationRequired,
        stepId: 'sidebar-app-info',
      },
      {
        icon: SettingsIcon,
        labelKey: 'cab.sidebar.technicalFeasibility',
        href: ROUTES.cabApplicationTechnicalFeasibility,
        stepId: 'sidebar-app-feasibility',
      },
      {
        icon: WalletIcon,
        labelKey: 'cab.sidebar.quotation',
        href: ROUTES.cabApplicationQuotation,
        stepId: 'sidebar-app-quotation',
      },
      {
        icon: SuccessCircleIcon,
        labelKey: 'cab.sidebar.quotationApproval',
        href: ROUTES.cabQuotationApproval,
        stepId: 'sidebar-quotation-approval',
      },
      { icon: ExportIcon, labelKey: 'cab.sidebar.offers', href: ROUTES.cabOffers },
      { icon: ReceiptIcon, labelKey: 'cab.sidebar.invoices', href: ROUTES.cabInvoices },
    ],
  },
  {
    id: 'audit-operations',
    labelKey: 'cab.sidebar.groups.auditOperations',
    items: [
      { icon: TaskSquareIcon, labelKey: 'cab.sidebar.auditPlanning', href: ROUTES.cabAuditPlanning },
      { icon: ReportIcon, labelKey: 'cab.sidebar.auditReporting', href: ROUTES.cabAuditReporting },
      {
        icon: CorrectiveActionIcon,
        labelKey: 'cab.sidebar.nonconformities',
        href: ROUTES.cabNonconformities,
      },
    ],
  },
  {
    id: 'certification',
    labelKey: 'cab.sidebar.groups.certification',
    items: [
      { icon: SuccessCircleIcon, labelKey: 'cab.sidebar.decisions', href: ROUTES.cabDecisions },
      { icon: ShieldIcon, labelKey: 'cab.sidebar.certification', href: ROUTES.cabCertificationCycles },
      { icon: CertificateBadgeIcon, labelKey: 'cab.sidebar.certificates', href: ROUTES.cabCertificates },
    ],
  },
  {
    id: 'people-portals',
    labelKey: 'cab.sidebar.groups.peoplePortals',
    items: [
      { icon: AccreditationFieldIcon, labelKey: 'cab.sidebar.competence', disabled: true },
      { icon: UserIcon, labelKey: 'cab.sidebar.clientPortal', disabled: true },
    ],
  },
  {
    id: 'insights',
    labelKey: 'cab.sidebar.groups.insights',
    items: [
      {
        icon: DashboardIcon,
        labelKey: 'cab.sidebar.reportsAnalytics',
        href: ROUTES.cabDashboard,
      },
    ],
  },
  {
    id: 'administration',
    labelKey: 'cab.sidebar.groups.administration',
    items: [
      { icon: BuildingsIcon, labelKey: 'cab.sidebar.companyProfile', href: ROUTES.cabCompanyProfile },
      { icon: SettingsIcon, labelKey: 'cab.sidebar.settings', href: ROUTES.cabCompanyProfile },
    ],
  },
]

function matchesNavHref(pathname: string, href: string) {
  if (pathname === href) return true
  if (href === '/cab/applications/draft' && pathname.startsWith('/cab/applications/draft/')) {
    return true
  }
  if (href.startsWith('/cab/applications/')) {
    const lastSegment = href.split('/').pop()
    return pathname.startsWith('/cab/applications/') && pathname.endsWith(`/${lastSegment}`)
  }
  if (pathname.startsWith(`${href}/`)) return true
  return false
}

function isNavItemActive(item: CabNavItem, pathname: string): boolean {
  if (item.href && matchesNavHref(pathname, item.href)) return true
  return item.children?.some((child) => isNavItemActive(child, pathname)) ?? false
}

function getUserInitials(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return '?'
  const localPart = trimmed.includes('@') ? trimmed.split('@')[0] : trimmed
  const parts = localPart.split(/[.\s_-]+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  }
  return localPart.slice(0, 2).toUpperCase()
}

function getDisplayName(email: string): string {
  const localPart = email.split('@')[0] ?? email
  return localPart
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function CabSidebar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const session = getAuthSession()
  const { expanded, setExpanded } = useCabSidebar()
  const tour = useOptionalTour()

  const activeStepId = tour?.isTourActive ? tour.activeStepId : null
  const isSidebarStepActive = Boolean(activeStepId && activeStepId.startsWith('sidebar-'))
  const isExpanded = expanded || isSidebarStepActive

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navGroups.map((group) => [group.id, true])),
  )
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>(() => ({
    'cab.sidebar.applications': location.pathname.startsWith('/cab/applications/'),
  }))

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  const toggleSubmenu = (labelKey: string) => {
    setOpenSubmenus((prev) => {
      const nextOpen = !(prev[labelKey] ?? (isExpanded ? true : false))
      if (!isExpanded && nextOpen) {
        return { [labelKey]: true }
      }
      return { ...prev, [labelKey]: nextOpen }
    })
  }

  const closeSubmenu = (labelKey: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [labelKey]: false }))
  }

  const isActive = (item: CabNavItem) => isNavItemActive(item, location.pathname)

  const userEmail = session?.user?.email ?? ''
  const userName = getDisplayName(userEmail)
  const userRole = session?.role?.name ?? session?.user?.role?.name ?? ''
  const userInitials = getUserInitials(userEmail || userName)

  const renderItem = (item: CabNavItem, nested = false) => {
    const active = Boolean(item.href && matchesNavHref(location.pathname, item.href))
    const disabled = item.disabled || !item.href

    const buttonElement = (
      <button
        key={`${item.labelKey}-${item.href ?? 'disabled'}`}
        type="button"
        title={t(item.labelKey)}
        aria-label={t(item.labelKey)}
        aria-current={active ? 'page' : undefined}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={() => item.href && navigate(item.href)}
        className={cn(
          'relative flex items-center transition-colors',
          disabled && 'cursor-not-allowed opacity-50',
          isExpanded
            ? cn(
                'w-full rounded-[var(--radius-md)] py-2 text-neutral-500',
                nested ? 'gap-2 px-3 ps-9' : 'gap-3 px-3',
                !disabled && 'hover:bg-primary-subtle hover:text-primary',
                active && 'bg-primary-subtle text-primary',
              )
            : cn(
                active
                  ? 'size-11 justify-center rounded-[14px] bg-[#f3f6fd] text-primary'
                  : 'size-8 justify-center text-neutral-500 hover:text-primary',
                disabled && 'hover:text-neutral-500',
              ),
        )}
      >
        {item.icon && (
          <AppIcon icon={item.icon} size={isExpanded ? 20 : 22} className="shrink-0" />
        )}
        {isExpanded && (
          <span className="min-w-0 flex-1 truncate text-start text-body-3-medium">
            {t(item.labelKey)}
          </span>
        )}
      </button>
    )

    if (item.stepId) {
      return (
        <DashboardTourStep key={`${item.labelKey}-${item.href}`} stepId={item.stepId} className="w-full">
          {buttonElement}
        </DashboardTourStep>
      )
    }

    return buttonElement
  }

  const renderSubmenu = (item: CabNavItem) => {
    const submenuKey = item.labelKey
    const isOpen = openSubmenus[submenuKey] ?? (isExpanded ? true : false)
    const active = isActive(item)

    if (!isExpanded) {
      return (
        <div key={submenuKey} className="relative">
          <button
            type="button"
            title={t(item.labelKey)}
            aria-label={t(item.labelKey)}
            aria-expanded={isOpen}
            aria-haspopup="menu"
            onClick={() => {
              if (item.href) {
                navigate(item.href)
                return
              }
              toggleSubmenu(submenuKey)
            }}
            className={cn(
              'relative flex items-center transition-colors',
              active
                ? 'size-11 justify-center rounded-[14px] bg-[#f3f6fd] text-primary'
                : 'size-8 justify-center text-neutral-500 hover:text-primary',
            )}
          >
            {item.icon && <AppIcon icon={item.icon} size={22} className="shrink-0" />}
          </button>
          {isOpen && (
            <>
              <button
                type="button"
                aria-label={t('common.close')}
                className="fixed inset-0 z-[1000] cursor-default"
                onClick={() => closeSubmenu(submenuKey)}
              />
              <div
                role="menu"
                aria-label={t(item.labelKey)}
                className="absolute start-full top-0 z-[1001] ms-3 min-w-[220px] rounded-[var(--radius-md)] border border-neutral-100 bg-white py-1 shadow-lg"
              >
                <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                  {t(item.labelKey)}
                </p>
                {item.children?.map((child) => {
                  const childActive = Boolean(
                    child.href && matchesNavHref(location.pathname, child.href),
                  )

                  return (
                    <button
                      key={child.href}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        if (child.href) {
                          navigate(child.href)
                        }
                        closeSubmenu(submenuKey)
                      }}
                      className={cn(
                        'flex w-full items-center px-3 py-2 text-start text-body-3-medium text-neutral-600 transition-colors hover:bg-primary-subtle hover:text-primary',
                        childActive && 'bg-primary-subtle text-primary',
                      )}
                    >
                      {t(child.labelKey)}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )
    }

    return (
      <div key={submenuKey} className="flex flex-col gap-1">
        <div
          className={cn(
            'flex w-full items-center rounded-[var(--radius-md)] text-neutral-500 transition-colors hover:bg-primary-subtle hover:text-primary',
            active && 'bg-primary-subtle text-primary',
          )}
        >
          <button
            type="button"
            onClick={() => (item.href ? navigate(item.href) : toggleSubmenu(submenuKey))}
            className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2"
            aria-current={item.href && matchesNavHref(location.pathname, item.href) ? 'page' : undefined}
          >
            {item.icon && <AppIcon icon={item.icon} size={20} className="shrink-0" />}
            <span className="min-w-0 flex-1 truncate text-start text-body-3-medium">
              {t(item.labelKey)}
            </span>
          </button>
          <button
            type="button"
            onClick={() => toggleSubmenu(submenuKey)}
            aria-expanded={isOpen}
            aria-label={t(item.labelKey)}
            className="flex shrink-0 items-center px-2 py-2"
          >
            <AppIcon
              icon={ChevronDownIcon}
              size={16}
              className={cn('shrink-0 transition-transform', isOpen && 'rotate-180')}
            />
          </button>
        </div>
        {isOpen && (
          <div className="flex flex-col gap-1">{item.children?.map((child) => renderItem(child, true))}</div>
        )}
      </div>
    )
  }

  const renderNavEntry = (item: CabNavItem) =>
    item.children?.length ? renderSubmenu(item) : renderItem(item)

  const renderCollapsedDivider = (groupId: string) => (
    <div key={`divider-${groupId}`} className="my-2 h-px w-8 shrink-0 bg-neutral-100" aria-hidden />
  )

  return (
    <aside
      className={cn(
        'relative hidden shrink-0 flex-col bg-white py-6 shadow-[0_5px_1px_rgba(0,0,0,0.13)] transition-[width] duration-300 ease-in-out',
        'md:flex md:w-[112px] md:items-center md:gap-6',
        expanded
          ? 'lg:w-[266px] lg:items-stretch lg:gap-6 lg:px-4'
          : 'lg:w-[112px] lg:items-center lg:gap-6',
        isSidebarStepActive &&
          '!flex fixed inset-y-0 start-0 z-[1001] w-[270px] max-w-[85vw] items-stretch gap-6 px-4 shadow-2xl overflow-y-auto md:relative md:inset-auto md:z-auto md:w-auto md:max-w-none md:shadow-[0_5px_1px_rgba(0,0,0,0.13)]',
      )}
    >
      <div className="hidden shrink-0 w-full justify-end px-2 lg:flex">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-label={t(expanded ? 'accreditation.sidebar.collapse' : 'accreditation.sidebar.expand')}
          className={cn(
            'flex size-7 items-center justify-center',
            'rounded-[var(--radius-sm)] border border-neutral-200 bg-white text-neutral-600 shadow-sm',
            'transition-colors hover:border-neutral-300 hover:text-primary',
          )}
        >
          {expanded ? (
            <svg width="16" height="18" viewBox="0 0 16 18" fill="none" style={{ transform: 'scaleX(-1)' }}>
              <path d="M7.33447 12.667L11.3345 8.66699L7.33447 4.66699" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11.3332 8.66699H0.666504" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.9946 16.667C15.728 11.4803 15.728 5.85366 13.9946 0.666992" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
              <path d="M7.33447 12.667L11.3345 8.66699L7.33447 4.66699" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11.3332 8.66699H0.666504" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.9946 16.667C15.728 11.4803 15.728 5.85366 13.9946 0.666992" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      <div className={cn('shrink-0', isExpanded ? 'w-full px-4' : 'w-[116px] px-[6px]')}>
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
          'flex flex-1 flex-col gap-1 overflow-y-auto',
          isExpanded ? 'w-full items-stretch px-1' : 'w-[70px] items-center',
        )}
        aria-label={t('nav.home')}
      >
        {renderItem(homeItem)}

        {navGroups.map((group, groupIndex) => {
          const isOpen = openGroups[group.id] ?? true

          if (!isExpanded) {
            return (
              <div key={group.id} className="flex w-full flex-col items-center gap-1">
                {groupIndex > 0 && renderCollapsedDivider(group.id)}
                {group.items.map((item) => renderNavEntry(item))}
              </div>
            )
          }

          return (
            <div key={group.id} className="mt-2">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 transition-colors hover:text-neutral-600"
              >
                <span className="truncate text-start">{t(group.labelKey)}</span>
                <AppIcon
                  icon={ChevronDownIcon}
                  size={16}
                  className={cn('shrink-0 transition-transform', isOpen && 'rotate-180')}
                />
              </button>
              {isOpen && (
                <div className="mt-1 flex flex-col gap-1">{group.items.map(renderNavEntry)}</div>
              )}
            </div>
          )
        })}
      </nav>

      <div
        className={cn(
          'mt-4 shrink-0 border-t border-neutral-100 pt-4',
          isExpanded ? 'w-full px-3' : 'flex w-[70px] flex-col items-center',
        )}
      >
        {isExpanded ? (
          <>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-body-3-semibold text-primary">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-body-3-medium text-neutral-900">
                  {userName}
                  {userRole ? ` · ${userRole}` : ''}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-1 py-2 text-error-500 transition-colors hover:text-error-600"
            >
              <AppIcon icon={LogoutIcon} size={20} className="shrink-0" />
              <span className="text-body-3-medium">{t('nav.logout')}</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleLogout}
            title={t('nav.logout')}
            aria-label={t('nav.logout')}
            className="flex size-11 items-center justify-center text-error-500 transition-colors hover:text-error-600"
          >
            <AppIcon icon={LogoutIcon} size={22} className="shrink-0" />
          </button>
        )}
      </div>
    </aside>
  )
}
