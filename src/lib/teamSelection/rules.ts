import {
  AUDITOR_JOB_TITLES,
  COMPETENCE_ROLES,
  CONFLICT_RELATIONSHIPS,
  COOLING_OFF_RELATIONSHIPS,
  CRITERIA_LABELS,
  CRITERIA_ORDER,
  CRITERIA_PASS_MESSAGES,
  CRITICAL_IAF_CODES,
  EXPERIENCE_CAP,
  ISSUE_CATALOG,
  LEAD_JOB_TITLES,
  NOT_CHECKED_MESSAGE,
  RELATIONSHIP_LABELS,
  ROLE_LABELS,
  SCORE_WEIGHTS,
  UNAVAILABILITY_LABELS,
  type Criterion,
  type IssueCode,
  type IssueDefinition,
  type LocalizedText,
  type Severity,
  type TeamRole,
} from './catalog'
import type {
  Alternative,
  Candidate,
  CompetenceSummary,
  CoverageCode,
  CriterionResult,
  ExceptionRef,
  IssueParams,
  MemberResult,
  ParamValue,
  PersonRecord,
  PersonRelationship,
  ScoreComponent,
  TeamContext,
  TeamIssue,
  TeamMemberInput,
  TeamValidation,
} from './types'

/**
 * Rules that decide whether a person can join an audit team, how well they fit,
 * and whether a whole team can be confirmed. Pure functions: no React, no i18n,
 * no storage. Messages are produced in English and Arabic.
 */

const DAY_MS = 86_400_000

export const toUtcDate = (iso: string): Date => new Date(`${iso.slice(0, 10)}T00:00:00.000Z`)
export const toIsoDate = (date: Date | null): string => (date ? date.toISOString().slice(0, 10) : '')
const addDays = (date: Date, days: number): Date => new Date(date.getTime() + days * DAY_MS)
const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date.getTime())
  result.setUTCMonth(result.getUTCMonth() + months)
  return result
}
const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean =>
  aStart <= bEnd && bStart <= aEnd
const normalise = (value: unknown): string => String(value ?? '').trim().toLowerCase()

export const isCriticalCode = (code: string): boolean => CRITICAL_IAF_CODES.includes(code)

/** `ISO 9001` and `ISO/IEC 27001` become `9001` and `27001`. */
export const standardKeyOf = (value: string): string =>
  value.match(/(\d{4,5})/)?.[1] ?? value.trim().toUpperCase()

// ---------------------------------------------------------------- languages & places

const ARAB_REGION = [
  'sa',
  'saudi arabia',
  'eg',
  'egypt',
  'ae',
  'united arab emirates',
  'jo',
  'jordan',
  'kw',
  'kuwait',
  'qa',
  'qatar',
  'bh',
  'bahrain',
  'om',
  'oman',
]

const COUNTRY_ALIASES: Record<string, string> = {
  sa: 'saudi arabia',
  eg: 'egypt',
  ae: 'united arab emirates',
  jo: 'jordan',
  kw: 'kuwait',
  qa: 'qatar',
  bh: 'bahrain',
  om: 'oman',
  tr: 'turkey',
}

/** Audit languages for a client country: the main language first. */
export const auditLanguagesFor = (country: string | null | undefined): string[] =>
  ARAB_REGION.includes(normalise(country)) ? ['ar', 'en'] : ['en']

const canonicalCountry = (country: string): string => COUNTRY_ALIASES[normalise(country)] ?? normalise(country)

// ---------------------------------------------------------------- messages

const LIST_SEPARATOR = { en: ', ', ar: '، ' } as const

function localise(value: ParamValue, language: 'en' | 'ar'): string {
  if (Array.isArray(value)) return value.map((item) => localise(item, language)).join(LIST_SEPARATOR[language])
  if (value && typeof value === 'object') return value[language] ?? value.en ?? ''
  if (value === null || value === undefined) return ''
  return String(value)
}

function interpolate(template: string, params: IssueParams, language: 'en' | 'ar'): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => localise(params[key], language))
}

interface IssueOptions {
  severity?: Severity
  personId?: string | null
  alternatives?: Alternative[]
}

export function createIssue(code: IssueCode, params: IssueParams = {}, options: IssueOptions = {}): TeamIssue {
  const definition: IssueDefinition = ISSUE_CATALOG[code]
  const severity = options.severity ?? definition.severity
  return {
    code,
    severity,
    mandatory: definition.mandatory,
    overridable: severity === 'block' && !definition.mandatory,
    criterion: definition.criterion,
    personId: options.personId ?? null,
    params: Object.fromEntries(Object.entries(params).map(([key, value]) => [key, localise(value, 'en')])),
    message: {
      en: interpolate(definition.en, params, 'en'),
      ar: interpolate(definition.ar, params, 'ar'),
    },
    alternatives: options.alternatives ?? [],
    excepted: false,
    exceptionId: null,
  }
}

