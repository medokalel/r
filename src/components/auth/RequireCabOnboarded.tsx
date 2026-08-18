import { Navigate } from 'react-router-dom'
import { getAuthSession } from '@/lib/authStorage'
import { isOnboardingComplete } from '@/lib/onboardingStatus'
import { ROUTES } from '@/lib/routes'

interface RequireCabOnboardedProps {
  children: React.ReactNode
}

export function RequireCabOnboarded({ children }: RequireCabOnboardedProps) {
  const org = getAuthSession()?.organization
  if (org?.type === 'CERTIFICATION_BODY' && !isOnboardingComplete(org.id)) {
    return <Navigate to={ROUTES.onboarding} replace />
  }

  return children
}
