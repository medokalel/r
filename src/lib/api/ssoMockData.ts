import type { SsoAdmin, SsoConnection, SsoEvent, SsoOptions, SsoServiceProvider } from '@/lib/api/ssoTypes'

/**
 * Mock data for the single sign-on settings — there is no backend endpoint yet.
 * Replace the calls in `ssoApi.ts` with real requests when the endpoints exist.
 */

export const SSO_MOCK_ADMINS: SsoAdmin[] = [
  { id: 'usr-admin-0001', name: 'Sara Al Qahtani', email: 'sara.alqahtani@casco.example' },
  { id: 'usr-admin-0002', name: 'Huda Al Harbi', email: 'huda.alharbi@casco.example' },
]

export const SSO_MOCK_OPTIONS: SsoOptions = {
  roles: ['CAB_ADMIN'],
  admins: SSO_MOCK_ADMINS,
}

/** A domain containing this word always fails the DNS check, so the "not verified" path can be seen. */
export const SSO_MOCK_UNVERIFIABLE_WORD = 'unverified'

const SP_BASE_URL = 'https://api.icasco.co/api/v1/auth/sso'

export function buildMockServiceProvider(connectionId: string): SsoServiceProvider {
  return {
    redirectUri: `${SP_BASE_URL}/${connectionId}/callback`,
    acsUrl: `${SP_BASE_URL}/${connectionId}/acs`,
    entityId: `${SP_BASE_URL}/${connectionId}/metadata`,
    metadataUrl: `${SP_BASE_URL}/${connectionId}/metadata`,
    loginUrl: `${SP_BASE_URL}/${connectionId}/login`,
  }
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

export function createInitialSsoMockState(): { connections: SsoConnection[]; events: SsoEvent[] } {
  const connectionId = 'sso-conn-0001'
  const connection: SsoConnection = {
    id: connectionId,
    name: 'CASCO Microsoft accounts',
    provider: 'entra',
    protocol: 'OIDC',
    status: 'ENABLED',
    issuerUrl: 'https://login.microsoftonline.com/7f3c1d2e-58a4-4b8e-9a61-2c1b5d0e9f10/v2.0',
    clientId: '3b9a6f0c-41d2-4e7a-8c15-92f0a7d4e6b8',
    hasSecret: true,
    scopes: 'openid email profile',
    samlMetadataUrl: null,
    hasSamlMetadataXml: false,
    samlIdpEntityId: null,
    samlSsoUrl: null,
    samlIdpCertificate: null,
    domains: [
      {
        id: 'sso-domain-0001',
        domain: 'casco.example',
        verified: true,
        verifiedAt: daysAgo(12),
        lastCheckError: null,
        txtRecord: {
          host: 'casco.example',
          type: 'TXT',
          value: 'icasco-verification=8f2c61a94b7d4e30a5c1d9e2',
        },
      },
    ],
    attributeMapping: { email: 'email', name: 'name', groups: 'groups' },
    jitEnabled: true,
    defaultRole: 'CAB_ADMIN',
    groupRoleMapping: [],
    requireSso: false,
    breakGlassUser: SSO_MOCK_ADMINS[0],
    lastTest: {
      at: daysAgo(2),
      status: 'SUCCESS',
      result: {
        claims: {
          sub: 'AAAAAAAAAA-example',
          email: SSO_MOCK_ADMINS[0].email,
          name: SSO_MOCK_ADMINS[0].name,
        },
        mapped: {
          email: SSO_MOCK_ADMINS[0].email,
          name: SSO_MOCK_ADMINS[0].name,
          groups: [],
          role: 'CAB_ADMIN',
          matchedGroup: null,
        },
        domainVerified: true,
        userExists: true,
        wouldProvision: false,
        warnings: [],
      },
    },
    lastLoginAt: daysAgo(1),
    createdAt: daysAgo(14),
    sp: buildMockServiceProvider(connectionId),
  }

  const actorName = SSO_MOCK_ADMINS[0].name
  const events: SsoEvent[] = [
    { id: 'sso-event-0004', connectionId, action: 'connection.enabled', actorName, createdAt: daysAgo(2) },
    { id: 'sso-event-0003', connectionId, action: 'test.succeeded', actorName, createdAt: daysAgo(2) },
    { id: 'sso-event-0002', connectionId, action: 'domain.verified', actorName, createdAt: daysAgo(12) },
    { id: 'sso-event-0001', connectionId, action: 'connection.created', actorName, createdAt: daysAgo(14) },
  ]

  return { connections: [connection], events }
}
