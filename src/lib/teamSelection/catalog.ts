/**
 * Static rules data for audit team selection: issue catalog, score weights, defaults and labels.
 * Mirrors the reference ("artifact") implementation; change values there first.
 */

export interface LocalizedText {
  en: string
  ar: string
}

export type Severity = 'block' | 'warn' | 'info'

export type TeamRole = 'TEAM_LEADER' | 'AUDITOR' | 'TECHNICAL_EXPERT' | 'TRAINEE' | 'OBSERVER'

/** The eight per-person criteria shown for every team member. */
export type Criterion =
  | 'role'
  | 'standards'
  | 'codes'
  | 'criticalCodes'
  | 'authorisation'
  | 'availability'
  | 'impartiality'
  | 'workload'

/** Where an issue is shown. `competence` and `team` are not per-person criteria. */
export type IssueCriterion = Criterion | 'competence' | 'team'

export interface IssueDefinition extends LocalizedText {
  severity: Severity
  /** Mandatory issues can never be overridden by an exception. */
  mandatory: boolean
  criterion: IssueCriterion
}

export interface TeamSelectionSettings {
  coolingOffMonths: number
  travelBufferDays: number
  workloadWindowDays: number
  maxAuditDaysInWindow: number
  declarationValidityMonths: number
  requireAnnualDeclaration: boolean
  requireAuditDeclaration: boolean
  exceptionSecondApprover: boolean
  expiryWarningDays: number
}

export type RelationshipType =
  | 'CONSULTANCY'
  | 'INTERNAL_AUDIT'
  | 'EMPLOYMENT'
  | 'FAMILY'
  | 'FINANCIAL_INTEREST'
  | 'CERTIFICATION_DECISION'
  | 'OTHER'

export type UnavailabilityReason = 'LEAVE' | 'TRAINING' | 'SICK' | 'OTHER_ASSIGNMENT' | 'OTHER'


/** IAF codes that need a passed exam before they count for a person. */
export const CRITICAL_IAF_CODES: readonly string[] = ['03', '11', '12', '13', '28', '38']

export const ROLE_LABELS: Record<TeamRole, LocalizedText & { log: string }> = {
  TEAM_LEADER: {
    en: 'Team leader',
    ar: 'قائد الفريق',
    log: 'Lead Auditor',
  },
  AUDITOR: {
    en: 'Auditor',
    ar: 'مدقق',
    log: 'Auditor',
  },
  TECHNICAL_EXPERT: {
    en: 'Technical expert',
    ar: 'خبير فني',
    log: 'Technical Expert',
  },
  TRAINEE: {
    en: 'Trainee auditor',
    ar: 'مدقق متدرب',
    log: 'Trainee Auditor',
  },
  OBSERVER: {
    en: 'Observer',
    ar: 'مراقب',
    log: 'Observer',
  },
}

/** Roles that audit (or advise) and are checked for competence. */
export const COMPETENCE_ROLES: readonly TeamRole[] = ['TEAM_LEADER', 'AUDITOR', 'TECHNICAL_EXPERT']

export const DEFAULT_SETTINGS: TeamSelectionSettings = {
  coolingOffMonths: 24,
  travelBufferDays: 1,
  workloadWindowDays: 90,
  maxAuditDaysInWindow: 30,
  declarationValidityMonths: 12,
  requireAnnualDeclaration: true,
  requireAuditDeclaration: false,
  exceptionSecondApprover: false,
  expiryWarningDays: 30,
}

/** Suitability score weights (they add up to 100). */
export const SCORE_WEIGHTS = {
  competence: 40,
  availability: 20,
  workload: 15,
  experience: 15,
  location: 5,
  language: 5,
} as const

/** Completed audits in the same IAF codes that earn the full experience score. */
export const EXPERIENCE_CAP = 5

