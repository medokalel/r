import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import {
  AppIcon,
  AccreditationFieldIcon,
  BuildingsIcon,
  CertificateBadgeIcon,
  CorrectiveActionIcon,
  DashboardIcon,
  ExportIcon,
  FileReviewIcon,
  FileTextIcon,
  MailIcon,
  ReportIcon,
  ReceiptIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  SuccessCircleIcon,
  TaskSquareIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
  type AppIconComponent,
} from '@/components/icons'
import { getAuthSession } from '@/lib/authStorage'
import { ROUTES } from '@/lib/routes'

interface WorkspaceApp {
  title: string
  description: string
  route?: string
  icon: AppIconComponent
  comingSoon?: boolean
}

const cabApps: WorkspaceApp[] = [
  {
    title: 'Applications',
    description: 'Create and manage certification application drafts.',
    route: '/cab/applications/draft',
    icon: FileTextIcon,
  },
  {
    title: 'Audit Clients',
    description: 'View and manage registered audit clients.',
    route: '/cab/clients',
    icon: UsersIcon,
  },
  {
    title: 'Application Review',
    description: 'Review submitted certification applications.',
    route: '/cab/applications/review',
    icon: FileReviewIcon,
  },
  {
    title: 'Contacts',
    description: 'Manage organization contacts and authorized representatives.',
    icon: MailIcon,
    comingSoon: true,
  },
  {
    title: 'Offers',
    description: 'Create and track commercial offers.',
    icon: ExportIcon,
    comingSoon: true,
  },
  {
    title: 'Invoices',
    description: 'CAB invoice management will be available later.',
    icon: ReceiptIcon,
    comingSoon: true,
  },
  {
    title: 'Audit Planning',
    description: 'Plan audit schedules, teams, and activities.',
    icon: TaskSquareIcon,
    comingSoon: true,
  },
  {
    title: 'Audit Reporting',
    description: 'Prepare and review audit reports.',
    icon: ReportIcon,
    comingSoon: true,
  },
  {
    title: 'Decisions',
    description: 'Review certification decisions and approvals.',
    icon: SuccessCircleIcon,
    comingSoon: true,
  },
  {
    title: 'Certificates',
    description: 'Issue and manage certification records.',
    icon: CertificateBadgeIcon,
    comingSoon: true,
  },
  {
    title: 'Nonconformities',
    description: 'Record and follow up on nonconformities.',
    icon: CorrectiveActionIcon,
    comingSoon: true,
  },
  {
    title: 'Certification',
    description: 'Manage the certification lifecycle.',
    icon: ShieldIcon,
    comingSoon: true,
  },
  {
    title: 'Reports & Analytics',
    description: 'Open metrics, reports, tasks, and recent activity.',
    route: ROUTES.cabDashboard,
    icon: DashboardIcon,
  },
  {
    title: 'Client Portal',
    description: 'Access client-facing services and communications.',
    icon: UserIcon,
    comingSoon: true,
  },
  {
    title: 'Competence',
    description: 'Manage auditor qualifications and competence.',
    icon: AccreditationFieldIcon,
    comingSoon: true,
  },
  {
    title: 'Company Profile',
    description: 'Manage your CAB profile, branding, and organization settings.',
    route: ROUTES.cabCompanyProfile,
    icon: BuildingsIcon,
  },
  {
    title: 'Settings',
    description: 'Configure your CAB workspace preferences.',
    route: ROUTES.cabCompanyProfile,
    icon: SettingsIcon,
  },
  {
    title: 'Application Receipt',
    description: 'Receive and register submitted certification applications.',
    route: '/cab/applications/receipt',
    icon: ReceiptIcon,
  },
  {
    title: 'Information Required',
    description: 'Request and track additional information from applicants.',
    route: ROUTES.cabApplicationInformationRequired,
    icon: CorrectiveActionIcon,
  },
  {
    title: 'Technical Feasibility',
    description: 'Assess scope, resources, competence, and delivery feasibility.',
    route: ROUTES.cabApplicationTechnicalFeasibility,
    icon: SettingsIcon,
  },
  {
    title: 'Quotation',
    description: 'Prepare the commercial quotation for an application.',
    route: ROUTES.cabApplicationQuotation,
    icon: WalletIcon,
  },
  {
    title: 'Quotation Approval',
    description: 'Review and approve quotations before they are issued.',
    route: ROUTES.cabQuotationApproval,
    icon: SuccessCircleIcon,
  },
]

const organizationApps: WorkspaceApp[] = [
  {
    title: 'New Certification Request',
    description: 'Start and submit a new certification request.',
    route: ROUTES.certificationRequestNew,
    icon: FileTextIcon,
  },
  {
    title: 'Certification Requests',
    description: 'Review and track all certification requests.',
    route: ROUTES.certificationRequests,
    icon: FileReviewIcon,
  },
  {
    title: 'Company Profile',
    description: 'Manage organization details and profile information.',
    route: ROUTES.companyProfile,
    icon: BuildingsIcon,
  },
  {
    title: 'Users',
    description: 'Manage organization users and access.',
    route: ROUTES.users,
    icon: UsersIcon,
  },
  {
    title: 'Digital Wallet',
    description: 'View wallet activity and payment information.',
    route: ROUTES.wallet,
    icon: WalletIcon,
  },
  {
    title: 'Periodic Visits',
    description: 'Review scheduled and completed periodic visits.',
    route: ROUTES.periodicVisits,
    icon: SettingsIcon,
  },
  {
    title: 'Invoices',
    description: 'View and manage organization invoices.',
    route: ROUTES.invoices,
    icon: ReceiptIcon,
  },
]

