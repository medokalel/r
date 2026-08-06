import type { CountryCode } from '@/lib/countries'

export interface CabAccreditationScopeDetail {
  accreditationBody: string
  country: CountryCode
}

export interface CabDetailsForm {
  cabName: string
  accreditationBodies: string[]
  email: string
  mobileCountryCode: CountryCode
  mobile: string
  country: CountryCode
  contactPerson: string
  role: string
  /** Continuation screen (still step 1): CAB types the org is accredited for. */
  accreditationScopes: string[]
  /** Per-scope accreditation body + country, keyed by the scope's value. */
  accreditationDetails: Record<string, CabAccreditationScopeDetail>
}

// بعد
export const emptyCabDetailsForm: CabDetailsForm = {
  cabName: '',
  accreditationBodies: [],
  email: '',
  mobileCountryCode: 'EG',
  mobile: '',
  country: '' as CountryCode,
  contactPerson: '',
  role: 'OWNER',
  accreditationScopes: [],
  accreditationDetails: {},
}

export function isCabDetailsComplete(form: CabDetailsForm): boolean {
  return Boolean(
    form.cabName &&
    form.accreditationBodies.length > 0 &&
    form.email.trim() &&
    form.country &&
    form.contactPerson.trim() &&
    form.role
  )
}

export function isCabAccreditationScopesComplete(form: CabDetailsForm): boolean {
  if (form.accreditationScopes.length === 0) return false
  return form.accreditationScopes.every((scope) => {
    const detail = form.accreditationDetails[scope]
    return Boolean(detail?.accreditationBody && detail?.country)
  })
}