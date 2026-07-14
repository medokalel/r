import type { LoginResponseData } from '@/lib/api/authApi'

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

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}
