import { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireAuthOrPendingRegistration } from "@/components/auth/RequireAuthOrPendingRegistration";
import { RequireCabOnboarded } from "@/components/auth/RequireCabOnboarded";
import { RequireAbDashboard } from "@/components/auth/RequireAbDashboard";
import { RequireAbOnboarded } from "@/components/auth/RequireAbOnboarded";
import { RedirectAbFromGenericDashboard } from "@/components/auth/RedirectAbFromGenericDashboard";
import { RequireAuditeeOnboarded } from "@/components/auth/RequireAuditeeOnboarded";
import { DirectionProvider } from "@/context/DirectionContext";
import { CertificationRequestFormPage } from "@/pages/CertificationRequestFormPage";
import { CertificationRequestsPage } from "@/pages/CertificationRequestsPage";
import { CompanyProfilePage } from "@/pages/CompanyProfilePage";
import { DashboardPage } from "@/pages/DashboardPage";
import { DashboardTasksPage } from "@/pages/DashboardTasksPage";
import { UsersPage } from "@/pages/UsersPage";
import { DigitalWalletPage } from "@/pages/DigitalWalletPage";
import { PeriodicVisitsPage } from "@/pages/PeriodicVisitsPage";
import { InvoicesPage } from "@/pages/InvoicesPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { PrivacyPolicyPage } from "@/pages/PrivacyPolicyPage";
import { WorkspacePage } from "@/pages/WorkspacePage";

import { CabDashboardPage } from "@/pages/CabDashboardPage";
import { CabApplicationRegisterPage } from "@/pages/CabApplicationRegisterPage";
import { CabApplicationSubmissionPage } from "@/pages/CabApplicationSubmissionPage";
import { CabCompanyProfilePage } from "@/pages/CabCompanyProfilePage";
import { AbDashboardPage } from "@/pages/AbDashboardPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { CabOnboardingPage } from "@/pages/CabOnboardingPage";
import { AbOnboardingPage } from "@/pages/AbOnboardingPage";
import { AuditeeOnboardingPage } from "@/pages/AuditeeOnboardingPage";
import { ClientRegistrationPage } from "@/pages/ClientRegistrationPage";
import { CabClientCompanyProfilePage } from "@/pages/CabClientCompanyProfilePage";
import { CabClientsPage } from "@/pages/CabClientsPage";
import { ClientRegisterPage } from "@/pages/ClientRegisterPage";
import { CabClientDetailsPage } from "@/pages/CabClientDetailsPage";
import { ApplicationDraftPage } from "@/pages/ApplicationDraftPage";
import { AddSitePage } from "@/pages/AddSitePage";
import { ApplyMultiSiteRulePage } from "@/pages/ApplyMultiSiteRulePage";
import { CabMultiSiteRulePreviewPage } from "@/pages/CabMultiSiteRulePreviewPage";
import { CabApplicationReceiptPage } from "@/pages/CabApplicationReceiptPage";
import { CabApplicationReviewPage } from "@/pages/CabApplicationReviewPage";
import { CabContactsListPage } from "@/pages/CabContactsListPage";
import { CabAddContactPage } from "@/pages/CabAddContactPage";
import { CabApplicationInformationRequiredPage } from "@/pages/CabApplicationInformationRequiredPage";
import { CabApplicationTechnicalFeasibilityPage } from "@/pages/CabApplicationTechnicalFeasibilityPage";
import { CabApplicationQuotationPage } from "@/pages/CabApplicationQuotationPage";
import { CabQuotationApprovalPage } from "@/pages/CabQuotationApprovalPage";
import { CabOfferRegisterPage } from "@/pages/CabOfferRegisterPage";
import { CabCreateOfferPage } from "@/pages/CabCreateOfferPage";
import { CabInvoiceRegisterPage } from "@/pages/CabInvoiceRegisterPage";
import { CabInvoiceDetailsPage } from "@/pages/CabInvoiceDetailsPage";
import { CabAuditSchedulePage } from "@/pages/CabAuditSchedulePage";
import { CabBuildAuditPlanPage } from "@/pages/CabBuildAuditPlanPage";
import { CabAuditReportingPage } from "@/pages/CabAuditReportingPage";
import { CabAddFindingPage } from "@/pages/CabAddFindingPage";
import { CabDecisionQueuePage } from "@/pages/CabDecisionQueuePage";
import { CabDecisionDetailsPage } from "@/pages/CabDecisionDetailsPage";
import { CabPersonnelRegisterPage } from "@/pages/CabPersonnelRegisterPage";
import { CabCompetenceEvaluationPage } from "@/pages/CabCompetenceEvaluationPage";
import { PortalHomePage } from "@/pages/portal/PortalHomePage";
import { PortalCompanyProfilePage } from "@/pages/portal/PortalCompanyProfilePage";
import { CabCertificationCyclesPage } from "@/pages/CabCertificationCyclesPage";
import { CabManageCertificationCyclePage } from "@/pages/CabManageCertificationCyclePage";
import { CabNonconformitiesPage } from "@/pages/CabNonconformitiesPage";
import { CabNonconformityResponsePage } from "@/pages/CabNonconformityResponsePage";
import { CabCertificateRegisterPage } from "@/pages/CabCertificateRegisterPage";
import { CabPrepareCertificatePage } from "@/pages/CabPrepareCertificatePage";
import { CabSidebarProvider } from "@/context/CabSidebarContext";
import { ScrollToTop } from "@/components/routing/ScrollToTop";
import {
  getAuthSession,
  getAuthToken,
  getPostLoginRedirect,
} from "@/lib/authStorage";
import { LEGACY_DASHBOARD_PATH, ROUTES } from "@/lib/routes";

