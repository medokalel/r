import { Navigate, useLocation } from 'react-router-dom'
import { ClientUnavailablePage } from '@/pages/lazyPages'
import { isAuditClientSession } from '@/lib/authStorage'
import { resolveClientPortalRoute } from '@/lib/clientPortalRouting'

interface ClientPortalGateProps {
  children: React.ReactNode
}

/** Keeps the CAB-side /portal preview away from Audit Client sessions. */
export function ClientPortalGate({ children }: ClientPortalGateProps) {
  const location = useLocation()

  if (!isAuditClientSession()) return children

  const resolution = resolveClientPortalRoute(location.pathname)
  if (resolution.kind === 'redirect') return <Navigate to={resolution.to} replace />
  return <ClientUnavailablePage section={resolution.section} />
}
