import { getAuthSession } from '@/lib/authStorage'
import type { ClientCertificateItem } from '@/lib/clientCertificates'
import { clientVisibleCertificates, scopeCertificatesToClient } from '@/lib/clientCertificates'

/**
 * The client portal has no certificates feed yet: an issued certificate reaches
 * the client only once the backend exists. Until then this returns nothing, so a
 * client never sees another client's records or demo rows presented as theirs.
 * Replace the body with the real request when the endpoint lands.
 */
async function loadCertificatesSource(): Promise<ClientCertificateItem[]> {
  return []
}

/** Certificates of the signed-in Audit Client only; drafts never reach the client. */
export async function listClientCertificates(): Promise<ClientCertificateItem[]> {
  const items = await loadCertificatesSource()
  return scopeCertificatesToClient(clientVisibleCertificates(items), getAuthSession()?.organization)
}
