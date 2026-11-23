import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useAuditScheduleTourSteps } from '@/config/auditScheduleTourSteps'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Button } from '@/components/ui/Button'
import { ActionMenu, type ActionMenuItem } from '@/components/ui/ActionMenu'
import { CardFooterLink } from '@/components/ui/CardFooterLink'
import { ExportMenuButton } from '@/components/ui/ExportMenuButton'
import { SelectField } from '@/components/ui/Select'
import {
  AddCircleIcon,
  AppIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  DashboardIcon,
  DownloadTrayIcon,
  ExcelFileIcon,
  ExportIcon,
  FileTextIcon,
  HistoryIcon,
  MenuRowsIcon,
  SearchIcon,
  SuccessCircleIcon,
} from '@/components/icons'
import {
  fetchAuditPlans,
  exportAuditPlansToFormat,
  type AuditPlan,
  type AuditPlanStatus,
} from '@/lib/api/cabAuditPlanningApi'
import { downloadExcelCsv, downloadPdfFromTable, type TableColumn } from '@/lib/tableTools'
import { AuditPlanLifecycleDialog } from '@/components/cab/auditPlanning/AuditPlanLifecycleDialog'
import {
  AuditStatusBadge,
  BreadcrumbChevron,
  formatIcascoDate,
} from '@/components/cab/auditPlanning/shared'
import { getLifecycleBlock, hasAuditReport, type LifecycleAction } from '@/lib/api/auditPlanLifecycleApi'
import {
  LIFECYCLE_ACTIONS,
  lifecycleActionLabel,
  lifecycleBlockMessage,
} from '@/lib/auditPlanLifecycleCopy'
import {
  buildCalendarMonth,
  collectCountries,
  collectPlannedPeriods,
  currentPeriod,
  formatPeriodLabel,
  localizeCountry,
  planOverlapsPeriod,
} from '@/lib/auditSchedule'
import { ROUTES, cabAuditExecutionPath, cabBuildAuditPlanPath } from '@/lib/routes'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

const WEEKDAYS = [
  { key: 'sun', label: 'Sun' },
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
] as const

const PIPELINE_STAGES: AuditPlanStatus[] = [
  'Draft',
  'Planned',
  'In progress',
  'Under review',
  'Completed',
]

