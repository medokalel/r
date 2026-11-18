import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/Select'
import {
  AppIcon,
  BuildingsIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  WalletIcon,
} from '@/components/icons'
import {
  createSalesLead,
  getSalesHubLeadById,
  LEAD_OWNERS,
  LEAD_SOURCES,
  updateSalesLead,
  type LeadSource,
} from '@/lib/api/cabSalesHubApi'
import { ROUTES } from '@/lib/routes'

function Chevron() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-neutral-400 rtl-flip"
      aria-hidden
    >
      <path
        d="M9 18L15 12L9 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CabAddLeadPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { leadId } = useParams<{ leadId?: string }>()
  const isEditMode = Boolean(leadId)

  const [companyName, setCompanyName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [sector, setSector] = useState('')
  const [standardsText, setStandardsText] = useState('ISO 9001:2015')
  const [employees, setEmployees] = useState('50')
  const [sites, setSites] = useState('1')
  const [estimatedValueSar, setEstimatedValueSar] = useState('')
  const [source, setSource] = useState<LeadSource>('Added by team')
  const [owner, setOwner] = useState<string>('Unassigned')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!leadId) return
    const existing = getSalesHubLeadById(leadId)
    if (!existing) return
    setCompanyName(existing.companyName)
    setContactPerson(existing.contactPerson)
    setEmail(existing.email)
    setPhone(existing.phone)
    setCity(existing.city)
    setSector(existing.sector)
    setStandardsText(existing.standards.join(', '))
    setEmployees(String(existing.employees))
    setSites(String(existing.sites))
    setEstimatedValueSar(String(existing.estimatedValueSar))
    setSource(existing.source)
    setOwner(existing.owner)
  }, [leadId])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!companyName.trim()) {
      setFormError(
        t('cab.salesHub.modal.companyNameRequired', 'Company name is required'),
      )
      return
    }

    const payload = {
      companyName,
      contactPerson,
      email,
      phone,
      city,
      sector,
      standardsText,
      employees: Number(employees) || 1,
      sites: Number(sites) || 1,
      estimatedValueSar: Number(estimatedValueSar) || 0,
      source,
      owner,
    }

    if (leadId) {
      updateSalesLead(leadId, payload)
    } else {
      createSalesLead(payload)
    }

    navigate(ROUTES.cabSalesHub)
  }

  const parsedStandards = standardsText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const pageTitle = isEditMode
    ? t('cab.salesHub.editLeadTitle', 'Edit lead')
    : t('cab.salesHub.modal.title', 'New lead')

  return (
    <CabLayout>
      <CabHeader
        title={pageTitle}
        subtitle={t(
          'cab.salesHub.subtitle',
          'Every lead in one place, from client registration to a signed certification agreement.',
        )}
        notificationCount={3}
      />

      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        {/* Breadcrumb */}
        <nav
          className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]"
          aria-label="breadcrumb"
        >
          <Link
            to={ROUTES.workspace}
            className="font-light text-neutral-400 hover:text-primary"
          >
            {t('cab.salesHub.breadcrumbWorkspace', 'Workspace')}
          </Link>
          <Chevron />
          <Link
            to={ROUTES.cabSalesHub}
            className="font-light text-neutral-400 hover:text-primary"
          >
            {t('cab.salesHub.title', 'Sales Hub')}
          </Link>
          <Chevron />
          <span className="font-medium text-neutral-700">{pageTitle}</span>
        </nav>

        {/* Page Header Bar */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-[28px] font-bold leading-tight text-neutral-900">
              {pageTitle}
            </h1>
            <p className="mt-1 text-[14px] text-neutral-500">
              {t(
                'cab.salesHub.newLeadSubtitle',
                'Register organization details, certification scope, and commercial estimate.',
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(ROUTES.cabSalesHub)}
            className="flex h-11 items-center gap-2 rounded-[8px] border border-[#e2e2e2] bg-white px-4 text-[14px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="rtl-flip"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>{t('cab.salesHub.backToSalesHub', 'Back to Sales Hub')}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          {/* Form Columns */}
          <div className="flex flex-col gap-5 xl:col-span-8">
            {/* Section 1: Organization & Contact Details */}
            <section className="rounded-[16px] border border-[#ececec] bg-white p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-2.5 border-b border-[#f0f0f0] pb-3.5">
                <span className="flex size-9 items-center justify-center rounded-[10px] bg-[#dbeafe] text-[#1447e6]">
                  <AppIcon icon={BuildingsIcon} size={18} />
                </span>
                <div>
                  <h2 className="text-[16px] font-bold text-neutral-900">
                    {t(
                      'cab.salesHub.sections.organizationContact',
                      'Organization & contact information',
                    )}
                  </h2>
                  <p className="text-[12px] text-neutral-500">
                    {t(
                      'cab.salesHub.sections.organizationContactHint',
                      'Primary company identity and contact representative.',
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="lead-company-name"
                    className="text-[13px] font-medium text-neutral-800"
                  >
                    {t('cab.salesHub.modal.companyName', 'Company name')}{' '}
                    <span className="text-error-500">*</span>
                  </label>
                  <input
                    id="lead-company-name"
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value)
                      if (formError) setFormError('')
                    }}
                    placeholder="e.g. Al Noor Foods Co."
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                  />
                  {formError && (
                    <p className="text-[12px] text-error-500">{formError}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="lead-contact-person"
                    className="text-[13px] font-medium text-neutral-800"
                  >
                    {t('cab.salesHub.modal.contactPerson', 'Contact person')}
                  </label>
                  <input
                    id="lead-contact-person"
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Tariq Al-Ghamdi"
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="lead-email"
                    className="text-[13px] font-medium text-neutral-800"
                  >
                    {t('cab.salesHub.modal.email', 'Email')}
                  </label>
                  <input
                    id="lead-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@company.sa"
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="lead-phone"
                    className="text-[13px] font-medium text-neutral-800"
                  >
                    {t('cab.salesHub.modal.phone', 'Phone')}
                  </label>
                  <input
                    id="lead-phone"
                    type="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+966 50 000 0000"
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="lead-city"
                    className="text-[13px] font-medium text-neutral-800"
                  >
                    {t('cab.salesHub.modal.city', 'City')}
                  </label>
                  <input
                    id="lead-city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Riyadh, Jeddah, Dammam"
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="lead-sector"
                    className="text-[13px] font-medium text-neutral-800"
                  >
                    {t('cab.salesHub.modal.sector', 'Sector')}
                  </label>
                  <input
                    id="lead-sector"
                    type="text"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    placeholder="e.g. Food & Beverage, Manufacturing"
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Section 2: Certification Scope & Commercial Estimate */}
            <section className="rounded-[16px] border border-[#ececec] bg-white p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-2.5 border-b border-[#f0f0f0] pb-3.5">
                <span className="flex size-9 items-center justify-center rounded-[10px] bg-[#d7f4f0] text-[#0f9488]">
                  <AppIcon icon={WalletIcon} size={18} />
                </span>
                <div>
                  <h2 className="text-[16px] font-bold text-neutral-900">
                    {t(
                      'cab.salesHub.sections.scopeCommercial',
                      'Scope, sizing & commercial ownership',
                    )}
                  </h2>
                  <p className="text-[12px] text-neutral-500">
                    {t(
                      'cab.salesHub.sections.scopeCommercialHint',
                      'Standards requested, site headcount, estimated deal value and assigned owner.',
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="lead-standards"
                    className="text-[13px] font-medium text-neutral-800"
                  >
                    {t(
                      'cab.salesHub.modal.standards',
                      'Standards (comma separated)',
                    )}
                  </label>
                  <input
                    id="lead-standards"
                    type="text"
                    value={standardsText}
                    onChange={(e) => setStandardsText(e.target.value)}
                    placeholder="ISO 9001:2015, ISO 14001:2015"
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="lead-employees"
                    className="text-[13px] font-medium text-neutral-800"
                  >
                    {t('cab.salesHub.modal.employees', 'Employees')}
                  </label>
                  <input
                    id="lead-employees"
                    type="number"
                    min={1}
                    value={employees}
                    onChange={(e) => setEmployees(e.target.value)}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="lead-sites"
                    className="text-[13px] font-medium text-neutral-800"
                  >
                    {t('cab.salesHub.modal.sites', 'Sites')}
                  </label>
                  <input
                    id="lead-sites"
                    type="number"
                    min={1}
                    value={sites}
                    onChange={(e) => setSites(e.target.value)}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="lead-estimated-value"
                    className="text-[13px] font-medium text-neutral-800"
                  >
                    {t(
                      'cab.salesHub.modal.estimatedValue',
                      'Estimated value (SAR)',
                    )}
                  </label>
                  <input
                    id="lead-estimated-value"
                    type="number"
                    min={0}
                    value={estimatedValueSar}
                    onChange={(e) => setEstimatedValueSar(e.target.value)}
                    placeholder="0"
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-800">
                    {t('cab.salesHub.modal.source', 'Source')}
                  </label>
                  <SelectField
                    value={source}
                    onChange={(val) => setSource(val as LeadSource)}
                    options={LEAD_SOURCES.map((s) => ({ value: s, label: s }))}
                    className="h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-neutral-800">
                    {t('cab.salesHub.modal.owner', 'Owner')}
                  </label>
                  <SelectField
                    value={owner}
                    onChange={setOwner}
                    options={LEAD_OWNERS.map((o) => ({ value: o, label: o }))}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#f0f0f0] pt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(ROUTES.cabSalesHub)}
                  className="h-11 px-5 text-[14px]"
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="h-11 px-6 text-[14px]"
                >
                  {t('common.save', 'Save')}
                </Button>
              </div>
            </section>
          </div>

          {/* Right Summary Preview Card (iCASCO Standard Pattern) */}
          <div className="flex flex-col gap-5 xl:col-span-4">
            <aside className="rounded-[16px] border border-[#ececec] bg-white p-5">
              <h3 className="text-[15px] font-bold text-neutral-900">
                {t('cab.salesHub.leadPreviewTitle', 'Lead summary preview')}
              </h3>

              <div className="mt-4 rounded-[12px] border border-[#c5d7fa] bg-[#e8edfc]/40 p-4">
                <span className="inline-flex items-center rounded-[4px] bg-[#e8edfc] px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  1. {t('cab.salesHub.stages.new_lead.label', 'New lead')}
                </span>
                <p className="mt-2 text-[16px] font-bold text-neutral-900">
                  {companyName.trim() ||
                    t('cab.salesHub.untitledCompany', 'Organization name')}
                </p>
                <p className="mt-0.5 text-[13px] text-neutral-500">
                  {sector.trim() || t('cab.salesHub.modal.sector', 'Sector')}
                </p>

                <div className="mt-4 space-y-2 border-t border-[#c5d7fa]/60 pt-3 text-[13px] text-neutral-700">
                  <div className="flex items-center gap-2">
                    <AppIcon
                      icon={UserIcon}
                      size={15}
                      className="text-primary"
                    />
                    <span>{contactPerson.trim() || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AppIcon
                      icon={MailIcon}
                      size={15}
                      className="text-primary"
                    />
                    <span className="truncate">{email.trim() || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AppIcon
                      icon={PhoneIcon}
                      size={15}
                      className="text-primary"
                    />
                    <span dir="ltr">{phone.trim() || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AppIcon
                      icon={MapPinIcon}
                      size={15}
                      className="text-primary"
                    />
                    <span>
                      {city.trim() || '—'} · {Number(sites) || 1}{' '}
                      {t('cab.salesHub.sitesLabel', 'sites')} ·{' '}
                      {Number(employees) || 1}{' '}
                      {t('cab.salesHub.employeesLabel', 'employees')}
                    </span>
                  </div>
                </div>

                {parsedStandards.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {parsedStandards.map((std) => (
                      <span
                        key={std}
                        className="rounded-[4px] bg-white px-2.5 py-0.5 text-[11px] font-semibold text-primary shadow-2xs"
                      >
                        {std}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-[#c5d7fa]/60 pt-3">
                  <span className="text-[12px] text-neutral-600">
                    {t(
                      'cab.salesHub.modal.estimatedValue',
                      'Estimated value (SAR)',
                    )}
                  </span>
                  <span className="text-[15px] font-bold text-primary">
                    {(Number(estimatedValueSar) || 0).toLocaleString()}{' '}
                    {t('cab.salesHub.currencySar', 'SAR')}
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </main>
    </CabLayout>
  )
}
