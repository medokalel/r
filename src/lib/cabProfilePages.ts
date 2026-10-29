import type { TFunction } from 'i18next'
import {
  getCabSetupReviewSections,
  isAccreditationRecordsStepComplete,
  isAccreditationStatusStepComplete,
  isCertificateBasicComplete,
  isLocationsStepComplete,
  isMarksStepComplete,
  isProfileStepComplete,
  isSchemesStepComplete,
  isScopeStepComplete,
  type CabSetupFieldIssue,
} from '@/lib/cabSetupForm'
import type { UnifiedOnboardingForm } from '@/lib/unifiedOnboardingForm'

/** The CAB profile is edited one page at a time, in this order. */
export const CAB_PROFILE_PAGES = [
  'identity',
  'locations',
  'accreditationStatus',
  'accreditationRecords',
  'schemes',
  'scope',
  'pricing',
  'marks',
  'certificate',
] as const

export type CabProfilePage = (typeof CAB_PROFILE_PAGES)[number]

export function isCabProfilePage(value: string | null): value is CabProfilePage {
  return CAB_PROFILE_PAGES.some((page) => page === value)
}

/**
 * Setup field id → i18n label key. Ids ending in "-" are prefixes for per-record fields;
 * more specific prefixes must come first.
 */
const ISSUE_LABEL_KEYS: ReadonlyArray<readonly [string, string]> = [
  ['cab-setup-legal-name', 'cab.setup.profile.legalName'],
  ['cab-setup-trading-name', 'cab.setup.profile.tradingName'],
  ['cab-setup-registration-number', 'cab.setup.profile.registrationNumber'],
  ['cab-setup-activities', 'cab.setup.profile.activity'],
  ['cab-setup-website', 'cab.setup.profile.website'],
  ['cab-setup-year-established', 'cab.setup.profile.yearEstablished'],
  ['cab-setup-location-name-', 'cab.setup.locations.locationName'],
  ['cab-setup-location-address-', 'cab.setup.locations.address'],
  ['cab-setup-country', 'cab.setup.locations.headOfficeCountry'],
  ['cab-setup-city', 'cab.setup.locations.city'],
  ['cab-setup-address', 'cab.setup.locations.mainOfficeAddress'],
  ['cab-setup-timezone', 'cab.setup.locations.timeZone'],
  ['cab-setup-languages', 'cab.setup.locations.languages'],
  ['cab-setup-accreditation-status', 'cab.setup.accreditationStatus.title'],
  ['cab-setup-record-count', 'cab.setup.accreditationStatus.recordCount'],
  ['cab-setup-acc-body-other-', 'cab.setup.accreditationRecords.bodyOther'],
  ['cab-setup-acc-body-', 'cab.setup.accreditationRecords.body'],
  ['cab-setup-acc-standard-', 'cab.setup.accreditationRecords.standard'],
  ['cab-setup-acc-application-', 'cab.setup.accreditationRecords.applicationReference'],
  ['cab-setup-acc-number-', 'cab.setup.accreditationRecords.number'],
  ['cab-setup-acc-issue-', 'cab.setup.accreditationRecords.issueDate'],
  ['cab-setup-acc-expiry-', 'cab.setup.accreditationRecords.expiryDate'],
  ['cab-setup-schemes', 'cab.setup.schemes.schemesLabel'],
  ['cab-setup-services', 'cab.setup.schemes.servicesLabel'],
  ['cab-setup-custom-scheme-name-', 'cab.setup.schemes.customSchemeName'],
  ['cab-setup-custom-scheme-owner-', 'cab.setup.schemes.customSchemeOwner'],
  ['cab-setup-scheme-owner', 'cab.setup.schemes.schemeOwner'],
  ['cab-setup-scope-scheme-', 'cab.setup.scope.scheme'],
  ['cab-setup-scope-location-', 'cab.setup.scope.location'],
  ['cab-setup-scope-file', 'cab.setup.scope.uploadTitle'],
  ['cab-setup-mark-reference', 'cab.setup.marks.markReference'],
  ['cab-setup-mark-valid-until', 'cab.setup.marks.validUntil'],
  ['cab-setup-document-use', 'cab.setup.marks.allowedUse'],
  ['cab-setup-cert-signatory-name-', 'cab.setup.certificate.signatoryName'],
  ['cab-setup-cert-signatory-title-', 'cab.setup.certificate.signatoryTitle'],
  ['cab-setup-cert-format-', 'cab.setup.certificate.numberFormat'],
]

