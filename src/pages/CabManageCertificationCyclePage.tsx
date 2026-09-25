import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useManageCertificationCycleTourSteps } from '@/config/manageCertificationCycleTourSteps'
import { CertificationLifecycleBadge } from '@/components/dashboard/cab/CertificationLifecycleBadge'
import { SectionCard } from '@/components/dashboard/cab/ReviewPrimitives'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import {
  AddCircleIcon,
  AppIcon,
  ArrowRightIcon,
  BuildingsIcon,
  CalendarIcon,
  ChevronDownIcon,
  FileTextIcon,
  HistoryIcon,
  LocationAddIcon,
  MoreIcon,
  PhoneIcon,
  SortIcon,
  UserIcon,
  type AppIconComponent,
} from '@/components/icons'
import {
  getCertificationCycleDetail,
  type CertificationCycleDetail,
  type CertificationCycleEvent,
  type CertificationCycleRecordGroup,
} from '@/lib/api/cabCertificationApi'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

/** Same breadcrumb chevron used across every CAB page (e.g. CabCertificationCyclesPage). */
function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-400 rtl-flip" aria-hidden>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const dropdownMenuContentClassName = 'z-50 min-w-[200px] rounded-[8px] border border-[#e2e2e2] bg-white p-1 shadow-lg'
const dropdownMenuItemClassName =
  'flex cursor-pointer select-none items-center gap-2 rounded-[6px] px-3 py-2.5 text-[13px] font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50'

const TABS = [
  'cycle',
  'certificateDetails',
  'auditHistory',
  'sites',
  'scope',
  'transfer',
  'suspension',
  'documents',
  'relatedApplications',
] as const
type TabId = (typeof TABS)[number]

const LIFECYCLE_ACTIONS = ['scheduleSurveillance', 'requestScopeChange', 'transferCertificate', 'suspendCertificate'] as const

const RECORD_GROUP_ICONS: Record<string, AppIconComponent> = {
  scopeChanges: SortIcon,
  siteChanges: LocationAddIcon,
  transfers: CalendarIcon,
  suspensions: HistoryIcon,
}

/** Label above a value — mirrors the Field helper on the certification register. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-medium text-neutral-500">{label}</p>
      <div className="mt-1 text-[14px] font-semibold text-neutral-900">{children || '—'}</div>
    </div>
  )
}

function SummaryDivider() {
  return <div className="hidden h-16 w-px shrink-0 self-center bg-neutral-200 lg:block" aria-hidden />
}

function EventDot({ status }: { status: CertificationCycleEvent['status'] }) {
  return (
    <span
      className={cn(
        'relative z-10 mt-1 flex size-3 shrink-0 rounded-full border-2',
        status === 'next' ? 'border-primary bg-primary' : 'border-neutral-300 bg-white',
      )}
      aria-hidden
    />
  )
}

/**
 * Collapsible "More details" row. Nothing in the codebase provides an
 * accordion (SectionCard is always-open, the steppers are tab bars), so this
 * is a page-local disclosure built on a plain button + aria-expanded rather
 * than pulling in another dependency.
 */
