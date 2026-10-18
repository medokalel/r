import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { CabTourStep } from '@/components/dashboard/cab/CabDashboardTourStep'
import { usePersonnelProfileTourSteps } from '@/config/personnelProfileTourSteps'
import { PersonnelProfileForm } from '@/components/dashboard/cab/PersonnelProfileForm'
import { Button } from '@/components/ui/Button'
import { getPersonById, type CompetencePerson } from '@/lib/api/cabCompetenceApi'
import { getCabEmployeeDetail, getProfessionalRoleLabel } from '@/lib/api/cabEmployeesApi'
import { ROUTES } from '@/lib/routes'

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
          setPerson({
            id: employee.id,
            code: stored?.code || `PER-${employee.id.slice(0, 4).toUpperCase()}`,
            name: stored?.name || employee.user?.fullName || 'Employee',
            role: (roleLabel as any) || 'Auditor',
            country: stored?.country || 'Saudi Arabia',
            schemes: employee.schemes?.length ? employee.schemes : stored?.schemes || [],
            authorizedScope:
              (employee.iafCodes?.length
                ? `IAF: ${employee.iafCodes.join(', ')}`
                : stored?.authorizedScope) || 'Quality management systems',
            expiryDate: stored?.expiryDate || '2026-12-31',
            status: employee.status === 'ACTIVE' ? 'Authorized' : 'Under review',
            avatarUrl: employee.imageUrl || stored?.avatarUrl || undefined,
            employmentStartDate:
              employee.employmentStartDate || stored?.employmentStartDate || undefined,
            iafCodes: employee.iafCodes || stored?.iafCodes || [],
            email: employee.user?.email || stored?.email || '',
            phone: employee.user?.phone || stored?.phone || '',
            statusDot: employee.status === 'INACTIVE' ? 'Inactive' : 'Active',
            ...stored,
          })
        }
      })
      .catch(() => {
        // Fallback to local storage if API call fails
        setPerson(getPersonById(id))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [id])

  const title = t(id ? 'cab.competence.memberProfile.editProfile' : 'cab.competence.addNewPerson')
  const backToRegister = () => navigate(ROUTES.cabCompetence)

  return (
    <CabLayout
      sidebarVariant="competence"
      tourId="personnel-profile-tour"
      tourSteps={tourSteps}
    >
      <CabHeader title={t('cab.competence.title')} />
      <main className="flex-1 bg-[#f9fafc] p-3 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-5">
          <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-2 text-[13px]">
            <Link to={ROUTES.cabCompetence} className="font-light text-neutral-500 hover:text-primary">
              {t('cab.competence.title')}
            </Link>
            <span aria-hidden className="text-neutral-400">/</span>
            <span aria-current="page" className="font-medium text-neutral-700">
              {title}
            </span>
          </nav>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CabTourStep steps={tourSteps} stepId="profile-header">
              <div className="space-y-1">
                <h1 className="text-h3-semi text-neutral-900">{title}</h1>
                <p className="text-body-2 text-neutral-500">
                  {person ? `${person.name} · ${person.code}` : t('cab.competence.memberProfile.pageDescription')}
                </p>
              </div>
            </CabTourStep>
            <Button variant="outline" onClick={backToRegister}>
              {t('cab.competence.memberProfile.backToRegister')}
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : id && !person ? (
            <p role="alert" className="rounded-[var(--radius-md)] border border-neutral-200 bg-white p-8 text-neutral-500">
              {t('cab.competence.memberProfile.notFound')}
            </p>
          ) : (
            <PersonnelProfileForm
              key={id ?? 'new'}
              person={person}
              onCancel={backToRegister}
              onSaved={backToRegister}
              tourSteps={tourSteps}
            />
          )}
        </div>
      </main>
    </CabLayout>
  )
}
