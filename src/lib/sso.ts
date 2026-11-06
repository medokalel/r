import type { SsoAttributeMapping, SsoConnection, SsoProtocol, SsoProvider } from '@/lib/api/ssoTypes'

/** Single sign-on (SSO) — constants and pure helpers shared by the wizard, the cards and the mock API. */

export const SSO_PROTOCOL: Record<SsoProvider, SsoProtocol> = {
  entra: 'OIDC',
  google: 'OIDC',
  okta: 'OIDC',
  generic_oidc: 'OIDC',
  generic_saml: 'SAML',
}

const SAML_CLAIMS = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims'

const OIDC_ATTRIBUTES: SsoAttributeMapping = { email: 'email', name: 'name', groups: 'groups' }

export const SSO_DEFAULT_ATTRIBUTE_MAPPING: Record<SsoProvider, SsoAttributeMapping> = {
  entra: OIDC_ATTRIBUTES,
  google: { email: 'email', name: 'name', groups: '' },
  okta: OIDC_ATTRIBUTES,
  generic_oidc: OIDC_ATTRIBUTES,
  generic_saml: {
    email: `${SAML_CLAIMS}/emailaddress`,
    name: `${SAML_CLAIMS}/name`,
    groups: `${SAML_CLAIMS}/groups`,
  },
}

/** Providers whose issuer never changes are pre-filled. */
export const SSO_FIXED_ISSUER: Partial<Record<SsoProvider, string>> = {
  google: 'https://accounts.google.com',
}

export const SSO_ISSUER_PLACEHOLDER: Partial<Record<SsoProvider, string>> = {
  entra: 'https://login.microsoftonline.com/<tenant-id>/v2.0',
  okta: 'https://your-org.okta.com',
  generic_oidc: 'https://idp.example.com',
}

export const SSO_DEFAULT_SCOPES = 'openid email profile'

export const SSO_DEFAULT_ROLE_FALLBACK = 'CAB_ADMIN'

/** Error codes that have a translated message under `cab.sso.errors`. */
const SSO_ERROR_CODES = [
  'SSO_NOT_CONFIGURED',
  'SSO_REQUIRED',
  'SSO_CONNECTION_NOT_FOUND',
  'SSO_CONNECTION_DISABLED',
  'SSO_CONNECTION_INCOMPLETE',
  'SSO_STATE_INVALID',
  'SSO_VALIDATION_FAILED',
  'SSO_IDP_ERROR',
  'SSO_EMAIL_MISSING',
  'SSO_DOMAIN_NOT_VERIFIED',
  'SSO_USER_NOT_PROVISIONED',
  'SSO_ACCESS_DENIED',
  'SSO_ACCOUNT_SUSPENDED',
  'SSO_CODE_INVALID',
  'SSO_DOMAIN_TAKEN',
  'USER_LIMIT_REACHED',
  'FEATURE_NOT_IN_PLAN',
] as const

export type SsoErrorCode = (typeof SSO_ERROR_CODES)[number]

export function ssoErrorKey(code: string | null | undefined): string {
  const known = SSO_ERROR_CODES.find((item) => item === code)
  return `cab.sso.errors.${known ?? 'generic'}`
}

const PUBLIC_MAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'me.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'gmx.com',
  'mail.com',
  'zoho.com',
])

const DOMAIN_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/

export type SsoDomainIssue = 'invalid' | 'public' | 'duplicate'

export function normalizeSsoDomain(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
}

export function getSsoDomainIssue(value: string, existing: readonly string[]): SsoDomainIssue | null {
  const domain = normalizeSsoDomain(value)
  if (!DOMAIN_PATTERN.test(domain)) return 'invalid'
  if (PUBLIC_MAIL_DOMAINS.has(domain)) return 'public'
  if (existing.includes(domain)) return 'duplicate'
  return null
}

export const SSO_DOMAIN_ISSUE_KEYS: Record<SsoDomainIssue, string> = {
  invalid: 'cab.sso.wizard.domainInvalid',
  public: 'cab.sso.wizard.domainPublic',
  duplicate: 'cab.sso.wizard.domainDuplicate',
}

export type SsoMissingField = 'issuerUrl' | 'clientId' | 'samlSsoUrl' | 'samlIdpCertificate'

type MissingFieldsInput = Pick<
  SsoConnection,
  'protocol' | 'issuerUrl' | 'clientId' | 'samlSsoUrl' | 'samlIdpCertificate'
>

/** What is still needed before a connection can be enabled. */
export function getSsoMissingFields(connection: MissingFieldsInput): SsoMissingField[] {
  const missing: SsoMissingField[] = []
  if (connection.protocol === 'OIDC') {
    if (!connection.issuerUrl) missing.push('issuerUrl')
    if (!connection.clientId) missing.push('clientId')
  } else {
    if (!connection.samlSsoUrl) missing.push('samlSsoUrl')
    if (!connection.samlIdpCertificate) missing.push('samlIdpCertificate')
  }
  return missing
}

export function countVerifiedSsoDomains(connection: Pick<SsoConnection, 'domains'>): number {
  return connection.domains.filter((domain) => domain.verified).length
}

export type SsoRequireBlocker = 'domain' | 'breakGlass' | null

/** "Require SSO" turns password sign-in off, so it needs a verified domain and a break-glass admin. */
export function getSsoRequireBlocker(
  connection: Pick<SsoConnection, 'domains' | 'breakGlassUser'>,
  breakGlassUserId: string | null = connection.breakGlassUser?.id ?? null,
): SsoRequireBlocker {
  if (!breakGlassUserId) return 'breakGlass'
  if (countVerifiedSsoDomains(connection) < 1) return 'domain'
  return null
}

/** Dates always use Western digits, like the rest of the app, even in Arabic. */
export function formatSsoDateTime(value: string | null | undefined, language: string): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const locale = language.startsWith('ar') ? 'ar-u-nu-latn' : language
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function formatSsoDate(value: string | null | undefined, language: string): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const locale = language.startsWith('ar') ? 'ar-u-nu-latn' : language
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
}
