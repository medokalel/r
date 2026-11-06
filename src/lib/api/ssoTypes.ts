/** Single sign-on (SSO) — data shapes shared by the API layer, the form helpers and the UI. */

export const SSO_PROVIDERS = ['entra', 'google', 'okta', 'generic_oidc', 'generic_saml'] as const
export type SsoProvider = (typeof SSO_PROVIDERS)[number]
export type SsoProtocol = 'OIDC' | 'SAML'
export type SsoConnectionStatus = 'ENABLED' | 'DISABLED'
export type SsoTestStatus = 'SUCCESS' | 'FAILED'

export const SSO_WIZARD_STEPS = ['provider', 'idp', 'domains', 'users', 'security'] as const
export type SsoWizardStep = (typeof SSO_WIZARD_STEPS)[number]

export interface SsoAttributeMapping {
  email: string
  name: string
  groups: string
}

export interface SsoGroupRoleRule {
  group: string
  role: string
}

export interface SsoDomainTxtRecord {
  host: string
  type: 'TXT'
  value: string
}

export interface SsoDomain {
  id: string
  domain: string
  verified: boolean
  verifiedAt: string | null
  lastCheckError: string | null
  txtRecord: SsoDomainTxtRecord
}

export interface SsoServiceProvider {
  redirectUri: string
  acsUrl: string
  entityId: string
  metadataUrl: string
  loginUrl: string
}

export interface SsoAdmin {
  id: string
  name: string
  email: string
}

export type SsoTestWarning =
  | 'EMAIL_MISSING'
  | 'DOMAIN_NOT_VERIFIED'
  | 'NO_ROLE'
  | 'USER_NOT_PROVISIONED'
  | 'USER_IN_OTHER_ACCOUNT'

export interface SsoTestResult {
  claims?: Record<string, unknown>
  mapped?: {
    email: string | null
    name: string | null
    groups: string[]
    role: string | null
    matchedGroup: string | null
  }
  domainVerified?: boolean
  userExists?: boolean
  wouldProvision?: boolean
  warnings?: SsoTestWarning[]
  code?: string
  error?: string
}

export interface SsoLastTest {
  at: string
  status: SsoTestStatus
  result: SsoTestResult
}

export interface SsoConnection {
  id: string
  name: string
  provider: SsoProvider
  protocol: SsoProtocol
  status: SsoConnectionStatus
  issuerUrl: string | null
  clientId: string | null
  hasSecret: boolean
  scopes: string
  samlMetadataUrl: string | null
  hasSamlMetadataXml: boolean
  samlIdpEntityId: string | null
  samlSsoUrl: string | null
  samlIdpCertificate: string | null
  domains: SsoDomain[]
  attributeMapping: SsoAttributeMapping
  jitEnabled: boolean
  defaultRole: string | null
  groupRoleMapping: SsoGroupRoleRule[]
  requireSso: boolean
  breakGlassUser: SsoAdmin | null
  lastTest: SsoLastTest | null
  lastLoginAt: string | null
  createdAt: string
  sp: SsoServiceProvider
}

export interface SsoOptions {
  roles: string[]
  admins: SsoAdmin[]
}

export interface SsoEvent {
  id: string
  connectionId: string
  /** Dotted action name, e.g. `domain.verified`. */
  action: string
  actorName: string | null
  createdAt: string
}

/** Fields a wizard step may change. Omitted = keep, `null` = clear. */
export interface SsoConnectionPatch {
  name?: string
  issuerUrl?: string | null
  clientId?: string | null
  /** A new secret. `null` removes the stored one. */
  clientSecret?: string | null
  scopes?: string
  samlMetadataUrl?: string | null
  samlMetadataXml?: string
  samlIdpEntityId?: string | null
  samlSsoUrl?: string | null
  samlIdpCertificate?: string | null
  domains?: string[]
  attributeMapping?: SsoAttributeMapping
  jitEnabled?: boolean
  defaultRole?: string | null
  groupRoleMapping?: SsoGroupRoleRule[]
  status?: SsoConnectionStatus
  requireSso?: boolean
  breakGlassUserId?: string | null
}

export interface SsoCreatePayload {
  name: string
  provider: SsoProvider
}

export interface SsoDomainVerification {
  connection: SsoConnection
  verified: boolean
  lastCheckError: string | null
}
