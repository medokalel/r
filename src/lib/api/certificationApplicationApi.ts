import { authorizedRequest } from '@/lib/api/authorizedClient'
import {
  filterInformationRequiredLikeCab,
  sectionStatusesFromUnknown,
  withReviewSectionDueDate,
} from '@/lib/api/irReviewSectionSync'

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'QUOTATION_CREATED'
  | 'QUOTATION_ISSUED'
  | 'QUOTATION_ACCEPTED'
  | 'QUOTATION_REJECTED'

export type ApplicationRequestType = 'NEW' | 'RENEWAL'

export type ApplicationDocumentType =
  | 'COMMERCIAL_REGISTER'
  | 'AUTHORIZATION_LETTER'
  | 'ORGANIZATION_CHART'
  | 'QUALITY_MANUAL'
  | 'CONSULTANT_CV'
  | 'OTHER'

export type QuestionType = 'BOOLEAN' | 'TEXT' | 'DATE' | 'NUMBER'

export interface ApplicationLegalInfo {
  organizationName?: string
  website?: string
  auditSiteAddress?: string
  headOfficeAddress?: string
  commercialRegisterNumber?: string
  commercialRegisterFile?: string
  allProductionLinesIncluded?: boolean
  excludedReason?: string
  country?: string
  city?: string
  email?: string
  representativeName?: string
  jobTitle?: string
  organizationNature?: string
  mobile?: string
  requestType?: ApplicationRequestType
  mainActivity?: string
}

export interface ApplicationOperationalInfo {
  fieldOfWork?: string
  economicActivity?: string
  productsServices?: string
  annualCapacity?: string
  technicalSpecifications?: string
}

export interface ConsultantCurrentSystem {
  code?: string
  name?: string
  certifiedSince?: string
}

export interface ApplicationConsultantInfo {
  usedConsultant?: boolean
  consultantName?: string
  consultantCvAttached?: boolean
  consultancyMonths?: number
  qualificationRate?: string
  recommendationRate?: string
  systemLanguage?: 'AR' | 'EN'
  easyAccess?: boolean
  usesSubcontractors?: boolean
  safetyProcedures?: boolean
  previousCertificates?: string
  currentSystems?: ConsultantCurrentSystem[]
  designActivity?: boolean
  designException?: string
}

export interface ApplicationDeclarationInfo {
  certificateNameEn?: string
  certificateNameAr?: string
  certificateAddressEn?: string
  certificateAddressAr?: string
  certificateScopeEn?: string
  certificateScopeAr?: string
  agreed?: boolean
}

export interface ApplicationBranch {
  sourceBranchId?: string
  branchName?: string
  address?: string
  employees?: number
  employeesInScope?: number
  shifts?: number
  workingHours?: string
  productionLines?: number
  weeklyHoliday?: string
  phase1ExpectedDate?: string | null
  integratedSystem?: boolean
  centralManagement?: boolean
  activities?: string
  products?: string
  technicalCommunication?: string
}

export interface CertificateIafCode {
  code?: string
  critical?: boolean
}

export interface CertificateSector {
  sectorName?: string
  iafCodes?: CertificateIafCode[]
}

export interface CertificateAnswer {
  questionKey?: string
  questionLabel?: string
  questionType?: QuestionType
  answer?: boolean | number | string
}

export interface ApplicationCertificate {
  certificateCode?: string
  certificateName?: string
  sectors?: CertificateSector[]
  answers?: CertificateAnswer[]
}

export interface ApplicationDocument {
  documentType?: ApplicationDocumentType
  fileUrl?: string
  fileName?: string | null
  originalName?: string | null
  mimeType?: string | null
  fileSize?: number | null
  uploadedAt?: string | null
}

export interface DraftApplicationRequest {
  legalInfo?: ApplicationLegalInfo
  operationalInfo?: ApplicationOperationalInfo
  consultantInfo?: ApplicationConsultantInfo
  declarationInfo?: ApplicationDeclarationInfo
  branches?: ApplicationBranch[]
  certificates?: ApplicationCertificate[]
  documents?: ApplicationDocument[]
}

