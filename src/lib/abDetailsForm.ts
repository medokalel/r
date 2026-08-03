import type { CountryCode } from '@/lib/countries'

export interface AbAccreditationScopeDetail {
  accreditationBody: string
  country: CountryCode
}

export interface AbDetailsForm {
  abName: string
  accreditationBodies: string[]
  email: string
  mobileCountryCode: CountryCode
  mobile: string
  country: CountryCode
  contactPerson: string
  role: string
  /** Continuation screen (still step 1): AB types the org is accredited for. */
  accreditationScopes: string[]
  /** Per-scope accreditation body + country, keyed by the scope's value. */
  accreditationDetails: Record<string, AbAccreditationScopeDetail>
}

export const emptyAbDetailsForm: AbDetailsForm = {
  abName: '',
  accreditationBodies: [],
  email: '',
  mobileCountryCode: 'EG',
  mobile: '',
  country: '' as CountryCode,
  contactPerson: '',
  role: '',
  accreditationScopes: [],
  accreditationDetails: {},
}

export function isAbDetailsComplete(form: AbDetailsForm): boolean {
  return Boolean(
    form.abName &&
    form.accreditationBodies.length > 0 &&
    form.email.trim() &&
    form.country &&
    form.contactPerson.trim() &&
    form.role
  )
}

export function isAbAccreditationScopesComplete(form: AbDetailsForm): boolean {
  if (form.accreditationScopes.length === 0) return false
  return form.accreditationScopes.every((scope) => {
    const detail = form.accreditationDetails[scope]
    return Boolean(detail?.accreditationBody && detail?.country)
  })
}