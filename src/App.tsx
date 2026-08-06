import { Suspense } from 'react'

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { RequireAuth } from '@/components/auth/RequireAuth'

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

import { ClientRegistrationPage } from '@/pages/ClientRegistrationPage'

import { getAuthToken } from '@/lib/authStorage'

import { AUTHENTICATED_HOME, LEGACY_DASHBOARD_PATH, ROUTES } from '@/lib/routes'



function HomeRedirect() {

  return <Navigate to={getAuthToken() ? AUTHENTICATED_HOME : ROUTES.login} replace />

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

            <Route path="/cab/dashboard" element={<CabDashboardPage />} />

            <Route path="/cab/clients/new" element={<ClientRegistrationPage />} />

            <Route
              path={ROUTES.dashboard}
              element={
                <RequireAuth>
                  <DashboardPage />
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


