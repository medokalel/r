import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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

function NavLink({ item, active }: { item: CabNavItem; active: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate(item.href)}
      className={cn(
        'flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-start text-[14px] transition-colors',
        active
          ? 'bg-primary font-medium text-white'
          : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
      )}
    >
      <AppIcon icon={item.icon} size={20} className="shrink-0" />
      <span className="truncate">{t(item.labelKey)}</span>
    </button>
  )
}

function GroupLabel({ labelKey }: { labelKey: string }) {
  const { t } = useTranslation()
  return (
    <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
      {t(labelKey)}
    </p>
  )
}

export function CabSidebar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  const isActive = (href: string) => location.pathname === href

  return (
    <aside className="hidden w-[260px] shrink-0 flex-col overflow-y-auto border-e border-[#ececec] bg-white py-6 md:flex">
      <div className="mb-6 flex flex-col items-center gap-1 px-4 text-center">
        <img
          src="/casco-logo.svg"
          alt={t('common.appName')}
          width={114}
          height={93}
          className="h-[93px] w-[114px] shrink-0 object-contain"
        />
        <span className="text-[11px] text-neutral-400">{t('cab.sidebar.tagline')}</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        <NavLink
          item={{ icon: DashboardIcon, labelKey: 'cab.sidebar.dashboard', href: '/cab/dashboard' }}
          active={isActive('/cab/dashboard')}
        />

        <GroupLabel labelKey="cab.sidebar.workflow" />
        {workflowItems.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        <GroupLabel labelKey="cab.sidebar.manage" />
        {manageItems.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </nav>

      <div className="px-3 pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-start text-[14px] text-error-500 transition-colors hover:bg-error-50"
        >
          <AppIcon icon={LogoutIcon} size={20} className="shrink-0" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </aside>
  )
}