import { authorizedRequest } from '@/lib/api/authorizedClient'

/** POST /cab-employees — creates a CAB employee (User + CabEmployeeProfile atomically). */
export const CAB_EMPLOYEES_PATH = '/cab-employees'

/** Mirrors backend `CabMemberJobRole` enum. */
export const CAB_PROFESSIONAL_ROLES = [
  { value: 'GENERAL_MANAGER', label: 'General Manager' },
  { value: 'APPLICATIONS_RECEIVER', label: 'Applications Receiver' },
  { value: 'TECHNICAL_MANAGER', label: 'Technical Manager' },
  { value: 'CERTIFICATION_MANAGER', label: 'Certification Manager' },
  { value: 'BUSINESS_DEVELOPMENT_MANAGER', label: 'Business Development Manager' },
  { value: 'LEAD_AUDITOR', label: 'Lead Auditor' },
  { value: 'AUDITOR', label: 'Auditor' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'COMMITTEE_MEMBER', label: 'Committee Member' },
  { value: 'FREELANCE_AUDITOR', label: 'Freelance Auditor' },
] as const

export type CabProfessionalRole = (typeof CAB_PROFESSIONAL_ROLES)[number]['value']

export function getProfessionalRoleLabel(role: string): string {
  return CAB_PROFESSIONAL_ROLES.find((r) => r.value === role)?.label ?? role
}

export function toBackendRole(role?: string): CabProfessionalRole {
  if (!role) return 'AUDITOR'
  const found = CAB_PROFESSIONAL_ROLES.find(
    (r) => r.value === role || r.label.toLowerCase() === role.toLowerCase(),
  )
  if (found) return found.value
  if (role === 'Lead Auditor') return 'LEAD_AUDITOR'
  if (role === 'Technical Expert') return 'FREELANCE_AUDITOR'
  if (role === 'Decision Maker') return 'COMMITTEE_MEMBER'
  if (role === 'Reviewer') return 'APPLICATIONS_RECEIVER'
  return 'AUDITOR'
}

/** Formats IAF codes to the two-digit string format expected by the backend (e.g. '01', '03'). */
export function cleanIafCodes(codes?: string[]): string[] {
  if (!codes) return []
  return codes
    .map((c) => {
      const match = c.match(/(\d+)/)
      return match ? match[1].padStart(2, '0') : c.trim()
    })
    .filter(Boolean)
}

/** Combines phone and countryCode without duplicate dial codes. */
export function formatEmployeePhone(phone?: string | null, countryCode?: string | null): string {
  if (!phone) return ''
  const trimmedPhone = phone.trim()
  const trimmedCode = (countryCode || '').trim()

  if (!trimmedCode) return trimmedPhone
  if (trimmedPhone.startsWith(trimmedCode)) return trimmedPhone
  if (trimmedPhone.startsWith('+')) return trimmedPhone

  return `${trimmedCode} ${trimmedPhone}`.trim()
}

export interface CabStandardCompetence {
  standard: string
  iafCodes: string[]
}

export interface StagedQualificationDocumentInput {
  uploadId: string
  fileName?: string | null
}

export interface CreateCabEmployeeQualificationCategoryInput {
  categoryName: string
  documents?: StagedQualificationDocumentInput[]
}

export interface CreateCabEmployeePayload {
  fullName: string
  email: string
  phone?: string | null
  phoneCountryCode?: string | null
  professionalRole: CabProfessionalRole
  employmentStartDate?: string | null
  employmentEndDate?: string | null
  currentlyWorksHere?: boolean
  standardsCompetence?: CabStandardCompetence[]
  iafCodes?: string[]
  schemes?: string[]
  authorizedSectors?: string[]
  scopeCountry?: string | null
  scopeExpiryDate?: string | null
  auditLanguages?: string[]
  baseCity?: string | null
  baseCountry?: string | null
  qualificationCategories?: CreateCabEmployeeQualificationCategoryInput[]
}

