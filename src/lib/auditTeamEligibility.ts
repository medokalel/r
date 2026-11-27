import type { AuditTeamMember } from '@/lib/api/cabAuditPlanningApi'
import { AUDITOR_BUSY_PERIODS, AUDITOR_IMPARTIALITY_RECORDS } from '@/lib/auditTeamMockData'

// These two types are no longer exported by cabAuditPlanningApi (the team selector moved to lib/teamSelection);
// they are declared here so these rules still compile.
export type TeamIssueCode = string
export interface TeamException {
  personId: string
  issueCode: TeamIssueCode
  status: string
}

/**
 * Pure rules that decide whether an audit team member can be used on a plan.
 * Kept free of React/i18n so they can be unit-tested and later swapped for the
 * server-side competence, availability and impartiality checks.
 */

export interface TeamCheckContext {
  standards: string[]
  startDate: string
  endDate: string
  clientCode: string
}

export interface TeamIssue {
  code: TeamIssueCode
  /** `blocking` issues must be fixed or covered by an exception before the team is confirmed. */
  severity: 'blocking'
  /** Values for the translated message. */
  params: Record<string, string>
}

export interface MemberEvaluation {
  member: AuditTeamMember
  issues: TeamIssue[]
}

/** Roles that audit on their own authority and therefore need scheme competence. */
const COMPETENCE_ROLES: ReadonlySet<AuditTeamMember['role']> = new Set([
  'Lead Auditor',
  'Auditor',
  'Technical Expert',
])

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  if (!aStart || !aEnd) return false
  return aStart <= bEnd && bStart <= aEnd
}

export function evaluateMember(member: AuditTeamMember, ctx: TeamCheckContext): MemberEvaluation {
  const issues: TeamIssue[] = []

  if (COMPETENCE_ROLES.has(member.role) && ctx.standards.length > 0) {
    const missing = ctx.standards.filter((standard) => !member.schemes.includes(standard))
    // A lead auditor must cover every standard; other roles need at least one.
    const lacksCompetence =
      member.role === 'Lead Auditor' ? missing.length > 0 : missing.length === ctx.standards.length
    if (lacksCompetence) {
      issues.push({
        code: 'COMPETENCE',
        severity: 'blocking',
        params: { standards: missing.join(', ') },
      })
    }
  }

  const busy = (AUDITOR_BUSY_PERIODS[member.id] ?? []).find((period) =>
    rangesOverlap(ctx.startDate, ctx.endDate, period.start, period.end),
  )
  if (busy) {
    issues.push({
      code: 'AVAILABILITY',
      severity: 'blocking',
      params: { reason: busy.reason, start: busy.start, end: busy.end },
    })
  }

  const conflict = (AUDITOR_IMPARTIALITY_RECORDS[member.id] ?? []).find(
    (record) => record.clientCode === ctx.clientCode,
  )
  if (conflict) {
    issues.push({
      code: 'IMPARTIALITY',
      severity: 'blocking',
      params: { reason: conflict.reason },
    })
  }

  return { member, issues }
}

/** Standards no member of the team can cover (team-level competence gap). */
export function uncoveredStandards(members: AuditTeamMember[], standards: string[]): string[] {
  const auditing = members.filter((m) => COMPETENCE_ROLES.has(m.role))
  return standards.filter((standard) => !auditing.some((m) => m.schemes.includes(standard)))
}

export function findException(
  exceptions: TeamException[],
  personId: string,
  code: TeamIssueCode,
): TeamException | undefined {
  return exceptions.find(
    (e) => e.personId === personId && e.issueCode === code && e.status !== 'Rejected',
  )
}

export interface TeamCheckSummary {
  evaluations: MemberEvaluation[]
  uncovered: string[]
  /** Blocking issues that are neither fixed nor covered by an exception. */
  unresolvedCount: number
}

export function summarizeTeam(
  members: AuditTeamMember[],
  ctx: TeamCheckContext,
  exceptions: TeamException[],
): TeamCheckSummary {
  const evaluations = members.map((member) => evaluateMember(member, ctx))
  const uncovered = uncoveredStandards(members, ctx.standards)
  const unresolvedMemberIssues = evaluations.reduce(
    (total, evaluation) =>
      total +
      evaluation.issues.filter((issue) => !findException(exceptions, evaluation.member.id, issue.code))
        .length,
    0,
  )
  return {
    evaluations,
    uncovered,
    unresolvedCount: unresolvedMemberIssues + (uncovered.length > 0 ? 1 : 0),
  }
}
