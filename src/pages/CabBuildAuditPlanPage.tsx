import { useState, useEffect, useMemo } from 'react'
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useBuildAuditPlanTourSteps } from '@/config/buildAuditPlanTourSteps'
import { AppIcon, CalendarIcon, MoreIcon } from '@/components/icons'
import { AuditTravelCostsPanel } from '@/components/dashboard/cab/travelPolicy/AuditTravelCostsPanel'
import {
  fetchAuditPlanById,
  saveAuditPlan,
  AVAILABLE_AUDITORS_POOL,
  type AuditPlan,
  type AgendaActivity,
  type AuditStageType,
} from '@/lib/api/cabAuditPlanningApi'
import { createPlanEvent } from '@/lib/api/auditPlanLifecycleApi'
import {
  confirmPlanTeam,
  decideTeamException,
  fetchPlanTeam,
  listTeamEvents,
  requestTeamException,
  TeamSelectionError,
  validateTeamSelection,
  type TeamEvent,
  type TeamValidationResult,
} from '@/lib/api/teamSelectionApi'
import type { PlanAssignment } from '@/lib/teamSelection/personnel'
import { assignmentToTeamMember } from '@/lib/teamSelection/teamMember'
import {
  AuditStatusBadge,
  BreadcrumbChevron,
  CheckmarkSvg,
  IcascoConnectedStepper,
  auditDateLocale,
  isolateDate,
  auditStageLabel,
  formatIcascoDate,
} from '@/components/cab/auditPlanning/shared'
import { SelectField } from '@/components/ui/Select'
import { Toggle } from '@/components/ui/Toggle'
import { toast } from '@/lib/toast'
import { BuildPlanTeamStep } from '@/components/cab/auditPlanning/BuildPlanTeamStep'
import { BuildPlanReviewStep } from '@/components/cab/auditPlanning/BuildPlanReviewStep'
import {
  AgendaActivityModal,
  RescheduleAuditPlanModal,
} from '@/components/cab/auditPlanning/AuditPlanModals'
import { ROUTES, cabAuditExecutionPath } from '@/lib/routes'
import { cn } from '@/lib/utils'

type BuildStep = 1 | 2 | 3 | 4

function formatShortRange(start: string, end: string, locale = 'en-GB') {
  try {
    const fmt = (d: Date) => isolateDate(d.toLocaleDateString(locale, { day: '2-digit', month: 'short' }), locale)
    return `${fmt(new Date(start))} → ${fmt(new Date(end))}`
  } catch {
    return `${start} → ${end}`
  }
}

/** Order-independent signature of a team, used to tell whether it changed. */
function teamSignature(members: PlanAssignment[]): string {
  return members
    .map((member) => `${member.personId ?? member.name}:${member.role}`)
    .sort()
    .join('|')
}

