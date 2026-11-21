import type { AuditTeamMember } from '@/lib/api/cabAuditPlanningApi'
import type { TeamRole } from './catalog'
import { PERSONNEL_SEED, type PersonnelSeedEntry } from './personnelSeed'
import type { PlanAssignment } from './personnel'

/** Role label stored on a plan's team member list. */
export const TEAM_MEMBER_ROLE: Record<TeamRole, AuditTeamMember['role']> = {
  TEAM_LEADER: 'Lead Auditor',
  AUDITOR: 'Auditor',
  TECHNICAL_EXPERT: 'Technical Expert',
  TRAINEE: 'Trainee Auditor',
  OBSERVER: 'Observer',
}

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

/** A register person as the summary shown in the plan's team list. */
export function personToTeamMember(person: PersonnelSeedEntry, role: AuditTeamMember['role']): AuditTeamMember {
  return {
    id: person.id,
    name: person.name,
    initials: person.initials,
    role,
    passesChecks: true,
    schemes: person.standards,
    iafCodes: person.iafCodes,
    country: person.country,
  }
}

/** The plan's team list entry for a team assignment (people outside the register keep only their name). */
export function assignmentToTeamMember(assignment: PlanAssignment): AuditTeamMember {
  const role = TEAM_MEMBER_ROLE[assignment.role]
  const person = PERSONNEL_SEED.find((candidate) => candidate.id === assignment.personId)
  return person
    ? personToTeamMember(person, role)
    : {
        id: assignment.personId ?? `external-${assignment.name}`,
        name: assignment.name,
        initials: initialsOf(assignment.name),
        role,
        passesChecks: false,
        schemes: [],
        iafCodes: [],
        country: '',
      }
}

/** Everyone in the register who can audit, for places that still list auditors by name. */
export const AUDITOR_REGISTER: AuditTeamMember[] = PERSONNEL_SEED.filter((person) =>
  ['Lead Auditor', 'Auditor', 'Technical Expert'].includes(person.competenceRole),
).map((person) => personToTeamMember(person, person.competenceRole as AuditTeamMember['role']))
