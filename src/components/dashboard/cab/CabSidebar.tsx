import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCabSidebar } from '@/context/CabSidebarContext'
import {
  AccreditationFieldIcon,
  AppIcon,
  BuildingsIcon,
  CorrectiveActionIcon,
  DashboardIcon,
  DownloadIcon,
  EditIcon,
  ExportIcon,
  FileReviewIcon,
  FileTextIcon,
  LogoutIcon,
  MailIcon,
  ReceiptIcon,
  SearchIcon,
  SettingsIcon,
  SuccessCircleIcon,
  TaskSquareIcon,
  UserIcon,
  UserOctagonIcon,
  UsersIcon,
  WalletIcon,
} from '@/components/icons'
import { clearAuthSession } from '@/lib/authStorage'
import { cn } from '@/lib/utils'

interface CabNavItem {
  icon: typeof DashboardIcon
  labelKey: string
  href: string
}

const dashboardItem: CabNavItem = {
  icon: DashboardIcon,
  labelKey: 'cab.sidebar.dashboard',
  href: '/cab/dashboard',
}

/** True when `pathname` points at `href`, including its `/:id/<lastSegment>`
 *  variant, and — for the Application Draft step specifically — any of its
 *  nested sub-pages (e.g. the full-page "Add New Site", under
 *  /cab/applications/draft/...). */
function matchesWorkflowHref(pathname: string, href: string) {
  if (pathname === href) return true
  if (href === '/cab/applications/draft' && pathname.startsWith('/cab/applications/draft/')) {
    return true
  }
  // Only applications-workflow hrefs (draft/submission/receipt/review/...) get
  // the "/:id/<lastSegment>" fallback below — otherwise a generic last segment
  // like "new" (shared with e.g. Client Registration's /cab/clients/new) would
  // false-match any /cab/applications/... path ending the same way.
  if (!href.startsWith('/cab/applications/')) return false
  const lastSegment = href.split('/').pop()
  return pathname.startsWith('/cab/applications/') && pathname.endsWith(`/${lastSegment}`)
}

const workflowItems: CabNavItem[] = [
  { icon: UsersIcon, labelKey: 'cab.sidebar.clientRegistration', href: '/cab/clients/new' },
  { icon: FileTextIcon, labelKey: 'cab.sidebar.applicationDraft', href: '/cab/applications/draft' },
  { icon: ExportIcon, labelKey: 'cab.sidebar.applicationSubmission', href: '/cab/applications/submission' },
  { icon: DownloadIcon, labelKey: 'cab.sidebar.applicationReceipt', href: '/cab/applications/receipt' },
  { icon: FileReviewIcon, labelKey: 'cab.sidebar.applicationReview', href: '/cab/applications/review' },
  { icon: CorrectiveActionIcon, labelKey: 'cab.sidebar.informationRequired', href: '/cab/applications/information-required' },
  { icon: SettingsIcon, labelKey: 'cab.sidebar.technicalFeasibility', href: '/cab/applications/technical-feasibility' },
  { icon: SuccessCircleIcon, labelKey: 'cab.sidebar.quotationApproval', href: '/cab/quotations/approval' },
  { icon: MailIcon, labelKey: 'cab.sidebar.quotationSent', href: '/cab/quotations/sent' },
  { icon: SuccessCircleIcon, labelKey: 'cab.sidebar.quotationAcceptance', href: '/cab/quotations/acceptance' },
  { icon: EditIcon, labelKey: 'cab.sidebar.contractSigning', href: '/cab/contracts/signing' },
  { icon: ReceiptIcon, labelKey: 'cab.sidebar.initialInvoice', href: '/cab/payments/initial-invoice' },
  { icon: WalletIcon, labelKey: 'cab.sidebar.initialPayment', href: '/cab/payments/initial-payment' },
  { icon: UserOctagonIcon, labelKey: 'cab.sidebar.auditTeamProposal', href: '/cab/audits/team-proposal' },
  { icon: AccreditationFieldIcon, labelKey: 'cab.sidebar.conflictDeclaration', href: '/cab/audits/conflict-declaration' },
  { icon: TaskSquareIcon, labelKey: 'cab.sidebar.assignmentAcceptance', href: '/cab/audits/assignment-acceptance' },
]

const manageItems: CabNavItem[] = [
  { icon: UsersIcon, labelKey: 'cab.sidebar.clients', href: '/cab/clients' },
  { icon: SearchIcon, labelKey: 'cab.sidebar.audits', href: '/cab/audits' },
  { icon: BuildingsIcon, labelKey: 'cab.sidebar.auditTeams', href: '/cab/audit-teams' },
  { icon: UserIcon, labelKey: 'cab.sidebar.freelancers', href: '/cab/freelancers' },
]

