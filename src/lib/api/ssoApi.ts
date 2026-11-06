import type { TFunction } from 'i18next'
import { ApiError } from '@/lib/api/client'
import { getUserErrorMessage } from '@/lib/errorMessages'
import {
  SSO_DEFAULT_ATTRIBUTE_MAPPING,
  SSO_DEFAULT_SCOPES,
  SSO_FIXED_ISSUER,
  SSO_PROTOCOL,
  countVerifiedSsoDomains,
  getSsoMissingFields,
  normalizeSsoDomain,
  ssoErrorKey,
  type SsoErrorCode,
} from '@/lib/sso'
import {
  SSO_MOCK_ADMINS,
  SSO_MOCK_OPTIONS,
  SSO_MOCK_UNVERIFIABLE_WORD,
  buildMockServiceProvider,
  createInitialSsoMockState,
} from '@/lib/api/ssoMockData'
import type {
  SsoConnection,
  SsoConnectionPatch,
  SsoCreatePayload,
  SsoDomain,
  SsoDomainVerification,
  SsoEvent,
  SsoOptions,
  SsoTestResult,
  SsoTestWarning,
} from '@/lib/api/ssoTypes'

/**
 * Single sign-on API.
 *
 * TODO: there is no backend yet — every function below is answered from an in-memory mock
 * (reset on page refresh). When the endpoints exist, replace each body with a request, e.g.
 *   GET    /cab/sso/options
 *   GET    /cab/sso/connections
 *   POST   /cab/sso/connections
 *   PATCH  /cab/sso/connections/:id
 *   DELETE /cab/sso/connections/:id
 *   POST   /cab/sso/connections/:id/domains/verify
 *   POST   /cab/sso/connections/:id/test
 *   GET    /cab/sso/events
 * The function signatures are the contract the UI relies on, so the UI does not change.
 */

export class SsoApiError extends ApiError {
  readonly code?: SsoErrorCode

  constructor(message: string, status: number, code?: SsoErrorCode) {
    super(message, status)
    this.name = 'SsoApiError'
    this.code = code
  }
}

/** The user-facing message for a failed SSO request (translated; never a raw server string). */
export function getSsoErrorMessage(error: unknown, t: TFunction): string {
  if (error instanceof SsoApiError && error.code) return t(ssoErrorKey(error.code))
  return getUserErrorMessage(error, t, { fallbackKey: 'cab.sso.errors.generic' })
}

const MOCK_LATENCY_MS = 220
const MOCK_TEST_LATENCY_MS = 900
const MAX_EVENTS = 200

const state = createInitialSsoMockState()
let nextId = 1

