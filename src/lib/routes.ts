/** Central route paths — keep in sync across navigation, redirects, and guards. */
export const ROUTES = {
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  privacyPolicy: '/privacy-policy',
  workspace: '/workspace',
  dashboard: '/dashboard',
  dashboardTasks: '/dashboard/tasks',
  certificationRequestNew: '/certification-request/new',
  certificationRequests: '/certification-requests',
  companyProfile: '/settings/company-profile',
  users: '/users',
  wallet: '/wallet',
  periodicVisits: '/periodic-visits',
  invoices: '/invoices',
  cabDashboard: '/cab/dashboard',
  cabAuditClients: '/cab/audit-clients',
  cabApplicationRegister: '/cab/applications',
  cabCompanyProfile: '/cab/company-profile',
  cabWorkspace: '/cab/workspace',
  cabApplicationReviewQueue: '/cab/applications/review-queue',
  cabContacts: '/cab/contacts',
  cabContactNew: '/cab/contacts/new',
  cabOffers: '/cab/offers',
  cabOfferNew: '/cab/offers/new',
  cabInvoices: '/cab/invoices',
  cabInvoiceDetails: '/cab/invoices/:invoiceId',
  cabAuditPlanning: '/cab/audit-planning',
  cabAuditSchedule: '/cab/audit-planning/schedule',
  cabBuildAuditPlan: '/cab/audit-planning/build/:planId',
  cabAuditPlanNew: '/cab/audit-planning/new',
  cabAuditReporting: '/cab/audit-reporting',
  cabAuditWorkspace: '/cab/audit-reporting/workspace',
  cabAddFinding: '/cab/audit-reporting/findings/new',
  abDashboard: '/ab/dashboard',
  cabOnboarding: '/cab/onboarding',
  abOnboarding: '/ab/onboarding',
  auditeeOnboarding: '/auditee/onboarding',
  onboarding: '/onboarding',
  cabApplicationInformationRequired: '/cab/applications/information-required',
  cabApplicationTechnicalFeasibility: '/cab/applications/technical-feasibility',
  cabApplicationQuotation: '/cab/applications/quotation',
  cabQuotationApproval: '/cab/quotations/approval',
} as const

export function cabApplicationInformationRequiredPath(applicationId?: string): string {
  return applicationId
    ? `/cab/applications/${applicationId}/information-required`
    : ROUTES.cabApplicationInformationRequired
}

export function cabApplicationTechnicalFeasibilityPath(applicationId?: string): string {
  return applicationId
    ? `/cab/applications/${applicationId}/technical-feasibility`
    : ROUTES.cabApplicationTechnicalFeasibility
}

export function cabApplicationQuotationPath(applicationId?: string): string {
  return applicationId
    ? `/cab/applications/${applicationId}/quotation`
    : ROUTES.cabApplicationQuotation
}

/** Default post-login landing page for non-CAB authenticated users. */
export const AUTHENTICATED_HOME = ROUTES.dashboard

/** Previous dashboard URL — redirect only, do not link to this in new code. */
export const LEGACY_DASHBOARD_PATH = '/certification-request'

export function isDashboardNavActive(pathname: string): boolean {
  return pathname === ROUTES.dashboard || pathname.startsWith(`${ROUTES.dashboard}/`)
}

export function certificationRequestFormPath(id: string, view: 'feedback' | 'status'): string {
  return `${ROUTES.certificationRequestNew}?id=${id}&view=${view}`
}
