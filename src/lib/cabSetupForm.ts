import type { CountryCode } from '@/lib/countries'
import { isValidRequiredEmail } from '@/lib/authValidation'

/**
 * State for the 10-screen CAB setup wizard (see the CAB onboarding deck).
 *
 * Dates are held as ISO `yyyy-mm-dd` strings, not `Date` objects, so the whole
 * form survives the JSON round-trip through the onboarding draft storage.
 */

export interface CabLocationRecord {
  id: string
  name: string
  type: string
  country: CountryCode | ''
  city: string
  address: string
  activities: string[]
}

export interface CabAccreditationRecord {
  id: string
  body: string
  bodyOther: string
  standard: string
  number: string
  issueDate: string
  expiryDate: string
  status: string
  fileName: string
  /** Set instead of number/expiry while the record is still an application. */
  applicationReference: string
  coveredByMla: boolean
  expiryReminders: boolean
}

export interface CabScopeRecord {
  id: string
  scheme: string
  accreditationRecordId: string
  locationId: string
  codes: string[]
}

export interface CabCustomScheme {
  id: string
  name: string
  owner: string
  normativeDocument: string
  version: string
}

export interface CabRoleInvite {
  role: string
  email: string
  /** 'ADD_LATER' stores an incomplete status rather than fake data. */
  status: 'ACTIVE' | 'INVITE' | 'ADD_LATER'
}

export interface CabSetupForm {
  // Screen 1 — profile
  activities: string[]
  primaryContactEmail: string
  primaryContactPhone: string
  yearEstablished: string

  // Screen 2 — locations
  timeZone: string
  hasAdditionalLocations: boolean
  locations: CabLocationRecord[]

  // Screen 3 — accreditation status
  accreditationStatuses: string[]
  accreditationRecordCount: number

  // Screen 4 — accreditation records
  accreditationRecords: CabAccreditationRecord[]

  // Screen 5 — schemes and services
  schemes: string[]
  customSchemes: CabCustomScheme[]
  services: string[]
  primaryServiceMarket: string
  schemeOwner: string

  // Screen 6 — scope
  scopes: CabScopeRecord[]
  scopeFileName: string
  restrictApplicationsToScope: boolean
  requireTechnicalReviewForExceptions: boolean

  // Screen 7 — marks
  accreditationMarkUrl: string | null
  schemeMarkUrl: string | null
  markReference: string
  markValidFrom: string
  markValidUntil: string
  allowedDocumentUse: string[]
  applyMarkOnlyToAccredited: boolean
  blockMarkAfterExpiry: boolean
  keepMarkAuditTrail: boolean

  // Screen 8 — certificate basics
  certificateNumberFormat: string
  certificateValidity: string
  certificateLanguage: string
  authorisedSignatory: string
  certificateTemplate: string
  showCabLogo: boolean
  showAccreditationMark: boolean
  showQrCode: boolean

  // Screen 9 — key roles
  roleInvites: CabRoleInvite[]
  sendInvitationsOnComplete: boolean
  useRoleBasedAccess: boolean
}

export const emptyCabSetupForm: CabSetupForm = {
  activities: [],
  primaryContactEmail: '',
  primaryContactPhone: '',
  yearEstablished: '',

  timeZone: '',
  hasAdditionalLocations: false,
  locations: [],

  accreditationStatuses: [],
  accreditationRecordCount: 1,

  accreditationRecords: [],

  schemes: [],
  customSchemes: [],
  services: [],
  primaryServiceMarket: '',
  schemeOwner: '',

  scopes: [],
  scopeFileName: '',
  restrictApplicationsToScope: true,
  requireTechnicalReviewForExceptions: true,

  accreditationMarkUrl: null,
  schemeMarkUrl: null,
  markReference: '',
  markValidFrom: '',
  markValidUntil: '',
  allowedDocumentUse: ['CERTIFICATE', 'REPORT', 'PORTAL'],
  applyMarkOnlyToAccredited: true,
  blockMarkAfterExpiry: true,
  keepMarkAuditTrail: true,

  certificateNumberFormat: '{CAB}-{SCHEME}-{YEAR}-{SEQ}',
  certificateValidity: '3',
  certificateLanguage: 'EN_AR',
  authorisedSignatory: '',
  certificateTemplate: 'ICASCO_DEFAULT',
  showCabLogo: true,
  showAccreditationMark: true,
  showQrCode: true,

  roleInvites: [],
  sendInvitationsOnComplete: true,
  useRoleBasedAccess: true,
}

let recordCounter = 0