function RecordGroupRow({
  group,
  title,
  description,
  badge,
  emptyLabel,
  columns,
}: {
  group: CertificationCycleRecordGroup
  title: string
  description: string
  badge: { label: string; highlighted: boolean }
  emptyLabel: string
  columns: { title: string; date: string; status: string }
}) {
  const [open, setOpen] = useState(false)
  const Icon = RECORD_GROUP_ICONS[group.id] ?? FileTextIcon
  const contentId = `record-group-${group.id}`

  return (
    <div className="border-b border-[#f0f0f0] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center gap-4 px-2 py-4 text-start transition-colors hover:bg-neutral-50"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-primary-subtle text-primary">
          <AppIcon icon={Icon} size={20} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold text-neutral-900">{title}</span>
          <span className="mt-0.5 block text-[13px] text-neutral-500">{description}</span>
        </span>

        <span
          className={cn(
            'hidden shrink-0 items-center justify-center rounded-[4px] px-3 py-1 text-[12px] font-medium whitespace-nowrap sm:inline-flex',
            badge.highlighted ? 'bg-[#fef3c6] text-[#a58401]' : 'bg-[#f3f4f6] text-neutral-600',
          )}
        >
          {badge.label}
        </span>

        <AppIcon
          icon={ChevronDownIcon}
          size={18}
          className={cn('shrink-0 text-neutral-400 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div id={contentId} className="px-2 pb-4">
          {group.records.length === 0 ? (
            <p className="rounded-[10px] bg-neutral-50 px-4 py-5 text-center text-[13px] text-neutral-400">{emptyLabel}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-start">
                <thead>
                  <tr className="border-b border-[#ececec] text-[12px] text-neutral-500">
                    <th className="py-2 pe-2 text-start font-medium">{columns.title}</th>
                    <th className="py-2 pe-2 text-start font-medium">{columns.date}</th>
                    <th className="py-2 ps-2 text-start font-medium">{columns.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f0]">
                  {group.records.map((record) => (
                    <tr key={record.id} className="text-[13px] text-neutral-700">
                      <td className="py-2.5 pe-2">{record.title}</td>
                      <td className="py-2.5 pe-2 whitespace-nowrap">{record.date}</td>
                      <td className="py-2.5 ps-2">{record.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function CabManageCertificationCyclePage() {
  const { t } = useTranslation()
  const tourSteps = useManageCertificationCycleTourSteps()
  const { cycleId = '' } = useParams<{ cycleId: string }>()
  const navigate = useNavigate()

  const [tab, setTab] = useState<TabId>('cycle')
  const [retryToken, setRetryToken] = useState(0)
  /** Result is tagged with the id it belongs to, so a stale result from a
   *  previous cycleId reads as "still loading" instead of flashing wrong data. */
  const [result, setResult] = useState<{ id: string; cycle: CertificationCycleDetail | null; failed: boolean } | null>(
    null,
  )

  useEffect(() => {
    let cancelled = false

    getCertificationCycleDetail(cycleId)
      .then((data) => {
        if (!cancelled) setResult({ id: cycleId, cycle: data, failed: false })
      })
      .catch((error) => {
        console.error('Failed to load certification cycle:', error)
        if (!cancelled) setResult({ id: cycleId, cycle: null, failed: true })
      })

    return () => {
      cancelled = true
    }
  }, [cycleId, retryToken])

  const loading = result?.id !== cycleId
  const failed = result?.failed ?? false
  const cycle = result?.cycle ?? null
  const retry = () => {
    setResult(null)
    setRetryToken((token) => token + 1)
  }

  const title = t('cab.manageCycle.title', 'Manage certification cycle')

  const tabLabels: Record<TabId, string> = {
    cycle: t('cab.manageCycle.tabs.cycle', 'Certification cycle'),
    certificateDetails: t('cab.manageCycle.tabs.certificateDetails', 'Certificate details'),
    auditHistory: t('cab.manageCycle.tabs.auditHistory', 'Audit history'),
    sites: t('cab.manageCycle.tabs.sites', 'Sites'),
    scope: t('cab.manageCycle.tabs.scope', 'Scope'),
    transfer: t('cab.manageCycle.tabs.transfer', 'Transfer'),
    suspension: t('cab.manageCycle.tabs.suspension', 'Suspension'),
    documents: t('cab.manageCycle.tabs.documents', 'Documents'),
    relatedApplications: t('cab.manageCycle.tabs.relatedApplications', 'Related applications'),
  }

  const recordGroupLabels: Record<string, { title: string; description: string }> = {
    scopeChanges: {
      title: t('cab.manageCycle.records.scopeChanges.title', 'Scope change requests'),
      description: t('cab.manageCycle.records.scopeChanges.description', 'View and manage scope change requests for this certificate.'),
    },
    siteChanges: {
      title: t('cab.manageCycle.records.siteChanges.title', 'Site changes'),
      description: t('cab.manageCycle.records.siteChanges.description', 'View and manage additions, removals or changes to certified sites.'),
    },
    transfers: {
      title: t('cab.manageCycle.records.transfers.title', 'Transfer records'),
      description: t('cab.manageCycle.records.transfers.description', 'View transfer history related to this certificate.'),
    },
    suspensions: {
      title: t('cab.manageCycle.records.suspensions.title', 'Suspension history'),
      description: t('cab.manageCycle.records.suspensions.description', 'View suspension and reinstatement records for this certificate.'),
    },
  }

  const breadcrumb = (
    <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]" aria-label="breadcrumb">
      <Link to={ROUTES.cabCertificationCycles} className="font-light text-neutral-400 hover:text-primary">
        {t('cab.certification.title', 'Certification')}
      </Link>
      <Chevron />
      <span className="font-medium text-neutral-700">{title}</span>
    </nav>
  )

  if (loading) {
    return (
      <CabLayout>
        <CabHeader title={title} notificationCount={3} />
        <main className="flex flex-1 flex-col gap-5 overflow-auto p-6" aria-busy>
          {breadcrumb}
          <div className="h-24 animate-pulse rounded-[16px] border border-[#ececec] bg-white" />
          <div className="h-32 animate-pulse rounded-[16px] border border-[#ececec] bg-white" />
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="h-56 animate-pulse rounded-[16px] border border-[#ececec] bg-white" />
            <div className="h-56 animate-pulse rounded-[16px] border border-[#ececec] bg-white" />
            <div className="h-56 animate-pulse rounded-[16px] border border-[#ececec] bg-white" />
          </div>
        </main>
      </CabLayout>
    )
  }

  if (failed || !cycle) {
    return (
      <CabLayout>
        <CabHeader title={title} notificationCount={3} />
        <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
          {breadcrumb}
          <ErrorState
            title={
              failed
                ? t('cab.manageCycle.loadErrorTitle', 'Could not load this certification cycle')
                : t('cab.manageCycle.notFoundTitle', 'Certification cycle not found')
            }
            description={
              failed
                ? t('cab.manageCycle.loadErrorDescription', 'Something went wrong while loading the cycle. Please try again.')
                : t('cab.manageCycle.notFoundDescription', 'This cycle may have been removed or the link is no longer valid.')
            }
            retryLabel={failed ? t('errors.retry') : t('cab.manageCycle.backToCycles', 'Back to certification cycles')}
            onRetry={failed ? retry : () => navigate(ROUTES.cabCertificationCycles)}
          />
        </main>
      </CabLayout>
    )
  }

  const { certificate, nextEvent } = cycle

  return (
    <CabLayout tourId="cab-manage-certification-cycle" tourSteps={tourSteps}>
      <CabHeader title={title} notificationCount={3} />
      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        {breadcrumb}

        {/* Page title + lifecycle actions */}
        <CabTourStep steps={tourSteps} stepId="manage-cycle-header">
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
            <div className="min-w-0">
              <h1 className="text-[28px] font-bold leading-tight text-neutral-900">{title}</h1>
              <p className="mt-1 text-[14px] text-neutral-500">
                {t(
                  'cab.manageCycle.subtitle',
                  'Track and manage the full certification lifecycle, including surveillance, scope changes, site updates and transfers.',
                )}
              </p>
            </div>

            <div className="flex w-full shrink-0 items-center gap-3 lg:w-auto">
              <Button
                variant="primary"
                size="sm"
                icon={<AppIcon icon={AddCircleIcon} size={18} />}
                className="h-11 flex-1 lg:flex-none"
                onClick={() => navigate('/cab/applications/draft')}
              >
                {t('cab.manageCycle.createApplication', 'Create application')}
              </Button>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <Button variant="outline" size="sm" className="h-11 flex-1 lg:flex-none">
                    {t('cab.manageCycle.lifecycleActions', 'Lifecycle actions')}
                    <AppIcon icon={ChevronDownIcon} size={16} />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content align="end" sideOffset={4} className={dropdownMenuContentClassName}>
                    {LIFECYCLE_ACTIONS.map((action) => (
                      <DropdownMenu.Item key={action} className={dropdownMenuItemClassName}>
                        {t(`cab.manageCycle.actions.${action}`, action)}
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    aria-label={t('common.moreActions', 'More actions')}
                    className="flex size-11 shrink-0 items-center justify-center rounded-[8px] border border-[#e2e2e2] text-neutral-500 transition-colors hover:bg-neutral-50"
                  >
                    <AppIcon icon={MoreIcon} size={18} />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content align="end" sideOffset={4} className={dropdownMenuContentClassName}>
                    <DropdownMenu.Item className={dropdownMenuItemClassName}>
                      {t('cab.manageCycle.actions.downloadCertificate', 'Download certificate')}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item className={dropdownMenuItemClassName}>
                      {t('cab.manageCycle.actions.printSummary', 'Print cycle summary')}
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>
        </CabTourStep>

        {/* Client + certificate summary */}
        <CabTourStep steps={tourSteps} stepId="manage-cycle-client-card">
          <section className="flex flex-col gap-5 rounded-[16px] border border-[#ececec] bg-white p-5 lg:flex-row lg:items-stretch lg:gap-6">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-[12px] bg-primary-subtle text-primary">
                <AppIcon icon={BuildingsIcon} size={26} />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-[20px] font-bold text-neutral-900">{cycle.clientName}</h2>
                <p className="mt-0.5 text-[13px] text-neutral-500">
                  {cycle.clientId} <span className="mx-1 text-neutral-300">|</span> {cycle.country}
                </p>
              </div>
            </div>

            <SummaryDivider />

            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span className="mt-0.5 shrink-0 text-neutral-400">
                <AppIcon icon={UserIcon} size={22} />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-neutral-500">
                  {t('cab.certification.fields.primaryContact', 'Primary contact')}
                </p>
                <p className="mt-0.5 truncate text-[15px] font-semibold text-neutral-900">{cycle.primaryContactName}</p>
                <a
                  href={`mailto:${cycle.primaryContactEmail}`}
                  className="mt-0.5 block truncate text-[13px] text-neutral-500 hover:text-primary"
                >
                  {cycle.primaryContactEmail}
                </a>
                <a
                  href={`tel:${cycle.primaryContactPhone.replace(/\s/g, '')}`}
                  dir="ltr"
                  className="mt-0.5 flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-primary"
                >
                  <AppIcon icon={PhoneIcon} size={14} />
                  {cycle.primaryContactPhone}
                </a>
              </div>
            </div>

            <SummaryDivider />

            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span className="mt-0.5 shrink-0 text-neutral-400">
                <AppIcon icon={FileTextIcon} size={22} />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-neutral-500">
                  {t('cab.manageCycle.activeCertificate', 'Active certificate')}
                </p>
                <p className="mt-0.5 text-[16px] font-bold text-primary">{certificate.certificateNumber}</p>
                <p className="mt-0.5 text-[13px] text-neutral-600">{certificate.standard}</p>
                <p className="text-[13px] text-neutral-500">{certificate.standardLabel}</p>
              </div>
            </div>

            <SummaryDivider />

            <div className="shrink-0">
              <CertificationLifecycleBadge status={certificate.status} label={certificate.statusLabel} />
              <p className="mt-2 text-[13px] text-neutral-600">
                {t('cab.manageCycle.validFrom', 'Valid from {{date}}', { date: certificate.validFrom })}
              </p>
              <p className="text-[13px] text-neutral-600">
                {t('cab.manageCycle.validUntil', 'Valid until {{date}}', { date: certificate.validUntil })}
              </p>
              <Button variant="tertiary" size="sm" className="mt-1 h-auto p-0 text-[13px]">
                {t('cab.manageCycle.viewCertificate', 'View certificate')}
                <AppIcon icon={ArrowRightIcon} size={14} className="rtl-flip" />
              </Button>
            </div>
          </section>
        </CabTourStep>

        {/* Section tabs */}
        <CabTourStep steps={tourSteps} stepId="manage-cycle-tabs">
          <div
            role="tablist"
            aria-label={t('cab.manageCycle.tabsLabel', 'Certification cycle sections')}
            className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-[#ececec]"
          >
            {TABS.map((tabId) => (
              <button
                key={tabId}
                type="button"
                role="tab"
                aria-selected={tab === tabId}
                onClick={() => setTab(tabId)}
                className={cn(
                  '-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-[14px] font-medium transition-colors',
                  tab === tabId
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900',
                )}
              >
                {tabLabels[tabId]}
              </button>
            ))}
          </div>
        </CabTourStep>

        {tab !== 'cycle' ? (
          <section className="flex min-h-40 flex-col items-center justify-center rounded-[16px] border border-dashed border-neutral-200 bg-white px-6 text-center">
            <p className="text-[14px] font-semibold text-neutral-900">{tabLabels[tab]}</p>
            <p className="mt-1 text-[13px] text-neutral-500">
              {t('cab.certification.tabComingSoon', 'This section is coming soon.')}
            </p>
          </section>
        ) : (
          <>
            <CabTourStep steps={tourSteps} stepId="manage-cycle-current-status">
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                {/* Current cycle */}
                <SectionCard title={t('cab.manageCycle.currentCycleTitle', 'Current certification cycle')}>
                  <div className="space-y-4">
                    <Field label={t('cab.manageCycle.fields.cycle', 'Cycle')}>{cycle.cycleRangeLabel}</Field>
                    <Field label={t('cab.certification.fields.cycleStatus', 'Cycle status')}>
                      <span className="inline-flex items-center gap-2 rounded-[4px] bg-[#eafaf1] px-3 py-1 text-[12px] font-medium text-[#16a34a] whitespace-nowrap">
                        <span className="size-1.5 rounded-full bg-current" aria-hidden />
                        {cycle.cycleStatusLabel}
                      </span>
                    </Field>
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <Field label={t('cab.manageCycle.fields.initialCertification', 'Initial certification')}>
                        {cycle.initialCertificationDate}
                      </Field>
                      <Field label={t('cab.manageCycle.fields.certificationExpiry', 'Certification expiry')}>
                        {cycle.certificationExpiryDate}
                      </Field>
                    </div>
                  </div>
                </SectionCard>

                {/* Next event — highlighted, matches the CalloutCard blue tone */}
                <section className="rounded-[var(--radius-md)] border border-[#dbe4fb] bg-[#f3f6fd] p-5">
                  {nextEvent ? (
                    <>
                      <p className="text-[13px] font-semibold text-primary">
                        {t('cab.manageCycle.nextEvent', 'Next event')}
                      </p>
                      <div className="mt-2 flex items-center gap-2.5">
                        <span className="text-primary">
                          <AppIcon icon={CalendarIcon} size={24} />
                        </span>
                        <h3 className="text-[20px] font-bold text-primary">{nextEvent.typeLabel}</h3>
                      </div>

                      <div className="mt-4">
                        <p className="text-[12px] font-medium text-neutral-500">
                          {t('cab.manageCycle.fields.targetWindow', 'Target window')}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-3">
                          <p className="text-[14px] font-semibold text-neutral-900">
                            {nextEvent.windowStart} – {nextEvent.windowEnd}
                          </p>
                          <span
                            className={cn(
                              'inline-flex items-center justify-center rounded-[4px] px-3 py-1 text-[12px] font-medium whitespace-nowrap',
                              nextEvent.dueInDays >= 0 ? 'bg-white text-neutral-600' : 'bg-[#fef2f2] text-[#dc2626]',
                            )}
                          >
                            {nextEvent.dueInDays >= 0
                              ? t('cab.certification.dueIn', 'Due in {{count}} days', { count: nextEvent.dueInDays })
                              : t('cab.certification.overdueBy', 'Overdue by {{count}} days', {
                                  count: Math.abs(nextEvent.dueInDays),
                                })}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label={t('cab.manageCycle.fields.responsibleCoordinator', 'Responsible coordinator')}>
                          <span className="inline-flex items-center gap-1.5">
                            <AppIcon icon={UserIcon} size={16} className="text-neutral-400" />
                            {nextEvent.responsibleCoordinator}
                          </span>
                        </Field>
                        <Field label={t('cab.certification.table.status', 'Status')}>
                          <span className="inline-flex items-center gap-2 text-[14px] font-normal text-neutral-600">
                            <span
                              className={cn(
                                'size-1.5 rounded-full',
                                nextEvent.scheduled ? 'bg-[#16a34a]' : 'bg-neutral-400',
                              )}
                              aria-hidden
                            />
                            {nextEvent.schedulingStatusLabel}
                          </span>
                        </Field>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <Button variant="primary" size="sm" className="h-11">
                          {t('cab.manageCycle.saveDraftEvent', 'Save draft event')}
                        </Button>
                        <Button variant="outline" size="sm" className="h-11 bg-white">
                          {t('cab.manageCycle.viewEventDetails', 'View event details')}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="py-8 text-center text-[13px] text-neutral-500">
                      {t('cab.manageCycle.noNextEvent', 'No upcoming event is planned for this cycle.')}
                    </p>
                  )}
                </section>

                {/* Upcoming cycle events */}
                <SectionCard
                  title={t('cab.manageCycle.upcomingEventsTitle', 'Upcoming cycle events')}
                  action={
                    <Button variant="tertiary" size="sm" className="h-auto p-0 text-[13px]">
                      {t('common.viewAll', 'View all')}
                    </Button>
                  }
                >
                  {cycle.upcomingEvents.length === 0 ? (
                    <p className="py-6 text-center text-[13px] text-neutral-400">
                      {t('cab.manageCycle.noUpcomingEvents', 'No upcoming events.')}
                    </p>
                  ) : (
                    <ol className="relative space-y-5">
                      {cycle.upcomingEvents.map((event, index) => (
                        <li key={event.id} className="relative flex gap-3">
                          {index < cycle.upcomingEvents.length - 1 && (
                            <span className="absolute top-4 start-[5px] h-full w-px bg-neutral-200" aria-hidden />
                          )}
                          <EventDot status={event.status} />
                          <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[14px] font-semibold text-neutral-900">{event.typeLabel}</p>
                              <p className="mt-0.5 text-[13px] text-neutral-500">
                                {event.windowStart} – {event.windowEnd}
                              </p>
                            </div>
                            <span
                              className={cn(
                                'inline-flex items-center justify-center shrink-0 rounded-[4px] px-3 py-1 text-[12px] font-medium whitespace-nowrap',
                                event.status === 'next' ? 'bg-[#e8edfc] text-primary' : 'bg-[#f3f4f6] text-neutral-600',
                              )}
                            >
                              {event.statusLabel}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </SectionCard>
              </div>
            </CabTourStep>

            {/* More details */}
            <CabTourStep steps={tourSteps} stepId="manage-cycle-accordions">
              <SectionCard title={t('cab.manageCycle.moreDetails', 'More details')}>
                <div className="-mt-2">
                  {cycle.recordGroups.map((group) => {
                    const labels = recordGroupLabels[group.id]
                    const highlighted = (group.highlightCount ?? 0) > 0

                    return (
                      <RecordGroupRow
                        key={group.id}
                        group={group}
                        title={`${labels?.title ?? group.id} (${group.count})`}
                        description={labels?.description ?? ''}
                        badge={{
                          label: highlighted
                            ? t('cab.manageCycle.openCount', '{{count}} Open', { count: group.highlightCount })
                            : group.count > 0
                              ? t('cab.manageCycle.recordCount', '{{count}} Records', { count: group.count })
                              : t('cab.manageCycle.noRecords', 'No records'),
                          highlighted,
                        }}
                        emptyLabel={t('cab.manageCycle.noRecords', 'No records')}
                        columns={{
                          title: t('cab.manageCycle.table.record', 'Record'),
                          date: t('cab.certification.table.date', 'Date'),
                          status: t('cab.certification.table.status', 'Status'),
                        }}
                      />
                    )
                  })}
                </div>
              </SectionCard>
            </CabTourStep>
          </>
        )}
      </main>
    </CabLayout>
  )
}