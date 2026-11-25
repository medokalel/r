import { ROUTES } from '@/lib/routes'

export type ClientUnavailableSection = 'certificates' | 'notFound'

export type ClientPortalResolution =
  | { kind: 'redirect'; to: string }
  | { kind: 'unavailable'; section: ClientUnavailableSection }

/**
 * The /portal/* paths are the CAB-side preview of the client portal. An Audit Client who
 * opens one of them must land on their own screen, never on a CAB register or a CAB layout.
 * Sections that the client layer does not have yet say so instead of redirecting elsewhere.
 */
export function resolveClientPortalRoute(pathname: string): ClientPortalResolution {
  const path = pathname.replace(/\/+$/, '') || '/'
  switch (path) {
    case ROUTES.portal:
    case ROUTES.portalHome:
      return { kind: 'redirect', to: ROUTES.dashboard }
    case ROUTES.portalCompanyProfile:
      return { kind: 'redirect', to: ROUTES.companyProfile }
    case ROUTES.portalApplications:
      return { kind: 'redirect', to: ROUTES.certificationRequests }
    case ROUTES.portalOffers:
      return { kind: 'redirect', to: ROUTES.quotations }
    case ROUTES.portalInvoices:
      return { kind: 'redirect', to: ROUTES.invoices }
    case ROUTES.portalAgreements:
      return { kind: 'redirect', to: ROUTES.agreements }
    case ROUTES.portalAudits:
      return { kind: 'redirect', to: ROUTES.audits }
    case ROUTES.portalFindings:
      return { kind: 'redirect', to: ROUTES.findings }
    case ROUTES.portalCertificates:
      return { kind: 'unavailable', section: 'certificates' }
    default:
      return { kind: 'unavailable', section: 'notFound' }
  }
}