/** Job titles that qualify as team leader / auditor. */
export const LEAD_JOB_TITLES: readonly string[] = ['LEAD_AUDITOR', 'TECHNICAL_MANAGER']
export const AUDITOR_JOB_TITLES: readonly string[] = ['LEAD_AUDITOR', 'TECHNICAL_MANAGER', 'AUDITOR']

/** Relationship types that are a conflict while ongoing. */
export const CONFLICT_RELATIONSHIPS: readonly RelationshipType[] = ['CONSULTANCY', 'INTERNAL_AUDIT', 'EMPLOYMENT', 'FAMILY', 'FINANCIAL_INTEREST']
/** Relationship types that fall under the cooling-off period once ended. */
export const COOLING_OFF_RELATIONSHIPS: readonly RelationshipType[] = ['CONSULTANCY', 'INTERNAL_AUDIT', 'EMPLOYMENT']

export const RELATIONSHIP_LABELS: Record<RelationshipType, LocalizedText> = {
  CONSULTANCY: {
    en: 'consultancy',
    ar: 'استشارات',
  },
  INTERNAL_AUDIT: {
    en: 'internal audit service',
    ar: 'خدمة تدقيق داخلي',
  },
  EMPLOYMENT: {
    en: 'employment',
    ar: 'توظيف',
  },
  FAMILY: {
    en: 'family relationship',
    ar: 'صلة قرابة',
  },
  FINANCIAL_INTEREST: {
    en: 'financial interest',
    ar: 'مصلحة مالية',
  },
  CERTIFICATION_DECISION: {
    en: 'previous certification decision',
    ar: 'قرار منح شهادة سابق',
  },
  OTHER: {
    en: 'other relationship',
    ar: 'علاقة أخرى',
  },
}

export const UNAVAILABILITY_LABELS: Record<UnavailabilityReason, LocalizedText> = {
  LEAVE: {
    en: 'leave',
    ar: 'إجازة',
  },
  TRAINING: {
    en: 'training',
    ar: 'تدريب',
  },
  SICK: {
    en: 'sick leave',
    ar: 'إجازة مرضية',
  },
  OTHER_ASSIGNMENT: {
    en: 'other assignment',
    ar: 'مهمة أخرى',
  },
  OTHER: {
    en: 'unavailable',
    ar: 'غير متاح',
  },
}

export const CRITERIA_ORDER: readonly Criterion[] = [
  'role',
  'standards',
  'codes',
  'criticalCodes',
  'authorisation',
  'availability',
  'impartiality',
  'workload',
]

export const CRITERIA_LABELS: Record<Criterion, LocalizedText> = {
  role: {
    en: 'Role qualification',
    ar: 'التأهل للدور',
  },
  standards: {
    en: 'Approved standards',
    ar: 'المواصفات المعتمدة',
  },
  codes: {
    en: 'IAF codes / technical sectors',
    ar: 'رموز IAF والقطاعات الفنية',
  },
  criticalCodes: {
    en: 'Critical codes (exam)',
    ar: 'الرموز الحرجة (الاختبار)',
  },
  authorisation: {
    en: 'Competence approval validity',
    ar: 'سريان اعتماد الكفاءة',
  },
  availability: {
    en: 'Availability',
    ar: 'التوافر',
  },
  impartiality: {
    en: 'Impartiality',
    ar: 'الحياد',
  },
  workload: {
    en: 'Workload balance',
    ar: 'توازن عبء العمل',
  },
}

/** Shown for a criterion that passes. */
export const CRITERIA_PASS_MESSAGES: Record<Criterion, LocalizedText> = {
  role: {
    en: 'Qualified for the role',
    ar: 'مؤهل للدور',
  },
  standards: {
    en: 'Approved for every standard',
    ar: 'معتمد لكل المواصفات',
  },
  codes: {
    en: 'Approved for every IAF code in scope',
    ar: 'معتمد لكل رموز IAF ضمن النطاق',
  },
  criticalCodes: {
    en: 'No unexamined critical code',
    ar: 'لا توجد رموز حرجة دون اختبار',
  },
  authorisation: {
    en: 'Competence approval valid',
    ar: 'اعتماد الكفاءة ساري',
  },
  availability: {
    en: 'Available on the audit dates',
    ar: 'متاح في تواريخ التدقيق',
  },
  impartiality: {
    en: 'No conflict of interest recorded',
    ar: 'لا يوجد تعارض مصالح مسجل',
  },
  workload: {
    en: 'Workload within the limit',
    ar: 'عبء العمل ضمن الحد',
  },
}

