import type { TFunction } from 'i18next'
import { ApiError } from '@/lib/api/client'
import { APPLICATION_STATUS_LABEL_KEYS } from '@/lib/applicationStatus'

/**
 * Single place that turns anything thrown by the API layer into text a
 * non-technical user can act on.
 *
 * Rule of thumb for the whole app: never put `error.message` on screen.
 * Pass the caught error to `getUserErrorMessage` instead. The original error
 * is still written to the console so developers can debug it.
 *
 * The backend sends no stable error code, so messages are resolved by
 * (1) a few well-known backend messages, (2) the HTTP status, and
 * (3) the Joi validation lines in `errors[]` / `message`.
 */

/** Maps a backend field path (full path or last segment) to an i18n key holding its label. */
export type FieldLabelMap = Record<string, string>

export interface UserErrorOptions {
  /** i18n key shown when nothing more specific applies (default: `errors.generic`). */
  fallbackKey?: string
  /** Labels for the fields the endpoint validates, so "organizationName" reads as a real field name. */
  fieldLabels?: FieldLabelMap
}

export interface ValidationIssue {
  path: string
  rule: string
}

const NETWORK_ERROR_PATTERN = /failed to fetch|networkerror|load failed|network request failed/i

/** Backend sentences that deserve their own wording, whatever the status code is. */
const KNOWN_MESSAGES: ReadonlyArray<{ pattern: RegExp; key: string }> = [
  {
    pattern:
      /authentication required|access denied|no token provided|invalid token|token (has )?expired|jwt (expired|malformed)/i,
    key: 'errors.sessionExpired',
  },
  { pattern: /already registered|email (is )?already (exists|in use)/i, key: 'errors.emailTaken' },
  { pattern: /organization profile does not exist/i, key: 'errors.profileMissing' },
  { pattern: /no (document |image )?file provided/i, key: 'errors.noFile' },
]

const CANNOT_MODIFY_PATTERN = /cannot be modified.*?current status:\s*([A-Z_]+)/i

// Joi prefixes, and a splitter for several Joi lines glued into one string:
//   Cannot submit: "legalInfo.city" is required, "branches" must contain at least 1 items
const MESSAGE_PREFIX = /^\s*(?:cannot submit|validation error)\s*:?\s*/i
const ISSUE_SPLIT = /,\s*(?=(?:"[^"]+"|[A-Za-z_][\w.[\]]*)\s+(?:is |must |length |fails ))/
const ISSUE_LINE = /^(?:"([^"]+)"|([A-Za-z_][\w.[\]]*))\s+(.+)$/
const RULE_HINT = /\b(is required|is not allowed|must |length must|fails to match)/i

export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && NETWORK_ERROR_PATTERN.test(error.message)) return true
  return (
    !(error instanceof ApiError) &&
    typeof navigator !== 'undefined' &&
    navigator.onLine === false
  )
}

/** Keeps the technical detail available for developers without showing it to users. */
export function logTechnicalError(error: unknown): void {
  console.error('[iCASCO] request failed:', error)
}

/** Splits the Joi messages carried by an ApiError into `{ path, rule }` pairs. */
export function parseValidationIssues(error: ApiError): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const seen = new Set<string>()

  for (const source of [error.message, ...(error.errors ?? [])]) {
    if (!source) continue
    for (const chunk of source.replace(MESSAGE_PREFIX, '').split(ISSUE_SPLIT)) {
      const match = chunk.trim().match(ISSUE_LINE)
      if (!match) continue
      const quotedPath = match[1]
      const path = quotedPath ?? match[2]
      const rule = match[3]
      // Unquoted lines are only trusted when the rest reads like a validation rule,
      // so plain sentences such as "Application not found." are not mistaken for one.
      if (!quotedPath && !RULE_HINT.test(rule)) continue
      const id = `${path}|${rule}`
      if (seen.has(id)) continue
      seen.add(id)
      issues.push({ path, rule })
    }
  }

  return issues
}

