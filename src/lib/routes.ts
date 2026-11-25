/** Central route paths — keep in sync across navigation, redirects, and guards. */
export const ROUTES = {
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  privacyPolicy: "/privacy-policy",
  workspace: "/workspace",
  dashboard: "/dashboard",
  dashboardTasks: "/dashboard/tasks",
  certificationRequestNew: "/certification-request/new",
  certificationRequests: "/certification-requests",
  companyProfile: "/settings/company-profile",
  users: "/users",
  wallet: "/wallet",
  periodicVisits: "/periodic-visits",
  invoices: "/invoices",
  audits: "/audits",
  auditPlanDetails: "/audits/:planId",
  quotations: "/offers",
  quotationDetails: "/offers/:quotationId",
  legacyQuotations: "/quotations",
  legacyQuotationDetails: "/quotations/:quotationId",
  cabDashboard: "/cab/dashboard",
  cabAuditClients: "/cab/audit-clients",
  cabApplicationRegister: "/cab/applications",
  cabApplicationReview: "/cab/applications/review",
  cabApplicationSubmission: "/cab/applications/submission",
  cabCompanyProfile: "/cab/company-profile",
  cabTravelPolicy: "/cab/settings/travel-policy",
  cabSso: "/cab/settings/sso",
  cabAuditChecklists: "/cab/audit-checklists",
  cabDataMigration: "/cab/data-migration",
  cabWorkspace: "/cab/workspace",
  cabApplicationReviewQueue: "/cab/applications/review-queue",
  cabContacts: "/cab/contacts",
  cabContactNew: "/cab/contacts/new",
  cabOffers: "/cab/offers",
  cabOfferNew: "/cab/offers/new",
  cabInvoices: "/cab/invoices",
  cabInvoiceDetails: "/cab/invoices/:invoiceId",
  cabAuditPlanning: "/cab/audit-planning",
  cabAuditSchedule: "/cab/audit-planning/schedule",
  cabBuildAuditPlan: "/cab/audit-planning/build/:planId",
  cabAuditPlanNew: "/cab/audit-planning/new",
  cabAuditExecutionList: "/cab/audit-execution",
  cabAuditExecution: "/cab/audit-planning/:planId/execution",
  cabAuditReporting: "/cab/audit-reporting",
  cabAuditWorkspace: "/cab/audit-reporting/workspace",
  cabAddFinding: "/cab/audit-reporting/findings/new",
  abDashboard: "/ab/dashboard",
  cabOnboarding: "/cab/onboarding",
  abOnboarding: "/ab/onboarding",
  auditeeOnboarding: "/auditee/onboarding",
  onboarding: "/onboarding",
  cabApplicationInformationRequired: "/cab/applications/information-required",
  cabApplicationTechnicalFeasibility: "/cab/applications/technical-feasibility",
  cabApplicationQuotation: "/cab/applications/quotation",
  cabQuotationApproval: "/cab/quotations/approval",
  cabDecisions: "/cab/decisions",
  cabDecisionDetails: "/cab/decisions/:decisionId",
  cabCompetence: "/cab/competence",
  cabPersonnelNew: "/cab/competence/persons/new",
  cabPersonnelEdit: "/cab/competence/persons/:id/edit",
  cabCompetenceEvaluation: "/cab/competence/persons/:id/evaluation",
  portal: "/portal",
  portalHome: "/portal/home",
  portalCompanyProfile: "/portal/company-profile",
  portalApplications: "/portal/applications",
  portalOffers: "/portal/offers",
  portalInvoices: "/portal/invoices",
  portalAudits: "/portal/audits",
  portalFindings: "/portal/findings",
  portalCertificates: "/portal/certificates",
  cabCertificationCycles: "/cab/certification",
  cabManageCertificationCycle: "/cab/certification/:cycleId",
  cabNonconformities: "/cab/nonconformities",
  cabNonconformityResponse: "/cab/nonconformities/:ncId/response",
  cabCertificates: "/cab/certificates",
  cabPrepareCertificate: "/cab/certificates/:certificateId/prepare",
  cabSalesHub: "/cab/sales-hub",
  cabSalesHubNew: "/cab/sales-hub/new",
  cabSalesHubEdit: "/cab/sales-hub/:leadId/edit",
  cabAgreementTerms: "/cab/agreement-terms",
  cabCertificationAgreements: "/cab/certification-agreements",
  cabCertificationAgreementDetails: "/cab/certification-agreements/:agreementId",
} as const;