export interface CabEmployee {
  id: string
  userId: string
  cabId: string
  employeeCode?: string | null
  fullName?: string | null
  email?: string | null
  phone?: string | null
  phoneCountryCode?: string | null
  professionalRole: CabProfessionalRole | null
  imageUrl?: string | null
  employmentStartDate?: string | null
  employmentEndDate?: string | null
  currentlyWorksHere?: boolean
  standardsCompetence?: CabStandardCompetence[]
  expiryDate?: string | null
  scopeExpiryDate?: string | null
  scopeCountry?: string | null
  auditLanguages?: string[]
  baseCountry?: string | null
  baseCity?: string | null
  authorizedSectors?: string[]
  iafCodes: string[]
  schemes: string[]
  status: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    fullName: string
    email: string
    phone?: string | null
    phoneCountryCode?: string | null
    status: string
  }
}

export interface CreateCabEmployeeResponse {
  message: string
  employee: CabEmployee
}

export function createCabEmployee(
  payload: CreateCabEmployeePayload,
): Promise<CreateCabEmployeeResponse> {
  return authorizedRequest<CreateCabEmployeeResponse>(CAB_EMPLOYEES_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface ListCabEmployeesResponse {
  employees?: CabEmployee[]
  items?: CabEmployee[]
  total?: number
  page?: number
  limit?: number
  totalPages?: number
}

export function listCabEmployees(params?: {
  page?: number
  limit?: number
  status?: string
  professionalRole?: string
}): Promise<ListCabEmployeesResponse | CabEmployee[]> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.status) query.set('status', params.status)
  if (params?.professionalRole) query.set('professionalRole', params.professionalRole)
  const qs = query.toString() ? `?${query.toString()}` : ''
  return authorizedRequest<ListCabEmployeesResponse | CabEmployee[]>(
    `${CAB_EMPLOYEES_PATH}${qs}`,
  )
}

export function uploadCabEmployeeImage(
  id: string,
  imageFile: File,
): Promise<{ message: string; employee: CabEmployee }> {
  const formData = new FormData()
  formData.append('image', imageFile)
  return authorizedRequest<{ message: string; employee: CabEmployee }>(
    `/cab-employees/${id}/image`,
    {
      method: 'PATCH',
      body: formData,
    },
  )
}

export interface CabEmployeeQualification {
  id: string
  categoryId?: string | null
  documentType?: string | null
  fileUrl: string
  fileName?: string | null
  originalName?: string | null
  mimeType?: string | null
  fileSize?: number | null
  uploadedAt: string
}

export interface CabQualificationCategory {
  id: string
  name: string
  createdAt: string
  documents: CabEmployeeQualification[]
}

// ---------------------------------------------------------------------------
// CAB Members — Impartiality (Declarations, Relationships & Register)
// ---------------------------------------------------------------------------

export type CabDeclarationType = 'ANNUAL' | 'AUDIT_SPECIFIC'

export type CabDeclarationAnswer = 'NO_CONFLICT' | 'DECLARES_RELATIONSHIPS'

export const CAB_RELATIONSHIP_TYPES = [
  { value: 'CONSULTANCY', label: 'Consultancy' },
  { value: 'INTERNAL_AUDIT', label: 'Internal Audit' },
  { value: 'EMPLOYMENT', label: 'Employment' },
  { value: 'FAMILY_FINANCIAL_INTEREST', label: 'Family / Financial Interest' },
  { value: 'PREVIOUS_CERTIFICATION_DECISION', label: 'Previous Certification Decision' },
] as const

export type CabRelationshipType = (typeof CAB_RELATIONSHIP_TYPES)[number]['value']

export function getRelationshipTypeLabel(type: string): string {
  return CAB_RELATIONSHIP_TYPES.find((t) => t.value === type)?.label ?? type
}

export interface CabImpartialityDeclaration {
  id: string
  declarationType: CabDeclarationType
  auditReference?: string | null
  answer: CabDeclarationAnswer
  signedBy: string
  signedAt: string
  validUntil?: string | null
  createdAt: string
}

