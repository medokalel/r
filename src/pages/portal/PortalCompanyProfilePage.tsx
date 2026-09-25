import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PortalLayout } from '@/components/layout/PortalLayout'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { usePortalCompanyProfileTourSteps } from '@/config/portalCompanyProfileTourSteps'
import {
  AppIcon,
  InfoIcon,
  SuccessCircleIcon,
  CorrectiveActionIcon,
} from '@/components/icons'
import {
  getStoredPortalProfile,
  saveStoredPortalProfile,
  type ClientProfile,
} from '@/lib/api/portalApi'
import { cn } from '@/lib/utils'

export function PortalCompanyProfilePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const tourSteps = usePortalCompanyProfileTourSteps()

  const [profile, setProfile] = useState<ClientProfile>(getStoredPortalProfile())
  const [activeTab, setActiveTab] = useState<'essentials' | 'more'>('essentials')
  const [isDirty, setIsDirty] = useState(false)
  const [showDiscard, setShowDiscard] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Modals
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [showAddSiteModal, setShowAddSiteModal] = useState(false)
  const [showAddContactModal, setShowAddContactModal] = useState(false)
  const [showAddDocModal, setShowAddDocModal] = useState(false)
  const [showLogoModal, setShowLogoModal] = useState(false)

  // Form Fields
  const [legalName, setLegalName] = useState(profile.legalName)
  const [countryOfInc, setCountryOfInc] = useState(profile.country)
  const [tradingName, setTradingName] = useState(profile.tradingName)
  const [industrySector, setIndustrySector] = useState(profile.industrySector)
  const [regNumber, setRegNumber] = useState(profile.registrationNumber)
  const [website, setWebsite] = useState(profile.website)

  // Address
  const [country, setCountry] = useState(profile.address.country)
  const [building, setBuilding] = useState(profile.address.building)
  const [city, setCity] = useState(profile.address.city)
  const [postalCode, setPostalCode] = useState(profile.address.postalCode)
  const [street, setStreet] = useState(profile.address.street)
  const [additionalLine, setAdditionalLine] = useState(profile.address.additionalLine)

  // New item modal states
  const [newSiteName, setNewSiteName] = useState('')
  const [newSiteAddress, setNewSiteAddress] = useState('')

  const [newContactName, setNewContactName] = useState('')
  const [newContactRole, setNewContactRole] = useState('')
  const [newContactEmail, setNewContactEmail] = useState('')
  const [newContactPhone, setNewContactPhone] = useState('')

  const [newDocName, setNewDocName] = useState('')
  const [newDocType, setNewDocType] = useState<'Legal' | 'General' | 'Policy' | 'Technical'>('Legal')

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3500)
  }

  const markDirty = () => setIsDirty(true)

  const handleSave = () => {
    const updated: ClientProfile = {
      ...profile,
      legalName,
      tradingName,
      country: countryOfInc,
      industrySector,
      registrationNumber: regNumber,
      website,
      address: {
        country,
        building,
        city,
        postalCode,
        street,
        additionalLine,
      },
    }
    setProfile(updated)
    saveStoredPortalProfile(updated)
    setIsDirty(false)
    showToast(t('portal.companyProfile.savedToast', 'Company profile changes saved successfully.'))
  }

  const handleCancel = () => {
    if (isDirty) {
      setShowDiscard(true)
    } else {
      navigate('/portal')
    }
  }

  const handleAddSite = () => {
    if (!newSiteName.trim() || !newSiteAddress.trim()) return
    const id = `SITE-00${profile.sites.length + 1}`
    const updatedSites = [...profile.sites, { id, name: newSiteName.trim(), address: newSiteAddress.trim(), status: 'Active' as const }]
    const updated = { ...profile, sites: updatedSites }
    setProfile(updated)
    saveStoredPortalProfile(updated)
    setNewSiteName('')
    setNewSiteAddress('')
    setShowAddSiteModal(false)
    showToast(t('portal.companyProfile.siteDraftToast', 'Site draft added — saved to profile.'))
  }

  const handleAddContact = () => {
    if (!newContactName.trim() || !newContactEmail.trim()) return
    const id = `CTC-00${profile.contacts.length + 1}`
    const updatedContacts = [
      ...profile.contacts,
      {
        id,
        name: newContactName.trim(),
        role: newContactRole.trim() || 'Representative',
        email: newContactEmail.trim(),
        phone: newContactPhone.trim() || '+966 50 000 0000',
        isPrimary: false,
        hasPortalAccess: true,
        isSignatory: false,
      },
    ]
    const updated = { ...profile, contacts: updatedContacts }
    setProfile(updated)
    saveStoredPortalProfile(updated)
    setNewContactName('')
    setNewContactRole('')
    setNewContactEmail('')
    setNewContactPhone('')
    setShowAddContactModal(false)
    showToast(t('portal.companyProfile.contactDraftToast', 'Contact draft added — saved to profile.'))
  }

  const handleAddDocument = () => {
    if (!newDocName.trim()) return
    const id = `DOC-00${profile.documents.length + 1}`
    const updatedDocs = [
      ...profile.documents,
      {
        id,
        name: newDocName.trim(),
        type: newDocType,
        lastUpdated: 'Today',
      },
    ]
    const updated = { ...profile, documents: updatedDocs }
    setProfile(updated)
    saveStoredPortalProfile(updated)
    setNewDocName('')
    setShowAddDocModal(false)
    showToast(t('portal.companyProfile.docUploadedToast', 'Document uploaded successfully.'))
  }

  return (
    <PortalLayout tourId="portal-profile-tour" tourSteps={tourSteps} title={t('portal.title', 'Client Portal')}>
      <div className="flex flex-col gap-5">
        {/* Top Actions & Breadcrumb Bar */}

        {/* Page Title & Top Actions Bar */}
        <CabTourStep steps={tourSteps} stepId="portal-profile-header">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-[22px] sm:text-[24px] font-bold text-neutral-900">
                {t('portal.companyProfile.title', 'Update company profile')}
              </h1>
              <p className="text-[13px] text-neutral-500 font-medium mt-1">
                {t('portal.companyProfile.subtitle', {
                  clientCode: profile.clientCode,
                  appNumber: 'APP-0024',
                  country: profile.country,
                })}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {profile.hasPendingLegalChange && (
                <button
                  type="button"
                  onClick={() => setShowPendingModal(true)}
                  className="flex items-center gap-2 rounded-[8px] bg-[#fff7ed] px-3 py-2 text-[13px] font-bold text-[#ea580c] border border-[#ffedd5] hover:bg-[#ffedd5] transition-colors"
                >
                  <span>{t('portal.companyProfile.reviewPending', 'Review pending changes')}</span>
                  <span className="flex size-5 items-center justify-center rounded-full bg-[#ea580c] text-[11px] font-bold text-white">
                    1
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCancel}
                className="h-11 rounded-[8px] border border-[#e2e2e2] bg-white px-5 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                {t('portal.companyProfile.cancel', 'Cancel')}
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="h-11 rounded-[8px] bg-primary px-6 text-[14px] font-semibold text-white hover:bg-primary/90 transition-colors shadow-sm"
              >
                {t('portal.companyProfile.saveChanges', 'Save changes')}
              </button>
            </div>
          </div>
        </CabTourStep>

        {/* Pending Changes Info Banner */}
        {profile.hasPendingLegalChange && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[12px] border border-[#bfdbfe] bg-[#eff6ff] p-4 text-[13px] text-neutral-800">
            <div className="flex items-start gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#1236a3] text-white">
                <AppIcon icon={InfoIcon} size={16} />
              </div>
              <div>
                <p className="font-bold text-neutral-900">
                  {t('portal.companyProfile.pendingBanner.title', 'There are pending changes to your legal identity.')}
                </p>
                <p className="text-neutral-600 mt-0.5">
                  {t('portal.companyProfile.pendingBanner.desc', 'Your request to update the legal name is under review. You can still update other information.')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPendingModal(true)}
              className="self-start sm:self-center shrink-0 rounded-[8px] border-2 border-primary bg-white px-4 py-2 text-[13px] font-bold text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
            >
              {t('portal.companyProfile.pendingBanner.viewDetails', 'View details')}
            </button>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex items-center gap-6 border-b border-[#e5e7eb] pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('essentials')}
            className={cn(
              'pb-3 text-[14px] font-bold transition-colors border-b-2',
              activeTab === 'essentials'
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            )}
          >
            {t('portal.companyProfile.tabs.essentials', 'Essentials')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('more')}
            className={cn(
              'pb-3 text-[14px] font-bold transition-colors border-b-2',
              activeTab === 'more'
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            )}
          >
            {t('portal.companyProfile.tabs.more', 'More details')}
          </button>
        </div>

        {/* Section 1: Logo & Company details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 4 cols: Logo Card */}
          <div className="lg:col-span-4 h-full">
            <CabTourStep steps={tourSteps} stepId="portal-profile-logo-card">
              <div className="rounded-[16px] border border-[#ececec] bg-white p-5 sm:p-6 shadow-sm space-y-4 h-full">
                <h2 className="text-[16px] font-bold text-neutral-900">
                  {t('portal.companyProfile.logo.title', 'Logo')}
                </h2>

                <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-5 pt-1">
                  {/* Logo Box */}
                  <div className="flex flex-col items-center justify-center size-32 rounded-[12px] border border-[#d8e2f8] bg-[#f4f7fd] p-3 text-center shrink-0 shadow-sm">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-[#16a34a]">
                      <path d="M24 4C24 4 12 16 12 28C12 34.6274 17.3726 40 24 40C30.6274 40 36 34.6274 36 28C36 16 24 4 24 4Z" fill="currentColor" fillOpacity="0.8"/>
                      <path d="M24 14V34M24 24L18 20M24 28L30 24" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                    <span className="text-[11px] font-extrabold uppercase tracking-tight text-neutral-800 mt-1 leading-none">
                      AL NOOR
                    </span>
                    <span className="text-[8px] text-neutral-500 font-medium tracking-tighter">
                      FOOD INDUSTRIES
                    </span>
                  </div>

                  <div className="space-y-2 text-center">
                    <button
                      type="button"
                      onClick={() => setShowLogoModal(true)}
                      className="rounded-[8px] border-2 border-primary bg-white px-4 py-2 text-[13px] font-bold text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                    >
                      {t('portal.companyProfile.logo.changeBtn', 'Change logo')}
                    </button>
                    <p>
                      <button
                        type="button"
                        onClick={() => showToast(t('portal.companyProfile.logoRequirementsToast', 'Requirements: PNG, JPG, or SVG up to 5MB. Minimum dimensions 200x200px.'))}
                        className="text-[12px] text-primary hover:underline font-medium"
                      >
                        {t('portal.companyProfile.logo.requirements', 'View upload requirements')}
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </CabTourStep>
          </div>

          {/* Right 8 cols: Company details */}
          <div className="lg:col-span-8 h-full">
            <CabTourStep steps={tourSteps} stepId="portal-profile-company-details">
              <div className="rounded-[16px] border border-[#ececec] bg-white p-5 sm:p-6 shadow-sm space-y-4 h-full">
                <h2 className="text-[16px] font-bold text-neutral-900">
                  {t('portal.companyProfile.details.title', 'Company details')}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Legal Name */}
                  <div className="space-y-1.5 sm:col-span-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[13px] font-medium text-neutral-800">
                        {t('portal.companyProfile.details.legalName', 'Legal name')}
                      </label>
                      {profile.hasPendingLegalChange && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#fff7ed] px-2 py-0.5 text-[11px] font-bold text-[#ea580c]">
                          ⏱ {t('portal.companyProfile.details.changePending', 'Change pending')}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={legalName}
                      onChange={(e) => { setLegalName(e.target.value); markDirty(); }}
                      className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-[#f9fafc] px-3.5 text-[14px] text-neutral-900 focus:border-primary focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Country of Incorporation */}
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-neutral-800">
                      {t('portal.companyProfile.details.countryOfInc', 'Country of incorporation')}
                    </label>
                    <select
                      value={countryOfInc}
                      onChange={(e) => { setCountryOfInc(e.target.value); markDirty(); }}
                      className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                    >
                      <option value="Saudi Arabia">Saudi Arabia</option>
                      <option value="United Arab Emirates">United Arab Emirates</option>
                      <option value="Egypt">Egypt</option>
                      <option value="Kuwait">Kuwait</option>
                      <option value="Qatar">Qatar</option>
                    </select>
                  </div>

                  {/* Trading Name */}
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-neutral-800">
                      {t('portal.companyProfile.details.tradingName', 'Trading name (if different)')}
                    </label>
                    <input
                      type="text"
                      value={tradingName}
                      onChange={(e) => { setTradingName(e.target.value); markDirty(); }}
                      className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Industry Sector */}
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-neutral-800">
                      {t('portal.companyProfile.details.industrySector', 'Industry sector')}
                    </label>
                    <select
                      value={industrySector}
                      onChange={(e) => { setIndustrySector(e.target.value); markDirty(); }}
                      className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                    >
                      <option value="Food Manufacturing">Food Manufacturing</option>
                      <option value="Quality Assurance">Quality Assurance</option>
                      <option value="Healthcare Systems">Healthcare Systems</option>
                      <option value="Packaging & Logistics">Packaging & Logistics</option>
                    </select>
                  </div>

                  {/* Company Registration Number */}
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-neutral-800">
                      {t('portal.companyProfile.details.regNumber', 'Company registration number')}
                    </label>
                    <input
                      type="text"
                      value={regNumber}
                      onChange={(e) => { setRegNumber(e.target.value); markDirty(); }}
                      className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Website */}
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-neutral-800">
                      {t('portal.companyProfile.details.website', 'Website')}
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => { setWebsite(e.target.value); markDirty(); }}
                      className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </CabTourStep>
          </div>
        </div>

        {/* Section 2: Main address */}
        <CabTourStep steps={tourSteps} stepId="portal-profile-main-address">
          <div className="rounded-[16px] border border-[#ececec] bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-[16px] font-bold text-neutral-900">
              {t('portal.companyProfile.address.title', 'Main address')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-neutral-800">
                  {t('portal.companyProfile.address.country', 'Country')}
                </label>
                <select
                  value={country}
                  onChange={(e) => { setCountry(e.target.value); markDirty(); }}
                  className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                >
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                  <option value="Egypt">Egypt</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-neutral-800">
                  {t('portal.companyProfile.address.building', 'Building')}
                </label>
                <input
                  type="text"
                  value={building}
                  onChange={(e) => { setBuilding(e.target.value); markDirty(); }}
                  className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-neutral-800">
                  {t('portal.companyProfile.address.city', 'City')}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => { setCity(e.target.value); markDirty(); }}
                  className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-neutral-800">
                  {t('portal.companyProfile.address.postalCode', 'Postal code')}
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => { setPostalCode(e.target.value); markDirty(); }}
                  className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-neutral-800">
                  {t('portal.companyProfile.address.street', 'Street')}
                </label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => { setStreet(e.target.value); markDirty(); }}
                  className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-neutral-800">
                  {t('portal.companyProfile.address.additionalLine', 'Additional address line')}
                </label>
                <input
                  type="text"
                  value={additionalLine}
                  onChange={(e) => { setAdditionalLine(e.target.value); markDirty(); }}
                  className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>
        </CabTourStep>

        {/* Section 3: Sites, Contacts & Documents wrapped together */}
        <CabTourStep steps={tourSteps} stepId="portal-profile-sites-contacts-docs">
          <div className="space-y-6">
            {/* Sites & branches */}
            <div className="rounded-[16px] border border-[#ececec] bg-white shadow-sm overflow-hidden space-y-0">
              <div className="flex items-center justify-between p-5 pb-4 border-b border-neutral-100">
                <h2 className="text-[16px] font-bold text-neutral-900">
                  {t('portal.companyProfile.sites.title', 'Sites & branches')}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAddSiteModal(true)}
                  className="flex items-center gap-1.5 rounded-[8px] border-2 border-primary bg-white px-3.5 py-1.5 text-[13px] font-bold text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                >
                  <span>{t('portal.companyProfile.sites.addSite', '+ Add site')}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-start text-[13px]">
                  <thead>
                    <tr className="bg-[#1236a3] text-white">
                      <th className="py-3 px-4 font-semibold text-start text-[13px]">
                        {t('portal.companyProfile.sites.colSiteId', 'Site ID')}
                      </th>
                      <th className="py-3 px-4 font-semibold text-start text-[13px]">
                        {t('portal.companyProfile.sites.colName', 'Site name')}
                      </th>
                      <th className="py-3 px-4 font-semibold text-start text-[13px]">
                        {t('portal.companyProfile.sites.colAddress', 'Address')}
                      </th>
                      <th className="py-3 px-4 font-semibold text-start text-[13px]">
                        {t('portal.companyProfile.sites.colStatus', 'Status')}
                      </th>
                      <th className="py-3 px-4 font-semibold text-end text-[13px]">
                        {t('portal.companyProfile.sites.colActions', 'Actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {profile.sites.map((site) => (
                      <tr key={site.id} className="hover:bg-[#f4f7fd] transition-colors">
                        <td className="py-3 px-4 font-semibold text-primary">{site.id}</td>
                        <td className="py-3 px-4 font-bold text-neutral-900">{site.name}</td>
                        <td className="py-3 px-4 text-neutral-600 max-w-[200px] truncate">{site.address}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center justify-center rounded-[6px] bg-[#dcfce7] px-2.5 py-1 text-[12px] font-medium text-[#15803d] whitespace-nowrap">
                            {site.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-end">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => showToast(`Editing ${site.name}`)}
                              className="rounded-[6px] border border-primary px-2.5 py-1 text-[12px] font-medium text-primary hover:bg-primary-subtle transition-colors"
                            >
                              {t('portal.companyProfile.sites.edit', 'Edit')}
                            </button>
                            <button
                              type="button"
                              onClick={() => showToast(`Options for ${site.name}`)}
                              className="text-neutral-400 hover:text-neutral-700 font-bold px-1"
                            >
                              •••
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grid for Additional contacts & Official documents */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
              {/* Additional contacts */}
              <div className="rounded-[16px] border border-[#ececec] bg-white shadow-sm overflow-hidden space-y-0">
                <div className="flex items-center justify-between p-5 pb-4 border-b border-neutral-100">
                  <h2 className="text-[16px] font-bold text-neutral-900">
                    {t('portal.companyProfile.contacts.title', 'Additional contacts')}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowAddContactModal(true)}
                    className="flex items-center gap-1.5 rounded-[8px] bg-primary px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    <span>{t('portal.companyProfile.contacts.addContact', '+ Add contact')}</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-start text-[13px]">
                    <thead>
                      <tr className="bg-[#1236a3] text-white">
                        <th className="py-3 px-4 font-semibold text-start text-[13px]">
                          {t('portal.companyProfile.contacts.colName', 'Name')}
                        </th>
                        <th className="py-3 px-4 font-semibold text-start text-[13px]">
                          {t('portal.companyProfile.contacts.colRole', 'Role')}
                        </th>
                        <th className="py-3 px-4 font-semibold text-start text-[13px]">
                          {t('portal.companyProfile.contacts.colEmail', 'Email')}
                        </th>
                        <th className="py-3 px-4 font-semibold text-start text-[13px]">
                          {t('portal.companyProfile.contacts.colPhone', 'Phone')}
                        </th>
                        <th className="py-3 px-4 font-semibold text-start text-[13px]">
                          {t('portal.companyProfile.contacts.colPrimary', 'Primary')}
                        </th>
                        <th className="py-3 px-4 font-semibold text-end text-[13px]">
                          {t('portal.companyProfile.contacts.colActions', 'Actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {profile.contacts.map((contact) => (
                        <tr key={contact.id} className="hover:bg-[#f4f7fd] transition-colors">
                          <td className="py-3 px-4 font-bold text-neutral-900">{contact.name}</td>
                          <td className="py-3 px-4 text-neutral-600">{contact.role}</td>
                          <td className="py-3 px-4">
                            <a href={`mailto:${contact.email}`} className="text-primary font-medium hover:underline">
                              {contact.email}
                            </a>
                          </td>
                          <td className="py-3 px-4 text-neutral-700 whitespace-nowrap">{contact.phone}</td>
                          <td className="py-3 px-4">
                            {contact.isPrimary && (
                              <span className="inline-flex items-center justify-center rounded-[6px] bg-[#e8edfc] px-2.5 py-1 text-[12px] font-medium text-primary whitespace-nowrap">
                                {t('portal.companyProfile.contacts.primaryBadge', 'Primary')}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-end">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => showToast(`Editing ${contact.name}`)}
                                className="rounded-[6px] border border-primary px-2.5 py-1 text-[12px] font-bold text-primary hover:bg-primary-subtle"
                              >
                                {t('portal.companyProfile.contacts.edit', 'Edit')}
                              </button>
                              <button
                                type="button"
                                onClick={() => showToast(`Options for ${contact.name}`)}
                                className="text-neutral-400 hover:text-neutral-700 font-bold px-1"
                              >
                                •••
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Official documents */}
              <div className="rounded-[16px] border border-[#ececec] bg-white shadow-sm overflow-hidden space-y-0">
                <div className="flex items-center justify-between p-5 pb-4 border-b border-neutral-100">
                  <h2 className="text-[16px] font-bold text-neutral-900">
                    {t('portal.companyProfile.docs.title', 'Official documents')}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowAddDocModal(true)}
                    className="flex items-center gap-1.5 rounded-[8px] bg-primary px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    <span>{t('portal.companyProfile.docs.addDoc', '+ Add document')}</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-start text-[13px]">
                    <thead>
                      <tr className="bg-[#1236a3] text-white">
                        <th className="py-3 px-4 font-semibold text-start text-[13px]">
                          {t('portal.companyProfile.docs.colName', 'Document name')}
                        </th>
                        <th className="py-3 px-4 font-semibold text-start text-[13px]">
                          {t('portal.companyProfile.docs.colType', 'Type')}
                        </th>
                        <th className="py-3 px-4 font-semibold text-start text-[13px]">
                          {t('portal.companyProfile.docs.colLastUpdated', 'Last updated')}
                        </th>
                        <th className="py-3 px-4 font-semibold text-end text-[13px]">
                          {t('portal.companyProfile.docs.colActions', 'Actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {profile.documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-[#f4f7fd] transition-colors">
                          <td className="py-3 px-4 font-bold text-neutral-900">{doc.name}</td>
                          <td className="py-3 px-4 text-neutral-600">{doc.type}</td>
                          <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">{doc.lastUpdated}</td>
                          <td className="py-3 px-4 text-end">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => showToast(`Viewing document ${doc.name}`)}
                                className="rounded-[6px] border border-primary px-2.5 py-1 text-[12px] font-medium text-primary hover:bg-primary-subtle transition-colors"
                              >
                                {t('portal.companyProfile.docs.view', 'View')}
                              </button>
                              <button
                                type="button"
                                onClick={() => showToast(`Options for ${doc.name}`)}
                                className="text-neutral-400 hover:text-neutral-700 font-bold px-1"
                              >
                                •••
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </CabTourStep>

        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 end-6 z-50 flex items-center gap-2 rounded-[12px] border border-[#d1fae5] bg-[#f0fdf6] px-4 py-3 text-[13px] font-medium text-[#166534] shadow-lg">
            <AppIcon icon={SuccessCircleIcon} size={16} />
            <span>{toast}</span>
          </div>
        )}

        {/* Pending Change Review Modal */}
        {showPendingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-[16px] border border-[#ececec] bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <AppIcon icon={CorrectiveActionIcon} size={18} className="text-[#ea580c]" />
                  <h3 className="text-[16px] font-bold text-neutral-900">
                    {t('portal.companyProfile.modals.pendingTitle', 'Pending Legal Identity Change')}
                  </h3>
                </div>
                <button type="button" onClick={() => setShowPendingModal(false)} className="text-neutral-400 hover:text-neutral-700">
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-[13px]">
                <p className="text-neutral-600 leading-relaxed">
                  {t('portal.companyProfile.modals.pendingDesc', 'A change to your legal organization name was submitted for review. Legal identity modifications require CAB verification to preserve audit certificate integrity.')}
                </p>

                {profile.pendingChanges.map((change) => (
                  <div key={change.id} className="rounded-[10px] border border-[#ffedd5] bg-[#fffaf5] p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-neutral-900">{change.field}</span>
                      <span className="rounded-full bg-[#fff7ed] px-2.5 py-0.5 text-[11px] font-bold text-[#ea580c]">
                        {change.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[12px]">
                      <div>
                        <span className="text-neutral-500">{t('portal.companyProfile.modals.currentVal', 'Current value:')}</span>
                        <p className="font-semibold text-neutral-800">{change.currentValue}</p>
                      </div>
                      <div>
                        <span className="text-neutral-500">{t('portal.companyProfile.modals.requestedVal', 'Requested value:')}</span>
                        <p className="font-semibold text-primary">{change.requestedValue}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-neutral-400 pt-1">
                      {t('portal.companyProfile.modals.submittedOn', { date: change.submittedAt })}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowPendingModal(false)}
                  className="rounded-[8px] bg-primary px-5 py-2.5 text-[14px] font-medium text-white hover:bg-primary/90"
                >
                  {t('portal.companyProfile.modals.close', 'Close')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Site Modal */}
        {showAddSiteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-[16px] border border-[#ececec] bg-white p-6 shadow-2xl space-y-4">
              <h3 className="text-[16px] font-bold text-neutral-900">
                {t('portal.companyProfile.modals.addSiteTitle', 'Add New Site or Branch')}
              </h3>
              <div className="space-y-3 text-[13px]">
                <div className="space-y-1">
                  <label className="font-medium text-neutral-800">
                    {t('portal.companyProfile.modals.siteName', 'Site Name *')}
                  </label>
                  <input
                    type="text"
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                    placeholder={t('portal.companyProfile.modals.siteNamePlaceholder', 'e.g. Jeddah Warehouse')}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-neutral-800">
                    {t('portal.companyProfile.modals.siteAddress', 'Address *')}
                  </label>
                  <textarea
                    rows={3}
                    value={newSiteAddress}
                    onChange={(e) => setNewSiteAddress(e.target.value)}
                    placeholder={t('portal.companyProfile.modals.siteAddressPlaceholder', 'Full street address, city, country')}
                    className="w-full rounded-[8px] border border-[#e2e2e2] bg-white p-3 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSiteModal(false)}
                  className="rounded-[8px] border border-[#e2e2e2] px-4 py-2 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  {t('portal.companyProfile.cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleAddSite}
                  disabled={!newSiteName.trim() || !newSiteAddress.trim()}
                  className="rounded-[8px] bg-primary px-5 py-2 text-[14px] font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {t('portal.companyProfile.modals.saveSite', 'Save site')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Contact Modal */}
        {showAddContactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-[16px] border border-[#ececec] bg-white p-6 shadow-2xl space-y-4">
              <h3 className="text-[16px] font-bold text-neutral-900">
                {t('portal.companyProfile.modals.addContactTitle', 'Add Additional Contact')}
              </h3>
              <div className="space-y-3 text-[13px]">
                <div className="space-y-1">
                  <label className="font-medium text-neutral-800">
                    {t('portal.companyProfile.modals.contactName', 'Full Name *')}
                  </label>
                  <input
                    type="text"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder={t('portal.companyProfile.modals.contactNamePlaceholder', 'e.g. Ahmed Mansoor')}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-neutral-800">
                    {t('portal.companyProfile.modals.contactRole', 'Role / Job Title')}
                  </label>
                  <input
                    type="text"
                    value={newContactRole}
                    onChange={(e) => setNewContactRole(e.target.value)}
                    placeholder={t('portal.companyProfile.modals.contactRolePlaceholder', 'e.g. Operations Manager')}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-neutral-800">
                    {t('portal.companyProfile.modals.contactEmail', 'Email Address *')}
                  </label>
                  <input
                    type="email"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    placeholder={t('portal.companyProfile.modals.contactEmailPlaceholder', 'ahmed@example.com')}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-neutral-800">
                    {t('portal.companyProfile.modals.contactPhone', 'Phone Number')}
                  </label>
                  <input
                    type="tel"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    placeholder={t('portal.companyProfile.modals.contactPhonePlaceholder', '+966 50 123 4567')}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(false)}
                  className="rounded-[8px] border border-[#e2e2e2] px-4 py-2 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  {t('portal.companyProfile.cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleAddContact}
                  disabled={!newContactName.trim() || !newContactEmail.trim()}
                  className="rounded-[8px] bg-primary px-5 py-2 text-[14px] font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {t('portal.companyProfile.modals.saveContact', 'Save contact')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Document Modal */}
        {showAddDocModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-[16px] border border-[#ececec] bg-white p-6 shadow-2xl space-y-4">
              <h3 className="text-[16px] font-bold text-neutral-900">
                {t('portal.companyProfile.modals.uploadDocTitle', 'Upload Official Document')}
              </h3>
              <div className="space-y-3 text-[13px]">
                <div className="space-y-1">
                  <label className="font-medium text-neutral-800">
                    {t('portal.companyProfile.modals.docName', 'Document Name *')}
                  </label>
                  <input
                    type="text"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    placeholder={t('portal.companyProfile.modals.docNamePlaceholder', 'e.g. Environmental Policy 2025')}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-neutral-800">
                    {t('portal.companyProfile.modals.docType', 'Document Type')}
                  </label>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value as any)}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                  >
                    <option value="Legal">Legal</option>
                    <option value="General">General</option>
                    <option value="Policy">Policy</option>
                    <option value="Technical">Technical</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-neutral-800">
                    {t('portal.companyProfile.modals.selectFile', 'Select File')}
                  </label>
                  <input
                    type="file"
                    className="w-full text-[13px] text-neutral-500 file:me-4 file:py-2 file:px-4 file:rounded-[8px] file:border-0 file:text-[13px] file:font-semibold file:bg-[#e8edfc] file:text-primary hover:file:bg-[#dbeafe]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="rounded-[8px] border border-[#e2e2e2] px-4 py-2 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  {t('portal.companyProfile.cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleAddDocument}
                  disabled={!newDocName.trim()}
                  className="rounded-[8px] bg-primary px-5 py-2 text-[14px] font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {t('portal.companyProfile.modals.uploadBtn', 'Upload')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Logo Modal */}
        {showLogoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-[16px] border border-[#ececec] bg-white p-6 shadow-2xl space-y-4">
              <h3 className="text-[16px] font-bold text-neutral-900">
                {t('portal.companyProfile.modals.changeLogoTitle', 'Change Company Logo')}
              </h3>
              <p className="text-[13px] text-neutral-600">
                {t('portal.companyProfile.modals.changeLogoDesc', 'Upload a clear high-resolution logo (PNG, JPG, or SVG). Maximum 5MB.')}
              </p>
              <input
                type="file"
                accept="image/*"
                className="w-full text-[13px] text-neutral-500 file:me-4 file:py-2.5 file:px-4 file:rounded-[8px] file:border-0 file:text-[13px] file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoModal(false)}
                  className="rounded-[8px] border border-[#e2e2e2] px-4 py-2 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  {t('portal.companyProfile.cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogoModal(false)
                    showToast(t('portal.companyProfile.logoUpdatedToast', 'Logo updated successfully.'))
                  }}
                  className="rounded-[8px] bg-primary px-5 py-2 text-[14px] font-medium text-white hover:bg-primary/90"
                >
                  {t('portal.companyProfile.modals.saveLogo', 'Save logo')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Discard Confirmation Dialog */}
        {showDiscard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-[16px] border border-[#ececec] bg-white p-6 shadow-2xl space-y-3">
              <h3 className="text-[16px] font-bold text-neutral-900">
                {t('portal.companyProfile.modals.discardTitle', 'Discard unsaved changes?')}
              </h3>
              <p className="text-[13px] text-neutral-600">
                {t('portal.companyProfile.modals.discardDesc', 'You have unsaved changes to your company profile. Leaving now will discard them.')}
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDiscard(false)}
                  className="rounded-[8px] border border-[#e2e2e2] px-4 py-2 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  {t('portal.companyProfile.modals.keepEditing', 'Keep editing')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscard(false)
                    navigate('/portal')
                  }}
                  className="rounded-[8px] bg-primary px-4 py-2 text-[14px] font-medium text-white hover:bg-primary/90"
                >
                  {t('portal.companyProfile.modals.discardLeave', 'Discard & leave')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}
