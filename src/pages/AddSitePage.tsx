import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Airplane, Profile2User, RouteSquare, TickCircle, Ticket } from 'iconsax-reactjs'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { DashboardFooter } from '@/components/dashboard/DashboardFooter'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { CountrySelectField } from '@/components/dashboard/CountrySelectField'
import { FormField, SelectField, TextField, Textarea, Checkbox } from '@/components/ui'
import { RadioGroup } from '@/components/ui/RadioGroup'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { Toggle } from '@/components/ui/Toggle'
import { PhoneInputRow } from '@/components/auth/CountryCodeSelect'
import { MailIcon, PhoneIcon } from '@/components/icons'
import { useFieldValidation } from '@/hooks/useFieldValidation'
import { isValidEmailFormat, isValidPhoneNumber } from '@/lib/validators'
import {
  SITE_MULTI_SITE_ROLE_OPTIONS,
  STANDARD_SCHEMA_OPTIONS,
  TRAVEL_REQUIREMENT_OPTIONS,
  PERMIT_ACCESS_OPTIONS,
  ESTIMATED_TRAVEL_TIME_OPTIONS,
  TYPE_OF_AUDIT_OPTIONS,
  SURVEILLANCE_CYCLE_OPTIONS,
} from '@/lib/api/applicationDraftApi'
import type { CountryCode } from '@/lib/countries'
import type { Site } from '@/lib/sitesFacilitiesForm'
import { savePendingNewSite } from '@/lib/applicationDraftSession'

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

// TODO: fold into the shared "add site" form model, same as SiteLocationDetails.
interface TravelAccess {
  requirements: string[]
  permitAccess: string
  estimatedTravelTime: string
  notes: string
}

const emptyTravelAccess: TravelAccess = {
  requirements: [],
  permitAccess: '',
  estimatedTravelTime: '',
  notes: '',
}

// TODO: fold into the shared "add site" form model, same as SiteLocationDetails.
interface SamplingSurveillance {
  includeInSampling: boolean
  expectedSamples: string
  typeOfAudit: string
  surveillanceCycle: string
  otherSitesCovered: string[]
}

const emptySamplingSurveillance: SamplingSurveillance = {
  includeInSampling: true,
  expectedSamples: '',
  typeOfAudit: '',
  surveillanceCycle: '',
  otherSitesCovered: [],
}

// TODO: fold into the shared "add site" form model, same as SiteLocationDetails.
interface ContactPerson {
  name: string
  designation: string
  phone: string
  email: string
}

const emptyContactPerson: ContactPerson = {
  name: '',
  designation: '',
  phone: '',
  email: '',
}

// TODO: populate with the other sites already added in this application once
// this page can read the in-progress Sites & Facilities list.
const OTHER_SITES_OPTIONS: string[] = []

// Fixed order — lines up 1:1 with TRAVEL_REQUIREMENT_OPTIONS and is reused
// for the "Site Indicators" legend below, so keep the two in sync.
const TRAVEL_REQUIREMENT_ICONS = [Airplane, Ticket, RouteSquare]

const SITE_INDICATOR_ITEMS = [
  { key: 'airplaneRequired', icon: Airplane },
  { key: 'trainRequired', icon: Ticket },
  { key: 'airplaneTrainRequired', icon: RouteSquare },
  { key: 'permitAccessRequired', icon: Profile2User },
  { key: 'includedInSampling', icon: TickCircle },
] as const

