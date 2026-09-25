import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import { getAuthSession, isAuditClientSession } from '@/lib/authStorage'
import { ROUTES } from '@/lib/routes'

interface WorkspaceApp {
  key: string
  title: string
  description: string
  route?: string
  icon: AppIconComponent
  comingSoon?: boolean
}

function AppTile({ app }: { app: WorkspaceApp }) {
  const { t } = useTranslation()
  const className =
    'group relative flex min-h-[166px] flex-col items-center justify-center rounded-[var(--radius-lg)] border border-[#e9edf4] bg-white px-5 py-6 text-center shadow-[0_4px_14px_rgba(16,24,40,0.035)] transition duration-200'
  const content = (
    <>
      {app.comingSoon && (
        <span className="absolute end-3 top-3 rounded-full bg-neutral-50 px-2 py-1 text-[10px] font-medium text-neutral-500">
          {t('cab.workspace.comingSoon')}
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
      aria-label={t('cab.workspace.openApp', { name: app.title })}
      className={`${className} hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_12px_28px_rgba(18,54,163,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
    >
      {content}
    </Link>
  )
}

export function WorkspacePage() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const session = getAuthSession()
  const isCab =
    !isAuditClientSession(session) &&
    (Boolean(session?.cab) || session?.organization?.type === 'CERTIFICATION_BODY')
  const isAccreditationBody = session?.organization?.type === 'ACCREDITATION_BODY'

  const cabApps: WorkspaceApp[] = useMemo(
    () => [
      {
        key: 'applications',
        title: t('cab.workspace.apps.applications'),
        description: t('cab.workspace.appDesc.applications'),
        route: ROUTES.cabApplicationRegister,
        icon: FileTextIcon,
      },
      {
        key: 'auditClients',
        title: t('cab.workspace.apps.auditClients'),
        description: t('cab.workspace.appDesc.auditClients'),
        route: ROUTES.cabAuditClients,
        icon: UsersIcon,
      },
      {
        key: 'applicationReview',
        title: t('cab.workspace.apps.applicationReview'),
        description: t('cab.workspace.appDesc.applicationReview'),
        route: '/cab/applications/review',
        icon: FileReviewIcon,
      },
      {
        key: 'contacts',
        title: t('cab.workspace.apps.contacts'),
        description: t('cab.workspace.appDesc.contacts'),
        route: ROUTES.cabContacts,
        icon: MailIcon,
      },
      {
        key: 'offers',
        title: t('cab.workspace.apps.offers'),
        description: t('cab.workspace.appDesc.offers'),
        route: ROUTES.cabOffers,
        icon: ExportIcon,
      },
      {
        key: 'invoices',
        title: t('cab.workspace.apps.invoices'),
        description: t('cab.workspace.appDesc.invoices'),
        route: ROUTES.cabInvoices,
        icon: ReceiptIcon,
      },
      {
        key: 'auditPlanning',
        title: t('cab.workspace.apps.auditPlanning'),
        description: t('cab.workspace.appDesc.auditPlanning'),
        route: ROUTES.cabAuditPlanning,
        icon: TaskSquareIcon,
      },
      {
        key: 'auditReporting',
        title: t('cab.workspace.apps.auditReporting'),
        description: t('cab.workspace.appDesc.auditReporting'),
        route: ROUTES.cabAuditReporting,
        icon: ReportIcon,
      },
      {
        key: 'decisions',
        title: t('cab.workspace.apps.decisions'),
        description: t('cab.workspace.appDesc.decisions'),
        route: ROUTES.cabDecisions,
        icon: SuccessCircleIcon,
      },
      {
        key: 'certificates',
        title: t('cab.workspace.apps.certificates'),
        description: t('cab.workspace.appDesc.certificates'),
        route: ROUTES.cabCertificates,
        icon: CertificateBadgeIcon,
      },
      {
        key: 'nonconformities',
        title: t('cab.workspace.apps.nonconformities'),
        description: t('cab.workspace.appDesc.nonconformities'),
        route: ROUTES.cabNonconformities,
        icon: CorrectiveActionIcon,
      },
      {
        key: 'certification',
        title: t('cab.workspace.apps.certification'),
        description: t('cab.workspace.appDesc.certification'),
        route: ROUTES.cabCertificationCycles,
        icon: ShieldIcon,
      },
      {
        key: 'reportsAnalytics',
        title: t('cab.workspace.apps.reportsAnalytics'),
        description: t('cab.workspace.appDesc.reportsAnalytics'),
        route: ROUTES.cabDashboard,
        icon: DashboardIcon,
      },
      {
        key: 'clientPortal',
        title: t('cab.workspace.apps.clientPortal'),
        description: t('cab.workspace.appDesc.clientPortal'),
        route: ROUTES.portal,
        icon: UserIcon,
      },
      {
        key: 'competence',
        title: t('cab.workspace.apps.competence'),
        description: t('cab.workspace.appDesc.competence'),
        route: ROUTES.cabCompetence,
        icon: AccreditationFieldIcon,
      },
      {
        key: 'companyProfile',
        title: t('cab.workspace.apps.companyProfile'),
        description: t('cab.workspace.appDesc.companyProfile'),
        route: ROUTES.cabCompanyProfile,
        icon: BuildingsIcon,
      },
      {
        key: 'settings',
        title: t('cab.workspace.apps.settings'),
        description: t('cab.workspace.appDesc.settings'),
        route: ROUTES.cabCompanyProfile,
        icon: SettingsIcon,
      },
      {
        key: 'applicationReceipt',
        title: t('cab.workspace.apps.applicationReceipt'),
        description: t('cab.workspace.appDesc.applicationReceipt'),
        route: '/cab/applications/receipt',
        icon: ReceiptIcon,
      },
      {
        key: 'informationRequired',
        title: t('cab.workspace.apps.informationRequired'),
        description: t('cab.workspace.appDesc.informationRequired'),
        route: ROUTES.cabApplicationInformationRequired,
        icon: CorrectiveActionIcon,
      },
      {
        key: 'technicalFeasibility',
        title: t('cab.workspace.apps.technicalFeasibility'),
        description: t('cab.workspace.appDesc.technicalFeasibility'),
        route: ROUTES.cabApplicationTechnicalFeasibility,
        icon: SettingsIcon,
      },
      {
        key: 'quotation',
        title: t('cab.workspace.apps.quotation'),
        description: t('cab.workspace.appDesc.quotation'),
        route: ROUTES.cabApplicationQuotation,
        icon: WalletIcon,
      },
      {
        key: 'quotationApproval',
        title: t('cab.workspace.apps.quotationApproval'),
        description: t('cab.workspace.appDesc.quotationApproval'),
        route: ROUTES.cabQuotationApproval,
        icon: SuccessCircleIcon,
      },
    ],
    [t],
  )

  if (!isCab) {
    return (
      <Navigate
        to={isAccreditationBody ? ROUTES.abDashboard : ROUTES.dashboard}
        replace
      />
    )
  }

  const allApps = cabApps
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
            {t('cab.workspace.appHub')}
          </p>
          <h1 className="mt-2 text-h2 text-neutral-900">{t('cab.workspace.heroTitle')}</h1>
          <p className="mt-2 max-w-2xl text-body-2 text-neutral-500">
            {t('cab.workspace.heroSubtitle')}
          </p>
        </div>

        <label className="relative mb-8 block">
          <span className="sr-only">{t('cab.workspace.searchAria')}</span>
          <AppIcon
            icon={SearchIcon}
            size={20}
            className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('cab.workspace.searchPlaceholder')}
            className="h-12 w-full rounded-[var(--radius-md)] border border-[#e7eaf0] bg-white ps-12 pe-4 text-body-3 text-neutral-900 shadow-[0_3px_12px_rgba(16,24,40,0.035)] outline-none transition placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </label>

        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-small-medium uppercase tracking-[0.1em] text-neutral-500">
            {t('cab.workspace.allApplications')}
          </h2>
          <span className="rounded-full bg-primary-subtle px-3 py-1 text-small-medium text-primary">
            {visibleApps.length}
          </span>
        </div>

        {visibleApps.length > 0 ? (
          <section
            aria-label={t('cab.workspace.allApplications')}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
          >
            {visibleApps.map((app) => (
              <AppTile key={app.key} app={app} />
            ))}
          </section>
        ) : (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-neutral-200 bg-white px-6 text-center">
            <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-primary-subtle text-primary">
              <AppIcon icon={SearchIcon} size={21} />
            </div>
            <h2 className="text-body-2-semibold text-neutral-900">{t('cab.workspace.noResults')}</h2>
            <p className="mt-1 text-body-3 text-neutral-500">
              {t('cab.workspace.noResultsHint')}
            </p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="mt-4 text-body-3-medium text-primary hover:underline"
            >
              {t('cab.workspace.clearSearch')}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
