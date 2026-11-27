import {
  fetchAuditPlanById,
  fetchAuditPlans,
  saveAuditPlan,
  type AuditPlan,
} from '@/lib/api/cabAuditPlanningApi'
import {
  DEFAULT_SETTINGS,
  ISSUE_CATALOG,
  type IssueCode,
  type LocalizedText,
  type TeamRole,
  type TeamSelectionSettings,
} from '@/lib/teamSelection/catalog'
import {
  buildPersonRecords,
  buildPlanContext,
  planAssignments,
  type ExtraBooking,
  type PlanAssignment,
} from '@/lib/teamSelection/personnel'
import { rankCandidates, suggestRole, toIsoDate, validateTeam, isCriticalCode } from '@/lib/teamSelection/rules'
import { PERSONNEL_SEED } from '@/lib/teamSelection/personnelSeed'
import { UNAVAILABILITY_SEED } from '@/lib/teamSelection/registerSeed'
import { assignmentToTeamMember } from '@/lib/teamSelection/teamMember'
import { getAuthSession } from '@/lib/authStorage'
import { validateRulesDraft } from '@/lib/teamRulesView'
import type {
  Candidate,
  ExceptionStatus,
  PersonRecord,
  TeamContext,
  TeamMemberInput,
  TeamValidation,
} from '@/lib/teamSelection/types'

/**
 * Audit team selection API. Runs on the local demo backend (personnel register,
 * audit plans and a small store kept in localStorage) with the same calls and
 * results the real service will provide.
 */

// ---------------------------------------------------------------- types

export interface TeamSelectionException {
  id: string
  auditPlanId: string | null
  personId: string | null
  issueCode: IssueCode
  issueText: LocalizedText
  justification: string
  status: ExceptionStatus
  requestedBy: string
  /** Stable id of the requester (user id or email). Missing on exceptions saved before this field existed. */
  requestedById?: string | null
  requestedAt: string
  decidedBy: string | null
  decidedById?: string | null
  decidedAt: string | null
  decisionNotes: string | null
}

export type TeamEventAction =
  | 'TEAM_CONFIRMED'
  | 'CONFIRM_BLOCKED'
  | 'MEMBER_ADDED'
  | 'MEMBER_ROLE_CHANGED'
  | 'MEMBER_REMOVED'
  | 'EXCEPTION_REQUESTED'
  | 'EXCEPTION_APPROVED'
  | 'EXCEPTION_REJECTED'
  | 'SETTINGS_UPDATED'

export interface TeamEvent {
  id: string
  action: TeamEventAction
  auditPlanId: string | null
  personId: string | null
  actor: string
  createdAt: string
  details: Record<string, unknown>
}

export interface TeamMemberRequest {
  personId: string | null
  name?: string
  role: TeamRole
}

export interface TeamDateOverrides {
  startDate?: string
  endDate?: string
}

export interface PublicTeamContext {
  auditPlanId: string | null
  reference: string
  clientName: string
  standards: TeamContext['standards']
  iafCodes: Array<{ code: string; critical: boolean }>
  startDate: string | null
  endDate: string | null
  country: string | null
  city: string | null
  languages: string[]
  settings: TeamSelectionSettings
}

export interface RecommendedCandidate {
  personId: string
  name: string
  jobTitle: string
  competenceRole: string
  role: TeamRole
  suggestedRole: TeamRole
  eligible: boolean
  rank: number
  score: number
  components: Candidate['components']
  criteria: Candidate['criteria']
  issues: Candidate['issues']
  coveredStandards: string[]
  coveredIafCodes: string[]
  unexaminedCriticalCodes: string[]
  languages: string[]
  baseCity: string | null
  workloadDays: number
  sectorAudits: number
}

export interface TeamRecommendations {
  context: PublicTeamContext
  role: TeamRole
  candidates: RecommendedCandidate[]
}

export interface TeamValidationResult extends TeamValidation {
  context: PublicTeamContext
  exceptions: TeamSelectionException[]
}

export interface PlanTeam {
  auditPlanId: string
  planNumber: string
  status: AuditPlan['status']
  confirmed: boolean
  confirmedAt: string | null
  confirmedBy: string | null
  members: PlanAssignment[]
  context: PublicTeamContext
  validation: TeamValidation
  exceptions: TeamSelectionException[]
  events: TeamEvent[]
}

