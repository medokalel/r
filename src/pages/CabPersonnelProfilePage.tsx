import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { usePersonnelProfileTourSteps } from '@/config/personnelProfileTourSteps'
import { PersonnelProfileForm } from '@/components/dashboard/cab/PersonnelProfileForm'
import { Button } from '@/components/ui/Button'
import {
  getPersonById,
  getStoredPersonnel,
  savePersonnelList,
  type CompetencePerson,
} from '@/lib/api/cabCompetenceApi'
import { getCabEmployeeDetail, getProfessionalRoleLabel, formatEmployeePhone } from '@/lib/api/cabEmployeesApi'
import { resolvePublicAssetUrl } from '@/lib/publicAssetUrl'
import { ROUTES } from '@/lib/routes'

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-400 rtl-flip" aria-hidden>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CabPersonnelProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tourSteps = usePersonnelProfileTourSteps()

  const [person, setPerson] = useState<CompetencePerson | undefined>(() =>
    id ? getPersonById(id) : undefined
  )
  const [loading, setLoading] = useState(Boolean(id))

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    getCabEmployeeDetail(id)
      .then(({ employee }) => {
        if (employee) {
          const stored = getPersonById(id)
          const roleLabel = employee.professionalRole
            ? getProfessionalRoleLabel(employee.professionalRole)
            : 'Auditor'
          const rawStart = employee.employmentStartDate || stored?.employmentStartDate
          const rawEnd = employee.employmentEndDate || stored?.employmentEndDate
          const backendStart = employee.employmentStartDate?.split('T')[0]
          const storedExpiry = stored?.expiryDate?.split('T')[0]
          const cleanStoredExpiry =
            storedExpiry && storedExpiry !== '2026-12-31' && storedExpiry !== backendStart
              ? storedExpiry
              : ''
          const backendExpiry = (employee.scopeExpiryDate || employee.expiryDate)?.split('T')[0]

          setPerson({
            ...stored,
            id: employee.id,
            code:
              employee.employeeCode ||
              stored?.code ||
              `EMP-${employee.id.slice(0, 4).toUpperCase()}`,
            name: employee.fullName || employee.user?.fullName || stored?.name || 'Employee',
            role: (roleLabel as CompetencePerson['role']) || 'Auditor',
            country:
              employee.scopeCountry ||
              employee.baseCountry ||
              stored?.country ||
              'Saudi Arabia',
            schemes: employee.schemes?.length ? employee.schemes : stored?.schemes || [],
            authorizedScope:
              employee.authorizedSectors?.[0] ||
              stored?.authorizedScope ||
              (employee.iafCodes?.length ? `IAF: ${employee.iafCodes.join(', ')}` : '') ||
              'Quality management systems',
            expiryDate: backendExpiry || cleanStoredExpiry || '',
            status: employee.status === 'ACTIVE' ? 'Authorized' : 'Under review',
            avatarUrl:
              resolvePublicAssetUrl(employee.imageUrl) || stored?.avatarUrl || undefined,
            employmentStartDate: rawStart ? rawStart.split('T')[0] : undefined,
            employmentEndDate: rawEnd ? rawEnd.split('T')[0] : undefined,
            iafCodes: employee.iafCodes || stored?.iafCodes || [],
            auditLanguages: employee.auditLanguages || stored?.auditLanguages || [],
            baseCountry: employee.baseCountry || stored?.baseCountry || '',
            baseCity: employee.baseCity || stored?.baseCity || '',
            email: employee.email || employee.user?.email || stored?.email || '',
            phone:
              formatEmployeePhone(
                employee.phone ?? employee.user?.phone,
                employee.phoneCountryCode ?? employee.user?.phoneCountryCode
              ) ||
              stored?.phone ||
              '',
            statusDot: employee.status === 'INACTIVE' ? 'Inactive' : 'Active',
          })
        }
      })
      .catch(() => {
        setPerson(getPersonById(id))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [id])

  const title = t(id ? 'cab.competence.memberProfile.editProfile' : 'cab.competence.addNewPerson')
  const backToRegister = () => navigate(ROUTES.cabCompetence)

  const handleSaved = (savedPerson: CompetencePerson) => {
    const list = getStoredPersonnel()
    const existingIndex = list.findIndex((item) => item.id === savedPerson.id)
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...savedPerson }
    } else {
      list.unshift(savedPerson)
    }
    savePersonnelList(list)
    navigate(ROUTES.cabCompetence)
  }

  return (
    <CabLayout
      sidebarVariant="competence"
      tourId="personnel-profile-tour"
      tourSteps={tourSteps}
    >
      <CabHeader title={t('cab.competence.title')} notificationCount={3} />
      <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <nav aria-label="breadcrumb" className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]">
          <Link to={ROUTES.workspace} className="font-light text-neutral-400 hover:text-primary">
            {t('cab.competence.title')}
          </Link>
          <Chevron />
          <Link to={ROUTES.cabCompetence} className="font-light text-neutral-400 hover:text-primary">
            {t('cab.competence.personnelRegister', 'Personnel register')}
          </Link>
          <Chevron />
          <span aria-current="page" className="font-medium text-neutral-700">
            {title}
          </span>
        </nav>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <CabTourStep steps={tourSteps} stepId="profile-header">
            <div>
              <h1 className="text-[28px] font-bold leading-tight text-neutral-900">{title}</h1>
              <p className="mt-1 text-[14px] text-neutral-500">
                {person ? `${person.name} · ${person.code}` : t('cab.competence.memberProfile.pageDescription')}
              </p>
            </div>
          </CabTourStep>
          <Button variant="outline" onClick={backToRegister}>
            {t('cab.competence.memberProfile.backToRegister')}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-[16px] border border-[#ececec] bg-white p-12">
            <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : id && !person ? (
          <p role="alert" className="rounded-[16px] border border-[#ececec] bg-white p-8 text-[15px] text-neutral-500">
            {t('cab.competence.memberProfile.notFound')}
          </p>
        ) : (
          <PersonnelProfileForm
            key={id ?? 'new'}
            person={person}
            onCancel={backToRegister}
            onSaved={handleSaved}
            tourSteps={tourSteps}
          />
        )}
      </main>
    </CabLayout>
  )
}
