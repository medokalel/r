import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { usePersonnelTourSteps } from '@/config/personnelTourSteps'
import { useDirection } from '@/context/DirectionContext'
import { TablePagination } from '@/components/dashboard/TablePagination'
import { Button } from '@/components/ui/Button'
import { SelectField } from '@/components/ui/Select'
import {
  AddCircleIcon,
  AppIcon,
  EditIcon,
  EyeIcon,
  MoreIcon,
  SearchIcon,
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
  getRelationshipTypeLabel,
  formatEmployeePhone,
  getCabImpartialityRegister,
  type CabImpartialityRegisterEntry,
} from '@/lib/api/cabEmployeesApi'
import { formatIafCodesToSectorNames } from '@/lib/iafCodes'
import { resolvePublicAssetUrl } from '@/lib/publicAssetUrl'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-400 rtl-flip" aria-hidden>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const PAGE_SIZE = 10

export function CabPersonnelRegisterPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { dir } = useDirection()
  const tourSteps = usePersonnelTourSteps()
  const [personnel, setPersonnel] = useState<CompetencePerson[]>(getStoredPersonnel)
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'personnel' | 'impartiality'>('personnel')
  const [impartialityRegister, setImpartialityRegister] = useState<CabImpartialityRegisterEntry[]>([])
  const [loadingImpartiality, setLoadingImpartiality] = useState(false)
  const [impartialitySearch, setImpartialitySearch] = useState('')

  useEffect(() => {
    if (activeTab !== 'impartiality') return
    setLoadingImpartiality(true)
    getCabImpartialityRegister()
      .then((res) => {
        setImpartialityRegister(res?.register ?? [])
      })
      .catch(() => {
        setImpartialityRegister([])
      })
      .finally(() => {
        setLoadingImpartiality(false)
      })
  }, [activeTab])

  const filteredImpartiality = useMemo(() => {
    const q = impartialitySearch.trim().toLowerCase()
    if (!q) return impartialityRegister
    return impartialityRegister.filter(
      (entry) =>
        (entry.fullName ?? '').toLowerCase().includes(q) ||
        (entry.employeeCode ?? '').toLowerCase().includes(q) ||
        (entry.email ?? '').toLowerCase().includes(q)
    )
  }, [impartialityRegister, impartialitySearch])

  const formatDate = (iso?: string | null) => {
    if (!iso) return '—'
    const clean = iso.split('T')[0]
    const parsed = new Date(`${clean}T00:00:00`)
    if (Number.isNaN(parsed.getTime())) return clean || '—'
    return new Intl.DateTimeFormat(i18n.language, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(parsed)
  }

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
              emp.status === 'INACTIVE' ? 'Inactive' : 'Active'

            const backendStart = emp.employmentStartDate?.split('T')[0]
            const existingExpiry = existing?.expiryDate?.split('T')[0]
            const cleanExistingExpiry =
              existingExpiry && existingExpiry !== '2026-12-31' && existingExpiry !== backendStart
                ? existingExpiry
                : ''
            const backendExpiry = (emp.scopeExpiryDate || emp.expiryDate)?.split('T')[0]

            return {
              ...existing,
              id: emp.id,
              code:
                emp.employeeCode ||
                existing?.code ||
                `EMP-${String(index + 1).padStart(4, '0')}`,
              name: emp.fullName || emp.user?.fullName || existing?.name || 'Employee',
              role: role as CompetencePerson['role'],
              country:
                emp.scopeCountry ||
                emp.baseCountry ||
                existing?.country ||
                'Saudi Arabia',
              schemes: emp.schemes?.length ? emp.schemes : existing?.schemes || [],
              authorizedScope:
                emp.authorizedSectors?.[0] ||
                formatIafCodesToSectorNames(emp.iafCodes, existing?.authorizedScope, i18n.language) ||
                'Quality management systems',
              expiryDate: backendExpiry || cleanExistingExpiry || '',
              status:
                resolvedStatusDot === 'Inactive'
                  ? 'Suspended'
                  : emp.status === 'ACTIVE'
                  ? 'Authorized'
                  : existing?.status || 'Under review',
              avatarUrl:
                resolvePublicAssetUrl(emp.imageUrl) || existing?.avatarUrl || undefined,
              employmentStartDate: (emp.employmentStartDate || existing?.employmentStartDate)?.split('T')[0] || undefined,
              employmentEndDate: (emp.employmentEndDate || existing?.employmentEndDate)?.split('T')[0] || undefined,
              iafCodes: emp.iafCodes || existing?.iafCodes || [],
              auditLanguages: emp.auditLanguages || existing?.auditLanguages || [],
              baseCountry: emp.baseCountry || existing?.baseCountry || '',
              baseCity: emp.baseCity || existing?.baseCity || '',
              email: emp.email || emp.user?.email || existing?.email || '',
              phone:
                formatEmployeePhone(
                  emp.phone ?? emp.user?.phone,
                  emp.phoneCountryCode ?? emp.user?.phoneCountryCode
                ) ||
                existing?.phone ||
                '',
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

  const totalPages = Math.max(1, Math.ceil(filteredPersonnel.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginatedPersonnel = filteredPersonnel.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      selectedCountry !== 'ALL' ||
      selectedStatus !== 'ALL' ||
      selectedExpiry !== 'ALL',
  )

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedCountry('ALL')
    setSelectedStatus('ALL')
    setSelectedExpiry('ALL')
    setPage(1)
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
        value: (p) => (p.schemes?.length ? p.schemes.map((s) => s.split(' — ')[0]).join(', ') : '—'),
      },
      {
        header: t('cab.competence.columns.scope', 'Authorized scope'),
        value: (p) => formatIafCodesToSectorNames(p.iafCodes, p.authorizedScope, i18n.language) || '—',
      },
      {
        header: t('cab.competence.columns.startDate', 'Start date'),
        value: (p) => formatDate(p.employmentStartDate),
      },
      {
        header: t('cab.competence.columns.expiry', 'Expiry (optional)'),
        value: (p) => formatDate(p.expiryDate),
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

      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        {/* Breadcrumb */}
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]" aria-label="breadcrumb">
          <Link to={ROUTES.workspace} className="font-light text-neutral-400 hover:text-primary">
            {t('cab.competence.title', 'Competence Register')}
          </Link>
          <Chevron />
          <span className="font-medium text-neutral-700">
            {t('cab.competence.personnelRegister', 'Personnel register')}
          </span>
        </nav>

        {/* Header Row */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <CabTourStep steps={tourSteps} stepId="personnel-header">
            <div>
              <h1 className="text-[28px] font-bold leading-tight text-neutral-900">
                {activeTab === 'personnel'
                  ? t('cab.competence.personnelRegister', 'Personnel register')
                  : t('cab.competence.impartiality.registerTitle', 'Impartiality register')}
              </h1>
              <p className="mt-1 text-[14px] text-neutral-500">
                {activeTab === 'personnel'
                  ? t('cab.competence.subtitle', 'Manage personnel, their roles, scheme authorizations and expiry dates.')
                  : t(
                      'cab.competence.impartiality.registerSubtitle',
                      'Monitor annual impartiality declarations and declared client conflict-of-interest relationships.'
                    )}
              </p>
            </div>
          </CabTourStep>

          <CabTourStep steps={tourSteps} stepId="personnel-actions">
            <div className="flex w-full items-center gap-3 sm:w-auto">
              <Button
                variant="primary"
                icon={<AppIcon icon={AddCircleIcon} size={20} />}
                onClick={() => navigate(ROUTES.cabPersonnelNew)}
                className="w-full sm:w-auto whitespace-nowrap"
              >
                {t('cab.competence.addPerson', 'Add person')}
              </Button>

              {activeTab === 'personnel' && (
                <ExportMenuButton
                  exporting={exporting}
                  disabled={filteredPersonnel.length === 0}
                  onExportExcel={handleExportExcel}
                  onExportPdf={handleExportPdf}
                  label={t('common.export', 'Export')}
                  excelLabel={t('common.exportExcel', 'Export as Excel')}
                  pdfLabel={t('common.exportPdf', 'Export as PDF')}
                />
              )}
            </div>
          </CabTourStep>
        </div>

        {/* ICASCO Tab Switcher: Personnel Register vs Impartiality Register */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#ececec]">
          <button
            type="button"
            onClick={() => setActiveTab('personnel')}
            className={cn(
              'cursor-pointer border-b-2 px-5 py-3 text-[14px] font-semibold transition-colors',
              activeTab === 'personnel'
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            )}
          >
            {t('cab.competence.personnelRegister', 'Personnel register')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('impartiality')}
            className={cn(
              'cursor-pointer border-b-2 px-5 py-3 text-[14px] font-semibold transition-colors',
              activeTab === 'impartiality'
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            )}
          >
            {t('cab.competence.impartiality.registerTitle', 'Impartiality register')}
          </button>
        </div>

        {activeTab === 'impartiality' ? (
          <>
            {/* Impartiality Search Bar */}
            <section className="rounded-[16px] border border-[#ececec] bg-white p-5">
              <div className="max-w-md">
                <label
                  htmlFor="impartiality-search"
                  className="mb-2 block text-[13px] font-semibold text-neutral-700"
                >
                  {t('cab.competence.fullName', 'Name / Personnel code')}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400">
                    <AppIcon icon={SearchIcon} size={18} />
                  </span>
                  <input
                    id="impartiality-search"
                    type="text"
                    value={impartialitySearch}
                    onChange={(e) => setImpartialitySearch(e.target.value)}
                    placeholder={t(
                      'cab.competence.searchPlaceholder',
                      'Search by name or code...'
                    )}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white ps-10 pe-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Impartiality Register Table */}
            <section className="flex flex-col rounded-[16px] border border-[#ececec] bg-white py-5">
              <p className="mb-4 px-5 text-[13px] text-neutral-500">
                {t('cab.competence.personnelCount', { count: filteredImpartiality.length })}
              </p>

              {loadingImpartiality ? (
                <div className="flex items-center justify-center py-12">
                  <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px] border-collapse text-center">
                    <thead>
                      <tr className="bg-[#1236a3] text-white">
                        <th className="px-4 py-4 text-start text-[14px] font-medium whitespace-nowrap">
                          {t('cab.competence.columns.person', 'Person')}
                        </th>
                        <th className="px-4 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                          {t('cab.competence.columns.role', 'Role')}
                        </th>
                        <th className="px-4 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                          {t(
                            'cab.competence.impartiality.annualStatus',
                            'Annual Declaration'
                          )}
                        </th>
                        <th className="px-4 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                          {t('cab.competence.impartiality.validUntil', 'Valid until')}
                        </th>
                        <th className="px-4 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                          {t(
                            'cab.competence.impartiality.declarationsCount',
                            'Declarations'
                          )}
                        </th>
                        <th className="px-4 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                          {t(
                            'cab.competence.impartiality.relationshipsCount',
                            'Declared Relationships'
                          )}
                        </th>
                        <th className="px-4 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                          {t('common.actions', 'Actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredImpartiality.length > 0 ? (
                        filteredImpartiality.map((entry, idx) => {
                          const annual = entry.annualDeclaration
                          const roleLabel = entry.professionalRole
                            ? getProfessionalRoleLabel(entry.professionalRole)
                            : '—'
                          const displayName = entry.fullName || 'Employee'

                          return (
                            <tr
                              key={entry.employeeId}
                              className={cn(idx % 2 === 1 ? 'bg-[#f9fafc]' : 'bg-white')}
                            >
                              <td className="px-5 py-4 text-start">
                                <div className="flex items-center gap-3.5">
                                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white shadow-sm">
                                    {getInitials(displayName)}
                                  </div>
                                  <div className="min-w-0">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        navigate(
                                          `/cab/competence/persons/${entry.employeeId}/evaluation`
                                        )
                                      }
                                      className="cursor-pointer text-start text-[15px] font-semibold text-neutral-900 hover:text-primary hover:underline"
                                    >
                                      {displayName}
                                    </button>
                                    <div className="text-[12px] text-neutral-500" dir="ltr">
                                      {entry.employeeCode}
                                      {entry.email ? ` | ${entry.email}` : ''}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4 text-center text-[14px] text-neutral-700 whitespace-nowrap">
                                {roleLabel}
                              </td>

                              <td className="px-4 py-4 text-center whitespace-nowrap">
                                {annual ? (
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={cn(
                                          'inline-flex items-center rounded-[4px] px-2.5 py-0.5 text-[12px] font-medium',
                                          annual.isActive
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'bg-red-50 text-red-700'
                                        )}
                                      >
                                        {annual.isActive
                                          ? t('cab.competence.statuses.active', 'Active')
                                          : t(
                                              'cab.competence.impartiality.expired',
                                              'Expired'
                                            )}
                                      </span>
                                      <span
                                        className={cn(
                                          'inline-flex items-center rounded-[4px] px-2.5 py-0.5 text-[12px] font-medium',
                                          annual.answer === 'NO_CONFLICT'
                                            ? 'bg-[#e8edfc] text-[#1236a3]'
                                            : 'bg-amber-50 text-amber-700'
                                        )}
                                      >
                                        {annual.answer === 'NO_CONFLICT'
                                          ? t(
                                              'cab.competence.impartiality.answers.NO_CONFLICT',
                                              'No Conflict'
                                            )
                                          : t(
                                              'cab.competence.impartiality.answers.DECLARES_RELATIONSHIPS',
                                              'Declares Relationships'
                                            )}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-neutral-500">
                                      {t('cab.competence.impartiality.signedBy', 'Signed by')}:{' '}
                                      {annual.signedBy}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center rounded-[4px] bg-neutral-100 px-2.5 py-1 text-[12px] font-medium text-neutral-600">
                                    {t(
                                      'cab.competence.impartiality.notRecorded',
                                      'Not recorded'
                                    )}
                                  </span>
                                )}
                              </td>

                              <td
                                className="px-4 py-4 text-center text-[14px] text-neutral-700 whitespace-nowrap"
                                dir="ltr"
                              >
                                {formatDate(annual?.validUntil)}
                              </td>

                              <td className="px-4 py-4 text-center text-[14px] font-semibold text-neutral-800">
                                {entry.declarationsCount}
                              </td>

                              <td className="px-4 py-4 text-center text-[13px] text-neutral-700">
                                {entry.relationshipsCount > 0 ? (
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="inline-flex items-center rounded-[4px] bg-amber-50 px-2.5 py-0.5 text-[12px] font-semibold text-amber-700">
                                      {entry.relationshipsCount}
                                    </span>
                                    <div className="flex flex-wrap justify-center gap-1">
                                      {(entry.relationships ?? []).slice(0, 2).map((rel) => (
                                        <span
                                          key={rel.id}
                                          className="text-[11px] text-neutral-500"
                                        >
                                          {rel.client?.name ||
                                            getRelationshipTypeLabel(rel.relationshipType)}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-neutral-400">0</span>
                                )}
                              </td>

                              <td className="px-4 py-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigate(
                                        `/cab/competence/persons/${entry.employeeId}/evaluation`
                                      )
                                    }
                                    className="flex size-8 items-center justify-center rounded-[8px] text-neutral-500 hover:bg-neutral-100 hover:text-primary"
                                    title={t(
                                      'cab.competence.evaluation.pageTitle',
                                      'Competence Profile'
                                    )}
                                  >
                                    <AppIcon icon={EyeIcon} size={17} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigate(
                                        `/cab/competence/persons/${entry.employeeId}/edit`
                                      )
                                    }
                                    className="flex size-8 items-center justify-center rounded-[8px] text-neutral-500 hover:bg-neutral-100 hover:text-primary"
                                    title={t(
                                      'cab.competence.memberProfile.editProfile',
                                      'Edit profile'
                                    )}
                                  >
                                    <AppIcon icon={EditIcon} size={17} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-8 text-center text-[15px] text-neutral-500"
                          >
                            {t(
                              'cab.competence.noPersonnel',
                              'No personnel records match the current filters.'
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : (
          <>
        {/* Filter Bar Card */}
        <CabTourStep steps={tourSteps} stepId="personnel-filters">
          <section className="rounded-[16px] border border-[#ececec] bg-white p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end">
              {/* Search */}
              <div className="flex flex-col gap-2">
                <label htmlFor="personnel-search" className="text-[13px] font-semibold text-neutral-700">
                  {t('cab.competence.fullName', 'Name / Personnel code')}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400">
                    <AppIcon icon={SearchIcon} size={18} />
                  </span>
                  <input
                    id="personnel-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setPage(1)
                      setSearchQuery(e.target.value)
                    }}
                    placeholder={t('cab.competence.searchPlaceholder', 'Search by name or code...')}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white ps-10 pe-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Country */}
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-neutral-700">
                  {t('cab.competence.country', 'Country')}
                </span>
                <SelectField
                  value={selectedCountry}
                  onChange={(val) => {
                    setPage(1)
                    setSelectedCountry(val)
                  }}
                  options={[
                    { value: 'ALL', label: t('cab.competence.allCountries', 'All countries') },
                    ...countries.map((c) => ({ value: c, label: c })),
                  ]}
                />
              </div>

              {/* Authorization Status */}
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-neutral-700">
                  {t('cab.competence.authorizationStatus', 'Authorization status')}
                </span>
                <SelectField
                  value={selectedStatus}
                  onChange={(val) => {
                    setPage(1)
                    setSelectedStatus(val)
                  }}
                  options={[
                    { value: 'ALL', label: t('cab.competence.allStatuses', 'All statuses') },
                    { value: 'Active', label: t('cab.competence.statuses.active', 'Active') },
                    { value: 'Inactive', label: t('cab.competence.statuses.notActive', 'Not Active') },
                  ]}
                />
              </div>

              {/* Expiry Period */}
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-neutral-700">
                  {t('cab.competence.expiryPeriod', 'Expiry period')}
                </span>
                <SelectField
                  value={selectedExpiry}
                  onChange={(val) => {
                    setPage(1)
                    setSelectedExpiry(val)
                  }}
                  options={[
                    { value: 'ALL', label: t('cab.competence.allPeriods', 'All periods') },
                    { value: '30', label: t('cab.competence.expiring30', 'Expiring in 30 days') },
                    { value: '90', label: t('cab.competence.expiring90', 'Expiring in 90 days') },
                  ]}
                />
              </div>

              {/* Clear */}
              <div className="flex items-end justify-start lg:justify-end">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  disabled={!hasActiveFilters}
                  className="h-11 whitespace-nowrap text-[14px] font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-neutral-300 disabled:no-underline"
                >
                  {t('common.clear', 'Clear')}
                </button>
              </div>
            </div>
          </section>
        </CabTourStep>

        {/* Personnel Table & Mobile Card View */}
        <CabTourStep steps={tourSteps} stepId="personnel-table">
          <section className="flex flex-col rounded-[16px] border border-[#ececec] bg-white py-5">
            <p className="mb-4 px-5 text-[13px] text-neutral-500">
              {t('cab.competence.personnelCount', { count: filteredPersonnel.length })}
            </p>

            {/* Desktop / Tablet Table View */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[960px] border-collapse text-center">
                <thead>
                  <tr className="bg-[#1236a3] text-white">
                    <th className="px-4 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                      {t('cab.competence.columns.person', 'Person')}
                    </th>
                    <th className="px-4 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                      {t('cab.competence.columns.role', 'Role')}
                    </th>
                    <th className="px-4 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                      {t('cab.competence.columns.schemes', 'Schemes')}
                    </th>
                    <th className="px-4 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                      {t('cab.competence.columns.scope', 'Authorized scope')}
                    </th>
                    <th className="px-4 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                      {t('cab.competence.columns.startDate', 'Start date')}
                    </th>
                    <th className="px-4 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                      {t('cab.competence.columns.expiry', 'Expiry (optional)')}
                    </th>
                    <th className="px-4 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                      {t('cab.competence.columns.status', 'Status')}
                    </th>
                    <th className="px-4 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                      {t('common.actions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPersonnel.length > 0 ? (
                    paginatedPersonnel.map((p, idx) => (
                      <tr
                        key={p.id}
                        className={cn(idx % 2 === 1 ? 'bg-[#f9fafc]' : 'bg-white')}
                      >
                        {/* Person Column */}
                        <td className="px-5 py-4 text-start">
                          <div className="flex items-center gap-3.5">
                            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-[13px] font-bold text-white shadow-sm">
                              {p.avatarUrl ? (
                                <img src={resolvePublicAssetUrl(p.avatarUrl)} alt={p.name} className="size-full rounded-full object-cover" />
                              ) : (
                                getInitials(p.name)
                              )}
                            </div>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => navigate(`/cab/competence/persons/${p.id}/evaluation`)}
                                className="cursor-pointer text-start text-[15px] font-semibold text-neutral-900 transition-colors hover:text-primary hover:underline"
                              >
                                {p.name}
                              </button>
                              <div className="text-[12px] text-neutral-500">
                                <span dir="ltr">{p.code}</span>
                                {p.country ? (
                                  <>
                                    <span className="mx-1">|</span>
                                    <span>{p.country}</span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role Column */}
                        <td className="px-4 py-4 text-center text-[15px] text-neutral-700 whitespace-nowrap">
                          {p.role || '—'}
                        </td>

                        {/* Schemes Column */}
                        <td className="px-4 py-4 text-center text-[15px] text-neutral-700">
                          {p.schemes.length > 0 ? (
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              {p.schemes.map((s) => (
                                <span
                                  key={s}
                                  className="inline-flex items-center justify-center whitespace-nowrap rounded-[4px] bg-[#e8edfc] px-3 py-1 text-[12px] font-medium text-[#1236a3]"
                                >
                                  {s.split(' — ')[0]}
                                </span>
                              ))}
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Scope Column */}
                        <td className="max-w-[260px] px-4 py-4 text-center text-[14px] text-neutral-600">
                          {formatIafCodesToSectorNames(p.iafCodes, p.authorizedScope, i18n.language) || '—'}
                        </td>

                        {/* Start Date Column */}
                        <td className="px-4 py-4 text-center text-[14px] text-neutral-700 whitespace-nowrap" dir="ltr">
                          {formatDate(p.employmentStartDate)}
                        </td>

                        {/* Expiry Column */}
                        <td className="px-4 py-4 text-center text-[14px] text-neutral-700 whitespace-nowrap" dir="ltr">
                          {formatDate(p.expiryDate)}
                        </td>

                        {/* Status Column */}
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          {renderStatusToggle(p)}
                        </td>

                        {/* Actions Column */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <CabTourStep
                              steps={tourSteps}
                              stepId={idx === 0 ? 'personnel-eval-action' : undefined}
                            >
                              <DropdownMenu.Root dir={dir}>
                                <DropdownMenu.Trigger asChild>
                                  <button
                                    type="button"
                                    className="flex size-9 items-center justify-center rounded-[8px] text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-primary focus:outline-none"
                                    aria-label={t('common.actions', 'Actions')}
                                  >
                                    <AppIcon icon={MoreIcon} size={20} className="rotate-90" />
                                  </button>
                                </DropdownMenu.Trigger>

                                <DropdownMenu.Portal>
                                  <DropdownMenu.Content
                                    align="end"
                                    sideOffset={4}
                                    className="z-50 min-w-[180px] rounded-[8px] border border-[#e2e2e2] bg-white p-1 shadow-lg"
                                  >
                                    <DropdownMenu.Item
                                      onSelect={() => navigate(`/cab/competence/persons/${p.id}/evaluation`)}
                                      className="flex cursor-pointer select-none items-center gap-2 rounded-[6px] px-3 py-2.5 text-start text-[13px] font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                                    >
                                      <AppIcon icon={EyeIcon} size={16} />
                                      {t('cab.competence.evaluation.pageTitle', 'Competence Profile')}
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                      onSelect={() => navigate(`/cab/competence/persons/${p.id}/edit`)}
                                      className="flex cursor-pointer select-none items-center gap-2 rounded-[6px] px-3 py-2.5 text-start text-[13px] font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                                    >
                                      <AppIcon icon={EditIcon} size={16} />
                                      {t('cab.competence.memberProfile.editProfile', 'Edit profile')}
                                    </DropdownMenu.Item>
                                  </DropdownMenu.Content>
                                </DropdownMenu.Portal>
                              </DropdownMenu.Root>
                            </CabTourStep>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-[15px] text-neutral-500">
                        {t('cab.competence.noPersonnel', 'No personnel records match the current filters.')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="space-y-3 px-5 md:hidden">
              {paginatedPersonnel.length > 0 ? (
                paginatedPersonnel.map((p) => (
                  <div
                    key={p.id}
                    className="w-full space-y-3 rounded-[12px] border border-[#ececec] bg-white p-4"
                  >
                    {/* Top Row: Avatar, Name, Code & Dropdown */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-[13px] font-bold text-white shadow-sm">
                          {p.avatarUrl ? (
                            <img src={resolvePublicAssetUrl(p.avatarUrl)} alt={p.name} className="size-full rounded-full object-cover" />
                          ) : (
                            getInitials(p.name)
                          )}
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => navigate(`/cab/competence/persons/${p.id}/evaluation`)}
                            className="block cursor-pointer truncate text-start font-semibold text-neutral-900 hover:text-primary hover:underline"
                          >
                            {p.name}
                          </button>
                          <p className="text-[12px] text-neutral-500" dir="ltr">
                            {p.code}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {renderStatusToggle(p)}
                        <DropdownMenu.Root dir={dir}>
                          <DropdownMenu.Trigger asChild>
                            <button
                              type="button"
                              className="flex size-8 items-center justify-center rounded-[8px] text-neutral-500 hover:bg-neutral-50 hover:text-primary focus:outline-none"
                              aria-label={t('common.actions', 'Actions')}
                            >
                              <AppIcon icon={MoreIcon} size={18} className="rotate-90" />
                            </button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Portal>
                            <DropdownMenu.Content
                              align="end"
                              sideOffset={4}
                              className="z-50 min-w-[180px] rounded-[8px] border border-[#e2e2e2] bg-white p-1 shadow-lg"
                            >
                              <DropdownMenu.Item
                                onSelect={() => navigate(`/cab/competence/persons/${p.id}/evaluation`)}
                                className="flex cursor-pointer select-none items-center gap-2 rounded-[6px] px-3 py-2.5 text-start text-[13px] font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                              >
                                <AppIcon icon={EyeIcon} size={16} />
                                {t('cab.competence.evaluation.pageTitle', 'Competence Profile')}
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                onSelect={() => navigate(`/cab/competence/persons/${p.id}/edit`)}
                                className="flex cursor-pointer select-none items-center gap-2 rounded-[6px] px-3 py-2.5 text-start text-[13px] font-medium text-neutral-800 outline-none data-[highlighted]:bg-neutral-50"
                              >
                                <AppIcon icon={EditIcon} size={16} />
                                {t('cab.competence.memberProfile.editProfile', 'Edit profile')}
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      </div>
                    </div>

                    {/* Role, Start Date & Expiry */}
                    <div className="grid grid-cols-3 gap-2 border-t border-[#ececec] pt-2 text-[13px]">
                      <div>
                        <span className="block text-[11px] font-medium text-neutral-400">
                          {t('cab.competence.columns.role', 'Role')}
                        </span>
                        <span className="font-medium text-neutral-800">{p.role || '—'}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-medium text-neutral-400">
                          {t('cab.competence.columns.startDate', 'Start date')}
                        </span>
                        <span className="font-medium text-neutral-800 whitespace-nowrap" dir="ltr">
                          {formatDate(p.employmentStartDate)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] font-medium text-neutral-400">
                          {t('cab.competence.columns.expiry', 'Expiry (optional)')}
                        </span>
                        <span className="font-medium text-neutral-800 whitespace-nowrap" dir="ltr">
                          {formatDate(p.expiryDate)}
                        </span>
                      </div>
                    </div>

                    {/* Schemes & Scope */}
                    <div className="space-y-1.5 text-[13px]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="me-1 text-[11px] font-medium text-neutral-400">
                          {t('cab.competence.columns.schemes', 'Schemes')}:
                        </span>
                        {p.schemes.length > 0 ? (
                          p.schemes.map((s) => (
                            <span
                              key={s}
                              className="inline-flex items-center justify-center whitespace-nowrap rounded-[4px] bg-[#e8edfc] px-2.5 py-0.5 text-[11px] font-medium text-[#1236a3]"
                            >
                              {s.split(' — ')[0]}
                            </span>
                          ))
                        ) : (
                          <span className="text-neutral-500">—</span>
                        )}
                      </div>
                      <p className="line-clamp-2 text-[12px] text-neutral-600">
                        <span className="font-medium text-neutral-700">{t('cab.competence.columns.scope', 'Scope')}: </span>
                        {formatIafCodesToSectorNames(p.iafCodes, p.authorizedScope, i18n.language) || '—'}
                      </p>
                    </div>

                    {/* Mobile Action Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      icon={<AppIcon icon={EditIcon} size={15} />}
                      onClick={() => navigate(`/cab/competence/persons/${p.id}/edit`)}
                    >
                      {t('cab.competence.memberProfile.editProfile', 'Edit profile')}
                    </Button>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-[14px] text-neutral-500">
                  {t('cab.competence.noPersonnel', 'No personnel records match the current filters.')}
                </p>
              )}
            </div>

            {filteredPersonnel.length > 0 && (
              <div className="mt-5 flex justify-end border-t border-[#ececec] px-5 pt-4">
                <TablePagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </section>
        </CabTourStep>
          </>
        )}
      </main>
    </CabLayout>
  )
}
