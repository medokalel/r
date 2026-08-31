import { getAuthSession } from '@/lib/authStorage'

/** True when the logged-in CAB admin has finished server-side setup. */
export function isCabSetupComplete(): boolean {
  return getAuthSession()?.cab?.setupCompleted === true
}

export function getCabId(): string | null {
  return getAuthSession()?.cab?.id ?? null
}

export function isCabAdminSession(): boolean {
  const session = getAuthSession()
  const roleName = session?.user?.role?.name ?? session?.role?.name
  return Boolean(session?.cab?.id || roleName === 'CAB_ADMIN')
}

const KEY_PREFIX = 'icasco_cab_onboarding_complete_'

/** Legacy local fallback keyed by cab id — prefer isCabSetupComplete(). */
export function isCabOnboardingComplete(cabId: string): boolean {
  if (isCabSetupComplete()) return true
  return localStorage.getItem(KEY_PREFIX + cabId) === 'true'
}

export function markCabOnboardingComplete(cabId: string): void {
  localStorage.setItem(KEY_PREFIX + cabId, 'true')
}
