import { authorizedRequest } from '@/lib/api/authorizedClient'

export const QUOTATION_CURRENCIES = ['SAR', 'USD', 'EGP', 'EUR', 'GBP'] as const

export type QuotationStatus = 'CREATED' | 'DRAFT' | 'ISSUED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'

export interface CabPricingConfig {
  id: string
  standardId: string | null
  /** Decimal strings, e.g. taxRate "0.1500" = 15%. */
  dailyRate: string
  taxRate: string
  currency: string
  isActive: boolean
  standard: { id: string; code: string; name: string } | null
}

export interface QuotationItem {
  name: string
  cost: number
}

export interface QuotationEvent {
  id: string
  standardCode: string
  auditEventType: 'STAGE_1' | 'STAGE_2' | 'SURVEILLANCE_1' | 'SURVEILLANCE_2' | 'RECERTIFICATION'
  sequenceOrder: number
  auditDays: string
  dailyRate: string
  auditFee: string
  manualOverride: boolean
  policyVerificationStatus: 'VERIFIED' | 'NEEDS_REVIEW' | 'BLOCKED'
}

export interface Quotation {
  id: string
  applicationId: string
  quotationNumber: string | null
  status: QuotationStatus
  cabName: string | null
  standardCodesUsed: string[]
  employeeCountUsed: number
  currency: string
  dailyRate: string
  initialAuditDays: string | null
  initialAuditFee: string | null
  totalAuditDays: string
  totalAuditFee: string
  travelExpenses: string
  additionalItems: QuotationItem[]
  additionalItemsTotal: string
  startDate: string
  offerEndDate: string | null
  taxRate: string
  taxAmount: string
  totalAmount: string
  isProvisional: boolean
  provisionalDisclaimer: string | null
  events: QuotationEvent[]
  createdAt: string
  updatedAt: string
}

export interface QuotationList {
  items: Quotation[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateQuotationPayload {
  travelExpenses: number
  additionalItems?: QuotationItem[]
  complexities?: Record<string, string>
  fsmsInputs?: { foodCategory: string; studies: number; fteEmployees?: number | null }
  offerEndDate?: string | null
  notes?: string | null
  internalNotes?: string | null
}

export interface UpdateQuotationPayload {
  travelExpenses?: number
  taxRate?: number
  additionalItems?: QuotationItem[]
  offerEndDate?: string | null
  notes?: string | null
  internalNotes?: string | null
}

const json = (body: unknown) => ({ method: 'POST', body: JSON.stringify(body) })
const quotationPath = (id: string) => `/cab/quotations/${encodeURIComponent(id)}`

// --- Pricing configuration (daily rate / tax rate / currency) ---

export function listPricingConfigs(): Promise<CabPricingConfig[]> {
  return authorizedRequest('/cab/pricing-config')
}

/** Global default when standardId is omitted. taxRate is a decimal (0.15 = 15%). */
export function upsertPricingConfig(payload: {
  dailyRate: number
  currency: string
  taxRate: number
  standardId?: string | null
}): Promise<CabPricingConfig> {
  return authorizedRequest('/cab/pricing-config', json(payload))
}

export function deactivatePricingConfig(configId: string): Promise<{ message: string }> {
  return authorizedRequest(`/cab/pricing-config/${encodeURIComponent(configId)}`, { method: 'DELETE' })
}

// --- Quotations ---

export function createQuotation(applicationId: string, payload: CreateQuotationPayload): Promise<Quotation> {
  return authorizedRequest(
    `/cab/certification-applications/${encodeURIComponent(applicationId)}/quotation`,
    json(payload),
  )
}

export function listQuotations(
  params: { applicationId?: string; status?: QuotationStatus; page?: number; limit?: number } = {},
): Promise<QuotationList> {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) if (value !== undefined) query.set(key, String(value))
  const suffix = query.toString()
  return authorizedRequest(`/cab/quotations${suffix ? `?${suffix}` : ''}`)
}

export function getQuotation(quotationId: string): Promise<Quotation> {
  return authorizedRequest(quotationPath(quotationId))
}

export function updateQuotation(quotationId: string, payload: UpdateQuotationPayload): Promise<Quotation> {
  return authorizedRequest(quotationPath(quotationId), { method: 'PATCH', body: JSON.stringify(payload) })
}

export function overrideEventDays(quotationId: string, eventId: string, appliedDays: number): Promise<Quotation> {
  return authorizedRequest(`${quotationPath(quotationId)}/events/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ appliedDays }),
  })
}

export type QuotationTransition = 'issue' | 'accept' | 'reject' | 'cancel'

/** issue: CREATED→ISSUED · accept/reject: ISSUED→ACCEPTED/REJECTED · cancel: CREATED|ISSUED→CANCELLED. */
export function transitionQuotation(
  quotationId: string,
  action: QuotationTransition,
  note?: string,
): Promise<Quotation> {
  return authorizedRequest(`${quotationPath(quotationId)}/${action}`, json({ note: note?.trim() || null }))
}
