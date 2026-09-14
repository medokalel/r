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

  const org = session.organization

  // CAB users: check all onboarding sources (session flag + localStorage fallbacks)
  if (
    session.cab ||
    org?.type === 'CERTIFICATION_BODY'
  ) {
    if (isCabUserOnboarded()) {
      return ROUTES.cabWorkspace
    }
    return ROUTES.onboarding
  }
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
  if (setupCompleted) {
    localStorage.setItem('icasco_cab_onboarding_completed', 'true')
    sessionStorage.setItem('icasco_cab_onboarding_completed', 'true')
    if (session?.organization?.id) {
      localStorage.setItem('icasco_onboarding_complete_' + session.organization.id, 'true')
    }
  }

  if (!session) return

  const nextSession: LoginResponseData = {
    ...session,
    cab: {
      id: session.cab?.id || session.organization?.id || 'cab-default',
      status: session.cab?.status || 'ACTIVE',
      setupCompleted,
    },
  }

  if (localStorage.getItem(SESSION_KEY)) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
}

export function isCabUserOnboarded(): boolean {
  const session = getAuthSession()
  if (session?.cab?.setupCompleted === true) return true
  if (
    localStorage.getItem('icasco_cab_onboarding_completed') === 'true' ||
    sessionStorage.getItem('icasco_cab_onboarding_completed') === 'true'
  ) {
    return true
  }
  if (
    session?.organization?.id &&
    isOnboardingComplete(session.organization.id, session.organization.onboardingStatus)
  ) {
    return true
  }
  return false
}
