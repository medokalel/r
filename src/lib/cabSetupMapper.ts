import { getSchemeOptions } from '@/lib/api/cabSetupApi'
import type {
  CabAccreditationRecord as ApiAccreditation,
  CabBranchRecord as ApiBranch,
  CabMarkRecord as ApiMark,
  CabOrganizationType,
  CabProfile,
  CabSchemeRecord as ApiScheme,
  CabSetupDraftPayload,
} from '@/lib/api/cabApi'
import type { CabAccreditationRecord, CabLocationRecord } from '@/lib/cabSetupForm'
import { createRecordId } from '@/lib/cabSetupForm'
import type { UnifiedOnboardingForm } from '@/lib/unifiedOnboardingForm'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function asUuid(id: string | undefined): string | undefined {
  return id && UUID_RE.test(id) ? id : undefined
}

function nullIfEmpty(value: string | undefined | null): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function nullIfInvalidUri(value: string | undefined | null): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (!/^https?:\/\//i.test(trimmed)) return null
  return trimmed
}

function nullIfInvalidHexColor(value: string | undefined | null): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return /^#[0-9A-Fa-f]{6}$/.test(trimmed) ? trimmed : null
}

function mapActivityToOrganizationType(activities: string[]): CabOrganizationType {
  const primary = activities[0]
  if (primary === 'INSPECTION_BODY') return 'INSPECTION_BODY'
  if (primary === 'TESTING_LABORATORY' || primary === 'MEDICAL_LABORATORY') {
    return 'TESTING_LABORATORY'
  }
  if (primary === 'CALIBRATION_LABORATORY') return 'CALIBRATION_LABORATORY'
  return 'CERTIFICATION_BODY'
}

function resolveAccreditationBody(record: CabAccreditationRecord): string | null {
  if (record.body === 'OTHER') return nullIfEmpty(record.bodyOther)
  return nullIfEmpty(record.body)
}

function mapAccreditationToApi(record: CabAccreditationRecord): ApiAccreditation {
  const body = resolveAccreditationBody(record)
  const payload: ApiAccreditation = {
    accreditationBody: body,
    accreditationStandard: nullIfEmpty(record.standard),
    status: nullIfEmpty(record.status),
    coveredByMla: record.coveredByMla,
    setExpiryReminders: record.expiryReminders,
  }

  const id = asUuid(record.id)
  if (id) payload.id = id

  if (record.status === 'APPLICANT') {
    payload.accreditationNumber = nullIfEmpty(record.applicationReference)
  } else {
    payload.accreditationNumber = nullIfEmpty(record.number)
    payload.issueDate = nullIfEmpty(record.issueDate)
    payload.expiryDate = nullIfEmpty(record.expiryDate)
  }

  return payload
}

function mapLocationToBranch(location: CabLocationRecord): ApiBranch {
  const branch: ApiBranch = {
    name: location.name.trim(),
    city: location.city.trim() || location.name.trim(),
    locationType: nullIfEmpty(location.type),
    activities: location.activities.length > 0 ? location.activities.join(', ') : null,
  }
  const id = asUuid(location.id)
  if (id) branch.id = id
  return branch
}

function schemeLabel(schemeId: string, activities: string[]): string {
  const match = getSchemeOptions(activities).find((option) => option.value === schemeId)
  return match?.label ?? schemeId.replace(/_/g, ' ')
}

function buildSchemes(form: UnifiedOnboardingForm): ApiScheme[] {
  const setup = form.cabSetup
  const schemes: ApiScheme[] = []

  for (const scope of setup.scopes) {
    if (!scope.scheme) continue
    const scheme: ApiScheme = {
      schemeName: schemeLabel(scope.scheme, setup.activities),
      accreditationRecordId: asUuid(scope.accreditationRecordId) ?? null,
      location: scope.locationId ? scope.locationId : null,
      approvedScopeCodes: scope.codes,
      allowApplicationsOnlyWithinScope: setup.restrictApplicationsToScope,
      requireTechnicalReviewForExceptions: setup.requireTechnicalReviewForExceptions,
    }
    const id = asUuid(scope.id)
    if (id) scheme.id = id
    schemes.push(scheme)
  }

  for (const schemeId of setup.schemes) {
    if (setup.scopes.some((scope) => scope.scheme === schemeId)) continue
    schemes.push({ schemeName: schemeLabel(schemeId, setup.activities) })
  }

  for (const custom of setup.customSchemes) {
    if (!custom.name.trim()) continue
    schemes.push({ schemeName: custom.name.trim() })
  }

  return schemes
}

