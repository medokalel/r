/** Central route paths — keep in sync across navigation, redirects, and guards. */
export const ROUTES = {
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  privacyPolicy: '/privacy-policy',
  dashboard: '/dashboard',
  dashboardTasks: '/dashboard/tasks',
  certificationRequestNew: '/certification-request/new',
  certificationRequests: '/certification-requests',
  companyProfile: '/settings/company-profile',
  users: '/users',
  wallet: '/wallet',
  periodicVisits: '/periodic-visits',
  invoices: '/invoices',
} as const

/** Post-login landing page for authenticated users. */
export const AUTHENTICATED_HOME = ROUTES.dashboard

/** Previous dashboard URL — redirect only, do not link to this in new code. */
export const LEGACY_DASHBOARD_PATH = '/certification-request'

export function isDashboardNavActive(pathname: string): boolean {
  return pathname === ROUTES.dashboard || pathname.startsWith(`${ROUTES.dashboard}/`)
}

export function certificationRequestFormPath(id: string, view: 'feedback' | 'status'): string {
  return `${ROUTES.certificationRequestNew}?id=${id}&view=${view}`
}
