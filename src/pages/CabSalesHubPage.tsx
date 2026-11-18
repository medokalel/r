import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { SalesHubKpiCards } from '@/components/dashboard/cab/sales/SalesHubKpiCards'
import { SalesHubPipelineBoard } from '@/components/dashboard/cab/sales/SalesHubPipelineBoard'
import { SalesHubListTable } from '@/components/dashboard/cab/sales/SalesHubListTable'
import { SalesHubLeadDetailPanel } from '@/components/dashboard/cab/sales/SalesHubLeadDetailPanel'
import { Button } from '@/components/ui/Button'
import { ExportMenuButton } from '@/components/ui/ExportMenuButton'
import { SelectField } from '@/components/ui/Select'
import {
  AddCircleIcon,
  AppIcon,
  DashboardIcon,
  MenuRowsIcon,
  SearchIcon,
} from '@/components/icons'
import {
  computeSalesHubMetrics,
  getSalesHubLeads,
  LEAD_OWNERS,
  LEAD_SOURCES,
  LEAD_STAGES,
  saveSalesHubLeads,
  type LeadStageId,
  type SalesLead,
} from '@/lib/api/cabSalesHubApi'
import {
  downloadExcelCsv,
  downloadPdfFromTable,
  type TableColumn,
} from '@/lib/tableTools'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