function buildMarks(form: UnifiedOnboardingForm): ApiMark[] {
  const setup = form.cabSetup
  const marks: ApiMark[] = []

  const logoUrl = nullIfInvalidUri(form.logoUrl)
  if (logoUrl) {
    marks.push({
      markType: 'CAB_LOGO',
      fileUrl: logoUrl,
      allowedDocumentUse: setup.allowedDocumentUse,
    })
  }

  const accreditationMarkUrl = nullIfInvalidUri(setup.accreditationMarkUrl)
  if (accreditationMarkUrl) {
    marks.push({
      markType: 'ACCREDITATION_MARK',
      fileUrl: accreditationMarkUrl,
      markReference: nullIfEmpty(setup.markReference),
      validFrom: nullIfEmpty(setup.markValidFrom),
      validUntil: nullIfEmpty(setup.markValidUntil),
      allowedDocumentUse: setup.allowedDocumentUse,
    })
  }

  const schemeMarkUrl = nullIfInvalidUri(setup.schemeMarkUrl)
  if (schemeMarkUrl) {
    marks.push({
      markType: 'SCHEME_MARK',
      fileUrl: schemeMarkUrl,
      markReference: nullIfEmpty(setup.markReference),
      validFrom: nullIfEmpty(setup.markValidFrom),
      validUntil: nullIfEmpty(setup.markValidUntil),
      allowedDocumentUse: setup.allowedDocumentUse,
    })
  }

  return marks
}

export function mapFormToCabSetupDraft(form: UnifiedOnboardingForm): CabSetupDraftPayload {
  const setup = form.cabSetup
  const primaryAccreditationBody =
    setup.accreditationRecords.map(resolveAccreditationBody).find(Boolean) ?? null

  const year = setup.yearEstablished.trim()
  const parsedYear = year ? Number.parseInt(year, 10) : NaN

  return {
    legalEntityName: nullIfEmpty(form.legalEntityName),
    tradingBrandName: nullIfEmpty(form.tradingName),
    organizationType: setup.activities.length > 0 ? mapActivityToOrganizationType(setup.activities) : null,
    registrationNumber: nullIfEmpty(form.registrationNumber),
    website: nullIfInvalidUri(form.website),
    yearEstablished: Number.isFinite(parsedYear) ? parsedYear : null,
    country: nullIfEmpty(form.country),
    city: nullIfEmpty(form.city),
    mainOfficeAddress: nullIfEmpty(form.address),
    timeZone: nullIfEmpty(setup.timeZone),
    operatingLanguages: form.languages,
    branches: setup.hasAdditionalLocations ? setup.locations.map(mapLocationToBranch) : [],
    logoUrl: nullIfInvalidUri(form.logoUrl),
    showLogoInEmailHeaders: form.includeLogoInEmails,
    showLogoOnCertificates: form.displayLogoOnCertificates,
    primaryColor: nullIfInvalidHexColor(form.customColor),
    secondaryColor: null,
    accreditationStatus:
      setup.accreditationStatuses.length > 0 ? setup.accreditationStatuses.join(',') : null,
    numberOfAccreditationRecords: setup.accreditationRecordCount,
    accreditationBody: primaryAccreditationBody,
    accreditations: setup.accreditationRecords.map(mapAccreditationToApi),
    primaryServiceMarket: nullIfEmpty(setup.primaryServiceMarket),
    schemeOwner: nullIfEmpty(setup.schemeOwner),
    selectedServices: setup.services,
    schemes: buildSchemes(form),
    applyAccreditationMarkOnlyToAccreditedSchemes: setup.applyMarkOnlyToAccredited,
    blockMarkUseAfterExpiry: setup.blockMarkAfterExpiry,
    keepMarkUseAuditTrail: setup.keepMarkAuditTrail,
    marks: buildMarks(form),
    certificateSettings: {
      certificateNumberFormat: setup.certificateNumberFormat,
      certificateValidity: setup.certificateValidity,
      certificateLanguage: setup.certificateLanguage,
      authorisedSignatory: nullIfEmpty(setup.authorisedSignatory) ?? undefined,
      certificateTemplate: setup.certificateTemplate,
      showCabLogo: setup.showCabLogo,
      showAccreditationMark: setup.showAccreditationMark,
      showQrCode: setup.showQrCode,
    },
  }
}

function mapAccreditationFromApi(record: ApiAccreditation): CabAccreditationRecord {
  const body = record.accreditationBody ?? ''
  const isOther = body !== '' && !['GAC', 'EGAC', 'UKAS', 'DAKKS', 'ANAB', 'COFRAC', 'SAC', 'JAS_ANZ'].includes(body)

  return {
    id: record.id ?? createRecordId('acc'),
    body: isOther ? 'OTHER' : body,
    bodyOther: isOther ? body : '',
    standard: record.accreditationStandard ?? '',
    number: record.accreditationNumber ?? '',
    issueDate: record.issueDate?.slice(0, 10) ?? '',
    expiryDate: record.expiryDate?.slice(0, 10) ?? '',
    status: record.status ?? 'ACTIVE',
    fileName: '',
    applicationReference: record.status === 'APPLICANT' ? record.accreditationNumber ?? '' : '',
    coveredByMla: record.coveredByMla ?? true,
    expiryReminders: record.setExpiryReminders ?? true,
  }
}