function delay(ms = MOCK_LATENCY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function makeId(prefix: string): string {
  const id = `${prefix}-${String(Date.now()).slice(-6)}${String(nextId).padStart(3, '0')}`
  nextId += 1
  return id
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function findConnection(id: string): SsoConnection {
  const connection = state.connections.find((item) => item.id === id)
  if (!connection) throw new SsoApiError('Connection not found', 404, 'SSO_CONNECTION_NOT_FOUND')
  return connection
}

function record(connectionId: string, action: string): void {
  const event: SsoEvent = {
    id: makeId('sso-event'),
    connectionId,
    action,
    actorName: SSO_MOCK_ADMINS[0].name,
    createdAt: new Date().toISOString(),
  }
  state.events = [event, ...state.events].slice(0, MAX_EVENTS)
}

function createDomain(domain: string): SsoDomain {
  const token = Math.random().toString(16).slice(2, 14).padEnd(12, '0') + Date.now().toString(16).slice(-12)
  return {
    id: makeId('sso-domain'),
    domain,
    verified: false,
    verifiedAt: null,
    lastCheckError: null,
    txtRecord: { host: domain, type: 'TXT', value: `icasco-verification=${token}` },
  }
}

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export async function getSsoOptions(): Promise<SsoOptions> {
  await delay()
  return clone(SSO_MOCK_OPTIONS)
}

export async function listSsoConnections(): Promise<SsoConnection[]> {
  await delay()
  return clone(state.connections)
}

export async function listSsoEvents(limit = 20): Promise<SsoEvent[]> {
  await delay(120)
  return clone(state.events.slice(0, limit))
}

export async function createSsoConnection(payload: SsoCreatePayload): Promise<SsoConnection> {
  await delay()
  const id = makeId('sso-conn')
  const connection: SsoConnection = {
    id,
    name: payload.name.trim(),
    provider: payload.provider,
    protocol: SSO_PROTOCOL[payload.provider],
    status: 'DISABLED',
    issuerUrl: SSO_FIXED_ISSUER[payload.provider] ?? null,
    clientId: null,
    hasSecret: false,
    scopes: SSO_DEFAULT_SCOPES,
    samlMetadataUrl: null,
    hasSamlMetadataXml: false,
    samlIdpEntityId: null,
    samlSsoUrl: null,
    samlIdpCertificate: null,
    domains: [],
    attributeMapping: { ...SSO_DEFAULT_ATTRIBUTE_MAPPING[payload.provider] },
    jitEnabled: false,
    defaultRole: null,
    groupRoleMapping: [],
    requireSso: false,
    breakGlassUser: null,
    lastTest: null,
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
    sp: buildMockServiceProvider(id),
  }
  state.connections = [...state.connections, connection]
  record(id, 'connection.created')
  return clone(connection)
}

export async function updateSsoConnection(id: string, patch: SsoConnectionPatch): Promise<SsoConnection> {
  await delay()
  const current = findConnection(id)
  const next: SsoConnection = clone(current)
  const events: string[] = []

  if (patch.name !== undefined) next.name = patch.name.trim() || current.name
  if (patch.scopes !== undefined) next.scopes = patch.scopes.trim() || SSO_DEFAULT_SCOPES
  if (patch.issuerUrl !== undefined) next.issuerUrl = emptyToNull(patch.issuerUrl)
  if (patch.clientId !== undefined) next.clientId = emptyToNull(patch.clientId)
  if (patch.samlMetadataUrl !== undefined) next.samlMetadataUrl = emptyToNull(patch.samlMetadataUrl)
  if (patch.samlIdpEntityId !== undefined) next.samlIdpEntityId = emptyToNull(patch.samlIdpEntityId)
  if (patch.samlSsoUrl !== undefined) next.samlSsoUrl = emptyToNull(patch.samlSsoUrl)
  if (patch.samlIdpCertificate !== undefined) next.samlIdpCertificate = emptyToNull(patch.samlIdpCertificate)
  if (patch.attributeMapping !== undefined) next.attributeMapping = { ...patch.attributeMapping }
  if (patch.groupRoleMapping !== undefined) next.groupRoleMapping = patch.groupRoleMapping.map((rule) => ({ ...rule }))
  if (patch.defaultRole !== undefined) next.defaultRole = patch.defaultRole

  if (patch.clientSecret !== undefined) {
    next.hasSecret = patch.clientSecret !== null && patch.clientSecret.length > 0
    events.push('connection.secret_changed')
  }
  if (patch.samlMetadataXml?.trim()) {
    next.hasSamlMetadataXml = true
    // The server reads the sign-in URL from the metadata; the mock fills it in.
    next.samlSsoUrl ??= 'https://idp.example.com/saml/sso'
    next.samlIdpEntityId ??= 'https://idp.example.com/saml/metadata'
  }
  if (patch.jitEnabled !== undefined && patch.jitEnabled !== current.jitEnabled) {
    next.jitEnabled = patch.jitEnabled
    events.push('jit.changed')
  }
  if (patch.breakGlassUserId !== undefined) {
    next.breakGlassUser = SSO_MOCK_ADMINS.find((admin) => admin.id === patch.breakGlassUserId) ?? null
  }

  if (patch.domains !== undefined) {
    const wanted = patch.domains.map(normalizeSsoDomain)
    const taken = state.connections.some(
      (other) => other.id !== id && other.domains.some((domain) => wanted.includes(domain.domain)),
    )
    if (taken) throw new SsoApiError('Domain already used', 409, 'SSO_DOMAIN_TAKEN')

    const kept = next.domains.filter((domain) => wanted.includes(domain.domain))
    const added = wanted.filter((domain) => !kept.some((item) => item.domain === domain)).map(createDomain)
    events.push(
      ...next.domains.filter((domain) => !wanted.includes(domain.domain)).map(() => 'domain.removed'),
      ...added.map(() => 'domain.added'),
    )
    next.domains = [...kept, ...added]
  }

  if (patch.requireSso !== undefined && patch.requireSso !== current.requireSso) {
    events.push('enforcement.changed')
  }
  if (patch.requireSso !== undefined) next.requireSso = patch.requireSso
  if (next.requireSso && (!next.breakGlassUser || countVerifiedSsoDomains(next) < 1)) {
    throw new SsoApiError('Require SSO needs a verified domain and a break-glass administrator', 422)
  }

  if (patch.status !== undefined && patch.status !== current.status) {
    if (patch.status === 'ENABLED' && getSsoMissingFields(next).length > 0) {
      throw new SsoApiError('Connection is incomplete', 422, 'SSO_CONNECTION_INCOMPLETE')
    }
    next.status = patch.status
    events.push(patch.status === 'ENABLED' ? 'connection.enabled' : 'connection.disabled')
  }

  if (events.length === 0) events.push('connection.updated')

  state.connections = state.connections.map((item) => (item.id === id ? next : item))
  events.forEach((action) => record(id, action))
  return clone(next)
}

export async function deleteSsoConnection(id: string): Promise<void> {
  await delay()
  findConnection(id)
  state.connections = state.connections.filter((item) => item.id !== id)
  record(id, 'connection.deleted')
}

export async function verifySsoDomain(id: string, domainName: string): Promise<SsoDomainVerification> {
  await delay(600)
  const current = findConnection(id)
  const domain = current.domains.find((item) => item.domain === domainName)
  if (!domain) throw new SsoApiError('Domain not found', 404, 'SSO_VALIDATION_FAILED')

  const verified = !domain.domain.includes(SSO_MOCK_UNVERIFIABLE_WORD)
  const lastCheckError = verified ? null : 'No TXT record with the expected value was found yet.'
  const next: SsoConnection = {
    ...current,
    domains: current.domains.map((item) =>
      item.domain === domainName
        ? {
            ...item,
            verified,
            verifiedAt: verified ? new Date().toISOString() : null,
            lastCheckError,
          }
        : item,
    ),
  }
  state.connections = state.connections.map((item) => (item.id === id ? next : item))
  record(id, verified ? 'domain.verified' : 'domain.verification_failed')
  return { connection: clone(next), verified, lastCheckError }
}

/** Simulates the sign-in round trip with the identity provider (a pop-up window once the backend exists). */
export async function testSsoConnection(id: string): Promise<SsoConnection> {
  await delay(MOCK_TEST_LATENCY_MS)
  const current = findConnection(id)

  let status: 'SUCCESS' | 'FAILED' = 'SUCCESS'
  let result: SsoTestResult

  if (getSsoMissingFields(current).length > 0) {
    status = 'FAILED'
    result = { code: 'SSO_CONNECTION_INCOMPLETE', error: 'The identity provider settings are incomplete.' }
  } else {
    const admin = current.breakGlassUser ?? SSO_MOCK_ADMINS[0]
    const verifiedDomain = current.domains.find((domain) => domain.verified)
    // The simulated person signs in with an address on the connection's first verified domain.
    const person = {
      name: admin.name,
      email: verifiedDomain ? `${admin.email.split('@')[0]}@${verifiedDomain.domain}` : admin.email,
    }
    const rule = current.groupRoleMapping[0] ?? null
    const groups = rule ? [rule.group] : []
    const role = rule ? rule.role : current.defaultRole
    const domainVerified = verifiedDomain !== undefined
    const warnings: SsoTestWarning[] = []
    if (!domainVerified) warnings.push('DOMAIN_NOT_VERIFIED')
    if (!role) warnings.push('NO_ROLE')

    const claims: Record<string, unknown> = {
      sub: 'AAAAAAAAAA-example',
      [current.attributeMapping.email]: person.email,
      [current.attributeMapping.name]: person.name,
    }
    if (current.attributeMapping.groups) claims[current.attributeMapping.groups] = groups

    result = {
      claims,
      mapped: { email: person.email, name: person.name, groups, role, matchedGroup: rule?.group ?? null },
      domainVerified,
      userExists: true,
      wouldProvision: false,
      warnings,
    }
  }

  const next: SsoConnection = { ...current, lastTest: { at: new Date().toISOString(), status, result } }
  state.connections = state.connections.map((item) => (item.id === id ? next : item))
  record(id, status === 'SUCCESS' ? 'test.succeeded' : 'test.failed')
  return clone(next)
}
