import type { CountryCode } from '@/lib/countries'
import { isValidRequiredEmail } from '@/lib/authValidation'
import { isValidPhoneNumber } from '@/lib/validators'

export interface AuditeeDetailsForm {
  companyName: string
  country: CountryCode
  city: string
  contactPerson: string
  /** Fixed to "Admin" — read-only per the manager's spec, not user-editable. */
  role: string
  email: string
  mobileCountryCode: CountryCode
  mobile: string
}

export const emptyAuditeeDetailsForm: AuditeeDetailsForm = {
  companyName: '',
  country: '' as CountryCode,
  city: '',
  contactPerson: '',
  role: 'Admin',
  email: '',
  mobileCountryCode: 'EG',
  mobile: '',
}

export function isAuditeeDetailsComplete(form: AuditeeDetailsForm): boolean {
  return Boolean(
    form.companyName.trim() &&
      form.country &&
      form.city.trim() &&
      form.contactPerson.trim() &&
      isValidRequiredEmail(form.email) &&
      isValidPhoneNumber(form.mobile, form.mobileCountryCode)
  )
}