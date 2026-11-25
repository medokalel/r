import type { AuditPlan } from '@/lib/api/cabAuditPlanningApi'
import { getPlanConfirmation, type ClientPlanConfirmation } from '@/lib/api/clientAuditsApi'

export const AUDITS_PAGE_SIZE = 10

export interface ClientAuditFilters {
  search: string
  specification: string
  stage: string
  confirmation: 'all' | ClientPlanConfirmation
  from: Date | null
  to: Date | null
}

export const EMPTY_AUDIT_FILTERS: ClientAuditFilters = {
  search: '',
  specification: 'all',
  stage: 'all',
  confirmation: 'all',
  from: null,
  to: null,
}

function dayStart(value: string): number {
  return new Date(`${value}T00:00:00`).getTime()
}

/** Plans that match the filters. A date range keeps every plan whose audit dates overlap it. */
export function filterClientAudits(plans: AuditPlan[], filters: ClientAuditFilters): AuditPlan[] {
  const q = filters.search.trim().toLowerCase()
  const bounds = [filters.from, filters.to].filter((d): d is Date => Boolean(d))
  const rangeStart = bounds.length ? Math.min(...bounds.map((d) => new Date(d).setHours(0, 0, 0, 0))) : null
  const rangeEnd = bounds.length === 2 ? Math.max(...bounds.map((d) => new Date(d).setHours(0, 0, 0, 0))) : null

  return plans.filter((plan) => {
    if (filters.specification !== 'all' && !plan.standards.includes(filters.specification)) return false
    if (filters.stage !== 'all' && plan.stage !== filters.stage) return false
    if (filters.confirmation !== 'all' && getPlanConfirmation(plan) !== filters.confirmation) return false
    if (rangeStart !== null) {
      const start = dayStart(plan.proposedStartDate)
      const end = dayStart(plan.proposedEndDate)
      if (rangeEnd === null) {
        if (end < rangeStart) return false
      } else if (end < rangeStart || start > rangeEnd) {
        return false
      }
    }
    if (!q) return true
    return (
      plan.planNumber.toLowerCase().includes(q) ||
      plan.stage.toLowerCase().includes(q) ||
      plan.siteName.toLowerCase().includes(q) ||
      plan.leadAuditor.toLowerCase().includes(q) ||
      plan.standards.some((standard) => standard.toLowerCase().includes(q))
    )
  })
}

export function paginateAudits<T>(items: T[], page: number, pageSize: number = AUDITS_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(Math.max(1, page), totalPages)
  return { page: current, totalPages, items: items.slice((current - 1) * pageSize, current * pageSize) }
}

export function auditSpecifications(plans: AuditPlan[]): string[] {
  return [...new Set(plans.flatMap((plan) => plan.standards))].sort()
}

export function auditStages(plans: AuditPlan[]): string[] {
  return [...new Set(plans.map((plan) => plan.stage))]
}
