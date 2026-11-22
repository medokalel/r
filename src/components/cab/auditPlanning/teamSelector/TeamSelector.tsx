import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { fetchTeamRecommendations, type RecommendedCandidate, type TeamValidationResult } from '@/lib/api/teamSelectionApi'
import { ROLE_LABELS, type TeamRole } from '@/lib/teamSelection/catalog'
import type { PlanAssignment } from '@/lib/teamSelection/personnel'
import type { Alternative, MemberStatus, TeamIssue } from '@/lib/teamSelection/types'
import { cn } from '@/lib/utils'
import { TeamCandidateCard } from './TeamCandidateCard'
import { TeamCoverageTable } from './TeamCoverageTable'
import { TeamExceptionDialog } from './TeamExceptionDialog'
import { TeamSlots } from './TeamSlots'
import { TeamValidationPanel } from './TeamValidationPanel'
import { addOrReplaceMember, memberKey, TEAM_ROLES, useTeamLanguage } from './teamSelectorUtils'

interface TeamSelectorProps {
  planId: string
  startDate: string
  endDate: string
  team: PlanAssignment[]
  onChange: (team: PlanAssignment[]) => void
  validation: TeamValidationResult | null
  isValidating: boolean
  readOnly: boolean
  /** Changes when exceptions change, so the rankings are loaded again. */
  refreshKey: number
  onRequestException: (issue: TeamIssue, justification: string) => Promise<boolean>
}

interface RecommendationResult {
  key: string
  candidates: RecommendedCandidate[] | null
}

interface SlotResult {
  key: string
  byRole: Partial<Record<TeamRole, RecommendedCandidate[]>>
}

/**
 * Chooses the audit team: the team as an org chart, a ranked list of people with the
 * reasons for each score, what still blocks the team, and standard and IAF code coverage.
 */
