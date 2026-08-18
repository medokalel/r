import type { LoginResponseData, OrganizationType } from '@/lib/api/authApi'
import { isOnboardingComplete } from '@/lib/onboardingStatus'
import { AUTHENTICATED_HOME, ROUTES } from '@/lib/routes'
const TOKEN_KEY = 'icasco_auth_token'
const SESSION_KEY = 'icasco_auth_session'

export function saveAuthSession(data: LoginResponseData, remember: boolean): void {
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(TOKEN_KEY, data.token)
  storage.setItem(SESSION_KEY, JSON.stringify(data))
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
}

export function getAuthSession(): LoginResponseData | null {
  const raw =
    localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as LoginResponseData
  } catch {
    return null
  }
}

/** After login, unfinished onboarding goes to the shared wizard. CAB users
 *  land on the CAB dashboard once onboarded; everyone else uses the generic
 *  dashboard. */
export function getPostLoginRedirect(session: LoginResponseData): string {
  const org = session.organization
  if (org && !isOnboardingComplete(org.id)) {
    return ROUTES.onboarding
  }
  if (org?.type === 'CERTIFICATION_BODY') {
    return ROUTES.cabDashboard
  }
  if (org?.type === 'ACCREDITATION_BODY') {
    return ROUTES.abDashboard
  }
  return AUTHENTICATED_HOME
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}

export function patchAuthOrganizationType(type: OrganizationType): void {
  const session = getAuthSession()
  if (!session?.organization) return

  const nextSession: LoginResponseData = {
    ...session,
    organization: { ...session.organization, type },
  }

  if (localStorage.getItem(SESSION_KEY)) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
    return
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
}
