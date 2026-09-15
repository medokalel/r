import { apiRequestWithAuth } from '@/lib/api/client'
import { getAuthToken } from '@/lib/authStorage'
import type { ClientRegistrationForm } from '@/lib/clientRegistrationForm'
import { getCountryCallingCode, getCountries, type CountryCode } from 'libphonenumber-js'
import type {
  OrganizationProfileData,
  OrgDocument,
  OrgProfileInput,
  OrgAddressInput,
  SaveProfileResult,
} from '@/lib/api/organizationProfileApi'

export type CabClientStatus = 'DRAFT' | 'REGISTERED' | 'INACTIVE' | 'COMPLETED' | 'ACTIVE'

export interface CabAuditClientOwner {
  id: string
  fullName: string | null
  email: string | null
  phone: string | null
  status: string | null
}

export interface CabAuditClientListItem {
  id: string
  name: string
  tradeName: string | null
  type: string
  status: string
  profileStatus: string
  city: string | null
  address: string | null
  createdAt: string
  owner: CabAuditClientOwner | null
}

export interface CabClientList {
  items: CabAuditClientListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/** Flattened client used by the registration form and details page. */
export interface CabClient {
  id: string
  legalEntityName: string | null
  tradingName: string | null
  organizationType: string | null
  registrationNumber: string | null
  incorporationDate: string | null
  country: string | null
  state: string | null
  city: string | null
  addressLine1: string | null
  addressLine2: string | null
  landmark: string | null
  postalCode: string | null
  addressCountry: string | null
  addressState: string | null
  addressCity: string | null
  contactFullName: string | null
  contactDesignation: string | null
  contactEmail: string | null
  phoneCountryCode: string | null
  phoneNumber: string | null
  mobileCountryCode: string | null
  mobileNumber: string | null
  industry: string | null
  employeeCount: string | null
  annualTurnover: string | null
  website: string | null
  activitiesDescription: string | null
  supportingDocumentUrl: string | null
  supportingDocumentOriginalName: string | null
  supportingDocumentMimeType: string | null
  supportingDocumentSize: number | null
  status: CabClientStatus
  createdAt?: string
  updatedAt?: string
  applicationNumber?: string | null
  assignedToName?: string | null
}

interface CreateClientResponse {
  message: string
  userId: string
  organizationId: string
}

interface SavedClientResponse {
  message: string
  client: CabClient
}

function requireToken(): string {
  const token = getAuthToken()
  if (!token) throw new Error('Authentication required')
  return token
}

function toIsoDate(value: Date | null): string | undefined {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return undefined
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseEmployeeCount(label: string): number | undefined {
  const digits = label.match(/\d+/g)
  if (!digits?.length) return undefined
  return Number(digits[digits.length - 1])
}

function formatEmployeeCount(count: number | null | undefined): string {
  if (count == null || Number.isNaN(count)) return ''
  const match = EMPLOYEE_COUNT_OPTIONS.find((option) => parseEmployeeCount(option) === count)
  return match ?? String(count)
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

function toDialCode(country: CountryCode | ''): string {
  if (!country) return '+20'
  try {
    return `+${getCountryCallingCode(country)}`
  } catch {
    return '+20'
  }
}

function toPhone(country: CountryCode | '', number: string): string {
  const digits = digitsOnly(number)
  const dial = toDialCode(country).replace(/^\+/, '')
  return `+${dial}${digits}`.slice(0, 20)
}

function countryFromDial(dialOrCode: string | null | undefined): CountryCode {
  if (!dialOrCode) return 'EG'
  const normalized = dialOrCode.replace(/\s/g, '')
  if (/^[A-Z]{2}$/i.test(normalized)) return normalized.toUpperCase() as CountryCode
  const dialDigits = digitsOnly(normalized)
  for (const code of getCountries()) {
    try {
      if (getCountryCallingCode(code) === dialDigits) return code
    } catch {
      // skip invalid codes
    }
  }
  return 'EG'
}

function commercialRegister(profile: OrganizationProfileData | null): OrgDocument | undefined {
  return profile?.documents?.find((doc) => doc.documentType === 'COMMERCIAL_REGISTER')
    ?? profile?.documents?.[0]
}

function profileToClient(clientId: string, data: OrganizationProfileData): CabClient {
  const profile = data.profile ?? {}
  const address = data.address ?? {}
  const original = data.originalRegistrationData ?? {}
  const document = commercialRegister(data)
  const profileStatus = (data.status || 'DRAFT').toUpperCase()
  const status: CabClientStatus =
    profileStatus === 'COMPLETED' ? 'REGISTERED' : (profileStatus as CabClientStatus)

  return {
    id: clientId,
    legalEntityName: profile.organizationName ?? data.organizationName ?? null,
    tradingName: profile.tradeName ?? null,
    organizationType: original.legalCapacity ?? null,
    registrationNumber: profile.commercialRegisterNumber ?? null,
    incorporationDate: profile.registrationDate ?? null,
    country: address.country ?? null,
    state: address.district ?? null,
    city: original.city ?? address.city ?? null,
    addressLine1: address.street ?? original.address ?? null,
    addressLine2: address.buildingNumber ?? null,
    landmark: address.additionalNumber ?? null,
    postalCode: address.postalCode ?? null,
    addressCountry: address.country ?? null,
    addressState: address.district ?? null,
    addressCity: address.city ?? null,
    contactFullName: profile.authorizedPersonName ?? null,
    contactDesignation: null,
    contactEmail: profile.email ?? null,
    phoneCountryCode: countryFromDial(profile.phoneCountryCode),
    phoneNumber: profile.phoneNumber ?? null,
    mobileCountryCode: 'EG',
    mobileNumber: null,
    industry: profile.industries?.[0] ?? null,
    employeeCount: formatEmployeeCount(profile.employeeCount),
    annualTurnover: null,
    website: null,
    activitiesDescription: profile.companySummary ?? original.activity ?? null,
    supportingDocumentUrl: document?.fileUrl ?? null,
    supportingDocumentOriginalName: document?.originalName ?? null,
    supportingDocumentMimeType: document?.mimeType ?? null,
    supportingDocumentSize: document?.fileSize ?? null,
    status,
  }
}

function toCreatePayload(form: ClientRegistrationForm) {
  const administrationName =
    [form.addressLine1, form.addressCity || form.city].filter((part) => part.trim()).join(', ')
    || form.city
    || form.legalEntityName

  return {
    email: form.contactEmail.trim(),
    organizationName: form.legalEntityName.trim(),
    administrationName: administrationName.trim(),
    facilityOwnerManager: form.contactFullName.trim(),
    activity: (form.activitiesDescription.trim() || form.industry).trim(),
    legalCapacity: form.organizationType.trim(),
    city: (form.city || form.addressCity).trim(),
    authorizationLetterUrl: null as string | null,
    phone: toPhone(form.phoneCountryCode, form.phoneNumber),
  }
}

function toProfilePayload(form: ClientRegistrationForm, forSubmit: boolean): {
  profile: OrgProfileInput
  address: OrgAddressInput
} {
  const employeeCount = parseEmployeeCount(form.employeeCount)
  const registrationDate = toIsoDate(form.incorporationDate)
  const tradeName = form.tradingName.trim() || form.legalEntityName.trim()
  const district = form.addressState.trim() || form.state.trim() || form.addressCity.trim()
  const buildingNumber = form.addressLine2.trim() || (forSubmit ? '1' : '')

  return {
    profile: {
      organizationName: form.legalEntityName.trim() || undefined,
      tradeName: tradeName || undefined,
      commercialRegisterNumber: form.registrationNumber.trim() || undefined,
      unifiedNumber: form.registrationNumber.trim() || undefined,
      authorizedPersonName: form.contactFullName.trim() || undefined,
      email: form.contactEmail.trim() || undefined,
      phoneCountryCode: toDialCode(form.phoneCountryCode),
      phoneNumber: digitsOnly(form.phoneNumber) || undefined,
      organizationStatus: 'ACTIVE',
      registrationDate,
      employeeCount,
      industries: form.industry ? [form.industry] : undefined,
      companySummary: form.activitiesDescription.trim() || undefined,
      allProductionLinesActive: true,
      nationalAddress: { hasNationalAddress: false },
    },
    address: {
      country: form.addressCountry || form.country || undefined,
      city: form.addressCity.trim() || form.city.trim() || undefined,
      district: district || undefined,
      street: form.addressLine1.trim() || undefined,
      buildingNumber: buildingNumber || undefined,
      postalCode: form.postalCode.trim() || undefined,
      additionalNumber: form.landmark.trim() || undefined,
    },
  }
}

export function createCabClientAccount(form: ClientRegistrationForm): Promise<CreateClientResponse> {
  return apiRequestWithAuth<CreateClientResponse>('/cab-clients', requireToken(), {
    method: 'POST',
    body: JSON.stringify(toCreatePayload(form)),
  })
}

export function listCabClients(params: {
  page?: number
  limit?: number
  search?: string
  status?: CabClientStatus
} = {}): Promise<CabClientList> {
  const page = params.page ?? 1
  const limit = params.limit ?? 10

  return apiRequestWithAuth<CabAuditClientListItem[]>('/cab-clients', requireToken()).then((clients) => {
    const search = params.search?.trim().toLowerCase() ?? ''
    const filtered = clients.filter((client) => {
      if (params.status) {
        const status = (client.profileStatus || client.status || '').toUpperCase()
        if (params.status === 'REGISTERED' && status !== 'COMPLETED') return false
        if (params.status === 'DRAFT' && status !== 'DRAFT') return false
        if (params.status === 'INACTIVE' && client.status !== 'INACTIVE') return false
      }
      if (!search) return true
      const haystack = [
        client.name,
        client.tradeName,
        client.city,
        client.address,
        client.owner?.fullName,
        client.owner?.email,
        client.owner?.phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(search)
    })

    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const start = (page - 1) * limit
    return {
      items: filtered.slice(start, start + limit),
      total,
      page,
      limit,
      totalPages,
    }
  })
}

export function getCabClientProfile(clientId: string): Promise<OrganizationProfileData> {
  return apiRequestWithAuth<OrganizationProfileData>(
    `/cab-clients/${clientId}/profile`,
    requireToken()
  )
}

export async function getCabClient(clientId: string): Promise<CabClient> {
  const profile = await getCabClientProfile(clientId)
  return profileToClient(clientId, profile)
}

export function saveCabClientProfile(
  clientId: string,
  form: ClientRegistrationForm,
  forSubmit = false
): Promise<SaveProfileResult> {
  return apiRequestWithAuth<SaveProfileResult>(`/cab-clients/${clientId}/profile`, requireToken(), {
    method: 'POST',
    body: JSON.stringify(toProfilePayload(form, forSubmit)),
  })
}

export function uploadCabClientDocument(
  clientId: string,
  file: File,
  documentType: OrgDocument['documentType'] = 'COMMERCIAL_REGISTER'
): Promise<OrgDocument> {
  const data = new FormData()
  data.set('file', file)
  data.set('documentType', documentType)
  return apiRequestWithAuth<OrgDocument>(`/cab-clients/${clientId}/documents`, requireToken(), {
    method: 'POST',
    body: data,
  })
}

export function submitCabClientProfile(clientId: string): Promise<{ message: string }> {
  return apiRequestWithAuth<{ message: string }>(`/cab-clients/${clientId}/submit`, requireToken(), {
    method: 'POST',
  })
}

export async function createCabClient(
  form: ClientRegistrationForm,
  status: 'DRAFT' | 'REGISTERED',
  supportingDocument?: File | null
): Promise<SavedClientResponse> {
  const created = await createCabClientAccount(form)
  return persistClient(created.organizationId, form, status, supportingDocument, created.message)
}

export async function updateCabClient(
  clientId: string,
  form: ClientRegistrationForm,
  status: 'DRAFT' | 'REGISTERED',
  supportingDocument?: File | null,
  _clearSupportingDocument = false
): Promise<SavedClientResponse> {
  return persistClient(clientId, form, status, supportingDocument)
}

async function persistClient(
  clientId: string,
  form: ClientRegistrationForm,
  status: 'DRAFT' | 'REGISTERED',
  supportingDocument?: File | null,
  createMessage?: string
): Promise<SavedClientResponse> {
  const forSubmit = status === 'REGISTERED'
  await saveCabClientProfile(clientId, form, forSubmit)

  if (supportingDocument) {
    await uploadCabClientDocument(clientId, supportingDocument)
  }

  let message = createMessage ?? 'Client saved successfully.'
  if (forSubmit) {
    const submitted = await submitCabClientProfile(clientId)
    message = submitted.message
  }

  const client = await getCabClient(clientId)
  return { message, client }
}

export function deleteCabClient(clientId: string): Promise<void> {
  return apiRequestWithAuth<void>(`/cab-clients/${clientId}`, requireToken(), {
    method: 'DELETE',
  })
}

export function cabClientToForm(client: CabClient): ClientRegistrationForm {
  return {
    legalEntityName: client.legalEntityName ?? '',
    tradingName: client.tradingName ?? '',
    organizationType: client.organizationType ?? '',
    registrationNumber: client.registrationNumber ?? '',
    incorporationDate: client.incorporationDate ? new Date(client.incorporationDate) : null,
    country: (client.country ?? '') as CountryCode | '',
    state: client.state ?? '',
    city: client.city ?? '',
    addressLine1: client.addressLine1 ?? '',
    addressLine2: client.addressLine2 ?? '',
    landmark: client.landmark ?? '',
    postalCode: client.postalCode ?? '',
    addressCountry: (client.addressCountry ?? '') as CountryCode | '',
    addressState: client.addressState ?? '',
    addressCity: client.addressCity ?? '',
    contactFullName: client.contactFullName ?? '',
    contactDesignation: client.contactDesignation ?? '',
    contactEmail: client.contactEmail ?? '',
    phoneCountryCode: (client.phoneCountryCode ?? 'EG') as CountryCode,
    phoneNumber: client.phoneNumber ?? '',
    mobileCountryCode: (client.mobileCountryCode ?? 'EG') as CountryCode,
    mobileNumber: client.mobileNumber ?? '',
    industry: client.industry ?? '',
    employeeCount: client.employeeCount ?? '',
    annualTurnover: client.annualTurnover ?? '',
    website: client.website ?? '',
    activitiesDescription: client.activitiesDescription ?? '',
  }
}

export const ORGANIZATION_TYPE_OPTIONS: string[] = [
  'Private Limited Company',
  'Public Limited Company',
  'Sole Proprietorship',
  'Partnership',
  'Government Entity',
  'Non-Profit Organization',
  'Limited Liability Company',
]

export const INDUSTRY_OPTIONS: string[] = [
  'Manufacturing',
  'Construction',
  'Healthcare',
  'Food & Beverage',
  'Oil & Gas',
  'Textiles',
  'Retail & Trade',
  'Information Technology',
  'Logistics & Transportation',
]

export const EMPLOYEE_COUNT_OPTIONS: string[] = ['1 - 10', '11 - 50', '51 - 100', '101 - 500', '501 - 1000', '1000+']

export const ANNUAL_TURNOVER_OPTIONS: string[] = [
  'Less than 1,000,000',
  '1,000,000 - 10,000,000',
  '10,000,001 - 100,000,000',
  '100,000,001 - 500,000,000',
  'More than 500,000,000',
]
