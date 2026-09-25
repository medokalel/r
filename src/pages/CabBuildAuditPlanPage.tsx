import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useBuildAuditPlanTourSteps } from '@/config/buildAuditPlanTourSteps'
import {
  fetchAuditPlanById,
  saveAuditPlan,
  checkAuditPlanReadiness,
  sendAuditPlanToClient,
  rescheduleAuditPlan,
  type AuditPlan,
  type AgendaActivity,
  type EligibilityCheckResult,
} from '@/lib/api/cabAuditPlanningApi'
import {
  AppIcon,
  CalendarIcon,
  BuildingsIcon,
  FileTextIcon,
  HistoryIcon,
  MapPinIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
} from '@/components/icons'
import { cn } from '@/lib/utils'

export function CabBuildAuditPlanPage() {
  const { t } = useTranslation()
  const { planId } = useParams<{ planId: string }>()
  const navigate = useNavigate()
  const tourSteps = useBuildAuditPlanTourSteps()

  const [plan, setPlan] = useState<AuditPlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'agenda' | 'site' | 'remote' | 'travel' | 'declarations'>('agenda')

  // Form states
  const [auditStage, setAuditStage] = useState('Stage 1')
  const [proposedStartDate, setProposedStartDate] = useState('2025-05-18')
  const [proposedEndDate, setProposedEndDate] = useState('2025-05-19')
  const [timezone, setTimezone] = useState('Asia/Riyadh')
  const [leadAuditor, setLeadAuditor] = useState('Alex Morgan')
  const [auditTeam, setAuditTeam] = useState<string[]>(['Alex Morgan (Lead)', 'Priya Desai', 'Omar Al-Farsi'])
  const [auditObjectives, setAuditObjectives] = useState(
    'Confirm readiness for Stage 2, evaluate implementation status and site specific conditions.'
  )
  const [scopeSummary, setScopeSummary] = useState(
    'Production of food products, including processing, packaging and storage at Riyadh site (SITE-001).'
  )

  // Sub-sections states
  const [siteCode, setSiteCode] = useState('SITE-001 – Riyadh')
  const [siteAddress, setSiteAddress] = useState(
    'Al Noor Food Industries\nSecond Industrial City\nRiyadh 14334\nSaudi Arabia'
  )
  const [remoteEnabled, setRemoteEnabled] = useState(true)
  const [remoteActivitiesList, setRemoteActivitiesList] = useState<string[]>([
    'Document review',
    'Interviews (if required)',
  ])
  const [remotePlatform, setRemotePlatform] = useState('Microsoft Teams')
  const [remoteNotes, setRemoteNotes] = useState('Client to arrange access and invitations.')
  const [travelNotes, setTravelNotes] = useState(
    'Auditors to arrive in Riyadh on 17 May 2025. Accommodation booked near the site. Local transport to be arranged by client.'
  )
  const [availabilityConfirmed, setAvailabilityConfirmed] = useState(true)
  const [noConflictsDeclared, setNoConflictsDeclared] = useState(true)

  // Agenda activities
  const [agenda, setAgenda] = useState<AgendaActivity[]>([])

  // Notification banners / alerts
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Modals state
  const [isReadinessModalOpen, setIsReadinessModalOpen] = useState(false)
  const [readinessResult, setReadinessResult] = useState<EligibilityCheckResult | null>(null)
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<AgendaActivity | null>(null)

  // Reschedule form
  const [rescheduleStart, setRescheduleStart] = useState('')
  const [rescheduleEnd, setRescheduleEnd] = useState('')
  const [rescheduleReason, setRescheduleReason] = useState('Client requested date adjustment due to scheduled facility maintenance.')

  // Activity form
  const [actDate, setActDate] = useState('2025-05-18')
  const [actStartTime, setActStartTime] = useState('09:00')
  const [actEndTime, setActEndTime] = useState('10:00')
  const [actTitle, setActTitle] = useState('')
  const [actAuditors, setActAuditors] = useState('Alex Morgan')
  const [actDuration, setActDuration] = useState(1.0)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      const data = await fetchAuditPlanById(planId || 'AUD-0024')
      if (data) {
        setPlan(data)
        setAuditStage(data.stage)
        setProposedStartDate(data.proposedStartDate)
        setProposedEndDate(data.proposedEndDate)
        setTimezone(data.timezone)
        setLeadAuditor(data.leadAuditor)
        setAuditTeam(data.auditTeam.map((a) => (a === data.leadAuditor ? `${a} (Lead)` : a)))
        setAuditObjectives(data.auditObjectives)
        setScopeSummary(data.scopeSummary)
        setAgenda(data.agendaActivities)
        setSiteCode(data.siteAllocation?.siteCode || 'SITE-001 – Riyadh')
        setSiteAddress(data.siteAllocation?.siteAddress || '')
        setRemoteEnabled(data.remoteActivities?.enabled ?? true)
        setRemoteActivitiesList(data.remoteActivities?.activities || ['Document review'])
        setRemotePlatform(data.remoteActivities?.platform || 'Microsoft Teams')
        setRemoteNotes(data.remoteActivities?.notes || '')
        setTravelNotes(data.travelNotes?.details || '')
        setAvailabilityConfirmed(data.teamDeclarations?.availabilityConfirmed ?? true)
        setNoConflictsDeclared(data.teamDeclarations?.noConflictsDeclared ?? true)
      }
      setIsLoading(false)
    }
    load()
  }, [planId])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Calculate total effort hours
  const totalEffort = agenda.reduce((acc, cur) => acc + (cur.durationHours || 0), 0)

  const handleSaveDraft = async () => {
    setIsSaving(true)
    try {
      const updated = await saveAuditPlan({
        id: plan?.id,
        planNumber: plan?.planNumber || 'AUD-0024',
        stage: auditStage as any,
        proposedStartDate,
        proposedEndDate,
        timezone,
        leadAuditor,
        auditTeam: auditTeam.map((a) => a.replace(' (Lead)', '')),
        auditObjectives,
        scopeSummary,
        totalEffortHours: totalEffort,
        siteAllocation: {
          siteCode,
          siteName: siteCode,
          onSitePersonnel: auditTeam.map((a) => a.replace(' (Lead)', '')),
          siteAddress,
        },
        remoteActivities: {
          enabled: remoteEnabled,
          activities: remoteActivitiesList,
          platform: remotePlatform,
          notes: remoteNotes,
        },
        travelNotes: { details: travelNotes },
        teamDeclarations: {
          availabilityConfirmed,
          noConflictsDeclared,
        },
        agendaActivities: agenda,
        status: 'Draft',
      })
      setPlan(updated)
      showToast(t('cab.auditPlanning.draftSaved', 'Draft saved successfully.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleRunReadinessCheck = async () => {
    const result = await checkAuditPlanReadiness(plan?.planNumber || 'AUD-0024')
    setReadinessResult(result)
    setIsReadinessModalOpen(true)
  }

  const handleConfirmSendToClient = async () => {
    if (!plan) return
    await sendAuditPlanToClient(plan.planNumber, {
      name: plan.primaryContactName,
      email: plan.primaryContactEmail,
    })
    setIsSendModalOpen(false)
    showToast(`Audit plan sent to ${plan.primaryContactName} (${plan.primaryContactEmail}).`)
  }

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!plan) return
    const updated = await rescheduleAuditPlan(plan.planNumber, {
      startDate: rescheduleStart,
      endDate: rescheduleEnd,
      reason: rescheduleReason,
    })
    setPlan(updated)
    setProposedStartDate(updated.proposedStartDate)
    setProposedEndDate(updated.proposedEndDate)
    setIsRescheduleModalOpen(false)
    showToast(`Audit plan rescheduled to ${updated.proposedStartDate} – ${updated.proposedEndDate}. Version ${updated.version}.`)
  }

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingActivity) {
      setAgenda((prev) =>
        prev.map((a) =>
          a.id === editingActivity.id
            ? {
                ...a,
                date: actDate,
                startTime: actStartTime,
                endTime: actEndTime,
                activity: actTitle,
                auditors: [actAuditors],
                durationHours: actDuration,
              }
            : a
        )
      )
    } else {
      const newAct: AgendaActivity = {
        id: `act-${Date.now()}`,
        date: actDate,
        startTime: actStartTime,
        endTime: actEndTime,
        activity: actTitle,
        auditors: [actAuditors],
        durationHours: actDuration,
      }
      setAgenda((prev) => [...prev, newAct])
    }
    setIsActivityModalOpen(false)
    setEditingActivity(null)
  }

  const handleDeleteActivity = (id: string) => {
    setAgenda((prev) => prev.filter((a) => a.id !== id))
  }

  const handleRemoveAuditorChip = (auditor: string) => {
    setAuditTeam((prev) => prev.filter((a) => a !== auditor))
  }

  if (isLoading || !plan) {
    return (
      <CabLayout sidebarVariant="auditPlanning">
        <div className="flex flex-1 items-center justify-center p-12 text-neutral-400">
          {t('common.loading', 'Loading audit plan...')}
        </div>
      </CabLayout>
    )
  }

  return (
    <CabLayout
      sidebarVariant="auditPlanning"
      tourId="cab-build-audit-plan"
      tourSteps={tourSteps}
    >
      <CabHeader
        title={t('cab.auditPlanning.title', 'Audit Planning')}
        subtitle={t('cab.auditPlanning.subtitle', 'Plan and manage audits across clients and sites.')}
        notificationCount={3}
      />

      <div className="flex flex-1 flex-col gap-5 overflow-auto p-3 sm:p-5">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-20 end-8 z-50 rounded-[8px] bg-[#1236a3] px-5 py-3 text-[14px] font-semibold text-white shadow-xl flex items-center gap-3">
            <span>✓</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Top Header with Breadcrumbs & Action Buttons */}
        <CabTourStep steps={tourSteps} stepId="build-plan-header">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <nav className="flex items-center gap-2 text-[13px] text-neutral-400 mb-1">
                <button
                  type="button"
                  onClick={() => navigate('/cab/audit-planning/schedule')}
                  className="hover:text-[#1236a3] transition font-medium"
                >
                  {t('cab.sidebar.auditPlanning', 'Audit Planning')}
                </button>
                <span>›</span>
                <button
                  type="button"
                  onClick={() => navigate('/cab/audit-planning/schedule')}
                  className="hover:text-[#1236a3] transition font-medium"
                >
                  {t('cab.sidebar.auditSchedule', 'Audit Plans')}
                </button>
                <span>›</span>
                <span className="text-[#1236a3] font-semibold">{plan.planNumber}</span>
              </nav>
              <div className="flex items-center gap-3">
                <h2 className="text-[20px] font-bold text-neutral-900 tracking-tight">
                  {t('cab.buildAuditPlan.title', 'Build audit plan')}
                </h2>
                <span className="inline-flex items-center justify-center rounded-[4px] px-3 py-1 text-[12px] font-medium whitespace-nowrap bg-[#e8edfc] text-primary">
                  {plan.status}
                </span>
              </div>
              <p className="text-[13px] text-neutral-500 mt-0.5">
                {t('cab.buildAuditPlan.subtitle', 'Plan the audit, allocate resources and prepare the agenda.')}
              </p>
            </div>

            {/* Top Actions matching design system */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Save Draft */}
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="inline-flex h-11 items-center gap-2 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <span>{isSaving ? t('common.saving', 'Saving...') : t('common.saveDraft', 'Save draft')}</span>
              </button>

              {/* Check Readiness */}
              <button
                type="button"
                onClick={handleRunReadinessCheck}
                className="inline-flex h-11 items-center gap-2 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <span>{t('cab.buildAuditPlan.checkReadiness', 'Check readiness')}</span>
              </button>

              {/* Send to client */}
              <button
                type="button"
                onClick={() => setIsSendModalOpen(true)}
                className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-[#1236a3] px-5 text-[14px] font-semibold text-white transition hover:bg-[#0e2a80]"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                <span>{t('cab.buildAuditPlan.sendToClient', 'Send to client')}</span>
              </button>

              {/* More options menu */}
              <button
                type="button"
                onClick={() => {
                  setRescheduleStart(proposedStartDate)
                  setRescheduleEnd(proposedEndDate)
                  setIsRescheduleModalOpen(true)
                }}
                title="Reschedule Plan"
                className="inline-flex h-11 w-11 items-center justify-center rounded-[8px] border border-[#e2e2e2] bg-white text-neutral-700 transition hover:bg-neutral-50 font-bold"
              >
                •••
              </button>
            </div>
          </div>
        </CabTourStep>

        {/* Audit Summary Header Card Bar */}
        <CabTourStep steps={tourSteps} stepId="build-plan-summary-bar">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 rounded-[16px] border border-[#ececec] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            {/* Audit plan */}
            <div className="space-y-1.5 border-e border-neutral-100 pe-3 last:border-e-0">
              <div className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-[#dbeafe] text-[#1447e6]">
                  <CalendarIcon className="size-4" />
                </span>
                <span className="text-[12px] text-neutral-500 font-medium">Audit plan</span>
              </div>
              <p className="text-[15px] font-bold text-neutral-900">{plan.planNumber}</p>
              <p className="text-[13px] text-neutral-500">{plan.stage}</p>
            </div>

            {/* Client */}
            <div className="space-y-1.5 border-e border-neutral-100 pe-3 last:border-e-0">
              <div className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-[#fef3c6] text-[#a58401]">
                  <AppIcon icon={BuildingsIcon} size={15} />
                </span>
                <span className="text-[12px] text-neutral-500 font-medium">Client</span>
              </div>
              <p className="text-[14px] font-bold text-neutral-900 truncate">{plan.clientName}</p>
              <p className="text-[12px] text-neutral-500">
                {plan.clientCode} · {plan.country}
              </p>
            </div>

            {/* Application */}
            <div className="space-y-1.5 border-e border-neutral-100 pe-3 last:border-e-0">
              <div className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-[#ede9fe] text-[#6d28d9]">
                  <AppIcon icon={FileTextIcon} size={15} />
                </span>
                <span className="text-[12px] text-neutral-500 font-medium">Application</span>
              </div>
              <p className="text-[14px] font-bold text-primary">{plan.applicationNumber}</p>
              <p className="text-[12px] text-neutral-500 line-clamp-2">{plan.standardName}</p>
            </div>

            {/* Reviewed duration */}
            <div className="space-y-1.5 border-e border-neutral-100 pe-3 last:border-e-0">
              <div className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-[#d7f4f0] text-[#0f9488]">
                  <AppIcon icon={HistoryIcon} size={15} />
                </span>
                <span className="text-[12px] text-neutral-500 font-medium">Reviewed duration</span>
              </div>
              <p className="text-[14px] font-bold text-neutral-900">{plan.reviewedDurationCode}</p>
              <p className="text-[13px] text-neutral-500">{plan.reviewedDurationDays.toFixed(1)} day(s)</p>
            </div>

            {/* Site */}
            <div className="space-y-1.5 border-e border-neutral-100 pe-3 last:border-e-0">
              <div className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-[#fee2e2] text-[#dc2626]">
                  <AppIcon icon={MapPinIcon} size={15} />
                </span>
                <span className="text-[12px] text-neutral-500 font-medium">Site</span>
              </div>
              <p className="text-[14px] font-bold text-neutral-900">{plan.siteCode}</p>
              <p className="text-[12px] text-neutral-500">
                {plan.siteName.split(' ')[0]} · {plan.country}
              </p>
            </div>

            {/* Primary contact */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-[#fce7f3] text-[#be185d]">
                  <AppIcon icon={UserIcon} size={15} />
                </span>
                <span className="text-[12px] text-neutral-500 font-medium">Primary contact</span>
              </div>
              <p className="text-[14px] font-bold text-neutral-900">{plan.primaryContactName}</p>
              <p className="flex items-center gap-1 text-[12px] text-primary truncate">
                <AppIcon icon={MailIcon} size={12} className="text-neutral-400 shrink-0" />
                <span className="truncate">{plan.primaryContactEmail}</span>
              </p>
              <p className="flex items-center gap-1 text-[12px] text-neutral-500">
                <AppIcon icon={PhoneIcon} size={12} className="text-neutral-400 shrink-0" />
                <span>{plan.primaryContactPhone}</span>
              </p>
            </div>
          </div>
        </CabTourStep>

        {/* Form Details: Two Columns Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Audit Details */}
          <div className="lg:col-span-7">
            <CabTourStep steps={tourSteps} stepId="build-plan-details">
              <div className="rounded-[12px] border border-[#e2e2e2] bg-white p-5 shadow-none space-y-4">
                <h3 className="text-[16px] font-bold text-neutral-900 mb-3 border-b border-[#ececec] pb-2">Audit details</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Audit Stage */}
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-neutral-800">
                      Audit stage <span className="text-error-500">*</span>
                    </label>
                    <select
                      value={auditStage}
                      onChange={(e) => setAuditStage(e.target.value)}
                      className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Stage 1">Stage 1</option>
                      <option value="Stage 2">Stage 2</option>
                      <option value="Surveillance 1">Surveillance 1</option>
                    </select>
                  </div>

                  {/* Proposed start date */}
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-neutral-800">
                      Proposed start date <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={proposedStartDate}
                      onChange={(e) => setProposedStartDate(e.target.value)}
                      className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Proposed end date */}
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-neutral-800">
                      Proposed end date <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={proposedEndDate}
                      onChange={(e) => setProposedEndDate(e.target.value)}
                      className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Timezone */}
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-neutral-800">
                      Timezone <span className="text-error-500">*</span>
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Asia/Riyadh">Asia/Riyadh</option>
                      <option value="Asia/Dubai">Asia/Dubai</option>
                      <option value="Africa/Cairo">Africa/Cairo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start pt-2">
                  {/* Lead auditor */}
                  <div className="sm:col-span-4 space-y-1.5">
                    <label className="text-[13px] font-medium text-neutral-800">
                      Lead auditor <span className="text-error-500">*</span>
                    </label>
                    <select
                      value={leadAuditor}
                      onChange={(e) => setLeadAuditor(e.target.value)}
                      className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Alex Morgan">Alex Morgan</option>
                      <option value="Ahmed Khan">Ahmed Khan</option>
                      <option value="Layla Al-Khatib">Layla Al-Khatib</option>
                    </select>
                  </div>

                  {/* Audit team chips */}
                  <div className="sm:col-span-8 space-y-1.5">
                    <label className="text-[13px] font-medium text-neutral-800">Audit team</label>
                    <div className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-[8px] border border-[#e2e2e2] bg-white p-2">
                      {auditTeam.map((member) => (
                        <span
                          key={member}
                          className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#e8edfc] px-2.5 py-1 text-[13px] font-medium text-[#1236a3]"
                        >
                          {member}
                          <button
                            type="button"
                            onClick={() => handleRemoveAuditorChip(member)}
                            className="text-[#1236a3] hover:text-red-500 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <select
                        onChange={(e) => {
                          if (e.target.value && !auditTeam.includes(e.target.value)) {
                            setAuditTeam((prev) => [...prev, e.target.value])
                            e.target.value = ''
                          }
                        }}
                        className="bg-transparent text-[13px] text-neutral-500 focus:outline-none cursor-pointer"
                      >
                        <option value="">+ Add auditor</option>
                        <option value="Dr. Sarah Al-Otaibi">Dr. Sarah Al-Otaibi</option>
                        <option value="Hassan Mahmoud">Hassan Mahmoud</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </CabTourStep>
          </div>

          {/* Right Column: Objectives and Scope */}
          <div className="lg:col-span-5">
            <CabTourStep steps={tourSteps} stepId="build-plan-objectives">
              <div className="rounded-[12px] border border-[#e2e2e2] bg-white p-5 shadow-none space-y-4">
                <h3 className="text-[16px] font-bold text-neutral-900 mb-3 border-b border-[#ececec] pb-2">Objectives and scope</h3>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-800">Audit objectives</label>
                  <textarea
                    value={auditObjectives}
                    onChange={(e) => setAuditObjectives(e.target.value)}
                    rows={2}
                    className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-3 text-[13px] text-neutral-900 focus:border-[#1236a3] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-800">Scope summary</label>
                  <textarea
                    value={scopeSummary}
                    onChange={(e) => setScopeSummary(e.target.value)}
                    rows={2}
                    className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-3 text-[13px] text-neutral-900 focus:border-[#1236a3] focus:outline-none"
                  />
                </div>
              </div>
            </CabTourStep>
          </div>
        </div>

        {/* Tabs Bar */}
        <CabTourStep steps={tourSteps} stepId="build-plan-tabs">
          <div className="border-b border-[#ececec] flex gap-8 text-[14px]">
            {[
              { key: 'agenda', label: 'Agenda' },
              { key: 'site', label: 'Site allocation' },
              { key: 'remote', label: 'Remote activities' },
              { key: 'travel', label: 'Travel notes' },
              { key: 'declarations', label: 'Team declarations' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  'pb-3 transition-colors border-b-2 font-medium',
                  activeTab === tab.key
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CabTourStep>

        {/* Tab 1: Agenda Grid & Side Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Main Agenda Table Card */}
          <div className="lg:col-span-8">
            <CabTourStep steps={tourSteps} stepId="build-plan-agenda-table">
              <div className="rounded-[12px] border border-[#e2e2e2] bg-white p-5 shadow-none">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[16px] font-bold text-neutral-900">Audit agenda</h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingActivity(null)
                        setActTitle('')
                        setActDuration(1.0)
                        setIsActivityModalOpen(true)
                      }}
                      className="inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-[#1236a3] px-3.5 text-[13px] font-medium text-white hover:bg-[#0e2a80] transition-colors"
                    >
                      <span>+</span>
                      <span>Add activity</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast('Standard audit template applied.')}
                      className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-[#e2e2e2] bg-white px-3.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      <span>Import template</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-[8px] border border-[#ececec]">
                  <table className="w-full border-collapse text-start text-[14px]">
                    <thead>
                      <tr className="bg-[#1236a3] text-white">
                        <th className="p-3.5 text-start w-10 text-[13px] font-medium">#</th>
                        <th className="p-3.5 text-start text-[13px] font-medium">Date</th>
                        <th className="p-3.5 text-start text-[13px] font-medium">Time (AST)</th>
                        <th className="p-3.5 text-start text-[13px] font-medium">Activity</th>
                        <th className="p-3.5 text-start text-[13px] font-medium">Auditor(s)</th>
                        <th className="p-3.5 text-start text-[13px] font-medium">Duration</th>
                        <th className="p-3.5 text-end text-[13px] font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {agenda.map((item, idx) => (
                        <tr
                          key={item.id}
                          className={cn(
                            'hover:bg-[#e8edfc]/50 transition-colors',
                            idx % 2 === 1 ? 'bg-[#f9fafc]' : ''
                          )}
                        >
                          <td className="px-3.5 py-3 text-neutral-400 text-[13px]">{idx + 1}</td>
                          <td className="px-3.5 py-3 text-neutral-800 text-[14px] font-medium">{item.date}</td>
                          <td className="px-3.5 py-3 text-neutral-600 text-[13px]">
                            {item.startTime} - {item.endTime}
                          </td>
                          <td className="px-3.5 py-3 text-neutral-900 text-[14px] font-medium">{item.activity}</td>
                          <td className="px-3.5 py-3 text-neutral-700 text-[13px]">{item.auditors.join(', ')}</td>
                          <td className="px-3.5 py-3 text-neutral-800 text-[13px] font-medium">{item.durationHours} h</td>
                          <td className="px-3.5 py-3 text-end">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingActivity(item)
                                setActDate(item.date)
                                setActStartTime(item.startTime)
                                setActEndTime(item.endTime)
                                setActTitle(item.activity)
                                setActAuditors(item.auditors[0] || 'Alex Morgan')
                                setActDuration(item.durationHours)
                                setIsActivityModalOpen(true)
                              }}
                              className="text-neutral-400 hover:text-neutral-700 font-bold px-1"
                            >
                              ⋮
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-[#ececec] bg-[#f8fafc] font-bold text-neutral-900">
                        <td colSpan={5} className="p-3.5 text-start text-[14px]">
                          Total (reviewed duration: {plan.reviewedDurationCode})
                        </td>
                        <td className="p-3.5 text-start text-[14px] text-primary">{totalEffort.toFixed(1)} h</td>
                        <td className="p-3.5"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </CabTourStep>
          </div>

          {/* Right Side Cards */}
          <div className="lg:col-span-4 space-y-5">
            <CabTourStep steps={tourSteps} stepId="build-plan-side-cards">
              <div className="space-y-5">
                {/* Site Allocation Card */}
                <div className="rounded-[12px] border border-[#e2e2e2] bg-white p-5 shadow-none">
                  <div className="flex items-center justify-between mb-3 border-b border-[#ececec] pb-2">
                    <h4 className="text-[16px] font-bold text-neutral-900">Site allocation</h4>
                    <button
                      type="button"
                      onClick={() => showToast('Site allocation editing enabled')}
                      className="text-[13px] font-medium text-[#1236a3] hover:underline"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="space-y-3 text-[13px]">
                    <div>
                      <label className="text-[13px] font-medium text-neutral-700 block mb-1">
                        Site *
                      </label>
                      <select
                        value={siteCode}
                        onChange={(e) => setSiteCode(e.target.value)}
                        className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-neutral-800 text-[14px]"
                      >
                        <option value="SITE-001 – Riyadh">SITE-001 – Riyadh</option>
                        <option value="SITE-002 – Jeddah">SITE-002 – Jeddah</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[13px] font-medium text-neutral-700 block mb-0.5">
                        On-site personnel
                      </span>
                      <p className="text-neutral-800 text-[14px]">{auditTeam.join(', ')}</p>
                    </div>

                    <div>
                      <span className="text-[13px] font-medium text-neutral-700 block mb-0.5">
                        Site address
                      </span>
                      <p className="text-neutral-700 whitespace-pre-line text-[13px]">{siteAddress}</p>
                    </div>
                  </div>
                </div>

                {/* Remote Activities Card */}
                <div className="rounded-[12px] border border-[#e2e2e2] bg-white p-5 shadow-none">
                  <div className="flex items-center justify-between mb-3 border-b border-[#ececec] pb-2">
                    <h4 className="text-[16px] font-bold text-neutral-900">Remote activities</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-neutral-500">Include remote</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={remoteEnabled}
                        onClick={() => setRemoteEnabled((prev) => !prev)}
                        className={cn(
                          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200',
                          remoteEnabled ? 'bg-[#1236a3]' : 'bg-neutral-300'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block size-4 transform rounded-full bg-white transition duration-200 mt-0.5',
                            remoteEnabled ? 'translate-x-4' : 'translate-x-0.5'
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  {remoteEnabled && (
                    <div className="space-y-3 text-[13px]">
                      <div>
                        <span className="text-[13px] font-medium text-neutral-700 block mb-1">
                          Remote activities
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {remoteActivitiesList.map((item) => (
                            <span
                              key={item}
                              className="inline-flex items-center gap-1 rounded-[6px] bg-neutral-100 px-2 py-0.5 text-[12px] text-neutral-700 font-medium"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[13px] font-medium text-neutral-700 block mb-1">
                          Platform
                        </span>
                        <select
                          value={remotePlatform}
                          onChange={(e) => setRemotePlatform(e.target.value)}
                          className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-neutral-800 text-[14px]"
                        >
                          <option value="Microsoft Teams">Microsoft Teams</option>
                          <option value="Zoom">Zoom</option>
                          <option value="Google Meet">Google Meet</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[13px] font-medium text-neutral-700 block mb-0.5">
                          Notes
                        </span>
                        <p className="text-[13px] text-neutral-600">{remoteNotes}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Travel Notes Card */}
                <div className="rounded-[12px] border border-[#e2e2e2] bg-white p-5 shadow-none">
                  <div className="flex items-center justify-between mb-2 border-b border-[#ececec] pb-2">
                    <h4 className="text-[16px] font-bold text-neutral-900">Travel notes</h4>
                    <button
                      type="button"
                      onClick={() => showToast('Travel notes editor ready')}
                      className="text-[13px] font-medium text-[#1236a3] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-[13px] text-neutral-600 leading-relaxed">{travelNotes}</p>
                </div>
              </div>
            </CabTourStep>
          </div>
        </div>

        {/* Team Declarations Card */}
        <div className="rounded-[12px] border border-[#e2e2e2] bg-white p-5 shadow-none">
          <div className="flex items-center justify-between mb-4 border-b border-[#ececec] pb-2">
            <h3 className="text-[16px] font-bold text-neutral-900">Team declarations</h3>
            <button
              type="button"
              onClick={() => showToast('Declarations update enabled')}
              className="text-[13px] font-medium text-[#1236a3] hover:underline"
            >
              Edit
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={availabilityConfirmed}
                onChange={(e) => setAvailabilityConfirmed(e.target.checked)}
                className="size-4 mt-0.5 rounded text-[#1236a3] focus:ring-[#1236a3]"
              />
              <span className="text-[14px] text-neutral-800 font-medium">
                All team members have confirmed their availability for the planned dates.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={noConflictsDeclared}
                onChange={(e) => setNoConflictsDeclared(e.target.checked)}
                className="size-4 mt-0.5 rounded text-[#1236a3] focus:ring-[#1236a3]"
              />
              <span className="text-[14px] text-neutral-800 font-medium">
                All team members have declared no conflicts of interest.
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* MODAL 1: Check Readiness Modal */}
      {isReadinessModalOpen && readinessResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-[12px] bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-emerald-500" />
                <h3 className="text-[16px] font-bold text-neutral-900">
                  Eligibility & Readiness Verification
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReadinessModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 text-[20px] font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-[13px]">
              {/* Check 1: Competence */}
              <div className="rounded-[8px] border border-neutral-100 bg-[#fbfcfd] p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900">1. Competence Authorization</span>
                  <span className="rounded-[6px] bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-700">
                    Passed
                  </span>
                </div>
                <p className="text-neutral-600">{readinessResult.competenceAuthorization.details}</p>
                <p className="text-[12px] text-neutral-400">
                  Authorized standards: {readinessResult.competenceAuthorization.certifiedStandards.join(', ')}
                </p>
              </div>

              {/* Check 2: Availability */}
              <div className="rounded-[8px] border border-neutral-100 bg-[#fbfcfd] p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900">2. Availability Verification</span>
                  <span className="rounded-[6px] bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-700">
                    Passed
                  </span>
                </div>
                <p className="text-neutral-600">{readinessResult.availability.details}</p>
              </div>

              {/* Check 3: Impartiality & Conflicts */}
              <div className="rounded-[8px] border border-neutral-100 bg-[#fbfcfd] p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900">3. Impartiality & Conflict of Interest</span>
                  <span className="rounded-[6px] bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-700">
                    Passed
                  </span>
                </div>
                <p className="text-neutral-600">{readinessResult.impartiality.details}</p>
                <p className="text-[12px] text-neutral-500 italic">
                  Note: No silent overrides permitted. All auditor disclosures are logged to the audit dossier.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsReadinessModalOpen(false)}
                className="h-11 rounded-[8px] bg-[#1236a3] px-5 text-[14px] font-semibold text-white hover:bg-[#0e2a80]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Send to Client Preview Modal */}
      {isSendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-[12px] bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <h3 className="text-[16px] font-bold text-neutral-900">
                Send Audit Plan to Client
              </h3>
              <button
                type="button"
                onClick={() => setIsSendModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 text-[20px] font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-[13px]">
              <div className="rounded-[8px] bg-[#f8fafd] border border-[#e8edfc] p-4 space-y-1">
                <span className="text-[12px] font-bold text-[#1236a3] uppercase tracking-wider">
                  Recipient Preview
                </span>
                <p className="font-bold text-neutral-900 text-[15px]">{plan.primaryContactName}</p>
                <p className="text-neutral-600">{plan.primaryContactEmail}</p>
                <p className="text-neutral-500">{plan.clientName} ({plan.clientCode})</p>
              </div>

              <div className="rounded-[8px] border border-amber-200 bg-amber-50 p-3.5 text-amber-900 text-[12px]">
                <strong>Important Notice:</strong> Sending this plan will invite the client contact to review the schedule and allocate local escorts. Client acknowledgement of this audit plan does not constitute or guarantee certification grant.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsSendModalOpen(false)}
                className="h-11 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] font-medium text-neutral-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSendToClient}
                className="h-11 rounded-[8px] bg-[#1236a3] px-5 text-[14px] font-semibold text-white hover:bg-[#0e2a80]"
              >
                Confirm & Send Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Reschedule Audit Plan Modal */}
      {isRescheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-[12px] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
              <h3 className="text-[16px] font-bold text-neutral-900">
                Reschedule Audit Plan (v{plan.version} → v{plan.version + 1})
              </h3>
              <button
                type="button"
                onClick={() => setIsRescheduleModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 text-[20px] font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleConfirmReschedule} className="space-y-4 text-[14px]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-medium text-neutral-800 block mb-1">New Start Date *</label>
                  <input
                    type="date"
                    value={rescheduleStart}
                    onChange={(e) => setRescheduleStart(e.target.value)}
                    required
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-neutral-800 block mb-1">New End Date *</label>
                  <input
                    type="date"
                    value={rescheduleEnd}
                    onChange={(e) => setRescheduleEnd(e.target.value)}
                    required
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium text-neutral-800 block mb-1">Reason for Rescheduling *</label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  required
                  rows={3}
                  className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-3 text-[13px] text-neutral-900"
                />
              </div>

              <p className="text-[12px] text-neutral-400">
                Preserving prior version history and notifying lead auditor & client contact.
              </p>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsRescheduleModalOpen(false)}
                  className="h-11 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] font-medium text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-11 rounded-[8px] bg-[#1236a3] px-5 text-[14px] font-semibold text-white hover:bg-[#0e2a80]"
                >
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Add / Edit Activity Modal */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-[12px] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
              <h3 className="text-[16px] font-bold text-neutral-900">
                {editingActivity ? 'Edit Activity' : 'Add Agenda Activity'}
              </h3>
              <button
                type="button"
                onClick={() => setIsActivityModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 text-[20px] font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-4 text-[14px]">
              <div>
                <label className="text-[13px] font-medium text-neutral-800 block mb-1">Activity Title *</label>
                <input
                  type="text"
                  value={actTitle}
                  onChange={(e) => setActTitle(e.target.value)}
                  placeholder="e.g. Document review, Site tour"
                  required
                  className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[13px] font-medium text-neutral-800 block mb-1">Date *</label>
                  <input
                    type="date"
                    value={actDate}
                    onChange={(e) => setActDate(e.target.value)}
                    required
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-neutral-800 block mb-1">Start (AST) *</label>
                  <input
                    type="time"
                    value={actStartTime}
                    onChange={(e) => setActStartTime(e.target.value)}
                    required
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-neutral-800 block mb-1">End (AST) *</label>
                  <input
                    type="time"
                    value={actEndTime}
                    onChange={(e) => setActEndTime(e.target.value)}
                    required
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-medium text-neutral-800 block mb-1">Auditor *</label>
                  <select
                    value={actAuditors}
                    onChange={(e) => setActAuditors(e.target.value)}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900"
                  >
                    <option value="Alex Morgan">Alex Morgan</option>
                    <option value="Priya Desai">Priya Desai</option>
                    <option value="Omar Al-Farsi">Omar Al-Farsi</option>
                    <option value="Alex Morgan, Priya Desai">Alex Morgan, Priya Desai</option>
                  </select>
                </div>
                <div>
                  <label className="text-[13px] font-medium text-neutral-800 block mb-1">Duration (Hours) *</label>
                  <input
                    type="number"
                    step="0.5"
                    value={actDuration}
                    onChange={(e) => setActDuration(parseFloat(e.target.value) || 0)}
                    required
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                {editingActivity ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteActivity(editingActivity.id)
                      setIsActivityModalOpen(false)
                    }}
                    className="text-error-500 font-medium text-[13px] hover:underline"
                  >
                    Delete activity
                  </button>
                ) : <span />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsActivityModalOpen(false)}
                    className="h-11 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] font-medium text-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-11 rounded-[8px] bg-[#1236a3] px-5 text-[14px] font-semibold text-white hover:bg-[#0e2a80]"
                  >
                    Save Activity
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </CabLayout>
  )
}
