import type { CountryCode } from '@/lib/countries'

export interface ApplicationDraftForm {
  // Application Details
  applicationType: string
  primaryStandard: string
  applicationDate: Date | undefined
  certificationBody: string
  additionalStandards: string[]
  requestedAuditDate: Date | undefined
  applicableScheme: string
  accreditationBody: string
  auditLanguage: string
  // Scope of Certification (Brief)
  scopeDescription: string
  // Billing Contact (if different) — optional section
  billingFullName: string
  billingEmail: string
  billingMobileCountryCode: CountryCode
  billingMobile: string
  billingAddress: string
}

export const emptyApplicationDraftForm: ApplicationDraftForm = {
  applicationType: '',
  primaryStandard: '',
  applicationDate: undefined,
  certificationBody: '',
  additionalStandards: [],
  requestedAuditDate: undefined,
  applicableScheme: '',
  accreditationBody: '',
  auditLanguage: '',
  scopeDescription: '',
  billingFullName: '',
  billingEmail: '',
  billingMobileCountryCode: 'EG',
  billingMobile: '',
  billingAddress: '',
}

/** Only the fields marked required (*) in the design gate "Save & Continue" — Billing Contact is optional throughout. */
export function isApplicationDraftComplete(form: ApplicationDraftForm): boolean {
  return Boolean(
    form.applicationType &&
      form.primaryStandard &&
      form.applicationDate &&
      form.scopeDescription.trim()
  )
}