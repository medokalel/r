import { isAbOnboardingComplete } from '@/lib/abOnboardingStatus'
import { isAuditeeOnboardingComplete } from '@/lib/auditeeOnboardingStatus'
import { isCabOnboardingComplete } from '@/lib/cabOnboardingStatus'

const KEY_PREFIX = 'icasco_onboarding_complete_'

export function isOnboardingComplete(organizationId: string): boolean {
  return (
    localStorage.getItem(KEY_PREFIX + organizationId) === 'true' ||
    isCabOnboardingComplete(organizationId) ||
    isAbOnboardingComplete(organizationId) ||
    isAuditeeOnboardingComplete(organizationId)
  )
}

export function markOnboardingComplete(organizationId: string): void {
  localStorage.setItem(KEY_PREFIX + organizationId, 'true')
}
