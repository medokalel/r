import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { TablePagination } from '@/components/dashboard/TablePagination'
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
    <CabLayout sidebarVariant="auditPlanning">
      <CabHeader
        title={t('cab.sidebar.auditSchedule', 'Audit schedule')}
        notificationCount={3}
      />

      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        {/* Page Header & View Toggles */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              {t('cab.sidebar.auditSchedule', 'Audit schedule')}
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {t('cab.auditSchedule.subtitle', 'Plan and manage audits across clients and sites.')}
            </p>
          </div>

          {/* List View / Calendar View toggle */}
          <div className="inline-flex items-center rounded-[10px] border border-[#d8dce5] bg-white p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'inline-flex items-center gap-2 rounded-[8px] px-3.5 py-1.5 text-[13px] font-semibold transition-all',
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
                'inline-flex items-center gap-2 rounded-[8px] px-3.5 py-1.5 text-[13px] font-semibold transition-all',
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
        </div>

        {/* Filter Card */}
        <div className="rounded-[16px] border border-[#ececec] bg-white p-5 shadow-none">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
            {/* Search audit or client */}
            <div className="lg:col-span-4 space-y-1.5">
              <label className="text-[13px] font-semibold text-neutral-800">
                {t('cab.auditSchedule.filters.search', 'Search audit or client')}
              </label>
              <div className="relative">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="absolute start-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="AUD-0024"
                  className="w-full rounded-[10px] border border-[#d8dce5] bg-white ps-10 pe-9 py-2 text-[14px] text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Planned period */}
            <div className="lg:col-span-3 space-y-1.5">
              <label className="text-[13px] font-semibold text-neutral-800">
                {t('cab.auditSchedule.filters.period', 'Planned period')}
              </label>
              <div className="relative">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full rounded-[10px] border border-[#d8dce5] bg-white px-3 py-2 text-[14px] text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="All">All periods</option>
                  <option value="October 2026">October 2026</option>
                  <option value="November 2026">November 2026</option>
                  <option value="May 2025">May 2025</option>
                </select>
              </div>
            </div>

            {/* Country */}
            <div className="lg:col-span-2 space-y-1.5">
              <label className="text-[13px] font-semibold text-neutral-800">
                {t('cab.auditSchedule.filters.country', 'Country')}
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full rounded-[10px] border border-[#d8dce5] bg-white px-3 py-2 text-[14px] text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="All">All</option>
                <option value="Saudi Arabia">Saudi Arabia</option>
                <option value="United Arab Emirates">United Arab Emirates</option>
                <option value="Egypt">Egypt</option>
              </select>
            </div>

            {/* Status */}
            <div className="lg:col-span-1 space-y-1.5">
              <label className="text-[13px] font-semibold text-neutral-800">
                {t('cab.auditSchedule.filters.status', 'Status')}
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-[10px] border border-[#d8dce5] bg-white px-2.5 py-2 text-[14px] text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="All">All</option>
                <option value="Planned">Planned</option>
                <option value="Draft">Draft</option>
                <option value="In progress">In progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Action buttons */}
            <div className="lg:col-span-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 rounded-[10px] border border-[#d8dce5] bg-white py-2 text-[14px] font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                {t('common.clear', 'Clear')}
              </button>
              <button
                type="submit"
                className="flex-1 rounded-[10px] bg-primary py-2 text-[14px] font-medium text-white transition hover:bg-primary/90"
              >
                {t('common.search', 'Search')}
              </button>
            </div>
          </form>
        </div>

        {/* Action Header bar: Count & Buttons */}
        <section className="flex flex-col rounded-[16px] border border-[#ececec] bg-white py-5 shadow-none">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5">
            <div>
              <h2 className="text-[20px] font-bold text-neutral-900">
                {t('cab.sidebar.auditSchedule', 'Audit schedule')}
              </h2>
              <p className="text-[13px] text-neutral-500">
                {auditPlans.length} {t('cab.auditSchedule.auditsFound', 'audit found')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-primary px-4 py-2.5 text-[14px] font-medium text-white hover:bg-primary/90 transition-all active:scale-[0.98]"
              >
                <span className="text-[16px] leading-none">+</span>
                <span>{t('cab.auditSchedule.createPlan', 'Create plan')}</span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setExportMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-[#d8dce5] bg-white px-3.5 py-2.5 text-[14px] font-medium text-neutral-700 transition hover:bg-neutral-50"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>{t('common.export', 'Export')}</span>
                  <span className="text-[10px] text-neutral-400">▼</span>
                </button>

                {exportMenuOpen && (
                  <div className="absolute end-0 mt-1.5 w-44 rounded-[12px] border border-[#ececec] bg-white py-1.5 shadow-xl z-20">
                    <button
                      type="button"
                      onClick={() => {
                        exportAuditPlansToFormat(auditPlans, 'csv')
                        setExportMenuOpen(false)
                      }}
                      className="w-full text-start px-4 py-2 text-[13px] text-neutral-700 hover:bg-neutral-50 font-medium"
                    >
                      Export as CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportAuditPlansToFormat(auditPlans, 'excel')
                        setExportMenuOpen(false)
                      }}
                      className="w-full text-start px-4 py-2 text-[13px] text-neutral-700 hover:bg-neutral-50 font-medium"
                    >
                      Export as Excel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportAuditPlansToFormat(auditPlans, 'json')
                        setExportMenuOpen(false)
                      }}
                      className="w-full text-start px-4 py-2 text-[13px] text-neutral-700 hover:bg-neutral-50 font-medium"
                    >
                      Export as JSON
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* View Mode: List View or Calendar View */}
          {viewMode === 'list' ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-center">
                  <thead>
                    <tr className="bg-[#1236a3] text-white">
                      <th className="px-4 py-4 text-start text-[14px] font-medium">{t('cab.auditSchedule.columns.audit', 'Audit')}</th>
                      <th className="px-4 py-4 text-start text-[14px] font-medium">{t('cab.auditSchedule.columns.client', 'Client')}</th>
                      <th className="px-4 py-4 text-center text-[14px] font-medium">{t('cab.auditSchedule.columns.stage', 'Stage')}</th>
                      <th className="px-4 py-4 text-center text-[14px] font-medium">{t('cab.auditSchedule.columns.sites', 'Sites')}</th>
                      <th className="px-4 py-4 text-center text-[14px] font-medium">{t('cab.auditSchedule.columns.dates', 'Dates')}</th>
                      <th className="px-4 py-4 text-center text-[14px] font-medium">{t('cab.auditSchedule.columns.leadAuditor', 'Lead auditor')}</th>
                      <th className="px-4 py-4 text-center text-[14px] font-medium">{t('cab.auditSchedule.columns.status', 'Status')}</th>
                      <th className="px-4 py-4 text-end text-[14px] font-medium">{t('common.actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px]">
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-neutral-500">
                          {t('common.loading', 'Loading audits...')}
                        </td>
                      </tr>
                    ) : auditPlans.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-neutral-500">
                          <p className="font-semibold text-neutral-700">{t('cab.auditSchedule.noAudits', 'No audits found')}</p>
                          <p className="text-[13px] text-neutral-400 mt-1">Try adjusting your filters or search term.</p>
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
                          <td className="px-4 py-4 text-start">
                            <button
                              type="button"
                              onClick={() => navigate(`/cab/audit-planning/build/${plan.planNumber}`)}
                              className="font-bold text-primary hover:underline"
                            >
                              {plan.planNumber}
                            </button>
                            <p className="text-[12px] text-neutral-500 mt-0.5">{plan.standardName}</p>
                          </td>

                          {/* Client info */}
                          <td className="px-4 py-4 text-start">
                            <p className="font-semibold text-neutral-900">{plan.clientName}</p>
                            <p className="text-[12px] text-neutral-500 font-mono mt-0.5">
                              {plan.clientCode} · {plan.country}
                            </p>
                          </td>

                          {/* Stage badge */}
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex rounded-full bg-[#e8edfc] px-2.5 py-0.5 text-[12px] font-medium text-primary">
                              {plan.stage === 'Stage 1' || plan.stage === 'Planning' ? 'Planning' : plan.stage}
                            </span>
                          </td>

                          {/* Sites */}
                          <td className="px-4 py-4 text-center">
                            <p className="font-medium text-neutral-800">1 site</p>
                            <p className="text-[12px] text-neutral-400 mt-0.5">{plan.siteName}</p>
                          </td>

                          {/* Dates */}
                          <td className="px-4 py-4 text-center">
                            <p className="font-medium text-neutral-900">
                              {plan.proposedStartDate} – {plan.proposedEndDate}
                            </p>
                            <p className="text-[12px] text-neutral-400 mt-0.5">{plan.durationDays} days</p>
                          </td>

                          {/* Lead auditor */}
                          <td className="px-4 py-4 text-center">
                            <p className="font-semibold text-neutral-800">{plan.leadAuditor}</p>
                          </td>

                          {/* Status badge */}
                          <td className="px-4 py-4 text-center">
                            <span
                              className={cn(
                                'inline-flex rounded-full px-3 py-1 text-[12px] font-medium',
                                plan.status === 'Planned' && 'bg-[#e8edfc] text-primary',
                                plan.status === 'Completed' && 'bg-[#ecfdf5] text-[#16a34a]',
                                (plan.status === 'Draft' || plan.status === 'In progress') && 'bg-[#fff7ed] text-[#ea580c]'
                              )}
                            >
                              {plan.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-4 text-end relative">
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
                              <div className="absolute end-4 top-12 w-48 rounded-[12px] border border-[#ececec] bg-white py-1.5 shadow-xl z-20 text-start">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/cab/audit-planning/build/${plan.planNumber}`)}
                                  className="w-full px-4 py-2 text-[13px] text-neutral-700 hover:bg-neutral-50 font-medium"
                                >
                                  Build / Edit Plan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/cab/audit-planning/build/${plan.planNumber}?tab=agenda`)}
                                  className="w-full px-4 py-2 text-[13px] text-neutral-700 hover:bg-neutral-50 font-medium"
                                >
                                  View Agenda
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    exportAuditPlansToFormat([plan], 'csv')
                                    setOpenActionMenuId(null)
                                  }}
                                  className="w-full px-4 py-2 text-[13px] text-neutral-700 hover:bg-neutral-50 font-medium"
                                >
                                  Export Plan
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
              <div className="space-y-3 px-5 md:hidden">
                {!isLoading &&
                  auditPlans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => navigate(`/cab/audit-planning/build/${plan.planNumber}`)}
                      className="w-full rounded-[12px] border border-[#ececec] bg-white p-4 text-start space-y-2 cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-primary">{plan.planNumber}</span>
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                            plan.status === 'Planned' && 'bg-[#e8edfc] text-primary',
                            plan.status === 'Completed' && 'bg-[#ecfdf5] text-[#16a34a]',
                            (plan.status === 'Draft' || plan.status === 'In progress') && 'bg-[#fff7ed] text-[#ea580c]'
                          )}
                        >
                          {plan.status}
                        </span>
                      </div>
                      <p className="text-[14px] font-semibold text-neutral-900">{plan.clientName}</p>
                      <p className="text-[12px] text-neutral-500">{plan.standardName}</p>
                      <div className="flex items-center justify-between text-[12px] text-neutral-500 pt-1 border-t border-neutral-100">
                        <span>{plan.proposedStartDate} – {plan.proposedEndDate}</span>
                        <span className="font-medium text-neutral-700">{plan.leadAuditor}</span>
                      </div>
                    </div>
                  ))}
                {isLoading && <p className="py-6 text-center text-neutral-500">{t('common.loading', 'Loading...')}</p>}
                {!isLoading && !auditPlans.length && (
                  <p className="py-6 text-center text-neutral-500">{t('cab.auditSchedule.noAudits', 'No audits found')}</p>
                )}
              </div>

              {/* Table Pagination */}
              <TablePagination
                page={page}
                totalPages={1}
                onPageChange={(nextPage) => setPage(nextPage)}
                className="mt-5 px-5"
              />
            </>
          ) : (
            /* Calendar View Grid */
            <div className="px-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-bold text-neutral-900">October 2026</h3>
                <p className="text-[13px] text-neutral-500">Timezone: Asia/Riyadh (AST)</p>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-[12px] font-semibold text-neutral-400 mb-2">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((d) => (
                  <div
                    key={d.dayNumber}
                    className={cn(
                      'min-h-[90px] rounded-[10px] border p-2 text-start transition-all',
                      d.audits.length > 0
                        ? 'border-[#c7d7fa] bg-[#f8fafd]'
                        : 'border-neutral-100 bg-white hover:border-neutral-200'
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
        </section>
      </main>

      {/* Create Plan Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-[16px] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
              <h3 className="text-[18px] font-bold text-neutral-900">
                {t('cab.auditSchedule.createPlan', 'Create new audit plan')}
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
                <label className="text-[13px] font-semibold text-neutral-800 block mb-1">
                  Client *
                </label>
                <select
                  value={newClientCode}
                  onChange={(e) => setNewClientCode(e.target.value)}
                  className="w-full rounded-[10px] border border-[#d8dce5] bg-white px-3 py-2 text-[14px] text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
                  <label className="text-[13px] font-semibold text-neutral-800 block mb-1">
                    Audit stage *
                  </label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value as any)}
                    className="w-full rounded-[10px] border border-[#d8dce5] bg-white px-3 py-2 text-[14px] text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Stage 1">Stage 1</option>
                    <option value="Stage 2">Stage 2</option>
                    <option value="Surveillance 1">Surveillance 1</option>
                  </select>
                </div>

                <div>
                  <label className="text-[13px] font-semibold text-neutral-800 block mb-1">
                    Lead auditor *
                  </label>
                  <select
                    value={newLeadAuditor}
                    onChange={(e) => setNewLeadAuditor(e.target.value)}
                    className="w-full rounded-[10px] border border-[#d8dce5] bg-white px-3 py-2 text-[14px] text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Alex Morgan">Alex Morgan (Lead)</option>
                    <option value="Ahmed Khan">Ahmed Khan</option>
                    <option value="Layla Al-Khatib">Layla Al-Khatib</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[13px] font-semibold text-neutral-800 block mb-1">
                  Standard *
                </label>
                <input
                  type="text"
                  value={newStandard}
                  onChange={(e) => setNewStandard(e.target.value)}
                  className="w-full rounded-[10px] border border-[#d8dce5] bg-white px-3 py-2 text-[14px] text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-semibold text-neutral-800 block mb-1">
                    Start date *
                  </label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full rounded-[10px] border border-[#d8dce5] bg-white px-3 py-2 text-[14px] text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="text-[13px] font-semibold text-neutral-800 block mb-1">
                    End date *
                  </label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full rounded-[10px] border border-[#d8dce5] bg-white px-3 py-2 text-[14px] text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-[10px] border border-[#d8dce5] bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-[10px] bg-primary px-5 py-2 text-[13px] font-semibold text-white hover:bg-primary/90"
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
