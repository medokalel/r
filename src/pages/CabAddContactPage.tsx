import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { createContact } from '@/lib/api/cabContactsApi'
import { cn } from '@/lib/utils'

export function CabAddContactPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Form State matching screenshot
  const [selectedClient, setSelectedClient] = useState('CL-0001')
  const [firstName, setFirstName] = useState('Sara')
  const [lastName, setLastName] = useState('Ali')
  const [email, setEmail] = useState('sara@alnoor.example')
  const [jobTitle, setJobTitle] = useState('Quality Manager')
  const [phonePrefix, setPhonePrefix] = useState('+966')
  const [phoneNumber, setPhoneNumber] = useState('50 123 4567')
  const [linkedSites, setLinkedSites] = useState<string[]>(['SITE-001'])
  const [isPrimaryContact, setIsPrimaryContact] = useState(false)
  const [isAuthorizedSignatory, setIsAuthorizedSignatory] = useState(false)
  const [inviteToPortal, setInviteToPortal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const clientsData: Record<string, { name: string; code: string; country: string }> = {
    'CL-0001': {
      name: 'Al Noor Food Industries',
      code: 'CL-0001',
      country: 'Saudi Arabia',
    },
    'CLT-2025-0148': {
      name: 'GreenLeaf Pvt. Ltd.',
      code: 'CLT-2025-0148',
      country: 'United Arab Emirates',
    },
    'CL-0019': {
      name: 'Apex Health Systems',
      code: 'CL-0019',
      country: 'Egypt',
    },
  }

  const currentClient = clientsData[selectedClient] || clientsData['CL-0001']

  const handleRemoveSite = (site: string) => {
    setLinkedSites((prev) => prev.filter((s) => s !== site))
  }

  const handleAddSite = (site: string) => {
    if (!linkedSites.includes(site)) {
      setLinkedSites((prev) => [...prev, site])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createContact({
        clientName: currentClient.name,
        clientCode: currentClient.code,
        country: currentClient.country,
        firstName,
        lastName,
        email,
        jobTitle,
        phoneNumber,
        phonePrefix,
        linkedSites,
        isPrimaryContact,
        isAuthorizedSignatory,
        inviteToPortal,
      })
      navigate('/cab/contacts')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CabLayout sidebarVariant="contacts">
      <CabHeader
        title={t('cab.contacts.addContact', 'Add contact')}
        subtitle={t('cab.contacts.subtitle', 'Create a new contact for an existing client.')}
        notificationCount={2}
      />

      <div className="flex flex-1 flex-col gap-6 overflow-auto p-6 lg:p-8">
        {/* Page Top Breadcrumb and Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <nav className="flex items-center gap-2 text-[13px] text-neutral-400 mb-1">
              <button
                type="button"
                onClick={() => navigate('/cab/contacts')}
                className="hover:text-[#1236a3] transition"
              >
                {t('cab.workspace.apps.contacts', 'Contacts')}
              </button>
              <span>›</span>
              <span className="text-[#1236a3] font-medium">{t('cab.contacts.addContact', 'Add contact')}</span>
            </nav>
            <h2 className="text-[26px] font-bold text-neutral-900 tracking-tight">
              {t('cab.contacts.addContact', 'Add contact')}
            </h2>
            <p className="text-[14px] text-neutral-500 mt-0.5">
              {t('cab.contacts.addContactSubtitle', 'Create a new contact for an existing client.')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/cab/contacts')}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[#d8dce5] bg-white px-4 py-2 text-[13px] font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>{t('cab.contacts.backToContacts', 'Back to contacts')}</span>
          </button>
        </div>

        {/* Main Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Client Association */}
          <div className="rounded-[16px] border border-[#eaedf3] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <h3 className="text-[16px] font-bold text-neutral-900 mb-4">
              {t('cab.contacts.sections.clientAssociation', 'Client association')}
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-2">
                <label className="text-[13px] font-semibold text-neutral-800">
                  {t('cab.contacts.fields.client', 'Client')} <span className="text-error-500">*</span>
                </label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full rounded-[10px] border border-[#d8dce5] bg-white px-4 py-2.5 text-[14px] text-neutral-800 focus:border-[#1236a3] focus:outline-none focus:ring-1 focus:ring-[#1236a3]"
                  required
                >
                  <option value="CL-0001">CL-0001 — Al Noor Food Industries</option>
                  <option value="CLT-2025-0148">CLT-2025-0148 — GreenLeaf Pvt. Ltd.</option>
                  <option value="CL-0019">CL-0019 — Apex Health Systems</option>
                </select>
              </div>

              {/* Client Info Preview Card */}
              <div className="lg:col-span-5 rounded-[12px] bg-[#f8fafd] border border-[#e8edfc] p-4">
                <p className="text-[15px] font-bold text-neutral-900">{currentClient.name}</p>
                <p className="text-[13px] text-neutral-500 mt-0.5">
                  {currentClient.code} &nbsp;|&nbsp; {currentClient.country}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Contact Details */}
          <div className="rounded-[16px] border border-[#eaedf3] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <h3 className="text-[16px] font-bold text-neutral-900 mb-4">
              {t('cab.contacts.sections.contactDetails', 'Contact details')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* First Name */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-neutral-800">
                  {t('cab.contacts.fields.firstName', 'First name')} <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Sara"
                  required
                  className="w-full rounded-[10px] border border-[#d8dce5] bg-white px-4 py-2.5 text-[14px] text-neutral-900 focus:border-[#1236a3] focus:outline-none focus:ring-1 focus:ring-[#1236a3]"
                />
              </div>

              {/* Last Name */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-neutral-800">
                  {t('cab.contacts.fields.lastName', 'Last name')} <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Ali"
                  required
                  className="w-full rounded-[10px] border border-[#d8dce5] bg-white px-4 py-2.5 text-[14px] text-neutral-900 focus:border-[#1236a3] focus:outline-none focus:ring-1 focus:ring-[#1236a3]"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[13px] font-semibold text-neutral-800">
                  {t('cab.contacts.fields.email', 'Email address')} <span className="text-error-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sara@alnoor.example"
                  required
                  className="w-full rounded-[10px] border border-[#d8dce5] bg-white px-4 py-2.5 text-[14px] text-neutral-900 focus:border-[#1236a3] focus:outline-none focus:ring-1 focus:ring-[#1236a3]"
                />
              </div>

              {/* Job Title */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-neutral-800">
                  {t('cab.contacts.fields.jobTitle', 'Job title')}
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Quality Manager"
                  className="w-full rounded-[10px] border border-[#d8dce5] bg-white px-4 py-2.5 text-[14px] text-neutral-900 focus:border-[#1236a3] focus:outline-none focus:ring-1 focus:ring-[#1236a3]"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-neutral-800">
                  {t('cab.contacts.fields.phoneNumber', 'Phone number')}
                </label>
                <div className="flex gap-2">
                  <select
                    value={phonePrefix}
                    onChange={(e) => setPhonePrefix(e.target.value)}
                    className="w-28 rounded-[10px] border border-[#d8dce5] bg-white px-3 py-2.5 text-[14px] text-neutral-800 focus:border-[#1236a3] focus:outline-none focus:ring-1 focus:ring-[#1236a3]"
                  >
                    <option value="+966">+966 (SA)</option>
                    <option value="+971">+971 (UAE)</option>
                    <option value="+20">+20 (EG)</option>
                    <option value="+965">+965 (KW)</option>
                    <option value="+974">+974 (QA)</option>
                  </select>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="50 123 4567"
                    className="flex-1 rounded-[10px] border border-[#d8dce5] bg-white px-4 py-2.5 text-[14px] text-neutral-900 focus:border-[#1236a3] focus:outline-none focus:ring-1 focus:ring-[#1236a3]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Additional details */}
          <div className="rounded-[16px] border border-[#eaedf3] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <h3 className="text-[16px] font-bold text-neutral-900 mb-4">
              {t('cab.contacts.sections.additionalDetails', 'Additional details')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Linked site(s) */}
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-neutral-800">
                  {t('cab.contacts.fields.linkedSites', 'Linked site(s)')}
                </label>
                <div className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-[10px] border border-[#d8dce5] bg-white p-2">
                  {linkedSites.map((site) => (
                    <span
                      key={site}
                      className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#e8edfc] px-2.5 py-1 text-[13px] font-semibold text-[#1236a3]"
                    >
                      {site}
                      <button
                        type="button"
                        onClick={() => handleRemoveSite(site)}
                        className="text-[#1236a3] hover:text-red-500 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddSite(e.target.value)
                        e.target.value = ''
                      }
                    }}
                    className="bg-transparent text-[13px] text-neutral-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">+ {t('cab.contacts.addSite', 'Add Site')}</option>
                    <option value="SITE-001">SITE-001 (Riyadh HQ)</option>
                    <option value="SITE-002">SITE-002 (Jeddah Plant)</option>
                    <option value="SITE-003">SITE-003 (Dammam Warehouse)</option>
                  </select>
                </div>
              </div>

              {/* Roles Checkboxes */}
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-neutral-800">
                  {t('cab.contacts.fields.roles', 'Roles')}
                </label>
                <div className="space-y-2.5 pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPrimaryContact}
                      onChange={(e) => setIsPrimaryContact(e.target.checked)}
                      className="size-4 rounded border-neutral-300 text-[#1236a3] focus:ring-[#1236a3]"
                    />
                    <span className="text-[14px] text-neutral-700">
                      {t('cab.contacts.roles.primaryContact', 'Primary contact')}
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAuthorizedSignatory}
                      onChange={(e) => setIsAuthorizedSignatory(e.target.checked)}
                      className="size-4 rounded border-neutral-300 text-[#1236a3] focus:ring-[#1236a3]"
                    />
                    <span className="text-[14px] text-neutral-700">
                      {t('cab.contacts.roles.authorizedSignatory', 'Authorized signatory')}
                    </span>
                  </label>
                </div>
              </div>

              {/* Invite to portal toggle */}
              <div className="md:col-span-2 pt-2 border-t border-neutral-100">
                <label className="text-[13px] font-semibold text-neutral-800 block mb-2">
                  {t('cab.contacts.fields.inviteToPortal', 'Invite to portal (optional)')}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={inviteToPortal}
                    onClick={() => setInviteToPortal((prev) => !prev)}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                      inviteToPortal ? 'bg-[#1236a3]' : 'bg-neutral-300'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                        inviteToPortal ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                  <div>
                    <p className="text-[14px] font-medium text-neutral-800">
                      {inviteToPortal ? t('common.on', 'On') : t('common.off', 'Off')}
                    </p>
                    <p className="text-[12px] text-neutral-500">
                      {t('cab.contacts.inviteDesc', 'Send an invitation email to allow this contact to access the client portal.')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/cab/contacts')}
              className="rounded-[10px] border border-[#d8dce5] bg-white px-5 py-2.5 text-[14px] font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[10px] bg-[#1236a3] px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#0e2a80] active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? t('common.saving', 'Saving...') : t('cab.contacts.saveContact', 'Save contact')}
            </button>
          </div>
        </form>
      </div>
    </CabLayout>
  )
}
