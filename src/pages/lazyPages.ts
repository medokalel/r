import { lazy, type ComponentType } from 'react'

function lazyNamed(importer: () => Promise<Record<string, unknown>>, exportName: string) {
  return lazy(async () => {
    const mod = await importer()
    return { default: mod[exportName] as ComponentType }
  })
}

export const LoginPage = lazyNamed(() => import('@/pages/LoginPage'), 'LoginPage')
export const RegisterPage = lazyNamed(() => import('@/pages/RegisterPage'), 'RegisterPage')
export const ForgotPasswordPage = lazyNamed(() => import('@/pages/ForgotPasswordPage'), 'ForgotPasswordPage')
export const PrivacyPolicyPage = lazyNamed(() => import('@/pages/PrivacyPolicyPage'), 'PrivacyPolicyPage')
export const WorkspacePage = lazyNamed(() => import('@/pages/WorkspacePage'), 'WorkspacePage')
export const CabDashboardPage = lazyNamed(() => import('@/pages/CabDashboardPage'), 'CabDashboardPage')
export const CabApplicationRegisterPage = lazyNamed(
  () => import('@/pages/CabApplicationRegisterPage'),
  'CabApplicationRegisterPage',
)
export const CabApplicationSubmissionPage = lazyNamed(
  () => import('@/pages/CabApplicationSubmissionPage'),
  'CabApplicationSubmissionPage',
)
export const CabCompanyProfilePage = lazyNamed(() => import('@/pages/CabCompanyProfilePage'), 'CabCompanyProfilePage')
export const AbDashboardPage = lazyNamed(() => import('@/pages/AbDashboardPage'), 'AbDashboardPage')
export const OnboardingPage = lazyNamed(() => import('@/pages/OnboardingPage'), 'OnboardingPage')
export const CabOnboardingPage = lazyNamed(() => import('@/pages/CabOnboardingPage'), 'CabOnboardingPage')
export const AbOnboardingPage = lazyNamed(() => import('@/pages/AbOnboardingPage'), 'AbOnboardingPage')
export const AuditeeOnboardingPage = lazyNamed(() => import('@/pages/AuditeeOnboardingPage'), 'AuditeeOnboardingPage')
export const ClientRegistrationPage = lazyNamed(() => import('@/pages/ClientRegistrationPage'), 'ClientRegistrationPage')
export const CabClientCompanyProfilePage = lazyNamed(
  () => import('@/pages/CabClientCompanyProfilePage'),
  'CabClientCompanyProfilePage',
)
export const CabClientsPage = lazyNamed(() => import('@/pages/CabClientsPage'), 'CabClientsPage')
export const ClientRegisterPage = lazyNamed(() => import('@/pages/ClientRegisterPage'), 'ClientRegisterPage')
export const CabClientDetailsPage = lazyNamed(() => import('@/pages/CabClientDetailsPage'), 'CabClientDetailsPage')
export const ApplicationDraftPage = lazyNamed(() => import('@/pages/ApplicationDraftPage'), 'ApplicationDraftPage')
export const AddSitePage = lazyNamed(() => import('@/pages/AddSitePage'), 'AddSitePage')
export const ApplyMultiSiteRulePage = lazyNamed(() => import('@/pages/ApplyMultiSiteRulePage'), 'ApplyMultiSiteRulePage')
export const CabMultiSiteRulePreviewPage = lazyNamed(
  () => import('@/pages/CabMultiSiteRulePreviewPage'),
  'CabMultiSiteRulePreviewPage',
)
export const CabApplicationReceiptPage = lazyNamed(
  () => import('@/pages/CabApplicationReceiptPage'),
  'CabApplicationReceiptPage',
)
export const CabApplicationReviewPage = lazyNamed(
  () => import('@/pages/CabApplicationReviewPage'),
  'CabApplicationReviewPage',
)
export const CabContactsListPage = lazyNamed(() => import('@/pages/CabContactsListPage'), 'CabContactsListPage')
export const CabAddContactPage = lazyNamed(() => import('@/pages/CabAddContactPage'), 'CabAddContactPage')
export const CabApplicationInformationRequiredPage = lazyNamed(
  () => import('@/pages/CabApplicationInformationRequiredPage'),
  'CabApplicationInformationRequiredPage',
)
export const CabApplicationTechnicalFeasibilityPage = lazyNamed(
  () => import('@/pages/CabApplicationTechnicalFeasibilityPage'),
  'CabApplicationTechnicalFeasibilityPage',
)
export const CabApplicationQuotationPage = lazyNamed(
  () => import('@/pages/CabApplicationQuotationPage'),
  'CabApplicationQuotationPage',
)
export const CabQuotationApprovalPage = lazyNamed(
  () => import('@/pages/CabQuotationApprovalPage'),
  'CabQuotationApprovalPage',
)
export const CabOfferRegisterPage = lazyNamed(() => import('@/pages/CabOfferRegisterPage'), 'CabOfferRegisterPage')
export const CabCreateOfferPage = lazyNamed(() => import('@/pages/CabCreateOfferPage'), 'CabCreateOfferPage')
export const CabInvoiceRegisterPage = lazyNamed(() => import('@/pages/CabInvoiceRegisterPage'), 'CabInvoiceRegisterPage')
export const CabInvoiceDetailsPage = lazyNamed(() => import('@/pages/CabInvoiceDetailsPage'), 'CabInvoiceDetailsPage')
export const CabAuditSchedulePage = lazyNamed(() => import('@/pages/CabAuditSchedulePage'), 'CabAuditSchedulePage')
export const CabBuildAuditPlanPage = lazyNamed(() => import('@/pages/CabBuildAuditPlanPage'), 'CabBuildAuditPlanPage')
export const CabAuditReportingPage = lazyNamed(() => import('@/pages/CabAuditReportingPage'), 'CabAuditReportingPage')
export const CabAddFindingPage = lazyNamed(() => import('@/pages/CabAddFindingPage'), 'CabAddFindingPage')
export const CabDecisionQueuePage = lazyNamed(() => import('@/pages/CabDecisionQueuePage'), 'CabDecisionQueuePage')
export const CabDecisionDetailsPage = lazyNamed(() => import('@/pages/CabDecisionDetailsPage'), 'CabDecisionDetailsPage')
export const CabPersonnelRegisterPage = lazyNamed(
  () => import('@/pages/CabPersonnelRegisterPage'),
  'CabPersonnelRegisterPage',
)
export const CabCompetenceEvaluationPage = lazyNamed(
  () => import('@/pages/CabCompetenceEvaluationPage'),
  'CabCompetenceEvaluationPage',
)
export const PortalHomePage = lazyNamed(() => import('@/pages/portal/PortalHomePage'), 'PortalHomePage')
export const PortalCompanyProfilePage = lazyNamed(
  () => import('@/pages/portal/PortalCompanyProfilePage'),
  'PortalCompanyProfilePage',
)
export const CabCertificationCyclesPage = lazyNamed(
  () => import('@/pages/CabCertificationCyclesPage'),
  'CabCertificationCyclesPage',
)
export const CabManageCertificationCyclePage = lazyNamed(
  () => import('@/pages/CabManageCertificationCyclePage'),
  'CabManageCertificationCyclePage',
)
export const CabNonconformitiesPage = lazyNamed(() => import('@/pages/CabNonconformitiesPage'), 'CabNonconformitiesPage')
export const CabNonconformityResponsePage = lazyNamed(
  () => import('@/pages/CabNonconformityResponsePage'),
  'CabNonconformityResponsePage',
)
export const CabCertificateRegisterPage = lazyNamed(
  () => import('@/pages/CabCertificateRegisterPage'),
  'CabCertificateRegisterPage',
)
export const CabPrepareCertificatePage = lazyNamed(
  () => import('@/pages/CabPrepareCertificatePage'),
  'CabPrepareCertificatePage',
)
export const CertificationRequestFormPage = lazyNamed(
  () => import('@/pages/CertificationRequestFormPage'),
  'CertificationRequestFormPage',
)
export const CertificationRequestsPage = lazyNamed(
  () => import('@/pages/CertificationRequestsPage'),
  'CertificationRequestsPage',
)
export const CompanyProfilePage = lazyNamed(() => import('@/pages/CompanyProfilePage'), 'CompanyProfilePage')
export const DashboardPage = lazyNamed(() => import('@/pages/DashboardPage'), 'DashboardPage')
export const DashboardTasksPage = lazyNamed(() => import('@/pages/DashboardTasksPage'), 'DashboardTasksPage')
export const UsersPage = lazyNamed(() => import('@/pages/UsersPage'), 'UsersPage')
export const DigitalWalletPage = lazyNamed(() => import('@/pages/DigitalWalletPage'), 'DigitalWalletPage')
export const PeriodicVisitsPage = lazyNamed(() => import('@/pages/PeriodicVisitsPage'), 'PeriodicVisitsPage')
export const InvoicesPage = lazyNamed(() => import('@/pages/InvoicesPage'), 'InvoicesPage')

export const CabPersonnelProfilePage = lazyNamed(() => import('@/pages/CabPersonnelProfilePage'), 'CabPersonnelProfilePage')
