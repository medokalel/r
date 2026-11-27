import { Navigate, useParams } from 'react-router-dom'
import { ROUTES, cabCertificationAgreementDetailsPath } from '@/lib/routes'

/**
 * Countersigning now happens in the signing dialog on the agreement page (name, title, signature and an
 * emailed code). This route is kept so older links still land on the agreement.
 */
export function CabCertificationAgreementCountersignPage() {
  const { agreementId } = useParams<{ agreementId: string }>()
  return <Navigate to={agreementId ? cabCertificationAgreementDetailsPath(agreementId) : ROUTES.cabCertificationAgreements} replace />
}

export default CabCertificationAgreementCountersignPage
