import { parsePhoneNumberFromString } from 'libphonenumber-js'
import type { TFunction } from 'i18next'
import type { CountryCode } from '@/lib/countries'
import { formatPhoneNumber } from '@/lib/api/authApi'
import type {
  OrganizationProfileData,
  SaveProfileRequest,
} from '@/lib/api/organizationProfileApi'
import type {
  ApplicationBranch,
  ApplicationCertificate,
  ApplicationDocument,
  ApplicationResponse,
  CertificateAnswer,
  DraftApplicationRequest,
} from '@/lib/api/certificationApplicationApi'
import {
  codesForStandardSector,
  sectorKeys,
  sectorsForStandard,
  standardLabels,
  standards,
  type SectorKey,
  type StandardKey,
} from '@/components/dashboard/entityData/fieldTypes'
import {
  boolFromYesNo,
  createEmptyBranch,
  DOCUMENT_SLOT_TYPES,
  EMPTY_APPLICATION_FORM,
  SPEC_QUESTIONS,
  yesNoFromBool,
  type ApplicationDocumentEntry,
  type ApplicationFormValues,
  type BranchFormValues,
} from '@/components/dashboard/entityData/applicationTypes'

function text(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function int(value: string): number | undefined {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

/** Drops undefined keys; returns undefined when nothing is left. */
function compact<T extends object>(obj: T): T | undefined {
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined)
  return entries.length ? (Object.fromEntries(entries) as T) : undefined
}

const NATURE_TO_API: Record<string, string> = {
  government: 'GOVERNMENT',
  private: 'PRIVATE',
  thirdParty: 'THIRD_PARTY',
}

const NATURE_FROM_API: Record<string, string> = Object.fromEntries(
  Object.entries(NATURE_TO_API).map(([ui, api]) => [api, ui])
)

function rateToApi(rating: number | null): string | undefined {
  if (rating == null) return undefined
  if (rating >= 4) return 'HIGH'
  if (rating === 3) return 'MEDIUM'
  return 'LOW'
}

function rateFromApi(rate?: string): number | null {
  switch (rate) {
    case 'HIGH':
      return 5
    case 'MEDIUM':
      return 3
    case 'LOW':
      return 1
    default:
      return null
  }
}

function standardToCode(standard: StandardKey): string {
  return standard.toUpperCase()
}

function codeToStandard(code?: string): StandardKey | undefined {
  const key = code?.toLowerCase() as StandardKey | undefined
  return key && (standards as readonly string[]).includes(key) ? key : undefined
}

const CURRENT_SYSTEM_NAMES: Record<string, string> = {
  iso9001: 'ISO 9001',
  iso14001: 'ISO 14001',
  iso45001: 'ISO 45001',
  iso22000: 'ISO 22000',
}

function branchToApi(branch: BranchFormValues): ApplicationBranch | undefined {
  const fields = compact<ApplicationBranch>({
    branchName: text(branch.branchName),
    address: text(branch.address),
    employees: int(branch.employees),
    employeesInScope: int(branch.employeesInScope),
    shifts: int(branch.shifts),
    workingHours: text(branch.workingHours),
    productionLines: int(branch.productionLines),
    weeklyHoliday: text(branch.weeklyHoliday),
    phase1ExpectedDate: branch.phase1ExpectedDate?.toISOString(),
    integratedSystem: boolFromYesNo(branch.integratedSystem),
    centralManagement: boolFromYesNo(branch.centralManagement),
    activities: text(branch.activities),
    products: text(branch.products),
    technicalCommunication: text(branch.technicalCommunication),
  })
  // An untouched branch row (only the default sourceBranchId) must not be sent —
  // the backend requires branchName on every stored branch
  if (!fields) return undefined
  return {
    sourceBranchId: branch.sourceBranchId,
    branchName: fields.branchName ?? '',
    ...fields,
  }
}

function specAnswersByCertificate(
  form: ApplicationFormValues,
  t: TFunction
): Record<string, CertificateAnswer[]> {
  const grouped: Record<string, CertificateAnswer[]> = {}
  for (const def of SPEC_QUESTIONS) {
    const raw = form.specAnswers[def.questionKey]
    if (raw == null || raw === '') continue
    let answer: boolean | number | string = raw
    if (def.questionType === 'BOOLEAN') answer = raw === 'yes'
    ;(grouped[def.certificateCode] ??= []).push({
      questionKey: def.questionKey,
      questionLabel: t(`accreditation.entityData.fields.spec.${def.labelKey}`),
      questionType: def.questionType,
      answer,
    })
  }
  return grouped
}

function certificatesToApi(
  form: ApplicationFormValues,
  t: TFunction
): ApplicationCertificate[] {
  const answers = specAnswersByCertificate(form, t)
  const certificates: ApplicationCertificate[] = form.selectedStandards.map(
    (standard) => {
      const code = standardToCode(standard)
      const standardSectors = sectorsForStandard(standard)
      // The API rejects sectors without codes, so a sector is only persisted
      // once at least one IAF code has been picked for it
      const sectors = (form.selectedSectors[standard] ?? [])
        .filter((sector) => standardSectors.includes(sector))
        .map((sector) => {
          const codes = form.selectedCodes[`${standard}:${sector}`] ?? []
          const sectorCodes = codesForStandardSector(standard, sector)
          return {
            sectorName: sector,
            iafCodes: codes.map((iafCode) => ({
              code: iafCode,
              critical:
                sectorCodes.find((item) => item.code === iafCode)?.critical ?? false,
            })),
          }
        })
        .filter((sector) => sector.iafCodes.length > 0)
      return {
        certificateCode: code,
        certificateName: standardLabels[standard],
        sectors,
        answers: answers[code] ?? [],
      }
    }
  )

  // Answers for standards that weren't picked are dropped — the API rejects
  // certificates without sectors, so they cannot be stored on their own
  return certificates
}

function documentsToApi(form: ApplicationFormValues): ApplicationDocument[] {
  const documents: ApplicationDocument[] = form.documents.map((doc) => ({
    documentType: (DOCUMENT_SLOT_TYPES[doc.slotId] ??
      'OTHER') as ApplicationDocument['documentType'],
    fileUrl: doc.fileUrl,
    fileName: doc.fileName || null,
    originalName: doc.originalName || null,
    mimeType: doc.mimeType || null,
    fileSize: doc.fileSize || null,
  }))
  return documents
}

export function payloadFromForm(
  form: ApplicationFormValues,
  t: TFunction,
): DraftApplicationRequest {
  const legalInfo = compact({
    organizationName: text(form.organizationName),
    website: text(form.website),
    auditSiteAddress: text(form.auditSiteAddress),
    headOfficeAddress: text(form.headOfficeAddress),
    commercialRegisterNumber: text(form.commercialRegisterNumber),
    commercialRegisterFile: text(form.commercialRegisterFile),
    allProductionLinesIncluded: boolFromYesNo(form.allProductionLinesIncluded),
    excludedReason: text(form.excludedReason),
    country: form.country ?? undefined,
    // TODO: wire up once backend adds legalInfo.city — add `city: text(form.city),` here
    email: text(form.email),
    representativeName: text(form.representativeName),
    jobTitle: text(form.jobTitle),
    organizationNature: NATURE_TO_API[form.organizationNature],
    mobile: text(form.mobileNumber)
      ? formatPhoneNumber(form.mobileCountryCode, form.mobileNumber)
      : undefined,
    requestType: 'NEW' as const,
    mainActivity: text(form.mainActivity),
  })

  const operationalInfo = compact({
    fieldOfWork: text(form.fieldOfWork),
    economicActivity: form.economicFields.length
      ? form.economicFields.join(', ')
      : undefined,
    productsServices: text(form.productsServices),
    annualCapacity: text(form.annualCapacity),
    technicalSpecifications: text(form.technicalSpecifications),
  })

  const consultantInfo = compact({
    usedConsultant: boolFromYesNo(form.usedConsultant),
    consultantName: text(form.consultantName),
    consultantCvAttached: boolFromYesNo(form.consultantCvAttached),
    consultancyMonths: int(form.consultancyMonths),
    qualificationRate: rateToApi(form.qualificationRate),
    recommendationRate: rateToApi(form.recommendationRate),
    systemLanguage: form.systemLanguage === 'english' ? ('EN' as const) : ('AR' as const),
    easyAccess: boolFromYesNo(form.easyAccess),
    usesSubcontractors: boolFromYesNo(form.usesSubcontractors),
    safetyProcedures: boolFromYesNo(form.safetyProcedures),
    previousCertificates: text(form.otherSpecification),
    currentSystems: form.currentSystems.length
      ? form.currentSystems.map((key) => ({
          code: key.toUpperCase(),
          name: CURRENT_SYSTEM_NAMES[key] ?? key,
        }))
      : undefined,
    designActivity: boolFromYesNo(form.designActivity),
    designException: text(form.designException),
  })

  const declarationInfo = compact({
    certificateNameEn: text(form.certificateNameEn),
    certificateNameAr: text(form.certificateNameAr),
    certificateAddressEn: text(form.certificateAddressEn),
    certificateAddressAr: text(form.certificateAddressAr),
    certificateScopeEn: text(form.certificateScopeEn),
    certificateScopeAr: text(form.certificateScopeAr),
    agreed: form.agreed || undefined,
  })

  const branches = form.branches
    .map((branch) => branchToApi(branch))
    .filter((branch): branch is ApplicationBranch => branch !== undefined)

  const payload: DraftApplicationRequest = {}
  if (legalInfo) payload.legalInfo = legalInfo
  if (operationalInfo) payload.operationalInfo = operationalInfo
  if (consultantInfo) payload.consultantInfo = consultantInfo
  if (declarationInfo) payload.declarationInfo = declarationInfo
  if (branches.length) payload.branches = branches
  const certificates = certificatesToApi(form, t)
  if (certificates.length) payload.certificates = certificates
  const documents = documentsToApi(form)
  if (documents.length) payload.documents = documents
  return payload
}

/**
 * Prefills a fresh application form from the organization profile. Only empty
 * fields are filled so nothing the user typed (or a loaded draft) is lost.
 */
export function prefillFromOrganization(
  form: ApplicationFormValues,
  data: OrganizationProfileData
): ApplicationFormValues {
  const profile = data.profile ?? {}
  const address = data.address ?? {}

  const composedAddress = [
    address.street,
    address.buildingNumber,
    address.district,
    address.city,
    address.postalCode,
  ]
    .filter(Boolean)
    .join(', ')

  const countryCode =
    address.country && /^[A-Za-z]{2}$/.test(address.country)
      ? (address.country.toUpperCase() as CountryCode)
      : null

  const commercialRegisterDoc = (data.documents ?? []).find(
    (doc) => doc.documentType === 'COMMERCIAL_REGISTER'
  )

  return {
    ...form,
    organizationName:
      form.organizationName || profile.organizationName || data.organizationName || '',
    commercialRegisterNumber:
      form.commercialRegisterNumber || profile.commercialRegisterNumber || '',
    commercialRegisterFile:
      form.commercialRegisterFile || commercialRegisterDoc?.fileUrl || '',
    email: form.email || profile.email || '',
    representativeName: form.representativeName || profile.authorizedPersonName || '',
    mobileNumber: form.mobileNumber || profile.phoneNumber || '',
    mobileCountryCode:
      !form.mobileNumber && profile.phoneCountryCode
        ? parsePhoneNumberFromString(
            `${profile.phoneCountryCode}${profile.phoneNumber ?? ''}`
          )?.country as CountryCode ?? form.mobileCountryCode
        : form.mobileCountryCode,
    headOfficeAddress: form.headOfficeAddress || composedAddress,
    auditSiteAddress: form.auditSiteAddress || composedAddress,
    country: form.country ?? countryCode,
    allProductionLinesIncluded:
      form.allProductionLinesIncluded ||
      yesNoFromBool(profile.allProductionLinesActive),
    excludedReason: form.excludedReason || profile.inactiveReason || '',
    mainActivity:
      form.mainActivity || data.originalRegistrationData?.activity || '',
  }
}

// Maps the shared legal-identity fields into a partial organization-profile
// update, merged over the current snapshot so untouched fields are preserved.
export function profilePayloadFromForm(
  form: ApplicationFormValues,
  snapshot: OrganizationProfileData
): SaveProfileRequest {
  const profile = { ...(snapshot.profile ?? {}) }
  const address = { ...(snapshot.address ?? {}) }

  profile.organizationName = text(form.organizationName) ?? profile.organizationName ?? null
  profile.commercialRegisterNumber =
    text(form.commercialRegisterNumber) ?? profile.commercialRegisterNumber ?? null
  profile.email = text(form.email) ?? profile.email ?? null
  profile.authorizedPersonName =
    text(form.representativeName) ?? profile.authorizedPersonName ?? null
  if (text(form.mobileNumber)) {
    profile.phoneNumber = form.mobileNumber.trim()
    profile.phoneCountryCode = form.mobileCountryCode
  }
  const productionLines = boolFromYesNo(form.allProductionLinesIncluded)
  if (productionLines !== undefined) profile.allProductionLinesActive = productionLines
  profile.inactiveReason = text(form.excludedReason) ?? profile.inactiveReason ?? null

  if (form.country) address.country = form.country
  if (text(form.headOfficeAddress)) address.street = form.headOfficeAddress.trim()

  return { profile, address }
}

function dateFromApi(value?: string | null): Date | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

const SLOT_FROM_DOCUMENT_TYPE: Record<string, string> = {
  COMMERCIAL_REGISTER: 'commercialRegistry',
  ORGANIZATION_CHART: 'organizationalStructure',
  QUALITY_MANUAL: 'documentarySystem',
  CONSULTANT_CV: 'other',
  AUTHORIZATION_LETTER: 'other',
  OTHER: 'other',
}

export function formValuesFromApplication(
  app: ApplicationResponse
): ApplicationFormValues {
  const form: ApplicationFormValues = {
    ...EMPTY_APPLICATION_FORM,
    branches: [],
    specAnswers: {},
    selectedSectors: {},
    selectedCodes: {},
    selectedStandards: [],
  }

  const legal = app.legalInfo ?? {}
  form.organizationName = legal.organizationName ?? ''
  form.website = legal.website ?? ''
  form.headOfficeAddress = legal.headOfficeAddress ?? ''
  form.auditSiteAddress = legal.auditSiteAddress ?? ''
  form.commercialRegisterNumber = legal.commercialRegisterNumber ?? ''
  form.commercialRegisterFile = legal.commercialRegisterFile ?? ''
  form.allProductionLinesIncluded = yesNoFromBool(legal.allProductionLinesIncluded)
  form.excludedReason = legal.excludedReason ?? ''
  form.email = legal.email ?? ''
  form.country = (legal.country as CountryCode | undefined) ?? null
  // TODO: wire up once backend adds legalInfo.city — add `form.city = legal.city ?? ''` here
  form.representativeName = legal.representativeName ?? ''
  form.jobTitle = legal.jobTitle ?? ''
  form.organizationNature = NATURE_FROM_API[legal.organizationNature ?? ''] ?? ''
  form.mainActivity = legal.mainActivity ?? ''
  if (legal.mobile) {
    const parsed = parsePhoneNumberFromString(legal.mobile)
    if (parsed?.country) {
      form.mobileCountryCode = parsed.country as CountryCode
      form.mobileNumber = parsed.nationalNumber
    } else {
      form.mobileNumber = legal.mobile
    }
  }

  const operational = app.operationalInfo ?? {}
  form.fieldOfWork = operational.fieldOfWork ?? ''
  form.economicFields = operational.economicActivity
    ? operational.economicActivity.split(', ').filter(Boolean)
    : []
  form.productsServices = operational.productsServices ?? ''
  form.annualCapacity = operational.annualCapacity ?? ''
  form.technicalSpecifications = operational.technicalSpecifications ?? ''

  const consultant = app.consultantInfo ?? {}
  form.usedConsultant = yesNoFromBool(consultant.usedConsultant)
  form.consultantName = consultant.consultantName ?? ''
  form.consultantCvAttached = yesNoFromBool(consultant.consultantCvAttached)
  form.consultancyMonths =
    consultant.consultancyMonths != null ? String(consultant.consultancyMonths) : ''
  form.qualificationRate = rateFromApi(consultant.qualificationRate)
  form.recommendationRate = rateFromApi(consultant.recommendationRate)
  form.systemLanguage = consultant.systemLanguage === 'EN' ? 'english' : 'arabic'
  form.easyAccess = yesNoFromBool(consultant.easyAccess)
  form.safetyProcedures = yesNoFromBool(consultant.safetyProcedures)
  form.usesSubcontractors = yesNoFromBool(consultant.usesSubcontractors)
  form.otherSpecification = consultant.previousCertificates ?? ''
  form.previousGrants = yesNoFromBool(
    consultant.previousCertificates ? true : undefined
  )
  form.currentSystems = (consultant.currentSystems ?? [])
    .map((system) => system.code?.toLowerCase() ?? '')
    .filter((code) => code in CURRENT_SYSTEM_NAMES)
  form.designActivity = yesNoFromBool(consultant.designActivity)
  form.designException = consultant.designException ?? ''

  const declaration = app.declarationInfo ?? {}
  form.certificateNameEn = declaration.certificateNameEn ?? ''
  form.certificateNameAr = declaration.certificateNameAr ?? ''
  form.certificateAddressEn = declaration.certificateAddressEn ?? ''
  form.certificateAddressAr = declaration.certificateAddressAr ?? ''
  form.certificateScopeEn = declaration.certificateScopeEn ?? ''
  form.certificateScopeAr = declaration.certificateScopeAr ?? ''
  form.agreed = declaration.agreed ?? false

  form.branches = (app.branches ?? []).map((branch, index) => ({
    ...createEmptyBranch(index + 1),
    sourceBranchId: branch.sourceBranchId,
    branchName: branch.branchName ?? '',
    address: branch.address ?? '',
    employees: branch.employees != null ? String(branch.employees) : '',
    employeesInScope:
      branch.employeesInScope != null ? String(branch.employeesInScope) : '',
    shifts: branch.shifts != null ? String(branch.shifts) : '',
    workingHours: branch.workingHours ?? '',
    productionLines:
      branch.productionLines != null ? String(branch.productionLines) : '',
    weeklyHoliday: branch.weeklyHoliday ?? '',
    phase1ExpectedDate: dateFromApi(branch.phase1ExpectedDate),
    integratedSystem: yesNoFromBool(branch.integratedSystem),
    centralManagement: yesNoFromBool(branch.centralManagement),
    activities: branch.activities ?? '',
    products: branch.products ?? '',
    technicalCommunication: branch.technicalCommunication ?? '',
  }))

  for (const certificate of app.certificates ?? []) {
    const standard = codeToStandard(certificate.certificateCode)
    if (standard) form.selectedStandards.push(standard)
    for (const sector of certificate.sectors ?? []) {
      const sectorKey = sector.sectorName as SectorKey | undefined
      if (!sectorKey || !(sectorKeys as readonly string[]).includes(sectorKey)) continue
      if (standard) {
        const standardSectors = (form.selectedSectors[standard] ??= [])
        if (!standardSectors.includes(sectorKey)) standardSectors.push(sectorKey)
        const codes = (sector.iafCodes ?? [])
          .map((iaf) => iaf.code)
          .filter((code): code is string => Boolean(code))
        if (codes.length) form.selectedCodes[`${standard}:${sectorKey}`] = codes
      }
    }
    for (const answer of certificate.answers ?? []) {
      if (!answer.questionKey) continue
      const def = SPEC_QUESTIONS.find((q) => q.questionKey === answer.questionKey)
      if (!def) continue
      if (def.questionType === 'BOOLEAN') {
        form.specAnswers[answer.questionKey] = answer.answer ? 'yes' : 'no'
      } else if (answer.answer != null) {
        form.specAnswers[answer.questionKey] = String(answer.answer)
      }
    }
  }
  form.selectedStandards = [...new Set(form.selectedStandards)]

  form.documents = (app.documents ?? []).map((doc, index) => {
    const entry: ApplicationDocumentEntry = {
      localId: `loaded-${index}`,
      slotId: SLOT_FROM_DOCUMENT_TYPE[doc.documentType ?? 'OTHER'] ?? 'other',
      documentType: doc.documentType ?? 'OTHER',
      fileUrl: doc.fileUrl ?? '',
      filePath: '',
      fileName: doc.fileName ?? '',
      originalName: doc.originalName ?? doc.fileName ?? '',
      mimeType: doc.mimeType ?? '',
      fileSize: doc.fileSize ?? 0,
    }
    return entry
  })

  return form
}
