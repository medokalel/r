const KEY_PREFIX = 'icasco_cab_onboarding_complete_'

// ponytail: client-side-only flag until the backend exposes a real
// onboardingCompleted field on the CAB organization — swap these two
// functions for a real API read/write then, callers don't change.
export function isCabOnboardingComplete(organizationId: string): boolean {
  return localStorage.getItem(KEY_PREFIX + organizationId) === 'true'
}

export function markCabOnboardingComplete(organizationId: string): void {
  localStorage.setItem(KEY_PREFIX + organizationId, 'true')
}
