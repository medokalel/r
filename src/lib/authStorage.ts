import type { LoginResponseData } from '@/lib/api/authApi'
import { AUTHENTICATED_HOME } from '@/lib/routes'
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

/** CAB (Certification Body) accounts land on the CAB dashboard; everyone else gets the generic one. */
export function getPostLoginRedirect(session: LoginResponseData): string {
  return session.organization?.type === 'CERTIFICATION_BODY' ? '/cab/dashboard' : AUTHENTICATED_HOME
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}