const roleName = (role: TeamRole): LocalizedText => ({
  en: ROLE_LABELS[role].en.toLowerCase(),
  ar: ROLE_LABELS[role].ar,
})

// ---------------------------------------------------------------- roles

/** Whether the person's register entry qualifies them for the role. */
export function canPerformRole(person: PersonRecord, role: TeamRole): boolean {
  if (role === 'OBSERVER' || role === 'TRAINEE') return true
  const title = person.jobTitle ?? ''
  const isLead = LEAD_JOB_TITLES.includes(title) || person.competenceRole === 'Lead Auditor'
  const isAuditor = isLead || AUDITOR_JOB_TITLES.includes(title) || person.competenceRole === 'Auditor'
  if (role === 'TEAM_LEADER') return isLead
  if (role === 'AUDITOR') return isAuditor
  return isAuditor || person.competenceRole === 'Technical Expert'
}

/** The highest audit role the person qualifies for. */
export function suggestRole(person: PersonRecord): TeamRole {
  const roles: TeamRole[] = ['TEAM_LEADER', 'AUDITOR', 'TECHNICAL_EXPERT']
  return roles.find((role) => canPerformRole(person, role)) ?? 'OBSERVER'
}

// ---------------------------------------------------------------- competence

/** Which of the audit's standards and IAF codes a person is approved for. */
export function computeCompetence(person: PersonRecord, context: TeamContext): CompetenceSummary {
  const standardKeys = context.standards.map((standard) => standard.key)
  const covered = new Set<string>()
  const auditorCodes = new Set<string>()
  const anyCodes = new Set<string>()
  const unexamined = new Set<string>()
  const notes: CompetenceSummary['notes'] = []

  for (const { standardKey, codes } of person.schemes.values()) {
    const inScope = standardKeys.includes(standardKey)
    const schemeLabel = String(standardKey).replace(/_/g, ' ')
    if (inScope) covered.add(standardKey)

    for (const code of codes) {
      if (!context.iafCodes.includes(code)) continue
      const passed = person.passedExams.has(`${standardKey}|${code}`)

      if (inScope) {
        if (isCriticalCode(code) && !passed) {
          notes.push({
            code,
            en: `IAF ${code} is critical and has no passed exam under ${schemeLabel}`,
            ar: `الرمز ${code} حرج ولا يوجد له اختبار ناجح ضمن ${schemeLabel}`,
          })
        }
      } else {
        notes.push({
          code,
          en: `approved for IAF ${code} under ${schemeLabel} only, not under this audit's standard`,
          ar: `معتمد للرمز ${code} ضمن ${schemeLabel} فقط، وليس ضمن مواصفة هذا التدقيق`,
        })
      }

      if (!isCriticalCode(code) || passed) {
        anyCodes.add(code)
        if (inScope) auditorCodes.add(code)
      } else if (person.passedExams.has(`*|${code}`)) {
        anyCodes.add(code)
      } else {
        unexamined.add(code)
      }
    }
  }

  return {
    standardsCovered: standardKeys.filter((key) => covered.has(key)),
    standardsMissing: standardKeys.filter((key) => !covered.has(key)),
    auditorCodes: context.iafCodes.filter((code) => auditorCodes.has(code)),
    anyCodes: context.iafCodes.filter((code) => anyCodes.has(code)),
    unexaminedCritical: context.iafCodes.filter((code) => unexamined.has(code) && !anyCodes.has(code)),
    notes,
  }
}

const standardLabels = (context: TeamContext, keys: string[]): string[] =>
  keys.map((key) => context.standards.find((standard) => standard.key === key)?.label ?? key)

// ---------------------------------------------------------------- impartiality

