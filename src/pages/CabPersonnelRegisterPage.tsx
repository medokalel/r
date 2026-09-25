import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { usePersonnelTourSteps } from '@/config/personnelTourSteps'
import { useDirection } from '@/context/DirectionContext'
import {
  AppIcon,
  SearchIcon,
  ExportIcon,
  ChevronDownIcon,
  PlusIcon,
  UserIcon,
} from '@/components/icons'
import {
  getStoredPersonnel,
  savePersonnelList,
  type CompetencePerson,
} from '@/lib/api/cabCompetenceApi'
import { cn } from '@/lib/utils'

export function CabPersonnelRegisterPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { dir } = useDirection()
  const tourSteps = usePersonnelTourSteps()
  const [personnel, setPersonnel] = useState<CompetencePerson[]>(getStoredPersonnel())

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [selectedExpiry, setSelectedExpiry] = useState('ALL')

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // New Person Form State
  const [newPerson, setNewPerson] = useState({
    name: '',
    role: 'Auditor' as CompetencePerson['role'],
    country: 'Saudi Arabia',
    scheme: 'ISO 9001',
    authorizedScope: 'Quality management systems',
    email: '',
    phone: '',
    expiryDate: '2026-12-31',
  })

  // Unique country list
  const countries = useMemo(() => {
    const set = new Set<string>()
    personnel.forEach((p) => {
      if (p.country) set.add(p.country)
    })
    return Array.from(set)
  }, [personnel])

  // Filtered personnel
  const filteredPersonnel = useMemo(() => {
    return personnel.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = p.name.toLowerCase().includes(q)
        const matchCode = p.code.toLowerCase().includes(q)
        const matchScope = p.authorizedScope.toLowerCase().includes(q)
        if (!matchName && !matchCode && !matchScope) return false
      }
      if (selectedCountry !== 'ALL' && p.country !== selectedCountry) return false
      if (selectedStatus !== 'ALL' && p.status !== selectedStatus) return false
      if (selectedExpiry !== 'ALL') {
        const exp = new Date(p.expiryDate).getTime()
        const now = new Date().getTime()
        if (selectedExpiry === '30' && exp - now > 30 * 86400000) return false
        if (selectedExpiry === '90' && exp - now > 90 * 86400000) return false
      }
      return true
    })
  }, [personnel, searchQuery, selectedCountry, selectedStatus, selectedExpiry])

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedCountry('ALL')
    setSelectedStatus('ALL')
    setSelectedExpiry('ALL')
  }

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPerson.name.trim()) return

    const newCode = `PER-000${personnel.length + 1}`
    const created: CompetencePerson = {
      id: `per-${Date.now()}`,
      code: newCode,
      name: newPerson.name.trim(),
      role: newPerson.role,
      country: newPerson.country,
      schemes: [newPerson.scheme],
      authorizedScope: newPerson.authorizedScope,
      expiryDate: newPerson.expiryDate,
      status: 'Under review',
      email: newPerson.email || `${newPerson.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      phone: newPerson.phone || '+966 50 000 0000',
      statusDot: 'Active',
      evaluation: {
        scheme: newPerson.scheme,
        proposedSector: newPerson.authorizedScope,
        evaluationDate: new Date().toISOString().split('T')[0],
        evaluator: 'Sara Ali',
        overallResult: 'Competent',
        comments: 'Initial application submitted for review.',
        highestQualification: "Bachelor's Degree",
        fieldOfStudy: 'Engineering',
        relevantExperienceYears: 3,
        sectorExperienceYears: 2,
        additionalNotes: '',
        status: 'In progress',
        lastSaved: new Date().toLocaleDateString('en-GB') + ', 10:00',
      },
      trainings: [],
      auditLogs: [],
      witnessings: [],
      restrictions: [],
    }

    const updated = [created, ...personnel]
    setPersonnel(updated)
    savePersonnelList(updated)
    setIsAddModalOpen(false)
    setNewPerson({
      name: '',
      role: 'Auditor',
      country: 'Saudi Arabia',
      scheme: 'ISO 9001',
      authorizedScope: 'Quality management systems',
      email: '',
      phone: '',
      expiryDate: '2026-12-31',
    })
  }

  const handleExport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Code,Name,Role,Country,Schemes,Authorized Scope,Expiry Date,Status']
        .concat(
          filteredPersonnel.map(
            (p) =>
              `"${p.code}","${p.name}","${p.role}","${p.country}","${p.schemes.join('; ')}","${p.authorizedScope}","${p.expiryDate}","${p.status}"`
          )
        )
        .join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `personnel_register_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusBadge = (status: CompetencePerson['status']) => {
    switch (status) {
      case 'Authorized':
        return (
          <span className="inline-flex items-center justify-center rounded-[4px] bg-[#dcfce7] px-3 py-1 text-[12px] font-medium text-[#15803d] whitespace-nowrap">
            {t('cab.competence.statuses.authorized', 'Authorized')}
          </span>
        )
      case 'Under review':
        return (
          <span className="inline-flex items-center justify-center rounded-[4px] bg-[#fff7ed] px-3 py-1 text-[12px] font-medium text-[#ea580c] whitespace-nowrap">
            {t('cab.competence.statuses.underReview', 'Under review')}
          </span>
        )
      case 'Pending':
        return (
          <span className="inline-flex items-center justify-center rounded-[4px] bg-[#e8edfc] px-3 py-1 text-[12px] font-medium text-primary whitespace-nowrap">
            {t('cab.competence.statuses.pending', 'Pending')}
          </span>
        )
      case 'Expired':
        return (
          <span className="inline-flex items-center justify-center rounded-[4px] bg-[#fee2e2] px-3 py-1 text-[12px] font-medium text-[#dc2626] whitespace-nowrap">
            {t('cab.competence.statuses.expired', 'Expired')}
          </span>
        )
      case 'Suspended':
        return (
          <span className="inline-flex items-center justify-center rounded-[4px] bg-[#f1f5f9] px-3 py-1 text-[12px] font-medium text-[#475569] whitespace-nowrap">
            {t('cab.competence.statuses.suspended', 'Suspended')}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center justify-center rounded-[4px] bg-neutral-100 px-3 py-1 text-[12px] font-medium text-neutral-700 whitespace-nowrap">
            {status}
          </span>
        )
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <CabLayout sidebarVariant="competence" tourId="personnel-register-tour" tourSteps={tourSteps}>
      <CabHeader title={t('cab.competence.title', 'Competence Register')} notificationCount={3} />

      <main className="flex-1 bg-[#f9fafc] p-3 sm:p-5 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
          {/* Breadcrumbs & Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CabTourStep steps={tourSteps} stepId="personnel-header">
              <div>
                <div className="flex items-center gap-2 text-[13px] font-medium text-neutral-500 mb-1">
                  <span className="text-primary font-semibold">{t('cab.competence.title', 'Competence')}</span>
                  <span className="text-neutral-300">/</span>
                  <span className="text-neutral-700">{t('cab.competence.personnelRegister', 'Personnel register')}</span>
                </div>
                <h1 className="text-[20px] sm:text-[24px] font-bold text-neutral-900 tracking-tight">
                  {t('cab.competence.personnelRegister', 'Personnel register')}
                </h1>
                <p className="mt-1 text-[13px] text-neutral-500">
                  {t('cab.competence.subtitle', 'Manage personnel, their roles, scheme authorizations and expiry dates.')}
                </p>
              </div>
            </CabTourStep>

            <CabTourStep steps={tourSteps} stepId="personnel-actions">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-[8px] bg-primary px-4 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:bg-primary/90 transition-all active:scale-[0.99] whitespace-nowrap"
                >
                  <AppIcon icon={PlusIcon} size={16} />
                  <span>+ {t('cab.competence.addPerson', 'Add person')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExport}
                  className="flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-[8px] border border-[#e2e2e2] bg-white px-4 py-2.5 text-[14px] font-semibold text-neutral-700 hover:bg-neutral-50 transition-all shadow-sm active:scale-[0.99] whitespace-nowrap"
                >
                  <AppIcon icon={ExportIcon} size={16} />
                  <span>{t('common.export', 'Export')}</span>
                </button>
              </div>
            </CabTourStep>
          </div>

          {/* Filter Bar Card */}
          <CabTourStep steps={tourSteps} stepId="personnel-filters">
            <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-3.5 sm:p-4 shadow-none">
              <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
                {/* Search */}
                <div className="sm:col-span-2 lg:col-span-2">
                  <label className="block text-[13px] font-semibold text-neutral-700 mb-1.5">
                    {t('cab.competence.fullName', 'Name / Personnel code')}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('cab.competence.searchPlaceholder', 'Search by name or code...')}
                      className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white ps-10 pe-4 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                    />
                    <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-neutral-400">
                      <AppIcon icon={SearchIcon} size={18} />
                    </div>
                  </div>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-[13px] font-semibold text-neutral-700 mb-1.5">
                    {t('cab.competence.country', 'Country')}
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="h-11 w-full appearance-none rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 pe-9 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                    >
                      <option value="ALL">{t('cab.competence.allCountries', 'All countries')}</option>
                      {countries.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-neutral-400">
                      <AppIcon icon={ChevronDownIcon} size={16} />
                    </div>
                  </div>
                </div>

                {/* Authorization Status */}
                <div>
                  <label className="block text-[13px] font-semibold text-neutral-700 mb-1.5">
                    {t('cab.competence.authorizationStatus', 'Authorization status')}
                  </label>
                  <div className="relative">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="h-11 w-full appearance-none rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 pe-9 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                    >
                      <option value="ALL">{t('cab.competence.allStatuses', 'All statuses')}</option>
                      <option value="Authorized">{t('cab.competence.statuses.authorized', 'Authorized')}</option>
                      <option value="Under review">{t('cab.competence.statuses.underReview', 'Under review')}</option>
                      <option value="Pending">{t('cab.competence.statuses.pending', 'Pending')}</option>
                      <option value="Expired">{t('cab.competence.statuses.expired', 'Expired')}</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-neutral-400">
                      <AppIcon icon={ChevronDownIcon} size={16} />
                    </div>
                  </div>
                </div>

                {/* Expiry Period + Clear */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex-1">
                    <label className="block text-[13px] font-semibold text-neutral-700 mb-1.5">
                      {t('cab.competence.expiryPeriod', 'Expiry period')}
                    </label>
                    <div className="relative">
                      <select
                        value={selectedExpiry}
                        onChange={(e) => setSelectedExpiry(e.target.value)}
                        className="h-11 w-full appearance-none rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 pe-9 text-[14px] text-neutral-900 focus:border-primary focus:outline-none"
                      >
                        <option value="ALL">{t('cab.competence.allPeriods', 'All periods')}</option>
                        <option value="30">{t('cab.competence.expiring30', 'Expiring in 30 days')}</option>
                        <option value="90">{t('cab.competence.expiring90', 'Expiring in 90 days')}</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-neutral-400">
                        <AppIcon icon={ChevronDownIcon} size={16} />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="h-11 shrink-0 px-3 text-[14px] font-semibold text-primary hover:underline transition-colors"
                  >
                    {t('common.clear', 'Clear')}
                  </button>
                </div>
              </div>
            </div>
          </CabTourStep>

          {/* Table Count Header */}
          <div className="text-[14px] font-medium text-neutral-600">
            {t('cab.competence.personnelCount', { count: filteredPersonnel.length })}
          </div>

          {/* Personnel Table & Mobile Card View */}
          <CabTourStep steps={tourSteps} stepId="personnel-table">
            {/* Desktop / Tablet Table View (hidden on small mobile screens) */}
            <div className="hidden md:block overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-white shadow-none">
              <div className="overflow-x-auto">
                <table className="w-full text-start text-[14px]">
                  <thead>
                    <tr className="bg-[#1236a3] text-white text-start text-[14px] font-semibold">
                      <th className="p-[18px] text-start font-medium">{t('cab.competence.columns.person', 'Person')}</th>
                      <th className="p-[18px] text-start font-medium">{t('cab.competence.columns.role', 'Role')}</th>
                      <th className="p-[18px] text-start font-medium">{t('cab.competence.columns.schemes', 'Schemes')}</th>
                      <th className="p-[18px] text-start font-medium">{t('cab.competence.columns.scope', 'Authorized scope')}</th>
                      <th className="p-[18px] text-center font-medium">{t('cab.competence.columns.expiry', 'Expiry')}</th>
                      <th className="p-[18px] text-center font-medium">{t('cab.competence.columns.status', 'Status')}</th>
                      <th className="p-[18px] text-center font-medium">{t('common.actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ececec]">
                    {filteredPersonnel.length > 0 ? (
                      filteredPersonnel.map((p, idx) => (
                        <tr
                          key={p.id}
                          className={cn('hover:bg-[#e8edfc]/50 transition-colors cursor-pointer', idx % 2 === 1 ? 'bg-[#f9fafc]' : 'bg-white')}
                          onClick={() => navigate(`/cab/competence/persons/${p.id}/evaluation`)}
                        >
                          {/* Person Column */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3.5">
                              <div className="flex size-10 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white shadow-sm shrink-0">
                                {getInitials(p.name)}
                              </div>
                              <div>
                                <p className="font-bold text-neutral-900 hover:text-primary transition-colors">
                                  {p.name}
                                </p>
                                <p className="text-[12px] text-neutral-500 font-mono">{p.code}</p>
                              </div>
                            </div>
                          </td>

                          {/* Role Column */}
                          <td className="px-4 py-4 text-neutral-800 font-medium">{p.role}</td>

                          {/* Schemes Column */}
                          <td className="px-4 py-4 text-neutral-800 font-medium">
                            {p.schemes.join(', ')}
                          </td>

                          {/* Scope Column */}
                          <td className="px-4 py-4 text-neutral-800 font-medium max-w-xs">
                            {p.authorizedScope}
                          </td>

                          {/* Expiry Column */}
                          <td className="px-4 py-4 text-neutral-800 font-medium text-center whitespace-nowrap">
                            {p.expiryDate}
                          </td>

                          {/* Status Column */}
                          <td className="px-4 py-4 text-center whitespace-nowrap">{getStatusBadge(p.status)}</td>

                          {/* Actions Column (Radix Dropdown with Portal) */}
                          <td
                            className="px-4 py-4 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu.Root dir={dir}>
                              <DropdownMenu.Trigger asChild>
                                {idx === 0 ? (
                                  <div className="inline-block">
                                    <CabTourStep steps={tourSteps} stepId="personnel-eval-action">
                                      <button
                                        type="button"
                                        className="flex size-8 mx-auto items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-500 focus:outline-none transition-colors"
                                        aria-label="Actions"
                                      >
                                        <span className="text-[18px] font-bold leading-none">···</span>
                                      </button>
                                    </CabTourStep>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    className="flex size-8 mx-auto items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-500 focus:outline-none transition-colors"
                                    aria-label="Actions"
                                  >
                                    <span className="text-[18px] font-bold leading-none">···</span>
                                  </button>
                                )}
                              </DropdownMenu.Trigger>

                              <DropdownMenu.Portal>
                                <DropdownMenu.Content
                                  align="end"
                                  sideOffset={4}
                                  className="z-50 min-w-[190px] rounded-[8px] border border-[#e5e7eb] bg-white py-1 shadow-xl animate-in fade-in-50 zoom-in-95"
                                >
                                  <DropdownMenu.Item
                                    onSelect={() => navigate(`/cab/competence/persons/${p.id}/evaluation`)}
                                    className="cursor-pointer px-4 py-2 text-[13px] font-medium text-neutral-700 outline-none hover:bg-neutral-50 focus:bg-neutral-50"
                                  >
                                    {t('cab.competence.evaluateCompetence', 'Evaluate competence')}
                                  </DropdownMenu.Item>
                                  <DropdownMenu.Item
                                    onSelect={() => navigate(`/cab/competence/persons/${p.id}/evaluation`)}
                                    className="cursor-pointer px-4 py-2 text-[13px] font-medium text-neutral-700 outline-none hover:bg-neutral-50 focus:bg-neutral-50"
                                  >
                                    {t('cab.competence.viewProfile', 'View profile')}
                                  </DropdownMenu.Item>
                                  <DropdownMenu.Item
                                    onSelect={() => navigate(`/cab/competence/persons/${p.id}/evaluation`)}
                                    className="cursor-pointer px-4 py-2 text-[13px] font-medium text-neutral-700 outline-none hover:bg-neutral-50 focus:bg-neutral-50"
                                  >
                                    {t('cab.competence.editAuthorizations', 'Edit authorizations')}
                                  </DropdownMenu.Item>
                                </DropdownMenu.Content>
                              </DropdownMenu.Portal>
                            </DropdownMenu.Root>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-neutral-500">
                          {t('cab.competence.noPersonnel', 'No personnel records match the current filters.')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards View (displayed on mobile screens < md) */}
            <div className="block md:hidden space-y-3">
              {filteredPersonnel.length > 0 ? (
                filteredPersonnel.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/cab/competence/persons/${p.id}/evaluation`)}
                    className="rounded-[12px] border border-[#e5e7eb] bg-white p-4 shadow-xs space-y-3 cursor-pointer hover:border-primary transition-all active:scale-[0.99]"
                  >
                    {/* Top Row: Avatar, Name, Code & Dropdown */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white shadow-sm shrink-0">
                          {getInitials(p.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-neutral-900 truncate">{p.name}</p>
                          <p className="text-[12px] text-neutral-500 font-mono">{p.code}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {getStatusBadge(p.status)}
                        <DropdownMenu.Root dir={dir}>
                          <DropdownMenu.Trigger asChild>
                            <button
                              type="button"
                              className="flex size-8 items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-500 focus:outline-none"
                              aria-label="Actions"
                            >
                              <span className="text-[18px] font-bold leading-none">···</span>
                            </button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Portal>
                            <DropdownMenu.Content
                              align="end"
                              sideOffset={4}
                              className="z-50 min-w-[190px] rounded-[8px] border border-[#e5e7eb] bg-white py-1 shadow-xl animate-in fade-in-50 zoom-in-95"
                            >
                              <DropdownMenu.Item
                                onSelect={() => navigate(`/cab/competence/persons/${p.id}/evaluation`)}
                                className="cursor-pointer px-4 py-2 text-[13px] font-medium text-neutral-700 outline-none hover:bg-neutral-50"
                              >
                                {t('cab.competence.evaluateCompetence', 'Evaluate competence')}
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                onSelect={() => navigate(`/cab/competence/persons/${p.id}/evaluation`)}
                                className="cursor-pointer px-4 py-2 text-[13px] font-medium text-neutral-700 outline-none hover:bg-neutral-50"
                              >
                                {t('cab.competence.viewProfile', 'View profile')}
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                onSelect={() => navigate(`/cab/competence/persons/${p.id}/evaluation`)}
                                className="cursor-pointer px-4 py-2 text-[13px] font-medium text-neutral-700 outline-none hover:bg-neutral-50"
                              >
                                {t('cab.competence.editAuthorizations', 'Edit authorizations')}
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      </div>
                    </div>

                    {/* Role & Scope */}
                    <div className="grid grid-cols-2 gap-2 text-[13px] pt-1 border-t border-[#f3f4f6]">
                      <div>
                        <span className="text-neutral-400 block text-[11px] font-medium uppercase tracking-wide">
                          {t('cab.competence.columns.role', 'Role')}
                        </span>
                        <span className="font-semibold text-neutral-800">{p.role}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[11px] font-medium uppercase tracking-wide">
                          {t('cab.competence.columns.expiry', 'Expiry')}
                        </span>
                        <span className="font-semibold text-neutral-800">{p.expiryDate}</span>
                      </div>
                    </div>

                    {/* Schemes & Scope */}
                    <div className="text-[13px] space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-neutral-400 text-[11px] font-medium uppercase tracking-wide me-1">
                          {t('cab.competence.columns.schemes', 'Schemes')}:
                        </span>
                        {p.schemes.map((s) => (
                          <span key={s} className="rounded-[4px] bg-[#e8edfc] px-2 py-0.5 text-[11px] font-medium text-primary">
                            {s}
                          </span>
                        ))}
                      </div>
                      <p className="text-[12px] text-neutral-600 line-clamp-2">
                        <span className="font-medium text-neutral-700">{t('cab.competence.columns.scope', 'Scope')}: </span>
                        {p.authorizedScope}
                      </p>
                    </div>

                    {/* Mobile Action Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/cab/competence/persons/${p.id}/evaluation`)
                        }}
                        className="w-full flex items-center justify-center gap-2 rounded-[8px] bg-[#f0f4fd] hover:bg-[#e8edfc] text-primary text-[13px] font-semibold py-2 transition-colors"
                      >
                        <AppIcon icon={UserIcon} size={14} />
                        <span>{t('cab.competence.evaluateCompetence', 'Evaluate competence')}</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-8 text-center text-neutral-500">
                  {t('cab.competence.noPersonnel', 'No personnel records match the current filters.')}
                </div>
              )}
            </div>
          </CabTourStep>
        </div>
      </main>

      {/* Add Person Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[16px] bg-white p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#ececec] pb-3">
              <h2 className="text-[16px] sm:text-[18px] font-bold text-neutral-900">{t('cab.competence.addNewPerson', 'Add New Person')}</h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex size-8 items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 text-[20px] font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddPerson} className="space-y-4 text-start">
              <div>
                <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                  {t('cab.competence.fullName', 'Full Name')} *
                </label>
                <input
                  type="text"
                  required
                  value={newPerson.name}
                  onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="h-11 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                    {t('cab.competence.role', 'Role')}
                  </label>
                  <select
                    value={newPerson.role}
                    onChange={(e) =>
                      setNewPerson({ ...newPerson, role: e.target.value as any })
                    }
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] focus:border-primary focus:outline-none"
                  >
                    <option value="Auditor">Auditor</option>
                    <option value="Lead Auditor">Lead Auditor</option>
                    <option value="Technical Expert">Technical Expert</option>
                    <option value="Decision Maker">Decision Maker</option>
                    <option value="Reviewer">Reviewer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                    {t('cab.competence.scheme', 'Scheme')}
                  </label>
                  <select
                    value={newPerson.scheme}
                    onChange={(e) => setNewPerson({ ...newPerson, scheme: e.target.value })}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] focus:border-primary focus:outline-none"
                  >
                    <option value="ISO 9001">ISO 9001 (Quality)</option>
                    <option value="ISO 14001">ISO 14001 (Environmental)</option>
                    <option value="ISO 45001">ISO 45001 (Health & Safety)</option>
                    <option value="ISO 22000">ISO 22000 (Food Safety)</option>
                    <option value="ISO 27001">ISO 27001 (Information Security)</option>
                    <option value="HACCP">HACCP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                  {t('cab.competence.authorizedScope', 'Authorized Scope / Sector')}
                </label>
                <input
                  type="text"
                  value={newPerson.authorizedScope}
                  onChange={(e) =>
                    setNewPerson({ ...newPerson, authorizedScope: e.target.value })
                  }
                  placeholder="e.g. Quality management systems"
                  className="h-11 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                    {t('cab.competence.country', 'Country')}
                  </label>
                  <input
                    type="text"
                    value={newPerson.country}
                    onChange={(e) => setNewPerson({ ...newPerson, country: e.target.value })}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                    {t('cab.competence.columns.expiry', 'Expiry Date')}
                  </label>
                  <input
                    type="date"
                    value={newPerson.expiryDate}
                    onChange={(e) => setNewPerson({ ...newPerson, expiryDate: e.target.value })}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ececec]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="h-11 rounded-[8px] border border-[#e2e2e2] px-4 text-[14px] font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="h-11 rounded-[8px] bg-primary px-5 text-[14px] font-semibold text-white hover:bg-primary/90 transition-colors"
                >
                  {t('cab.competence.savePerson', 'Save Person')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CabLayout>
  )
}
