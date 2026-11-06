import {
  SSO_DEFAULT_ATTRIBUTE_MAPPING,
  SSO_DEFAULT_SCOPES,
  SSO_FIXED_ISSUER,
} from '@/lib/sso'
import type {
  SsoAttributeMapping,
  SsoConnection,
  SsoConnectionPatch,
  SsoConnectionStatus,
  SsoGroupRoleRule,
  SsoProvider,
  SsoWizardStep,
} from '@/lib/api/ssoTypes'

/** Editable copy of a connection used by the wizard. */
export interface SsoDraft {
  name: string
  provider: SsoProvider
  issuerUrl: string
  clientId: string
  clientSecret: string
  clearSecret: boolean
  scopes: string
  samlMetadataUrl: string
  samlMetadataXml: string
  samlIdpEntityId: string
  samlSsoUrl: string
  samlIdpCertificate: string
  domains: string[]
  attributeMapping: SsoAttributeMapping
  jitEnabled: boolean
  defaultRole: string | null
  groupRoleMapping: SsoGroupRoleRule[]
  status: SsoConnectionStatus
  requireSso: boolean
  breakGlassUserId: string | null
}

export type SsoDraftSetter = <K extends keyof SsoDraft>(key: K, value: SsoDraft[K]) => void

export function createSsoDraft(connection: SsoConnection | null, provider: SsoProvider): SsoDraft {
  return {
    name: connection?.name ?? '',
    provider: connection?.provider ?? provider,
    issuerUrl: connection?.issuerUrl ?? SSO_FIXED_ISSUER[provider] ?? '',
    clientId: connection?.clientId ?? '',
    clientSecret: '',
    clearSecret: false,
    scopes: connection?.scopes ?? SSO_DEFAULT_SCOPES,
    samlMetadataUrl: connection?.samlMetadataUrl ?? '',
    samlMetadataXml: '',
    samlIdpEntityId: connection?.samlIdpEntityId ?? '',
    samlSsoUrl: connection?.samlSsoUrl ?? '',
    samlIdpCertificate: connection?.samlIdpCertificate ?? '',
    domains: connection?.domains.map((domain) => domain.domain) ?? [],
    attributeMapping: connection?.attributeMapping ?? { ...SSO_DEFAULT_ATTRIBUTE_MAPPING[provider] },
    jitEnabled: connection?.jitEnabled ?? false,
    defaultRole: connection?.defaultRole ?? null,
    groupRoleMapping: connection?.groupRoleMapping ?? [],
    status: connection?.status ?? 'DISABLED',
    requireSso: connection?.requireSso ?? false,
    breakGlassUserId: connection?.breakGlassUser?.id ?? null,
  }
}

/** Brings the draft in line with what the server saved, keeping what the server may have filled in. */
export function syncSsoDraft(draft: SsoDraft, saved: SsoConnection): SsoDraft {
  return {
    ...draft,
    clientSecret: '',
    clearSecret: false,
    samlMetadataXml: '',
    samlIdpEntityId: saved.samlIdpEntityId ?? draft.samlIdpEntityId,
    samlSsoUrl: saved.samlSsoUrl ?? draft.samlSsoUrl,
    samlIdpCertificate: saved.samlIdpCertificate ?? draft.samlIdpCertificate,
    domains: saved.domains.map((domain) => domain.domain),
    status: saved.status,
  }
}

function nullIfEmpty(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

/** What to send when the person saves the given step. */
export function buildSsoStepPayload(step: SsoWizardStep, draft: SsoDraft, protocol: 'OIDC' | 'SAML'): SsoConnectionPatch {
  switch (step) {
    case 'provider':
      return { name: draft.name.trim() }

    case 'idp': {
      if (protocol === 'OIDC') {
        const patch: SsoConnectionPatch = {
          issuerUrl: nullIfEmpty(draft.issuerUrl),
          clientId: nullIfEmpty(draft.clientId),
          scopes: draft.scopes,
        }
        if (draft.clearSecret) patch.clientSecret = null
        else if (draft.clientSecret) patch.clientSecret = draft.clientSecret
        return patch
      }
      const patch: SsoConnectionPatch = {
        samlMetadataUrl: nullIfEmpty(draft.samlMetadataUrl),
        samlIdpEntityId: nullIfEmpty(draft.samlIdpEntityId),
        samlSsoUrl: nullIfEmpty(draft.samlSsoUrl),
        samlIdpCertificate: nullIfEmpty(draft.samlIdpCertificate),
      }
      if (draft.samlMetadataXml.trim()) patch.samlMetadataXml = draft.samlMetadataXml
      return patch
    }

    case 'domains':
      return { domains: draft.domains }

    case 'users':
      return {
        attributeMapping: draft.attributeMapping,
        jitEnabled: draft.jitEnabled,
        defaultRole: draft.defaultRole,
        groupRoleMapping: draft.groupRoleMapping.filter((rule) => rule.group.trim() && rule.role),
      }

    case 'security':
      return {
        status: draft.status,
        requireSso: draft.requireSso,
        breakGlassUserId: draft.breakGlassUserId,
      }
  }
}
