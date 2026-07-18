import { isValidPhoneNumber as isValidPhoneNumberLib } from 'libphonenumber-js'
import type { CountryCode } from '@/lib/countries'

/**
 * Pure format validators — no React, no i18n, no UI concerns.
 * Each function just answers "is this value shaped correctly?".
 * Empty values are treated as valid here; whether a field is *required*
 * is a separate concern handled by applicationValidation.ts.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  return EMAIL_PATTERN.test(trimmed)
}

/**
 * Accepts URLs with or without a scheme (e.g. "google.com" as well as
 * "https://google.com"), since users commonly omit "https://" when typing.
 * Callers that need a normalized value for submission/display should use
 * `normalizeWebsiteUrl` below.
 */
export function isValidWebsite(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const url = new URL(withScheme)
    // Require at least one dot in the hostname so "https://asdf" isn't accepted.
    return url.hostname.includes('.')
  } catch {
    return false
  }
}

/** Prepends https:// if the user typed a bare domain, for storage/display. */
export function normalizeWebsiteUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function isValidPhoneNumber(value: string, countryCode: CountryCode): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  return isValidPhoneNumberLib(trimmed, countryCode)
}