function evaluateRelationship(
  person: PersonRecord,
  relationship: PersonRelationship,
  context: TeamContext,
): TeamIssue | null {
  if (relationship.reviewStatus === 'DISMISSED') return null

  const reference = context.startDate ?? context.today
  const type = RELATIONSHIP_LABELS[relationship.type] ?? RELATIONSHIP_LABELS.OTHER
  const ongoing = !relationship.endDate || relationship.endDate >= reference
  const options = { personId: person.id }

  if (CONFLICT_RELATIONSHIPS.includes(relationship.type) && ongoing) {
    return createIssue(
      'IMPARTIALITY_CONFLICT',
      { name: person.name, type, until: { en: ' (ongoing)', ar: ' (قائمة)' } },
      options,
    )
  }

  if (COOLING_OFF_RELATIONSHIPS.includes(relationship.type) && relationship.endDate) {
    const coolingOffEnd = addMonths(relationship.endDate, context.settings.coolingOffMonths)
    return coolingOffEnd >= reference
      ? createIssue(
          'IMPARTIALITY_CONFLICT',
          {
            name: person.name,
            type,
            until: {
              en: ` (ended ${toIsoDate(relationship.endDate)}; cooling-off until ${toIsoDate(coolingOffEnd)})`,
              ar: ` (انتهت في ${toIsoDate(relationship.endDate)}، وفترة التهدئة حتى ${toIsoDate(coolingOffEnd)})`,
            },
          },
          options,
        )
      : createIssue(
          'IMPARTIALITY_DECLARED',
          { name: person.name, type, date: toIsoDate(relationship.endDate) },
          options,
        )
  }

  return relationship.endDate
    ? createIssue('IMPARTIALITY_DECLARED', { name: person.name, type, date: toIsoDate(relationship.endDate) }, options)
    : createIssue('IMPARTIALITY_NOTE', { name: person.name, type }, options)
}

// ---------------------------------------------------------------- one person

/** Every issue found for one team member, before exceptions are applied. */
export function evaluatePerson(member: TeamMemberInput, context: TeamContext): TeamIssue[] {
  const { person, role } = member
  const issues: TeamIssue[] = []

  if (!person) {
    if (role !== 'OBSERVER') {
      issues.push(createIssue('NOT_REGISTERED', { name: member.name }, { personId: member.personId }))
    }
    return issues
  }

  const add = (code: IssueCode, params: IssueParams = {}, options: IssueOptions = {}) =>
    issues.push(createIssue(code, { name: person.name, ...params }, { personId: person.id, ...options }))

  const { startDate, endDate, settings } = context
  const reference = startDate ?? context.today

  if (!person.active) add('INACTIVE')
  if (person.employmentEndDate && person.employmentEndDate < (endDate ?? reference)) {
    add('EMPLOYMENT_ENDED', { date: toIsoDate(person.employmentEndDate) })
  }

  if (COMPETENCE_ROLES.includes(role)) {
    if (!canPerformRole(person, role)) {
      add('ROLE_NOT_QUALIFIED', {
        role: roleName(role),
        registeredRole: person.competenceRole || person.jobTitle || '',
      })
    }

    const competence = computeCompetence(person, context)

    if (role === 'TEAM_LEADER' || role === 'AUDITOR') {
      if (context.standards.length && !competence.standardsCovered.length) {
        add('NOT_APPROVED_FOR_STANDARD', { standards: standardLabels(context, competence.standardsMissing) })
      } else if (competence.standardsMissing.length) {
        add('PARTIAL_STANDARDS', {
          covered: standardLabels(context, competence.standardsCovered),
          missing: standardLabels(context, competence.standardsMissing),
        })
      }
      const uncoveredCodes = context.iafCodes.filter(
        (code) => !competence.auditorCodes.includes(code) && !competence.unexaminedCritical.includes(code),
      )
      if (uncoveredCodes.length && competence.standardsCovered.length) {
        add('NOT_APPROVED_FOR_CODES', {
          scope: [
            ...standardLabels(context, competence.standardsCovered),
            ...uncoveredCodes.map((code) => `IAF ${code}`),
          ],
        })
      }
    } else {
      add('TECHNICAL_EXPERT_ONLY')
      const uncoveredCodes = context.iafCodes.filter(
        (code) => !competence.anyCodes.includes(code) && !competence.unexaminedCritical.includes(code),
      )
      if (uncoveredCodes.length) {
        add('NOT_APPROVED_FOR_CODES', { scope: uncoveredCodes.map((code) => `IAF ${code}`) })
      }
    }

    if (competence.unexaminedCritical.length) {
      add('CRITICAL_CODE_NO_EXAM', { codes: competence.unexaminedCritical })
    }

    const expiry = person.authorizationExpiry
    if (expiry) {
      if (expiry < context.today || expiry < reference) {
        add('AUTHORISATION_EXPIRED', { date: toIsoDate(expiry) })
      } else if (endDate && expiry < endDate) {
        add('AUTHORISATION_EXPIRES_DURING_AUDIT', { date: toIsoDate(expiry) })
      } else if (expiry <= addDays(endDate ?? reference, settings.expiryWarningDays)) {
        add('AUTHORISATION_EXPIRING', { date: toIsoDate(expiry) })
      }
    }
    if (person.active && (person.registerStatus === 'Under review' || person.registerStatus === 'Pending')) {
      add('EVALUATION_NOT_AUTHORISED', {
        status: {
          en: person.registerStatus.toLowerCase(),
          ar: person.registerStatus === 'Pending' ? 'معلّق' : 'قيد المراجعة',
        },
      })
    }
    for (const restriction of person.restrictions) {
      if (!restriction.expiry || restriction.expiry >= reference) {
        add('RESTRICTION_ACTIVE', { restriction: `${restriction.type}: ${restriction.details}` })
      }
    }
  }

  if (startDate && endDate) {
    for (const period of person.unavailability) {
      if (overlaps(period.start, period.end, startDate, endDate)) {
        add('UNAVAILABLE', {
          from: toIsoDate(period.start),
          to: toIsoDate(period.end),
          reason: UNAVAILABILITY_LABELS[period.reason] ?? UNAVAILABILITY_LABELS.OTHER,
        })
      }
    }
    const buffer = settings.travelBufferDays
    for (const booking of person.bookings) {
      const details = { plan: booking.planNumber, from: toIsoDate(booking.start), to: toIsoDate(booking.end) }
      if (overlaps(booking.start, booking.end, startDate, endDate)) {
        add('DOUBLE_BOOKED', details)
      } else if (buffer > 0 && overlaps(booking.start, booking.end, addDays(startDate, -buffer), addDays(endDate, buffer))) {
        add('TRAVEL_BUFFER', { ...details, days: buffer })
      }
    }
  }

  if (person.workloadDays > settings.maxAuditDaysInWindow) {
    add('WORKLOAD_HIGH', {
      days: person.workloadDays,
      window: settings.workloadWindowDays,
      max: settings.maxAuditDaysInWindow,
    })
  }

  for (const relationship of person.relationships) {
    const issue = evaluateRelationship(person, relationship, context)
    if (issue) issues.push(issue)
  }

  if (!(person.annualDeclarationValidUntil && person.annualDeclarationValidUntil >= reference)) {
    add('DECLARATION_MISSING', {}, {
      severity: context.kind === 'plan' && settings.requireAnnualDeclaration ? 'block' : 'warn',
    })
  }
  if (context.kind === 'plan' && !person.auditDeclarationSigned) {
    add('AUDIT_DECLARATION_MISSING', {}, { severity: settings.requireAuditDeclaration ? 'block' : 'info' })
  }

  return issues
}

