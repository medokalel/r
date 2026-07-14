import { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { DirectionProvider } from '@/context/DirectionContext'
import { CertificationRequestsPage } from '@/pages/CertificationRequestsPage'
import { CompanyProfilePage } from '@/pages/CompanyProfilePage'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage'
import { getAuthToken } from '@/lib/authStorage'

function HomeRedirect() {
  return <Navigate to={getAuthToken() ? '/certification-request' : '/login'} replace />
}

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <DirectionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route
              path="/certification-request"
              element={
                <RequireAuth>
                  <DashboardPage />
                </RequireAuth>
              }
            />
            <Route
              path="/certification-requests"
              element={
                <RequireAuth>
                  <CertificationRequestsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/settings/company-profile"
              element={
                <RequireAuth>
                  <CompanyProfilePage />
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