/** Stable-enough local id for repeatable rows; never sent to the backend. */
export function createRecordId(prefix: string): string {
  recordCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${recordCounter}`
}

export function createAccreditationRecord(): CabAccreditationRecord {
  return {
    id: createRecordId('acc'),
    body: '',
    bodyOther: '',
    standard: '',
    number: '',
    issueDate: '',
    expiryDate: '',
    status: 'ACTIVE',
    fileName: '',
    applicationReference: '',
    coveredByMla: true,
    expiryReminders: true,
  }
}

export function createLocationRecord(): CabLocationRecord {
  return {
    id: createRecordId('loc'),
    name: '',
    type: 'BRANCH',
    country: '',
    city: '',
    address: '',
    activities: [],
  }
}

export function createScopeRecord(): CabScopeRecord {
  return {
    id: createRecordId('scope'),
    scheme: '',
    accreditationRecordId: '',
    locationId: '',
    codes: [],
  }
}

export function createCustomScheme(): CabCustomScheme {
  return { id: createRecordId('scheme'), name: '', owner: '', normativeDocument: '', version: '' }
}

/** An applicant record captures an application reference instead of a certificate. */
export function isApplicantRecord(record: CabAccreditationRecord): boolean {
  return record.status === 'APPLICANT'
}

export function isAccreditationRecordComplete(record: CabAccreditationRecord): boolean {
  if (!record.body || !record.standard) return false
  if (record.body === 'OTHER' && !record.bodyOther.trim()) return false

  if (isApplicantRecord(record)) {
    return Boolean(record.applicationReference.trim())
  }

  if (!record.number.trim() || !record.issueDate || !record.expiryDate) return false
  // Expiry must be after issue date.
  return record.expiryDate > record.issueDate
}

// ---------------------------------------------------------------------------
// Per-screen completeness. Only what the deck marks required (*) may block Next.
// ---------------------------------------------------------------------------

export function isProfileStepComplete(
  form: CabSetupForm,
  legalEntityName: string
): boolean {
  return Boolean(
    legalEntityName.trim() &&
      form.activities.length > 0 &&
      isValidRequiredEmail(form.primaryContactEmail) &&
      form.primaryContactPhone.trim()
  )
}

export function isLocationsStepComplete(
  form: CabSetupForm,
  country: string,
  city: string,
  address: string,
  languages: string[]
): boolean {
  if (!country || !city.trim() || !address.trim() || !form.timeZone || languages.length === 0) {
    return false
  }

  if (!form.hasAdditionalLocations) return true

  // Address is required for every active location, and no two may share a name+address.
  const seen = new Set<string>()
  return form.locations.every((location) => {
    if (!location.name.trim() || !location.address.trim() || !location.type) return false
    const key = `${location.name.trim().toLowerCase()}|${location.address.trim().toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function isAccreditationStatusStepComplete(form: CabSetupForm): boolean {
  if (form.accreditationStatuses.length === 0) return false
  // Only an accredited/applicant CAB needs to say how many records follow.
  if (requiresAccreditationRecords(form)) return form.accreditationRecordCount >= 1
  return true
}

/** Unaccredited-only CABs skip the records screen entirely. */
export function requiresAccreditationRecords(form: CabSetupForm): boolean {
  return form.accreditationStatuses.some((status) => status === 'ACCREDITED' || status === 'APPLICANT')
}

export function isAccreditationRecordsStepComplete(form: CabSetupForm): boolean {
  if (!requiresAccreditationRecords(form)) return true
  if (form.accreditationRecords.length === 0) return false
  return form.accreditationRecords.every(isAccreditationRecordComplete)
}

export function isSchemesStepComplete(form: CabSetupForm): boolean {
  // At least one scheme/service is required.
  const hasScheme = form.schemes.length > 0 || form.customSchemes.some((scheme) => scheme.name.trim())
  return hasScheme && form.services.length > 0
}

export function isScopeStepComplete(form: CabSetupForm): boolean {
  if (form.scopes.length === 0) return false
  return form.scopes.every((scope) => Boolean(scope.scheme && scope.locationId))
}

export function isMarksStepComplete(form: CabSetupForm): boolean {
  // Only "Allowed document use" is starred on the slide.
  return form.allowedDocumentUse.length > 0
}

export function isCertificateStepComplete(form: CabSetupForm): boolean {
  return Boolean(
    // A format without {SEQ} can generate duplicates.
    form.certificateNumberFormat.includes('{SEQ}') &&
      form.certificateValidity &&
      form.certificateLanguage &&
      form.certificateTemplate
  )
}

export function isKeyRolesStepComplete(form: CabSetupForm): boolean {
  // Roles are never mandatory to activate — an un-filled invite just stays
  // pending. Only a typed-but-malformed address blocks the step.
  return form.roleInvites.every(
    (invite) => !invite.email.trim() || isValidRequiredEmail(invite.email)
  )
}

/** Renders the certificate-number example shown under the format field. */
export function buildCertificateNumberExample(format: string, cabName: string, scheme: string): string {
  const words = (cabName.trim() || 'CAB').split(/\s+/).filter(Boolean)
  // A single-token name ("NAA") keeps its own letters; multi-word names initialise.
  const abbreviation = (
    words.length === 1 ? words[0] : words.map((word) => word[0]).join('')
  )
    .slice(0, 3)
    .toUpperCase()

  return format
    .replace(/\{CAB\}/g, abbreviation || 'CAB')
    .replace(/\{SCHEME\}/g, scheme || 'QMS')
    .replace(/\{YEAR\}/g, String(new Date().getFullYear()))
    .replace(/\{COUNTRY\}/g, 'SA')
    .replace(/\{BRANCH\}/g, 'HQ')
    .replace(/\{SEQ\}/g, '0001')
}