// ---------------------------------------------------------------- exceptions

/** An issue still stops the team unless an approved exception covers it. */
export const isBlocking = (issue: TeamIssue): boolean => issue.severity === 'block' && !issue.excepted

/** Marks overridable issues that have an approved exception. Mutates and returns `issues`. */
export function applyExceptions(issues: TeamIssue[], exceptions: ExceptionRef[] = []): TeamIssue[] {
  for (const issue of issues) {
    if (!issue.overridable) continue
    const exception = exceptions.find(
      (candidate) =>
        candidate.status === 'APPROVED' &&
        candidate.issueCode === issue.code &&
        (candidate.personId ?? null) === (issue.personId ?? null),
    )
    if (exception) {
      issue.excepted = true
      issue.exceptionId = exception.id
    }
  }
  return issues
}

// ---------------------------------------------------------------- criteria

const TEAM_ROLE_CRITERIA: readonly Criterion[] = ['role', 'standards', 'codes', 'criticalCodes', 'authorisation']

/** The eight per-person criteria with a pass / partial / warn / fail status. */
export function buildCriteria(issues: TeamIssue[], role: TeamRole, context: TeamContext): CriterionResult[] {
  return CRITERIA_ORDER.map((key): CriterionResult => {
    const label = CRITERIA_LABELS[key]
    const own = issues.filter((issue) => issue.criterion === key)

    const roleDoesNotAudit = !COMPETENCE_ROLES.includes(role)
    if (
      (TEAM_ROLE_CRITERIA.includes(key) && roleDoesNotAudit) ||
      (key === 'standards' && role === 'TECHNICAL_EXPERT')
    ) {
      return { key, label, status: 'na', message: NOT_CHECKED_MESSAGE }
    }
    if (key === 'availability' && !(context.startDate && context.endDate)) {
      return {
        key,
        label,
        status: 'na',
        message: { en: ISSUE_CATALOG.NO_DATES.en, ar: ISSUE_CATALOG.NO_DATES.ar },
      }
    }

    const open = own.filter((issue) => !issue.excepted)
    const status = open.some((issue) => issue.severity === 'block')
      ? 'fail'
      : open.some((issue) => issue.severity === 'warn')
        ? 'warn'
        : own.some(
              (issue) =>
                issue.severity === 'info' &&
                issue.code !== 'TECHNICAL_EXPERT_ONLY' &&
                issue.code !== 'AUDIT_DECLARATION_MISSING',
            )
          ? 'partial'
          : 'pass'
    const shown = open.find((issue) => issue.severity === 'block') ?? open.find((issue) => issue.severity === 'warn') ?? own[0]
    return { key, label, status, message: status === 'pass' ? CRITERIA_PASS_MESSAGES[key] : (shown?.message ?? CRITERIA_PASS_MESSAGES[key]) }
  })
}

