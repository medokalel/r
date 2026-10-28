import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useCompetenceEvaluationTourSteps } from '@/config/competenceEvaluationTourSteps'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { Button } from '@/components/ui/Button'
import {
  fieldInputClassName,
  fieldHeightClassName,
  fieldLabelClassName,
} from '@/components/ui/fieldStyles'
import {
  AppIcon,
  ChevronDownIcon,
  EditIcon,
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
  getProfessionalRoleLabel,
  formatEmployeePhone,
  CAB_PROFESSIONAL_ROLES,
  type CabEmployeeQualification,
} from '@/lib/api/cabEmployeesApi'
import { formatIafCodesToSectorNames } from '@/lib/iafCodes'
import { getAuthSession } from '@/lib/authStorage'
import { ROUTES } from '@/lib/routes'
import { DatePicker } from '@/components/ui/DatePicker'
import { Toggle } from '@/components/ui/Toggle'
import {
  DocumentUploadField,
  type UploadedDocumentFile,
} from '@/components/dashboard/DocumentUploadField'
import { cn } from '@/lib/utils'

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-400 rtl-flip" aria-hidden>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function fromIsoDate(value?: string | null): Date | undefined {
  if (!value) return undefined
  const datePart = value.split('T')[0]
  const parsed = new Date(`${datePart}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

const readonlyFieldClass = cn(
  'mt-1',
  fieldInputClassName,
  fieldHeightClassName,
  'bg-[#f9fafb] text-neutral-500 cursor-not-allowed',
)

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
  const evaluator =
    rawEvaluator && rawEvaluator !== 'Sara Ali' ? rawEvaluator : currentUserName

  const [evalStatus] = useState(person?.evaluation?.status || 'In progress')

  // Dynamic Qualifications State
  const [qualifications, setQualifications] = useState<CabEmployeeQualification[]>([])

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
            storedPerson?.phone || formatEmployeePhone(employee.user?.phone, employee.user?.phoneCountryCode)
          )
          if (employee.schemes?.length) {
            setScheme(employee.schemes[0])
          }
          setProposedSector(resolvedSector)
          const resolvedStartDate = storedPerson?.employmentStartDate || employee.employmentStartDate
          if (resolvedStartDate) {
            setEvaluationDate(resolvedStartDate.split('T')[0])
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
            expiryDate: prev?.expiryDate || ((employee as { expiryDate?: string | null }).expiryDate?.split('T')[0]) || '',
            status:
              resolvedStatusDot === 'Inactive'
                ? 'Suspended'
                : employee.status === 'ACTIVE'
                ? 'Authorized'
                : 'Under review',
            avatarUrl: employee.imageUrl || prev?.avatarUrl,
            email: employee.user?.email || prev?.email || '',
            phone: storedPerson?.phone || prev?.phone || formatEmployeePhone(employee.user?.phone, employee.user?.phoneCountryCode),
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
    dateLabel: q.uploadedAt
      ? new Intl.DateTimeFormat(i18n.language, {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        }).format(new Date(q.uploadedAt))
      : undefined,
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
        <CabHeader title={t('cab.competence.title', 'Competence Register')} notificationCount={3} />
        <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
          <div className="rounded-[16px] border border-[#ececec] bg-white p-12 text-center">
            <p className="mb-4 text-[15px] text-neutral-500">
              {t('cab.competence.memberProfile.notFound', 'Personnel record not found.')}
            </p>
            <Button variant="primary" onClick={() => navigate(ROUTES.cabCompetence)}>
              {t('cab.competence.memberProfile.backToRegister', 'Back to Register')}
            </Button>
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

      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        {/* Breadcrumbs */}
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]" aria-label="breadcrumb">
          <Link to={ROUTES.workspace} className="font-light text-neutral-400 hover:text-primary">
            {t('cab.competence.title', 'Competence Register')}
          </Link>
          <Chevron />
          <Link to={ROUTES.cabCompetence} className="font-light text-neutral-400 hover:text-primary">
            {t('cab.competence.personnelRegister', 'Personnel register')}
          </Link>
          <Chevron />
          <span className="font-light text-neutral-400" dir="ltr">
            {person.code}
          </span>
          <Chevron />
          <span className="font-medium text-neutral-700">
            {t('cab.competence.evaluation.tabs.evaluation', 'Profile')}
          </span>
        </nav>

        {/* Header Row */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <CabTourStep steps={tourSteps} stepId="eval-header">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[28px] font-bold leading-tight text-neutral-900">
                  {t('cab.competence.evaluation.pageTitle', 'Competence Profile')}
                </h1>
                <span className="inline-flex items-center justify-center rounded-[4px] bg-[#e8edfc] px-3 py-1 text-[12px] font-medium whitespace-nowrap text-[#1236a3]">
                  {evalStatus === 'Authorized'
                    ? t('cab.competence.statusAuthorized', 'Authorized')
                    : evalStatus === 'In progress'
                    ? t('cab.competence.evaluation.statusInProg', 'In progress')
                    : t('cab.competence.statusUnderReview', 'Under review')}
                </span>
              </div>
              <p className="mt-1 text-[14px] text-neutral-500">
                {t(
                  'cab.competence.evaluation.pageSubtitle',
                  'Assess and record competence for personnel'
                )}
              </p>
            </div>
          </CabTourStep>

          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.cabCompetence)}
          >
            {t('cab.competence.memberProfile.backToRegister', 'Back to Register')}
          </Button>
        </div>

        {/* Personnel Quick Info Profile Card */}
        <CabTourStep steps={tourSteps} stepId="eval-profile">
          <section className="rounded-[16px] border border-[#ececec] bg-white p-5">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              {/* Left Profile Info */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-[18px] font-bold text-white shadow-sm">
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
                  <h2 className="text-[18px] font-bold leading-tight text-neutral-900 sm:text-[20px]">
                    {person.name}
                  </h2>
                  <p className="mt-0.5 text-[13px] text-neutral-500" dir="ltr">
                    {person.code}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<AppIcon icon={EditIcon} size={15} />}
                  onClick={() => navigate(`/cab/competence/persons/${person.id}/edit`)}
                  className="ms-2"
                >
                  {t('cab.competence.memberProfile.editProfile', 'Edit profile')}
                </Button>
              </div>

              {/* Right Meta details */}
              <div className="flex flex-wrap items-center gap-6 border-t border-[#ececec] pt-4 sm:gap-8 lg:border-t-0 lg:pt-0">
                <div>
                  <span className="mb-1 block text-[12px] font-medium text-neutral-400">
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
                  <span className="mt-0.5 block text-[14px] font-semibold text-neutral-800 whitespace-nowrap">
                    {person.role}
                  </span>
                </div>

                <div>
                  <span className="block text-[12px] font-medium text-neutral-400">
                    {t('cab.competence.evaluation.profile.email', 'Email')}
                  </span>
                  <a
                    href={`mailto:${person.email}`}
                    className="mt-0.5 block break-all text-[14px] font-medium text-primary hover:underline"
                    dir="ltr"
                  >
                    {person.email || '—'}
                  </a>
                </div>

                <div>
                  <span className="block text-[12px] font-medium text-neutral-400">
                    {t('cab.competence.evaluation.profile.phone', 'Phone')}
                  </span>
                  <span
                    className="mt-0.5 block text-[14px] font-medium text-neutral-800 whitespace-nowrap"
                    dir="ltr"
                  >
                    {person.phone || '—'}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </CabTourStep>

        {/* Main 2 Columns Form Card */}
        <CabTourStep steps={tourSteps} stepId="eval-criteria-form">
          <div className="space-y-5">
            <SectionHeading
              title={`${t('cab.competence.evaluation.sections.generalInfo', 'General information')} & ${t('cab.competence.evaluation.sections.evalDetails', 'Evaluation details')}`}
              accordion
            >
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Column 1: General information */}
                <div className="space-y-4">
                  <h3 className="border-b border-[#ececec] pb-2 text-[15px] font-bold text-neutral-900">
                    {t('cab.competence.evaluation.sections.generalInfo', 'General information')}
                  </h3>

                  <div>
                    <label className={cn('block', fieldLabelClassName)}>
                      {t('cab.competence.evaluation.fields.personId', 'Person ID')}
                    </label>
                    <input
                      type="text"
                      disabled
                      dir="ltr"
                      value={person.code}
                      className={cn(readonlyFieldClass, 'text-start')}
                    />
                  </div>

                  <div>
                    <label className={cn('block', fieldLabelClassName)}>
                      {t('cab.competence.evaluation.fields.fullName', 'Full name')}
                    </label>
                    <input
                      type="text"
                      disabled
                      readOnly
                      value={fullName}
                      className={readonlyFieldClass}
                    />
                  </div>

                  <div>
                    <label className={cn('block', fieldLabelClassName)}>
                      {t('cab.competence.evaluation.fields.role', 'Role')}
                    </label>
                    <div className="relative">
                      <select
                        disabled
                        value={role}
                        className={cn(readonlyFieldClass, 'appearance-none pe-8')}
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
                    <label className={cn('block', fieldLabelClassName)}>
                      {t('cab.competence.evaluation.fields.email', 'Email')}
                    </label>
                    <input
                      type="email"
                      disabled
                      readOnly
                      dir="ltr"
                      value={email}
                      className={cn(readonlyFieldClass, 'text-start')}
                    />
                  </div>

                  <div>
                    <label className={cn('block', fieldLabelClassName)}>
                      {t('cab.competence.evaluation.fields.phone', 'Phone')}
                    </label>
                    <input
                      type="text"
                      disabled
                      readOnly
                      dir="ltr"
                      value={phone}
                      className={cn(readonlyFieldClass, 'text-start')}
                    />
                  </div>
                </div>

                {/* Column 2: Evaluation details */}
                <div className="space-y-4">
                  <h3 className="border-b border-[#ececec] pb-2 text-[15px] font-bold text-neutral-900">
                    {t('cab.competence.evaluation.sections.evalDetails', 'Evaluation details')}
                  </h3>

                  <div>
                    <label className={cn('block', fieldLabelClassName)}>
                      {t('cab.competence.evaluation.fields.scheme', 'Scheme')}
                    </label>
                    <div className="relative">
                      <select
                        disabled
                        value={scheme}
                        className={cn(readonlyFieldClass, 'appearance-none pe-8')}
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
                    <label className={cn('block', fieldLabelClassName)}>
                      {t('cab.competence.evaluation.fields.proposedSector', 'Proposed sector')}
                    </label>
                    <input
                      type="text"
                      disabled
                      readOnly
                      value={proposedSector}
                      className={readonlyFieldClass}
                    />
                  </div>

                  <div>
                    <label className={cn('mb-1 block', fieldLabelClassName)}>
                      {t('cab.competence.evaluation.fields.evalDate', 'Evaluation date')}
                    </label>
                    <DatePicker
                      disabled
                      value={fromIsoDate(evaluationDate)}
                    />
                  </div>

                  <div>
                    <label className={cn('block', fieldLabelClassName)}>
                      {t('cab.competence.evaluation.fields.evaluator', 'Evaluator')}
                    </label>
                    <input
                      type="text"
                      disabled
                      readOnly
                      value={evaluator}
                      className={readonlyFieldClass}
                    />
                  </div>
                </div>
              </div>
            </SectionHeading>
          </div>
        </CabTourStep>

        {/* Dynamic Qualifications Documents Upload & List Section */}
        <CabTourStep steps={tourSteps} stepId="eval-documents-section">
          <div>
            <SectionHeading
              title={t('cab.competence.qualificationsDocuments', 'Qualification Documents')}
              accordion
            >
              <div className="rounded-[12px] border border-dashed border-primary/30 bg-white p-3">
                <DocumentUploadField
                  title={t('cab.competence.qualificationsDocuments', 'Qualification Documents')}
                  note={t(
                    'cab.competence.qualificationsDesc',
                    'Upload certificates, diplomas, and official competence records (PDF, Word, Images max 20 MB).'
                  )}
                  files={uploadedQualFiles}
                  readOnly
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  onOpenFile={handleOpenQualFile}
                />
              </div>
            </SectionHeading>
          </div>
        </CabTourStep>
      </main>
    </CabLayout>
  )
}
