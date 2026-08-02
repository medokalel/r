import { Navigate } from 'react-router-dom'
import { getAuthToken } from '@/lib/authStorage'
import { ROUTES } from '@/lib/routes'

interface RequireAuthProps {
  children: React.ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  if (!getAuthToken()) {
    return <Navigate to={ROUTES.login} replace />
  }

  return children
}
