import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { DashboardFooter } from '@/components/dashboard/DashboardFooter'

// TODO: replace with the real in-progress application id once this page is
// wired to an actual application (mirrors the placeholder pattern the other
// cab/applications/* pages used before their APIs were connected).
const APPLICATION_ID = 'APP-2025-0188'

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-400 rtl-flip">
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
export function AddSitePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleBack = () => {
    navigate('/cab/applications/draft')
  }

  // TODO: wire to the real "save application draft" endpoint once available,
  // matching the not-yet-backed stub used on ApplicationDraftPage.
  const handleSaveDraft = () => {}

  // TODO: validate + persist the new site once the field sections below are
  // built, then return to the Sites & Facilities step.
  const handleNext = () => {
    navigate('/cab/applications/draft')
  }

  return (
    <CabLayout className="bg-white">
      <CabHeader title={t('cab.applicationDraft.title')} notificationCount={3} />

      {/* <div className="flex shrink-0 items-center border-b border-[#ececec] bg-white px-5 py-3">
        <nav
          className="flex min-w-0 flex-wrap items-center gap-2 text-[12px] sm:text-[13px]"
          aria-label="breadcrumb"
        >
          <Link to="/cab/dashboard" className="font-light text-[#989898] hover:text-primary">
            {t('cab.applications.receipt.breadcrumb.home')}
          </Link>
          <Chevron />
          <span className="font-light text-[#989898]">
            {t('cab.applications.receipt.breadcrumb.applications')}
          </span>
          <Chevron />
          <span className="font-light text-[#989898]">{APPLICATION_ID}</span>
          <Chevron />
          <Link to="/cab/applications/draft" className="font-bold text-[#464646] hover:text-primary">
            {t('cab.applicationDraft.title')}
          </Link>
        </nav>
      </div> */}

      <div className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <div className="space-y-1">
          <h2 className="text-h3-semi text-neutral-900">
            {t('cab.applicationDraft.sitesFacilities.addNewSite')}
          </h2>
          <p className="text-body-2 text-neutral-500">
            {t('cab.applicationDraft.sitesFacilities.addNewSiteSubtitle')}
          </p>
        </div>

        {/* Field sections (Site & Location Details, Management System &
            Scope, Travel & Access, Sampling & Surveillance, Contact Person,
            Site Indicators) are added in the next step. */}
      </div>

      <DashboardFooter
        onBack={handleBack}
        backDisabled={false}
        onSaveDraft={handleSaveDraft}
        onNext={handleNext}
        nextDisabled={false}
      />
    </CabLayout>
  )
}