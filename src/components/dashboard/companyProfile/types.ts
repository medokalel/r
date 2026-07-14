import type { CountryCode } from '@/components/auth/CountryCodeSelect'
import type { LatLng } from '@/components/maps/LocationPicker'
import type { OrgBranch, OrgDocument } from '@/lib/api/organizationProfileApi'

export type StepKey = 'basicData' | 'address' | 'branches' | 'officialDocs'

export const STEPS: StepKey[] = ['basicData', 'address', 'branches', 'officialDocs']

export const STEP_NUMBERS: Record<StepKey, number> = {
  basicData: 1,
  address: 2,
  branches: 3,
  officialDocs: 4,
}

export interface ProfileFormValues {
  // Step 1 – header
  companySummary: string
  industries: string[]
  logoUrl: string | null
  // Step 1 – basic data
  organizationName: string
  tradeName: string
  commercialRegisterNumber: string
  unifiedNumber: string
  authorizedPersonName: string
  email: string
  countryCode: CountryCode
  phoneNumber: string
  organizationStatus: string
  employeeCount: string
  registrationDate: Date | undefined
  // Step 2 – address (country is kept as an ISO code; mapped to a name for the API)
  country: CountryCode | null
  city: string
  district: string
  street: string
  buildingNumber: string
  postalCode: string
  additionalNumber: string
  googleMapUrl: string
  location: LatLng | null
}

export const EMPTY_PROFILE_FORM: ProfileFormValues = {
  companySummary: '',
  industries: [],
  logoUrl: null,
  organizationName: '',
  tradeName: '',
  commercialRegisterNumber: '',
  unifiedNumber: '',
  authorizedPersonName: '',
  email: '',
  countryCode: 'SA',
  phoneNumber: '',
  organizationStatus: '',
  employeeCount: '',
  registrationDate: undefined,
  country: null,
  city: '',
  district: '',
  street: '',
  buildingNumber: '',
  postalCode: '',
  additionalNumber: '',
  googleMapUrl: '',
  location: null,
}

export interface BranchFormValues {
  branchName: string
  commercialRegisterNumber: string
  address: string
  googleMapUrl: string
  branchManagerName: string
  countryCode: CountryCode | null
  phoneNumber: string
  sectors: string[]
  employeeCount: string
  branchType: 'permanent' | 'temporary'
  location: LatLng | null
}

export const EMPTY_BRANCH_FORM: BranchFormValues = {
  branchName: '',
  commercialRegisterNumber: '',
  address: '',
  googleMapUrl: '',
  branchManagerName: '',
  countryCode: null,
  phoneNumber: '',
  sectors: [],
  employeeCount: '',
  branchType: 'permanent',
  location: null,
}

export interface ProfileNotification {
  type: 'success' | 'error'
  message: string
}

export interface ProfileStepData {
  form: ProfileFormValues
  branches: OrgBranch[]
  documents: OrgDocument[]
}
