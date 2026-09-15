import type { LoginResponseData, OrganizationType } from '@/lib/api/authApi'
import { isOnboardingComplete } from '@/lib/onboardingStatus'
import { AUTHENTICATED_HOME, ROUTES } from '@/lib/routes'
const TOKEN_KEY = 'icasco_auth_token'
const SESSION_KEY = 'icasco_auth_session'

export function saveAuthSession(data: LoginResponseData, remember: boolean): void {
  // Always clear the other storage first: otherwise a stale token in
  // localStorage would shadow the fresh sessionStorage token (getAuthToken
  // reads localStorage first) and the user gets kicked back to /login.
  if (remember) {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(SESSION_KEY)
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(SESSION_KEY, JSON.stringify(data))
  } else {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.setItem(TOKEN_KEY, data.token)
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
  }
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

export function isAuditClientSession(session = getAuthSession()): boolean {
  const organization = session?.organization
  return (
    organization?.type === 'CONSULTATION_BODY' &&
    organization.legalCapacity?.trim().toLowerCase() === 'audit client'
  )
}

/** After login, unfinished onboarding goes to the shared wizard. Every
 *  onboarded account lands in the application workspace. */
export function getPostLoginRedirect(session: LoginResponseData): string {
  if (isAuditClientSession(session)) {
    return ROUTES.dashboard
  }

  // CAB admin with completed setup goes straight to the workspace — even when
  // the generic organization record still reports DRAFT/null.
  if (session.cab?.setupCompleted || session.organization?.type === 'CERTIFICATION_BODY') {
    if (session.cab && !session.cab.setupCompleted) {
      return ROUTES.onboarding
    }
    return ROUTES.workspace
  }

  if (session.cab && !session.cab.setupCompleted) {
    return ROUTES.onboarding
  }

  const org = session.organization
  if (org && !isOnboardingComplete(org.id, org.onboardingStatus)) {
    return ROUTES.onboarding
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

export function patchCabSetupCompleted(setupCompleted: boolean): void {
  const session = getAuthSession()
  if (!session?.cab) return

  const nextSession: LoginResponseData = {
    ...session,
    cab: { ...session.cab, setupCompleted },
  }

  if (localStorage.getItem(SESSION_KEY)) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
    return
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
}

export function isCabUserOnboarded(): boolean {
  return getAuthSession()?.cab?.setupCompleted === true
}
