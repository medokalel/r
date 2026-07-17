import type { CountryCode } from '@/lib/countries'
import type { QuestionType } from '@/lib/api/certificationApplicationApi'
import type { SectorKey, StandardKey } from '@/components/dashboard/entityData/fieldTypes'

/** Tri-state radio value: empty string means "not answered yet". */
export type YesNo = '' | 'yes' | 'no'

export function yesNoFromBool(value?: boolean | null): YesNo {
  if (value === true) return 'yes'
  if (value === false) return 'no'
  return ''
}

export function boolFromYesNo(value: YesNo): boolean | undefined {
  if (value === 'yes') return true
  if (value === 'no') return false
  return undefined
}

export interface BranchFormValues {
  localId: number
  /** Organization-profile branch this application branch is copied from. */
  sourceBranchId?: string
  branchName: string
  address: string
  employees: string
  employeesInScope: string
  shifts: string
  workingHours: string
  productionLines: string
  weeklyHoliday: string
  phase1ExpectedDate?: Date
  integratedSystem: YesNo
  centralManagement: YesNo
  activities: string
  products: string
  technicalCommunication: string
}

export interface ApplicationDocumentEntry {
  localId: string
  /** UI slot the file was uploaded from (requiredDocuments ids or 'other'). */
  slotId: string
  documentType: string
  fileUrl: string
  filePath: string
  fileName: string
  originalName: string
  mimeType: string
  fileSize: number
}

export interface ApplicationFormValues {
  // Legal identity
  selectedStandards: StandardKey[]
  otherStandard: string
  organizationName: string
  website: string
  headOfficeAddress: string
  auditSiteAddress: string
  commercialRegisterNumber: string
  commercialRegisterFile: string
  allProductionLinesIncluded: YesNo
  excludedReason: string
  email: string
  country: CountryCode | null
  representativeName: string
  jobTitle: string
  organizationNature: string
  mobileCountryCode: CountryCode
  mobileNumber: string
  mainActivity: string

  // Scope of activity
  fieldOfWork: string
  economicFields: string[]
  productsServices: string
  annualCapacity: string
  technicalSpecifications: string
  branches: BranchFormValues[]

  // Consulting & readiness
  usedConsultant: YesNo
  consultantName: string
  consultantCvAttached: YesNo
  consultancyMonths: string
  qualificationRate: number | null
  recommendationRate: number | null
  systemLanguage: 'arabic' | 'english'
  easyAccess: YesNo
  safetyProcedures: YesNo
  usesSubcontractors: YesNo
  previousGrants: YesNo
  currentSystems: string[]
  otherSystemSelected: boolean
  otherSpecification: string
  designActivity: YesNo
  designException: string

  // Specification questions ('yes'/'no', ISO date string, or free text per question)
  specAnswers: Record<string, string>

  // Field (sectors & IAF codes) — each standard keeps its own sector list;
  // codes keyed by `${standard}:${sector}`
  selectedSectors: Record<string, SectorKey[]>
  selectedCodes: Record<string, string[]>

  // Legal declarations
  signatoryName: string
  declarationDate?: Date
  certificateNameAr: string
  certificateNameEn: string
  certificateAddressAr: string
  certificateAddressEn: string
  certificateScopeAr: string
  certificateScopeEn: string
  agreed: boolean

  // Documents
  documents: ApplicationDocumentEntry[]
}

export function createEmptyBranch(localId: number): BranchFormValues {
  return {
    localId,
    branchName: '',
    address: '',
    employees: '',
    employeesInScope: '',
    shifts: '',
    workingHours: '',
    productionLines: '',
    weeklyHoliday: '',
    integratedSystem: '',
    centralManagement: '',
    activities: '',
    products: '',
    technicalCommunication: '',
  }
}

export const EMPTY_APPLICATION_FORM: ApplicationFormValues = {
  selectedStandards: [],
  otherStandard: '',
  organizationName: '',
  website: '',
  headOfficeAddress: '',
  auditSiteAddress: '',
  commercialRegisterNumber: '',
  commercialRegisterFile: '',
  allProductionLinesIncluded: '',
  excludedReason: '',
  email: '',
  country: null,
  representativeName: '',
  jobTitle: '',
  organizationNature: '',
  mobileCountryCode: 'SA',
  mobileNumber: '',
  mainActivity: '',

  fieldOfWork: '',
  economicFields: [],
  productsServices: '',
  annualCapacity: '',
  technicalSpecifications: '',
  branches: [createEmptyBranch(1)],

  usedConsultant: '',
  consultantName: '',
  consultantCvAttached: '',
  consultancyMonths: '',
  qualificationRate: null,
  recommendationRate: null,
  systemLanguage: 'arabic',
  easyAccess: '',
  safetyProcedures: '',
  usesSubcontractors: '',
  previousGrants: '',
  currentSystems: [],
  otherSystemSelected: false,
  otherSpecification: '',
  designActivity: '',
  designException: '',

  specAnswers: {},

  selectedSectors: {},
  selectedCodes: {},

  signatoryName: '',
  certificateNameAr: '',
  certificateNameEn: '',
  certificateAddressAr: '',
  certificateAddressEn: '',
  certificateScopeAr: '',
  certificateScopeEn: '',
  agreed: false,

  documents: [],
}

export interface ApplicationNotification {
  type: 'success' | 'error'
  message: string
}