// ---------------------------------------------------------------- score

const round1 = (value: number): number => Math.round(value * 10) / 10

/** Suitability score out of 100 with the six components that make it up. */
export function scorePerson(
  person: PersonRecord,
  role: TeamRole,
  context: TeamContext,
  issues: TeamIssue[],
): { score: number; components: ScoreComponent[] } {
  const weights = SCORE_WEIGHTS
  const competence = computeCompetence(person, context)
  const codeCount = context.iafCodes.length
  const criticalCodes = context.iafCodes.filter(isCriticalCode)
  const isExpert = role === 'TECHNICAL_EXPERT'
  const usableCodes = isExpert ? competence.anyCodes : competence.auditorCodes

  const standardRatio = context.standards.length ? competence.standardsCovered.length / context.standards.length : 1
  const codeRatio = codeCount ? usableCodes.length / codeCount : 1
  const criticalRatio = criticalCodes.length
    ? criticalCodes.filter((code) => usableCodes.includes(code)).length / criticalCodes.length
    : 1
  const competenceScore = isExpert
    ? codeRatio * 35 + criticalRatio * 5
    : standardRatio * 20 + codeRatio * 15 + criticalRatio * 5

  const unavailable = issues.some((issue) => issue.code === 'UNAVAILABLE' || issue.code === 'DOUBLE_BOOKED')
  const withinBuffer = issues.some((issue) => issue.code === 'TRAVEL_BUFFER')
  const hasDates = Boolean(context.startDate && context.endDate)
  const availabilityScore = hasDates
    ? unavailable
      ? 0
      : withinBuffer
        ? weights.availability / 2
        : weights.availability
    : weights.availability

  const maxDays = Math.max(1, context.settings.maxAuditDaysInWindow)
  const workloadScore = weights.workload * (1 - Math.min(person.workloadDays, maxDays) / maxDays)
  const experienceScore = weights.experience * (Math.min(person.sectorAudits, EXPERIENCE_CAP) / EXPERIENCE_CAP)

  let locationScore = weights.location / 2
  let locationText: LocalizedText = { en: 'No base location recorded', ar: 'لا يوجد موقع أساسي مسجل' }
  const baseCountry = person.baseCountry || person.country
  if (person.baseCity && context.city && normalise(person.baseCity) === normalise(context.city)) {
    locationScore = weights.location
    locationText = {
      en: `Based in ${person.baseCity}, the audit city`,
      ar: `مقيم في ${person.baseCity}، مدينة التدقيق`,
    }
  } else if (baseCountry && context.country && canonicalCountry(baseCountry) === canonicalCountry(context.country)) {
    locationScore = weights.location * 0.7
    locationText = { en: `Based in ${baseCountry}, the audit country`, ar: `مقيم في ${baseCountry}، دولة التدقيق` }
  } else if (baseCountry && context.country) {
    locationScore = weights.location * 0.2
    locationText = {
      en: `Based in ${baseCountry}; travel to ${context.country} needed`,
      ar: `مقيم في ${baseCountry}، ويلزم السفر إلى ${context.country}`,
    }
  }

  let languageScore = weights.language / 2
  let languageText: LocalizedText = { en: 'Languages not recorded', ar: 'اللغات غير مسجلة' }
  const spoken = person.languages.map(normalise)
  if (spoken.length) {
    const [mainLanguage, ...otherLanguages] = context.languages
    if (mainLanguage && spoken.includes(mainLanguage)) {
      languageScore = weights.language
      languageText = {
        en: `Speaks ${mainLanguage.toUpperCase()}, the main audit language`,
        ar: `يتحدث ${mainLanguage.toUpperCase()}، لغة التدقيق الرئيسية`,
      }
    } else if (otherLanguages.some((language) => spoken.includes(language))) {
      languageScore = weights.language * 0.6
      languageText = { en: 'Speaks an accepted audit language', ar: 'يتحدث لغة تدقيق مقبولة' }
    } else {
      languageScore = 0
      languageText = { en: 'Does not speak the audit language', ar: 'لا يتحدث لغة التدقيق' }
    }
  }

  const criticalPercent = Math.round(criticalRatio * 100)
  const components: ScoreComponent[] = [
    {
      key: 'competence',
      score: round1(competenceScore),
      max: weights.competence,
      explanation: isExpert
        ? {
            en: `Covers ${usableCodes.length} of ${codeCount} IAF codes in scope`,
            ar: `يغطي ${usableCodes.length} من ${codeCount} من رموز IAF ضمن النطاق`,
          }
        : {
            en: `Approved for ${competence.standardsCovered.length} of ${context.standards.length} standards and ${usableCodes.length} of ${codeCount} IAF codes${criticalCodes.length ? `; critical codes ${criticalPercent}%` : ''}`,
            ar: `معتمد لـ ${competence.standardsCovered.length} من ${context.standards.length} مواصفات و ${usableCodes.length} من ${codeCount} من رموز IAF${criticalCodes.length ? `، والرموز الحرجة ${criticalPercent}%` : ''}`,
          },
    },
    {
      key: 'availability',
      score: round1(availabilityScore),
      max: weights.availability,
      explanation: hasDates
        ? unavailable
          ? { en: 'Not available on the audit dates', ar: 'غير متاح في تواريخ التدقيق' }
          : withinBuffer
            ? {
                en: 'Available, but another audit falls within the travel buffer',
                ar: 'متاح، لكن يوجد تدقيق آخر ضمن مهلة السفر',
              }
            : { en: 'Available on the audit dates', ar: 'متاح في تواريخ التدقيق' }
        : { en: 'No audit dates yet', ar: 'لا توجد تواريخ للتدقيق بعد' },
    },
    {
      key: 'workload',
      score: round1(workloadScore),
      max: weights.workload,
      explanation: {
        en: `${person.workloadDays} audit days in the last ${context.settings.workloadWindowDays} days (limit ${context.settings.maxAuditDaysInWindow})`,
        ar: `${person.workloadDays} يوم تدقيق خلال آخر ${context.settings.workloadWindowDays} يوماً (الحد ${context.settings.maxAuditDaysInWindow})`,
      },
    },
    {
      key: 'experience',
      score: round1(experienceScore),
      max: weights.experience,
      explanation: {
        en: `${person.sectorAudits} completed audits in the same IAF codes`,
        ar: `${person.sectorAudits} عملية تدقيق مكتملة في رموز IAF نفسها`,
      },
    },
    { key: 'location', score: round1(locationScore), max: weights.location, explanation: locationText },
    { key: 'language', score: round1(languageScore), max: weights.language, explanation: languageText },
  ]

  return { score: Math.round(components.reduce((total, component) => total + component.score, 0)), components }
}