export const NOT_CHECKED_MESSAGE: LocalizedText = {
  en: 'Not checked for this role',
  ar: 'لا يُتحقق منه لهذا الدور',
}

export const ISSUE_CATALOG = {
  NOT_REGISTERED: {
    severity: 'block',
    mandatory: true,
    criterion: 'competence',
    en: '{{name}} is not registered in the personnel register.',
    ar: '{{name}} غير مسجل في سجل الموظفين.',
  },
  INACTIVE: {
    severity: 'block',
    mandatory: true,
    criterion: 'competence',
    en: '{{name}} is inactive in the personnel register.',
    ar: '{{name}} غير نشط في سجل الموظفين.',
  },
  EMPLOYMENT_ENDED: {
    severity: 'block',
    mandatory: true,
    criterion: 'competence',
    en: "{{name}}'s engagement ends on {{date}}, before the audit.",
    ar: 'ينتهي ارتباط {{name}} بالجهة في {{date}} قبل موعد التدقيق.',
  },
  ROLE_NOT_QUALIFIED: {
    severity: 'block',
    mandatory: true,
    criterion: 'role',
    en: '{{name}} is not qualified for the {{role}} role (registered as {{registeredRole}}).',
    ar: '{{name}} غير مؤهل لدور {{role}} (مسجل بصفة {{registeredRole}}).',
  },
  NOT_APPROVED_FOR_STANDARD: {
    severity: 'block',
    mandatory: true,
    criterion: 'standards',
    en: '{{name}} is not approved for {{standards}}.',
    ar: '{{name}} غير معتمد للمواصفة {{standards}}.',
  },
  PARTIAL_STANDARDS: {
    severity: 'info',
    mandatory: false,
    criterion: 'standards',
    en: '{{name}} is approved for {{covered}} only, not for {{missing}}.',
    ar: '{{name}} معتمد للمواصفة {{covered}} فقط، وليس للمواصفة {{missing}}.',
  },
  NOT_APPROVED_FOR_CODES: {
    severity: 'info',
    mandatory: false,
    criterion: 'codes',
    en: '{{name}} is not approved for {{scope}}.',
    ar: '{{name}} غير معتمد لـ {{scope}}.',
  },
  CRITICAL_CODE_NO_EXAM: {
    severity: 'warn',
    mandatory: false,
    criterion: 'criticalCodes',
    en: 'IAF {{codes}} of {{name}} is not counted: a critical code needs a passed exam (80% or more).',
    ar: 'لا يُحتسب رمز IAF {{codes}} لـ {{name}}: الرمز الحرج يتطلب اجتياز اختبار (80% أو أكثر).',
  },
  AUTHORISATION_EXPIRED: {
    severity: 'block',
    mandatory: true,
    criterion: 'authorisation',
    en: "{{name}}'s competence approval expired on {{date}}.",
    ar: 'انتهى اعتماد كفاءة {{name}} في {{date}}.',
  },
  AUTHORISATION_EXPIRES_DURING_AUDIT: {
    severity: 'block',
    mandatory: true,
    criterion: 'authorisation',
    en: "{{name}}'s competence approval expires on {{date}}, before the audit ends.",
    ar: 'ينتهي اعتماد كفاءة {{name}} في {{date}} قبل انتهاء التدقيق.',
  },
  AUTHORISATION_EXPIRING: {
    severity: 'warn',
    mandatory: false,
    criterion: 'authorisation',
    en: "{{name}}'s competence approval expires soon ({{date}}).",
    ar: 'يقترب انتهاء اعتماد كفاءة {{name}} ({{date}}).',
  },
  EVALUATION_NOT_AUTHORISED: {
    severity: 'warn',
    mandatory: false,
    criterion: 'authorisation',
    en: "{{name}}'s competence evaluation is {{status}}, not yet authorised.",
    ar: 'تقييم كفاءة {{name}} بحالة {{status}} ولم يُعتمد بعد.',
  },
  RESTRICTION_ACTIVE: {
    severity: 'warn',
    mandatory: false,
    criterion: 'authorisation',
    en: '{{name}} has an active restriction: {{restriction}}.',
    ar: 'لدى {{name}} قيد ساري: {{restriction}}.',
  },
  TECHNICAL_EXPERT_ONLY: {
    severity: 'info',
    mandatory: false,
    criterion: 'role',
    en: '{{name}} counts for sector knowledge only and does not audit independently.',
    ar: 'يُحتسب {{name}} للمعرفة القطاعية فقط ولا يدقق بشكل مستقل.',
  },
  UNAVAILABLE: {
    severity: 'block',
    mandatory: true,
    criterion: 'availability',
    en: '{{name}} is unavailable from {{from}} to {{to}} ({{reason}}).',
    ar: '{{name}} غير متاح من {{from}} إلى {{to}} ({{reason}}).',
  },
  DOUBLE_BOOKED: {
    severity: 'block',
    mandatory: true,
    criterion: 'availability',
    en: '{{name}} is already assigned to Audit {{plan}} on the selected dates ({{from}} to {{to}}).',
    ar: '{{name}} مكلف بالفعل بالتدقيق {{plan}} في التواريخ المختارة ({{from}} إلى {{to}}).',
  },
  TRAVEL_BUFFER: {
    severity: 'block',
    mandatory: false,
    criterion: 'availability',
    en: '{{name}} has Audit {{plan}} ({{from}} to {{to}}) within the {{days}} day travel buffer.',
    ar: 'لدى {{name}} التدقيق {{plan}} ({{from}} إلى {{to}}) ضمن مهلة السفر البالغة {{days}} يوم.',
  },
  WORKLOAD_HIGH: {
    severity: 'warn',
    mandatory: false,
    criterion: 'workload',
    en: '{{name}} audited {{days}} days in the last {{window}} days (limit {{max}}).',
    ar: 'دقق {{name}} {{days}} يوماً خلال آخر {{window}} يوماً (الحد {{max}}).',
  },
  IMPARTIALITY_CONFLICT: {
    severity: 'block',
    mandatory: true,
    criterion: 'impartiality',
    en: '{{name}} has a recorded {{type}} relationship with this client{{until}}.',
    ar: 'لدى {{name}} علاقة {{type}} مسجلة مع هذا العميل{{until}}.',
  },
  IMPARTIALITY_DECLARED: {
    severity: 'warn',
    mandatory: false,
    criterion: 'impartiality',
    en: '{{name}} declared a past {{type}} relationship with this client (ended {{date}}, outside the cooling-off period).',
    ar: 'صرّح {{name}} بعلاقة {{type}} سابقة مع هذا العميل (انتهت في {{date}} خارج فترة التهدئة).',
  },
  IMPARTIALITY_NOTE: {
    severity: 'warn',
    mandatory: false,
    criterion: 'impartiality',
    en: '{{name}} has a recorded {{type}} with this client. Review it before confirming.',
    ar: 'لدى {{name}} {{type}} مسجل مع هذا العميل. راجعه قبل التأكيد.',
  },
  DECLARATION_MISSING: {
    severity: 'block',
    mandatory: false,
    criterion: 'impartiality',
    en: '{{name}} has no valid annual impartiality declaration.',
    ar: 'لا يوجد لدى {{name}} إقرار حياد سنوي ساري.',
  },
  AUDIT_DECLARATION_MISSING: {
    severity: 'block',
    mandatory: false,
    criterion: 'impartiality',
    en: '{{name}} has not signed the impartiality declaration for this audit.',
    ar: 'لم يوقّع {{name}} إقرار الحياد الخاص بهذا التدقيق.',
  },
  NO_TEAM_LEADER: {
    severity: 'block',
    mandatory: true,
    criterion: 'team',
    en: 'The team has no team leader.',
    ar: 'لا يوجد قائد للفريق.',
  },
  MULTIPLE_TEAM_LEADERS: {
    severity: 'block',
    mandatory: true,
    criterion: 'team',
    en: 'The team can have only one team leader.',
    ar: 'يجب أن يكون للفريق قائد واحد فقط.',
  },
  DUPLICATE_MEMBER: {
    severity: 'block',
    mandatory: true,
    criterion: 'team',
    en: '{{name}} appears more than once in the team.',
    ar: '{{name}} مكرر في الفريق.',
  },
  LEAD_STANDARD_NOT_COVERED: {
    severity: 'block',
    mandatory: true,
    criterion: 'team',
    en: 'The team leader is not approved for {{standards}} and no co-lead in the team is.',
    ar: 'قائد الفريق غير معتمد للمواصفة {{standards}} ولا يوجد قائد مشارك معتمد لها في الفريق.',
  },
  CO_LEAD: {
    severity: 'warn',
    mandatory: false,
    criterion: 'team',
    en: '{{name}} co-leads {{standards}}, which the team leader is not approved for.',
    ar: 'يتولى {{name}} القيادة المشاركة للمواصفة {{standards}} التي لا يعتمد لها قائد الفريق.',
  },
  IAF_CODE_NOT_COVERED: {
    severity: 'block',
    mandatory: true,
    criterion: 'team',
    en: 'IAF {{code}} in scope is not covered by any competent team member.',
    ar: 'رمز IAF {{code}} ضمن النطاق غير مغطى من أي عضو كفء في الفريق.',
  },
  CRITICAL_CODE_NOT_COVERED: {
    severity: 'block',
    mandatory: true,
    criterion: 'team',
    en: 'Critical IAF {{code}} needs a team member with a passed exam for it.',
    ar: 'رمز IAF الحرج {{code}} يتطلب عضواً في الفريق اجتاز الاختبار الخاص به.',
  },
  CODE_BY_TECHNICAL_EXPERT: {
    severity: 'info',
    mandatory: false,
    criterion: 'team',
    en: 'IAF {{code}} is covered by a technical expert only; the auditors lead the audit of it.',
    ar: 'رمز IAF {{code}} مغطى من خبير فني فقط، ويتولى المدققون تدقيقه.',
  },
  TRAINEE_WITHOUT_AUDITOR: {
    severity: 'block',
    mandatory: true,
    criterion: 'team',
    en: 'Trainee auditors need a qualified auditor or team leader in the team.',
    ar: 'يحتاج المدققون المتدربون إلى مدقق مؤهل أو قائد فريق ضمن الفريق.',
  },
  NO_DATES: {
    severity: 'info',
    mandatory: false,
    criterion: 'availability',
    en: 'No audit dates yet: availability is checked when the audit plan is built.',
    ar: 'لا توجد تواريخ للتدقيق بعد: يُتحقق من التوافر عند إعداد خطة التدقيق.',
  },
} as const satisfies Record<string, IssueDefinition>

export type IssueCode = keyof typeof ISSUE_CATALOG

/** IAF codes per standard, keyed by the standard number (for example `9001`). */
export const STANDARD_IAF_CODES: Record<string, string[]> = {
  "9001": ['29', '31'],
  "14001": ['14', '31'],
  "22000": ['03'],
  "45001": ['28'],
  "27001": ['33'],
  "50001": ['17'],
  "22301": ['33'],
}