function Chevron() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-neutral-400 rtl-flip"
      aria-hidden
    >
      <path
        d="M9 18L15 12L9 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CabSalesHubPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const boardRef = useRef<HTMLDivElement | null>(null)

  const [leads, setLeads] = useState<SalesLead[]>(() => getSalesHubLeads())
  const [showMaintenanceBanner, setShowMaintenanceBanner] = useState(true)
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline')
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(
    () => getSalesHubLeads()[0]?.id ?? null,
  )
  const [exporting, setExporting] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [ownerFilter, setOwnerFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')

  const metrics = useMemo(() => computeSalesHubMetrics(leads), [leads])

  const filteredLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return leads.filter((lead) => {
      const matchesQuery =
        !q ||
        lead.companyName.toLowerCase().includes(q) ||
        lead.contactPerson.toLowerCase().includes(q) ||
        lead.city.toLowerCase().includes(q) ||
        lead.standards.some((s) => s.toLowerCase().includes(q))
      const matchesOwner = ownerFilter === 'all' || lead.owner === ownerFilter
      const matchesSource =
        sourceFilter === 'all' || lead.source === sourceFilter
      return matchesQuery && matchesOwner && matchesSource
    })
  }, [leads, searchQuery, ownerFilter, sourceFilter])

  const selectedLead = useMemo(
    () =>
      filteredLeads.find((l) => l.id === selectedLeadId) ??
      filteredLeads[0] ??
      null,
    [filteredLeads, selectedLeadId],
  )

  const clearFilters = () => {
    setSearchQuery('')
    setOwnerFilter('all')
    setSourceFilter('all')
  }

  const moveLeadToStage = (leadId: string, targetStage: LeadStageId) => {
    const stageConfig = LEAD_STAGES.find((s) => s.id === targetStage)
    const nowStamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
    const next = leads.map((lead) => {
      if (lead.id !== leadId || lead.stage === targetStage) return lead
      return {
        ...lead,
        stage: targetStage,
        activities: [
          {
            id: `act-${Date.now()}`,
            title: `Stage moved to ${stageConfig?.defaultLabel ?? targetStage}`,
            actor: lead.owner || 'Team',
            timestamp: nowStamp,
            type: 'stage' as const,
          },
          ...(lead.activities ?? []),
        ],
      }
    })
    setLeads(next)
    saveSalesHubLeads(next)
  }

  const toggleLeadChecklistItem = (leadId: string, item: string) => {
    const nowStamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
    const next = leads.map((lead) => {
      if (lead.id !== leadId) return lead
      const exists = lead.checklistCompleted.includes(item)
      const checklistCompleted = exists
        ? lead.checklistCompleted.filter((i) => i !== item)
        : [...lead.checklistCompleted, item]
      const activities = exists
        ? (lead.activities ?? [])
        : [
            {
              id: `act-${Date.now()}`,
              title: `Completed checklist: ${item}`,
              actor: lead.owner || 'Team',
              timestamp: nowStamp,
              type: 'checklist' as const,
            },
            ...(lead.activities ?? []),
          ]
      return { ...lead, checklistCompleted, activities }
    })
    setLeads(next)
    saveSalesHubLeads(next)
  }

  const saveLeadNextAction = (
    leadId: string,
    actionText: string,
    actionDate: string,
  ) => {
    const nowStamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
    const next = leads.map((lead) => {
      if (lead.id !== leadId) return lead
      return {
        ...lead,
        nextAction: actionText,
        nextActionDate: actionDate,
        activities: [
          {
            id: `act-${Date.now()}`,
            title: `Next action set: ${actionText}${actionDate ? ` (${actionDate})` : ''}`,
            actor: lead.owner || 'Team',
            timestamp: nowStamp,
            type: 'note' as const,
          },
          ...(lead.activities ?? []),
        ],
      }
    })
    setLeads(next)
    saveSalesHubLeads(next)
  }

  const scrollToBoard = (mode: 'pipeline' | 'list') => {
    setViewMode(mode)
    boardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const exportColumns: TableColumn<SalesLead>[] = [
    {
      header: t('cab.salesHub.table.company', 'Company'),
      value: (row) => row.companyName,
    },
    {
      header: t('cab.salesHub.table.contact', 'Contact'),
      value: (row) => row.contactPerson,
    },
    {
      header: t('cab.salesHub.modal.city', 'City'),
      value: (row) => row.city,
    },
    {
      header: t('cab.salesHub.table.standards', 'Standards'),
      value: (row) => row.standards.join(', '),
    },
    {
      header: t('cab.salesHub.table.stage', 'Stage'),
      value: (row) =>
        LEAD_STAGES.find((s) => s.id === row.stage)?.defaultLabel ?? row.stage,
    },
    {
      header: t('cab.salesHub.table.estimatedValue', 'Estimated value'),
      value: (row) => `${row.estimatedValueSar.toLocaleString()} SAR`,
    },
    {
      header: t('cab.salesHub.table.owner', 'Owner'),
      value: (row) => row.owner,
    },
    {
      header: t('cab.salesHub.table.source', 'Source'),
      value: (row) => row.source,
    },
  ]

  const handleExportExcel = () => {
    setExporting(true)
    try {
      downloadExcelCsv('sales-hub-leads', exportColumns, filteredLeads)
    } finally {
      setExporting(false)
    }
  }

  const handleExportPdf = () => {
    setExporting(true)
    try {
      downloadPdfFromTable(
        'sales-hub-leads.pdf',
        t('cab.salesHub.title', 'Sales Hub'),
        exportColumns,
        filteredLeads,
      )
    } finally {
      setExporting(false)
    }
  }

  const ownerOptions = useMemo(
    () => [
      {
        value: 'all',
        label: t('cab.salesHub.filters.allOwners', 'All owners'),
      },
      ...LEAD_OWNERS.map((o) => ({ value: o, label: o })),
    ],
    [t],
  )

  const sourceOptions = useMemo(
    () => [
      {
        value: 'all',
        label: t('cab.salesHub.filters.allSources', 'All sources'),
      },
      ...LEAD_SOURCES.map((s) => ({ value: s, label: s })),
    ],
    [t],
  )

  return (
    <CabLayout>
      {/* Scheduled Maintenance Banner */}
      {showMaintenanceBanner && (
        <div className="flex items-center justify-between gap-3 border-b border-[#c5d7fa] bg-[#e8edfc] px-5 py-2.5 text-[13px] text-primary">
          <div className="flex items-center gap-2.5">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="shrink-0 text-primary"
              aria-hidden
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M12 8V12.5M12 16H12.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <p className="leading-snug">
              <span className="font-semibold">
                {t('cab.salesHub.maintenance.title', 'Scheduled maintenance')}
              </span>{' '}
              <span className="text-neutral-700">
                {t(
                  'cab.salesHub.maintenance.message',
                  'iCASCO will be unavailable on Friday from 01:00 to 02:00 (KSA time) for planned maintenance.',
                )}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowMaintenanceBanner(false)}
            aria-label={t('common.close', 'Close')}
            className="flex size-6 shrink-0 items-center justify-center rounded-[6px] text-primary/70 transition-colors hover:bg-white/60 hover:text-primary"
          >
            ×
          </button>
        </div>
      )}

      <CabHeader
        title={t('cab.salesHub.title', 'Sales Hub')}
        notificationCount={3}
      />

      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        {/* Breadcrumb */}
        <nav
          className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]"
          aria-label="breadcrumb"
        >
          <Link
            to={ROUTES.workspace}
            className="font-light text-neutral-400 hover:text-primary"
          >
            {t('cab.salesHub.breadcrumbWorkspace', 'Workspace')}
          </Link>
          <Chevron />
          <span className="font-medium text-neutral-700">
            {t('cab.salesHub.title', 'Sales Hub')}
          </span>
        </nav>

        {/* Page Title & Action Buttons */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-[28px] font-bold leading-tight text-neutral-900">
              {t('cab.salesHub.title', 'Sales Hub')}
            </h1>
            <p className="mt-1 text-[14px] text-neutral-500">
              {t(
                'cab.salesHub.subtitle',
                'Every lead in one place, from client registration to a signed certification agreement.',
              )}
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate(ROUTES.cabSalesHubNew)}
              icon={<AppIcon icon={AddCircleIcon} size={20} />}
              className="flex-1 sm:flex-none"
            >
              {t('cab.salesHub.addLead', 'Add lead')}
            </Button>

            <ExportMenuButton
              exporting={exporting}
              disabled={filteredLeads.length === 0}
              onExportPdf={handleExportPdf}
              onExportExcel={handleExportExcel}
              pdfLabel={t('cab.certification.exportPdf', 'Download PDF')}
              excelLabel={t('cab.certification.exportExcel', 'Download Excel')}
            />
          </div>
        </div>

        {/* Portal Registration Info Callout */}
        <div className="flex items-center gap-3 rounded-[16px] border border-[#c5d7fa] bg-[#e8edfc]/45 px-4 py-3 text-[13px] text-neutral-800">
          <span
            className="h-5 w-1 shrink-0 rounded-full bg-primary"
            aria-hidden
          />
          <p>
            {t(
              'cab.salesHub.portalCallout',
              'Client portal registrations arrive here automatically as New leads. Work each lead through the stages; a stage closes when its checklist is complete.',
            )}
          </p>
        </div>

        {/* 5 KPI Summary Cards */}
        <SalesHubKpiCards
          metrics={metrics}
          onViewPipeline={() => scrollToBoard('pipeline')}
          onViewList={() => scrollToBoard('list')}
        />

        {/* Business Development Workflow Bar */}
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[#ececec] bg-white px-5 py-3.5">
          <span className="text-[13px] font-semibold text-neutral-700">
            {t('cab.salesHub.workflowTitle', 'Business development workflow')}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {LEAD_STAGES.map((stage, idx) => (
              <div key={stage.id} className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center rounded-[4px] px-2.5 py-1 text-[12px] font-medium',
                    stage.badgeClassName,
                  )}
                >
                  {stage.stepNumber}. {t(stage.labelKey, stage.defaultLabel)}
                </span>
                {idx < LEAD_STAGES.length - 1 && <Chevron />}
              </div>
            ))}
          </div>
        </section>

        {/* View Switcher & Filters */}
        <section
          ref={boardRef}
          className="flex flex-col gap-4 rounded-[16px] border border-[#ececec] bg-white p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-medium text-neutral-700">
                {t('cab.salesHub.viewLabel', 'View')}
              </span>
              <div
                className="inline-flex gap-1 rounded-[10px] border border-[#ececec] bg-[#f9fafc] p-1"
                role="tablist"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'list'}
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-[8px] px-4 py-1.5 text-[13px] font-medium transition-colors',
                    viewMode === 'list'
                      ? 'bg-[#1236a3] text-white shadow-sm'
                      : 'text-neutral-600 hover:bg-white hover:text-neutral-900',
                  )}
                >
                  <AppIcon icon={MenuRowsIcon} size={15} />
                  <span>{t('cab.salesHub.views.list', 'List')}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'pipeline'}
                  onClick={() => setViewMode('pipeline')}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-[8px] px-4 py-1.5 text-[13px] font-medium transition-colors',
                    viewMode === 'pipeline'
                      ? 'bg-[#1236a3] text-white shadow-sm'
                      : 'text-neutral-600 hover:bg-white hover:text-neutral-900',
                  )}
                >
                  <AppIcon icon={DashboardIcon} size={15} />
                  <span>{t('cab.salesHub.views.pipeline', 'Pipeline')}</span>
                </button>
              </div>
            </div>

            <Button
              type="button"
              variant="tertiary"
              size="sm"
              onClick={clearFilters}
              className="h-auto p-0 text-[13px]"
            >
              {t('cab.certification.clearFilters', 'Clear filters')}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr_1fr]">
            <div className="space-y-1.5">
              <label
                htmlFor="sales-hub-search"
                className="text-[13px] font-medium text-neutral-700"
              >
                {t('cab.salesHub.filters.search', 'Search')}
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400">
                  <AppIcon icon={SearchIcon} size={18} />
                </span>
                <input
                  id="sales-hub-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(
                    'cab.salesHub.filters.searchPlaceholder',
                    'Search leads by company, contact or standard',
                  )}
                  className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white ps-10 pe-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-neutral-700">
                {t('cab.salesHub.filters.owner', 'Owner')}
              </label>
              <SelectField
                value={ownerFilter}
                onChange={setOwnerFilter}
                options={ownerOptions}
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-neutral-700">
                {t('cab.salesHub.filters.source', 'Source')}
              </label>
              <SelectField
                value={sourceFilter}
                onChange={setSourceFilter}
                options={sourceOptions}
                className="h-11"
              />
            </div>
          </div>
        </section>

        {/* Pipeline Kanban or List Table */}
        {viewMode === 'pipeline' ? (
          <SalesHubPipelineBoard
            leads={filteredLeads}
            selectedLeadId={selectedLead?.id ?? null}
            onSelectLead={setSelectedLeadId}
            onMoveStage={moveLeadToStage}
          />
        ) : (
          <SalesHubListTable
            leads={filteredLeads}
            selectedLeadId={selectedLead?.id ?? null}
            onSelectLead={setSelectedLeadId}
            onMoveStage={moveLeadToStage}
          />
        )}

        {/* Inline Lead Detail & Stage Checklist Panel (No Popups) */}
        {selectedLead && (
          <SalesHubLeadDetailPanel
            lead={selectedLead}
            onToggleChecklist={toggleLeadChecklistItem}
            onMoveStage={moveLeadToStage}
            onSaveNextAction={saveLeadNextAction}
          />
        )}
      </main>
    </CabLayout>
  )
}