// ---------------------------------------------------------------- recommendations

/** Ranks people for one role: eligible first, then by score, then by name. */
export function rankCandidates(
  people: PersonRecord[],
  role: TeamRole,
  context: TeamContext,
  exceptions: ExceptionRef[] = [],
): Candidate[] {
  return people
    .map((person): Candidate => {
      const issues = applyExceptions(
        evaluatePerson({ personId: person.id, name: person.name, role, person }, context),
        exceptions,
      )
      const { score, components } = scorePerson(person, role, context, issues)
      return {
        person,
        role,
        eligible: !issues.some(isBlocking),
        score,
        components,
        issues,
        criteria: buildCriteria(issues, role, context),
        competence: computeCompetence(person, context),
      }
    })
    .sort(
      (a, b) =>
        Number(b.eligible) - Number(a.eligible) || b.score - a.score || a.person.name.localeCompare(b.person.name),
    )
}

const toAlternative = (candidate: Candidate): Alternative => ({
  personId: candidate.person.id,
  name: candidate.person.name,
  score: candidate.score,
  role: candidate.role,
})

// ---------------------------------------------------------------- whole team

interface ValidateTeamOptions {
  exceptions?: ExceptionRef[]
  /** Everyone who could be suggested as an alternative. */
  pool?: PersonRecord[]
}