function mapBranchToLocation(branch: ApiBranch): CabLocationRecord {
  return {
    id: branch.id ?? createRecordId('loc'),
    name: branch.name,
    type: branch.locationType ?? 'BRANCH',
    country: '',
    city: branch.city,
    address: branch.name,
    activities: branch.activities ? branch.activities.split(',').map((item) => item.trim()) : [],
  }
}

export function mergeCabProfileIntoForm(form: UnifiedOnboardingForm, cab: CabProfile): UnifiedOnboardingForm {
  const certificate = cab.certificateSettings ?? {}
  const accreditationMark = cab.marks.find((mark) => mark.markType === 'ACCREDITATION_MARK')
  const schemeMark = cab.marks.find((mark) => mark.markType === 'SCHEME_MARK')
  const logoMark = cab.marks.find((mark) => mark.markType === 'CAB_LOGO')

  const accreditationStatuses = cab.accreditationStatus
    ? cab.accreditationStatus.split(',').map((item) => item.trim()).filter(Boolean)
    : form.cabSetup.accreditationStatuses

  return {
    ...form,
    legalEntityName: cab.legalEntityName ?? form.legalEntityName,
    tradingName: cab.tradingBrandName ?? form.tradingName,
    registrationNumber: cab.registrationNumber ?? form.registrationNumber,
    website: cab.website ?? form.website,
    country: (cab.country as UnifiedOnboardingForm['country']) || form.country,
    city: cab.city ?? form.city,
    address: cab.mainOfficeAddress ?? form.address,
    languages: cab.operatingLanguages.length > 0 ? cab.operatingLanguages : form.languages,
    logoUrl: cab.logoUrl ?? logoMark?.fileUrl ?? form.logoUrl,
    includeLogoInEmails: cab.showLogoInEmailHeaders,
    displayLogoOnCertificates: cab.showLogoOnCertificates,
    customColor: cab.primaryColor ?? form.customColor,
    cabSetup: {
      ...form.cabSetup,
      activities: form.cabSetup.activities.length > 0 ? form.cabSetup.activities : form.scopeAreas,
      primaryContactEmail: form.cabSetup.primaryContactEmail,
      primaryContactPhone: form.cabSetup.primaryContactPhone,
      yearEstablished: cab.yearEstablished ? String(cab.yearEstablished) : form.cabSetup.yearEstablished,
      timeZone: cab.timeZone ?? form.cabSetup.timeZone,
      hasAdditionalLocations: cab.branches.length > 0,
      locations: cab.branches.map(mapBranchToLocation),
      accreditationStatuses,
      accreditationRecordCount: cab.numberOfAccreditationRecords ?? form.cabSetup.accreditationRecordCount,
      accreditationRecords:
        cab.accreditations.length > 0
          ? cab.accreditations.map(mapAccreditationFromApi)
          : form.cabSetup.accreditationRecords,
      primaryServiceMarket: cab.primaryServiceMarket ?? form.cabSetup.primaryServiceMarket,
      schemeOwner: cab.schemeOwner ?? form.cabSetup.schemeOwner,
      services: cab.selectedServices.length > 0 ? cab.selectedServices : form.cabSetup.services,
      applyMarkOnlyToAccredited: cab.applyAccreditationMarkOnlyToAccreditedSchemes,
      blockMarkAfterExpiry: cab.blockMarkUseAfterExpiry,
      keepMarkAuditTrail: cab.keepMarkUseAuditTrail,
      accreditationMarkUrl: accreditationMark?.fileUrl ?? form.cabSetup.accreditationMarkUrl,
      schemeMarkUrl: schemeMark?.fileUrl ?? form.cabSetup.schemeMarkUrl,
      markReference: accreditationMark?.markReference ?? schemeMark?.markReference ?? form.cabSetup.markReference,
      markValidFrom: accreditationMark?.validFrom?.slice(0, 10) ?? form.cabSetup.markValidFrom,
      markValidUntil: accreditationMark?.validUntil?.slice(0, 10) ?? form.cabSetup.markValidUntil,
      allowedDocumentUse:
        accreditationMark?.allowedDocumentUse ??
        schemeMark?.allowedDocumentUse ??
        form.cabSetup.allowedDocumentUse,
      certificateNumberFormat:
        certificate.certificateNumberFormat ?? form.cabSetup.certificateNumberFormat,
      certificateValidity: certificate.certificateValidity ?? form.cabSetup.certificateValidity,
      certificateLanguage: certificate.certificateLanguage ?? form.cabSetup.certificateLanguage,
      authorisedSignatory: certificate.authorisedSignatory ?? form.cabSetup.authorisedSignatory,
      certificateTemplate: certificate.certificateTemplate ?? form.cabSetup.certificateTemplate,
      showCabLogo: certificate.showCabLogo ?? form.cabSetup.showCabLogo,
      showAccreditationMark: certificate.showAccreditationMark ?? form.cabSetup.showAccreditationMark,
      showQrCode: certificate.showQrCode ?? form.cabSetup.showQrCode,
    },
  }
}