export interface SpecQuestionDef {
  /** Stable key persisted to the API, e.g. "iso45001.ohsSystemInPlace". */
  questionKey: string
  /** Certificate code the answer belongs to, e.g. "ISO45001". */
  certificateCode: string
  /** i18n key under accreditation.entityData.fields.spec. */
  labelKey: string
  questionType: QuestionType
}

export const SPEC_QUESTIONS: SpecQuestionDef[] = [
  { questionKey: 'iso9001.qmsSystemInPlace', certificateCode: 'ISO9001', labelKey: 'iso9001.qmsSystemInPlace', questionType: 'BOOLEAN' },
  { questionKey: 'iso9001.qmsStartDate', certificateCode: 'ISO9001', labelKey: 'iso9001.qmsStartDate', questionType: 'DATE' },
  { questionKey: 'iso9001.keyProcesses', certificateCode: 'ISO9001', labelKey: 'iso9001.keyProcesses', questionType: 'TEXT' },
  { questionKey: 'iso9001.internalAudits', certificateCode: 'ISO9001', labelKey: 'iso9001.internalAudits', questionType: 'BOOLEAN' },
  { questionKey: 'iso9001.managementReview', certificateCode: 'ISO9001', labelKey: 'iso9001.managementReview', questionType: 'BOOLEAN' },
  { questionKey: 'iso9001.customerComplaints', certificateCode: 'ISO9001', labelKey: 'iso9001.customerComplaints', questionType: 'TEXT' },
  { questionKey: 'iso14001.emsSystemInPlace', certificateCode: 'ISO14001', labelKey: 'iso14001.emsSystemInPlace', questionType: 'BOOLEAN' },
  { questionKey: 'iso14001.emsStartDate', certificateCode: 'ISO14001', labelKey: 'iso14001.emsStartDate', questionType: 'DATE' },
  { questionKey: 'iso14001.environmentalAspects', certificateCode: 'ISO14001', labelKey: 'iso14001.environmentalAspects', questionType: 'TEXT' },
  { questionKey: 'iso14001.legalCompliance', certificateCode: 'ISO14001', labelKey: 'iso14001.legalCompliance', questionType: 'TEXT' },
  { questionKey: 'iso14001.internalAudits', certificateCode: 'ISO14001', labelKey: 'iso14001.internalAudits', questionType: 'BOOLEAN' },
  { questionKey: 'iso14001.environmentalIncidents', certificateCode: 'ISO14001', labelKey: 'iso14001.environmentalIncidents', questionType: 'BOOLEAN' },
  { questionKey: 'iso50001.energyConsumers', certificateCode: 'ISO50001', labelKey: 'iso50001.energyConsumers', questionType: 'TEXT' },
  { questionKey: 'iso50001.enpi', certificateCode: 'ISO50001', labelKey: 'iso50001.enpi', questionType: 'TEXT' },
  { questionKey: 'iso50001.energyBaseline', certificateCode: 'ISO50001', labelKey: 'iso50001.energyBaseline', questionType: 'BOOLEAN' },
  { questionKey: 'iso50001.baselineUpdated', certificateCode: 'ISO50001', labelKey: 'iso50001.baselineUpdated', questionType: 'DATE' },
  { questionKey: 'iso50001.monitoringTools', certificateCode: 'ISO50001', labelKey: 'iso50001.monitoringTools', questionType: 'TEXT' },
  { questionKey: 'iso45001.ohsSystemInPlace', certificateCode: 'ISO45001', labelKey: 'iso45001.ohsSystemInPlace', questionType: 'BOOLEAN' },
  { questionKey: 'iso45001.ohsStartDate', certificateCode: 'ISO45001', labelKey: 'iso45001.ohsStartDate', questionType: 'DATE' },
  { questionKey: 'iso45001.risksIdentified', certificateCode: 'ISO45001', labelKey: 'iso45001.risksIdentified', questionType: 'BOOLEAN' },
  { questionKey: 'iso45001.criticalRisks', certificateCode: 'ISO45001', labelKey: 'iso45001.criticalRisks', questionType: 'TEXT' },
  { questionKey: 'iso45001.internalAudits', certificateCode: 'ISO45001', labelKey: 'iso45001.internalAudits', questionType: 'BOOLEAN' },
  { questionKey: 'iso45001.complianceLaws', certificateCode: 'ISO45001', labelKey: 'iso45001.complianceLaws', questionType: 'TEXT' },
  { questionKey: 'iso45001.legalViolations', certificateCode: 'ISO45001', labelKey: 'iso45001.legalViolations', questionType: 'BOOLEAN' },
  { questionKey: 'iso45001.ohsCertification', certificateCode: 'ISO45001', labelKey: 'iso45001.ohsCertification', questionType: 'BOOLEAN' },
  { questionKey: 'iso45001.certifyingBody', certificateCode: 'ISO45001', labelKey: 'iso45001.certifyingBody', questionType: 'TEXT' },
]

/** Upload slots on the documents step → API document types. */
export const DOCUMENT_SLOT_TYPES: Record<string, string> = {
  documentarySystem: 'QUALITY_MANUAL',
  organizationalStructure: 'ORGANIZATION_CHART',
  commercialRegistry: 'COMMERCIAL_REGISTER',
  vatCertificate: 'OTHER',
  brandImage: 'OTHER',
  nationalAddress: 'OTHER',
  qualityPolicy: 'QUALITY_MANUAL',
  other: 'OTHER',
}