/** Translates a Joi rule ("must be a valid email") into a short phrase ("must be a valid email address"). */
export function describeRule(rule: string, t: TFunction): string {
  const text = rule.trim()

  if (/is required|is not allowed to be (empty|null)/i.test(text)) return t('errors.reasons.required')
  if (/valid email/i.test(text)) return t('errors.reasons.invalidEmail')
  if (/valid ur[il]/i.test(text)) return t('errors.reasons.invalidUrl')
  if (/valid date|iso 8601/i.test(text)) return t('errors.reasons.invalidDate')
  if (/must be a (valid )?number/i.test(text)) return t('errors.reasons.mustBeNumber')
  if (/must be \[?true\]?/i.test(text)) return t('errors.reasons.mustBeAccepted')

  const minLength = text.match(/length must be at least (\d+)/i)
  if (minLength) return t('errors.reasons.minLength', { count: Number(minLength[1]) })

  const maxLength = text.match(/length must be (?:less than or equal to|at most) (\d+)/i)
  if (maxLength) return t('errors.reasons.maxLength', { count: Number(maxLength[1]) })

  const minItems = text.match(/must contain at least (\d+)/i)
  if (minItems) return t('errors.reasons.minItems', { count: Number(minItems[1]) })

  if (/must be one of/i.test(text)) return t('errors.reasons.invalidChoice')
  if (/fails to match|pattern/i.test(text)) return t('errors.reasons.invalidFormat')

  return t('errors.reasons.invalidValue')
}

function humanize(segment: string): string {
  const words = segment
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : segment
}

/** Best readable name for a backend field path: exact label, then label without array indexes, then last segment. */
export function labelForField(path: string, t: TFunction, fieldLabels?: FieldLabelMap): string {
  const withoutIndexes = path.replace(/\[\d+\]/g, '')
  const leaf = withoutIndexes.split('.').pop() ?? withoutIndexes
  const key = fieldLabels?.[path] ?? fieldLabels?.[withoutIndexes] ?? fieldLabels?.[leaf]
  return key ? t(key) : humanize(leaf)
}

function describeStatus(raw: string, t: TFunction): string {
  const key = (APPLICATION_STATUS_LABEL_KEYS as Record<string, string>)[raw.toUpperCase()]
  return key ? t(`cab.applicationRegister.status.${key}`) : raw
}

function matchKnownMessage(message: string, t: TFunction): string | null {
  const modify = message.match(CANNOT_MODIFY_PATTERN)
  if (modify) return t('errors.cannotModify', { status: describeStatus(modify[1], t) })

  const known = KNOWN_MESSAGES.find(({ pattern }) => pattern.test(message))
  return known ? t(known.key) : null
}

function formatIssues(
  issues: ValidationIssue[],
  t: TFunction,
  fieldLabels?: FieldLabelMap,
): string | null {
  const lines = [
    ...new Set(
      issues.map(({ path, rule }) =>
        t('errors.fieldLine', {
          field: labelForField(path, t, fieldLabels),
          reason: describeRule(rule, t),
        }),
      ),
    ),
  ]
  if (lines.length === 0) return null
  if (lines.length === 1) return lines[0]
  return [t('errors.validationTitle'), ...lines.map((line) => `• ${line}`)].join('\n')
}

/**
 * The only function pages should use to show a caught error.
 * Multi-line results (several invalid fields) use "\n" — render with `whitespace-pre-line`.
 */
export function getUserErrorMessage(
  error: unknown,
  t: TFunction,
  options: UserErrorOptions = {},
): string {
  logTechnicalError(error)
  const fallback = t(options.fallbackKey ?? 'errors.generic')

  if (error instanceof ApiError) {
    const known = matchKnownMessage(error.message, t)
    if (known) return known

    switch (true) {
      case error.status === 401:
        return t('errors.sessionExpired')
      case error.status === 403:
        return t('errors.forbidden')
      case error.status === 404:
        return t('errors.notFound')
      case error.status === 409:
        return t('errors.conflict')
      case error.status === 410:
        return t('errors.expired')
      case error.status === 413:
        return t('errors.payloadTooLarge')
      case error.status === 429:
        return t('errors.rateLimit.description')
      case error.status >= 500:
        return t('errors.server')
      case error.status === 400 || error.status === 422:
        return (
          formatIssues(parseValidationIssues(error), t, options.fieldLabels) ??
          t(options.fallbackKey ?? 'errors.invalidRequest')
        )
      default:
        return fallback
    }
  }

  if (isNetworkError(error)) return t('errors.network')

  if (error instanceof Error) {
    const known = matchKnownMessage(error.message, t)
    if (known) return known
  }

  return fallback
}
