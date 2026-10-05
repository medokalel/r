import type { CountryCode } from '@/lib/countries'
import { isValidEmailFormat, isValidPhoneNumber } from '@/lib/validators'

/** Fields accepted by POST /cab-clients. */
export interface ClientRegistrationForm {
  email: string
  organizationName: string
  administrationName: string
  facilityOwnerManager: string
  activity: string
  legalCapacity: string
  country: CountryCode | ''
  city: string
  phoneCountryCode: CountryCode
  phoneNumber: string
}

export const emptyClientRegistrationForm: ClientRegistrationForm = {
  email: '',
  organizationName: '',
  administrationName: '',
  facilityOwnerManager: '',
  activity: '',
  legalCapacity: '',
  country: 'EG',
  city: '',
  phoneCountryCode: 'EG',
  phoneNumber: '',
}

export function isClientRegistrationComplete(form: ClientRegistrationForm): boolean {
  return Boolean(
    form.organizationName.trim().length >= 2 &&
      form.administrationName.trim().length >= 2 &&
      form.facilityOwnerManager.trim().length >= 2 &&
      form.activity.trim().length >= 2 &&
      form.legalCapacity.trim().length >= 2 &&
      form.country &&
      form.city.trim().length >= 2 &&
      isValidEmailFormat(form.email) &&
      isValidPhoneNumber(form.phoneNumber, form.phoneCountryCode)
  )
}
