/**
 * Pure helpers for the team selection Rules tab and the second-approver rule.
 * Zero-import on purpose so the unit tests can load it directly.
 */

export type RuleNumberKey =
  | 'coolingOffMonths'
  | 'travelBufferDays'
  | 'workloadWindowDays'
  | 'maxAuditDaysInWindow'
  | 'declarationValidityMonths'
  | 'expiryWarningDays'

export type RuleToggleKey = 'requireAnnualDeclaration' | 'requireAuditDeclaration' | 'exceptionSecondApprover'

export const RULE_NUMBER_FIELDS: ReadonlyArray<{ key: RuleNumberKey; min: number; max: number }> = [
  { key: 'coolingOffMonths', min: 0, max: 120 },
  { key: 'travelBufferDays', min: 0, max: 30 },
  { key: 'workloadWindowDays', min: 1, max: 365 },
  { key: 'maxAuditDaysInWindow', min: 1, max: 365 },
  { key: 'declarationValidityMonths', min: 1, max: 60 },
  { key: 'expiryWarningDays', min: 0, max: 365 },
]

export const RULE_TOGGLE_KEYS: ReadonlyArray<RuleToggleKey> = [
  'requireAnnualDeclaration',
  'requireAuditDeclaration',
  'exceptionSecondApprover',
]

export interface RulesValidationError {
  key: RuleNumberKey
  code: 'required' | 'integer' | 'range'
  min: number
  max: number
}

/** Draft values come from text inputs, so numbers arrive as strings. */
export function validateRulesDraft(draft: Record<string, unknown>): RulesValidationError[] {
  const errors: RulesValidationError[] = []
  for (const field of RULE_NUMBER_FIELDS) {
    const raw = String(draft[field.key] ?? '').trim()
    const base = { key: field.key, min: field.min, max: field.max }
    if (raw === '') {
      errors.push({ ...base, code: 'required' })
      continue
    }
    if (!/^-?\d+$/.test(raw)) {
      errors.push({ ...base, code: 'integer' })
      continue
    }
    const value = Number(raw)
    if (value < field.min || value > field.max) errors.push({ ...base, code: 'range' })
  }
  return errors
}

/**
 * True when the second approver rule stops this admin deciding this exception.
 * `isRequester` must come from comparing stable ids, not display names.
 */
export function isSelfDecisionBlocked(input: { secondApprover: boolean; isRequester: boolean }): boolean {
  return input.secondApprover && input.isRequester
}
