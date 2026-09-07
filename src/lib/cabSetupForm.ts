import type { CountryCode } from '@/lib/countries'
import { isValidRequiredEmail } from '@/lib/authValidation'
import { formatPhoneNumber } from '@/lib/api/authApi'
import { parsePhoneNumberFromString } from 'libphonenumber-js'

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

export interface CabCertificateBasic {
  id: string
  schemeId: string
  schemeName: string
  certificateNumberFormat: string
  certificateValidity: string
  certificateLanguage: string
  certificateTemplate: string
  signatoryName: string
  signatoryTitle: string
  signatoryImageUrl: string | null
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
  primaryContactPhoneCountryCode: CountryCode
  primaryContactPhoneNumber: string
  /** Full E.164-style number kept in sync for drafts and display fallbacks. */
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

  // Screen 8 — certificate basics (one card per selected scheme)
  certificateBasics: CabCertificateBasic[]
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
  primaryContactPhoneCountryCode: 'EG',
  primaryContactPhoneNumber: '',
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

  certificateBasics: [],
  showCabLogo: true,
  showAccreditationMark: true,
  showQrCode: true,

  roleInvites: [],
  sendInvitationsOnComplete: true,
  useRoleBasedAccess: true,
}

let recordCounter = 0

export function parsePrimaryContactPhone(phone: string): {
  countryCode: CountryCode
  number: string
} {
  const trimmed = phone.trim()
  if (!trimmed) return { countryCode: 'EG', number: '' }

  const parsed = parsePhoneNumberFromString(trimmed)
  if (parsed?.country) {
    return {
      countryCode: parsed.country as CountryCode,
      number: parsed.nationalNumber,
    }
  }

  return { countryCode: 'EG', number: trimmed.replace(/\D/g, '') }
}

export function buildPrimaryContactPhone(countryCode: CountryCode, number: string): string {
  const digits = number.replace(/\D/g, '')
  if (!digits) return ''
  return formatPhoneNumber(countryCode, digits)
}

export function applyPrimaryContactPhoneFields(
  setup: CabSetupForm,
  fields: {
    primaryContactPhoneCountryCode?: CountryCode
    primaryContactPhoneNumber?: string
  }
): Pick<CabSetupForm, 'primaryContactPhoneCountryCode' | 'primaryContactPhoneNumber' | 'primaryContactPhone'> {
  const countryCode = fields.primaryContactPhoneCountryCode ?? setup.primaryContactPhoneCountryCode
  const number = fields.primaryContactPhoneNumber ?? setup.primaryContactPhoneNumber
  return {
    primaryContactPhoneCountryCode: countryCode,
    primaryContactPhoneNumber: number,
    primaryContactPhone: buildPrimaryContactPhone(countryCode, number),
  }
}

export function hydratePrimaryContactPhoneFields(setup: CabSetupForm): CabSetupForm {
  if (setup.primaryContactPhoneNumber.trim()) {
    return {
      ...setup,
      primaryContactPhone: buildPrimaryContactPhone(
        setup.primaryContactPhoneCountryCode,
        setup.primaryContactPhoneNumber
      ),
    }
  }

  if (!setup.primaryContactPhone.trim()) return setup

  const parsed = parsePrimaryContactPhone(setup.primaryContactPhone)
  return {
    ...setup,
    primaryContactPhoneCountryCode: parsed.countryCode,
    primaryContactPhoneNumber: parsed.number,
  }
}

/** Older drafts stored certificate format/validity/language/template once for all schemes. */
type LegacyCabSetupForm = CabSetupForm & {
  certificateNumberFormat?: string
  certificateValidity?: string
  certificateLanguage?: string
  certificateTemplate?: string
}

export function normalizeCabSetupForm(setup: LegacyCabSetupForm): CabSetupForm {
  const legacyFormat = setup.certificateNumberFormat
  const legacyValidity = setup.certificateValidity
  const legacyLanguage = setup.certificateLanguage
  const legacyTemplate = setup.certificateTemplate

  const certificateBasics = setup.certificateBasics.map((record) => {
    const schemeId = record.schemeId ?? ''
    const schemeName = record.schemeName ?? ''
    const defaults = createCertificateBasicRecord()
    return {
      ...defaults,
      ...record,
      id: record.id ?? createRecordId('cert'),
      schemeId,
      schemeName,
      certificateNumberFormat:
        record.certificateNumberFormat || legacyFormat || defaults.certificateNumberFormat,
      certificateValidity:
        record.certificateValidity || legacyValidity || defaults.certificateValidity,
      certificateLanguage:
        record.certificateLanguage || legacyLanguage || defaults.certificateLanguage,
      certificateTemplate:
        record.certificateTemplate || legacyTemplate || defaults.certificateTemplate,
    }
  })

  const rest = { ...setup }
  delete rest.certificateNumberFormat
  delete rest.certificateValidity
  delete rest.certificateLanguage
  delete rest.certificateTemplate

  return { ...rest, certificateBasics }
}