export function getCabProfileIssueLabelKey(fieldId: string): string | undefined {
  return ISSUE_LABEL_KEYS.find(
    ([id]) => fieldId === id || (id.endsWith('-') && fieldId.startsWith(id)),
  )?.[1]
}

const isAccreditationStatusIssue = (issue: CabSetupFieldIssue) =>
  issue.fieldId === 'cab-setup-accreditation-status' || issue.fieldId === 'cab-setup-record-count'

/** Validation issues of each page, from the same rules the onboarding review step uses. */
export function getCabProfilePageIssues(
  form: UnifiedOnboardingForm,
): Record<CabProfilePage, CabSetupFieldIssue[]> {
  const sections = getCabSetupReviewSections(form.cabSetup, {
    legalEntityName: form.legalEntityName,
    tradingName: form.tradingName,
    registrationNumber: form.registrationNumber,
    website: form.website,
    country: form.country,
    city: form.city,
    address: form.address,
    languages: form.languages,
    logoUrl: form.logoUrl,
  })
  const issuesOf = (key: (typeof sections)[number]['key']) =>
    sections.find((section) => section.key === key)?.issues ?? []
  const accreditation = issuesOf('accreditation')

  return {
    identity: issuesOf('identity'),
    locations: issuesOf('locations'),
    accreditationStatus: accreditation.filter(isAccreditationStatusIssue),
    accreditationRecords: accreditation.filter((issue) => !isAccreditationStatusIssue(issue)),
    schemes: issuesOf('schemes'),
    scope: issuesOf('scope'),
    pricing: [],
    marks: issuesOf('marks'),
    certificate: issuesOf('certificate'),
  }
}

/**
 * Which pages are filled in, derived from the saved data so it stays correct across
 * devices. Pricing is saved on its own endpoint, so the caller passes it in.
 */
export function getCabProfileCompletion(
  form: UnifiedOnboardingForm,
  pricingConfigured: boolean,
): Record<CabProfilePage, boolean> {
  const setup = form.cabSetup
  const statusComplete = isAccreditationStatusStepComplete(setup)

  return {
    identity: isProfileStepComplete(setup, form.legalEntityName, form.registrationNumber, form.tradingName),
    locations: isLocationsStepComplete(setup, form.country, form.city, form.address, form.languages),
    accreditationStatus: statusComplete,
    accreditationRecords: statusComplete && isAccreditationRecordsStepComplete(setup),
    schemes: isSchemesStepComplete(setup),
    scope: isScopeStepComplete(setup),
    pricing: pricingConfigured,
    marks: isMarksStepComplete(setup, form.logoUrl),
    certificate: setup.certificateBasics.some(isCertificateBasicComplete),
  }
}

const MAX_LISTED_FIELDS = 3

function formatFieldList(labels: string[], t: TFunction): string {
  const shown = labels.slice(0, MAX_LISTED_FIELDS).join(t('cab.companyProfile.issues.separator'))
  const hidden = labels.length - MAX_LISTED_FIELDS
  return hidden > 0 ? `${shown} ${t('cab.companyProfile.issues.andMore', { count: hidden })}` : shown
}

/**
 * Toast text for a page with missing or invalid fields: a title, the page it is on (when it is
 * not the one in view) and the field names. Lines are split by "\n" the way the Toaster expects.
 */
export function buildCabProfileIssuesMessage(
  issues: CabSetupFieldIssue[],
  t: TFunction,
  pageTitle?: string,
): string {
  const labelsOf = (kind: CabSetupFieldIssue['kind']) => [
    ...new Set(
      issues
        .filter((issue) => issue.kind === kind)
        .map((issue) => {
          const labelKey = getCabProfileIssueLabelKey(issue.fieldId)
          return labelKey ? t(labelKey) : issue.fieldId
        }),
    ),
  ]
  const required = labelsOf('required')
  const invalid = labelsOf('invalid')

  return [
    required.length > 0 ? t('cab.setup.review.issues.required') : t('cab.setup.review.issues.invalid'),
    pageTitle ? t('cab.companyProfile.issues.onPage', { page: pageTitle }) : '',
    required.length > 0 ? t('cab.companyProfile.issues.fieldsRequired', { fields: formatFieldList(required, t) }) : '',
    invalid.length > 0 ? t('cab.companyProfile.issues.fieldsInvalid', { fields: formatFieldList(invalid, t) }) : '',
  ]
    .filter(Boolean)
    .join('\n')
}
