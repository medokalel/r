import type {
  Criterion,
  IssueCode,
  IssueCriterion,
  LocalizedText,
  RelationshipType,
  Severity,
  TeamRole,
  TeamSelectionSettings,
  UnavailabilityReason,
} from './catalog'

export type ParamValue = string | number | LocalizedText | ParamValue[] | null | undefined
export type IssueParams = Record<string, ParamValue>

export interface StandardRef {
  /** Standard number, for example `9001`. */
  key: string
  label: string
}

/** What a team is checked against: the audit's standards, scope, dates and place. */
export interface TeamContext {
  kind: 'plan' | 'application'
  auditPlanId: string | null
  applicationId: string | null
  reference: string
  organizationId: string | null
  clientName: string
  standards: StandardRef[]
  iafCodes: string[]
  startDate: Date | null
  endDate: Date | null
  country: string | null
  city: string | null
  languages: string[]
  settings: TeamSelectionSettings
  today: Date
}

export interface PersonBooking {
  planId: string
  planNumber: string
  start: Date
  end: Date
}

export interface PersonUnavailability {
  start: Date
  end: Date
  reason: UnavailabilityReason
}

export interface PersonRestriction {
  type: string
  details: string
  expiry: Date | null
}

export interface PersonRelationship {
  id: string
  type: RelationshipType
  startDate: Date | null
  endDate: Date | null
  reviewStatus: 'CONFIRMED' | 'PENDING' | 'DISMISSED'
}

export interface PersonScheme {
  standardKey: string
  codes: string[]
}

export type RegisterStatus = 'Authorized' | 'Expired' | 'Under review' | 'Pending'

/** A person from the personnel register with everything the rules need. */
export interface PersonRecord {
  id: string
  name: string
  jobTitle: string
  competenceRole: string
  active: boolean
  employmentEndDate: Date | null
  authorizationExpiry: Date | null
  registerStatus: RegisterStatus
  restrictions: PersonRestriction[]
  schemes: Map<string, PersonScheme>
  /** `standard|code` and `*|code` keys of critical IAF codes with a passed exam. */
  passedExams: Set<string>
  country: string
  languages: string[]
  baseCity: string | null
  baseCountry: string | null
  bookings: PersonBooking[]
  unavailability: PersonUnavailability[]
  relationships: PersonRelationship[]
  annualDeclarationValidUntil: Date | null
  auditDeclarationSigned: boolean
  /** Audit days in the workload window. */
  workloadDays: number
  /** Completed audits in the same IAF codes. */
  sectorAudits: number
}

export interface Alternative {
  personId: string
  name: string
  score: number
  role: TeamRole
}

export interface TeamIssue {
  code: IssueCode
  severity: Severity
  mandatory: boolean
  /** Blocking but not mandatory: can be accepted through an approved exception. */
  overridable: boolean
  criterion: IssueCriterion
  personId: string | null
  params: Record<string, string>
  message: LocalizedText
  alternatives: Alternative[]
  excepted: boolean
  exceptionId: string | null
}

export type CriterionStatus = 'pass' | 'partial' | 'warn' | 'fail' | 'na'

export interface CriterionResult {
  key: Criterion
  label: LocalizedText
  status: CriterionStatus
  message: LocalizedText
}

export type ScoreComponentKey =
  | 'competence'
  | 'availability'
  | 'workload'
  | 'experience'
  | 'location'
  | 'language'

export interface ScoreComponent {
  key: ScoreComponentKey
  score: number
  max: number
  explanation: LocalizedText
}

export interface CompetenceSummary {
  standardsCovered: string[]
  standardsMissing: string[]
  /** IAF codes the person can audit under this audit's standards. */
  auditorCodes: string[]
  /** IAF codes the person knows at all (enough for a technical expert). */
  anyCodes: string[]
  unexaminedCritical: string[]
  notes: Array<LocalizedText & { code: string }>
}

export interface Candidate {
  person: PersonRecord
  role: TeamRole
  eligible: boolean
  score: number
  components: ScoreComponent[]
  issues: TeamIssue[]
  criteria: CriterionResult[]
  competence: CompetenceSummary
}

export interface TeamMemberInput {
  personId: string | null
  name: string
  role: TeamRole
  person: PersonRecord | null
}

export type MemberStatus = 'ok' | 'warn' | 'block'

export interface MemberResult {
  personId: string | null
  name: string
  role: TeamRole
  registered: boolean
  status: MemberStatus
  issues: TeamIssue[]
  criteria: CriterionResult[]
}

export interface CoverageStandard {
  key: string
  label: string
  coveredBy: string[]
}

export interface CoverageCode {
  code: string
  critical: boolean
  coveredBy: Array<{ personId: string; via: 'auditor' | 'technicalExpert' }>
}

export interface CoverageMember {
  personId: string | null
  name: string
  role: TeamRole
  standards: string[]
  iafCodes: string[]
}

export interface TeamCoverage {
  standards: CoverageStandard[]
  iafCodes: CoverageCode[]
  members: CoverageMember[]
}

export interface TeamValidation {
  valid: boolean
  canConfirm: boolean
  blockingCount: number
  mandatoryBlockingCount: number
  overridableBlockingCount: number
  warningCount: number
  members: MemberResult[]
  teamIssues: TeamIssue[]
  coverage: TeamCoverage
}

export type ExceptionStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/** The part of an exception the rules need. */
export interface ExceptionRef {
  id: string
  issueCode: IssueCode
  personId: string | null
  status: ExceptionStatus
}
