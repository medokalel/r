import type { CountryCode } from '@/lib/countries'

export interface ClientRegistrationForm {
  // Client Information
  legalEntityName: string
  tradingName: string
  organizationType: string
  registrationNumber: string
  incorporationDate: Date | null
  country: CountryCode | ''
  state: string
  city: string

  // Registered Address
  addressLine1: string
  addressLine2: string
  landmark: string
  postalCode: string
  addressCountry: CountryCode | ''
  addressState: string
  addressCity: string

  // Primary Contact Person
  contactFullName: string
  contactDesignation: string
  contactEmail: string
  phoneCountryCode: CountryCode
  phoneNumber: string
  mobileCountryCode: CountryCode
  mobileNumber: string

  // Additional Information
  industry: string
  employeeCount: string
  annualTurnover: string
  website: string
  activitiesDescription: string
}

export const emptyClientRegistrationForm: ClientRegistrationForm = {
  legalEntityName: '',
  tradingName: '',
  organizationType: '',
  registrationNumber: '',
  incorporationDate: null,
  country: '',
  state: '',
  city: '',

  addressLine1: '',
  addressLine2: '',
  landmark: '',
  postalCode: '',
  addressCountry: '',
  addressState: '',
  addressCity: '',

  contactFullName: '',
  contactDesignation: '',
  contactEmail: '',
  phoneCountryCode: 'EG',
  phoneNumber: '',
  mobileCountryCode: 'EG',
  mobileNumber: '',

  industry: '',
  employeeCount: '',
  annualTurnover: '',
  website: '',
  activitiesDescription: '',
}

export function isClientInfoComplete(form: ClientRegistrationForm): boolean {
  return Boolean(
    form.legalEntityName.trim() &&
      form.organizationType &&
      form.registrationNumber.trim() &&
      form.incorporationDate &&
      form.country &&
      form.state &&
      form.city.trim()
  )
}

export function isRegisteredAddressComplete(form: ClientRegistrationForm): boolean {
  return Boolean(
    form.addressLine1.trim() &&
      form.postalCode.trim() &&
      form.addressCountry &&
      form.addressState &&
      form.addressCity.trim()
  )
}

export function isPrimaryContactComplete(form: ClientRegistrationForm): boolean {
  return Boolean(
    form.contactFullName.trim() &&
      form.contactDesignation.trim() &&
      form.contactEmail.trim() &&
      form.phoneNumber.trim()
  )
}

export function isAdditionalInfoComplete(form: ClientRegistrationForm): boolean {
  return Boolean(
    form.industry && form.employeeCount && form.annualTurnover && form.activitiesDescription.trim()
  )
}

export function isClientRegistrationComplete(form: ClientRegistrationForm): boolean {
  return (
    isClientInfoComplete(form) &&
    isRegisteredAddressComplete(form) &&
    isPrimaryContactComplete(form) &&
    isAdditionalInfoComplete(form)
  )
}