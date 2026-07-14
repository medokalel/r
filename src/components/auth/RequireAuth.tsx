import { Navigate } from 'react-router-dom'
import { getAuthToken } from '@/lib/authStorage'

interface RequireAuthProps {
  children: React.ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  if (!getAuthToken()) {
    return <Navigate to="/login" replace />
  }

  return children
}