export interface CreateImpartialityDeclarationPayload {
  declarationType: CabDeclarationType
  answer: CabDeclarationAnswer
  signedBy: string
  signedAt: string
  /** Required when declarationType is AUDIT_SPECIFIC; must be omitted for ANNUAL. */
  auditReference?: string
}

export interface CabImpartialityRelationship {
  id: string
  employeeProfileId?: string
  clientId: string
  client?: {
    id: string
    name: string
  } | null
  relationshipType: CabRelationshipType
  description?: string | null
  startDate: string
  endDate?: string | null
  isOngoing?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateImpartialityRelationshipPayload {
  clientId: string
  relationshipType: CabRelationshipType
  description?: string | null
  startDate: string
  endDate?: string | null
}

export interface UpdateImpartialityRelationshipPayload {
  endDate?: string | null
  description?: string | null
}

export interface CabImpartialityRegisterEntry {
  employeeId: string
  employeeCode: string
  fullName: string | null
  email: string | null
  professionalRole: CabProfessionalRole | null
  status: 'ACTIVE' | 'INACTIVE' | string
  annualDeclaration: {
    id: string
    answer: CabDeclarationAnswer
    signedBy: string
    signedAt: string
    validUntil: string | null
    isActive: boolean
  } | null
  declarationsCount: number
  declarations: CabImpartialityDeclaration[]
  relationshipsCount: number
  relationships: CabImpartialityRelationship[]
}

export interface CabImpartialityRegisterResponse {
  register: CabImpartialityRegisterEntry[]
  totalEmployees: number
}

// ---------------------------------------------------------------------------
// CAB Members — Availability (Periods)
// ---------------------------------------------------------------------------

export interface CabAvailabilityPeriod {
  id: string
  startDate: string
  endDate: string
  reason: string
  notes?: string | null
  createdAt: string
}

export interface CreateAvailabilityPeriodPayload {
  startDate: string
  endDate: string
  reason: string
  notes?: string | null
}

export interface CabEmployeeDetail extends CabEmployee {
  qualifications?: CabEmployeeQualification[]
  qualificationCategories?: CabQualificationCategory[]
  impartialityDeclarations?: CabImpartialityDeclaration[]
  declaredRelationships?: CabImpartialityRelationship[]
  availabilityPeriods?: CabAvailabilityPeriod[]
}

export function getCabEmployeeDetail(
  id: string,
): Promise<{ employee: CabEmployeeDetail }> {
  return authorizedRequest<{ employee: CabEmployeeDetail }>(
    `${CAB_EMPLOYEES_PATH}/${id}`,
  )
}

/**
 * POST /cab-employees/{id}/availability
 * Creates an availability/unavailability period for an employee (startDate <= endDate).
 */
export function createCabEmployeeAvailabilityPeriod(
  employeeId: string,
  payload: CreateAvailabilityPeriodPayload,
): Promise<{ message: string; period: CabAvailabilityPeriod }> {
  const body: CreateAvailabilityPeriodPayload = {
    startDate: payload.startDate,
    endDate: payload.endDate,
    reason: payload.reason.trim(),
    ...(payload.notes?.trim() ? { notes: payload.notes.trim() } : { notes: null }),
  }
  return authorizedRequest<{ message: string; period: CabAvailabilityPeriod }>(
    `${CAB_EMPLOYEES_PATH}/${employeeId}/availability`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
}

/**
 * GET /cab-employees/{id}/availability
 * Lists all availability periods for an employee, ordered by startDate ascending.
 */
export function listCabEmployeeAvailabilityPeriods(
  employeeId: string,
): Promise<{ periods: CabAvailabilityPeriod[] }> {
  return authorizedRequest<{ periods: CabAvailabilityPeriod[] }>(
    `${CAB_EMPLOYEES_PATH}/${employeeId}/availability`,
  )
}

/**
 * DELETE /cab-employees/{id}/availability/{periodId}
 * Deletes a single availability period for an employee.
 */
export function deleteCabEmployeeAvailabilityPeriod(
  employeeId: string,
  periodId: string,
): Promise<{ message: string }> {
  return authorizedRequest<{ message: string }>(
    `${CAB_EMPLOYEES_PATH}/${employeeId}/availability/${periodId}`,
    {
      method: 'DELETE',
    },
  )
}

/**
 * POST /cab-employees/{id}/impartiality/declarations
 * Creates an impartiality declaration for an employee. Declaration history is preserved.
 */
export function createCabEmployeeImpartialityDeclaration(
  employeeId: string,
  payload: CreateImpartialityDeclarationPayload,
): Promise<{ message: string; declaration: CabImpartialityDeclaration }> {
  const body: CreateImpartialityDeclarationPayload = {
    declarationType: payload.declarationType,
    answer: payload.answer,
    signedBy: payload.signedBy.trim(),
    signedAt: payload.signedAt,
    ...(payload.declarationType === 'AUDIT_SPECIFIC' && payload.auditReference?.trim()
      ? { auditReference: payload.auditReference.trim() }
      : {}),
  }
  return authorizedRequest<{ message: string; declaration: CabImpartialityDeclaration }>(
    `${CAB_EMPLOYEES_PATH}/${employeeId}/impartiality/declarations`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
}

/**
 * GET /cab-employees/{id}/impartiality/declarations
 * Lists all impartiality declarations for an employee, ordered by signedAt desc.
 */
export function listCabEmployeeImpartialityDeclarations(
  employeeId: string,
): Promise<{ declarations: CabImpartialityDeclaration[] }> {
  return authorizedRequest<{ declarations: CabImpartialityDeclaration[] }>(
    `${CAB_EMPLOYEES_PATH}/${employeeId}/impartiality/declarations`,
  )
}

/**
 * POST /cab-employees/{id}/impartiality/relationships
 * Records a declared conflict-of-interest relationship between an employee and a client organisation.
 */
export function createCabEmployeeImpartialityRelationship(
  employeeId: string,
  payload: CreateImpartialityRelationshipPayload,
): Promise<{ message: string; relationship: CabImpartialityRelationship }> {
  return authorizedRequest<{ message: string; relationship: CabImpartialityRelationship }>(
    `${CAB_EMPLOYEES_PATH}/${employeeId}/impartiality/relationships`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

/**
 * GET /cab-employees/{id}/impartiality/relationships
 * Lists all declared client relationships for an employee, ordered by startDate desc.
 */
export function listCabEmployeeImpartialityRelationships(
  employeeId: string,
): Promise<{ relationships: CabImpartialityRelationship[] }> {
  return authorizedRequest<{ relationships: CabImpartialityRelationship[] }>(
    `${CAB_EMPLOYEES_PATH}/${employeeId}/impartiality/relationships`,
  )
}

/**
 * PATCH /cab-employees/{id}/impartiality/relationships/{relationshipId}
 * Patch-style update of a declared relationship (endDate and/or description).
 */
export function updateCabEmployeeImpartialityRelationship(
  employeeId: string,
  relationshipId: string,
  payload: UpdateImpartialityRelationshipPayload,
): Promise<{ message: string; relationship: CabImpartialityRelationship }> {
  return authorizedRequest<{ message: string; relationship: CabImpartialityRelationship }>(
    `${CAB_EMPLOYEES_PATH}/${employeeId}/impartiality/relationships/${relationshipId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  )
}

/**
 * GET /cab/impartiality-register
 * Returns the complete Impartiality Register for the authenticated CAB.
 */
export function getCabImpartialityRegister(): Promise<CabImpartialityRegisterResponse> {
  return authorizedRequest<CabImpartialityRegisterResponse>('/cab/impartiality-register')
}

export interface StagedQualificationUploadResponse {
  message: string
  uploadId: string
  fileName: string
  originalName: string
  mimeType: string
  fileSize: number
  filePath: string
  fileUrl: string
}

/**
  * POST /cab-employees/qualifications/upload
  * Staged upload used BEFORE employee creation (no employee ID required).
  * Pass the returned `uploadId` in `POST /cab-employees` under `qualificationCategories`.
  */
export function uploadStagedCabEmployeeQualification(
  file: File,
): Promise<StagedQualificationUploadResponse> {
  const formData = new FormData()
  formData.append('document', file)
  return authorizedRequest<StagedQualificationUploadResponse>(
    `${CAB_EMPLOYEES_PATH}/qualifications/upload`,
    {
      method: 'POST',
      body: formData,
    },
  )
}

/**
 * POST /cab-employees/{id}/qualifications/categories
 * Creates a named qualification category for an employee without requiring a file upload.
 */
export function createCabEmployeeQualificationCategory(
  employeeId: string,
  categoryName: string,
): Promise<{ message: string; category: CabQualificationCategory }> {
  return authorizedRequest<{ message: string; category: CabQualificationCategory }>(
    `${CAB_EMPLOYEES_PATH}/${employeeId}/qualifications/categories`,
    {
      method: 'POST',
      body: JSON.stringify({ categoryName: categoryName.trim() }),
    },
  )
}

/**
 * POST /cab-employees/{id}/qualifications
 * Uploads a qualification document for an employee, optionally linked to an existing categoryId.
 */
export function uploadCabEmployeeQualification(
  employeeId: string,
  file: File,
  options?: { categoryId?: string; documentType?: string } | string,
): Promise<{ message: string; qualification: CabEmployeeQualification }> {
  const formData = new FormData()
  formData.append('document', file)

  if (typeof options === 'string') {
    if (options) formData.append('documentType', options)
  } else if (options) {
    if (options.categoryId) formData.append('categoryId', options.categoryId)
    if (options.documentType) formData.append('documentType', options.documentType)
  }

  return authorizedRequest<{ message: string; qualification: CabEmployeeQualification }>(
    `${CAB_EMPLOYEES_PATH}/${employeeId}/qualifications`,
    {
      method: 'POST',
      body: formData,
    },
  )
}

/**
 * DELETE /cab-employees/{id}/qualifications/{docId}
 * Deletes a single qualification document record and its underlying file from disk.
 */
export function deleteCabEmployeeQualification(
  employeeId: string,
  docId: string,
): Promise<{ message: string }> {
  return authorizedRequest<{ message: string }>(
    `${CAB_EMPLOYEES_PATH}/${employeeId}/qualifications/${docId}`,
    {
      method: 'DELETE',
    },
  )
}

export interface UpdateCabEmployeePayload {
  fullName?: string
  email?: string
  phone?: string | null
  phoneCountryCode?: string | null
  professionalRole?: CabProfessionalRole
  employmentStartDate?: string | null
  employmentEndDate?: string | null
  currentlyWorksHere?: boolean
  standardsCompetence?: CabStandardCompetence[]
  iafCodes?: string[]
  schemes?: string[]
  authorizedSectors?: string[]
  scopeCountry?: string | null
  scopeExpiryDate?: string | null
  auditLanguages?: string[]
  baseCity?: string | null
  baseCountry?: string | null
}

export function updateCabEmployee(
  id: string,
  payload: UpdateCabEmployeePayload,
): Promise<{ message: string; employee: CabEmployee }> {
  return authorizedRequest<{ message: string; employee: CabEmployee }>(
    `${CAB_EMPLOYEES_PATH}/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  )
}

export function updateCabEmployeeStatus(
  id: string,
  status: 'ACTIVE' | 'INACTIVE',
): Promise<{ message: string; employee: CabEmployee }> {
  return authorizedRequest<{ message: string; employee: CabEmployee }>(
    `${CAB_EMPLOYEES_PATH}/${id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
  )
}