export function TeamSelector({
  planId,
  startDate,
  endDate,
  team,
  onChange,
  validation,
  isValidating,
  readOnly,
  refreshKey,
  onRequestException,
}: TeamSelectorProps) {
  const { t } = useTranslation()
  const { language } = useTeamLanguage()
  const [activeRole, setActiveRole] = useState<TeamRole>('TEAM_LEADER')
  const [search, setSearch] = useState('')
  const [showIneligible, setShowIneligible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [observerName, setObserverName] = useState('')
  const [reloadTick, setReloadTick] = useState(0)
  const [exceptionIssue, setExceptionIssue] = useState<TeamIssue | null>(null)
  const [activeResult, setActiveResult] = useState<RecommendationResult | null>(null)
  const [slotResult, setSlotResult] = useState<SlotResult | null>(null)

  const baseKey = `${planId}|${startDate}|${endDate}|${refreshKey}|${reloadTick}`
  const activeKey = `${baseKey}|${activeRole}`

  useEffect(() => {
    let cancelled = false
    fetchTeamRecommendations(planId, activeRole, { startDate, endDate })
      .then((result) => {
        if (!cancelled) setActiveResult({ key: activeKey, candidates: result.candidates })
      })
      .catch(() => {
        if (!cancelled) setActiveResult({ key: activeKey, candidates: null })
      })
    return () => {
      cancelled = true
    }
  }, [activeKey, planId, activeRole, startDate, endDate])

  useEffect(() => {
    if (readOnly) return
    let cancelled = false
    Promise.all(
      TEAM_ROLES.map((role) =>
        fetchTeamRecommendations(planId, role, { startDate, endDate }).then(
          (result) => [role, result.candidates] as const,
          () => [role, []] as const,
        ),
      ),
    ).then((entries) => {
      if (!cancelled) setSlotResult({ key: baseKey, byRole: Object.fromEntries(entries) })
    })
    return () => {
      cancelled = true
    }
  }, [baseKey, planId, startDate, endDate, readOnly])

  const candidates = activeResult?.key === activeKey ? activeResult.candidates : undefined
  const loading = activeResult?.key !== activeKey
  const slotCandidates = slotResult?.key === baseKey ? slotResult.byRole : {}

  const query = search.trim().toLowerCase()
  const visible = (candidates ?? []).filter(
    (candidate) =>
      (showIneligible || candidate.eligible || team.some((member) => member.personId === candidate.personId)) &&
      (!query || candidate.name.toLowerCase().includes(query)),
  )
  const ineligibleCount = (candidates ?? []).filter((candidate) => !candidate.eligible).length

  const statusOf = (member: PlanAssignment): MemberStatus | undefined =>
    validation?.members.find(
      (result) =>
        (member.personId ? result.personId === member.personId : result.name === member.name) && result.role === member.role,
    )?.status

  const add = (member: PlanAssignment) => onChange(addOrReplaceMember(team, member))

  const useAlternative = (issue: TeamIssue, alternative: Alternative) => {
    const base = issue.personId ? team.filter((member) => member.personId !== issue.personId) : team
    onChange(addOrReplaceMember(base, { personId: alternative.personId, name: alternative.name, role: alternative.role }))
  }

  const submitObserver = (event: FormEvent) => {
    event.preventDefault()
    const name = observerName.trim()
    if (!name) return
    add({ personId: null, name, role: 'OBSERVER' })
    setObserverName('')
  }

  const observerForm = (
    <form className="flex flex-wrap items-center gap-2" onSubmit={submitObserver}>
      <input
        value={observerName}
        onChange={(event) => setObserverName(event.target.value)}
        maxLength={200}
        placeholder={t('cab.auditPlanning.team.observer.placeholder', 'Name of the observer or accreditation witness')}
        aria-label={t('cab.auditPlanning.team.observer.label', 'External observer or witness')}
        className="h-10 min-w-0 flex-1 rounded-[8px] border border-neutral-200 bg-white px-3 text-[14px] focus:border-[#1236a3] focus:outline-none"
      />
      <Button type="submit" variant="secondary" className="h-10 px-3 text-[12px]" disabled={!observerName.trim()}>
        {t('cab.auditPlanning.team.observer.add', 'Add observer')}
      </Button>
    </form>
  )

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {validation ? (
        <TeamValidationPanel
          validation={validation}
          readOnly={readOnly}
          onUseAlternative={useAlternative}
          onRequestException={setExceptionIssue}
        />
      ) : (
        isValidating && (
          <p className="text-[12px] text-neutral-600">{t('cab.auditPlanning.team.validation.checking', 'Checking the team...')}</p>
        )
      )}

      <TeamSlots
        roles={TEAM_ROLES}
        value={team}
        readOnly={readOnly}
        activeRole={activeRole}
        onActivate={setActiveRole}
        statusOf={statusOf}
        slotCandidates={slotCandidates}
        onAdd={add}
        onRemove={(member) => onChange(team.filter((existing) => memberKey(existing) !== memberKey(member)))}
        observerForm={observerForm}
      />

      {!readOnly && (
        <button
          type="button"
          className="self-start text-[12px] font-semibold text-[#1236a3] underline-offset-4 hover:underline"
          aria-expanded={showDetails}
          onClick={() => setShowDetails((open) => !open)}
        >
          {showDetails
            ? t('cab.auditPlanning.team.flow.hideDetails', 'Hide recommendations')
            : t('cab.auditPlanning.team.flow.showDetails', 'Show recommendations and reasons')}
        </button>
      )}

      {!readOnly && showDetails && (
        <section className="flex min-w-0 flex-col gap-3" aria-label={t('cab.auditPlanning.team.recommended.title', 'Recommended people')}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              className="inline-flex max-w-full items-center gap-1 self-start overflow-x-auto rounded-[8px] border border-neutral-200 bg-white p-1"
              role="tablist"
              aria-label={t('cab.auditPlanning.team.recommended.forRole', 'Recommendations for the role')}
            >
              {TEAM_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  role="tab"
                  aria-selected={activeRole === role}
                  onClick={() => setActiveRole(role)}
                  className={cn(
                    'whitespace-nowrap rounded-[6px] px-3 py-1.5 text-[12px] font-semibold transition-colors',
                    activeRole === role ? 'bg-[#1236a3] text-white' : 'text-neutral-700 hover:bg-neutral-50',
                  )}
                >
                  {ROLE_LABELS[role][language]}
                </button>
              ))}
            </div>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('cab.auditPlanning.team.recommended.search', 'Search by name')}
              aria-label={t('cab.auditPlanning.team.recommended.search', 'Search by name')}
              className="h-10 min-w-0 rounded-[8px] border border-neutral-200 bg-white px-3 text-[14px] focus:border-[#1236a3] focus:outline-none sm:w-64"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-[12px] text-neutral-700">
              <Checkbox checked={showIneligible} onChange={() => setShowIneligible((current) => !current)} />
              {t('cab.auditPlanning.team.recommended.showIneligible', 'Show people who are not eligible ({{count}})', {
                count: ineligibleCount,
              })}
            </label>
            <button
              type="button"
              onClick={() => setReloadTick((tick) => tick + 1)}
              className="text-[12px] font-semibold text-[#1236a3] underline-offset-4 hover:underline"
            >
              ↻ {t('cab.auditPlanning.team.recommended.refresh', 'Refresh')}
            </button>
          </div>

          {loading ? (
            <p className="text-[12px] text-neutral-600">{t('cab.auditPlanning.team.recommended.loading', 'Ranking the competence register...')}</p>
          ) : visible.length === 0 ? (
            <p className="rounded-[8px] border border-dashed border-neutral-200 px-3 py-4 text-center text-[12px] text-neutral-600">
              {t('cab.auditPlanning.team.recommended.empty', 'No one matches. Show the people who are not eligible to see why.')}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {visible.map((candidate) => (
                <TeamCandidateCard
                  key={candidate.personId}
                  candidate={candidate}
                  role={activeRole}
                  selected={team.some((member) => member.personId === candidate.personId && member.role === activeRole)}
                  disabled={false}
                  onAdd={() => add({ personId: candidate.personId, name: candidate.name, role: activeRole })}
                />
              ))}
            </ul>
          )}
        </section>
      )}

      {validation && (
        <section className="flex flex-col gap-2" aria-label={t('cab.auditPlanning.team.coverage.title', 'Team coverage')}>
          <h3 className="text-[14px] font-semibold text-neutral-900">{t('cab.auditPlanning.team.coverage.title', 'Team coverage')}</h3>
          <TeamCoverageTable coverage={validation.coverage} />
        </section>
      )}

      <TeamExceptionDialog
        issue={exceptionIssue}
        onSubmit={onRequestException}
        onClose={() => setExceptionIssue(null)}
      />
    </div>
  )
}
