import { useState, useMemo, useEffect } from 'react'
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
  ChevronDownIcon,
  PlusIcon,
  UserIcon,
} from '@/components/icons'
import { ExportMenuButton } from '@/components/ui/ExportMenuButton'
import { Toggle } from '@/components/ui/Toggle'
import {
  downloadExcelCsv,
  downloadPdfFromTable,
  type TableColumn,
} from '@/lib/tableTools'
import {
  getStoredPersonnel,
  savePersonnelList,
  type CompetencePerson,
} from '@/lib/api/cabCompetenceApi'
import {
  listCabEmployees,
  updateCabEmployeeStatus,
  getProfessionalRoleLabel,
  formatEmployeePhone,
} from '@/lib/api/cabEmployeesApi'
import { formatIafCodesToSectorNames } from '@/lib/iafCodes'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

export function CabPersonnelRegisterPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { dir } = useDirection()
  const tourSteps = usePersonnelTourSteps()
  const [personnel, setPersonnel] = useState<CompetencePerson[]>(getStoredPersonnel)

  useEffect(() => {
    listCabEmployees()
      .then((res) => {
        const rawItems = Array.isArray(res) ? res : res?.items || res?.employees || []
        if (rawItems.length > 0) {
          const stored = getStoredPersonnel()
          const mapped: CompetencePerson[] = rawItems.map((emp, index) => {
            const existing = stored.find((s) => s.id === emp.id)
            const role = emp.professionalRole
              ? getProfessionalRoleLabel(emp.professionalRole)
              : 'Auditor'
            const resolvedStatusDot: CompetencePerson['statusDot'] =
              existing?.statusDot ?? (emp.status === 'INACTIVE' ? 'Inactive' : 'Active')

            return {
              ...existing,
              id: emp.id,
              code: existing?.code || `PER-${String(index + 1).padStart(4, '0')}`,
              name: existing?.name || emp.user?.fullName || 'Employee',
              role: role as CompetencePerson['role'],
              country: existing?.country || 'Saudi Arabia',
              schemes: emp.schemes?.length ? emp.schemes : existing?.schemes || [],
              authorizedScope:
                formatIafCodesToSectorNames(emp.iafCodes, existing?.authorizedScope, i18n.language) ||
                'Quality management systems',
              expiryDate: existing?.expiryDate || (emp.employmentStartDate ? emp.employmentStartDate.split('T')[0] : '2026-12-31'),
              status: resolvedStatusDot === 'Inactive' ? 'Suspended' : (emp.status === 'ACTIVE' ? 'Authorized' : (existing?.status || 'Under review')),
              avatarUrl: emp.imageUrl || existing?.avatarUrl || undefined,
              employmentStartDate: emp.employmentStartDate || existing?.employmentStartDate || undefined,
              iafCodes: emp.iafCodes || existing?.iafCodes || [],
              email: emp.user?.email || existing?.email || '',
              phone: formatEmployeePhone(emp.user?.phone, emp.user?.phoneCountryCode) || (existing?.phone || ''),
              statusDot: resolvedStatusDot,
            }
          })
          setPersonnel(mapped)
          savePersonnelList(mapped)
        } else {
          setPersonnel(getStoredPersonnel())
        }
      })
      .catch(() => {
        setPersonnel(getStoredPersonnel())
      })
  }, [i18n.language])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [selectedExpiry, setSelectedExpiry] = useState('ALL')

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
        const scopeText = formatIafCodesToSectorNames(p.iafCodes, p.authorizedScope, i18n.language)
        const matchScope = scopeText.toLowerCase().includes(q)
        if (!matchName && !matchCode && !matchScope) return false
      }
      if (selectedCountry !== 'ALL' && p.country !== selectedCountry) return false
      if (selectedStatus !== 'ALL') {
        const isActive = p.statusDot !== 'Inactive'
        if (selectedStatus === 'Active' && !isActive) return false
        if (selectedStatus === 'Inactive' && isActive) return false
        if (selectedStatus !== 'Active' && selectedStatus !== 'Inactive' && p.status !== selectedStatus) {
          return false
        }
      }
      if (selectedExpiry !== 'ALL') {
        const exp = new Date(p.expiryDate).getTime()
        if (!Number.isFinite(exp)) return false
        const now = new Date().getTime()
        if (selectedExpiry === '30' && exp - now > 30 * 86400000) return false
        if (selectedExpiry === '90' && exp - now > 90 * 86400000) return false
      }
      return true
    })
  }, [personnel, searchQuery, selectedCountry, selectedStatus, selectedExpiry, i18n.language])

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedCountry('ALL')
    setSelectedStatus('ALL')
    setSelectedExpiry('ALL')
  }

  const [exporting, setExporting] = useState(false)

  const exportColumns: TableColumn<CompetencePerson>[] = useMemo(
    () => [
      { header: t('cab.competence.columns.code', 'Code'), value: (p) => p.code },
      { header: t('cab.competence.columns.name', 'Name'), value: (p) => p.name },
      { header: t('cab.competence.columns.role', 'Role'), value: (p) => p.role },
      { header: t('cab.competence.columns.country', 'Country'), value: (p) => p.country },
      {
        header: t('cab.competence.columns.schemes', 'Schemes'),
        value: (p) => (p.schemes?.length ? p.schemes.join(', ') : '—'),
      },
      {
        header: t('cab.competence.columns.scope', 'Authorized scope'),
        value: (p) => formatIafCodesToSectorNames(p.iafCodes, p.authorizedScope, i18n.language) || '—',
      },
      {
        header: t('cab.competence.columns.expiry', 'Expiry date'),
        value: (p) => p.expiryDate || '—',
      },
      {
        header: t('cab.competence.columns.status', 'Status'),
        value: (p) =>
          p.statusDot !== 'Inactive'
            ? t('cab.competence.statuses.active', 'Active')
            : t('cab.competence.statuses.notActive', 'Not Active'),
      },
    ],
    [t, i18n.language],
  )

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      downloadExcelCsv('personnel-register.xlsx', exportColumns, filteredPersonnel)
    } finally {
      setExporting(false)
    }
  }

  const handleExportPdf = async () => {
    setExporting(true)
    try {
      downloadPdfFromTable(
        'personnel-register.pdf',
        t('cab.competence.personnelRegister', 'Personnel register'),
        exportColumns,
        filteredPersonnel,
      )
    } finally {
      setExporting(false)
    }
  }

  const handleToggleStatus = (person: CompetencePerson, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const currentlyActive = person.statusDot !== 'Inactive'
    const nextStatusDot: CompetencePerson['statusDot'] = currentlyActive ? 'Inactive' : 'Active'
    const nextStatus: CompetencePerson['status'] = currentlyActive ? 'Suspended' : 'Authorized'

    setPersonnel((prev) => {
      const updated = prev.map((item) =>
        item.id === person.id
          ? { ...item, statusDot: nextStatusDot, status: nextStatus }
          : item,
      )
      savePersonnelList(updated)
      return updated
    })

    if (person.id && !person.id.startsWith('per-')) {
      updateCabEmployeeStatus(person.id, currentlyActive ? 'INACTIVE' : 'ACTIVE').catch((err) => {
        console.warn('Backend updateCabEmployeeStatus error (proceeding with local state):', err)
      })
    }
  }

  const renderStatusToggle = (p: CompetencePerson) => {
    const isActive = p.statusDot !== 'Inactive'
    return (
      <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
        <Toggle
          checked={isActive}
          label={
            isActive
              ? t('users.status.active', 'Active')
              : t('users.status.inactive', 'Inactive')
          }
          onChange={() => handleToggleStatus(p)}
        />
      </div>
    )
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
                  onClick={() => navigate(ROUTES.cabPersonnelNew)}
                  className="flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-[8px] bg-primary px-4 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:bg-primary/90 transition-all active:scale-[0.99] whitespace-nowrap"
                >
                  <AppIcon icon={PlusIcon} size={16} />
                  <span>+ {t('cab.competence.addPerson', 'Add person')}</span>
                </button>

                <ExportMenuButton
                  exporting={exporting}
                  onExportExcel={handleExportExcel}
                  onExportPdf={handleExportPdf}
                  label={t('common.export', 'Export')}
                  excelLabel={t('common.exportExcel', 'Export as Excel')}
                  pdfLabel={t('common.exportPdf', 'Export as PDF')}
                  className="rounded-[8px] border border-[#e2e2e2] bg-white px-4 py-2.5 text-[14px] font-semibold text-neutral-700 hover:bg-neutral-50 shadow-sm whitespace-nowrap"
                />
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
                      <option value="Active">{t('cab.competence.statuses.active', 'Active')}</option>
                      <option value="Inactive">{t('cab.competence.statuses.notActive', 'Not Active')}</option>
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
            <div className="hidden md:block overflow-hidden rounded-[16px] border border-[#ececec] bg-white py-5">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] border-collapse text-center">
                  <thead>
                    <tr className="bg-[#1236a3] text-white">
                      <th className="px-4 py-4 text-center text-[14px] font-medium">{t('cab.competence.columns.person', 'Person')}</th>
                      <th className="px-4 py-4 text-center text-[14px] font-medium">{t('cab.competence.columns.role', 'Role')}</th>
                      <th className="px-4 py-4 text-center text-[14px] font-medium">{t('cab.competence.columns.schemes', 'Schemes')}</th>
                      <th className="px-4 py-4 text-center text-[14px] font-medium">{t('cab.competence.columns.scope', 'Authorized scope')}</th>
                      <th className="px-4 py-4 text-center text-[14px] font-medium">{t('cab.competence.columns.expiry', 'Expiry')}</th>
                      <th className="px-4 py-4 text-center text-[14px] font-medium">{t('cab.competence.columns.status', 'Status')}</th>
                      <th className="px-4 py-4 text-center text-[14px] font-medium">{t('common.actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPersonnel.length > 0 ? (
                      filteredPersonnel.map((p, idx) => (
                        <tr
                          key={p.id}
                          className={cn(idx % 2 === 1 ? 'bg-[#f9fafc]' : 'bg-white')}
                        >
                          {/* Person Column */}
                          <td className="px-5 py-4 text-start">
                            <div className="flex items-center gap-3.5">
                              <div className="flex size-10 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white shadow-sm shrink-0">
                                {p.avatarUrl ? <img src={p.avatarUrl} alt={p.name} className="size-full rounded-full object-cover" /> : getInitials(p.name)}
                              </div>
                              <div>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/cab/competence/persons/${p.id}/evaluation`)}
                                  className="font-bold text-[15px] text-neutral-900 hover:text-primary hover:underline transition-colors cursor-pointer text-start"
                                >
                                  {p.name}
                                </button>
                                <p className="text-[12px] text-neutral-500 font-mono" dir="ltr">{p.code}</p>
                              </div>
                            </div>
                          </td>

                          {/* Role Column */}
                          <td className="px-4 py-4 text-center text-[15px] text-neutral-700 whitespace-nowrap">
                            {p.role || '—'}
                          </td>

                          {/* Schemes Column */}
                          <td className="px-4 py-4 text-center text-[15px] text-neutral-700 whitespace-nowrap">
                            {p.schemes.length > 0
                              ? p.schemes.map((s) => s.split(' — ')[0]).join(', ')
                              : '—'}
                          </td>

                          {/* Scope Column */}
                          <td className="px-4 py-4 text-center text-[15px] text-neutral-700 max-w-xs">
                            {formatIafCodesToSectorNames(p.iafCodes, p.authorizedScope, i18n.language) || '—'}
                          </td>

                          {/* Expiry Column */}
                          <td className="px-4 py-4 text-center text-[15px] text-neutral-700 whitespace-nowrap" dir="ltr">
                            {p.expiryDate || '—'}
                          </td>

                          {/* Status Column */}
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            {renderStatusToggle(p)}
                          </td>

                          {/* Actions Column (Radix Dropdown with Portal) */}
                          <td className="px-4 py-4 text-center">
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
                                    onSelect={() => navigate(`/cab/competence/persons/${p.id}/edit`)}
                                    className="cursor-pointer px-4 py-2 text-[13px] font-medium text-neutral-700 outline-none hover:bg-neutral-50 focus:bg-neutral-50"
                                  >
                                    {t('cab.competence.memberProfile.editProfile', 'Edit profile')}
                                  </DropdownMenu.Item>
                                </DropdownMenu.Content>
                              </DropdownMenu.Portal>
                            </DropdownMenu.Root>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-[15px] text-neutral-500">
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
                    className="rounded-[12px] border border-[#ececec] bg-white p-4 shadow-xs space-y-3"
                  >
                    {/* Top Row: Avatar, Name, Code & Dropdown */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white shadow-sm shrink-0">
                          {p.avatarUrl ? <img src={p.avatarUrl} alt={p.name} className="size-full rounded-full object-cover" /> : getInitials(p.name)}
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => navigate(`/cab/competence/persons/${p.id}/evaluation`)}
                            className="font-bold text-neutral-900 hover:text-primary hover:underline truncate block text-start cursor-pointer"
                          >
                            {p.name}
                          </button>
                          <p className="text-[12px] text-neutral-500 font-mono" dir="ltr">{p.code}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {renderStatusToggle(p)}
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
                                onSelect={() => navigate(`/cab/competence/persons/${p.id}/edit`)}
                                className="cursor-pointer px-4 py-2 text-[13px] font-medium text-neutral-700 outline-none hover:bg-neutral-50"
                              >
                                {t('cab.competence.memberProfile.editProfile', 'Edit profile')}
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
                        <span className="font-semibold text-neutral-800">{p.role || '—'}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[11px] font-medium uppercase tracking-wide">
                          {t('cab.competence.columns.expiry', 'Expiry')}
                        </span>
                        <span className="font-semibold text-neutral-800" dir="ltr">{p.expiryDate || '—'}</span>
                      </div>
                    </div>

                    {/* Schemes & Scope */}
                    <div className="text-[13px] space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-neutral-400 text-[11px] font-medium uppercase tracking-wide me-1">
                          {t('cab.competence.columns.schemes', 'Schemes')}:
                        </span>
                        {p.schemes.length > 0 ? (
                          p.schemes.map((s) => (
                            <span key={s} className="rounded-[4px] bg-[#e8edfc] px-2 py-0.5 text-[11px] font-medium text-primary">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-neutral-500">—</span>
                        )}
                      </div>
                      <p className="text-[12px] text-neutral-600 line-clamp-2">
                        <span className="font-medium text-neutral-700">{t('cab.competence.columns.scope', 'Scope')}: </span>
                        {formatIafCodesToSectorNames(p.iafCodes, p.authorizedScope, i18n.language) || '—'}
                      </p>
                    </div>

                    {/* Mobile Action Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/cab/competence/persons/${p.id}/edit`)}
                        className="w-full flex items-center justify-center gap-2 rounded-[8px] bg-[#f0f4fd] hover:bg-[#e8edfc] text-primary text-[13px] font-semibold py-2 transition-colors"
                      >
                        <AppIcon icon={UserIcon} size={14} />
                        <span>{t('cab.competence.memberProfile.editProfile', 'Edit profile')}</span>
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

    </CabLayout>
  )
}
