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

function AppTile({ app, number }: { app: WorkspaceApp; number: number }) {
  const { t } = useTranslation()
  const className =
    'group relative flex h-[170px] flex-col items-center justify-center rounded-[24px] border border-[#ececec] bg-white px-4 py-5 text-center shadow-[0_6px_24px_rgba(16,24,40,0.045)] transition duration-200'
  const content = (
    <>
      <span className="absolute start-3 top-3 flex size-[23px] items-center justify-center rounded-full bg-[#f3f5ff] text-[11px] font-medium text-primary">{number}</span>
      {app.comingSoon && (
        <span className="absolute end-3 top-3 rounded-full bg-neutral-50 px-2 py-1 text-[10px] font-medium text-neutral-500">
          {t('cab.workspace.comingSoon')}
        </span>
      )}
      <div className="mb-3 flex size-[45px] items-center justify-center rounded-[12px] bg-[#f3f5ff] text-primary transition-colors group-hover:bg-primary group-hover:text-white">
        <AppIcon icon={app.icon} size={24} />
      </div>
      <h2 className="text-[15px] font-semibold text-neutral-900">{app.title}</h2>
      <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-neutral-500">
        {app.description}
      </p>
    </>
  )

  if (!app.route) {
    return (
      <div
        aria-disabled="true"
        className={`${className} cursor-default`}
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

  const groups = [
    { key: 'setup', title: 'Set up your body', description: 'Start here: profile, schemes, people and competence.', apps: ['companyProfile', 'competence', 'settings', 'dataMigration', 'singleSignOn', 'agreementTerms', 'travelPolicy'] },
    { key: 'sales', title: 'Sales & business development', description: 'Capture every lead and move it to a signed agreement.', apps: ['salesHub'] },
    { key: 'clients', title: 'Clients', description: 'Register the organisations you certify and their contacts.', apps: ['auditClients', 'contacts', 'clientPortal'] },
    { key: 'application', title: 'Application', description: 'Receive the application and confirm you can certify it.', apps: ['applications', 'applicationReceipt', 'applicationReview', 'informationRequired', 'technicalFeasibility'] },
    { key: 'quotation', title: 'Quotation & contract', description: 'Price the audit, approve it and send the offer.', apps: ['quotation', 'quotationApproval', 'offers', 'certificationAgreements'] },
    { key: 'audit', title: 'Audit', description: 'Plan the audit, report findings and close nonconformities.', apps: ['auditPlanning', 'auditChecklists', 'auditReporting', 'nonconformities'] },
    { key: 'certification', title: 'Decision & certification', description: 'Decide, issue the certificate and run the cycle.', apps: ['decisions', 'certificates', 'certification'] },
    { key: 'finance', title: 'Finance & insight', description: 'Invoice the work and follow performance.', apps: ['invoices', 'reportsAnalytics'] },
  ]
  const upcomingApps: WorkspaceApp[] = [
    { key: 'dataMigration', title: 'Data migration', description: 'Import your existing clients, people, certificates, audits and more.', icon: ExportIcon },
    { key: 'singleSignOn', title: 'Single sign-on', description: 'Let your staff sign in with Microsoft Entra ID, Google Workspace, Okta.', icon: ShieldIcon },
    { key: 'agreementTerms', title: 'Agreement terms', description: 'Your agreement template, its variables and the audit plan gate.', icon: SettingsIcon },
    { key: 'travelPolicy', title: 'Travel policy', description: 'Rules, rates and providers of the travel cost calculator.', icon: ExportIcon },
    { key: 'salesHub', title: 'Sales Hub', description: 'Track every lead from client registration to a signed agreement.', icon: ReportIcon },
    { key: 'certificationAgreements', title: 'Certification agreements', description: 'Send the certification agreement, collect e-signatures and keep everything together.', icon: FileTextIcon },
    { key: 'auditChecklists', title: 'Audit checklists', description: 'A checklist for every standard, clause by clause, ready for the audit.', icon: TaskSquareIcon },
  ].map((app) => ({ ...app, comingSoon: true, title: t(`cab.workspace.apps.${app.key}`, app.title), description: t(`cab.workspace.appDesc.${app.key}`, app.description) }))
  const appsByKey = new Map([...cabApps, ...upcomingApps].map((app) => [app.key, app]))
  const allApps = groups.flatMap((group) => group.apps.flatMap((key) => {
    const app = appsByKey.get(key)
    return app ? [app] : []
  }))
  const normalizedQuery = query.trim().toLowerCase()
  const visibleApps = normalizedQuery
    ? allApps.filter(
        (app) =>
          app.title.toLowerCase().includes(normalizedQuery) ||
          app.description.toLowerCase().includes(normalizedQuery),
      )
    : allApps

  return (
    <div className="flex min-h-screen flex-col bg-[#fcfcfc]">
      <CabHeader
        title=""
        logoClassName="h-14 w-auto object-contain sm:h-16 lg:h-[72px]"
      />

      <main className="mx-auto flex w-full max-w-[1356px] flex-1 flex-col px-5 py-8 sm:px-8 lg:px-12 lg:py-5">
        <div className="mb-7">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
            {t('cab.workspace.appHub')}
          </p>
          <h1 className="mt-2 text-[30px] font-bold leading-tight text-neutral-900">{t('cab.workspace.heroTitle')}</h1>
          <p className="mt-3 max-w-2xl text-[14px] text-neutral-500">
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
            className="h-[45px] w-full rounded-[var(--radius-md)] border border-[#e7eaf0] bg-white ps-12 pe-4 text-body-3 text-neutral-900 shadow-[0_3px_12px_rgba(16,24,40,0.035)] outline-none transition placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </label>

        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.1em] text-neutral-500">
            {t('cab.workspace.allApplications')}
          </h2>
          <span className="rounded-full bg-primary-subtle px-3 py-1 text-small-medium text-primary">
            {visibleApps.length}
          </span>
        </div>

        {visibleApps.length > 0 ? (
          <div className="space-y-7">
            {groups.map((group, index) => {
              const apps = visibleApps.filter((app) => group.apps.includes(app.key))
              if (!apps.length) return null
              return (
                <section key={group.key} aria-labelledby={`workspace-${group.key}`}>
                  <div className="mb-3 flex items-start gap-3">
                    <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-primary text-[14px] font-semibold text-white">{index + 1}</span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 id={`workspace-${group.key}`} className="text-[15px] font-semibold text-neutral-900">{t(`cab.workspace.groups.${group.key}.title`, group.title)}</h2>
                        {index === 0 && <span className="rounded bg-[#e8edff] px-2 py-0.5 text-[11px] text-primary">{t('cab.workspace.startHere', 'Start here')}</span>}
                      </div>
                      <p className="mt-0.5 text-[13px] text-neutral-500">{t(`cab.workspace.groups.${group.key}.description`, group.description)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
                    {apps.map((app) => <AppTile key={app.key} app={app} number={allApps.findIndex((item) => item.key === app.key) + 1} />)}
                  </div>
                </section>
              )
            })}
          </div>
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
