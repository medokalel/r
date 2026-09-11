import type { CountryCode } from '@/lib/countries'
import { isValidEmailFormat, isValidPhoneNumber, isValidWebsite } from '@/lib/validators'

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
  const incorporationDate = form.incorporationDate
  const incorporationDateValid =
    incorporationDate instanceof Date &&
    !Number.isNaN(incorporationDate.getTime()) &&
    new Date(incorporationDate.getFullYear(), incorporationDate.getMonth(), incorporationDate.getDate()).getTime() <=
      new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime()
  return Boolean(
    form.legalEntityName.trim() &&
      form.organizationType &&
      form.registrationNumber.trim() &&
      incorporationDateValid &&
      form.country &&
      form.state.trim() &&
      form.city.trim()
  )
}

export function isRegisteredAddressComplete(form: ClientRegistrationForm): boolean {
  return Boolean(
    form.addressLine1.trim() &&
      form.postalCode.trim() &&
      form.addressCountry &&
      form.addressState.trim() &&
      form.addressCity.trim()
  )
}

export function isPrimaryContactComplete(form: ClientRegistrationForm): boolean {
  return Boolean(
    form.contactFullName.trim() &&
      form.contactDesignation.trim() &&
      form.contactEmail.trim() &&
      isValidEmailFormat(form.contactEmail) &&
      form.phoneNumber.trim() &&
      isValidPhoneNumber(form.phoneNumber, form.phoneCountryCode) &&
      (!form.mobileNumber.trim() ||
        isValidPhoneNumber(form.mobileNumber, form.mobileCountryCode))
  )
}

export function isAdditionalInfoComplete(form: ClientRegistrationForm): boolean {
  return Boolean(
    form.industry &&
      form.employeeCount &&
      form.annualTurnover &&
      form.activitiesDescription.trim() &&
      isValidWebsite(form.website)
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