export function clientAuditPlanPath(planId: string): string {
  return `/audits/${encodeURIComponent(planId)}`;
}

export function clientQuotationPath(quotationId: string): string {
  return `/offers/${encodeURIComponent(quotationId)}`;
}

function withClientQuery(path: string, clientId?: string): string {
  if (!clientId) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}clientId=${encodeURIComponent(clientId)}`;
}

export function cabApplicationInformationRequiredPath(
  applicationId?: string,
  clientId?: string,
): string {
  const base = applicationId
    ? `/cab/applications/${encodeURIComponent(applicationId)}/information-required`
    : ROUTES.cabApplicationInformationRequired;
  return withClientQuery(base, clientId);
}

export function cabApplicationTechnicalFeasibilityPath(
  applicationId?: string,
  clientId?: string,
): string {
  const base = applicationId
    ? `/cab/applications/${encodeURIComponent(applicationId)}/technical-feasibility`
    : ROUTES.cabApplicationTechnicalFeasibility;
  return withClientQuery(base, clientId);
}

export function cabApplicationQuotationPath(
  applicationId?: string,
  clientId?: string,
): string {
  const base = applicationId
    ? `/cab/applications/${encodeURIComponent(applicationId)}/quotation`
    : ROUTES.cabApplicationQuotation;
  return withClientQuery(base, clientId);
}

export function cabApplicationSubmissionPath(
  clientId: string,
  applicationId?: string,
  options?: { fill?: boolean },
): string {
  const params = new URLSearchParams({ clientId });
  if (applicationId) params.set("id", applicationId);
  if (options?.fill) params.set("fill", "1");
  return `${ROUTES.cabApplicationSubmission}?${params.toString()}`;
}

export function cabApplicationReviewPath(
  applicationId: string,
  clientId?: string,
): string {
  const base = `/cab/applications/${encodeURIComponent(applicationId)}/review`;
  return clientId
    ? `${base}?clientId=${encodeURIComponent(clientId)}`
    : base;
}

export function cabApplicationReceiptPath(
  applicationId: string,
  clientId?: string,
): string {
  const base = `/cab/applications/${encodeURIComponent(applicationId)}/receipt`;
  return clientId
    ? `${base}?clientId=${encodeURIComponent(clientId)}`
    : base;
}

export function cabDecisionPath(decisionId?: string): string {
  return decisionId ? `/cab/decisions/${decisionId}` : ROUTES.cabDecisions;
}

export function cabNonconformityResponsePath(ncId: string): string {
  return `/cab/nonconformities/${encodeURIComponent(ncId)}/response`;
}

export function cabManageCertificationCyclePath(cycleId: string): string {
  return `/cab/certification/${encodeURIComponent(cycleId)}`;
}

export function cabPrepareCertificatePath(certificateId: string): string {
  return `/cab/certificates/${encodeURIComponent(certificateId)}/prepare`;
}

/** CAB breadcrumb / Home link destination (workspace hub). */
export const CAB_HOME = ROUTES.workspace;

/** Default post-login landing page for non-CAB authenticated users. */
export const AUTHENTICATED_HOME = ROUTES.dashboard;

/** Previous dashboard URL — redirect only, do not link to this in new code. */
export const LEGACY_DASHBOARD_PATH = "/certification-request";

export function isDashboardNavActive(pathname: string): boolean {
  return (
    pathname === ROUTES.dashboard || pathname.startsWith(`${ROUTES.dashboard}/`)
  );
}

export function certificationRequestFormPath(
  id: string,
  view: "feedback" | "status",
): string {
  return `${ROUTES.certificationRequestNew}?id=${id}&view=${view}`;
}
export function cabSalesHubEditPath(leadId: string): string {
  return `/cab/sales-hub/${encodeURIComponent(leadId)}/edit`;
}
export function cabCertificationAgreementDetailsPath(agreementId: string): string {
  return `/cab/certification-agreements/${encodeURIComponent(agreementId)}`;
}
export function cabBuildAuditPlanPath(planId: string, options?: { tab?: 'agenda' }): string {
  const base = `/cab/audit-planning/build/${encodeURIComponent(planId)}`
  return options?.tab ? `${base}?tab=${options.tab}` : base
}
export function cabAuditExecutionPath(planId?: string): string {
  return planId
    ? `/cab/audit-planning/${encodeURIComponent(planId)}/execution`
    : "/cab/audit-planning/AUD-0310/execution";
}