export interface ApplicationResponse extends DraftApplicationRequest {
  id: string
  orderNumber?: string | null
  organizationId?: string
  status: ApplicationStatus
  submittedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface SubmitApplicationResult {
  id: string
  orderNumber: string
  status: ApplicationStatus
  submittedAt: string
}

export interface UploadApplicationDocumentResult {
  message: string
  filePath: string
  fileUrl: string
  fileName: string
  mimeType: string
  sizeBytes: number
}

export function listApplications(): Promise<ApplicationResponse[]> {
  return authorizedRequest('/certification-applications')
}

export function getApplication(id: string): Promise<ApplicationResponse> {
  return authorizedRequest(`/certification-applications/${id}`)
}

export function createDraftApplication(
  payload: DraftApplicationRequest
): Promise<ApplicationResponse> {
  return authorizedRequest('/certification-applications/draft', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateDraftApplication(
  id: string,
  payload: DraftApplicationRequest
): Promise<ApplicationResponse> {
  return authorizedRequest(`/certification-applications/${id}/draft`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function submitApplication(id: string): Promise<SubmitApplicationResult> {
  return authorizedRequest(`/certification-applications/${id}/submit`, {
    method: 'POST',
  })
}

export function uploadApplicationDocument(
  file: File
): Promise<UploadApplicationDocumentResult> {
  const formData = new FormData()
  formData.append('document', file)
  return authorizedRequest('/uploads/application-document', {
    method: 'POST',
    body: formData,
  })
}

export function deleteApplicationDocument(
  filename: string
): Promise<{ message: string }> {
  return authorizedRequest(
    `/uploads/application-document/${encodeURIComponent(filename)}`,
    { method: 'DELETE' }
  )
}

export interface ClientResponseAttachment {
  id?: string
  fileUrl: string
  fileName?: string | null
  originalName?: string | null
  mimeType?: string | null
  fileSize?: number | null
}

export interface ClientResponseItem {
  id: string
  response: string | null
  submittedBy: { id: string; fullName: string } | null
  submittedOn: string
  status: string | null
  attachments: ClientResponseAttachment[]
}

export interface InformationRequiredItem {
  id: string
  applicationId: string
  informationItem: string
  referenceClause: string | null
  requestedBy: { id: string; fullName: string } | null
  requestedOn: string
  dueDate: string | null
  priority: string | null
  status: string
  responses: ClientResponseItem[]
}

export interface CreateClientResponsePayload {
  response?: string | null
  attachments?: ClientResponseAttachment[]
}

export async function listInformationRequired(
  applicationId: string
): Promise<InformationRequiredItem[]> {
  const data = await authorizedRequest<unknown>(
    `/certification-applications/${encodeURIComponent(applicationId)}/information-required`
  )
  const items = Array.isArray(data)
    ? (data as InformationRequiredItem[])
    : data && typeof data === 'object' && Array.isArray((data as { informationRequired?: unknown }).informationRequired)
      ? (data as { informationRequired: InformationRequiredItem[] }).informationRequired
      : []
  let sectionStatuses: Partial<Record<string, string>> = {}
  try {
    const application = await getApplication(applicationId)
    sectionStatuses = sectionStatusesFromUnknown(application)
  } catch {
    sectionStatuses = {}
  }
  return filterInformationRequiredLikeCab(applicationId, items, sectionStatuses).map(withReviewSectionDueDate)
}

export function submitInformationRequiredResponse(
  applicationId: string,
  informationRequiredId: string,
  payload: CreateClientResponsePayload
): Promise<ClientResponseItem> {
  return authorizedRequest(
    `/certification-applications/${encodeURIComponent(applicationId)}/information-required/${encodeURIComponent(informationRequiredId)}/responses`,
    { method: 'POST', body: JSON.stringify(payload) }
  )
}
