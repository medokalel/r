import { authorizedRequest } from '@/lib/api/authorizedClient'

export type PeriodicVisitProcedure = 'PERIODIC' | 'PERIODIC_AND_EXPANDING'

export interface PeriodicVisit {
  id: string
  certificateNumber: string
  specificationName: string
  economicSectors: string[]
  visitingDate: string
  procedure: PeriodicVisitProcedure
  createdAt: string
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ListPeriodicVisitsParams {
  page?: number
  limit?: number
  search?: string
  procedure?: PeriodicVisitProcedure
  specification?: string
}

export function listPeriodicVisits(
  params: ListPeriodicVisitsParams = {}
): Promise<PaginatedResult<PeriodicVisit>> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.procedure) query.set('procedure', params.procedure)
  if (params.specification?.trim()) query.set('specification', params.specification.trim())

  const suffix = query.toString() ? `?${query.toString()}` : ''
  return authorizedRequest<PaginatedResult<PeriodicVisit>>(`/billing/periodic-visits${suffix}`)
}

export function formatVisitDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  }).format(date)
}

const RED_SECTOR_CODES = new Set(['07', '14', '12'])

export function sectorBadgeVariant(code: string): 'red' | 'green' {
  return RED_SECTOR_CODES.has(code) ? 'red' : 'green'
}