export class TeamSelectionError extends Error {
  readonly status: number
  readonly code?: string
  readonly validation?: TeamValidation

  constructor(message: string, status: number, code?: string, validation?: TeamValidation) {
    super(message)
    this.name = 'TeamSelectionError'
    this.status = status
    this.code = code
    this.validation = validation
  }
}

// ---------------------------------------------------------------- store

interface TeamSelectionStore {
  settings: TeamSelectionSettings
  assignments: Record<string, PlanAssignment[]>
  confirmations: Record<string, { at: string; by: string }>
  exceptions: TeamSelectionException[]
  events: TeamEvent[]
  extraBookings: ExtraBooking[]
}

const STORAGE_KEY = 'icasco-team-selection-v1'
/** Who the demo backend records as the acting user. */
const DEMO_ACTOR = 'Mohamed El Manawahly'
/**
 * Who is acting: the signed-in user from the auth session (same source as the other
 * CAB APIs). The fixed demo name is only the fallback when no session user exists.
 * Note: the second approver rule below runs in the browser against local demo data.
 * It is not server security; the real service must enforce it with its own authentication.
 */
type SessionUser = { id?: string; name?: string; fullName?: string; email?: string }

/** Display name of the acting user (for showing in lists and the audit trail only). */
export function getActingAdmin(): string {
  const user = getAuthSession()?.user as SessionUser | undefined
  return user?.fullName?.trim() || user?.name?.trim() || user?.email?.trim() || DEMO_ACTOR
}

/** Stable identity used for the second approver check: user id, else email. Never the display name. */
export function getActingAdminId(): string | null {
  const user = getAuthSession()?.user as SessionUser | undefined
  return user?.id?.trim() || user?.email?.trim().toLowerCase() || null
}

/**
 * Whether the acting user is the one who requested this exception. Compares stable ids when the
 * exception has one. Older exceptions saved without an id fall back to the display name.
 */
export function isRequesterOf(exception: Pick<TeamSelectionException, 'requestedBy' | 'requestedById'>): boolean {
  const actorId = getActingAdminId()
  if (exception.requestedById) return actorId !== null && actorId === exception.requestedById
  return exception.requestedBy === getActingAdmin()
}

let cachedStore: TeamSelectionStore | null = null

function readSavedStore(): Partial<TeamSelectionStore> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Partial<TeamSelectionStore>
  } catch {
    return {}
  }
}

function loadStore(): TeamSelectionStore {
  if (cachedStore) return cachedStore
  const saved = readSavedStore()
  cachedStore = {
    settings: { ...DEFAULT_SETTINGS, ...saved.settings },
    assignments: saved.assignments ?? {},
    confirmations: saved.confirmations ?? {},
    exceptions: saved.exceptions ?? [],
    events: saved.events ?? [],
    extraBookings: saved.extraBookings ?? [],
  }
  return cachedStore
}

function persistStore(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loadStore()))
  } catch {
    // Storage can be unavailable (private mode, quota); the in-memory copy keeps working.
  }
}

