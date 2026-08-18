import { Navigate } from 'react-router-dom'
import { getAuthSession } from '@/lib/authStorage'
import { isOnboardingComplete } from '@/lib/onboardingStatus'
import { ROUTES } from '@/lib/routes'

interface RequireAuditeeOnboardedProps {
  children: React.ReactNode
}

export function RequireAuditeeOnboarded({ children }: RequireAuditeeOnboardedProps) {
  const org = getAuthSession()?.organization
  if (org?.type === 'CONSULTATION_BODY' && !isOnboardingComplete(org.id)) {
    return <Navigate to={ROUTES.onboarding} replace />
  }

  return children
}