/** Stable-enough local id for repeatable rows; never sent to the backend. */
export function createRecordId(prefix: string): string {
  recordCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${recordCounter}`
}

/** Default per-record status follows the CAB-level accreditation choice. */
export function getDefaultAccreditationRecordStatus(form: CabSetupForm): string {
  if (form.accreditationStatuses.includes('APPLICANT')) return 'APPLICANT'
  return 'ACTIVE'
}

export function createAccreditationRecord(status = 'ACTIVE'): CabAccreditationRecord {
  return {
    id: createRecordId('acc'),
    body: '',
    bodyOther: '',
    standard: '',
    number: '',
    issueDate: '',
    expiryDate: '',
    status,
    fileName: '',
    applicationReference: '',
    coveredByMla: true,
    expiryReminders: true,
  }
}

/** Grow or trim the record list to match the requested count (1–20). */
export function ensureAccreditationRecords(
  count: number,
  existing: CabAccreditationRecord[] = [],
  defaultStatus = 'ACTIVE'
): CabAccreditationRecord[] {
  const target = Math.min(Math.max(count, 1), 20)
  const records = [...existing]
  while (records.length < target) records.push(createAccreditationRecord(defaultStatus))
  records.length = target
  return records
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

/** Grow or trim the scope list to match the requested count (1–20). */
export function ensureScopeRecords(
  count: number,
  existing: CabScopeRecord[] = []
): CabScopeRecord[] {
  const target = Math.min(Math.max(count, 1), 20)
  const records = [...existing]
  while (records.length < target) records.push(createScopeRecord())
  records.length = target
  return records
}

export function createCustomScheme(): CabCustomScheme {
  return { id: createRecordId('scheme'), name: '', owner: '', normativeDocument: '', version: '' }
}

export const DEFAULT_CERTIFICATE_NUMBER_FORMAT = '{CAB}-{SCHEME}-{YEAR}-{SEQ}'
export const DEFAULT_CERTIFICATE_VALIDITY = '3'
export const DEFAULT_CERTIFICATE_LANGUAGE = 'EN_AR'
export const DEFAULT_CERTIFICATE_TEMPLATE = 'ICASCO_DEFAULT'

export function createCertificateBasicRecord(): CabCertificateBasic {
  return {
    id: createRecordId('cert'),
    schemeId: '',
    schemeName: '',
    certificateNumberFormat: DEFAULT_CERTIFICATE_NUMBER_FORMAT,
    certificateValidity: DEFAULT_CERTIFICATE_VALIDITY,
    certificateLanguage: DEFAULT_CERTIFICATE_LANGUAGE,
    certificateTemplate: DEFAULT_CERTIFICATE_TEMPLATE,
    signatoryName: '',
    signatoryTitle: '',
    signatoryImageUrl: null,
  }
}

/** Grow or trim certificate cards; always keeps at least one row ready. */
export function ensureCertificateBasicRecords(
  count: number,
  existing: CabCertificateBasic[] = []
): CabCertificateBasic[] {
  const target = Math.min(Math.max(count, 1), 20)
  const records = [...existing]
  while (records.length < target) records.push(createCertificateBasicRecord())
  records.length = target
  return records
}

export function getSelectedSchemeEntries(
  setup: CabSetupForm,
  schemeOptions: { value: string; label: string }[]
): { id: string; label: string }[] {
  const standard = schemeOptions
    .filter((scheme) => setup.schemes.includes(scheme.value))
    .map((scheme) => ({ id: scheme.value, label: scheme.label }))
  const custom = setup.customSchemes
    .filter((scheme) => scheme.name.trim())
    .map((scheme) => ({ id: scheme.id, label: scheme.name.trim() }))
  return [...standard, ...custom]
}

/** Schemes the user can still assign to a certificate card. */
export function getAvailableCertificateSchemeOptions(
  selectedSchemes: { id: string; label: string }[],
  records: CabCertificateBasic[],
  currentRecordId: string
): { value: string; label: string }[] {
  const usedSchemeIds = new Set(
    records
      .filter((record) => record.id !== currentRecordId && record.schemeId)
      .map((record) => record.schemeId)
  )
  return selectedSchemes
    .filter((scheme) => !usedSchemeIds.has(scheme.id))
    .map((scheme) => ({ value: scheme.id, label: scheme.label }))
}

export function isCertificateBasicStarted(record: CabCertificateBasic): boolean {
  return Boolean(
    record.signatoryName.trim() ||
      record.signatoryTitle.trim() ||
      record.signatoryImageUrl ||
      record.certificateNumberFormat !== DEFAULT_CERTIFICATE_NUMBER_FORMAT ||
      record.certificateValidity !== DEFAULT_CERTIFICATE_VALIDITY ||
      record.certificateLanguage !== DEFAULT_CERTIFICATE_LANGUAGE ||
      record.certificateTemplate !== DEFAULT_CERTIFICATE_TEMPLATE
  )
}

/** An applicant record captures an application reference instead of a certificate. */
export function isApplicantRecord(record: CabAccreditationRecord): boolean {
  return record.status === 'APPLICANT'
}

export type AccreditationRecordMissingField =
  | 'body'
  | 'bodyOther'
  | 'standard'
  | 'applicationReference'
  | 'number'
  | 'issueDate'
  | 'expiryDate'
  | 'expiryAfterIssue'

export function getAccreditationRecordMissingFields(
  record: CabAccreditationRecord
): AccreditationRecordMissingField[] {
  const missing: AccreditationRecordMissingField[] = []
  if (!record.body) missing.push('body')
  if (record.body === 'OTHER' && !record.bodyOther.trim()) missing.push('bodyOther')
  if (!record.standard) missing.push('standard')

  if (isApplicantRecord(record)) {
    if (!record.applicationReference.trim()) missing.push('applicationReference')
    return missing
  }

  if (!record.number.trim()) missing.push('number')
  if (!record.issueDate) missing.push('issueDate')
  if (!record.expiryDate) missing.push('expiryDate')
  else if (record.issueDate && record.expiryDate <= record.issueDate) missing.push('expiryAfterIssue')
  return missing
}

export function isAccreditationRecordComplete(record: CabAccreditationRecord): boolean {
  return getAccreditationRecordMissingFields(record).length === 0
}

// ---------------------------------------------------------------------------
// Per-screen completeness. Only what the deck marks required (*) may block Next.
// ---------------------------------------------------------------------------

export function isProfileStepComplete(
  form: CabSetupForm,
  legalEntityName: string
): boolean {
  const year = Number(form.yearEstablished)
  const yearValid =
    !form.yearEstablished ||
    (/^\d{4}$/.test(form.yearEstablished) &&
      year >= 1800 &&
      year <= new Date().getFullYear())
  return Boolean(legalEntityName.trim() && form.activities.length > 0 && yearValid)
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
  const expectedCount = Math.max(form.accreditationRecordCount, 1)
  if (form.accreditationRecords.length < expectedCount) return false
  return form.accreditationRecords
    .slice(0, expectedCount)
    .every(isAccreditationRecordComplete)
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
  if (form.markValidFrom && form.markValidUntil && form.markValidUntil <= form.markValidFrom) {
    return false
  }
  return form.allowedDocumentUse.length > 0
}

export function isCertificateBasicComplete(record: CabCertificateBasic): boolean {
  if (!record.schemeId) return false
  return Boolean(
    record.certificateNumberFormat.includes('{SEQ}') &&
      record.certificateValidity &&
      record.certificateLanguage &&
      record.certificateTemplate &&
      record.signatoryName.trim() &&
      record.signatoryTitle.trim() &&
      record.signatoryImageUrl
  )
}

/** Certificate setup is optional — never blocks Next during onboarding. */
export function isCertificateStepComplete(form: CabSetupForm): boolean {
  void form
  return true
}

/** Used on the review screen: touched schemes must be fully complete. */
export function isCertificateConfigurationReady(form: CabSetupForm): boolean {
  const touched = form.certificateBasics.filter(isCertificateBasicStarted)
  if (touched.length === 0) return true
  return touched.every(isCertificateBasicComplete)
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
