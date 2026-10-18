import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useCompetenceEvaluationTourSteps } from '@/config/competenceEvaluationTourSteps'
import {
  AppIcon,
  ChevronDownIcon,
  SuccessCircleIcon,
} from '@/components/icons'
import {
  getPersonById,
  getStoredPersonnel,
  savePersonnelList,
  type CompetencePerson,
} from '@/lib/api/cabCompetenceApi'
import {
  getCabEmployeeDetail,
  updateCabEmployeeStatus,
  uploadCabEmployeeQualification,
  deleteCabEmployeeQualification,
  getProfessionalRoleLabel,
  formatEmployeePhone,
  CAB_PROFESSIONAL_ROLES,
  type CabEmployeeQualification,
} from '@/lib/api/cabEmployeesApi'
import { formatIafCodesToSectorNames } from '@/lib/iafCodes'
import { ApiError } from '@/lib/api/client'
import { getAuthSession } from '@/lib/authStorage'
import { ROUTES } from '@/lib/routes'
import { DatePicker } from '@/components/ui/DatePicker'
import { Toggle } from '@/components/ui/Toggle'
import {
  DocumentUploadField,
  type UploadedDocumentFile,
} from '@/components/dashboard/DocumentUploadField'

function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function fromIsoDate(value?: string | null): Date | undefined {
  if (!value) return undefined
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

export function CabCompetenceEvaluationPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const tourSteps = useCompetenceEvaluationTourSteps()

  const [person, setPerson] = useState<CompetencePerson | undefined>(() =>
    id ? getPersonById(id) : undefined
  )

  const session = getAuthSession()
  const currentUserName =
    (session?.user as { fullName?: string } | undefined)?.fullName ||
    session?.user?.email ||
    ''

  // Form states
  const [fullName, setFullName] = useState(person?.name || '')
  const [role, setRole] = useState(person?.role || 'Auditor')
  const [email, setEmail] = useState(person?.email || '')
  const [phone, setPhone] = useState(person?.phone || '')

  const [scheme, setScheme] = useState(person?.evaluation?.scheme || (person?.schemes?.[0] || ''))
  const [proposedSector, setProposedSector] = useState(() =>
    formatIafCodesToSectorNames(
      person?.iafCodes,
      person?.evaluation?.proposedSector || person?.authorizedScope || '',
      i18n.language
    )
  )
  const [evaluationDate, setEvaluationDate] = useState(
    person?.evaluation?.evaluationDate || new Date().toISOString().split('T')[0]
  )
  const rawEvaluator = person?.evaluation?.evaluator
  const defaultEvaluator =
    rawEvaluator && rawEvaluator !== 'Sara Ali' ? rawEvaluator : currentUserName
  const [evaluator, setEvaluator] = useState(defaultEvaluator)

  const [evalStatus] = useState(person?.evaluation?.status || 'In progress')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Dynamic Qualifications State
  const [qualifications, setQualifications] = useState<CabEmployeeQualification[]>([])
  const [isUploadingQual, setIsUploadingQual] = useState(false)
  const [qualError, setQualError] = useState<string | null>(null)

  // Load employee detail from backend API dynamically
  useEffect(() => {
    if (!id) return
    getCabEmployeeDetail(id)
      .then(({ employee }) => {
        if (employee) {
          const roleLabel = employee.professionalRole
            ? getProfessionalRoleLabel(employee.professionalRole)
            : 'Auditor'
          const storedPerson = getPersonById(employee.id)
          const resolvedName = storedPerson?.name || employee.user?.fullName || ''
          const resolvedSector =
            formatIafCodesToSectorNames(
              employee.iafCodes,
              storedPerson?.authorizedScope,
              i18n.language
            ) || 'Quality management systems'

          setFullName(resolvedName)
          setRole(roleLabel as any)
          setEmail(employee.user?.email || storedPerson?.email || '')
          setPhone(
            formatEmployeePhone(employee.user?.phone || storedPerson?.phone, employee.user?.phoneCountryCode)
          )
          if (employee.schemes?.length) {
            setScheme(employee.schemes[0])
          }
          setProposedSector(resolvedSector)
          if (employee.employmentStartDate) {
            setEvaluationDate(employee.employmentStartDate.split('T')[0])
          }
          if (employee.qualifications) {
            setQualifications(employee.qualifications)
          }

          const resolvedStatusDot: CompetencePerson['statusDot'] =
            storedPerson?.statusDot ?? (employee.status === 'INACTIVE' ? 'Inactive' : 'Active')

          setPerson((prev) => ({
            id: employee.id,
            code: prev?.code || storedPerson?.code || `PER-${employee.id.slice(0, 4).toUpperCase()}`,
            name: resolvedName || prev?.name || 'Employee',
            role: roleLabel as any,
            country: prev?.country || 'Saudi Arabia',
            schemes: employee.schemes || prev?.schemes || [],
            iafCodes: employee.iafCodes || prev?.iafCodes || [],
            authorizedScope: resolvedSector,
            expiryDate: prev?.expiryDate || '2026-12-31',
            status:
              resolvedStatusDot === 'Inactive'
                ? 'Suspended'
                : employee.status === 'ACTIVE'
                ? 'Authorized'
                : 'Under review',
            avatarUrl: employee.imageUrl || prev?.avatarUrl,
            email: employee.user?.email || prev?.email || '',
            phone: employee.user?.phone || prev?.phone || '',
            statusDot: resolvedStatusDot,
          }))
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch employee from backend:', err)
      })
  }, [id, i18n.language])

  const handleTogglePersonStatus = () => {
    if (!person) return
    const currentlyActive = person.statusDot !== 'Inactive'
    const nextStatusDot: CompetencePerson['statusDot'] = currentlyActive ? 'Inactive' : 'Active'
    const nextStatus: CompetencePerson['status'] = currentlyActive ? 'Suspended' : 'Authorized'

    setPerson((prev) => (prev ? { ...prev, statusDot: nextStatusDot, status: nextStatus } : prev))

    const stored = getStoredPersonnel()
    if (stored.some((item) => item.id === person.id)) {
      savePersonnelList(
        stored.map((item) =>
          item.id === person.id ? { ...item, statusDot: nextStatusDot, status: nextStatus } : item
        )
      )
    }

    if (person.id && !person.id.startsWith('per-')) {
      updateCabEmployeeStatus(person.id, currentlyActive ? 'INACTIVE' : 'ACTIVE').catch((err) => {
        console.warn('Backend updateCabEmployeeStatus error (proceeding with local state):', err)
      })
    }
  }

  // Upload qualification file dynamically to POST /cab-employees/{id}/qualifications
  const handleSelectQualificationFile = async (file: File) => {
    if (!id) return

    if (file.size > 20 * 1024 * 1024) {
      setQualError('File size exceeds the 20 MB limit.')
      return
    }

    setIsUploadingQual(true)
    setQualError(null)
    try {
      const res = await uploadCabEmployeeQualification(id, file, 'Qualification Document')
      if (res.qualification) {
        setQualifications((prev) => [res.qualification, ...prev])
        setToastMessage(res.message || 'Qualification uploaded successfully.')
        setTimeout(() => setToastMessage(null), 3000)
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setQualError(err.message)
      } else {
        setQualError('Failed to upload qualification.')
      }
    } finally {
      setIsUploadingQual(false)
    }
  }

  // Delete qualification file dynamically via DELETE /cab-employees/{id}/qualifications/{docId}
  const handleDeleteQualification = async (docId: string) => {
    if (!id) return
    try {
      await deleteCabEmployeeQualification(id, docId)
      setQualifications((prev) => prev.filter((q) => q.id !== docId))
      setToastMessage('Qualification deleted successfully.')
      setTimeout(() => setToastMessage(null), 3000)
    } catch (err) {
      if (err instanceof ApiError) {
        setQualError(err.message)
      } else {
        setQualError('Failed to delete qualification.')
      }
    }
  }

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const uploadedQualFiles: UploadedDocumentFile[] = qualifications.map((q) => ({
    id: q.id,
    name: q.originalName || q.fileName || 'document',
    sizeLabel: formatFileSize(q.fileSize),
    dateLabel: q.uploadedAt ? new Date(q.uploadedAt).toLocaleDateString() : undefined,
    url: q.fileUrl,
  }))

  const handleOpenQualFile = (file: UploadedDocumentFile) => {
    if (file.url) {
      window.open(file.url, '_blank', 'noopener,noreferrer')
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return 'EM'
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  if (!person) {
    return (
      <CabLayout sidebarVariant="competence">
        <CabHeader title={t('cab.competence.title', 'Competence Register')} />
        <main className="flex-1 bg-[#f9fafc] p-6 lg:p-8">
          <div className="mx-auto max-w-7xl text-center py-16">
            <p className="text-[16px] text-neutral-500 mb-4">
              {t('cab.competence.memberProfile.notFound', 'Personnel record not found.')}
            </p>
            <button
              onClick={() => navigate(ROUTES.cabCompetence)}
              className="rounded-[8px] bg-primary px-4 py-2 text-white font-semibold"
            >
              {t('cab.competence.memberProfile.backToRegister', 'Back to Register')}
            </button>
          </div>
        </main>
      </CabLayout>
    )
  }

  return (
    <CabLayout
      sidebarVariant="competence"
      tourId="competence-evaluation-tour"
      tourSteps={tourSteps}
    >
      <CabHeader title={t('cab.competence.title', 'Competence Register')} notificationCount={3} />

      <main className="flex-1 bg-[#f9fafc] p-3 sm:p-5 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed bottom-6 end-6 z-50 flex items-center gap-3 rounded-[10px] bg-neutral-900 px-4 py-3 text-[14px] font-medium text-white shadow-xl animate-in slide-in-from-bottom-5">
              <AppIcon icon={SuccessCircleIcon} size={18} className="text-emerald-400" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-[13px] font-medium text-neutral-500">
            <button
              type="button"
              onClick={() => navigate(ROUTES.cabCompetence)}
              className="text-primary hover:underline font-semibold"
            >
              {t('cab.competence.title', 'Competence Register')}
            </button>
            <span className="text-neutral-300">/</span>
            <button
              type="button"
              onClick={() => navigate(ROUTES.cabCompetence)}
              className="text-primary hover:underline font-semibold"
            >
              {t('cab.competence.personnelRegister', 'Personnel register')}
            </button>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-600 font-medium">{person.code}</span>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-900 font-semibold">
              {t('cab.competence.evaluation.tabs.evaluation', 'Profile')}
            </span>
          </div>

          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CabTourStep steps={tourSteps} stepId="eval-header">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[22px] sm:text-[26px] font-extrabold text-neutral-900 tracking-tight">
                    {t('cab.competence.evaluation.pageTitle', 'Competence Profile')}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-[12px] font-bold text-primary border border-primary/20">
                    <span className="size-1.5 rounded-full bg-primary" />
                    {evalStatus === 'Authorized'
                      ? t('cab.competence.statusAuthorized', 'Authorized')
                      : evalStatus === 'In progress'
                      ? t('cab.competence.evaluation.statusInProg', 'In progress')
                      : t('cab.competence.statusUnderReview', 'Under review')}
                  </span>
                </div>
                <p className="mt-1 text-[13px] sm:text-[14px] text-neutral-500">
                  {t(
                    'cab.competence.evaluation.pageSubtitle',
                    'Assess and record competence for personnel'
                  )}
                </p>
              </div>
            </CabTourStep>
          </div>

          {/* Personnel Quick Info Profile Card */}
          <CabTourStep steps={tourSteps} stepId="eval-profile">
            <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Left Profile Info */}
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-full bg-primary flex items-center justify-center text-white text-[18px] font-bold shadow-sm shrink-0 overflow-hidden">
                    {person.avatarUrl ? (
                      <img
                        src={person.avatarUrl}
                        alt={person.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      getInitials(person.name)
                    )}
                  </div>
                  <div>
                    <h2 className="text-[18px] sm:text-[20px] font-bold text-neutral-900 leading-tight">
                      {person.name}
                    </h2>
                    <p className="text-[13px] text-neutral-500 font-mono mt-0.5">{person.code}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/cab/competence/persons/${person.id}/edit`)}
                    className="ms-3 rounded-[8px] border border-[#e2e2e2] bg-white px-3 py-1.5 text-[12px] font-semibold text-neutral-700 hover:bg-neutral-50 shadow-xs"
                  >
                    {t('cab.competence.memberProfile.editProfile', 'Edit profile')}
                  </button>
                </div>

                {/* Right Meta details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 border-t lg:border-t-0 pt-4 lg:pt-0 border-neutral-100">
                  <div>
                    <span className="block text-[12px] font-medium text-neutral-400 mb-1">
                      {t('cab.competence.columns.status', 'Status')}
                    </span>
                    <Toggle
                      checked={person.statusDot !== 'Inactive'}
                      label={
                        person.statusDot !== 'Inactive'
                          ? t('users.status.active', 'Active')
                          : t('users.status.inactive', 'Inactive')
                      }
                      onChange={handleTogglePersonStatus}
                    />
                  </div>

                  <div>
                    <span className="block text-[12px] font-medium text-neutral-400">
                      {t('cab.competence.columns.role', 'Role')}
                    </span>
                    <span className="text-[13px] sm:text-[14px] font-semibold text-neutral-800 mt-0.5 block">
                      {person.role}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[12px] font-medium text-neutral-400">
                      {t('cab.competence.evaluation.profile.email', 'Email')}
                    </span>
                    <a
                      href={`mailto:${person.email}`}
                      className="text-[13px] sm:text-[14px] font-medium text-primary hover:underline mt-0.5 block truncate max-w-[170px]"
                    >
                      {person.email}
                    </a>
                  </div>

                  <div>
                    <span className="block text-[12px] font-medium text-neutral-400">
                      {t('cab.competence.evaluation.profile.phone', 'Phone')}
                    </span>
                    <span
                      className="text-[13px] sm:text-[14px] font-medium text-neutral-800 mt-0.5 block"
                      dir="ltr"
                    >
                      {person.phone || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CabTourStep>

          {/* Main 2 Columns Form Card */}
          <CabTourStep steps={tourSteps} stepId="eval-criteria-form">
            <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-6 shadow-sm">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Column 1: General information */}
                <div className="space-y-4">
                  <h3 className="text-[16px] font-bold text-neutral-900 border-b border-neutral-100 pb-2">
                    {t('cab.competence.evaluation.sections.generalInfo', 'General information')}
                  </h3>

                  <div>
                    <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                      {t('cab.competence.evaluation.fields.personId', 'Person ID')}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={person.code}
                      className="h-10 w-full rounded-[8px] border border-[#e2e2e2] bg-[#f9fafb] px-3 text-[14px] font-mono text-neutral-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                      {t('cab.competence.evaluation.fields.fullName', 'Full name')}
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] text-neutral-900 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                      {t('cab.competence.evaluation.fields.role', 'Role')}
                    </label>
                    <div className="relative">
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
                        className="h-10 w-full appearance-none rounded-[8px] border border-[#e2e2e2] px-3 pe-8 text-[14px] text-neutral-900 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                      >
                        {CAB_PROFESSIONAL_ROLES.map((r) => (
                          <option key={r.value} value={r.label}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <AppIcon
                        icon={ChevronDownIcon}
                        size={14}
                        className="pointer-events-none absolute inset-y-0 end-3 my-auto text-neutral-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                      {t('cab.competence.evaluation.fields.email', 'Email')}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] text-neutral-900 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                      {t('cab.competence.evaluation.fields.phone', 'Phone')}
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] text-neutral-900 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Column 2: Evaluation details */}
                <div className="space-y-4">
                  <h3 className="text-[16px] font-bold text-neutral-900 border-b border-neutral-100 pb-2">
                    {t('cab.competence.evaluation.sections.evalDetails', 'Evaluation details')}
                  </h3>

                  <div>
                    <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                      {t('cab.competence.evaluation.fields.scheme', 'Scheme')}
                    </label>
                    <div className="relative">
                      <select
                        value={scheme}
                        onChange={(e) => setScheme(e.target.value)}
                        className="h-10 w-full appearance-none rounded-[8px] border border-[#e2e2e2] px-3 pe-8 text-[14px] text-neutral-900 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                      >
                        {person.schemes?.length ? (
                          person.schemes.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="ISO 9001">ISO 9001</option>
                            <option value="ISO 14001">ISO 14001</option>
                            <option value="ISO 45001">ISO 45001</option>
                            <option value="ISO 22000">ISO 22000</option>
                            <option value="ISO 27001">ISO 27001</option>
                            <option value="HACCP">HACCP</option>
                          </>
                        )}
                      </select>
                      <AppIcon
                        icon={ChevronDownIcon}
                        size={14}
                        className="pointer-events-none absolute inset-y-0 end-3 my-auto text-neutral-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                      {t('cab.competence.evaluation.fields.proposedSector', 'Proposed sector')}
                    </label>
                    <input
                      type="text"
                      value={proposedSector}
                      onChange={(e) => setProposedSector(e.target.value)}
                      className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] text-neutral-900 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                      {t('cab.competence.evaluation.fields.evalDate', 'Evaluation date')}
                    </label>
                    <DatePicker
                      value={fromIsoDate(evaluationDate)}
                      onChange={(date) => setEvaluationDate(toIsoDate(date))}
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-neutral-700 mb-1">
                      {t('cab.competence.evaluation.fields.evaluator', 'Evaluator')}
                    </label>
                    <input
                      type="text"
                      value={evaluator}
                      onChange={(e) => setEvaluator(e.target.value)}
                      className="h-10 w-full rounded-[8px] border border-[#e2e2e2] px-3 text-[14px] text-neutral-900 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CabTourStep>

          {/* Dynamic Qualifications Documents Upload & List Section */}
          <CabTourStep steps={tourSteps} stepId="eval-documents-section">
            <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-6 shadow-sm space-y-4">
              {qualError && (
                <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-[13px] text-red-700">
                  {qualError}
                </div>
              )}

              <div className="rounded-[12px] border border-dashed border-primary/30 p-3">
                <DocumentUploadField
                  title={t('cab.competence.qualificationsDocuments', 'Qualification Documents')}
                  note={t(
                    'cab.competence.qualificationsDesc',
                    'Upload certificates, diplomas, and official competence records (PDF, Word, Images max 20 MB).'
                  )}
                  files={uploadedQualFiles}
                  busy={isUploadingQual}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  onSelectFile={handleSelectQualificationFile}
                  onDeleteFile={(fileId) => handleDeleteQualification(fileId)}
                  onOpenFile={handleOpenQualFile}
                />
              </div>
            </div>
          </CabTourStep>
        </div>
      </main>
    </CabLayout>
  )
}
