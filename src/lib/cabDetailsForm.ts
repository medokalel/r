import type { CountryCode } from '@/lib/countries'

export interface CabDetailsForm {
  cabType: string
  cabName: string
  accreditationBodies: string[]
  email: string
  mobileCountryCode: CountryCode
  mobile: string
  country: CountryCode
  contactPerson: string
  role: string
}

export const emptyCabDetailsForm: CabDetailsForm = {
  cabType: '',
  cabName: '',
  accreditationBodies: [],
  email: '',
  mobileCountryCode: 'EG',
  mobile: '',
  country: '' as CountryCode,
  contactPerson: '',
  role: '',
}

export function isCabDetailsComplete(form: CabDetailsForm): boolean {
  return Boolean(
    form.cabType &&
      form.cabName &&
      form.accreditationBodies.length > 0 &&
      form.email.trim() &&
      form.country &&
      form.contactPerson.trim() &&
      form.role
  )
}