function HomeRedirect() {
  const session = getAuthSession();
  const target =
    getAuthToken() && session ? getPostLoginRedirect(session) : ROUTES.login;
  return <Navigate to={target} replace />;
}

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <DirectionProvider>
        <BrowserRouter>
          <ScrollToTop />
          <CabSidebarProvider>
            <Routes>
              <Route path="/" element={<HomeRedirect />} />
              <Route path={ROUTES.login} element={<LoginPage />} />
              <Route path={ROUTES.register} element={<RegisterPage />} />
              <Route
                path={ROUTES.forgotPassword}
                element={<ForgotPasswordPage />}
              />
              <Route
                path={ROUTES.privacyPolicy}
                element={<PrivacyPolicyPage />}
              />

              <Route
                path={ROUTES.workspace}
                element={
                  <RequireAuth>
                    <WorkspacePage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabWorkspace}
                element={<Navigate to={ROUTES.workspace} replace />}
              />

              <Route
                path={ROUTES.cabDashboard}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabDashboardPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabCompanyProfile}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabCompanyProfilePage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.abDashboard}
                element={
                  <RequireAuth>
                    <RequireAbDashboard>
                      <AbDashboardPage />
                    </RequireAbDashboard>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.onboarding}
                element={
                  <RequireAuthOrPendingRegistration>
                    <OnboardingPage />
                  </RequireAuthOrPendingRegistration>
                }
              />
              <Route
                path={ROUTES.cabOnboarding}
                element={
                  <RequireAuth>
                    <CabOnboardingPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.abOnboarding}
                element={
                  <RequireAuth>
                    <AbOnboardingPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.auditeeOnboarding}
                element={
                  <RequireAuth>
                    <AuditeeOnboardingPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabApplicationRegister}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabApplicationRegisterPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabApplicationSubmission}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabApplicationSubmissionPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/clients"
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabClientsPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabAuditClients}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <ClientRegisterPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/clients/new"
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <ClientRegistrationPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/clients/:clientId/edit"
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <ClientRegistrationPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/clients/:clientId/profile"
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabClientCompanyProfilePage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/clients/:clientId"
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabClientDetailsPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/draft"
                element={
                  <RequireAuth>
                    <ApplicationDraftPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/draft/sites/new"
                element={
                  <RequireAuth>
                    <AddSitePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/draft/sites/multi-site-rule"
                element={
                  <RequireAuth>
                    <ApplyMultiSiteRulePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/draft/sites/multi-site-rule/preview"
                element={
                  <RequireAuth>
                    <CabMultiSiteRulePreviewPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/review-queue"
                element={
                  <RequireAuth>
                    <Navigate to={ROUTES.cabApplicationRegister} replace />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/contacts"
                element={
                  <RequireAuth>
                    <CabContactsListPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/contacts/new"
                element={
                  <RequireAuth>
                    <CabAddContactPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/receipt"
                element={
                  <RequireAuth>
                    <CabApplicationReceiptPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/:applicationId/receipt"
                element={
                  <RequireAuth>
                    <CabApplicationReceiptPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/review"
                element={
                  <RequireAuth>
                    <CabApplicationReviewPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/:applicationId/review"
                element={
                  <RequireAuth>
                    <CabApplicationReviewPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/information-required"
                element={
                  <RequireAuth>
                    <CabApplicationInformationRequiredPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/:applicationId/information-required"
                element={
                  <RequireAuth>
                    <CabApplicationInformationRequiredPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/technical-feasibility"
                element={
                  <RequireAuth>
                    <CabApplicationTechnicalFeasibilityPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/:applicationId/technical-feasibility"
                element={
                  <RequireAuth>
                    <CabApplicationTechnicalFeasibilityPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/quotation"
                element={
                  <RequireAuth>
                    <CabApplicationQuotationPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/applications/:applicationId/quotation"
                element={
                  <RequireAuth>
                    <CabApplicationQuotationPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabQuotationApproval}
                element={
                  <RequireAuth>
                    <CabQuotationApprovalPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/cab/quotations/:applicationId/approval"
                element={
                  <RequireAuth>
                    <CabQuotationApprovalPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabOffers}
                element={
                  <RequireAuth>
                    <CabOfferRegisterPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabOfferNew}
                element={
                  <RequireAuth>
                    <CabCreateOfferPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabInvoices}
                element={
                  <RequireAuth>
                    <CabInvoiceRegisterPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabInvoiceDetails}
                element={
                  <RequireAuth>
                    <CabInvoiceDetailsPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabAuditPlanning}
                element={
                  <RequireAuth>
                    <CabAuditSchedulePage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabAuditSchedule}
                element={
                  <RequireAuth>
                    <CabAuditSchedulePage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabBuildAuditPlan}
                element={
                  <RequireAuth>
                    <CabBuildAuditPlanPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabAuditPlanNew}
                element={
                  <RequireAuth>
                    <CabBuildAuditPlanPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabAuditReporting}
                element={
                  <RequireAuth>
                    <CabAuditReportingPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabAuditWorkspace}
                element={
                  <RequireAuth>
                    <CabAuditReportingPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabAddFinding}
                element={
                  <RequireAuth>
                    <CabAddFindingPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabNonconformities}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabNonconformitiesPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabNonconformityResponse}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabNonconformityResponsePage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabCertificates}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabCertificateRegisterPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabPrepareCertificate}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabPrepareCertificatePage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabDecisions}
                element={
                  <RequireAuth>
                    <CabDecisionQueuePage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabDecisionDetails}
                element={
                  <RequireAuth>
                    <CabDecisionDetailsPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabCertificationCycles}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabCertificationCyclesPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabManageCertificationCycle}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabManageCertificationCyclePage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabCompetence}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabPersonnelRegisterPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.cabCompetenceEvaluation}
                element={
                  <RequireAuth>
                    <RequireCabOnboarded>
                      <CabCompetenceEvaluationPage />
                    </RequireCabOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.dashboard}
                element={
                  <RequireAuth>
                    <RequireAbOnboarded>
                      <RedirectAbFromGenericDashboard>
                        <RequireAuditeeOnboarded>
                          <DashboardPage />
                        </RequireAuditeeOnboarded>
                      </RedirectAbFromGenericDashboard>
                    </RequireAbOnboarded>
                  </RequireAuth>
                }
              />
              <Route
                path={LEGACY_DASHBOARD_PATH}
                element={<Navigate to={ROUTES.dashboard} replace />}
              />
              <Route
                path={ROUTES.certificationRequestNew}
                element={
                  <RequireAuth>
                    <CertificationRequestFormPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.certificationRequests}
                element={
                  <RequireAuth>
                    <CertificationRequestsPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.dashboardTasks}
                element={
                  <RequireAuth>
                    <DashboardTasksPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.companyProfile}
                element={
                  <RequireAuth>
                    <CompanyProfilePage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.users}
                element={
                  <RequireAuth>
                    <UsersPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.wallet}
                element={
                  <RequireAuth>
                    <DigitalWalletPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.periodicVisits}
                element={
                  <RequireAuth>
                    <PeriodicVisitsPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.invoices}
                element={
                  <RequireAuth>
                    <InvoicesPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.portal}
                element={
                  <RequireAuth>
                    <PortalHomePage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.portalHome}
                element={
                  <RequireAuth>
                    <PortalHomePage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.portalCompanyProfile}
                element={
                  <RequireAuth>
                    <PortalCompanyProfilePage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.portalApplications}
                element={
                  <RequireAuth>
                    <CertificationRequestsPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.portalOffers}
                element={
                  <RequireAuth>
                    <CabOfferRegisterPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.portalInvoices}
                element={
                  <RequireAuth>
                    <CabInvoiceRegisterPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.portalAudits}
                element={
                  <RequireAuth>
                    <PeriodicVisitsPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.portalFindings}
                element={
                  <RequireAuth>
                    <DashboardTasksPage />
                  </RequireAuth>
                }
              />
              <Route
                path={ROUTES.portalCertificates}
                element={
                  <RequireAuth>
                    <DigitalWalletPage />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<HomeRedirect />} />
            </Routes>
          </CabSidebarProvider>
        </BrowserRouter>
      </DirectionProvider>
    </Suspense>
  );
}