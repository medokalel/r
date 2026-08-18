import type { UnifiedOnboardingForm } from '@/lib/unifiedOnboardingForm'

const DRAFT_KEY_PREFIX = 'icasco_onboarding_draft_'

export function loadOnboardingDraft(organizationId: string): Partial<UnifiedOnboardingForm> | null {
  const raw = localStorage.getItem(DRAFT_KEY_PREFIX + organizationId)
  if (!raw) return null

  try {
    return JSON.parse(raw) as Partial<UnifiedOnboardingForm>
  } catch {
    return null
  }
}

export function saveOnboardingDraft(organizationId: string, form: UnifiedOnboardingForm): void {
  localStorage.setItem(DRAFT_KEY_PREFIX + organizationId, JSON.stringify(form))
}