export function CabBuildAuditPlanPage() {
  const { t, i18n } = useTranslation()
  const { planId } = useParams<{ planId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const tourSteps = useBuildAuditPlanTourSteps()

  const [plan, setPlan] = useState<AuditPlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeStep, setActiveStep] = useState<BuildStep>(
    searchParams.get('tab') === 'agenda' ? 2 : 1,
  )

  // Step 1: Team
  const [team, setTeam] = useState<PlanAssignment[]>([])
  const [savedTeam, setSavedTeam] = useState<PlanAssignment[]>([])
  const [savedConfirmed, setSavedConfirmed] = useState(false)
  const [confirmation, setConfirmation] = useState<{ by: string; at: string } | null>(null)
  const [validation, setValidation] = useState<{ key: string; result: TeamValidationResult | null } | null>(null)
  const [validationTick, setValidationTick] = useState(0)
  const [teamEvents, setTeamEvents] = useState<TeamEvent[]>([])
  const [auditTrailNote, setAuditTrailNote] = useState('')

  // Step 2: Agenda
  const [agenda, setAgenda] = useState<AgendaActivity[]>([])
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<AgendaActivity | null>(null)
  const [actTitle, setActTitle] = useState('')
  const [actDate, setActDate] = useState('2026-12-05')
  const [actStartTime, setActStartTime] = useState('09:00')
  const [actEndTime, setActEndTime] = useState('10:00')
  const [actAuditor, setActAuditor] = useState('Omar Hassan')
  const [actDuration, setActDuration] = useState(1.0)

  // Step 3: Site & logistics
  const [siteCode, setSiteCode] = useState('SITE-1101')
  const [siteName, setSiteName] = useState('ISSC Head Office')
  const [siteAddress, setSiteAddress] = useState('')
  const [onSitePersonnel, setOnSitePersonnel] = useState<string[]>([])
  const [remoteEnabled, setRemoteEnabled] = useState(false)
  const [remotePlatform, setRemotePlatform] = useState('Microsoft Teams')
  const [remoteNotes, setRemoteNotes] = useState('')
  const [travelNotes, setTravelNotes] = useState('')
  const [isEditingSite, setIsEditingSite] = useState(false)
  const [isEditingRemote, setIsEditingRemote] = useState(false)
  const [isEditingTravel, setIsEditingTravel] = useState(false)

  // Step 4: Review & send
  const [auditStage, setAuditStage] = useState<AuditStageType>('Stage 1')
  const [proposedStartDate, setProposedStartDate] = useState('2026-12-05')
  const [proposedEndDate, setProposedEndDate] = useState('2026-12-07')
  const [auditObjectives, setAuditObjectives] = useState('')
  const [scopeSummary, setScopeSummary] = useState('')
  const [availabilityConfirmed, setAvailabilityConfirmed] = useState(true)
  const [noConflictsDeclared, setNoConflictsDeclared] = useState(true)

  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      const data = await fetchAuditPlanById(planId || 'AUD-0310')
      if (data) {
        const planTeam = await fetchPlanTeam(data.id)
        setPlan(data)
        setTeam(planTeam.members)
        setSavedTeam(planTeam.members)
        setSavedConfirmed(planTeam.confirmed || (data.teamConfirmed ?? data.status !== 'Draft'))
        setConfirmation(planTeam.confirmedBy && planTeam.confirmedAt ? { by: planTeam.confirmedBy, at: planTeam.confirmedAt } : null)
        setTeamEvents(planTeam.events)
        setAuditTrailNote(data.auditTrailNote || '')
        setAgenda(data.agendaActivities || [])
        setSiteCode(data.siteAllocation?.siteCode || data.siteCode)
        setSiteName(data.siteAllocation?.siteName || data.siteName)
        setSiteAddress(data.siteAllocation?.siteAddress || data.siteAddress)
        setOnSitePersonnel(
          data.siteAllocation?.onSitePersonnel?.length
            ? data.siteAllocation.onSitePersonnel
            : planTeam.members.filter((m) => m.role !== 'OBSERVER').map((m) => m.name),
        )
        setRemoteEnabled(data.remoteActivities?.enabled ?? false)
        setRemotePlatform(data.remoteActivities?.platform || 'Microsoft Teams')
        setRemoteNotes(data.remoteActivities?.notes || '')
        setTravelNotes(data.travelNotes?.details || '')
        setAuditStage(data.stage)
        setProposedStartDate(data.proposedStartDate)
        setProposedEndDate(data.proposedEndDate)
        setAuditObjectives(data.auditObjectives)
        setScopeSummary(data.scopeSummary)
        setAvailabilityConfirmed(data.teamDeclarations?.availabilityConfirmed ?? true)
        setNoConflictsDeclared(data.teamDeclarations?.noConflictsDeclared ?? true)
        setActDate(data.proposedStartDate)
        setActAuditor(planTeam.members.find((m) => m.role === 'TEAM_LEADER')?.name ?? data.leadAuditor)
      }
      setIsLoading(false)
    }
    load()
  }, [planId])

  const teamMembers = useMemo(() => team.map(assignmentToTeamMember), [team])
  const leadAuditor = team.find((member) => member.role === 'TEAM_LEADER')?.name ?? ''

  const validationPlanId = plan?.id
  const validationKey = `${validationPlanId}|${teamSignature(team)}|${proposedStartDate}|${proposedEndDate}|${validationTick}`
  useEffect(() => {
    if (!validationPlanId) return
    let cancelled = false
    validateTeamSelection(validationPlanId, team, { startDate: proposedStartDate, endDate: proposedEndDate })
      .then((result) => {
        if (!cancelled) setValidation({ key: validationKey, result })
      })
      .catch(() => {
        if (!cancelled) setValidation({ key: validationKey, result: null })
      })
    return () => {
      cancelled = true
    }
  }, [validationKey, validationPlanId, team, proposedStartDate, proposedEndDate])
  const isValidating = validation?.key !== validationKey
  const teamCheck = validation?.result ?? null

  const showToast = (message: string, variant: 'success' | 'warning' = 'success') => {
    if (variant === 'warning') {
      toast.error(message)
    } else {
      toast.success(message)
    }
  }

  const updateTimesAndDuration = (start: string, end: string) => {
    setActStartTime(start)
    setActEndTime(end)
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    if (!Number.isNaN(sh) && !Number.isNaN(eh)) {
      const diff = (eh * 60 + (em || 0) - (sh * 60 + (sm || 0))) / 60
      if (diff > 0) setActDuration(Number(diff.toFixed(1)))
    }
  }

  const totalEffort = agenda.reduce((acc, cur) => acc + (cur.durationHours || 0), 0)

  const persistPlan = async (overrides?: Partial<AuditPlan>) => {
    if (!plan) return
    setIsSaving(true)
    try {
      const allTeamNames = teamMembers.filter((m) => m.role !== 'Observer').map((m) => m.name)
      const updated = await saveAuditPlan({
        id: plan.id,
        planNumber: plan.planNumber,
        stage: auditStage,
        proposedStartDate,
        proposedEndDate,
        auditTrailNote,
        auditObjectives,
        scopeSummary,
        totalEffortHours: totalEffort,
        siteCode,
        siteName,
        siteAddress,
        siteAllocation: {
          siteCode,
          siteName,
          onSitePersonnel: onSitePersonnel.length
            ? onSitePersonnel
            : allTeamNames.length
              ? allTeamNames
              : [leadAuditor],
          siteAddress,
        },
        remoteActivities: {
          enabled: remoteEnabled,
          activities: plan.remoteActivities?.activities || ['Document review'],
          platform: remotePlatform,
          notes: remoteNotes,
        },
        travelNotes: { details: travelNotes },
        teamDeclarations: { availabilityConfirmed, noConflictsDeclared },
        agendaActivities: agenda,
        ...overrides,
      })
      setPlan(updated)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextAgenda = editingActivity
      ? agenda.map((a) =>
          a.id === editingActivity.id
            ? { ...a, date: actDate, startTime: actStartTime, endTime: actEndTime, activity: actTitle, auditors: [actAuditor], durationHours: actDuration }
            : a,
        )
      : [
          ...agenda,
          { id: `act-${Date.now()}`, date: actDate, startTime: actStartTime, endTime: actEndTime, activity: actTitle, auditors: [actAuditor], durationHours: actDuration },
        ]
    setAgenda(nextAgenda)
    setIsActivityModalOpen(false)
    setEditingActivity(null)
    await persistPlan({ agendaActivities: nextAgenda })
    showToast(t('cab.buildAuditPlan.toast.activitySaved', 'Agenda activity saved.'))
  }

  const handleImportTemplate = async () => {
    const template: AgendaActivity[] = [
      { id: `act-${Date.now()}-1`, date: proposedStartDate, startTime: '09:00', endTime: '09:30', activity: t('cab.buildAuditPlan.template.opening', 'Opening meeting & confirmation of scope'), auditors: [leadAuditor], durationHours: 0.5 },
      { id: `act-${Date.now()}-2`, date: proposedStartDate, startTime: '09:30', endTime: '13:00', activity: t('cab.buildAuditPlan.template.documents', 'Documented information review (Scope, Policy, Objectives, Manual)'), auditors: [leadAuditor], durationHours: 3.5 },
      { id: `act-${Date.now()}-3`, date: proposedStartDate, startTime: '14:00', endTime: '17:00', activity: t('cab.buildAuditPlan.template.siteTour', 'Site tour, legal compliance & Stage 2 readiness check'), auditors: teamMembers.map((m) => m.name), durationHours: 3.0 },
      { id: `act-${Date.now()}-4`, date: proposedEndDate, startTime: '09:00', endTime: '10:00', activity: t('cab.buildAuditPlan.template.closing', 'Closing meeting & Stage 1 conclusions'), auditors: [leadAuditor], durationHours: 1.0 },
    ]
    setAgenda(template)
    await persistPlan({ agendaActivities: template })
    showToast(t('cab.buildAuditPlan.toast.templateImported', 'Standard iCASCO audit agenda template imported.'))
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

  const teamConfirmed = savedConfirmed && teamSignature(team) === teamSignature(savedTeam)
  const teamReady = Boolean(teamConfirmed && teamCheck?.canConfirm)
  // Mirrors the artifact: the reason Send to client (and starting) is blocked, or null when sending is allowed.
  const sendBlockedReason = (() => {
    if (isValidating || !teamCheck) return t('cab.buildAuditPlan.blocked.checking', 'Checking the audit team.')
    if (!teamCheck.canConfirm) {
      const count = Math.max(teamCheck.blockingCount, 1)
      return t('cab.buildAuditPlan.blocked.issues', 'Sending and starting are blocked: the team has {{count}} blocking issue(s), such as a scheduling conflict.', { count })
    }
    if (!team.some((member) => member.role === 'TEAM_LEADER')) {
      return t('cab.buildAuditPlan.blocked.noLeader', 'Sending and starting are blocked: the team has no team leader.')
    }
    if (!teamConfirmed) {
      return t('cab.buildAuditPlan.blocked.notConfirmed', 'Sending and starting are blocked: the audit team is not confirmed.')
    }
    return null
  })()
  const agendaReady = agenda.length > 0
  const siteReady = Boolean(siteCode && siteAddress.trim())
  const declarationsReady = availabilityConfirmed && noConflictsDeclared

  const stepsMeta = [
    { id: 1 as BuildStep, label: t('cab.buildAuditPlan.steps.team', 'Audit team'), completed: teamReady },
    { id: 2 as BuildStep, label: t('cab.buildAuditPlan.steps.agenda', 'Agenda'), completed: agendaReady },
    { id: 3 as BuildStep, label: t('cab.buildAuditPlan.steps.site', 'Site & logistics'), completed: siteReady },
    { id: 4 as BuildStep, label: t('cab.buildAuditPlan.steps.review', 'Review & send'), completed: teamReady && agendaReady && siteReady && declarationsReady },
  ]

  return (
    <CabLayout sidebarVariant="auditPlanning" tourId="cab-build-audit-plan" tourSteps={tourSteps}>
      <CabHeader
        title={t('cab.auditPlanning.title', 'Audit Planning')}
        subtitle={t('cab.auditPlanning.subtitle', 'Plan and manage audits across clients and sites.')}
        notificationCount={4}
      />

      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]" aria-label="breadcrumb">
          <Link to={ROUTES.workspace} className="font-light text-neutral-400 hover:text-primary">
            {t('cab.workspace.appHub', 'Application Hub')}
          </Link>
          <BreadcrumbChevron />
          <Link to={ROUTES.cabAuditPlanning} className="font-light text-neutral-400 hover:text-primary">
            {t('cab.sidebar.auditSchedule', 'Audit schedule')}
          </Link>
          <BreadcrumbChevron />
          <span className="font-medium text-neutral-700" dir="ltr">
            {plan.planNumber}
          </span>
        </nav>

        {/* Top Header */}
        <CabTourStep steps={tourSteps} stepId="build-plan-header">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[28px] font-bold leading-tight text-neutral-900">
                  {t('cab.buildAuditPlan.title', 'Build audit plan')}
                </h1>
                <AuditStatusBadge status={plan.status} />
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-neutral-600">
                <span className="font-bold text-primary">{plan.planNumber}</span>
                <span>·</span>
                <span className="font-medium text-neutral-800">{plan.clientName}</span>
                <span>·</span>
                <span>{auditStageLabel(t, auditStage)}</span>
                <span>·</span>
                <span dir="ltr">{formatShortRange(proposedStartDate, proposedEndDate, auditDateLocale(i18n.language))}</span>
                <span>·</span>
                <span>{plan.applicationNumber}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={async () => {
                  await persistPlan({ status: 'Draft' })
                  showToast(t('cab.buildAuditPlan.toast.draftSaved', 'Draft saved.'))
                }}
                disabled={isSaving}
                className="inline-flex h-11 items-center gap-2 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[13px] font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                <span>{isSaving ? t('common.saving', 'Saving...') : t('cab.buildAuditPlan.saveDraft', 'Save as Draft')}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsChangeModalOpen(true)}
                title={t('cab.buildAuditPlan.reschedule.tooltip', 'Reschedule plan')}
                className="inline-flex h-11 items-center gap-2 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[13px] font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                <AppIcon icon={CalendarIcon} size={18} />
                <span>{t('cab.buildAuditPlan.reschedule.button', 'Reschedule')}</span>
              </button>
            </div>
          </div>
        </CabTourStep>

        {/* iCASCO Connected 4-Step Wizard Stepper */}
        <CabTourStep steps={tourSteps} stepId="build-plan-tabs">
          <IcascoConnectedStepper
            steps={stepsMeta}
            activeStep={activeStep}
            onSelectStep={setActiveStep}
            rightSlot={
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#15803d]">
                <CheckmarkSvg size={15} />
                <span>{t('cab.buildAuditPlan.saved', 'Saved')}</span>
              </span>
            }
          />
        </CabTourStep>

        <RescheduleAuditPlanModal
          isOpen={isChangeModalOpen}
          startDate={proposedStartDate}
          endDate={proposedEndDate}
          onClose={() => setIsChangeModalOpen(false)}
          onConfirm={async (start, end, reason) => {
            await persistPlan({
              proposedStartDate: start,
              proposedEndDate: end,
              events: [...(plan.events ?? []), createPlanEvent('plan.rescheduled', reason)],
            })
            setProposedStartDate(start)
            setProposedEndDate(end)
            setIsChangeModalOpen(false)
            showToast(t('cab.buildAuditPlan.toast.rescheduled', 'Audit plan rescheduled.'))
          }}
        />

        {activeStep === 1 && (
          <BuildPlanTeamStep
            planId={plan.id}
            startDate={proposedStartDate}
            endDate={proposedEndDate}
            team={team}
            onChangeTeam={setTeam}
            validation={teamCheck}
            validationFailed={!isValidating && !teamCheck}
            isValidating={isValidating}
            confirmed={teamConfirmed}
            unsaved={teamSignature(team) !== teamSignature(savedTeam)}
            confirmation={confirmation}
            readOnly={plan.status === 'Completed'}
            auditTrailNote={auditTrailNote}
            events={teamEvents}
            refreshKey={validationTick}
            onChangeAuditTrailNote={setAuditTrailNote}
            onRequestException={async (issue, justification) => {
              try {
                await requestTeamException({
                  auditPlanId: plan.id,
                  personId: issue.personId,
                  issueCode: issue.code,
                  justification,
                  issueText: issue.message,
                })
                setTeamEvents(await listTeamEvents({ auditPlanId: plan.id }))
                setValidationTick((tick) => tick + 1)
                showToast(t('cab.auditPlanning.team.exception.requested', 'Exception requested. A CAB admin will review it.'))
                return true
              } catch (error) {
                toast.error(
                  error instanceof TeamSelectionError ? error.message : t('cab.auditPlanning.team.error', 'The team action failed. Try again.'),
                )
                return false
              }
            }}
            onDecideException={async (exceptionId, decision, notes) => {
              try {
                await decideTeamException(exceptionId, decision, notes)
                setTeamEvents(await listTeamEvents({ auditPlanId: plan.id }))
                setValidationTick((tick) => tick + 1)
                showToast(
                  decision === 'approve'
                    ? t('cab.auditPlanning.team.exceptions.approved', 'Exception approved.')
                    : t('cab.auditPlanning.team.exceptions.rejected', 'Exception rejected.'),
                )
                return true
              } catch (error) {
                toast.error(
                  error instanceof TeamSelectionError ? error.message : t('cab.auditPlanning.team.error', 'The team action failed. Try again.'),
                )
                return false
              }
            }}
            onConfirmTeam={async () => {
              try {
                const result = await confirmPlanTeam(
                  plan.id,
                  team.map(({ personId, name, role }) => ({ personId, name, role })),
                  auditTrailNote.trim() || undefined,
                )
                setTeam(result.members)
                setSavedTeam(result.members)
                setSavedConfirmed(true)
                setConfirmation(result.confirmedBy && result.confirmedAt ? { by: result.confirmedBy, at: result.confirmedAt } : null)
                setTeamEvents(result.events)
                setOnSitePersonnel(result.members.filter((member) => member.role !== 'OBSERVER').map((member) => member.name))
                const refreshed = await fetchAuditPlanById(plan.id)
                if (refreshed) setPlan(refreshed)
                setActiveStep(2)
                showToast(t('cab.auditPlanning.team.panel.confirmed', 'Audit team confirmed. The CAB and the assigned people were notified.'))
              } catch (error) {
                toast.error(
                  error instanceof TeamSelectionError ? error.message : t('cab.auditPlanning.team.error', 'The team action failed. Try again.'),
                )
              }
            }}
          />
        )}

        {activeStep === 2 && (
          <CabTourStep steps={tourSteps} stepId="build-plan-agenda-table">
            <section className="rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[16px] font-bold text-neutral-900">{t('cab.buildAuditPlan.agenda.title', 'Audit agenda')}</h2>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingActivity(null)
                      setActTitle('')
                      setActDate(proposedStartDate)
                      setActStartTime('09:00')
                      setActEndTime('10:00')
                      setActAuditor(leadAuditor)
                      setActDuration(1)
                      setIsActivityModalOpen(true)
                    }}
                    className="inline-flex h-10 items-center gap-1.5 rounded-[8px] bg-[#1236a3] px-4 text-[13px] font-semibold text-white transition hover:bg-[#0e2a80]"
                  >
                    <span>+</span>
                    <span>{t('cab.buildAuditPlan.agenda.add', 'Add activity')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleImportTemplate}
                    className="inline-flex h-10 items-center gap-1.5 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[13px] font-medium text-neutral-700 transition hover:bg-neutral-50"
                  >
                    <span>{t('cab.buildAuditPlan.agenda.importTemplate', 'Import template')}</span>
                  </button>
                </div>
              </div>

              <AgendaActivityModal
                isOpen={isActivityModalOpen}
                isEditing={Boolean(editingActivity)}
                planNumber={plan.planNumber}
                auditStage={auditStage}
                title={actTitle}
                date={actDate}
                startTime={actStartTime}
                endTime={actEndTime}
                auditor={actAuditor}
                duration={actDuration}
                teamMembers={teamMembers}
                onChangeTitle={setActTitle}
                onChangeDate={setActDate}
                onChangeTimes={updateTimesAndDuration}
                onChangeAuditor={setActAuditor}
                onChangeDuration={setActDuration}
                onDelete={
                  editingActivity
                    ? async () => {
                        const next = agenda.filter((a) => a.id !== editingActivity.id)
                        setAgenda(next)
                        setIsActivityModalOpen(false)
                        await persistPlan({ agendaActivities: next })
                      }
                    : undefined
                }
                onClose={() => setIsActivityModalOpen(false)}
                onSubmit={handleSaveActivity}
              />

              <div className="overflow-x-auto rounded-[8px] border border-[#ececec]">
                <table className="w-full border-collapse text-start text-[14px]">
                  <thead>
                    <tr className="bg-[#1236a3] text-white">
                      <th className="w-12 p-3.5 text-start text-[13px] font-medium">#</th>
                      <th className="p-3.5 text-start text-[13px] font-medium">{t('cab.buildAuditPlan.agenda.columns.date', 'Date')}</th>
                      <th className="p-3.5 text-start text-[13px] font-medium">{t('cab.buildAuditPlan.agenda.columns.time', 'Time (AST)')}</th>
                      <th className="p-3.5 text-start text-[13px] font-medium">{t('cab.buildAuditPlan.agenda.columns.activity', 'Activity')}</th>
                      <th className="p-3.5 text-start text-[13px] font-medium">{t('cab.buildAuditPlan.agenda.columns.auditors', 'Auditor(s)')}</th>
                      <th className="p-3.5 text-start text-[13px] font-medium">{t('cab.buildAuditPlan.agenda.columns.duration', 'Duration')}</th>
                      <th className="w-12 p-3.5 text-end text-[13px] font-medium" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f0]">
                    {agenda.map((item, idx) => (
                      <tr key={item.id} className={cn('transition-colors hover:bg-[#e8edfc]/40', idx % 2 === 1 ? 'bg-[#f9fafc]' : 'bg-white')}>
                        <td className="px-3.5 py-3 text-[13px] text-neutral-400">{idx + 1}</td>
                        <td className="px-3.5 py-3 text-[14px] font-medium text-neutral-800" dir="ltr">{formatIcascoDate(item.date, auditDateLocale(i18n.language))}</td>
                        <td className="px-3.5 py-3 text-[13px] text-neutral-600">{item.startTime} – {item.endTime}</td>
                        <td className="px-3.5 py-3 text-[14px] font-medium text-neutral-900">{item.activity}</td>
                        <td className="px-3.5 py-3 text-[13px] text-neutral-700">{item.auditors.join(', ')}</td>
                        <td className="px-3.5 py-3 text-[13px] font-semibold text-neutral-800">{item.durationHours.toFixed(1)} {t('cab.buildAuditPlan.agenda.hoursShort', 'h')}</td>
                        <td className="px-3.5 py-3 text-end">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingActivity(item)
                              setActDate(item.date)
                              setActStartTime(item.startTime)
                              setActEndTime(item.endTime)
                              setActTitle(item.activity)
                              setActAuditor(item.auditors[0] || leadAuditor)
                              setActDuration(item.durationHours)
                              setIsActivityModalOpen(true)
                            }}
                            className="inline-flex size-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                          >
                            <AppIcon icon={MoreIcon} size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[#ececec] bg-[#f8fafc] font-bold text-neutral-900">
                      <td colSpan={5} className="p-3.5 text-start text-[14px]">
                        {t('cab.buildAuditPlan.agenda.total', 'Total (reviewed duration: {{code}})', { code: plan.reviewedDurationCode || '' })}
                      </td>
                      <td className="p-3.5 text-start text-[14px] text-[#1236a3]">{totalEffort.toFixed(1)} {t('cab.buildAuditPlan.agenda.hoursShort', 'h')}</td>
                      <td className="p-3.5" />
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="mt-5 flex justify-end border-t border-[#f0f0f0] pt-4">
                <button
                  type="button"
                  onClick={async () => {
                    if (agenda.length === 0) {
                      showToast(t('cab.buildAuditPlan.warn.addActivityBeforeContinue', 'Please add at least one agenda activity before continuing.'), 'warning')
                      return
                    }
                    await persistPlan()
                    setActiveStep(3)
                    showToast(t('cab.buildAuditPlan.toast.agendaSaved', 'Agenda saved. Moving to Site & logistics.'))
                  }}
                  className="h-10 rounded-[8px] bg-[#1236a3] px-5 text-[13px] font-semibold text-white transition hover:bg-[#0e2a80]"
                >
                  {t('cab.buildAuditPlan.agenda.continue', 'Save & continue to Site & logistics →')}
                </button>
              </div>
            </section>
          </CabTourStep>
        )}

        {activeStep === 3 && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Site Allocation Card with Edit / Save toggle */}
            <section className="space-y-4 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
              <div className="flex items-center justify-between border-b border-[#ececec] pb-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-[16px] font-bold text-neutral-900">{t('cab.buildAuditPlan.site.title', 'Site allocation')}</h3>
                  <span className="rounded-[4px] bg-[#e8edfc] px-2.5 py-0.5 text-[11px] font-semibold text-[#1236a3]">
                    1 site
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (isEditingSite) {
                      await persistPlan()
                      showToast(t('cab.buildAuditPlan.toast.siteSaved', 'Site allocation saved.'))
                    }
                    setIsEditingSite((prev) => !prev)
                  }}
                  className="text-[13px] font-semibold text-[#1236a3] hover:underline"
                >
                  {isEditingSite ? t('common.save', 'Save') : t('common.edit', 'Edit')}
                </button>
              </div>

              <div className="space-y-3 text-[13px]">
                <div>
                  <label className="mb-1 block font-medium text-neutral-700">{t('cab.buildAuditPlan.site.code', 'Site code *')}</label>
                  <input
                    type="text"
                    value={siteCode}
                    disabled={!isEditingSite}
                    onChange={(e) => setSiteCode(e.target.value)}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] disabled:bg-[#f9fafc] disabled:text-neutral-600 focus:border-[#1236a3] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-neutral-700">{t('cab.buildAuditPlan.site.name', 'Site name *')}</label>
                  <input
                    type="text"
                    value={siteName}
                    disabled={!isEditingSite}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] disabled:bg-[#f9fafc] disabled:text-neutral-600 focus:border-[#1236a3] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-neutral-700">{t('cab.buildAuditPlan.site.personnel', 'On-site personnel')}</label>
                  {isEditingSite ? (
                    <div className="space-y-2 rounded-[8px] border border-[#e2e2e2] bg-white p-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        {onSitePersonnel.map((person) => (
                          <span
                            key={person}
                            className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#e8edfc] px-2.5 py-1 text-[12px] font-medium text-[#1236a3]"
                          >
                            <span>{person}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setOnSitePersonnel((prev) => prev.filter((p) => p !== person))
                              }
                              className="font-bold text-[#1236a3] hover:text-error-600"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <SelectField
                        value=""
                        placeholder={t('cab.buildAuditPlan.site.addAuditor', '+ Add on-site auditor')}
                        onChange={(val) => {
                          if (val && !onSitePersonnel.includes(val)) {
                            setOnSitePersonnel((prev) => [...prev, val])
                          }
                        }}
                        options={AVAILABLE_AUDITORS_POOL.filter(
                          (a) => !onSitePersonnel.includes(a.name),
                        ).map((a) => ({ value: a.name, label: `${a.name} (${a.role})` }))}
                        className="h-9"
                      />
                    </div>
                  ) : (
                    <p className="rounded-[8px] border border-[#f0f0f0] bg-[#f9fafc] px-3 py-2.5 text-[13px] font-medium text-neutral-800">
                      {onSitePersonnel.length
                        ? onSitePersonnel.join(', ')
                        : teamMembers.map((m) => m.name).join(', ')}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block font-medium text-neutral-700">{t('cab.buildAuditPlan.site.address', 'Site address *')}</label>
                  <textarea
                    value={siteAddress}
                    disabled={!isEditingSite}
                    onChange={(e) => setSiteAddress(e.target.value)}
                    rows={3}
                    className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-3 text-[13px] disabled:bg-[#f9fafc] disabled:text-neutral-600 focus:border-[#1236a3] focus:outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Remote Activities Card with Edit / Save + Include remote toggle */}
            <section className="space-y-4 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
              <div className="flex items-center justify-between border-b border-[#ececec] pb-2.5">
                <h3 className="text-[16px] font-bold text-neutral-900">{t('cab.buildAuditPlan.remote.title', 'Remote activities')}</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-neutral-500">{t('cab.buildAuditPlan.remote.include', 'Include remote')}</span>
                    <Toggle
                      size="sm"
                      checked={remoteEnabled}
                      onChange={(next) => {
                        setRemoteEnabled(next)
                        if (next) setIsEditingRemote(true)
                      }}
                      aria-label={t('cab.buildAuditPlan.remote.include', 'Include remote')}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (isEditingRemote) {
                        await persistPlan()
                        showToast(t('cab.buildAuditPlan.toast.remoteSaved', 'Remote activities saved.'))
                      }
                      setIsEditingRemote((prev) => !prev)
                    }}
                    className="text-[13px] font-semibold text-[#1236a3] hover:underline"
                  >
                    {isEditingRemote ? t('common.save', 'Save') : t('common.edit', 'Edit')}
                  </button>
                </div>
              </div>
              <div className="space-y-3 text-[13px]">
                <div>
                  <label className="mb-1 block font-medium text-neutral-700">{t('cab.buildAuditPlan.remote.platform', 'ICT Platform')}</label>
                  <SelectField
                    value={remotePlatform}
                    onChange={setRemotePlatform}
                    disabled={!isEditingRemote && !remoteEnabled}
                    options={['Microsoft Teams', 'Zoom', 'Google Meet']}
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-neutral-700">
                    {t('cab.buildAuditPlan.remote.notes', 'Remote audit notes (IAF MD 4)')}
                  </label>
                  <textarea
                    value={remoteNotes}
                    disabled={!isEditingRemote && !remoteEnabled}
                    onChange={(e) => setRemoteNotes(e.target.value)}
                    rows={4}
                    placeholder={t('cab.buildAuditPlan.remote.placeholder', 'Specify ICT tools, connectivity check, and confidentiality agreements...')}
                    className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-3 text-[13px] disabled:bg-[#f9fafc] disabled:text-neutral-600 focus:border-[#1236a3] focus:outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Travel & Logistics Card with Edit / Save toggle */}
            <section className="space-y-4 rounded-[12px] border border-[#ececec] bg-white p-5 shadow-none">
              <div className="flex items-center justify-between border-b border-[#ececec] pb-2.5">
                <h3 className="text-[16px] font-bold text-neutral-900">{t('cab.buildAuditPlan.travel.title', 'Travel notes')}</h3>
                <button
                  type="button"
                  onClick={async () => {
                    if (isEditingTravel) {
                      await persistPlan()
                      showToast(t('cab.buildAuditPlan.toast.travelSaved', 'Travel & logistics saved.'))
                    }
                    setIsEditingTravel((prev) => !prev)
                  }}
                  className="text-[13px] font-semibold text-[#1236a3] hover:underline"
                >
                  {isEditingTravel ? t('common.save', 'Save') : t('common.edit', 'Edit')}
                </button>
              </div>
              <div className="space-y-3 text-[13px]">
                <label className="block font-medium text-neutral-700">
                  {t('cab.buildAuditPlan.travel.notes', 'Travel, accommodation & site entry notes')}
                </label>
                <textarea
                  value={travelNotes}
                  disabled={!isEditingTravel}
                  onChange={(e) => setTravelNotes(e.target.value)}
                  rows={6}
                  placeholder={t('cab.buildAuditPlan.travel.placeholder', 'Record flight/transport arrangements, PPE requirements, and arrival instructions...')}
                  className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-3 text-[13px] disabled:bg-[#f9fafc] disabled:text-neutral-600 focus:border-[#1236a3] focus:outline-none"
                />
              </div>
                <AuditTravelCostsPanel
                  siteName={siteName}
                  siteAddress={siteAddress}
                  country={plan.country}
                  teamNames={teamMembers.map((member) => member.name)}
                  firstDay={proposedStartDate}
                  lastDay={proposedEndDate}
                  remoteEnabled={remoteEnabled}
                  saved={plan.travelEstimate}
                  onSave={async (travelEstimate) => {
                    const updated = await saveAuditPlan({ id: plan.id, travelEstimate })
                    setPlan(updated)
                  }}
                />
            </section>

            <div className="flex justify-end lg:col-span-3">
              <button
                type="button"
                onClick={async () => {
                  if (!siteCode.trim() || !siteAddress.trim()) {
                    showToast(t('cab.buildAuditPlan.warn.siteBeforeContinue', 'Please complete site code and site address before continuing.'), 'warning')
                    return
                  }
                  await persistPlan()
                  setActiveStep(4)
                  showToast(t('cab.buildAuditPlan.toast.siteLogisticsSaved', 'Site & logistics saved. Moving to Review & send.'))
                }}
                className="h-10 rounded-[8px] bg-[#1236a3] px-5 text-[13px] font-semibold text-white transition hover:bg-[#0e2a80]"
              >
                {t('cab.buildAuditPlan.site.continue', 'Save & continue to Review & send →')}
              </button>
            </div>
          </div>
        )}

        {activeStep === 4 && (
          <BuildPlanReviewStep
            plan={plan}
            tourSteps={tourSteps}
            auditStage={auditStage}
            proposedStartDate={proposedStartDate}
            proposedEndDate={proposedEndDate}
            leadAuditor={leadAuditor}
            teamMembers={teamMembers}
            siteCode={siteCode}
            auditObjectives={auditObjectives}
            scopeSummary={scopeSummary}
            availabilityConfirmed={availabilityConfirmed}
            noConflictsDeclared={noConflictsDeclared}
            teamReady={teamReady}
            agendaReady={agendaReady}
            siteReady={siteReady}
            declarationsReady={declarationsReady}
            sendBlockedReason={sendBlockedReason}
            onGoToStep={setActiveStep}
            onPlanChanged={setPlan}
            onStartExecution={async () => {
              if (!teamReady || !agendaReady || !siteReady || !declarationsReady) {
                showToast(t('cab.buildAuditPlan.warn.completeAllFirst', 'Complete Audit team, Agenda, Site & logistics, and Team declarations first.'), 'warning')
                return
              }
              await persistPlan()
              navigate(cabAuditExecutionPath(plan.planNumber))
            }}
            onOpenChangeModal={() => setIsChangeModalOpen(true)}
            onChangeObjectives={setAuditObjectives}
            onChangeScope={setScopeSummary}
            onChangeAvailability={setAvailabilityConfirmed}
            onChangeNoConflicts={setNoConflictsDeclared}
            onChangeTimezone={async (timezone) => {
              const updated = await saveAuditPlan({ id: plan.id, timezone })
              setPlan(updated)
            }}
            onSaveDraft={async () => {
              await persistPlan({ status: 'Draft' })
              showToast(t('cab.buildAuditPlan.toast.draftSaved', 'Draft saved.'))
            }}
            onSendToClient={async () => {
              if (!teamReady) {
                showToast(t('cab.buildAuditPlan.warn.confirmTeam', 'Please confirm the audit team first.'), 'warning')
                return
              }
              if (!agendaReady) {
                showToast(t('cab.buildAuditPlan.warn.addActivity', 'Please add at least one agenda activity first.'), 'warning')
                return
              }
              if (!siteReady) {
                showToast(t('cab.buildAuditPlan.warn.completeSite', 'Please complete site & logistics details first.'), 'warning')
                return
              }
              if (!declarationsReady) {
                showToast(t('cab.buildAuditPlan.warn.confirmDeclarations', 'Please confirm all team declarations before sending.'), 'warning')
                return
              }
              await persistPlan({
                status: 'Planned',
                events: [...(plan.events ?? []), createPlanEvent('plan.sent')],
                execution: {
                  ...plan.execution,
                  preparation: {
                    ...plan.execution.preparation,
                    agreementActive: true,
                    planSentToClient: true,
                    // Sending only hands the plan to the client; the status stays
                    // "pending client" until the client confirms it (phase 2).
                    // Re-sending (e.g. after a reschedule) voids the client's
                    // previous decision, so they decide on the latest version.
                    planConfirmedByClient: false,
                    clientResponse: null,
                    declarationsCompleted: true,
                  },
                },
              })
              showToast(t('cab.buildAuditPlan.toast.sent', 'Audit plan sent to client.'))
            }}
          />
        )}
      </main>
    </CabLayout>
  )
}