export function AddSitePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [siteLocation, setSiteLocation] = useState(emptySiteLocationDetails)
  const [managementScope, setManagementScope] = useState(emptyManagementSystemScope)
  const [travelAccess, setTravelAccess] = useState(emptyTravelAccess)
  const [samplingSurveillance, setSamplingSurveillance] = useState(emptySamplingSurveillance)
  const [contactPerson, setContactPerson] = useState(emptyContactPerson)
  const [contactCountryCode, setContactCountryCode] = useState<CountryCode>('EG')

  const patchSiteLocation = (f: Partial<SiteLocationDetails>) =>
    setSiteLocation((prev) => ({ ...prev, ...f }))

  const patchManagementScope = (f: Partial<ManagementSystemScope>) =>
    setManagementScope((prev) => ({ ...prev, ...f }))

  const patchTravelAccess = (f: Partial<TravelAccess>) =>
    setTravelAccess((prev) => ({ ...prev, ...f }))

  const patchSamplingSurveillance = (f: Partial<SamplingSurveillance>) =>
    setSamplingSurveillance((prev) => ({ ...prev, ...f }))

  const patchContactPerson = (f: Partial<ContactPerson>) =>
    setContactPerson((prev) => ({ ...prev, ...f }))

  const toggleTravelRequirement = (option: string) =>
    patchTravelAccess({
      requirements: travelAccess.requirements.includes(option)
        ? travelAccess.requirements.filter((item) => item !== option)
        : [...travelAccess.requirements, option],
    })

  const { fieldProps } = useFieldValidation(contactPerson, {
    email: (value) => (!isValidEmailFormat(value) ? t('validation.invalidEmail') : undefined),
    phone: (value) =>
      !isValidPhoneNumber(value, contactCountryCode) ? t('validation.invalidMobile') : undefined,
  })

  const canSave = Boolean(
    siteLocation.name.trim() &&
      siteLocation.role &&
      siteLocation.country &&
      siteLocation.address.trim() &&
      managementScope.type &&
      managementScope.standards.length > 0 &&
      managementScope.scopeActivities.trim() &&
      travelAccess.permitAccess &&
      travelAccess.estimatedTravelTime &&
      samplingSurveillance.expectedSamples.trim() &&
      samplingSurveillance.typeOfAudit &&
      contactPerson.name.trim() &&
      contactPerson.phone.trim() &&
      isValidPhoneNumber(contactPerson.phone, contactCountryCode) &&
      contactPerson.email.trim() &&
      isValidEmailFormat(contactPerson.email)
  )

    // Builds the shape the Sites & Facilities table already reads, plus
  // everything else this page collects tucked into `additionalDetails` —
  // the table itself isn't touched (see SiteAdditionalDetails in
  // sitesFacilitiesForm.ts for what's parked there for now).
  const buildSite = (): Site => ({
    id: crypto.randomUUID(),
    name: siteLocation.name.trim(),
    siteType: siteLocation.role,
    address: siteLocation.address.trim(),
    country: siteLocation.country ?? '',
    activities: managementScope.scopeActivities.trim() ? [managementScope.scopeActivities.trim()] : [],
    employees: 0,
    contact: {
      name: contactPerson.name.trim(),
      phone: contactPerson.phone.trim(),
      email: contactPerson.email.trim(),
    },
    additionalDetails: {
      roleInMultiSite: siteLocation.role,
      managementSystemType: managementScope.type,
      applicableStandards: managementScope.standards,
      scopeActivities: managementScope.scopeActivities.trim(),
      travelRequirements: travelAccess.requirements,
      permitAccess: travelAccess.permitAccess,
      estimatedTravelTime: travelAccess.estimatedTravelTime,
      transportationNotes: travelAccess.notes.trim(),
      includeInSampling: samplingSurveillance.includeInSampling,
      expectedSamples: samplingSurveillance.expectedSamples.trim(),
      typeOfAudit: samplingSurveillance.typeOfAudit,
      surveillanceCycle: samplingSurveillance.surveillanceCycle,
      otherSitesCovered: samplingSurveillance.otherSitesCovered,
      designation: contactPerson.designation.trim(),
    },
  })

  const handleBack = () => {
    navigate('/cab/applications/draft')
  }

  // TODO: wire to the real "save application draft" endpoint once available,
  // matching the not-yet-backed stub used on ApplicationDraftPage.
  const handleSaveDraft = () => {}

  // Hands the built site to ApplicationDraftPage via sessionStorage (see
  // applicationDraftSession.ts) — it's picked up there and appended to the
  // Sites & Facilities list, then this page returns to that step.
  const handleNext = () => {
    if (!canSave) return
    savePendingNewSite(buildSite())
    navigate('/cab/applications/draft')
  }

  return (
    <CabLayout>
      <CabHeader title={t('cab.applicationDraft.title')} notificationCount={3} />

      <div className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <div className="space-y-1">
          <h2 className="text-h3-semi text-neutral-900">
            {t('cab.applicationDraft.sitesFacilities.addNewSite')}
          </h2>
          <p className="text-body-2 text-neutral-500">
            {t('cab.applicationDraft.sitesFacilities.addNewSiteSubtitle')}
          </p>
        </div>

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
              <FormField label={t('cab.applicationDraft.sitesFacilities.addSitePage.roleInMultiSite')} required>
                <SelectField
                  value={siteLocation.role}
                  options={SITE_MULTI_SITE_ROLE_OPTIONS}
                  onChange={(value) => patchSiteLocation({ role: value })}
                  placeholder={t('cab.applicationDraft.sitesFacilities.addSitePage.roleInMultiSitePlaceholder')}
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
            <FormField label={t('cab.applicationDraft.sitesFacilities.addSitePage.managementSystemType')} required>
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
                    label: t('cab.applicationDraft.sitesFacilities.addSitePage.managementSystemTypeOptions.single'),
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

            <FormField label={t('cab.applicationDraft.sitesFacilities.addSitePage.applicableStandards')} required>
              <MultiSelect
                tags={managementScope.standards}
                options={STANDARD_SCHEMA_OPTIONS.map((s) => s.name)}
                onChange={(tags) => patchManagementScope({ standards: tags })}
                placeholder={t('cab.applicationDraft.sitesFacilities.addSitePage.applicableStandardsPlaceholder')}
              />
            </FormField>

            <FormField label={t('cab.applicationDraft.sitesFacilities.addSitePage.siteScopeActivities')} required>
              <Textarea
                rows={3}
                value={managementScope.scopeActivities}
                onChange={(e) => patchManagementScope({ scopeActivities: e.target.value })}
                placeholder={t('cab.applicationDraft.sitesFacilities.addSitePage.siteScopeActivitiesPlaceholder')}
              />
            </FormField>
          </div>
        </SectionHeading>

        <SectionHeading
          title={t('cab.applicationDraft.sitesFacilities.addSitePage.sections.travelAccess')}
          accordion
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
              {TRAVEL_REQUIREMENT_OPTIONS.map((option, index) => {
                const Icon = TRAVEL_REQUIREMENT_ICONS[index]
                return (
                  <label key={option} className="flex cursor-pointer items-center gap-2">
                    <Checkbox
                      checked={travelAccess.requirements.includes(option)}
                      onChange={() => toggleTravelRequirement(option)}
                    />
                    <Icon size={18} variant="Linear" className="text-neutral-500" />
                    <span className="text-body-2 text-neutral-700">{option}</span>
                  </label>
                )
              })}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label={t('cab.applicationDraft.sitesFacilities.addSitePage.permitAccess')} required>
                <SelectField
                  value={travelAccess.permitAccess}
                  options={PERMIT_ACCESS_OPTIONS}
                  onChange={(value) => patchTravelAccess({ permitAccess: value })}
                  placeholder={t('cab.applicationDraft.sitesFacilities.addSitePage.selectOption')}
                />
              </FormField>
              <FormField
                label={t('cab.applicationDraft.sitesFacilities.addSitePage.estimatedTravelTime')}
                required
              >
                <SelectField
                  value={travelAccess.estimatedTravelTime}
                  options={ESTIMATED_TRAVEL_TIME_OPTIONS}
                  onChange={(value) => patchTravelAccess({ estimatedTravelTime: value })}
                  placeholder={t('cab.applicationDraft.sitesFacilities.addSitePage.selectOption')}
                />
              </FormField>
            </div>

            <FormField label={t('cab.applicationDraft.sitesFacilities.addSitePage.transportationNotes')}>
              <Textarea
                rows={3}
                value={travelAccess.notes}
                onChange={(e) => patchTravelAccess({ notes: e.target.value })}
                placeholder={t('cab.applicationDraft.sitesFacilities.addSitePage.transportationNotesPlaceholder')}
              />
            </FormField>
          </div>
        </SectionHeading>

        <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
          <SectionHeading
            title={t('cab.applicationDraft.sitesFacilities.addSitePage.sections.samplingSurveillance')}
            accordion
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-body-2-medium text-neutral-900">
                  {t('cab.applicationDraft.sitesFacilities.addSitePage.includeInSampling')}
                </span>
                <Toggle
                  checked={samplingSurveillance.includeInSampling}
                  onChange={(checked) => patchSamplingSurveillance({ includeInSampling: checked })}
                  aria-label={t('cab.applicationDraft.sitesFacilities.addSitePage.includeInSampling')}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label={t('cab.applicationDraft.sitesFacilities.addSitePage.expectedSamples')}
                  required
                >
                  <TextField
                    type="text"
                    inputMode="numeric"
                    value={samplingSurveillance.expectedSamples}
                    onChange={(e) => patchSamplingSurveillance({ expectedSamples: e.target.value })}
                    placeholder={t('cab.applicationDraft.sitesFacilities.addSitePage.expectedSamplesPlaceholder')}
                  />
                </FormField>
                <FormField label={t('cab.applicationDraft.sitesFacilities.addSitePage.typeOfAudit')} required>
                  <SelectField
                    value={samplingSurveillance.typeOfAudit}
                    options={TYPE_OF_AUDIT_OPTIONS}
                    onChange={(value) => patchSamplingSurveillance({ typeOfAudit: value })}
                    placeholder={t('cab.applicationDraft.sitesFacilities.addSitePage.selectOption')}
                  />
                </FormField>
                <FormField label={t('cab.applicationDraft.sitesFacilities.addSitePage.surveillanceCycle')}>
                  <SelectField
                    value={samplingSurveillance.surveillanceCycle}
                    options={SURVEILLANCE_CYCLE_OPTIONS}
                    onChange={(value) => patchSamplingSurveillance({ surveillanceCycle: value })}
                    placeholder={t(
                      'cab.applicationDraft.sitesFacilities.addSitePage.surveillanceCyclePlaceholder'
                    )}
                  />
                </FormField>
                <FormField label={t('cab.applicationDraft.sitesFacilities.addSitePage.otherSitesCovered')}>
                  <MultiSelect
                    tags={samplingSurveillance.otherSitesCovered}
                    options={OTHER_SITES_OPTIONS}
                    onChange={(tags) => patchSamplingSurveillance({ otherSitesCovered: tags })}
                    placeholder={t(
                      'cab.applicationDraft.sitesFacilities.addSitePage.otherSitesCoveredPlaceholder'
                    )}
                  />
                </FormField>
              </div>
            </div>
          </SectionHeading>

          <SectionHeading
            title={t('cab.applicationDraft.sitesFacilities.addSitePage.sections.contactPerson')}
            accordion
          >
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label={t('cab.applicationDraft.sitesFacilities.addSitePage.primaryContactName')}
                  required
                >
                  <TextField
                    type="text"
                    value={contactPerson.name}
                    onChange={(e) => patchContactPerson({ name: e.target.value })}
                    placeholder={t('cab.applicationDraft.sitesFacilities.modal.contactNamePlaceholder')}
                  />
                </FormField>
                <FormField label={t('cab.applicationDraft.sitesFacilities.addSitePage.designation')}>
                  <TextField
                    type="text"
                    value={contactPerson.designation}
                    onChange={(e) => patchContactPerson({ designation: e.target.value })}
                    placeholder={t('cab.applicationDraft.sitesFacilities.addSitePage.designationPlaceholder')}
                  />
                </FormField>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label={t('cab.applicationDraft.sitesFacilities.addSitePage.phoneNumber')} required>
                  <PhoneInputRow
                    rowClassName="gap-3"
                    value={contactCountryCode}
                    onChange={setContactCountryCode}
                    aria-label={t('cab.applicationDraft.sitesFacilities.addSitePage.phoneNumber')}
                  >
                    <div className="min-w-0 flex-1">
                      <TextField
                        type="tel"
                        icon={PhoneIcon}
                        value={contactPerson.phone}
                        onChange={(e) => patchContactPerson({ phone: e.target.value })}
                        placeholder="1XXXXXXXXX"
                        {...fieldProps('phone')}
                      />
                    </div>
                  </PhoneInputRow>
                </FormField>
                <FormField label={t('cab.applicationDraft.sitesFacilities.modal.contactEmail')} required>
                  <TextField
                    type="email"
                    icon={MailIcon}
                    value={contactPerson.email}
                    onChange={(e) => patchContactPerson({ email: e.target.value })}
                    {...fieldProps('email')}
                  />
                </FormField>
              </div>
            </div>
          </SectionHeading>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[#ececec] bg-white p-5">
          <h3 className="mb-4 text-body-1-medium text-neutral-900">
            {t('cab.applicationDraft.sitesFacilities.addSitePage.sections.siteIndicators')}
          </h3>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {SITE_INDICATOR_ITEMS.map(({ key, icon: Icon }) => (
              <div key={key} className="flex items-center gap-2 text-body-3 text-neutral-600">
                <Icon size={18} variant="Linear" className="text-primary" />
                <span>{t(`cab.applicationDraft.sitesFacilities.addSitePage.siteIndicators.${key}`)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DashboardFooter
        onBack={handleBack}
        backDisabled={false}
        onSaveDraft={handleSaveDraft}
        onNext={handleNext}
        nextDisabled={!canSave}
        nextLabel={t('common.save')}
      />
    </CabLayout>
  )
}