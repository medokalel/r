import type { CountryCode } from '@/lib/countries'
import type { TFunction } from 'i18next'
import type { ValidationRules } from '@/hooks/useFieldValidation'
import { emailRule, phoneRule, textRule } from '@/lib/fieldRules'

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

/** Mirrors the backend createClientSchema (POST /cab-clients) limits. */
export function getClientRegistrationRules(
  t: TFunction
): ValidationRules<ClientRegistrationForm> {
  return {
    organizationName: textRule(t, { kind: 'mixed', min: 2, max: 200 }),
    legalCapacity: textRule(t, { min: 2, max: 200 }),
    administrationName: textRule(t, { kind: 'mixed', min: 2, max: 200 }),
    country: (value) => (value ? undefined : t('validation.required')),
    city: textRule(t, { min: 2, max: 100 }),
    activity: textRule(t, { min: 2, max: 300 }),
    facilityOwnerManager: textRule(t, { kind: 'text', min: 2, max: 200 }),
    email: emailRule(t),
    phoneNumber: (value, form) => phoneRule(t, form.phoneCountryCode)(value),
  }
}
