import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { TableFilterSelect } from '@/components/dashboard/TableFilterSelect'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useAuditScheduleTourSteps } from '@/config/auditScheduleTourSteps'
import { AppIcon, DownloadTrayIcon } from '@/components/icons'
import {
  fetchAuditPlans,
  saveAuditPlan,
  exportAuditPlansToFormat,
  type AuditPlan,
} from '@/lib/api/cabAuditPlanningApi'
import { cn } from '@/lib/utils'

export function CabAuditSchedulePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tourSteps = useAuditScheduleTourSteps()

  // View mode: 'list' | 'calendar'
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  // Filter state
  const [searchInput, setSearchInput] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('October 2026')
  const [selectedCountry, setSelectedCountry] = useState('Saudi Arabia')
  const [selectedStatus, setSelectedStatus] = useState('All')

  // Applied filter state
  const [appliedFilters, setAppliedFilters] = useState<{
    search: string
    period: string
    country: string
    status: string
  }>({
    search: '',
    period: 'October 2026',
    country: 'Saudi Arabia',
    status: 'All',
  })

  const [auditPlans, setAuditPlans] = useState<AuditPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [page, setPage] = useState(1)

  // Create plan modal form state
  const [newClientCode, setNewClientCode] = useState('CL-0001')
  const [newStage, setNewStage] = useState<'Stage 1' | 'Stage 2' | 'Surveillance 1'>('Stage 1')
  const [newStandard, setNewStandard] = useState('Food Safety Management (ISO 22000)')
  const [newStartDate, setNewStartDate] = useState('2026-10-12')
  const [newEndDate, setNewEndDate] = useState('2026-10-16')
  const [newLeadAuditor, setNewLeadAuditor] = useState('Alex Morgan')

  const clientsList = [
    { code: 'CL-0001', name: 'Al Noor Food Industries', country: 'Saudi Arabia', site: 'SITE-001 - Riyadh' },
    { code: 'CLT-2025-0148', name: 'GreenLeaf Pvt. Ltd.', country: 'United Arab Emirates', site: 'SITE-002 - Dubai' },
    { code: 'CL-0019', name: 'Apex Health Systems', country: 'Egypt', site: 'SITE-003 - Cairo' },
  ]

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await fetchAuditPlans({
        search: appliedFilters.search,
        country: appliedFilters.country,
        status: appliedFilters.status,
      })
      setAuditPlans(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [appliedFilters])

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setPage(1)
    setAppliedFilters({
      search: searchInput,
      period: selectedPeriod,
      country: selectedCountry,
      status: selectedStatus,
    })
  }

  const handleClear = () => {
    setSearchInput('')
    setSelectedPeriod('All')
    setSelectedCountry('All')
    setSelectedStatus('All')
    setPage(1)
    setAppliedFilters({
      search: '',
      period: 'All',
      country: 'All',
      status: 'All',
    })
  }

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    const client = clientsList.find((c) => c.code === newClientCode) || clientsList[0]
    const created = await saveAuditPlan({
      clientName: client.name,
      clientCode: client.code,
      country: client.country,
      stage: newStage,
      standardName: newStandard,
      proposedStartDate: newStartDate,
      proposedEndDate: newEndDate,
      leadAuditor: newLeadAuditor,
      auditTeam: [newLeadAuditor],
      siteName: client.site,
      status: 'Draft',
    })
    setIsCreateModalOpen(false)
    navigate(`/cab/audit-planning/build/${created.planNumber}`)
  }

  // Calendar days generation
  const calendarDays = useMemo(() => {
    const days = []
    for (let i = 1; i <= 31; i++) {
      const dayStr = i < 10 ? `0${i}` : `${i}`
      const fullDate = `2026-10-${dayStr}`
      const matchedAudits = auditPlans.filter(
        (p) => fullDate >= p.proposedStartDate && fullDate <= p.proposedEndDate
      )
      days.push({ dayNumber: i, dateStr: fullDate, audits: matchedAudits })
    }
    return days
  }, [auditPlans])

  return (
    <CabLayout sidebarVariant="auditPlanning" tourId="audit-schedule-tour" tourSteps={tourSteps}>
      <CabHeader
        title={t('cab.sidebar.auditSchedule', 'Audit schedule')}
        notificationCount={3}
      />

      <main className="flex flex-1 flex-col gap-5 overflow-auto p-3 sm:p-5">
        {/* Page Header & View Toggles */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CabTourStep steps={tourSteps} stepId="audit-schedule-header">
            <div>
              <nav className="mb-1 flex items-center gap-2 text-[13px] text-neutral-400">
                <span className="font-medium text-neutral-500">
                  {t('cab.sidebar.auditPlanning', 'Audit Planning')}
                </span>
                <span>›</span>
                <span className="font-semibold text-primary">
                  {t('cab.sidebar.auditSchedule', 'Audit schedule')}
                </span>
              </nav>
              <h1 className="text-[20px] font-bold tracking-tight text-neutral-900">
                {t('cab.sidebar.auditSchedule', 'Audit schedule')}
              </h1>
              <p className="mt-1 text-[13px] text-neutral-500">
                {t('cab.auditSchedule.subtitle', 'Plan and manage audits across clients and sites.')}
              </p>
            </div>
          </CabTourStep>

          {/* List View / Calendar View toggle */}
          <CabTourStep steps={tourSteps} stepId="audit-schedule-view-toggle">
            <div className="inline-flex h-11 items-center rounded-[8px] border border-[#e2e2e2] bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn(
                  'inline-flex h-9 items-center gap-2 rounded-[6px] px-3.5 text-[13px] font-medium transition-all',
                  viewMode === 'list'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                )}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                <span>{t('cab.auditSchedule.listView', 'List view')}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={cn(
                  'inline-flex h-9 items-center gap-2 rounded-[6px] px-3.5 text-[13px] font-medium transition-all',
                  viewMode === 'calendar'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                )}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>{t('cab.auditSchedule.calendarView', 'Calendar view')}</span>
              </button>
            </div>
          </CabTourStep>
        </div>

        {/* Filter Toolbar matching DashboardTasks / Contacts standard */}
        <CabTourStep steps={tourSteps} stepId="audit-schedule-filters">
          <section className="rounded-[12px] border border-[#e2e2e2] bg-white p-3 shadow-none">
            <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
              {/* Search audit or client */}
              <div className="relative min-w-[200px] flex-1">
                <svg
                  className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-neutral-400"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t('cab.auditSchedule.filters.search', 'Search audit or client')}
                  className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white pe-8 ps-9 text-[14px] text-neutral-800 placeholder:text-neutral-400 focus:border-[#1236a3] focus:outline-none focus:ring-1 focus:ring-[#1236a3]"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Planned period */}
              <TableFilterSelect
                label={t('cab.auditSchedule.filters.period', 'Planned period')}
                value={selectedPeriod}
                onChange={setSelectedPeriod}
                options={[
                  { value: 'All', label: t('cab.auditSchedule.filters.allPeriods', 'All periods') },
                  { value: 'October 2026', label: 'October 2026' },
                  { value: 'November 2026', label: 'November 2026' },
                  { value: 'May 2025', label: 'May 2025' },
                ]}
                aria-label={t('cab.auditSchedule.filters.period', 'Planned period')}
                className="min-w-[150px]"
              />

              {/* Country */}
              <TableFilterSelect
                label={t('cab.auditSchedule.filters.country', 'Country')}
                value={selectedCountry}
                onChange={setSelectedCountry}
                options={[
                  { value: 'All', label: t('cab.auditSchedule.filters.allCountries', 'All countries') },
                  { value: 'Saudi Arabia', label: 'Saudi Arabia' },
                  { value: 'United Arab Emirates', label: 'United Arab Emirates' },
                  { value: 'Egypt', label: 'Egypt' },
                ]}
                aria-label={t('cab.auditSchedule.filters.country', 'Country')}
                className="min-w-[140px]"
              />

              {/* Status */}
              <TableFilterSelect
                label={t('cab.auditSchedule.filters.status', 'Status')}
                value={selectedStatus}
                onChange={setSelectedStatus}
                options={[
                  { value: 'All', label: t('cab.auditSchedule.filters.allStatuses', 'All statuses') },
                  { value: 'Planned', label: 'Planned' },
                  { value: 'Draft', label: 'Draft' },
                  { value: 'In progress', label: 'In progress' },
                  { value: 'Completed', label: 'Completed' },
                ]}
                aria-label={t('cab.auditSchedule.filters.status', 'Status')}
                className="min-w-[140px]"
              />

              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-[8px] bg-[#1236a3] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#0e2a80]"
              >
                {t('common.search', 'Search')}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex h-11 items-center justify-center rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                {t('common.clear', 'Clear')}
              </button>
            </form>
          </section>
        </CabTourStep>

        {/* Action Header bar: Count & Buttons */}
        <section className="flex flex-col rounded-[12px] border border-[#e2e2e2] bg-white py-4 shadow-none">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4">
            <div>
              <h2 className="text-[20px] font-bold text-neutral-900">
                {t('cab.sidebar.auditSchedule', 'Audit schedule')}
              </h2>
              <p className="text-[13px] text-neutral-500">
                {auditPlans.length} {t('cab.auditSchedule.auditsFound', 'audit found')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <CabTourStep steps={tourSteps} stepId="audit-schedule-create-btn">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-[#1236a3] px-4 text-[14px] font-medium text-white hover:bg-[#0e2a80] transition-all active:scale-[0.98] whitespace-nowrap"
                >
                  <span className="text-[16px] leading-none">+</span>
                  <span>{t('cab.auditSchedule.createPlan', 'Create plan')}</span>
                </button>
              </CabTourStep>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setExportMenuOpen((prev) => !prev)}
                  className="inline-flex h-11 items-center gap-2 rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] font-medium text-neutral-700 transition hover:bg-neutral-50 whitespace-nowrap"
                >
                  <AppIcon icon={DownloadTrayIcon} size={18} />
                  <span>{t('common.export', 'Export')}</span>
                  <span className="text-[10px] text-neutral-400">▼</span>
                </button>

                {exportMenuOpen && (
                  <div className="absolute end-0 mt-1.5 w-44 rounded-[8px] border border-[#e2e2e2] bg-white py-1.5 shadow-xl z-20">
                    <button
                      type="button"
                      onClick={() => {
                        exportAuditPlansToFormat(auditPlans, 'csv')
                        setExportMenuOpen(false)
                      }}
                      className="w-full text-start px-4 py-2 text-[13px] text-neutral-700 hover:bg-neutral-50 font-medium"
                    >
                      {t('cab.auditSchedule.export.csv', 'Export as CSV')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportAuditPlansToFormat(auditPlans, 'excel')
                        setExportMenuOpen(false)
                      }}
                      className="w-full text-start px-4 py-2 text-[13px] text-neutral-700 hover:bg-neutral-50 font-medium"
                    >
                      {t('cab.auditSchedule.export.excel', 'Export as Excel')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportAuditPlansToFormat(auditPlans, 'json')
                        setExportMenuOpen(false)
                      }}
                      className="w-full text-start px-4 py-2 text-[13px] text-neutral-700 hover:bg-neutral-50 font-medium"
                    >
                      {t('cab.auditSchedule.export.json', 'Export as JSON')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* View Mode: List View or Calendar View */}
          <CabTourStep steps={tourSteps} stepId="audit-schedule-table">
            {viewMode === 'list' ? (
              <>
                {/* Desktop Table View */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full border-collapse text-center">
                    <thead>
                      <tr className="bg-[#1236a3] text-white">
                        <th className="p-[18px] text-start text-[14px] font-medium">{t('cab.auditSchedule.columns.audit', 'Audit')}</th>
                        <th className="p-[18px] text-start text-[14px] font-medium">{t('cab.auditSchedule.columns.client', 'Client')}</th>
                        <th className="p-[18px] text-center text-[14px] font-medium">{t('cab.auditSchedule.columns.sites', 'Sites')}</th>
                        <th className="p-[18px] text-center text-[14px] font-medium">{t('cab.auditSchedule.columns.dates', 'Dates')}</th>
                        <th className="p-[18px] text-center text-[14px] font-medium">{t('cab.auditSchedule.columns.leadAuditor', 'Lead auditor')}</th>
                        <th className="p-[18px] text-center text-[14px] font-medium">{t('cab.auditSchedule.columns.status', 'Status')}</th>
                        <th className="p-[18px] text-end text-[14px] font-medium">{t('common.actions', 'Actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-neutral-500 text-[14px]">
                            {t('cab.auditSchedule.loading', 'Loading audits...')}
                          </td>
                        </tr>
                      ) : auditPlans.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                            <p className="font-semibold text-neutral-700 text-[15px]">{t('cab.auditSchedule.noAudits', 'No audits found')}</p>
                            <p className="text-[13px] text-neutral-400 mt-1">{t('cab.auditSchedule.noAuditsDesc', 'Try adjusting your filters or search term.')}</p>
                          </td>
                        </tr>
                      ) : (
                        auditPlans.map((plan, index) => (
                          <tr
                            key={plan.id}
                            className={cn(
                              'hover:bg-[#e8edfc]/50 transition-colors',
                              index % 2 === 1 ? 'bg-[#f9fafc]' : ''
                            )}
                          >
                            {/* Audit code & Standard */}
                            <td className="px-4 py-3.5 text-start">
                              <button
                                type="button"
                                onClick={() => navigate(`/cab/audit-planning/build/${plan.planNumber}`)}
                                className="text-[15px] font-bold text-primary hover:underline"
                              >
                                {plan.planNumber}
                              </button>
                              <p className="text-[13px] text-neutral-500 mt-0.5">{plan.standardName}</p>
                            </td>

                            {/* Client info */}
                            <td className="px-4 py-3.5 text-start">
                              <p className="text-[15px] font-medium text-neutral-900">{plan.clientName}</p>
                              <p className="text-[13px] text-neutral-500 font-mono mt-0.5">
                                {plan.clientCode} · {plan.country}
                              </p>
                            </td>

                            {/* Sites */}
                            <td className="px-4 py-3.5 text-center">
                              <p className="text-[14px] font-medium text-neutral-800">1 {t('cab.auditSchedule.site', 'site')}</p>
                              <p className="text-[13px] text-neutral-400 mt-0.5">{plan.siteName}</p>
                            </td>

                            {/* Dates */}
                            <td className="px-4 py-3.5 text-center">
                              <p className="text-[14px] font-medium text-neutral-900">
                                {plan.proposedStartDate} – {plan.proposedEndDate}
                              </p>
                              <p className="text-[13px] text-neutral-400 mt-0.5">{plan.durationDays} {t('cab.auditSchedule.days', 'days')}</p>
                            </td>

                            {/* Lead auditor */}
                            <td className="px-4 py-3.5 text-center">
                              <p className="text-[14px] font-medium text-neutral-800">{plan.leadAuditor}</p>
                            </td>

                            {/* Status badge */}
                            <td className="px-4 py-3.5 text-center">
                              <span
                                className={cn(
                                  'inline-flex items-center justify-center rounded-[4px] px-3 py-1 text-[12px] font-medium whitespace-nowrap',
                                  plan.status === 'Planned' && 'bg-[#e8edfc] text-primary',
                                  plan.status === 'Completed' && 'bg-[#ecfdf5] text-[#16a34a]',
                                  (plan.status === 'Draft' || plan.status === 'In progress') && 'bg-[#fff7ed] text-[#ea580c]'
                                )}
                              >
                                {plan.status}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3.5 text-end relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenActionMenuId(openActionMenuId === plan.id ? null : plan.id)
                                }
                                className="inline-flex size-8 items-center justify-center rounded-[8px] text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                              >
                                ⋮
                              </button>

                              {openActionMenuId === plan.id && (
                                <div className="absolute end-4 top-12 w-48 rounded-[8px] border border-[#e2e2e2] bg-white py-1.5 shadow-xl z-20 text-start">
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/cab/audit-planning/build/${plan.planNumber}`)}
                                    className="w-full px-4 py-2 text-[13px] text-neutral-700 hover:bg-neutral-50 font-medium"
                                  >
                                    {t('cab.auditSchedule.actions.buildEdit', 'Build / Edit Plan')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/cab/audit-planning/build/${plan.planNumber}?tab=agenda`)}
                                    className="w-full px-4 py-2 text-[13px] text-neutral-700 hover:bg-neutral-50 font-medium"
                                  >
                                    {t('cab.auditSchedule.actions.viewAgenda', 'View Agenda')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      exportAuditPlansToFormat([plan], 'csv')
                                      setOpenActionMenuId(null)
                                    }}
                                    className="w-full px-4 py-2 text-[13px] text-neutral-700 hover:bg-neutral-50 font-medium"
                                  >
                                    {t('cab.auditSchedule.actions.exportPlan', 'Export Plan')}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="space-y-3 px-4 md:hidden">
                  {!isLoading &&
                    auditPlans.map((plan) => (
                      <div
                        key={plan.id}
                        onClick={() => navigate(`/cab/audit-planning/build/${plan.planNumber}`)}
                        className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-4 text-start space-y-2 cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[15px] font-bold text-primary">{plan.planNumber}</span>
                          <span
                            className={cn(
                              'inline-flex items-center justify-center rounded-[4px] px-3 py-1 text-[12px] font-medium whitespace-nowrap',
                              plan.status === 'Planned' && 'bg-[#e8edfc] text-primary',
                              plan.status === 'Completed' && 'bg-[#ecfdf5] text-[#16a34a]',
                              (plan.status === 'Draft' || plan.status === 'In progress') && 'bg-[#fff7ed] text-[#ea580c]'
                            )}
                          >
                            {plan.status}
                          </span>
                        </div>
                        <p className="text-[15px] font-medium text-neutral-900">{plan.clientName}</p>
                        <p className="text-[13px] text-neutral-500">{plan.standardName}</p>
                        <div className="flex items-center justify-between text-[13px] text-neutral-500 pt-1 border-t border-neutral-100">
                          <span>{plan.proposedStartDate} – {plan.proposedEndDate}</span>
                          <span className="font-medium text-neutral-700">{plan.leadAuditor}</span>
                        </div>
                      </div>
                    ))}
                  {isLoading && <p className="py-6 text-center text-neutral-500">{t('cab.auditSchedule.loading', 'Loading audits...')}</p>}
                  {!isLoading && !auditPlans.length && (
                    <p className="py-6 text-center text-neutral-500">{t('cab.auditSchedule.noAudits', 'No audits found')}</p>
                  )}
                </div>

                {/* Table Pagination */}
                <TablePagination
                  page={page}
                  totalPages={1}
                  onPageChange={(nextPage) => setPage(nextPage)}
                  className="mt-5 px-4"
                />
              </>
            ) : (
              /* Calendar View Grid */
              <div className="px-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[16px] font-bold text-neutral-900">October 2026</h3>
                  <p className="text-[13px] text-neutral-500">{t('cab.auditSchedule.timezone', 'Timezone: Asia/Riyadh (AST)')}</p>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-[12px] font-semibold text-neutral-400 mb-2">
                  <div>{t('cab.auditSchedule.daysOfWeek.sun', 'Sun')}</div>
                  <div>{t('cab.auditSchedule.daysOfWeek.mon', 'Mon')}</div>
                  <div>{t('cab.auditSchedule.daysOfWeek.tue', 'Tue')}</div>
                  <div>{t('cab.auditSchedule.daysOfWeek.wed', 'Wed')}</div>
                  <div>{t('cab.auditSchedule.daysOfWeek.thu', 'Thu')}</div>
                  <div>{t('cab.auditSchedule.daysOfWeek.fri', 'Fri')}</div>
                  <div>{t('cab.auditSchedule.daysOfWeek.sat', 'Sat')}</div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((d) => (
                    <div
                      key={d.dayNumber}
                      className={cn(
                        'min-h-[90px] rounded-[8px] border p-2 text-start transition-all',
                        d.audits.length > 0
                          ? 'border-[#c7d7fa] bg-[#f8fafd]'
                          : 'border-[#e2e2e2] bg-white hover:border-neutral-300'
                      )}
                    >
                      <span className="text-[12px] font-semibold text-neutral-600 block mb-1">
                        {d.dayNumber}
                      </span>
                      {d.audits.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => navigate(`/cab/audit-planning/build/${a.planNumber}`)}
                          className="w-full text-start rounded-[6px] bg-primary px-1.5 py-1 text-[11px] font-bold text-white truncate mb-1 shadow-xs hover:bg-primary/90"
                        >
                          {a.planNumber} • {a.clientName.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CabTourStep>
        </section>
      </main>

      {/* Create Plan Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-[12px] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
              <h3 className="text-[16px] font-bold text-neutral-900">
                {t('cab.auditSchedule.createNewPlan', 'Create new audit plan')}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 text-[20px] font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="text-[13px] font-medium text-neutral-800 block mb-1">
                  {t('cab.auditSchedule.client', 'Client')} *
                </label>
                <select
                  value={newClientCode}
                  onChange={(e) => setNewClientCode(e.target.value)}
                  className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  {clientsList.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.name} ({c.country})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-medium text-neutral-800 block mb-1">
                    {t('cab.auditSchedule.auditStage', 'Audit stage')} *
                  </label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value as any)}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Stage 1">Stage 1</option>
                    <option value="Stage 2">Stage 2</option>
                    <option value="Surveillance 1">Surveillance 1</option>
                  </select>
                </div>

                <div>
                  <label className="text-[13px] font-medium text-neutral-800 block mb-1">
                    {t('cab.auditSchedule.leadAuditor', 'Lead auditor')} *
                  </label>
                  <select
                    value={newLeadAuditor}
                    onChange={(e) => setNewLeadAuditor(e.target.value)}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Alex Morgan">Alex Morgan (Lead)</option>
                    <option value="Ahmed Khan">Ahmed Khan</option>
                    <option value="Layla Al-Khatib">Layla Al-Khatib</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium text-neutral-800 block mb-1">
                  {t('cab.auditSchedule.standard', 'Standard')} *
                </label>
                <input
                  type="text"
                  value={newStandard}
                  onChange={(e) => setNewStandard(e.target.value)}
                  className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-medium text-neutral-800 block mb-1">
                    {t('cab.auditSchedule.startDate', 'Start date')} *
                  </label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-neutral-800 block mb-1">
                    {t('cab.auditSchedule.endDate', 'End date')} *
                  </label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="h-11 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="h-11 rounded-[8px] bg-primary px-5 text-[14px] font-semibold text-white hover:bg-primary/90"
                >
                  {t('common.proceed', 'Continue to build plan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CabLayout>
  )
}
