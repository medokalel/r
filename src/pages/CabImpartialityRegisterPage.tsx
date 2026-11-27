import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CabLayout } from '@/components/layout/CabLayout'
import { CabHeader } from '@/components/dashboard/cab/CabHeader'
import { TeamRulesPanel } from '@/components/cab/impartiality/TeamRulesPanel'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { DatePicker } from '@/components/ui/DatePicker'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { SelectField } from '@/components/ui/Select'
import { fieldLabelClassName } from '@/components/ui/fieldStyles'
import {
  AddCircleIcon,
  AppIcon,
  ErrorCircleIcon,
  SearchIcon,
} from '@/components/icons'
import {
  CAB_RELATIONSHIP_TYPES,
  createCabEmployeeImpartialityRelationship,
  getCabImpartialityRegister,
  getProfessionalRoleLabel,
  getRelationshipTypeLabel,
  type CabImpartialityRegisterEntry,
  type CabRelationshipType,
} from '@/lib/api/cabEmployeesApi'
import {
  getTeamSelectionSettings,
  listTeamExceptions,
  type TeamSelectionException,
} from '@/lib/api/teamSelectionApi'
import { listCabClients, type CabAuditClientListItem } from '@/lib/api/clientRegistrationApi'
import { ApiError } from '@/lib/api/client'
import {
  buildImpartialityRegisterView,
  type ImpartialityDeclarationState,
  type ImpartialityRelationshipClass,
} from '@/lib/impartialityRegisterView'
import { ROUTES } from '@/lib/routes'
import { cn } from '@/lib/utils'

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-400 rtl-flip" aria-hidden>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function toIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function fromIsoDate(value?: string | null): Date | undefined {
  if (!value) return undefined
  const parsed = new Date(`${value.split('T')[0]}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

type TabId = 'people' | 'relationships' | 'exceptions' | 'rules'

const DECLARATION_STYLES: Record<ImpartialityDeclarationState, string> = {
  valid: 'bg-[#e8f7ee] text-[#1d7a46]',
  missing: 'bg-[#fdeeee] text-[#c0392b]',
  expired: 'bg-[#fff4e5] text-[#b26a00]',
}

const CLASSIFICATION_STYLES: Record<ImpartialityRelationshipClass, string> = {
  blocking: 'bg-[#fdeeee] text-[#c0392b]',
  coolingOff: 'bg-[#fff4e5] text-[#b26a00]',
  clear: 'bg-neutral-100 text-neutral-500',
}

const EXCEPTION_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-[#fff4e5] text-[#b26a00]',
  APPROVED: 'bg-[#e8f7ee] text-[#1d7a46]',
  REJECTED: 'bg-[#fdeeee] text-[#c0392b]',
}

export function CabImpartialityRegisterPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith('ar')

  const [entries, setEntries] = useState<CabImpartialityRegisterEntry[]>([])
  const [exceptions, setExceptions] = useState<TeamSelectionException[]>([])
  const [coolingOffMonths, setCoolingOffMonths] = useState(24)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [activeTab, setActiveTab] = useState<TabId>('people')
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [clients, setClients] = useState<CabAuditClientListItem[]>([])
  const [relPersonId, setRelPersonId] = useState('')
  const [relClientId, setRelClientId] = useState('')
  const [relType, setRelType] = useState<CabRelationshipType>('CONSULTANCY')
  const [relStartDate, setRelStartDate] = useState('')
  const [relEndDate, setRelEndDate] = useState('')
  const [relIsOngoing, setRelIsOngoing] = useState(true)
  const [relDescription, setRelDescription] = useState('')
  const [relErrors, setRelErrors] = useState<string[]>([])
  const [savingRelationship, setSavingRelationship] = useState(false)
  const errorListRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (relErrors.length > 0) {
      errorListRef.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [relErrors])

  const today = useMemo(() => toIsoDate(new Date()), [])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const register = await getCabImpartialityRegister()
      setEntries(register?.register ?? [])
    } catch {
      setEntries([])
      setLoadError(
        t(
          'cab.impartialityRegister.loadFailed',
          'Could not load the impartiality register.',
        ),
      )
    }
    listTeamExceptions({})
      .then((items) => setExceptions(items ?? []))
      .catch(() => setExceptions([]))
    getTeamSelectionSettings()
      .then((settings) => {
        if (typeof settings?.coolingOffMonths === 'number') {
          setCoolingOffMonths(settings.coolingOffMonths)
        }
      })
      .catch(() => {})
    setLoading(false)
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  const view = useMemo(
    () =>
      buildImpartialityRegisterView({
        entries,
        exceptions,
        coolingOffMonths,
        today,
      }),
    [entries, exceptions, coolingOffMonths, today],
  )

  const filteredPeople = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return view.peopleRows
    return view.peopleRows.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.code.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q),
    )
  }, [view.peopleRows, search])

  const exceptionById = useMemo(
    () => new Map(exceptions.map((ex) => [ex.id, ex])),
    [exceptions],
  )

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

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return '—'
    const parsed = new Date(iso)
    if (Number.isNaN(parsed.getTime())) return formatDate(iso)
    return new Intl.DateTimeFormat(i18n.language, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsed)
  }

  const declarationLabel = (state: ImpartialityDeclarationState) =>
    t(`cab.impartialityRegister.declarationState.${state}`, {
      valid: t('cab.impartialityRegister.declarationState.valid', 'Valid'),
      missing: t('cab.impartialityRegister.declarationState.missing', 'Missing'),
      expired: t('cab.impartialityRegister.declarationState.expired', 'Expired'),
    }[state])

  const openRecordDialog = () => {
    setRelPersonId('')
    setRelClientId('')
    setRelType('CONSULTANCY')
    setRelStartDate('')
    setRelEndDate('')
    setRelIsOngoing(true)
    setRelDescription('')
    setRelErrors([])
    setDialogOpen(true)
    listCabClients({ page: 1, limit: 100 })
      .then((res) => setClients(res?.items ?? []))
      .catch(() => setClients([]))
  }

  const handleSaveRelationship = async () => {
    const errors: string[] = []
    if (!relPersonId) {
      errors.push(t('cab.impartialityRegister.dialog.personRequired', 'Select the person.'))
    }
    if (!relClientId) {
      errors.push(
        t('cab.impartialityRegister.dialog.clientRequired', 'Select the client organisation.'),
      )
    }
    if (!relStartDate) {
      errors.push(t('cab.impartialityRegister.dialog.startDateRequired', 'Set the start date.'))
    }
    if (!relIsOngoing && relStartDate && relEndDate && relEndDate < relStartDate) {
      errors.push(
        t(
          'cab.impartialityRegister.dialog.endDateBeforeStart',
          'The end date cannot be before the start date.',
        ),
      )
    }
    setRelErrors(errors)
    if (errors.length > 0) return

    setSavingRelationship(true)
    try {
      await createCabEmployeeImpartialityRelationship(relPersonId, {
        clientId: relClientId,
        relationshipType: relType,
        description: relDescription.trim() || null,
        startDate: relStartDate,
        endDate: relIsOngoing || !relEndDate ? null : relEndDate,
      })
      setDialogOpen(false)
      await load()
    } catch (err) {
      if (err instanceof ApiError) {
        setRelErrors([err.message, ...(err.errors ?? [])])
      } else {
        setRelErrors([
          t('cab.impartialityRegister.dialog.failed', 'Could not record the relationship.'),
        ])
      }
    } finally {
      setSavingRelationship(false)
    }
  }

  const kpiCards: { key: string; label: string; value: number; accent: string }[] = [
    {
      key: 'valid',
      label: t('cab.impartialityRegister.kpis.valid', 'Valid annual declarations'),
      value: view.kpis.validDeclarations,
      accent: 'text-[#1d7a46]',
    },
    {
      key: 'missingOrExpired',
      label: t('cab.impartialityRegister.kpis.missingOrExpired', 'Missing or expired'),
      value: view.kpis.missingOrExpired,
      accent: 'text-[#c0392b]',
    },
    {
      key: 'toReview',
      label: t('cab.impartialityRegister.kpis.toReview', 'Relationships to review'),
      value: view.kpis.relationshipsToReview,
      accent: 'text-[#b26a00]',
    },
    {
      key: 'blocking',
      label: t('cab.impartialityRegister.kpis.blocking', 'Blocking relationships'),
      value: view.kpis.blockingRelationships,
      accent: 'text-[#1236a3]',
    },
  ]

  const tabs: { id: TabId; label: string }[] = [
    { id: 'people', label: t('cab.impartialityRegister.tabs.people', 'People') },
    {
      id: 'relationships',
      label: t('cab.impartialityRegister.tabs.relationships', 'Relationships'),
    },
    { id: 'exceptions', label: t('cab.impartialityRegister.tabs.exceptions', 'Exceptions') },
    { id: 'rules', label: t('cab.impartialityRegister.tabs.rules', 'Rules') },
  ]

  return (
    <CabLayout sidebarVariant="competence">
      <CabHeader
        title={t('cab.impartialityRegister.title', 'Impartiality register')}
        notificationCount={3}
      />

      <main className="flex flex-1 flex-col gap-5 overflow-auto p-4 sm:p-6">
        {/* Breadcrumb */}
        <nav className="flex min-w-0 flex-wrap items-center gap-2 text-[13px]" aria-label="breadcrumb">
          <Link to={ROUTES.cabCompetence} className="font-light text-neutral-400 hover:text-primary">
            {t('cab.competence.title', 'Competence Register')}
          </Link>
          <Chevron />
          <span className="font-medium text-neutral-700">
            {t('cab.impartialityRegister.title', 'Impartiality register')}
          </span>
        </nav>

        {/* Header row */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-[24px] font-bold leading-tight text-neutral-900 sm:text-[28px]">
              {t('cab.impartialityRegister.title', 'Impartiality register')}
            </h1>
            <p className="mt-1 text-[14px] text-neutral-500">
              {t('cab.impartialityRegister.subtitle', {
                months: coolingOffMonths,
                defaultValue:
                  'Annual declarations and declared client relationships across all personnel. Cooling-off period: {{months}} months.',
              })}
            </p>
          </div>
          <Link to={ROUTES.cabTeamAvailability} className="text-[13px] font-semibold text-primary hover:underline">
            {t('cab.impartialityRegister.availabilityLink', 'Team availability calendar')}
          </Link>
          <Button
            variant="primary"
            icon={<AppIcon icon={AddCircleIcon} size={20} />}
            onClick={openRecordDialog}
            className="w-full whitespace-nowrap sm:w-auto"
          >
            {t('cab.impartialityRegister.recordRelationship', 'Record relationship')}
          </Button>
        </div>

        {/* KPI cards */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpiCards.map((card) => (
            <div
              key={card.key}
              className="rounded-[16px] border border-[#ececec] bg-white p-4 sm:p-5"
            >
              <p className="text-[12px] font-medium text-neutral-500 sm:text-[13px]">
                {card.label}
              </p>
              <p className={cn('mt-2 text-[26px] font-bold leading-none sm:text-[32px]', card.accent)}>
                {card.value}
              </p>
            </div>
          ))}
        </section>

        {loadError && (
          <p className="rounded-[8px] border border-[#f5c6c6] bg-[#fdeeee] px-4 py-3 text-[13px] text-[#c0392b]">
            {loadError}
          </p>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-[#ececec]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'cursor-pointer whitespace-nowrap border-b-2 px-5 py-3 text-[14px] font-semibold transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'rules' ? (
          <TeamRulesPanel onSaved={(settings) => setCoolingOffMonths(settings.coolingOffMonths)} />
        ) : loading ? (
          <div className="flex items-center justify-center rounded-[16px] border border-[#ececec] bg-white py-16">
            <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : activeTab === 'people' ? (
          <>
            {/* Search */}
            <section className="rounded-[16px] border border-[#ececec] bg-white p-5">
              <div className="max-w-md">
                <label htmlFor="impartiality-people-search" className="mb-2 block text-[13px] font-semibold text-neutral-700">
                  {t('cab.impartialityRegister.searchLabel', 'Search people')}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400">
                    <AppIcon icon={SearchIcon} size={18} />
                  </span>
                  <input
                    id="impartiality-people-search"
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t(
                      'cab.impartialityRegister.searchPlaceholder',
                      'Search by name or code...',
                    )}
                    className="h-11 w-full rounded-[8px] border border-[#e2e2e2] bg-white ps-10 pe-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </section>

            {/* People table */}
            <section className="flex flex-col rounded-[16px] border border-[#ececec] bg-white py-5">
              <p className="mb-4 px-5 text-[13px] text-neutral-500">
                {t('cab.impartialityRegister.peopleCount', {
                  count: filteredPeople.length,
                  defaultValue: '{{count}} people',
                })}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-center">
                  <thead>
                    <tr className="bg-[#1236a3] text-white">
                      <th className="px-4 py-4 text-start text-[14px] font-medium whitespace-nowrap">
                        {t('cab.impartialityRegister.columns.person', 'Person')}
                      </th>
                      <th className="px-4 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                        {t('cab.impartialityRegister.columns.annualDeclaration', 'Annual declaration')}
                      </th>
                      <th className="px-4 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                        {t('cab.impartialityRegister.columns.validUntil', 'Valid until')}
                      </th>
                      <th className="px-4 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                        {t('cab.impartialityRegister.columns.relationships', 'Relationships')}
                      </th>
                      <th className="px-4 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                        {t('cab.impartialityRegister.columns.toReview', 'To review')}
                      </th>
                      <th className="px-4 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                        {t('cab.impartialityRegister.columns.blocking', 'Blocking')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPeople.length > 0 ? (
                      filteredPeople.map((row, idx) => (
                        <tr key={row.employeeId} className={cn(idx % 2 === 1 ? 'bg-[#f9fafc]' : 'bg-white')}>
                          <td className="px-5 py-4 text-start">
                            <div className="flex items-center gap-3.5">
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white shadow-sm">
                                {getInitials(row.name)}
                              </div>
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      ROUTES.cabPersonnelEdit.replace(':id', row.employeeId),
                                    )
                                  }
                                  className="cursor-pointer text-start text-[15px] font-semibold text-neutral-900 hover:text-primary hover:underline"
                                >
                                  {row.name}
                                </button>
                                <div className="text-[12px] text-neutral-500" dir="ltr">
                                  {row.code}
                                  {row.email ? ` | ${row.email}` : ''}
                                </div>
                                {row.role && (
                                  <div className="text-[12px] text-neutral-400">
                                    {getProfessionalRoleLabel(row.role)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={cn(
                                'inline-block rounded-full px-3 py-1 text-[12px] font-semibold',
                                DECLARATION_STYLES[row.declarationState],
                              )}
                            >
                              {declarationLabel(row.declarationState)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-[14px] text-neutral-700 whitespace-nowrap">
                            {formatDate(row.validUntil)}
                          </td>
                          <td className="px-4 py-4 text-[14px] text-neutral-700">
                            {row.relationshipsCount}
                          </td>
                          <td className="px-4 py-4 text-[14px] text-neutral-700">
                            {row.toReviewCount}
                          </td>
                          <td className="px-4 py-4 text-[14px] text-neutral-700">
                            {row.blockingCount}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-[14px] text-neutral-400">
                          {t('cab.impartialityRegister.emptyPeople', 'No matching people.')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : activeTab === 'relationships' ? (
          <section className="flex flex-col rounded-[16px] border border-[#ececec] bg-white py-5">
            <p className="mb-4 px-5 text-[13px] text-neutral-500">
              {t('cab.impartialityRegister.relationshipsCount', {
                count: view.relationshipRows.length,
                defaultValue: '{{count}} declared relationships',
              })}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-center">
                <thead>
                  <tr className="bg-[#1236a3] text-white">
                    <th className="px-4 py-4 text-start text-[14px] font-medium whitespace-nowrap">
                      {t('cab.impartialityRegister.columns.person', 'Person')}
                    </th>
                    <th className="px-4 py-4 text-start text-[14px] font-medium whitespace-nowrap">
                      {t('cab.impartialityRegister.columns.client', 'Client')}
                    </th>
                    <th className="px-4 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                      {t('cab.impartialityRegister.columns.type', 'Type')}
                    </th>
                    <th className="px-4 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                      {t('cab.impartialityRegister.columns.period', 'Period')}
                    </th>
                    <th className="px-4 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                      {t('cab.impartialityRegister.columns.classification', 'Classification')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {view.relationshipRows.length > 0 ? (
                    view.relationshipRows.map((row, idx) => (
                      <tr key={row.id} className={cn(idx % 2 === 1 ? 'bg-[#f9fafc]' : 'bg-white')}>
                        <td className="px-5 py-4 text-start text-[14px] font-semibold text-neutral-900">
                          {row.personName}
                        </td>
                        <td className="px-5 py-4 text-start text-[14px] text-neutral-700">
                          {row.clientName || '—'}
                        </td>
                        <td className="px-4 py-4 text-[14px] text-neutral-700">
                          {t(
                            `cab.competence.impartiality.relationshipTypes.${row.relationshipType}`,
                            getRelationshipTypeLabel(row.relationshipType),
                          )}
                        </td>
                        <td className="px-4 py-4 text-[14px] text-neutral-700 whitespace-nowrap">
                          {formatDate(row.startDate)}
                          {' – '}
                          {row.ongoing
                            ? t('cab.impartialityRegister.relStatus.ongoing', 'Ongoing')
                            : formatDate(row.endDate)}
                        </td>
                        <td className="px-4 py-4">
                          {row.classification === 'clear' ? (
                            <span className="text-[13px] text-neutral-400">—</span>
                          ) : (
                            <span
                              className={cn(
                                'inline-block rounded-full px-3 py-1 text-[12px] font-semibold',
                                CLASSIFICATION_STYLES[row.classification],
                              )}
                            >
                              {row.classification === 'blocking'
                                ? t('cab.impartialityRegister.classification.blocking', 'Blocking')
                                : t('cab.impartialityRegister.classification.toReview', 'To review')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-[14px] text-neutral-400">
                        {t(
                          'cab.impartialityRegister.emptyRelationships',
                          'No declared relationships.',
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="flex flex-col rounded-[16px] border border-[#ececec] bg-white py-5">
            <p className="mb-4 px-5 text-[13px] text-neutral-500">
              {t('cab.impartialityRegister.exceptionsCount', {
                count: view.exceptionRows.length,
                defaultValue: '{{count}} exceptions',
              })}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] border-collapse text-center">
                <thead>
                  <tr className="bg-[#1236a3] text-white">
                    <th className="px-4 py-4 text-start text-[14px] font-medium whitespace-nowrap">
                      {t('cab.impartialityRegister.columns.person', 'Person')}
                    </th>
                    <th className="px-4 py-4 text-start text-[14px] font-medium whitespace-nowrap">
                      {t('cab.impartialityRegister.columns.issue', 'Issue')}
                    </th>
                    <th className="px-4 py-4 text-start text-[14px] font-medium whitespace-nowrap">
                      {t('cab.impartialityRegister.columns.justification', 'Justification')}
                    </th>
                    <th className="px-4 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                      {t('cab.impartialityRegister.columns.status', 'Status')}
                    </th>
                    <th className="px-4 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                      {t('cab.impartialityRegister.columns.requested', 'Requested')}
                    </th>
                    <th className="px-4 py-4 text-center text-[14px] font-medium whitespace-nowrap">
                      {t('cab.impartialityRegister.columns.decision', 'Decision')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {view.exceptionRows.length > 0 ? (
                    view.exceptionRows.map((row, idx) => {
                      const source = exceptionById.get(row.id)
                      const issueText = source?.issueText
                        ? (isArabic ? source.issueText.ar : source.issueText.en) ||
                          source.issueText.en ||
                          source.issueText.ar ||
                          source.issueCode
                        : source?.issueCode ?? ''
                      return (
                        <tr key={row.id} className={cn(idx % 2 === 1 ? 'bg-[#f9fafc]' : 'bg-white')}>
                          <td className="px-5 py-4 text-start text-[14px] font-semibold text-neutral-900">
                            {row.personName || '—'}
                          </td>
                          <td className="px-5 py-4 text-start text-[13px] text-neutral-700">
                            {issueText}
                          </td>
                          <td className="max-w-[260px] px-5 py-4 text-start text-[13px] text-neutral-600">
                            {source?.justification || '—'}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={cn(
                                'inline-block rounded-full px-3 py-1 text-[12px] font-semibold',
                                EXCEPTION_STATUS_STYLES[row.status] ??
                                  'bg-neutral-100 text-neutral-500',
                              )}
                            >
                              {t(
                                `cab.impartialityRegister.exceptionStatus.${row.status}`,
                                row.status,
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-[13px] text-neutral-700 whitespace-nowrap">
                            {row.requestedBy || '—'}
                            <span className="block text-[12px] text-neutral-400">
                              {formatDateTime(row.requestedAt)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-[13px] text-neutral-700 whitespace-nowrap">
                            {row.decidedBy || '—'}
                            <span className="block text-[12px] text-neutral-400">
                              {formatDateTime(row.decidedAt)}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-[14px] text-neutral-400">
                        {t('cab.impartialityRegister.emptyExceptions', 'No exceptions recorded.')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* Record relationship dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[16px] bg-white">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#ececec] px-6 pt-5 pb-4">
              <div>
                <h2 className="text-[18px] font-bold text-neutral-900">
                  {t('cab.impartialityRegister.dialog.title', 'Record relationship')}
                </h2>
                <p className="mt-1 text-[13px] text-neutral-500">
                  {t(
                    'cab.impartialityRegister.dialog.subtitle',
                    'Declare a consultancy, employment, internal audit, or financial relationship with a client organisation.',
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="cursor-pointer text-neutral-400 hover:text-neutral-700"
                aria-label={t('common.cancel', 'Cancel')}
              >
                <AppIcon icon={ErrorCircleIcon} size={24} />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
              <SearchableSelect
                id="impartiality-record-person"
                label={`${t('cab.impartialityRegister.dialog.person', 'Person')} *`}
                value={relPersonId}
                options={view.peopleRows.map((row) => ({
                  value: row.employeeId,
                  label: row.code ? `${row.name} (${row.code})` : row.name,
                }))}
                onChange={setRelPersonId}
                placeholder={t(
                  'cab.impartialityRegister.dialog.selectPerson',
                  'Select person...',
                )}
              />

              <SearchableSelect
                id="impartiality-record-client"
                label={`${t('cab.impartialityRegister.dialog.clientOrganisation', 'Client organisation')} *`}
                value={relClientId}
                options={clients.map((client) => ({
                  value: client.id,
                  label: client.tradeName ? `${client.name} (${client.tradeName})` : client.name,
                }))}
                onChange={setRelClientId}
                placeholder={t(
                  'cab.impartialityRegister.dialog.selectClient',
                  'Select client organisation...',
                )}
              />

              <div>
                <span className={`mb-1 block ${fieldLabelClassName}`}>
                  {t('cab.impartialityRegister.dialog.relationshipType', 'Relationship type')} *
                </span>
                <SelectField
                  value={relType}
                  onChange={(val) => setRelType(val as CabRelationshipType)}
                  options={CAB_RELATIONSHIP_TYPES.map((rt) => ({
                    value: rt.value,
                    label: t(
                      `cab.competence.impartiality.relationshipTypes.${rt.value}`,
                      rt.label,
                    ),
                  }))}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <span className={`mb-1 block ${fieldLabelClassName}`}>
                    {t('cab.impartialityRegister.dialog.startDate', 'Start date')} *
                  </span>
                  <DatePicker
                    value={fromIsoDate(relStartDate)}
                    onChange={(date) => setRelStartDate(toIsoDate(date))}
                  />
                </div>
                <div>
                  <span className={`mb-1 block ${fieldLabelClassName}`}>
                    {t('cab.impartialityRegister.dialog.endDate', 'End date (optional)')}
                  </span>
                  <DatePicker
                    disabled={relIsOngoing}
                    value={relIsOngoing ? undefined : fromIsoDate(relEndDate)}
                    onChange={(date) => {
                      setRelIsOngoing(false)
                      setRelEndDate(toIsoDate(date))
                    }}
                  />
                </div>
              </div>

              <label className="inline-flex cursor-pointer items-center gap-3 rounded-[8px] border border-[#ececec] bg-white px-4 py-2.5 select-none">
                <Checkbox
                  checked={relIsOngoing}
                  onChange={() => {
                    setRelIsOngoing((prev) => {
                      const next = !prev
                      if (next) setRelEndDate('')
                      return next
                    })
                  }}
                />
                <span className="text-[14px] text-neutral-800">
                  {t('cab.impartialityRegister.dialog.ongoing', 'Ongoing (no end date)')}
                </span>
              </label>

              <div>
                <span className={`mb-1 block ${fieldLabelClassName}`}>
                  {t('cab.impartialityRegister.dialog.description', 'Description (optional)')}
                </span>
                <textarea
                  value={relDescription}
                  onChange={(e) => setRelDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-[8px] border border-[#e2e2e2] bg-white px-3 py-2 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                />
              </div>

              {relErrors.length > 0 && (
                <ul
                  ref={errorListRef}
                  className="rounded-[8px] border border-[#f5c6c6] bg-[#fdeeee] px-4 py-3 text-[13px] text-[#c0392b]"
                >
                  {relErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              )}

            </div>

            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-[#ececec] px-6 py-4 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setDialogOpen(false)} disabled={savingRelationship}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button variant="primary" onClick={handleSaveRelationship} disabled={savingRelationship}>
                {savingRelationship
                  ? t('cab.impartialityRegister.dialog.saving', 'Saving...')
                  : t('common.save', 'Save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </CabLayout>
  )
}
