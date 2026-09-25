import { authorizedRequest } from '@/lib/api/authorizedClient'
import type {
  ApplicationResponse,
  DraftApplicationRequest,
} from '@/lib/api/certificationApplicationApi'

export interface CabCertificationApplication extends ApplicationResponse {
  organization?: {
    id: string
    name: string
    city?: string | null
  }
}

const clientApplicationsPath = (clientId: string) =>
  `/cab-clients/${encodeURIComponent(clientId)}/certification-applications`

export function listCabCertificationApplications(): Promise<
  CabCertificationApplication[]
> {
  return authorizedRequest('/cab/certification-applications')
}

export function createCabClientCertificationApplication(
  clientId: string,
  payload: DraftApplicationRequest,
): Promise<CabCertificationApplication> {
  return authorizedRequest(clientApplicationsPath(clientId), {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function listCabClientCertificationApplications(
  clientId: string,
): Promise<CabCertificationApplication[]> {
  return authorizedRequest(clientApplicationsPath(clientId))
}

export function updateCabClientCertificationApplicationDraft(
  clientId: string,
  applicationId: string,
  payload: DraftApplicationRequest,
): Promise<CabCertificationApplication> {
  return authorizedRequest(
    `${clientApplicationsPath(clientId)}/${encodeURIComponent(applicationId)}/draft`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  )
}

export function submitCabClientCertificationApplication(
  clientId: string,
  applicationId: string,
): Promise<CabCertificationApplication> {
  return authorizedRequest(
    `${clientApplicationsPath(clientId)}/${encodeURIComponent(applicationId)}/submit`,
    { method: 'POST' },
  )
}

export function getCabClientCertificationApplication(
  clientId: string,
  applicationId: string,
): Promise<CabCertificationApplication> {
  return authorizedRequest(
    `${clientApplicationsPath(clientId)}/${encodeURIComponent(applicationId)}`,
  )
}

export function clientIdOf(
  application: CabCertificationApplication,
): string {
  return application.organization?.id ?? application.organizationId ?? ''
}

export async function startCabClientApplication(
  clientId: string,
): Promise<CabCertificationApplication> {
  const existing = await listCabClientCertificationApplications(clientId)
  const draft = existing.find((item) => item.status === 'DRAFT')
  if (draft) return draft
  return createCabClientCertificationApplication(clientId, {})
}

export async function resolveCabCertificationApplication(
  applicationId?: string | null,
  clientId?: string | null,
): Promise<CabCertificationApplication | null> {
  if (clientId && applicationId) {
    return getCabClientCertificationApplication(clientId, applicationId)
  }
  if (!applicationId) return null
  const applications = await listCabCertificationApplications()
  const match = applications.find(
    (item) => item.id === applicationId || item.orderNumber === applicationId,
  )
  if (!match) return null
  const resolvedClientId = clientIdOf(match)
  if (!resolvedClientId) return match
  return getCabClientCertificationApplication(resolvedClientId, match.id)
}

export interface CabApplicationOverlay {
  application: CabCertificationApplication
  clientId: string
  clientName: string
  standards: string[]
  submittedDate: Date
}

export async function loadCabApplicationOverlay(
  applicationId?: string | null,
  clientId?: string | null,
): Promise<CabApplicationOverlay | null> {
  try {
    const application = await resolveCabCertificationApplication(
      applicationId,
      clientId,
    )
    if (!application) return null
    const submitted =
      application.submittedAt || application.updatedAt || application.createdAt
    return {
      application,
      clientId: clientIdOf(application),
      clientName:
        application.organization?.name ||
        application.legalInfo?.organizationName ||
        '',
      standards: (application.certificates ?? [])
        .map(
          (certificate) =>
            certificate.certificateName || certificate.certificateCode || '',
        )
        .filter(Boolean),
      submittedDate: submitted ? new Date(submitted) : new Date(),
    }
  } catch {
    return null
  }
}
