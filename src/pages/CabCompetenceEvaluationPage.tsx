import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { useCompetenceEvaluationTourSteps } from '@/config/competenceEvaluationTourSteps'
import { Button } from '@/components/ui/Button'
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
  listCabEmployeeImpartialityDeclarations,
  listCabEmployeeImpartialityRelationships,
  listCabEmployeeAvailabilityPeriods,
  type CabEmployeeQualification,
  type CabQualificationCategory,
  type CabImpartialityDeclaration,
  type CabImpartialityRelationship,
  type CabAvailabilityPeriod,
} from '@/lib/api/cabEmployeesApi'
import { formatIafCodesToSectorNames } from '@/lib/iafCodes'
import { getAuthSession } from '@/lib/authStorage'
import { resolvePublicAssetUrl } from '@/lib/publicAssetUrl'
import { ROUTES } from '@/lib/routes'
import { EvaluationProfileCard } from '@/components/dashboard/cab/evaluation/EvaluationProfileCard'
import { EvaluationGeneralDetailsSection } from '@/components/dashboard/cab/evaluation/EvaluationGeneralDetailsSection'
import { EvaluationQualificationsSection } from '@/components/dashboard/cab/evaluation/EvaluationQualificationsSection'
import { EvaluationImpartialitySection } from '@/components/dashboard/cab/evaluation/EvaluationImpartialitySection'
import { EvaluationAvailabilitySection } from '@/components/dashboard/cab/evaluation/EvaluationAvailabilitySection'

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-400 rtl-flip" aria-hidden>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CabCompetenceEvaluationPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const tourSteps = useCompetenceEvaluationTourSteps()

  const [person, setPerson] = useState<CompetencePerson | undefined>(() =>
    id ? getPersonById(id) : undefined
  )
  const [loading, setLoading] = useState(Boolean(id))

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

  // Dynamic Qualifications & Categories State (Read-only view)
  const [categories, setCategories] = useState<CabQualificationCategory[]>([])
  const [uncategorizedQualifications, setUncategorizedQualifications] = useState<CabEmployeeQualification[]>([])
  const [declarations, setDeclarations] = useState<CabImpartialityDeclaration[]>([])
  const [relationships, setRelationships] = useState<CabImpartialityRelationship[]>([])
  const [availabilityPeriods, setAvailabilityPeriods] = useState<CabAvailabilityPeriod[]>([])

  // Load employee detail from backend API dynamically
  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    setLoading(true)
    getCabEmployeeDetail(id)
      .then(({ employee }) => {
        if (employee) {
          const roleLabel = employee.professionalRole
            ? getProfessionalRoleLabel(employee.professionalRole)
            : 'Auditor'
          const storedPerson = getPersonById(employee.id)
          const resolvedName =
            employee.fullName || employee.user?.fullName || storedPerson?.name || ''
          const resolvedSector =
            employee.authorizedSectors?.[0] ||
            formatIafCodesToSectorNames(
              employee.iafCodes,
              storedPerson?.authorizedScope,
              i18n.language
            ) ||
            'Quality management systems'

          const resolvedEmail =
            employee.email || employee.user?.email || storedPerson?.email || ''
          const resolvedPhone =
            formatEmployeePhone(
              employee.phone ?? employee.user?.phone,
              employee.phoneCountryCode ?? employee.user?.phoneCountryCode
            ) ||
            storedPerson?.phone ||
            ''

          setFullName(resolvedName)
          setRole(roleLabel as CompetencePerson['role'])
          setEmail(resolvedEmail)
          setPhone(resolvedPhone)
          if (employee.schemes?.length) {
            setScheme(employee.schemes[0])
          }
          setProposedSector(resolvedSector)
          const resolvedStartDate =
            employee.employmentStartDate || storedPerson?.employmentStartDate
          if (resolvedStartDate) {
            setEvaluationDate(resolvedStartDate.split('T')[0])
          }

          const backendCats = (employee.qualificationCategories ?? []).map((cat) => {
            const nestedDocs = cat.documents ?? []
            const linkedFlatDocs = (employee.qualifications ?? []).filter(
              (q) => q.categoryId === cat.id && !nestedDocs.some((nd) => nd.id === q.id)
            )
            return {
              ...cat,
              name: cat.name || (cat as { categoryName?: string }).categoryName || 'Qualification Documents',
              documents: [...nestedDocs, ...linkedFlatDocs],
            }
          })
          setCategories(backendCats)
          const catDocIds = new Set(
            backendCats.flatMap((c) => (c.documents ?? []).map((d) => d.id))
          )
          const uncatDocs = (employee.qualifications ?? []).filter(
            (q) => !catDocIds.has(q.id)
          )
          setUncategorizedQualifications(uncatDocs)

          if (Array.isArray(employee.impartialityDeclarations)) {
            setDeclarations(employee.impartialityDeclarations)
          } else {
            listCabEmployeeImpartialityDeclarations(id)
              .then((res) => setDeclarations(res?.declarations ?? []))
              .catch(() => {})
          }

          if (Array.isArray(employee.declaredRelationships)) {
            setRelationships(employee.declaredRelationships)
          } else {
            listCabEmployeeImpartialityRelationships(id)
              .then((res) => setRelationships(res?.relationships ?? []))
              .catch(() => {})
          }

          if (Array.isArray(employee.availabilityPeriods)) {
            setAvailabilityPeriods(employee.availabilityPeriods)
          } else {
            listCabEmployeeAvailabilityPeriods(id)
              .then((res) => setAvailabilityPeriods(res?.periods ?? []))
              .catch(() => {})
          }

          const resolvedStatusDot: CompetencePerson['statusDot'] =
            employee.status === 'INACTIVE' ? 'Inactive' : 'Active'

          setPerson((prev) => ({
            id: employee.id,
            code:
              employee.employeeCode ||
              prev?.code ||
              storedPerson?.code ||
              `EMP-${employee.id.slice(0, 4).toUpperCase()}`,
            name: resolvedName || prev?.name || 'Employee',
            role: roleLabel as CompetencePerson['role'],
            country:
              employee.scopeCountry ||
              employee.baseCountry ||
              prev?.country ||
              'Saudi Arabia',
            schemes: employee.schemes || prev?.schemes || [],
            iafCodes: employee.iafCodes || prev?.iafCodes || [],
            auditLanguages: employee.auditLanguages || prev?.auditLanguages || [],
            baseCountry: employee.baseCountry || prev?.baseCountry || '',
            baseCity: employee.baseCity || prev?.baseCity || '',
            authorizedScope: resolvedSector,
            expiryDate:
              (employee.scopeExpiryDate || employee.expiryDate || prev?.expiryDate || '')
                .split('T')[0],
            status:
              resolvedStatusDot === 'Inactive'
                ? 'Suspended'
                : employee.status === 'ACTIVE'
                ? 'Authorized'
                : 'Under review',
            avatarUrl:
              resolvePublicAssetUrl(employee.imageUrl) || prev?.avatarUrl,
            email: resolvedEmail,
            phone: resolvedPhone,
            statusDot: resolvedStatusDot,
          }))
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch employee from backend:', err)
      })
      .finally(() => {
        setLoading(false)
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

  if (loading && !person) {
    return (
      <CabLayout sidebarVariant="competence">
        <CabHeader title={t('cab.competence.title', 'Competence Register')} notificationCount={3} />
        <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
          <div className="flex items-center justify-center rounded-[16px] border border-[#ececec] bg-white p-12">
            <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </main>
      </CabLayout>
    )
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

        {/* 1. Personnel Quick Info Profile Card */}
        <CabTourStep steps={tourSteps} stepId="eval-profile">
          <EvaluationProfileCard
            person={person}
            onToggleStatus={handleTogglePersonStatus}
            onEditProfile={() => navigate(`/cab/competence/persons/${person.id}/edit`)}
          />
        </CabTourStep>

        {/* 2. General Information & Evaluation Details Section */}
        <CabTourStep steps={tourSteps} stepId="eval-criteria-form">
          <EvaluationGeneralDetailsSection
            code={person.code}
            fullName={fullName}
            role={role}
            email={email}
            phone={phone}
            baseCountry={person.baseCountry}
            baseCity={person.baseCity}
            auditLanguages={person.auditLanguages}
            schemes={person.schemes}
            scheme={scheme}
            proposedSector={proposedSector}
            evaluationDate={evaluationDate}
            evaluator={evaluator}
          />
        </CabTourStep>

        {/* 3. Read-only Qualifications Categories & Documents Section */}
        <CabTourStep steps={tourSteps} stepId="eval-documents-section">
          <EvaluationQualificationsSection
            categories={categories}
            uncategorizedQualifications={uncategorizedQualifications}
          />
        </CabTourStep>

        {/* 4. Read-only Impartiality Declarations & Client Relationships Section */}
        <EvaluationImpartialitySection
          declarations={declarations}
          relationships={relationships}
        />

        {/* 5. Read-only Availability & Leave Periods Section */}
        <EvaluationAvailabilitySection availabilityPeriods={availabilityPeriods} />
      </main>
    </CabLayout>
  )
}