/** Checks a whole team: each member, leadership, standards and IAF code coverage. */
export function validateTeam(
  context: TeamContext,
  members: TeamMemberInput[],
  { exceptions = [], pool = [] }: ValidateTeamOptions = {},
): TeamValidation {
  const teamIssues: TeamIssue[] = []
  const memberIds = new Set(members.map((member) => member.personId).filter(Boolean))
  const rankedByRole = new Map<TeamRole, Candidate[]>()

  const candidatesFor = (role: TeamRole): Candidate[] => {
    if (!rankedByRole.has(role)) {
      rankedByRole.set(
        role,
        rankCandidates(
          pool.filter((person) => !memberIds.has(person.id)),
          role,
          context,
          exceptions,
        ),
      )
    }
    return rankedByRole.get(role) ?? []
  }
  const alternativesFor = (role: TeamRole, accept: (candidate: Candidate) => boolean = () => true): Alternative[] =>
    candidatesFor(role)
      .filter((candidate) => candidate.eligible && accept(candidate))
      .slice(0, 3)
      .map(toAlternative)

  const seen = new Set<string>()
  for (const member of members) {
    const key = member.personId ?? `name:${normalise(member.name)}`
    if (seen.has(key)) teamIssues.push(createIssue('DUPLICATE_MEMBER', { name: member.name }, { personId: member.personId }))
    seen.add(key)
  }

  const evaluated = members.map((member) => {
    const issues = applyExceptions(evaluatePerson(member, context), exceptions)
    if (issues.some((issue) => isBlocking(issue) && (issue.mandatory || issue.criterion !== 'impartiality'))) {
      const alternatives = COMPETENCE_ROLES.includes(member.role) || member.role === 'TRAINEE' ? alternativesFor(member.role) : []
      for (const issue of issues) if (isBlocking(issue)) issue.alternatives = alternatives
    }
    const status: MemberResult['status'] = issues.some(isBlocking)
      ? 'block'
      : issues.some((issue) => issue.severity === 'warn' || (issue.severity === 'block' && issue.excepted))
        ? 'warn'
        : 'ok'
    const result: MemberResult = {
      personId: member.personId,
      name: member.name,
      role: member.role,
      registered: Boolean(member.person),
      status,
      issues,
      criteria: buildCriteria(issues, member.role, context),
    }
    return { member, result, competence: member.person ? computeCompetence(member.person, context) : null }
  })

  const leaders = evaluated.filter((entry) => entry.member.role === 'TEAM_LEADER')
  if (!leaders.length) teamIssues.push(createIssue('NO_TEAM_LEADER', {}, { alternatives: alternativesFor('TEAM_LEADER') }))
  if (leaders.length > 1) teamIssues.push(createIssue('MULTIPLE_TEAM_LEADERS'))

  const leader = leaders[0]
  if (leader?.competence && leader.competence.standardsMissing.length && leader.competence.standardsCovered.length) {
    const missing = leader.competence.standardsMissing
    const coLeads = evaluated.filter(
      (entry) =>
        entry !== leader &&
        entry.member.role === 'AUDITOR' &&
        entry.competence &&
        entry.member.person &&
        canPerformRole(entry.member.person, 'TEAM_LEADER'),
    )
    for (const coLead of coLeads) {
      const shared = missing.filter((key) => coLead.competence?.standardsCovered.includes(key))
      if (shared.length) {
        teamIssues.push(
          createIssue(
            'CO_LEAD',
            { name: coLead.member.name, standards: standardLabels(context, shared) },
            { personId: coLead.member.personId },
          ),
        )
      }
    }
    const stillMissing = missing.filter((key) => !coLeads.some((entry) => entry.competence?.standardsCovered.includes(key)))
    if (stillMissing.length) {
      teamIssues.push(
        createIssue(
          'LEAD_STANDARD_NOT_COVERED',
          { standards: standardLabels(context, stillMissing) },
          {
            alternatives: alternativesFor('TEAM_LEADER', (candidate) => candidate.competence.standardsMissing.length === 0),
          },
        ),
      )
    }
  }

  const qualifiedAuditors = evaluated.filter(
    (entry) =>
      (entry.member.role === 'AUDITOR' || entry.member.role === 'TEAM_LEADER') &&
      entry.result.registered &&
      !entry.result.issues.some(
        (issue) => isBlocking(issue) && issue.criterion !== 'impartiality' && issue.criterion !== 'availability',
      ),
  )
  if (evaluated.some((entry) => entry.member.role === 'TRAINEE') && !qualifiedAuditors.length) {
    teamIssues.push(createIssue('TRAINEE_WITHOUT_AUDITOR'))
  }

  const counting = evaluated.filter(
    (entry) =>
      entry.competence &&
      COMPETENCE_ROLES.includes(entry.member.role) &&
      !entry.result.issues.some(
        (issue) => isBlocking(issue) && ['role', 'standards', 'authorisation', 'competence'].includes(issue.criterion),
      ),
  )

  const coverage = {
    standards: context.standards.map((standard) => ({
      key: standard.key,
      label: standard.label,
      coveredBy: counting
        .filter((entry) => entry.member.role !== 'TECHNICAL_EXPERT' && entry.competence?.standardsCovered.includes(standard.key))
        .map((entry) => entry.member.personId ?? ''),
    })),
    iafCodes: context.iafCodes.map(
      (code): CoverageCode => ({
        code,
        critical: isCriticalCode(code),
        coveredBy: [
          ...counting
            .filter((entry) => entry.member.role !== 'TECHNICAL_EXPERT' && entry.competence?.auditorCodes.includes(code))
            .map((entry) => ({ personId: entry.member.personId ?? '', via: 'auditor' as const })),
          ...counting
            .filter((entry) => entry.member.role === 'TECHNICAL_EXPERT' && entry.competence?.anyCodes.includes(code))
            .map((entry) => ({ personId: entry.member.personId ?? '', via: 'technicalExpert' as const })),
        ],
      }),
    ),
    members: evaluated.map((entry) => ({
      personId: entry.member.personId,
      name: entry.member.name,
      role: entry.member.role,
      standards:
        entry.competence && COMPETENCE_ROLES.includes(entry.member.role) && entry.member.role !== 'TECHNICAL_EXPERT'
          ? entry.competence.standardsCovered
          : [],
      iafCodes:
        entry.competence && COMPETENCE_ROLES.includes(entry.member.role)
          ? entry.member.role === 'TECHNICAL_EXPERT'
            ? entry.competence.anyCodes
            : entry.competence.auditorCodes
          : [],
    })),
  }

  for (const code of coverage.iafCodes) {
    if (code.coveredBy.length) {
      if (code.coveredBy.every((entry) => entry.via === 'technicalExpert')) {
        teamIssues.push(createIssue('CODE_BY_TECHNICAL_EXPERT', { code: code.code }))
      }
      continue
    }

    const needsExam = code.critical && evaluated.some((entry) => entry.competence?.unexaminedCritical.includes(code.code))
    const canCover = (candidate: Candidate) =>
      (candidate.role === 'TECHNICAL_EXPERT' ? candidate.competence.anyCodes : candidate.competence.auditorCodes).includes(code.code)
    const alternatives = [...alternativesFor('AUDITOR', canCover), ...alternativesFor('TECHNICAL_EXPERT', canCover)]
      .filter((alternative, index, all) => all.findIndex((other) => other.personId === alternative.personId) === index)
      .slice(0, 3)

    const issue = createIssue(needsExam ? 'CRITICAL_CODE_NOT_COVERED' : 'IAF_CODE_NOT_COVERED', { code: code.code }, { alternatives })
    const reasons = evaluated.flatMap((entry) =>
      (entry.competence?.notes ?? [])
        .filter((note) => note.code === code.code && !(entry.competence?.auditorCodes ?? []).includes(code.code))
        .map((note) => ({ name: entry.member.name, ...note })),
    )
    if (reasons.length) {
      issue.message.en += ` Why: ${reasons.map((reason) => `${reason.name} is ${reason.en}`).join('; ')}.`
      issue.message.ar += ` السبب: ${reasons.map((reason) => `${reason.name} ${reason.ar}`).join('؛ ')}.`
    } else {
      issue.message.en += ` No one in the team is approved for IAF ${code.code} under this audit's standard.`
      issue.message.ar += ` لا يوجد في الفريق من هو معتمد للرمز ${code.code} ضمن مواصفة هذا التدقيق.`
    }
    if (alternatives.length) {
      issue.message.en += ` Add one of: ${alternatives.map((alternative) => alternative.name).join(', ')}.`
      issue.message.ar += ` أضف واحدًا من: ${alternatives.map((alternative) => alternative.name).join('، ')}.`
    }
    teamIssues.push(issue)
  }

  if (!(context.startDate && context.endDate)) teamIssues.push(createIssue('NO_DATES'))
  applyExceptions(teamIssues, exceptions)

  const memberResults = evaluated.map((entry) => entry.result)
  const all = [...teamIssues, ...memberResults.flatMap((result) => result.issues)]
  const blocking = all.filter(isBlocking)

  return {
    valid: !blocking.length,
    canConfirm: !blocking.length,
    blockingCount: blocking.length,
    mandatoryBlockingCount: blocking.filter((issue) => issue.mandatory).length,
    overridableBlockingCount: blocking.filter((issue) => !issue.mandatory).length,
    warningCount: all.filter((issue) => issue.severity === 'warn' || (issue.severity === 'block' && issue.excepted)).length,
    members: memberResults,
    teamIssues,
    coverage,
  }
}
