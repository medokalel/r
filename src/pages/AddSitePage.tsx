import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { DashboardFooter } from '@/components/dashboard/DashboardFooter'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { CountrySelectField } from '@/components/dashboard/CountrySelectField'
import { FormField, SelectField, TextField, Textarea } from '@/components/ui'
import { RadioGroup } from '@/components/ui/RadioGroup'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { SITE_MULTI_SITE_ROLE_OPTIONS, STANDARD_SCHEMA_OPTIONS } from '@/lib/api/applicationDraftApi'
import type { CountryCode } from '@/lib/countries'

// TODO: replace with the real in-progress application id once this page is
// wired to an actual application (mirrors the placeholder pattern the other
// cab/applications/* pages used before their APIs were connected).
const APPLICATION_ID = 'APP-2025-0188'

// TODO: fold into the shared "add site" form model (alongside Management
// System & Scope, Travel & Access, Sampling & Surveillance and Contact
// Person) once those sections are built.
interface SiteLocationDetails {
  name: string
  role: string
  country: CountryCode | null
  address: string
}

const emptySiteLocationDetails: SiteLocationDetails = {
  name: '',
  role: '',
  country: 'EG',
  address: '',
}

// TODO: fold into the shared "add site" form model, same as SiteLocationDetails.
interface ManagementSystemScope {
  type: string
  standards: string[]
  scopeActivities: string
}

const emptyManagementSystemScope: ManagementSystemScope = {
  type: 'INTEGRATED',
  standards: [],
  scopeActivities: '',
}

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
  const [siteLocation, setSiteLocation] = useState(emptySiteLocationDetails)
  const [managementScope, setManagementScope] = useState(emptyManagementSystemScope)

  const patchSiteLocation = (f: Partial<SiteLocationDetails>) =>
    setSiteLocation((prev) => ({ ...prev, ...f }))

  const patchManagementScope = (f: Partial<ManagementSystemScope>) =>
    setManagementScope((prev) => ({ ...prev, ...f }))

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
    <CabLayout>
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

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 rounded-[var(--radius-md)] border border-[#ececec] bg-white p-5">
            <div className="space-y-5">
            <SectionHeading
              title={t('cab.applicationDraft.sitesFacilities.addSitePage.sections.siteLocationDetails')}
              accordion
            >
              <div className="space-y-5">
                <div className="grid gap-5 lg:grid-cols-3">
                  <FormField label={t('cab.applicationDraft.sitesFacilities.modal.siteName')} required>
                    <TextField
                      type="text"
                      value={siteLocation.name}
                      onChange={(e) => patchSiteLocation({ name: e.target.value })}
                      placeholder={t('cab.applicationDraft.sitesFacilities.modal.siteNamePlaceholder')}
                    />
                  </FormField>
                  <FormField
                    label={t('cab.applicationDraft.sitesFacilities.addSitePage.roleInMultiSite')}
                    required
                  >
                    <SelectField
                      value={siteLocation.role}
                      options={SITE_MULTI_SITE_ROLE_OPTIONS}
                      onChange={(value) => patchSiteLocation({ role: value })}
                      placeholder={t(
                        'cab.applicationDraft.sitesFacilities.addSitePage.roleInMultiSitePlaceholder'
                      )}
                    />
                  </FormField>
                  <FormField label={t('cab.applicationDraft.sitesFacilities.modal.country')} required>
                    <CountrySelectField
                      value={siteLocation.country}
                      onChange={(code) => patchSiteLocation({ country: code })}
                    />
                  </FormField>
                </div>

                <FormField label={t('cab.applicationDraft.sitesFacilities.modal.address')} required>
                  <Textarea
                    rows={4}
                    value={siteLocation.address}
                    onChange={(e) => patchSiteLocation({ address: e.target.value })}
                    placeholder={t('cab.applicationDraft.sitesFacilities.modal.addressPlaceholder')}
                  />
                </FormField>
              </div>
            </SectionHeading>

            <SectionHeading
              title={t('cab.applicationDraft.sitesFacilities.addSitePage.sections.managementSystemScope')}
              accordion
            >
              <div className="space-y-5">
                <FormField
                  label={t('cab.applicationDraft.sitesFacilities.addSitePage.managementSystemType')}
                  required
                >
                  <RadioGroup
                    name="managementSystemType"
                    value={managementScope.type}
                    onChange={(value) => patchManagementScope({ type: value })}
                    options={[
                      {
                        value: 'INTEGRATED',
                        label: t(
                          'cab.applicationDraft.sitesFacilities.addSitePage.managementSystemTypeOptions.integrated'
                        ),
                      },
                      {
                        value: 'SINGLE',
                        label: t(
                          'cab.applicationDraft.sitesFacilities.addSitePage.managementSystemTypeOptions.single'
                        ),
                      },
                      {
                        value: 'SEPARATE',
                        label: t(
                          'cab.applicationDraft.sitesFacilities.addSitePage.managementSystemTypeOptions.separate'
                        ),
                      },
                    ]}
                  />
                </FormField>

                <FormField
                  label={t('cab.applicationDraft.sitesFacilities.addSitePage.applicableStandards')}
                  required
                >
                  <MultiSelect
                    tags={managementScope.standards}
                    options={STANDARD_SCHEMA_OPTIONS.map((s) => s.name)}
                    onChange={(tags) => patchManagementScope({ standards: tags })}
                    placeholder={t(
                      'cab.applicationDraft.sitesFacilities.addSitePage.applicableStandardsPlaceholder'
                    )}
                  />
                </FormField>

                <FormField
                  label={t('cab.applicationDraft.sitesFacilities.addSitePage.siteScopeActivities')}
                  required
                >
                  <Textarea
                    rows={3}
                    value={managementScope.scopeActivities}
                    onChange={(e) => patchManagementScope({ scopeActivities: e.target.value })}
                    placeholder={t(
                      'cab.applicationDraft.sitesFacilities.addSitePage.siteScopeActivitiesPlaceholder'
                    )}
                  />
                </FormField>
              </div>
            </SectionHeading>

            {/* Remaining field sections (Travel & Access, Sampling &
                Surveillance, Contact Person, Site Indicators) are added in
                the next step. */}
            </div>
          </div>
        </div>
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