function CompletedStepCheck({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0"
    >
      <circle cx="10" cy="10" r="10" fill="#22C55E" />
      <path
        d="M5.75 10.25L8.5 13L14.25 7.25"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CabSidebar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { expanded, setExpanded } = useCabSidebar()

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const currentStepIndex = workflowItems.findIndex((item) =>
    matchesWorkflowHref(location.pathname, item.href)
  )
  const onWorkflowStep = currentStepIndex >= 0

  const isActive = (href: string) => matchesWorkflowHref(location.pathname, href)

  const renderItem = (item: CabNavItem) => {
    const active = isActive(item.href)
    const itemIndex = workflowItems.indexOf(item)
    const showCompletedCheck = onWorkflowStep && itemIndex >= 0 && itemIndex < currentStepIndex

    return (
      <button
        key={item.href}
        type="button"
        title={t(item.labelKey)}
        aria-label={t(item.labelKey)}
        aria-current={active ? 'page' : undefined}
        onClick={() => navigate(item.href)}
        className={cn(
          'relative flex items-center transition-colors',
          expanded
            ? cn(
                'w-full gap-3 rounded-[var(--radius-md)] px-3 py-2 text-neutral-500',
                'hover:bg-primary-subtle hover:text-primary',
                active &&
                  (onWorkflowStep
                    ? 'bg-primary text-white hover:bg-primary hover:text-white'
                    : 'bg-primary-subtle text-primary')
              )
            : cn(
                active
                  ? onWorkflowStep
                    ? 'size-11 justify-center rounded-[14px] bg-primary text-white'
                    : 'size-11 justify-center rounded-[14px] bg-[#f3f6fd] text-primary'
                  : 'size-8 justify-center text-neutral-500 hover:text-primary'
              )
        )}
      >
        <AppIcon icon={item.icon} size={expanded ? 20 : 22} className="shrink-0" />
        {expanded && (
          <span className="min-w-0 flex-1 truncate text-start text-body-3-medium">{t(item.labelKey)}</span>
        )}
        {showCompletedCheck && (
          <span className={cn('shrink-0', !expanded && 'absolute -end-0.5 -top-0.5')}>
            <CompletedStepCheck size={expanded ? 18 : 12} />
          </span>
        )}
      </button>
    )
  }

  const renderGroupLabel = (labelKey: string) =>
    expanded ? (
      <p
        key={labelKey}
        className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-neutral-400"
      >
        {t(labelKey)}
      </p>
    ) : (
      <div key={labelKey} className="my-2 h-px w-8 shrink-0 bg-neutral-100" aria-hidden />
    )

  return (
    <aside
      className={cn(
        'relative hidden shrink-0 flex-col bg-white py-6 shadow-[0_5px_1px_rgba(0,0,0,0.13)] transition-[width] duration-300 ease-in-out',
        'md:flex md:w-[112px] md:items-center md:gap-6',
        expanded
          ? 'lg:w-[266px] lg:items-stretch lg:gap-6 lg:px-4'
          : 'lg:w-[112px] lg:items-center lg:gap-6'
      )}
    >
      {/* Collapse toggle — same control as the internal DashboardSidebar */}
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
          'flex flex-1 flex-col gap-1 overflow-y-auto',
          expanded ? 'w-full items-stretch px-1' : 'w-[70px] items-center'
        )}
        aria-label={t('cab.sidebar.dashboard')}
      >
        {renderItem(dashboardItem)}

        {renderGroupLabel('cab.sidebar.workflow')}
        {workflowItems.map(renderItem)}

        {renderGroupLabel('cab.sidebar.manage')}
        {manageItems.map(renderItem)}

        <button
          type="button"
          onClick={handleLogout}
          title={t('nav.logout')}
          aria-label={t('nav.logout')}
          className={cn(
            'mt-4 flex items-center text-error-500 transition-colors hover:text-error-600',
            expanded ? 'w-full gap-3 px-3 py-2' : 'size-11 justify-center'
          )}
        >
          <AppIcon icon={LogoutIcon} size={expanded ? 20 : 22} className="shrink-0" />
          {expanded && <span className="whitespace-nowrap text-body-3-medium">{t('nav.logout')}</span>}
        </button>
      </nav>
    </aside>
  )
}