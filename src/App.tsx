import { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { RequireAuthOrPendingRegistration } from '@/components/auth/RequireAuthOrPendingRegistration'
import { RequireCabOnboarded } from '@/components/auth/RequireCabOnboarded'
import { RequireAbDashboard } from '@/components/auth/RequireAbDashboard'
import { RequireAbOnboarded } from '@/components/auth/RequireAbOnboarded'
import { RedirectAbFromGenericDashboard } from '@/components/auth/RedirectAbFromGenericDashboard'
import { RequireAuditeeOnboarded } from '@/components/auth/RequireAuditeeOnboarded'
import { DirectionProvider } from '@/context/DirectionContext'
import { CertificationRequestFormPage } from '@/pages/CertificationRequestFormPage'
import { CertificationRequestsPage } from '@/pages/CertificationRequestsPage'
import { CompanyProfilePage } from '@/pages/CompanyProfilePage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DashboardTasksPage } from '@/pages/DashboardTasksPage'
import { UsersPage } from '@/pages/UsersPage'
import { DigitalWalletPage } from '@/pages/DigitalWalletPage'
import { InvoicesPage } from '@/pages/InvoicesPage'
import { PeriodicVisitsPage } from '@/pages/PeriodicVisitsPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage'
import { CabDashboardPage } from '@/pages/CabDashboardPage'
import { AbDashboardPage } from '@/pages/AbDashboardPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { CabOnboardingPage } from '@/pages/CabOnboardingPage'
import { AbOnboardingPage } from '@/pages/AbOnboardingPage'
import { AuditeeOnboardingPage } from '@/pages/AuditeeOnboardingPage'
import { ClientRegistrationPage } from '@/pages/ClientRegistrationPage'
import { ApplicationDraftPage } from '@/pages/ApplicationDraftPage'
import { AddSitePage } from '@/pages/AddSitePage'
import { ApplyMultiSiteRulePage } from '@/pages/ApplyMultiSiteRulePage'
import { CabMultiSiteRulePreviewPage } from '@/pages/CabMultiSiteRulePreviewPage'
import { CabApplicationReceiptPage } from '@/pages/CabApplicationReceiptPage'
import { CabApplicationReviewPage } from '@/pages/CabApplicationReviewPage'
import { CabApplicationInformationRequiredPage } from '@/pages/CabApplicationInformationRequiredPage'
import { CabApplicationTechnicalFeasibilityPage } from '@/pages/CabApplicationTechnicalFeasibilityPage'
import { CabApplicationQuotationPage } from '@/pages/CabApplicationQuotationPage'
import { CabQuotationApprovalPage } from '@/pages/CabQuotationApprovalPage'
import { getAuthSession, getAuthToken, getPostLoginRedirect } from '@/lib/authStorage'
import { LEGACY_DASHBOARD_PATH, ROUTES } from '@/lib/routes'

function HomeRedirect() {
  const session = getAuthSession()
  const target = getAuthToken() && session ? getPostLoginRedirect(session) : ROUTES.login
  return <Navigate to={target} replace />
}

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <DirectionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path={ROUTES.login} element={<LoginPage />} />
            <Route path={ROUTES.register} element={<RegisterPage />} />
            <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
            <Route path={ROUTES.privacyPolicy} element={<PrivacyPolicyPage />} />
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
              path="/cab/clients/new"
              element={
                <RequireAuth>
                  <ClientRegistrationPage />
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
            <Route path={LEGACY_DASHBOARD_PATH} element={<Navigate to={ROUTES.dashboard} replace />} />
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
            <Route path="*" element={<HomeRedirect />} />
          </Routes>
        </BrowserRouter>
      </DirectionProvider>
    </Suspense>
  )
}