export function CabAuditSchedulePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const tourSteps = useAuditScheduleTourSteps()

  const [topViewMode, setTopViewMode] = useState<'list' | 'calendar'>('list')
  const [subViewMode, setSubViewMode] = useState<'list' | 'pipeline'>('list')

  const [searchInput, setSearchInput] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('All')
  const [selectedCountry, setSelectedCountry] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')

  const [allPlans, setAllPlans] = useState<AuditPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [lifecycleTarget, setLifecycleTarget] = useState<{
    plan: AuditPlan
    action: LifecycleAction
  } | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setIsLoading(true)
    fetchAuditPlans()
      .then(setAllPlans)
      .finally(() => setIsLoading(false))
  }, [])

  const counts = useMemo(
    () => ({
      Draft: allPlans.filter((p) => p.status === 'Draft').length,
      Planned: allPlans.filter((p) => p.status === 'Planned').length,
      'In progress': allPlans.filter((p) => p.status === 'In progress').length,
      Completed: allPlans.filter((p) => p.status === 'Completed').length,
    }),
    [allPlans],
  )

  // Period and country options come from the plans themselves, never from a fixed list.
  const periodOptions = useMemo(
    () =>
      collectPlannedPeriods(allPlans).map((period) => ({
        value: period,
        label: formatPeriodLabel(period, i18n.language),
      })),
    [allPlans, i18n.language],
  )

  const countryOptions = useMemo(
    () =>
      collectCountries(allPlans).map((country) => ({
        value: country,
        label: localizeCountry(country, i18n.language),
      })),
    [allPlans, i18n.language],
  )

  const auditPlans = useMemo(() => {
    const q = searchInput.trim().toLowerCase()
    return allPlans.filter((p) => {
      if (selectedPeriod !== 'All' && !planOverlapsPeriod(p, selectedPeriod)) {
        return false
      }
      if (selectedCountry !== 'All' && p.country.toLowerCase() !== selectedCountry.toLowerCase()) {
        return false
      }
      if (selectedStatus !== 'All' && p.status.toLowerCase() !== selectedStatus.toLowerCase()) {
        return false
      }
      if (!q) return true
      return (
        p.planNumber.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.clientCode.toLowerCase().includes(q) ||
        p.leadAuditor.toLowerCase().includes(q) ||
        p.standardName.toLowerCase().includes(q) ||
        p.standards.some((s) => s.toLowerCase().includes(q))
      )
    })
  }, [allPlans, searchInput, selectedPeriod, selectedCountry, selectedStatus])

  const hasActiveFilters =
    searchInput.trim() !== '' ||
    selectedPeriod !== 'All' ||
    selectedCountry !== 'All' ||
    selectedStatus !== 'All'

  const handleClear = () => {
    setSearchInput('')
    setSelectedPeriod('All')
    setSelectedCountry('All')
    setSelectedStatus('All')
    setPage(1)
  }

  const exportColumns: TableColumn<AuditPlan>[] = [
    { header: 'Audit Plan', value: (row) => row.planNumber },
    { header: 'Client', value: (row) => `${row.clientName} (${row.clientCode})` },
    { header: 'Country', value: (row) => row.country },
    { header: 'Stage', value: (row) => row.stage },
    { header: 'Standards', value: (row) => row.standards.join(', ') },
    { header: 'Site', value: (row) => row.siteName },
    {
      header: 'Dates',
      value: (row) =>
        `${formatIcascoDate(row.proposedStartDate)} - ${formatIcascoDate(row.proposedEndDate)}`,
    },
    { header: 'Lead Auditor', value: (row) => row.leadAuditor },
    { header: 'Status', value: (row) => row.status },
  ]

  const handleExportExcel = () => {
    setExporting(true)
    try {
      downloadExcelCsv('audit-schedule.xlsx', exportColumns, auditPlans)
    } finally {
      setExporting(false)
    }
  }

  const handleExportPdf = () => {
    setExporting(true)
    try {
      downloadPdfFromTable(
        'audit-schedule.pdf',
        t('cab.sidebar.auditSchedule', 'Audit schedule'),
        exportColumns,
        auditPlans,
      )
    } finally {
      setExporting(false)
    }
  }

  // The calendar shows the selected period, or the current month when no period is selected.
  const calendarPeriod = selectedPeriod === 'All' ? currentPeriod() : selectedPeriod
  const calendarMonth = useMemo(
    () => buildCalendarMonth(calendarPeriod, auditPlans),
    [calendarPeriod, auditPlans],
  )

  /** Row actions: open / edit, lifecycle steps (disabled with a reason), report and export. */
  const getPlanActions = (plan: AuditPlan): ActionMenuItem[] => {
    const items: ActionMenuItem[] = [
      {
        key: 'edit',
        label: t('cab.auditSchedule.actions.buildEdit', 'Build / Edit Plan'),
        onSelect: () => navigate(cabBuildAuditPlanPath(plan.planNumber)),
      },
      {
        key: 'agenda',
        label: t('cab.auditSchedule.actions.viewAgenda', 'View Agenda'),
        onSelect: () => navigate(cabBuildAuditPlanPath(plan.planNumber, { tab: 'agenda' })),
      },
    ]

    // A draft is still being built: execution opens once the plan has left Draft.
    if (plan.status !== 'Draft') {
      items.push({
        key: 'execution',
        label:
          plan.status === 'Completed'
            ? t('cab.auditPlanning.lifecycle.viewExecution', 'View execution')
            : t('cab.auditPlanning.lifecycle.openExecution', 'Start / continue execution'),
        onSelect: () => navigate(cabAuditExecutionPath(plan.planNumber)),
      })
    }

    for (const action of LIFECYCLE_ACTIONS) {
      const block = getLifecycleBlock(plan, action)
      items.push({
        key: action,
        label: lifecycleActionLabel(t, action),
        disabled: Boolean(block),
        hint: block ? lifecycleBlockMessage(t, block) : undefined,
        onSelect: () => setLifecycleTarget({ plan, action }),
      })
    }

    if (hasAuditReport(plan)) {
      items.push({
        key: 'report',
        label: t('cab.auditPlanning.lifecycle.openReport', 'Open audit report'),
        onSelect: () => navigate(ROUTES.cabAuditWorkspace),
      })
    }

    items.push({
      key: 'export',
      label: t('cab.auditSchedule.actions.exportPlan', 'Export Plan'),
      onSelect: () => exportAuditPlansToFormat([plan], 'csv'),
    })

    return items
  }

  const kpiCards = [
    {
      key: 'Draft' as const,
      label: 'Draft plans',
      sub: 'In preparation & team setup',
      count: counts.Draft,
      icon: FileTextIcon,
      iconBg: 'bg-[#dbeafe]',
      iconColor: 'text-[#1447e6]',
    },
    {
      key: 'Planned' as const,
      label: 'Planned audits',
      sub: 'Confirmed & ready to start',
      count: counts.Planned,
      icon: HistoryIcon,
      iconBg: 'bg-[#fef3c6]',
      iconColor: 'text-[#b45309]',
    },
    {
      key: 'In progress' as const,
      label: 'In execution',
      sub: 'On-site checklists active',
      count: counts['In progress'],
      icon: CheckIcon,
      iconBg: 'bg-[#d7f4f0]',
      iconColor: 'text-[#0f9488]',
    },
    {
      key: 'Completed' as const,
      label: 'Completed audits',
      sub: 'Ready for decision handoff',
      count: counts.Completed,
      icon: SuccessCircleIcon,
      iconBg: 'bg-[#dcfce7]',
      iconColor: 'text-[#15803d]',
    },
  ]

  return (
    <CabLayout sidebarVariant="auditPlanning" tourId="audit-schedule-tour" tourSteps={tourSteps}>
      <CabHeader title={t('cab.sidebar.auditSchedule', 'Audit schedule')} notificationCount={4} />

      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        {/* iCASCO Breadcrumb */}
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]" aria-label="breadcrumb">
          <Link to={ROUTES.workspace} className="font-light text-neutral-400 hover:text-primary">
            {t('cab.workspace.appHub', 'Application Hub')}
          </Link>
          <BreadcrumbChevron />
          <span className="font-light text-neutral-400">
            {t('cab.sidebar.auditPlanning', 'Audit Planning')}
          </span>
          <BreadcrumbChevron />
          <span className="font-medium text-neutral-700">
            {t('cab.sidebar.auditSchedule', 'Audit schedule')}
          </span>
        </nav>

        {/* Page Header & Top Actions */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <CabTourStep steps={tourSteps} stepId="audit-schedule-header">
            <div className="min-w-0 flex-1">
              <h1 className="text-[28px] font-bold leading-tight text-neutral-900">
                {t('cab.sidebar.auditSchedule', 'Audit schedule')}
              </h1>
              <p className="mt-1 text-[14px] text-neutral-500">
                {t('cab.auditSchedule.subtitle', 'Plan and manage audits across clients and sites.')}
              </p>
            </div>
          </CabTourStep>

          <div className="flex flex-wrap items-center gap-3">
            <CabTourStep steps={tourSteps} stepId="audit-schedule-view-toggle">
              <div className="inline-flex h-11 items-center gap-1 rounded-[8px] border border-[#e2e2e2] bg-[#f9fafc] p-1">
                <button
                  type="button"
                  onClick={() => setTopViewMode('list')}
                  className={cn(
                    'inline-flex h-full items-center gap-2 rounded-[6px] px-3.5 text-[13px] font-medium transition-colors',
                    topViewMode === 'list'
                      ? 'bg-[#1236a3] text-white shadow-xs'
                      : 'text-neutral-600 hover:bg-white hover:text-neutral-900',
                  )}
                >
                  <AppIcon icon={MenuRowsIcon} size={15} />
                  <span>{t('cab.auditSchedule.listView', 'List view')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTopViewMode('calendar')}
                  className={cn(
                    'inline-flex h-full items-center gap-2 rounded-[6px] px-3.5 text-[13px] font-medium transition-colors',
                    topViewMode === 'calendar'
                      ? 'bg-[#1236a3] text-white shadow-xs'
                      : 'text-neutral-600 hover:bg-white hover:text-neutral-900',
                  )}
                >
                  <CalendarIcon className="size-4" />
                  <span>{t('cab.auditSchedule.calendarView', 'Calendar view')}</span>
                </button>
              </div>
            </CabTourStep>

            <CabTourStep steps={tourSteps} stepId="audit-schedule-create-btn">
              <Button
                type="button"
                variant="primary"
                onClick={() => navigate(ROUTES.cabAuditPlanNew)}
                icon={<AppIcon icon={AddCircleIcon} size={20} />}
                className="whitespace-nowrap"
              >
                {t('cab.auditSchedule.createPlan', 'Create plan')}
              </Button>
            </CabTourStep>
          </div>
        </div>

        {/* 4 iCASCO KPI Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((card) => {
            const isSelected = selectedStatus === card.key
            return (
              <div
                key={card.key}
                className={cn(
                  'flex flex-col gap-3 rounded-[16px] border bg-white p-4 transition-all',
                  isSelected ? 'border-primary ring-1 ring-primary/20' : 'border-[#ececec]',
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-medium text-neutral-700">{card.label}</p>
                  <span
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-[10px]',
                      card.iconBg,
                    )}
                  >
                    <AppIcon icon={card.icon} size={20} className={card.iconColor} />
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[26px] font-bold leading-none text-neutral-900">
                    {card.count}
                  </span>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <span className="text-[12px] text-neutral-500">{card.sub}</span>
                  <CardFooterLink
                    label={isSelected ? 'Show all' : 'Filter'}
                    onClick={() => setSelectedStatus(isSelected ? 'All' : card.key)}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Separate iCASCO Filters Card */}
        <CabTourStep steps={tourSteps} stepId="audit-schedule-filters">
          <section className="rounded-[16px] border border-[#ececec] bg-white p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto_auto] lg:items-end">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="audit-schedule-search"
                  className="text-[13px] font-semibold text-neutral-700"
                >
                  {t('cab.auditSchedule.filters.search', 'Search audit or client')}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400">
                    <AppIcon icon={SearchIcon} size={18} />
                  </span>
                  <input
                    id="audit-schedule-search"
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={t(
                      'cab.auditSchedule.filters.search',
                      'Search audit, client or standard...',
                    )}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white ps-10 pe-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-neutral-700">
                  {t('cab.auditSchedule.filters.period', 'Planned period')}
                </span>
                <SelectField
                  value={selectedPeriod}
                  onChange={setSelectedPeriod}
                  className="h-11"
                  options={[
                    { value: 'All', label: t('cab.auditSchedule.filters.allPeriods', 'All periods') },
                    ...periodOptions,
                  ]}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-neutral-700">
                  {t('cab.auditSchedule.filters.country', 'Country')}
                </span>
                <SelectField
                  value={selectedCountry}
                  onChange={setSelectedCountry}
                  className="h-11"
                  options={[
                    { value: 'All', label: t('cab.auditSchedule.filters.allCountries', 'All countries') },
                    ...countryOptions,
                  ]}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-neutral-700">Status</span>
                <SelectField
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  className="h-11"
                  options={[
                    { value: 'All', label: 'All statuses' },
                    { value: 'Draft', label: 'Draft' },
                    { value: 'Planned', label: 'Planned' },
                    { value: 'In progress', label: 'In progress' },
                    { value: 'Under review', label: 'Under review' },
                    { value: 'Completed', label: 'Completed' },
                  ]}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-neutral-700">View</span>
                <div className="inline-flex h-11 items-center gap-1 rounded-[8px] border border-[#e2e2e2] bg-[#f9fafc] p-1">
                  {(['list', 'pipeline'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setTopViewMode('list')
                        setSubViewMode(mode)
                      }}
                      className={cn(
                        'inline-flex h-full items-center gap-2 rounded-[6px] px-3.5 text-[13px] font-medium transition-colors',
                        subViewMode === mode && topViewMode === 'list'
                          ? 'bg-[#1236a3] text-white shadow-xs'
                          : 'text-neutral-600 hover:bg-white hover:text-neutral-900',
                      )}
                    >
                      <AppIcon icon={mode === 'list' ? MenuRowsIcon : DashboardIcon} size={15} />
                      <span className="capitalize">{mode}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-end justify-start lg:justify-end">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!hasActiveFilters}
                  className="h-11 whitespace-nowrap text-[14px] font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-neutral-300 disabled:no-underline"
                >
                  Clear filters
                </button>
              </div>
            </div>
          </section>
        </CabTourStep>

        {/* Main Table / Pipeline / Calendar Card */}
        <section className="flex flex-col rounded-[16px] border border-[#ececec] bg-white py-5">
          <div className="mb-4 flex flex-col justify-between gap-3 px-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-[18px] font-bold text-neutral-900">
                {t('cab.sidebar.auditSchedule', 'Audit schedule')}
              </h2>
              <p className="text-[13px] text-neutral-500">
                Showing {auditPlans.length} audit(s)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* iCASCO Import DropdownMenu */}
              <DropdownMenu.Root modal={false}>
                <DropdownMenu.Trigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    icon={<AppIcon icon={ExportIcon} size={20} />}
                  >
                    {t('common.import', 'Import')}
                    <AppIcon icon={ChevronDownIcon} size={16} />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={4}
                    className="z-50 min-w-[220px] rounded-[8px] border border-[#e2e2e2] bg-white p-1 shadow-lg"
                  >
                    <DropdownMenu.Item
                      onSelect={() => {
                        toast.success('Import template downloaded (Excel/CSV).')
                      }}
                      className="flex cursor-pointer select-none items-center gap-2 rounded-[6px] px-3 py-2.5 text-[13px] font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                    >
                      <AppIcon icon={DownloadTrayIcon} size={18} />
                      Download Excel template
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onSelect={() => {
                        toast.success('Audit schedule import ready.')
                      }}
                      className="flex cursor-pointer select-none items-center gap-2 rounded-[6px] px-3 py-2.5 text-[13px] font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                    >
                      <AppIcon icon={ExcelFileIcon} size={18} />
                      Import from Excel / CSV
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>

              {/* Official iCASCO ExportMenuButton (PDF + Excel with colored file icons) */}
              <ExportMenuButton
                exporting={exporting}
                disabled={auditPlans.length === 0}
                onExportExcel={handleExportExcel}
                onExportPdf={handleExportPdf}
              />
            </div>
          </div>

          <CabTourStep steps={tourSteps} stepId="audit-schedule-table">
            {topViewMode === 'calendar' ? (
              <div className="px-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[16px] font-bold text-neutral-900">
                    {formatPeriodLabel(calendarPeriod, i18n.language)}
                  </h3>
                  <p className="text-[13px] text-neutral-500">
                    {t('cab.auditSchedule.timezone', 'Timezone: Asia/Riyadh (AST)')}
                  </p>
                </div>

                <div className="mb-2 grid grid-cols-7 gap-2 text-center text-[12px] font-semibold text-neutral-400">
                  {WEEKDAYS.map((day) => (
                    <div key={day.key}>{t(`cab.auditSchedule.daysOfWeek.${day.key}`, day.label)}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: calendarMonth.leadingBlanks }, (_, index) => (
                    <div key={`blank-${index}`} aria-hidden="true" />
                  ))}
                  {calendarMonth.days.map((d) => (
                    <div
                      key={d.dayNumber}
                      className={cn(
                        'min-h-[90px] rounded-[10px] border p-2 text-start transition-all',
                        d.audits.length > 0
                          ? 'border-[#c7d7fa] bg-[#f8fafd]'
                          : 'border-[#ececec] bg-white hover:border-neutral-300',
                      )}
                    >
                      <span className="mb-1 block text-[12px] font-semibold text-neutral-600">
                        {d.dayNumber}
                      </span>
                      {d.audits.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => navigate(cabBuildAuditPlanPath(a.planNumber))}
                          className="mb-1 w-full truncate rounded-[6px] bg-[#1236a3] px-1.5 py-1 text-start text-[11px] font-bold text-white shadow-xs hover:bg-[#0e2a80]"
                        >
                          {a.planNumber} • {a.clientName}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : subViewMode === 'pipeline' ? (
              <div className="grid grid-cols-1 gap-4 px-5 md:grid-cols-3 xl:grid-cols-5">
                {PIPELINE_STAGES.map((stage) => {
                  const stagePlans = auditPlans.filter((p) => p.status === stage)
                  return (
                    <div
                      key={stage}
                      className="flex flex-col rounded-[16px] border border-[#ececec] bg-white p-4"
                    >
                      <div className="mb-3 flex items-center justify-between border-b border-[#f0f0f0] pb-3">
                        <span className="text-[14px] font-bold text-neutral-900">{stage}</span>
                        <span className="rounded-[4px] bg-[#e8edfc] px-2.5 py-0.5 text-[12px] font-bold text-primary">
                          {stagePlans.length}
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {stagePlans.map((plan) => (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => navigate(cabBuildAuditPlanPath(plan.planNumber))}
                            className="flex w-full flex-col items-start rounded-[12px] border border-[#ececec] bg-[#f9fafc] p-3.5 text-start transition-all hover:border-primary hover:bg-white"
                          >
                            <div className="flex w-full items-center justify-between">
                              <span className="text-[13px] font-bold text-primary">
                                {plan.planNumber}
                              </span>
                              <span className="text-[11px] text-neutral-500">{plan.stage}</span>
                            </div>
                            <p className="mt-1.5 text-[14px] font-semibold text-neutral-900">
                              {plan.clientName}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {plan.standards.map((std) => (
                                <span
                                  key={std}
                                  className="rounded-[4px] bg-[#e8edfc] px-2 py-0.5 text-[10px] font-medium text-primary"
                                >
                                  {std}
                                </span>
                              ))}
                            </div>
                            <div className="mt-3 flex w-full items-center justify-between border-t border-[#ececec] pt-2 text-[11px] text-neutral-500">
                              <span dir="ltr">{formatIcascoDate(plan.proposedStartDate)}</span>
                              <span className="font-medium text-neutral-700">{plan.leadAuditor}</span>
                            </div>
                          </button>
                        ))}
                        {stagePlans.length === 0 && (
                          <div className="rounded-[10px] border border-dashed border-[#e2e2e2] py-8 text-center text-[12px] text-neutral-400">
                            No audits
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px] border-collapse text-center">
                    <thead>
                      <tr className="bg-[#1236a3] text-white">
                        <th className="px-5 py-4 text-start text-[14px] font-medium">Audit</th>
                        <th className="px-4 py-4 text-start text-[14px] font-medium">Client</th>
                        <th className="px-4 py-4 text-center text-[14px] font-medium">Sites</th>
                        <th className="px-4 py-4 text-center text-[14px] font-medium">Dates</th>
                        <th className="px-4 py-4 text-center text-[14px] font-medium">
                          Lead auditor
                        </th>
                        <th className="px-4 py-4 text-center text-[14px] font-medium">Status</th>
                        <th className="px-5 py-4 text-end text-[14px] font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f0f0]">
                      {isLoading ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-[14px] text-neutral-500">
                            Loading audits...
                          </td>
                        </tr>
                      ) : auditPlans.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                            <p className="text-[15px] font-semibold text-neutral-700">
                              No audits found
                            </p>
                          </td>
                        </tr>
                      ) : (
                        auditPlans.map((plan, index) => (
                          <tr
                            key={plan.id}
                            className={cn(
                              'transition-colors hover:bg-[#e8edfc]/40',
                              index % 2 === 1 ? 'bg-[#f9fafc]' : 'bg-white',
                            )}
                          >
                            <td className="px-5 py-4 text-start">
                              <button
                                type="button"
                                onClick={() => navigate(cabBuildAuditPlanPath(plan.planNumber))}
                                className="text-[15px] font-bold text-primary hover:underline"
                              >
                                {plan.planNumber}
                              </button>
                              <p className="mt-0.5 text-[13px] text-neutral-500">
                                {plan.standardName}
                              </p>
                              {plan.standards?.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  {plan.standards.map((std) => (
                                    <span
                                      key={std}
                                      className="inline-flex items-center rounded-[4px] bg-[#e8edfc] px-2.5 py-0.5 text-[11px] font-medium text-primary"
                                    >
                                      {std}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-4 text-start">
                              <p className="text-[15px] font-medium text-neutral-900">
                                {plan.clientName}
                              </p>
                              <p className="mt-0.5 text-[12px] text-neutral-500">
                                {plan.clientCode} · {localizeCountry(plan.country, i18n.language)}
                              </p>
                            </td>

                            <td className="px-4 py-4 text-center">
                              <p className="text-[14px] font-medium text-neutral-800">1 site</p>
                              <p className="mt-0.5 text-[12px] text-neutral-500">{plan.siteName}</p>
                            </td>

                            <td className="px-4 py-4 text-center">
                              <p className="text-[14px] font-medium text-neutral-900" dir="ltr">
                                {formatIcascoDate(plan.proposedStartDate)} ·{' '}
                                {formatIcascoDate(plan.proposedEndDate)}
                              </p>
                              <p className="mt-0.5 text-[12px] text-neutral-500">
                                {plan.durationDays} days
                              </p>
                            </td>

                            <td className="px-4 py-4 text-center">
                              <p className="text-[14px] font-medium text-neutral-800">
                                {plan.leadAuditor}
                              </p>
                            </td>

                            <td className="px-4 py-4 text-center">
                              <AuditStatusBadge status={plan.status} />
                            </td>

                            <td className="px-5 py-4 text-end">
                              <ActionMenu
                                ariaLabel={t('cab.auditSchedule.actions.menu', {
                                  defaultValue: 'Actions for {{number}}',
                                  number: plan.planNumber,
                                })}
                                items={getPlanActions(plan)}
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <TablePagination
                  page={page}
                  totalPages={1}
                  onPageChange={(nextPage) => setPage(nextPage)}
                  className="mt-5 px-5"
                />
              </>
            )}
          </CabTourStep>
        </section>
      </main>

      <AuditPlanLifecycleDialog
        plan={lifecycleTarget?.plan ?? null}
        action={lifecycleTarget?.action ?? null}
        onClose={() => setLifecycleTarget(null)}
        onDone={(updated) =>
          setAllPlans((previous) => previous.map((plan) => (plan.id === updated.id ? updated : plan)))
        }
      />
    </CabLayout>
  )
}
