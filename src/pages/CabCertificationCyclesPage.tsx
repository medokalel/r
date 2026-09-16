import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CertificationCycleTimeline } from '@/components/dashboard/cab/CertificationCycleTimeline'
import { TableFilterSelect } from '@/components/dashboard/TableFilterSelect'
import { Button } from '@/components/ui/Button'
import {
  AddCircleIcon,
  AppIcon,
  CalendarIcon,
  ChevronDownIcon,
  EditIcon,
  ExcelFileIcon,
  ExportIcon,
  MailIcon,
  MapPinIcon,
  MoreIcon,
  PdfFileIcon,
  SearchIcon,
  UserIcon,
} from '@/components/icons'
import {
  getCertificationCycles,
  type CertificationCycle,
  type CertificationCycleStage,
  type CertificationLifecycleStatus,
} from '@/lib/api/cabCertificationApi'
import { downloadExcelCsv, downloadPdfFromTable, type TableColumn } from '@/lib/tableTools'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/routes'

/** Same breadcrumb chevron used across every CAB page (e.g. CabApplicationRegisterPage). */
function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-400 rtl-flip" aria-hidden>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const dropdownMenuContentClassName = 'z-50 min-w-[180px] rounded-[8px] border border-[#e2e2e2] bg-white p-1 shadow-lg'
const dropdownMenuItemClassName =
  'flex cursor-pointer select-none items-center gap-2 rounded-[6px] px-3 py-2.5 text-[13px] font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50'

const TABS = ['overview', 'audits', 'findings', 'certificates', 'documents', 'history'] as const
type TabId = (typeof TABS)[number]

const STAGE_STATUS_LABELS: Record<CertificationCycleStage['status'], string> = {
  completed: 'Completed',
  upcoming: 'Upcoming',
  pending: 'Pending',
}

const LIFECYCLE_STATUS_STYLES: Record<CertificationLifecycleStatus, string> = {
  active: 'bg-[#eafaf1] text-[#16a34a]',
  upcoming: 'bg-[#e8edfc] text-primary',
  suspended: 'bg-[#fff7ed] text-[#ea580c]',
  expired: 'bg-[#fef2f2] text-[#dc2626]',
}

const ACTIVITY_STATUS_STYLES: Record<string, string> = {
  Planned: 'bg-[#e8edfc] text-primary',
  Open: 'bg-[#fef3c6] text-[#a58401]',
  Done: 'bg-[#eafaf1] text-[#16a34a]',
}

function LifecycleBadge({ status, label }: { status: CertificationLifecycleStatus; label: string }) {
  return (
    <span className={cn('inline-flex rounded-full px-3 py-1 text-[12px] font-medium', LIFECYCLE_STATUS_STYLES[status])}>
      {label}
    </span>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-medium text-neutral-500">{label}</p>
      <p className="mt-1 text-[14px] font-semibold text-neutral-900">{children || '—'}</p>
    </div>
  )
}

