import { apiRequestWithAuth } from '@/lib/api/client'
import { getAuthToken } from '@/lib/authStorage'
import type { ClientRegistrationForm } from '@/lib/clientRegistrationForm'
import { normalizeWebsiteUrl } from '@/lib/validators'
import type { CountryCode } from '@/lib/countries'

export type CabClientStatus = 'DRAFT' | 'REGISTERED' | 'INACTIVE'

export interface CabClient {
  id: string
  cabId: string
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
  createdAt: string
  updatedAt: string
  applicationNumber?: string | null
  assignedToName?: string | null
}

export interface CabClientList {
  items: CabClient[]
  total: number
  page: number
  limit: number
  totalPages: number
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

function toClientFormData(
  form: ClientRegistrationForm,
  status: 'DRAFT' | 'REGISTERED',
  supportingDocument?: File | null,
  clearSupportingDocument = false
): FormData {
  const data = new FormData()

  for (const [key, value] of Object.entries(form)) {
    if (key === 'incorporationDate') {
      data.set(key, value instanceof Date ? value.toISOString() : '')
      continue
    }
    if (key === 'website') {
      data.set(key, normalizeWebsiteUrl(String(value ?? '')))
      continue
    }
    data.set(key, String(value ?? ''))
  }

  data.set('status', status)
  if (supportingDocument) data.set('supportingDocument', supportingDocument)
  if (clearSupportingDocument) data.set('clearSupportingDocument', 'true')
  return data
}

export function createCabClient(
  form: ClientRegistrationForm,
  status: 'DRAFT' | 'REGISTERED',
  supportingDocument?: File | null
): Promise<SavedClientResponse> {
  return apiRequestWithAuth<SavedClientResponse>('/cab-clients', requireToken(), {
    method: 'POST',
    body: toClientFormData(form, status, supportingDocument),
  })
}

export function updateCabClient(
  clientId: string,
  form: ClientRegistrationForm,
  status: 'DRAFT' | 'REGISTERED',
  supportingDocument?: File | null,
  clearSupportingDocument = false
): Promise<SavedClientResponse> {
  return apiRequestWithAuth<SavedClientResponse>(`/cab-clients/${clientId}`, requireToken(), {
    method: 'PATCH',
    body: toClientFormData(form, status, supportingDocument, clearSupportingDocument),
  })
}

export function listCabClients(params: {
  page?: number
  limit?: number
  search?: string
  status?: CabClientStatus
} = {}): Promise<CabClientList> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.search) query.set('search', params.search)
  if (params.status) query.set('status', params.status)
  const suffix = query.size ? `?${query.toString()}` : ''
  return apiRequestWithAuth<CabClientList>(`/cab-clients${suffix}`, requireToken())
}

export function getCabClient(clientId: string): Promise<CabClient> {
  return apiRequestWithAuth<{ client: CabClient }>(
    `/cab-clients/${clientId}`,
    requireToken()
  ).then((result) => result.client)
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

// TODO: replace with a real lookup once the backend defines organization types
export const ORGANIZATION_TYPE_OPTIONS: string[] = [
  'Private Limited Company',
  'Public Limited Company',
  'Sole Proprietorship',
  'Partnership',
  'Government Entity',
  'Non-Profit Organization',
]

// TODO: replace with a real lookup once the backend defines the industry/sector list
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

// TODO: replace with a real lookup once the backend defines employee-count bands
export const EMPLOYEE_COUNT_OPTIONS: string[] = ['1 - 10', '11 - 50', '51 - 100', '101 - 500', '501 - 1000', '1000+']

// TODO: replace with a real lookup once the backend defines turnover bands (currency may vary by country)
export const ANNUAL_TURNOVER_OPTIONS: string[] = [
  'Less than 1,000,000',
  '1,000,000 - 10,000,000',
  '10,000,001 - 100,000,000',
  '100,000,001 - 500,000,000',
  'More than 500,000,000',
]