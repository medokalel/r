import { register, login, type OrganizationType } from '@/lib/api/authApi'
import { saveAuthSession } from '@/lib/authStorage'
import {
  clearPendingRegistration,
  loadPendingRegistration,
  type PendingRegistration,
} from '@/lib/pendingRegistrationStorage'

function buildRegisterPayload(pending: PendingRegistration, entityType: OrganizationType) {
  const registrantName = pending.fullName.trim()

  return {
    entityType,
    email: pending.email,
    organizationName: registrantName,
    administrationName: registrantName,
    facilityOwnerManager: registrantName,
    activity: registrantName,
    legalCapacity: registrantName,
    city: pending.countryName,
    phone: pending.phone,
    password: pending.password,
    confirmPassword: pending.confirmPassword,
  }
}

/** Creates the account via `/auth/register` with the onboarding org type, then logs in. */
export async function completePendingRegistration(entityType: OrganizationType): Promise<boolean> {
  const pending = loadPendingRegistration()
  if (!pending) return false

  await register(buildRegisterPayload(pending, entityType))
  const session = await login(pending.email, pending.password)
  saveAuthSession(session, true)
  clearPendingRegistration()
  return true
}
