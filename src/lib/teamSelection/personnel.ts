import type { AuditPlan } from '@/lib/api/cabAuditPlanningApi'
import { DEFAULT_SETTINGS, STANDARD_IAF_CODES, type TeamRole, type TeamSelectionSettings } from './catalog'
import { PERSONNEL_SEED, type PersonnelSeedEntry } from './personnelSeed'
import { ANNUAL_DECLARATION_VALID_UNTIL, RELATIONSHIPS_SEED, UNAVAILABILITY_SEED } from './registerSeed'
import { auditLanguagesFor, isCriticalCode, standardKeyOf, toUtcDate } from './rules'
import type { PersonBooking, PersonRecord, StandardRef, TeamContext } from './types'

/**
 * Builds the inputs the rules need from the personnel register and the audit plans:
 * the team context of a plan, and a record for every person with their bookings,
 * workload, experience and impartiality history.
 */

const DAY_MS = 86_400_000
const AUDIT_COMPETENCE_ROLES = ['Lead Auditor', 'Auditor', 'Technical Expert']

export interface PlanAssignment {
  personId: string | null
  name: string
  role: TeamRole
}

export interface ExtraBooking {
  personId: string
  planNumber: string
  start: string
  end: string
}

const normalise = (value: string): string => value.trim().toLowerCase()

export const findSeedPersonByName = (name: string): PersonnelSeedEntry | undefined =>
  PERSONNEL_SEED.find((person) => normalise(person.name) === normalise(name))

/** IAF codes of the given standards (for example `['9001', '14001']`), sorted and unique. */
export function iafCodesForStandards(standardKeys: string[]): string[] {
  return [
    ...new Set(
      Object.entries(STANDARD_IAF_CODES)
        .filter(([key]) => standardKeys.includes(key))
        .flatMap(([, codes]) => codes),
    ),
  ].sort()
}

/** Standards named in a text such as `ISO 9001:2015, ISO/IEC 27001:2022`. */
export function parseStandards(standardName: string): StandardRef[] {
  const matches = standardName.match(/ISO(?:\/IEC)?\s*\d{4,5}/gi) ?? []
  return [
    ...new Map(
      matches.map((match) => [
        standardKeyOf(match),
        { key: standardKeyOf(match), label: match.toUpperCase().replace(/\s+/g, ' ') },
      ]),
    ).values(),
  ]
}

/** The standards of a plan: its `standards` list and any standard named in its title. */
export function standardsOfPlan(plan: Pick<AuditPlan, 'standardName' | 'standards'>): StandardRef[] {
  return parseStandards([...(plan.standards ?? []), plan.standardName].join(', '))
}

export function buildPlanContext(
  plan: AuditPlan,
  settings: TeamSelectionSettings = DEFAULT_SETTINGS,
  overrides: { startDate?: string; endDate?: string } = {},
  now: Date = new Date(),
): TeamContext {
  const standards = standardsOfPlan(plan)
  const start = overrides.startDate ?? plan.proposedStartDate
  const end = overrides.endDate ?? plan.proposedEndDate
  return {
    kind: 'plan',
    auditPlanId: plan.id,
    applicationId: null,
    reference: plan.planNumber,
    organizationId: null,
    clientName: plan.clientName,
    standards,
    iafCodes: iafCodesForStandards(standards.map((standard) => standard.key)),
    startDate: start ? toUtcDate(start) : null,
    endDate: end ? toUtcDate(end) : null,
    country: plan.country || null,
    city: null,
    languages: auditLanguagesFor(plan.country),
    settings,
    today: toUtcDate(now.toISOString()),
  }
}

/** The saved team of a plan, or the one implied by its lead auditor and team names. */
export function planAssignments(plan: AuditPlan, saved: PlanAssignment[] | undefined): PlanAssignment[] {
  if (saved?.length) return saved
  const names = [...new Set([plan.leadAuditor, ...plan.auditTeam].filter(Boolean))]
  return names.map((name) => {
    const person = findSeedPersonByName(name)
    const role: TeamRole =
      name === plan.leadAuditor ? 'TEAM_LEADER' : person?.competenceRole === 'Technical Expert' ? 'TECHNICAL_EXPERT' : 'AUDITOR'
    return { personId: person?.id ?? null, name, role }
  })
}

/** Critical codes pass the exam requirement, except one deliberate gap in the demo data. */
function passedExamsOf(person: PersonnelSeedEntry): Set<string> {
  const passed = new Set<string>()
  for (const code of person.iafCodes.filter(isCriticalCode)) {
    if (person.id === 'emp-0003' && code === '28') continue
    passed.add(`*|${code}`)
    for (const standard of person.standards) passed.add(`${standardKeyOf(standard)}|${code}`)
  }
  return passed
}