const makeId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}${Math.round(Math.random() * 1e6).toString(36)}`

function recordEvent(event: Omit<TeamEvent, 'id' | 'actor' | 'createdAt'>): void {
  loadStore().events.unshift({ id: makeId('evt'), actor: getActingAdmin(), createdAt: new Date().toISOString(), ...event })
}

/** Test helper: forget the in-memory copy so the next call reads storage again. */
export function resetTeamSelectionStore(): void {
  cachedStore = null
}

// ---------------------------------------------------------------- helpers

async function loadPlan(planIdOrNumber: string): Promise<AuditPlan> {
  const plan = await fetchAuditPlanById(planIdOrNumber)
  if (!plan) throw new TeamSelectionError('Audit plan not found.', 404)
  return plan
}

function toPublicContext(context: TeamContext): PublicTeamContext {
  return {
    auditPlanId: context.auditPlanId,
    reference: context.reference,
    clientName: context.clientName,
    standards: context.standards,
    iafCodes: context.iafCodes.map((code) => ({ code, critical: isCriticalCode(code) })),
    startDate: context.startDate ? toIsoDate(context.startDate) : null,
    endDate: context.endDate ? toIsoDate(context.endDate) : null,
    country: context.country,
    city: context.city,
    languages: context.languages,
    settings: context.settings,
  }
}

const exceptionsOf = (planId: string): TeamSelectionException[] =>
  loadStore().exceptions.filter((exception) => exception.auditPlanId === planId)

const toRefs = (exceptions: TeamSelectionException[]) =>
  exceptions.map(({ id, issueCode, personId, status }) => ({ id, issueCode, personId, status }))

async function loadSelectionData(plan: AuditPlan, overrides: TeamDateOverrides = {}) {
  const store = loadStore()
  const plans = await fetchAuditPlans()
  const context = buildPlanContext(plan, store.settings, overrides)
  const pool = buildPersonRecords({
    context,
    plans,
    savedAssignments: store.assignments,
    extraBookings: store.extraBookings,
  })
  return { store, context, pool }
}

function resolveMembers(members: TeamMemberRequest[], pool: PersonRecord[]): TeamMemberInput[] {
  return members.map((member) => {
    const person = member.personId ? (pool.find((candidate) => candidate.id === member.personId) ?? null) : null
    if (member.personId && !person) throw new TeamSelectionError('Team member not found.', 404)
    return { personId: member.personId ?? null, name: person?.name ?? member.name ?? '', role: member.role, person }
  })
}

// ---------------------------------------------------------------- calls

export async function fetchTeamRecommendations(
  planIdOrNumber: string,
  role: TeamRole,
  options: TeamDateOverrides & { exclude?: string[] } = {},
): Promise<TeamRecommendations> {
  const plan = await loadPlan(planIdOrNumber)
  const { context, pool } = await loadSelectionData(plan, options)
  const excluded = new Set(options.exclude ?? [])
  const ranked = rankCandidates(
    pool.filter((person) => !excluded.has(person.id)),
    role,
    context,
    toRefs(exceptionsOf(plan.id)),
  )
  return {
    context: toPublicContext(context),
    role,
    candidates: ranked.map((candidate, index) => ({
      personId: candidate.person.id,
      name: candidate.person.name,
      jobTitle: candidate.person.jobTitle,
      competenceRole: candidate.person.competenceRole,
      role,
      suggestedRole: suggestRole(candidate.person),
      eligible: candidate.eligible,
      rank: index + 1,
      score: candidate.score,
      components: candidate.components,
      criteria: candidate.criteria,
      issues: candidate.issues,
      coveredStandards: candidate.competence.standardsCovered,
      coveredIafCodes: role === 'TECHNICAL_EXPERT' ? candidate.competence.anyCodes : candidate.competence.auditorCodes,
      unexaminedCriticalCodes: candidate.competence.unexaminedCritical,
      languages: candidate.person.languages,
      baseCity: candidate.person.baseCity,
      workloadDays: candidate.person.workloadDays,
      sectorAudits: candidate.person.sectorAudits,
    })),
  }
}

export async function validateTeamSelection(
  planIdOrNumber: string,
  members: TeamMemberRequest[],
  options: TeamDateOverrides = {},
): Promise<TeamValidationResult> {
  const plan = await loadPlan(planIdOrNumber)
  const { context, pool } = await loadSelectionData(plan, options)
  const exceptions = exceptionsOf(plan.id)
  const validation = validateTeam(context, resolveMembers(members, pool), { exceptions: toRefs(exceptions), pool })
  return { context: toPublicContext(context), ...validation, exceptions }
}

async function describePlanTeam(plan: AuditPlan): Promise<PlanTeam> {
  const { store, context, pool } = await loadSelectionData(plan)
  const members = planAssignments(plan, store.assignments[plan.id])
  const exceptions = exceptionsOf(plan.id)
  const validation = validateTeam(context, resolveMembers(members, pool), { exceptions: toRefs(exceptions), pool })
  const confirmation = store.confirmations[plan.id]
  return {
    auditPlanId: plan.id,
    planNumber: plan.planNumber,
    status: plan.status,
    confirmed: Boolean(confirmation),
    confirmedAt: confirmation?.at ?? null,
    confirmedBy: confirmation?.by ?? null,
    members,
    context: toPublicContext(context),
    validation,
    exceptions,
    events: store.events.filter((event) => event.auditPlanId === plan.id).slice(0, 50),
  }
}

export async function fetchPlanTeam(planIdOrNumber: string): Promise<PlanTeam> {
  return describePlanTeam(await loadPlan(planIdOrNumber))
}

const ROLE_ORDER: TeamRole[] = ['TEAM_LEADER', 'AUDITOR', 'TECHNICAL_EXPERT', 'TRAINEE', 'OBSERVER']

export async function confirmPlanTeam(
  planIdOrNumber: string,
  members: TeamMemberRequest[],
  note?: string,
): Promise<PlanTeam> {
  const plan = await loadPlan(planIdOrNumber)
  if (plan.status === 'Completed') {
    throw new TeamSelectionError('The team of a completed audit cannot be changed.', 409)
  }

  const { store, context, pool } = await loadSelectionData(plan)
  const resolved = resolveMembers(members, pool)
  const validation = validateTeam(context, resolved, { exceptions: toRefs(exceptionsOf(plan.id)) })

  if (!validation.canConfirm) {
    recordEvent({
      action: 'CONFIRM_BLOCKED',
      auditPlanId: plan.id,
      personId: null,
      details: {
        issues: [...validation.teamIssues, ...validation.members.flatMap((member) => member.issues)]
          .filter((issue) => issue.severity === 'block' && !issue.excepted)
          .map((issue) => ({ code: issue.code, personId: issue.personId })),
      },
    })
    persistStore()
    throw new TeamSelectionError(
      'The team cannot be confirmed: resolve the blocking issues first (mandatory competence, scheduling and impartiality requirements cannot be overridden).',
      422,
      'TEAM_BLOCKED',
      validation,
    )
  }

  const nextTeam: PlanAssignment[] = [...resolved]
    .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role))
    .map(({ personId, name, role }) => ({ personId, name, role }))
  const previousTeam = planAssignments(plan, store.assignments[plan.id])
  const keyOf = (member: PlanAssignment) => member.personId ?? member.name

  for (const member of nextTeam) {
    const before = previousTeam.find((candidate) => keyOf(candidate) === keyOf(member))
    if (!before) {
      recordEvent({ action: 'MEMBER_ADDED', auditPlanId: plan.id, personId: member.personId, details: { name: member.name, role: member.role } })
    } else if (before.role !== member.role) {
      recordEvent({
        action: 'MEMBER_ROLE_CHANGED',
        auditPlanId: plan.id,
        personId: member.personId,
        details: { name: member.name, role: member.role, from: before.role },
      })
    }
  }
  for (const member of previousTeam) {
    if (!nextTeam.some((candidate) => keyOf(candidate) === keyOf(member))) {
      recordEvent({ action: 'MEMBER_REMOVED', auditPlanId: plan.id, personId: member.personId, details: { name: member.name, role: member.role } })
    }
  }

  store.assignments[plan.id] = nextTeam
  store.confirmations[plan.id] = { at: new Date().toISOString(), by: getActingAdmin() }

  const onSiteNames = nextTeam.filter((member) => member.role !== 'OBSERVER').map((member) => member.name)
  const updated = await saveAuditPlan({
    id: plan.id,
    planNumber: plan.planNumber,
    leadAuditor: nextTeam.find((member) => member.role === 'TEAM_LEADER')?.name ?? plan.leadAuditor,
    auditTeam: onSiteNames,
    teamMembers: nextTeam.map(assignmentToTeamMember),
    teamConfirmed: true,
    teamDeclarations: { ...plan.teamDeclarations, availabilityConfirmed: true, noConflictsDeclared: true },
    siteAllocation: plan.siteAllocation ? { ...plan.siteAllocation, onSitePersonnel: onSiteNames } : plan.siteAllocation,
  })

  recordEvent({
    action: 'TEAM_CONFIRMED',
    auditPlanId: plan.id,
    personId: null,
    details: { team: nextTeam, warnings: validation.warningCount, ...(note ? { note } : {}) },
  })
  persistStore()
  return describePlanTeam(updated)
}

export async function listTeamExceptions(
  filters: { auditPlanId?: string; status?: ExceptionStatus } = {},
): Promise<TeamSelectionException[]> {
  const planId = filters.auditPlanId ? (await fetchAuditPlanById(filters.auditPlanId))?.id : undefined
  return loadStore().exceptions.filter(
    (exception) => (!filters.status || exception.status === filters.status) && (!planId || exception.auditPlanId === planId),
  )
}

/** Issue codes that an exception can cover: blocking but not mandatory. */
export const OVERRIDABLE_ISSUE_CODES: IssueCode[] = (Object.keys(ISSUE_CATALOG) as IssueCode[]).filter(
  (code) => ISSUE_CATALOG[code].severity === 'block' && !ISSUE_CATALOG[code].mandatory,
)

export async function requestTeamException(request: {
  auditPlanId: string
  personId?: string | null
  issueCode: IssueCode
  justification: string
  /** The message the user saw for the issue; without it the generic catalog text is used. */
  issueText?: LocalizedText
}): Promise<TeamSelectionException> {
  if (!OVERRIDABLE_ISSUE_CODES.includes(request.issueCode)) {
    throw new TeamSelectionError(
      'EXCEPTION_NOT_ALLOWED: mandatory competence, scheduling and impartiality requirements cannot be overridden.',
      400,
      'EXCEPTION_NOT_ALLOWED',
    )
  }
  const plan = await loadPlan(request.auditPlanId)
  const store = loadStore()
  const personId = request.personId ?? null

  const existing = store.exceptions.some(
    (exception) =>
      exception.issueCode === request.issueCode &&
      exception.personId === personId &&
      exception.auditPlanId === plan.id &&
      exception.status !== 'REJECTED',
  )
  if (existing) {
    throw new TeamSelectionError('An exception for this issue is already pending or approved.', 409, 'EXCEPTION_EXISTS')
  }

  const definition = ISSUE_CATALOG[request.issueCode]
  const exception: TeamSelectionException = {
    id: makeId('tex'),
    auditPlanId: plan.id,
    personId,
    issueCode: request.issueCode,
    issueText: request.issueText ?? {
      en: definition.en.replace(/\{\{name\}\}/g, 'The person').replace(/\{\{\w+\}\}/g, '…'),
      ar: definition.ar.replace(/\{\{name\}\}/g, 'الشخص').replace(/\{\{\w+\}\}/g, '…'),
    },
    justification: request.justification,
    status: 'PENDING',
    requestedBy: getActingAdmin(),
    requestedById: getActingAdminId(),
    requestedAt: new Date().toISOString(),
    decidedBy: null,
    decidedAt: null,
    decisionNotes: null,
  }
  store.exceptions.unshift(exception)
  recordEvent({
    action: 'EXCEPTION_REQUESTED',
    auditPlanId: plan.id,
    personId,
    details: { exceptionId: exception.id, issueCode: exception.issueCode, justification: exception.justification },
  })
  persistStore()
  return exception
}

export async function decideTeamException(
  exceptionId: string,
  decision: 'approve' | 'reject',
  notes?: string,
): Promise<TeamSelectionException> {
  const store = loadStore()
  const exception = store.exceptions.find((candidate) => candidate.id === exceptionId)
  if (!exception) throw new TeamSelectionError('Exception not found.', 404)
  if (exception.status !== 'PENDING') {
    throw new TeamSelectionError(`This exception is already ${exception.status.toLowerCase()}.`, 409)
  }
  if (decision === 'reject' && !notes?.trim()) {
    throw new TeamSelectionError('A reason is required to reject an exception.', 400)
  }
  if (store.settings.exceptionSecondApprover && isRequesterOf(exception)) {
    throw new TeamSelectionError(
      'SECOND_APPROVER_REQUIRED: the admin who requested an exception cannot decide it. Another CAB admin must approve or reject it.',
      403,
      'SECOND_APPROVER_REQUIRED',
    )
  }

  exception.status = decision === 'approve' ? 'APPROVED' : 'REJECTED'
  exception.decidedBy = getActingAdmin()
  exception.decidedById = getActingAdminId()
  exception.decidedAt = new Date().toISOString()
  exception.decisionNotes = notes?.trim() || null
  recordEvent({
    action: decision === 'approve' ? 'EXCEPTION_APPROVED' : 'EXCEPTION_REJECTED',
    auditPlanId: exception.auditPlanId,
    personId: exception.personId,
    details: { exceptionId: exception.id, issueCode: exception.issueCode },
  })
  persistStore()
  return exception
}

export async function listTeamEvents(
  filters: { auditPlanId?: string; personId?: string } = {},
): Promise<TeamEvent[]> {
  const planId = filters.auditPlanId ? (await fetchAuditPlanById(filters.auditPlanId))?.id : undefined
  return loadStore().events.filter(
    (event) => (!planId || event.auditPlanId === planId) && (!filters.personId || event.personId === filters.personId),
  )
}

export async function getTeamSelectionSettings(): Promise<TeamSelectionSettings> {
  return { ...loadStore().settings }
}

export async function updateTeamSelectionSettings(
  changes: Partial<TeamSelectionSettings>,
): Promise<TeamSelectionSettings> {
  const store = loadStore()
  const problems = validateRulesDraft({ ...store.settings, ...changes })
  if (problems.length) {
    throw new TeamSelectionError(
      `INVALID_SETTINGS: ${problems.map((problem) => `${problem.key} (${problem.code})`).join(', ')}.`,
      400,
      'INVALID_SETTINGS',
    )
  }
  const details = Object.fromEntries(
    (Object.entries(changes) as Array<[keyof TeamSelectionSettings, unknown]>)
      .filter(([key, value]) => store.settings[key] !== value)
      .map(([key, value]) => [key, { from: store.settings[key], to: value }]),
  )
  store.settings = { ...store.settings, ...changes }
  if (Object.keys(details).length) {
    recordEvent({ action: 'SETTINGS_UPDATED', auditPlanId: null, personId: null, details })
  }
  persistStore()
  return { ...store.settings }
}

// ---------------------------------------------------------------- availability calendar

export interface TeamAvailabilityData {
  people: Array<{ id: string; name: string; role: string }>
  bookings: Array<{
    personId: string
    planNumber: string
    clientName: string
    start: string
    end: string
    confirmed: boolean
  }>
  unavailability: Array<{ personId: string; start: string; end: string; reason: string }>
}

/**
 * Everything the availability calendar draws, from the same sources the team
 * selection rules use: unavailability records and the teams of the audit plans.
 */
export async function fetchTeamAvailability(): Promise<TeamAvailabilityData> {
  const store = loadStore()
  const plans = await fetchAuditPlans()
  const people = PERSONNEL_SEED.filter((person) =>
    ['Lead Auditor', 'Auditor', 'Technical Expert'].includes(person.competenceRole),
  ).map((person) => ({ id: person.id, name: person.name, role: person.competenceRole }))

  const bookings: TeamAvailabilityData['bookings'] = []
  for (const plan of plans) {
    if (!plan.proposedStartDate) continue
    for (const assignment of planAssignments(plan, store.assignments[plan.id])) {
      if (!assignment.personId) continue
      bookings.push({
        personId: assignment.personId,
        planNumber: plan.planNumber,
        clientName: plan.clientName,
        start: plan.proposedStartDate,
        end: plan.proposedEndDate || plan.proposedStartDate,
        // Same rule as the Build Audit Plan page: a saved team confirmation, or the plan's own flag.
        confirmed: Boolean(store.confirmations[plan.id]) || (plan.teamConfirmed ?? plan.status !== 'Draft'),
      })
    }
  }
  for (const extra of store.extraBookings) {
    bookings.push({
      personId: extra.personId,
      planNumber: extra.planNumber,
      clientName: '',
      start: extra.start,
      end: extra.end,
      confirmed: true,
    })
  }

  return {
    people,
    bookings,
    unavailability: UNAVAILABILITY_SEED.map((entry) => ({
      personId: entry.personId,
      start: entry.startDate,
      end: entry.endDate,
      reason: entry.reason,
    })),
  }
}
