import { authorizedRequest } from '@/lib/api/authorizedClient'
import { apiRequest } from '@/lib/api/client'

export type CabOrganizationType =
  | 'CERTIFICATION_BODY'
  | 'INSPECTION_BODY'
  | 'TESTING_LABORATORY'
  | 'CALIBRATION_LABORATORY'

export type CabMarkType = 'CAB_LOGO' | 'ACCREDITATION_MARK' | 'SCHEME_MARK'

export interface CabBranchRecord {
  id?: string
  name: string
  city: string
  locationType?: string | null
  activities?: string | null
}

export interface CabAccreditationRecord {
  id?: string
  accreditationBody?: string | null
  accreditationStandard?: string | null
  accreditationNumber?: string | null
  issueDate?: string | null
  expiryDate?: string | null
  status?: string | null
  certificateFileUrl?: string | null
  coveredByMla?: boolean
  setExpiryReminders?: boolean
}

export interface CabSchemeRecord {
  id?: string
  schemeName: string
  accreditationRecordId?: string | null
  location?: string | null
  approvedScopeCodes?: string[]
  scopeListFileUrl?: string | null
  allowApplicationsOnlyWithinScope?: boolean
  requireTechnicalReviewForExceptions?: boolean
}

export interface CabMarkRecord {
  id?: string
  markType: CabMarkType
  referenceId?: string | null
  fileUrl: string
  markReference?: string | null
  validFrom?: string | null
  validUntil?: string | null
  allowedDocumentUse?: string[]
}

export interface CabCertificateSettings {
  certificateNumberFormat?: string
  certificateValidity?: string
  certificateLanguage?: string
  authorisedSignatory?: string
  certificateTemplate?: string
  showCabLogo?: boolean
  showAccreditationMark?: boolean
  showQrCode?: boolean
}

/** Payload for PATCH /cab-setup/draft — all fields optional for progressive save. */
export interface CabSetupDraftPayload {
  legalEntityName?: string | null
  tradingBrandName?: string | null
  organizationType?: CabOrganizationType | null
  registrationNumber?: string | null
  website?: string | null
  yearEstablished?: number | null
  country?: string | null
  city?: string | null
  mainOfficeAddress?: string | null
  timeZone?: string | null
  operatingLanguages?: string[]
  branches?: CabBranchRecord[]
  logoUrl?: string | null
  showLogoInEmailHeaders?: boolean
  showLogoOnCertificates?: boolean
  primaryColor?: string | null
  secondaryColor?: string | null
  accreditationStatus?: string | null
  numberOfAccreditationRecords?: number | null
  accreditationBody?: string | null
  accreditations?: CabAccreditationRecord[]
  primaryServiceMarket?: string | null
  schemeOwner?: string | null
  selectedServices?: string[]
  schemes?: CabSchemeRecord[]
  applyAccreditationMarkOnlyToAccreditedSchemes?: boolean
  blockMarkUseAfterExpiry?: boolean
  keepMarkUseAuditTrail?: boolean
  marks?: CabMarkRecord[]
  certificateSettings?: CabCertificateSettings | null
}

export interface CabProfile {
  id: string
  slug: string
  legalEntityName: string | null
  tradingBrandName: string | null
  organizationType: CabOrganizationType | null
  registrationNumber: string | null
  website: string | null
  yearEstablished: number | null
  country: string | null
  city: string | null
  mainOfficeAddress: string | null
  timeZone: string | null
  operatingLanguages: string[]
  accreditationBody: string | null
  accreditationStatus: string | null
  numberOfAccreditationRecords: number | null
  primaryServiceMarket: string | null
  schemeOwner: string | null
  selectedServices: string[]
  logoUrl: string | null
  showLogoInEmailHeaders: boolean
  showLogoOnCertificates: boolean
  primaryColor: string | null
  secondaryColor: string | null
  applyAccreditationMarkOnlyToAccreditedSchemes: boolean
  blockMarkUseAfterExpiry: boolean
  keepMarkUseAuditTrail: boolean
  certificateSettings: CabCertificateSettings | null
  setupCompleted: boolean
  status: string
  branches: CabBranchRecord[]
  accreditations: CabAccreditationRecord[]
  schemes: CabSchemeRecord[]
  marks: CabMarkRecord[]
}

export interface CabRegisterPayload {
  contactPersonName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

export interface CabRegisterResult {
  message: string
  userId: string
  cabId: string
}

export async function registerCab(payload: CabRegisterPayload): Promise<CabRegisterResult> {
  return apiRequest('/cab-auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getCabProfile(): Promise<{ cab: CabProfile }> {
  return authorizedRequest('/cab-profile')
}

export async function saveCabSetupDraft(payload: CabSetupDraftPayload): Promise<{ message: string }> {
  return authorizedRequest('/cab-setup/draft', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function completeCabSetup(): Promise<{ message: string; cab: CabProfile }> {
  return authorizedRequest('/cab-setup/complete', {
    method: 'POST',
    body: JSON.stringify({}),
  })
}