function AppTile({ app }: { app: WorkspaceApp }) {
  const className =
    'group relative flex min-h-[166px] flex-col items-center justify-center rounded-[var(--radius-lg)] border border-[#e9edf4] bg-white px-5 py-6 text-center shadow-[0_4px_14px_rgba(16,24,40,0.035)] transition duration-200'
  const content = (
    <>
      {app.comingSoon && (
        <span className="absolute end-3 top-3 rounded-full bg-neutral-50 px-2 py-1 text-[10px] font-medium text-neutral-500">
          Coming soon
        </span>
      )}
      <div className="mb-4 flex size-12 items-center justify-center rounded-[14px] bg-[#eef2ff] text-primary transition-colors group-hover:bg-primary group-hover:text-white">
        <AppIcon icon={app.icon} size={24} />
      </div>
      <h2 className="text-[15px] font-semibold text-neutral-900">{app.title}</h2>
      <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-neutral-500">
        {app.description}
      </p>
    </>
  )

  if (!app.route) {
    return (
      <div
        aria-disabled="true"
        className={`${className} cursor-default opacity-75`}
      >
        {content}
      </div>
    )
  }

  return (
    <Link
      to={app.route}
      aria-label={`Open ${app.title}`}
      className={`${className} hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_12px_28px_rgba(18,54,163,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
    >
      {content}
    </Link>
  )
}

export function WorkspacePage() {
  const [query, setQuery] = useState('')
  const session = getAuthSession()
  const isCab =
    Boolean(session?.cab) || session?.organization?.type === 'CERTIFICATION_BODY'
  const isAccreditationBody = session?.organization?.type === 'ACCREDITATION_BODY'

  if (!isCab) {
    return (
      <Navigate
        to={isAccreditationBody ? ROUTES.abDashboard : ROUTES.dashboard}
        replace
      />
    )
  }

  const reportRoute = isCab
    ? ROUTES.cabDashboard
    : isAccreditationBody
      ? ROUTES.abDashboard
      : ROUTES.dashboard
  const reportApp: WorkspaceApp = {
      title: 'Report and Analytics',
      description: 'Open metrics, reports, tasks, and recent activity.',
      route: reportRoute,
      icon: DashboardIcon,
    }
  const allApps: WorkspaceApp[] = isCab
    ? cabApps
    : [...organizationApps, reportApp]
  const normalizedQuery = query.trim().toLowerCase()
  const visibleApps = normalizedQuery
    ? allApps.filter(
        (app) =>
          app.title.toLowerCase().includes(normalizedQuery) ||
          app.description.toLowerCase().includes(normalizedQuery),
      )
    : allApps

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fd]">
      <CabHeader
        title=""
        logoClassName="h-14 w-auto object-contain sm:h-16 lg:h-[72px]"
      />

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <div className="mb-7">
          <p className="text-small-medium uppercase tracking-[0.14em] text-primary">
            Application hub
          </p>
          <h1 className="mt-2 text-h2 text-neutral-900">Your workspace, connected.</h1>
          <p className="mt-2 max-w-2xl text-body-2 text-neutral-500">
            Everything you need to manage your conformity assessment work.
          </p>
        </div>

        <label className="relative mb-8 block">
          <span className="sr-only">Search applications</span>
          <AppIcon
            icon={SearchIcon}
            size={20}
            className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search applications..."
            className="h-12 w-full rounded-[var(--radius-md)] border border-[#e7eaf0] bg-white ps-12 pe-4 text-body-3 text-neutral-900 shadow-[0_3px_12px_rgba(16,24,40,0.035)] outline-none transition placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </label>

        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-small-medium uppercase tracking-[0.1em] text-neutral-500">
            All applications
          </h2>
          <span className="rounded-full bg-primary-subtle px-3 py-1 text-small-medium text-primary">
            {visibleApps.length}
          </span>
        </div>

        {visibleApps.length > 0 ? (
          <section
            aria-label="Workspace applications"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
          >
            {visibleApps.map((app) => (
              <AppTile key={`${app.title}-${app.route}`} app={app} />
            ))}
          </section>
        ) : (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-neutral-200 bg-white px-6 text-center">
            <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-primary-subtle text-primary">
              <AppIcon icon={SearchIcon} size={21} />
            </div>
            <h2 className="text-body-2-semibold text-neutral-900">No applications found</h2>
            <p className="mt-1 text-body-3 text-neutral-500">
              Try searching with a different name.
            </p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="mt-4 text-body-3-medium text-primary hover:underline"
            >
              Clear search
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
