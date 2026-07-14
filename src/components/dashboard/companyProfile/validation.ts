import { isValidEmail } from '@/lib/authValidation'
import type { OrgBranch, OrgDocument } from '@/lib/api/organizationProfileApi'
import { REQUIRED_DOC_TYPES } from './constants'
import type {
  BranchFormValues,
  ProfileFormValues,
  ProfileStepData,
  StepKey,
} from './types'

export function isBasicDataComplete(form: ProfileFormValues): boolean {
  return Boolean(
    form.logoUrl &&
      form.companySummary.trim() &&
      form.industries.length > 0 &&
      form.organizationName.trim() &&
      form.tradeName.trim() &&
      form.commercialRegisterNumber.trim() &&
      form.authorizedPersonName.trim() &&
      isValidEmail(form.email) &&
      form.phoneNumber.trim() &&
      form.organizationStatus &&
      form.employeeCount !== '' &&
      form.registrationDate
  )
}

export function isAddressComplete(form: ProfileFormValues): boolean {
  return Boolean(
    form.country &&
      form.city.trim() &&
      form.district.trim() &&
      form.street.trim() &&
      form.buildingNumber.trim() &&
      form.postalCode.trim()
  )
}

export function isBranchesComplete(branches: OrgBranch[]): boolean {
  return branches.length > 0
}

export function isDocumentsComplete(documents: OrgDocument[]): boolean {
  return REQUIRED_DOC_TYPES.every((type) =>
    documents.some((doc) => doc.documentType === type)
  )
}

export function isStepComplete(step: StepKey, data: ProfileStepData): boolean {
  switch (step) {
    case 'basicData':
      return isBasicDataComplete(data.form)
    case 'address':
      return isAddressComplete(data.form)
    case 'branches':
      return isBranchesComplete(data.branches)
    case 'officialDocs':
      return isDocumentsComplete(data.documents)
  }
}

export function isBranchFormComplete(form: BranchFormValues): boolean {
  return Boolean(
    form.branchName.trim() &&
      form.commercialRegisterNumber.trim() &&
      form.address.trim() &&
      form.googleMapUrl.trim() &&
      form.branchManagerName.trim() &&
      form.phoneNumber.trim() &&
      form.sectors.length > 0 &&
      form.employeeCount !== ''
  )
}
