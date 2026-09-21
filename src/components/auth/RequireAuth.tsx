import { Navigate, useLocation } from 'react-router-dom'
import { getAuthSession, getAuthToken } from '@/lib/authStorage'
import { ROUTES } from '@/lib/routes'

interface RequireAuthProps {
  children: React.ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation()

  if (!getAuthToken()) {
    return <Navigate to={ROUTES.login} replace />
  }

  const session = getAuthSession()
  const isCab =
    Boolean(session?.cab) || session?.organization?.type === 'CERTIFICATION_BODY'
  const isCabRoute = location.pathname.startsWith('/cab/')
  const isAuditClientRoute = [
    ROUTES.dashboard,
    ROUTES.certificationRequestNew,
    ROUTES.certificationRequests,
    ROUTES.dashboardTasks,
    ROUTES.companyProfile,
    ROUTES.users,
    ROUTES.wallet,
    ROUTES.periodicVisits,
    ROUTES.invoices,
  ].some(
    (route) =>
      location.pathname === route || location.pathname.startsWith(`${route}/`)
  )

  if (!isCab && isCabRoute) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  if (isCab && isAuditClientRoute) {
    return <Navigate to={ROUTES.workspace} replace />
  }

  return children
}