interface BuildPeopleInput {
  context: TeamContext
  plans: AuditPlan[]
  savedAssignments: Record<string, PlanAssignment[]>
  extraBookings?: ExtraBooking[]
  /** Only these people; defaults to everyone who can audit. */
  ids?: string[]
}

export function buildPersonRecords({
  context,
  plans,
  savedAssignments,
  extraBookings = [],
  ids,
}: BuildPeopleInput): PersonRecord[] {
  const { today, settings } = context
  const buffer = settings.travelBufferDays
  const windowStart = new Date(today.getTime() - settings.workloadWindowDays * DAY_MS)
  const otherPlans = plans.filter((plan) => plan.id !== context.auditPlanId)

  return PERSONNEL_SEED.filter((person) =>
    ids ? ids.includes(person.id) : AUDIT_COMPETENCE_ROLES.includes(person.competenceRole),
  ).map((person): PersonRecord => {
    const plansOfPerson = otherPlans.filter((plan) =>
      planAssignments(plan, savedAssignments[plan.id]).some((assignment) => assignment.personId === person.id),
    )

    const bookings: PersonBooking[] =
      context.startDate && context.endDate
        ? [
            ...plansOfPerson
              .filter((plan) => plan.status !== 'Completed')
              .map((plan) => ({
                planId: plan.id,
                planNumber: plan.planNumber,
                start: toUtcDate(plan.proposedStartDate),
                end: toUtcDate(plan.proposedEndDate),
              })),
            ...extraBookings
              .filter((booking) => booking.personId === person.id)
              .map((booking) => ({
                planId: booking.planNumber,
                planNumber: booking.planNumber,
                start: toUtcDate(booking.start),
                end: toUtcDate(booking.end),
              })),
          ].filter(
            (booking) =>
              booking.start <= new Date(context.endDate!.getTime() + buffer * DAY_MS) &&
              booking.end >= new Date(context.startDate!.getTime() - buffer * DAY_MS),
          )
        : []

    const workloadDays = plansOfPerson
      .filter((plan) => plan.status !== 'Draft')
      .reduce((total, plan) => {
        const start = Math.max(toUtcDate(plan.proposedStartDate).getTime(), windowStart.getTime())
        const end = Math.min(toUtcDate(plan.proposedEndDate).getTime(), today.getTime())
        return end < start ? total : total + Math.round((end - start) / DAY_MS) + 1
      }, 0)

    const sectorAudits = plansOfPerson.filter((plan) => {
      if (plan.status !== 'Completed') return false
      const planStandards = standardsOfPlan(plan)
      const planCodes = iafCodesForStandards(planStandards.map((standard) => standard.key))
      return (
        planCodes.some((code) => context.iafCodes.includes(code)) ||
        context.standards.some((standard) => planStandards.some((own) => own.key === standard.key))
      )
    }).length

    const authorizationExpiry = toUtcDate(person.authorizedUntil)

    return {
      id: person.id,
      name: person.name,
      jobTitle: person.jobRole,
      competenceRole: person.competenceRole,
      active: true,
      employmentEndDate: null,
      authorizationExpiry,
      registerStatus: authorizationExpiry < today ? 'Expired' : person.standards.length ? 'Authorized' : 'Under review',
      restrictions: [],
      schemes: new Map(
        person.standards.map((standard) => [standard, { standardKey: standardKeyOf(standard), codes: person.iafCodes }]),
      ),
      passedExams: passedExamsOf(person),
      country: person.country,
      languages: person.languages,
      baseCity: person.baseCity || null,
      baseCountry: person.country || null,
      bookings,
      unavailability: UNAVAILABILITY_SEED.filter((entry) => entry.personId === person.id).map((entry) => ({
        start: toUtcDate(entry.startDate),
        end: toUtcDate(entry.endDate),
        reason: entry.reason,
      })),
      relationships: RELATIONSHIPS_SEED.filter(
        (entry) => entry.personId === person.id && normalise(entry.clientName) === normalise(context.clientName),
      ).map((entry) => ({
        id: entry.id,
        type: entry.type,
        startDate: entry.startDate ? toUtcDate(entry.startDate) : null,
        endDate: entry.endDate ? toUtcDate(entry.endDate) : null,
        reviewStatus: entry.reviewStatus,
      })),
      annualDeclarationValidUntil: person.standards.length ? toUtcDate(ANNUAL_DECLARATION_VALID_UNTIL) : null,
      auditDeclarationSigned: false,
      workloadDays,
      sectorAudits,
    }
  })
}