export function CabCertificationCyclesPage() {
  const { t } = useTranslation()
  const [cycles, setCycles] = useState<CertificationCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [duePeriod, setDuePeriod] = useState('all')
  const [country, setCountry] = useState('all')
  const [lifecycleStatus, setLifecycleStatus] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<TabId>('overview')
  const [exporting, setExporting] = useState(false)

  const dueWithinDays = duePeriod === 'all' ? undefined : Number(duePeriod)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getCertificationCycles({
        searchQuery: search.trim() || undefined,
        country,
        lifecycleStatus,
        dueWithinDays,
      })
      setCycles(data)
      setSelectedId((previous) => (data.some((cycle) => cycle.id === previous) ? previous : (data[0]?.id ?? null)))
    } catch (error) {
      console.error('Failed to load certification cycles:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, duePeriod, country, lifecycleStatus])

  const selected = useMemo(() => cycles.find((cycle) => cycle.id === selectedId) ?? null, [cycles, selectedId])

  const clearFilters = () => {
    setSearch('')
    setDuePeriod('all')
    setCountry('all')
    setLifecycleStatus('all')
  }

  const exportColumns: TableColumn<CertificationCycle>[] = [
    { header: t('cab.certification.table.cycleId', 'Cycle ID'), value: (row) => row.cycleId },
    { header: t('cab.certification.fields.clientName', 'Client'), value: (row) => row.clientName },
    { header: t('cab.certification.fields.standard', 'Certificate standard'), value: (row) => row.certificateStandard },
    { header: t('cab.certification.fields.country', 'Country'), value: (row) => row.country },
    { header: t('cab.certification.fields.cycleStatus', 'Cycle status'), value: (row) => row.lifecycleStatusLabel },
    { header: t('cab.certification.fields.nextSurveillance', 'Next surveillance due'), value: (row) => row.nextSurveillanceDue },
  ]

  const exportAll = async () => {
    setExporting(true)
    try {
      return await getCertificationCycles({ searchQuery: search.trim() || undefined, country, lifecycleStatus, dueWithinDays })
    } finally {
      setExporting(false)
    }
  }

  const handleExportExcel = async () => {
    downloadExcelCsv('certification-cycles', exportColumns, await exportAll())
  }

  const handleExportPdf = async () => {
    downloadPdfFromTable(
      'certification-cycles.pdf',
      t('cab.certification.title', 'Certification cycles'),
      exportColumns,
      await exportAll(),
    )
  }

  const tabLabels: Record<TabId, string> = {
    overview: t('cab.certification.tabs.overview', 'Cycle overview'),
    audits: t('cab.certification.tabs.audits', 'Audits'),
    findings: t('cab.certification.tabs.findings', 'Findings'),
    certificates: t('cab.certification.tabs.certificates', 'Certificates'),
    documents: t('cab.certification.tabs.documents', 'Documents'),
    history: t('cab.certification.tabs.history', 'History'),
  }

  return (
    <CabLayout>
      <CabHeader title={t('cab.certification.title', 'Certification cycles')} notificationCount={3} />
      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]" aria-label="breadcrumb">
          <Link to={ROUTES.workspace} className="font-light text-neutral-400 hover:text-primary">
            {t('cab.certification.breadcrumbParent', 'Workspace')}
          </Link>
          <Chevron />
          <span className="font-medium text-neutral-700">{t('cab.certification.title', 'Certification cycles')}</span>
        </nav>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-[28px] font-bold leading-tight text-neutral-900">
              {t('cab.certification.title', 'Certification cycles')}
            </h1>
            <p className="mt-1 text-[14px] text-neutral-500">
              {t('cab.certification.subtitle', 'Manage certification cycles, view timelines and upcoming activities.')}
            </p>
          </div>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <Button variant="primary" icon={<AppIcon icon={AddCircleIcon} size={20} />} className="flex-1 sm:flex-none">
              {t('cab.certification.openCycle', 'Open cycle')}
            </Button>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button
                  variant="outline"
                  icon={<AppIcon icon={ExportIcon} size={20} />}
                  disabled={exporting || cycles.length === 0}
                  className="flex-1 sm:flex-none"
                >
                  {exporting ? t('common.exporting', 'Exporting…') : t('common.export', 'Export')}
                  <AppIcon icon={ChevronDownIcon} size={16} />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content align="end" sideOffset={4} className={dropdownMenuContentClassName}>
                  <DropdownMenu.Item onSelect={handleExportPdf} className={dropdownMenuItemClassName}>
                    <AppIcon icon={PdfFileIcon} size={18} />
                    {t('cab.certification.exportPdf', 'Download PDF')}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={handleExportExcel} className={dropdownMenuItemClassName}>
                    <AppIcon icon={ExcelFileIcon} size={18} />
                    {t('cab.certification.exportExcel', 'Download Excel')}
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>

        {/* Filters */}
        <form
          onSubmit={(event) => {
            event.preventDefault()
            load()
          }}
          className="rounded-[16px] border border-[#ececec] bg-white p-5"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label htmlFor="certification-search" className="text-[13px] font-medium text-neutral-700">
                {t('cab.certification.searchLabel', 'Search client or certificate')}
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400">
                  <AppIcon icon={SearchIcon} size={18} />
                </span>
                <input
                  id="certification-search"
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('cab.certification.searchPlaceholder', 'Search client or certificate')}
                  className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white ps-10 pe-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[13px] font-medium text-neutral-700">{t('cab.certification.duePeriod', 'Due period')}</p>
              <TableFilterSelect
                label={t('cab.certification.duePeriod', 'Due period')}
                value={duePeriod}
                onChange={setDuePeriod}
                className="w-full [&>select]:h-11 [&>select]:w-full"
                options={[
                  { value: 'all', label: t('common.all', 'All') },
                  { value: '30', label: t('cab.certification.duePeriodOptions.30', 'Due in 30 days') },
                  { value: '90', label: t('cab.certification.duePeriodOptions.90', 'Due in 90 days') },
                  { value: '180', label: t('cab.certification.duePeriodOptions.180', 'Due in 180 days') },
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-[13px] font-medium text-neutral-700">{t('cab.certification.country', 'Country')}</p>
              <TableFilterSelect
                label={t('cab.certification.country', 'Country')}
                value={country}
                onChange={setCountry}
                className="w-full [&>select]:h-11 [&>select]:w-full"
                options={[
                  { value: 'all', label: t('common.all', 'All') },
                  { value: 'Saudi Arabia', label: 'Saudi Arabia' },
                  { value: 'United Arab Emirates', label: 'United Arab Emirates' },
                  { value: 'Egypt', label: 'Egypt' },
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-[13px] font-medium text-neutral-700">
                {t('cab.certification.lifecycleStatus', 'Lifecycle status')}
              </p>
              <TableFilterSelect
                label={t('cab.certification.lifecycleStatus', 'Lifecycle status')}
                value={lifecycleStatus}
                onChange={setLifecycleStatus}
                className="w-full [&>select]:h-11 [&>select]:w-full"
                options={[
                  { value: 'all', label: t('common.all', 'All') },
                  { value: 'active', label: t('cab.certification.status.active', 'Active') },
                  { value: 'upcoming', label: t('cab.certification.status.upcoming', 'Upcoming') },
                  { value: 'suspended', label: t('cab.certification.status.suspended', 'Suspended') },
                  { value: 'expired', label: t('cab.certification.status.expired', 'Expired') },
                ]}
              />
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <Button type="button" variant="tertiary" size="sm" onClick={clearFilters} className="h-auto p-0 text-[13px]">
              {t('cab.certification.clearFilters', 'Clear filters')}
            </Button>
          </div>
        </form>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
          {/* Cycle list */}
          <section className="flex h-fit flex-col rounded-[16px] border border-[#ececec] bg-white p-4">
            <p className="mb-3 px-1 text-[13px] text-neutral-500">
              {loading
                ? t('common.loading', 'Loading…')
                : t('cab.certification.resultCount', '{{count}} result', { count: cycles.length })}
            </p>

            <div className="flex flex-col gap-2">
              {!loading && cycles.length === 0 && (
                <p className="px-2 py-6 text-center text-[13px] text-neutral-400">
                  {t('cab.certification.empty', 'No certification cycles match the current filters.')}
                </p>
              )}
              {cycles.map((cycle) => {
                const isSelected = cycle.id === selectedId
                return (
                  <button
                    key={cycle.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(cycle.id)
                      setTab('overview')
                    }}
                    className={cn(
                      'flex items-start gap-2 rounded-[10px] border-s-4 px-3 py-3 text-start transition-colors',
                      isSelected ? 'border-s-primary bg-[#e8edfc]/50' : 'border-s-transparent hover:bg-neutral-50',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-[14px] font-semibold text-neutral-900">{cycle.clientName}</p>
                        <LifecycleBadge status={cycle.lifecycleStatus} label={cycle.lifecycleStatusLabel} />
                      </div>
                      <p className="mt-0.5 text-[13px] text-neutral-500">{cycle.certificateStandard}</p>
                      <p className="mt-0.5 text-[12px] text-neutral-400">
                        {cycle.clientId} · {cycle.country}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Detail panel */}
          <section className="flex min-w-0 flex-col gap-5">
            {!selected ? (
              <div className="flex min-h-56 flex-col items-center justify-center rounded-[16px] border border-dashed border-neutral-200 bg-white px-6 text-center">
                <p className="text-[14px] text-neutral-500">
                  {t('cab.certification.selectPrompt', 'Select a certification cycle to view its details.')}
                </p>
              </div>
            ) : (
              <>
                {/* Client header */}
                <div className="rounded-[16px] border border-[#ececec] bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-neutral-500">{selected.clientId}</p>
                      <h1 className="mt-0.5 truncate text-[22px] font-bold text-neutral-900">{selected.clientName}</h1>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-neutral-500">
                        <span className="inline-flex items-center gap-1.5">
                          <AppIcon icon={MapPinIcon} size={16} />
                          {selected.country}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <AppIcon icon={UserIcon} size={16} />
                          {selected.primaryContactName}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <AppIcon icon={MailIcon} size={16} />
                          {selected.primaryContactEmail}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button type="button" variant="primary" size="sm">
                        {t('cab.certification.openCycle', 'Open cycle')}
                      </Button>
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button
                            type="button"
                            aria-label={t('common.moreActions', 'More actions')}
                            className="flex size-9 items-center justify-center rounded-[8px] border border-[#e2e2e2] text-neutral-500 transition-colors hover:bg-neutral-50"
                          >
                            <AppIcon icon={MoreIcon} size={18} />
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content align="end" sideOffset={4} className={dropdownMenuContentClassName}>
                            <DropdownMenu.Item onSelect={handleExportPdf} className={dropdownMenuItemClassName}>
                              <AppIcon icon={PdfFileIcon} size={18} />
                              {t('cab.certification.exportPdf', 'Download PDF')}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item onSelect={handleExportExcel} className={dropdownMenuItemClassName}>
                              <AppIcon icon={ExcelFileIcon} size={18} />
                              {t('cab.certification.exportExcel', 'Download Excel')}
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </div>
                  </div>

                </div>

                {/* Tabs — same pill-tab convention as the audit reporting workspace */}
                <div
                  className="flex gap-1.5 overflow-x-auto rounded-[16px] border border-[#ececec] bg-white p-1.5 shadow-none"
                  role="tablist"
                  aria-label={t('cab.certification.tabsLabel', 'Certification cycle sections')}
                >
                  {TABS.map((tabId) => (
                    <button
                      key={tabId}
                      type="button"
                      role="tab"
                      aria-selected={tab === tabId}
                      onClick={() => setTab(tabId)}
                      className={cn(
                        'flex-1 whitespace-nowrap rounded-[10px] px-5 py-2.5 text-[14px] font-medium transition-colors',
                        tab === tabId
                          ? 'bg-[#1236a3] text-white shadow-sm'
                          : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
                      )}
                    >
                      {tabLabels[tabId]}
                    </button>
                  ))}
                </div>

                {tab === 'overview' ? (
                  <>
                    {/* Certification cycle info */}
                    <section className="rounded-[16px] border border-[#ececec] bg-white p-5">
                      <h2 className="text-[16px] font-semibold text-neutral-900">
                        {t('cab.certification.cycleInfoTitle', 'Certification cycle')}
                      </h2>
                      <div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
                        <Field label={t('cab.certification.fields.standard', 'Certificate standard')}>
                          {selected.certificateStandard}
                          <span className="block text-[12px] font-normal text-neutral-500">{selected.certificateStandardLabel}</span>
                        </Field>
                        <Field label={t('cab.certification.fields.application', 'Application')}>{selected.applicationId}</Field>
                        <Field label={t('cab.certification.fields.cycleStatus', 'Cycle status')}>
                          <LifecycleBadge status={selected.lifecycleStatus} label={selected.lifecycleStatusLabel} />
                        </Field>
                        <Field label={t('cab.certification.fields.startDate', 'Cycle start date')}>{selected.cycleStartDate}</Field>
                        <Field label={t('cab.certification.fields.nextSurveillance', 'Next surveillance due')}>
                          <span className="inline-flex items-center gap-1.5">
                            <AppIcon icon={CalendarIcon} size={14} className="text-neutral-400" />
                            {selected.nextSurveillanceDue}
                          </span>
                          <span className="mt-0.5 block text-[12px] font-normal text-primary">
                            {selected.nextSurveillanceDueInDays >= 0
                              ? t('cab.certification.dueIn', 'Due in {{count}} days', { count: selected.nextSurveillanceDueInDays })
                              : t('cab.certification.overdueBy', 'Overdue by {{count}} days', { count: Math.abs(selected.nextSurveillanceDueInDays) })}
                          </span>
                        </Field>
                        <Field label={t('cab.certification.fields.endDate', 'Cycle end date')}>{selected.cycleEndDate}</Field>
                      </div>
                    </section>

                    {/* Timeline */}
                    <section className="rounded-[16px] border border-[#ececec] bg-white p-5">
                      <h2 className="mb-6 text-[16px] font-semibold text-neutral-900">
                        {t('cab.certification.timelineTitle', 'Cycle timeline')}
                      </h2>
                      <CertificationCycleTimeline stages={selected.stages} statusLabels={STAGE_STATUS_LABELS} />
                    </section>

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                      {/* Client details */}
                      <section className="rounded-[16px] border border-[#ececec] bg-white p-5">
                        <div className="mb-4 flex items-center justify-between">
                          <h2 className="text-[16px] font-semibold text-neutral-900">
                            {t('cab.certification.clientDetailsTitle', 'Client details')}
                          </h2>
                          <Button
                            type="button"
                            variant="tertiary"
                            size="sm"
                            icon={<AppIcon icon={EditIcon} size={14} />}
                            className="h-auto p-0 text-[13px]"
                          >
                            {t('common.edit', 'Edit')}
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Field label={t('cab.certification.fields.clientId', 'Client ID')}>{selected.clientId}</Field>
                          <Field label={t('cab.certification.fields.clientName', 'Client name')}>{selected.clientName}</Field>
                          <Field label={t('cab.certification.fields.country', 'Country')}>{selected.country}</Field>
                          <Field label={t('cab.certification.fields.primaryContact', 'Primary contact')}>{selected.primaryContactName}</Field>
                          <Field label={t('cab.certification.fields.email', 'Email')}>{selected.primaryContactEmail}</Field>
                        </div>
                      </section>

                      {/* Upcoming activities */}
                      <section className="rounded-[16px] border border-[#ececec] bg-white p-5">
                        <div className="mb-3 flex items-center justify-between">
                          <h2 className="text-[16px] font-semibold text-neutral-900">
                            {t('cab.certification.upcomingActivitiesTitle', 'Upcoming activities')}
                          </h2>
                          <Button type="button" variant="tertiary" size="sm" className="h-auto p-0 text-[13px]">
                            {t('common.viewAll', 'View all')}
                          </Button>
                        </div>
                        {selected.upcomingActivities.length === 0 ? (
                          <p className="py-4 text-center text-[13px] text-neutral-400">
                            {t('cab.certification.noActivities', 'No upcoming activities.')}
                          </p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[420px] text-start">
                              <thead>
                                <tr className="border-b border-[#ececec] text-[12px] text-neutral-500">
                                  <th className="py-2 pe-2 text-start font-medium">{t('cab.certification.table.date', 'Date')}</th>
                                  <th className="py-2 pe-2 text-start font-medium">{t('cab.certification.table.activity', 'Activity')}</th>
                                  <th className="py-2 pe-2 text-start font-medium">{t('cab.certification.table.type', 'Type')}</th>
                                  <th className="py-2 ps-2 text-start font-medium">{t('cab.certification.table.status', 'Status')}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#f0f0f0]">
                                {selected.upcomingActivities.map((activity) => (
                                  <tr key={activity.id} className="text-[13px] text-neutral-700">
                                    <td className="py-2.5 pe-2 whitespace-nowrap">{activity.date}</td>
                                    <td className="py-2.5 pe-2">{activity.activity}</td>
                                    <td className="py-2.5 pe-2">{activity.type}</td>
                                    <td className="py-2.5 ps-2">
                                      <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium', ACTIVITY_STATUS_STYLES[activity.status])}>
                                        {activity.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </section>
                    </div>
                  </>
                ) : (
                  <section className="flex min-h-40 flex-col items-center justify-center rounded-[16px] border border-dashed border-neutral-200 bg-white px-6 text-center">
                    <p className="text-[14px] font-semibold text-neutral-900">{tabLabels[tab]}</p>
                    <p className="mt-1 text-[13px] text-neutral-500">
                      {t('cab.certification.tabComingSoon', 'This section is coming soon.')}
                    </p>
                  </section>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </CabLayout>
  )
}