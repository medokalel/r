import { useState, type DragEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import type { RecommendedCandidate } from '@/lib/api/teamSelectionApi'
import { ROLE_LABELS, type TeamRole } from '@/lib/teamSelection/catalog'
import type { PlanAssignment } from '@/lib/teamSelection/personnel'
import type { MemberStatus } from '@/lib/teamSelection/types'
import { cn } from '@/lib/utils'
import { PersonAvatar } from './teamSelectorParts'
import { competenceRoleLabel, memberKey, ROLE_KEY, useTeamLanguage } from './teamSelectorUtils'

const STATUS_DOT: Record<MemberStatus, string> = { ok: 'bg-[#22c55e]', warn: 'bg-[#f59e0b]', block: 'bg-[#ef4444]' }
const STATUS_DEFAULT: Record<MemberStatus, string> = { ok: 'Passes the checks', warn: 'Passes with warnings', block: 'Blocked' }
const SLOT_DEFAULTS: Record<TeamRole, { title: string; hint: string }> = {
  TEAM_LEADER: { title: 'Team leader', hint: 'One, all standards' },
  AUDITOR: { title: 'Auditors', hint: 'Approved auditors' },
  TECHNICAL_EXPERT: { title: 'Technical experts', hint: 'Sector knowledge only' },
  TRAINEE: { title: 'Trainees', hint: 'With a qualified auditor' },
  OBSERVER: { title: 'Observers and witnesses', hint: 'No competence check' },
}

interface SlotPickerProps {
  role: TeamRole
  candidates: RecommendedCandidate[] | undefined
  taken: PlanAssignment[]
  onPick: (candidate: RecommendedCandidate) => void
}

/** Searchable list of the people who can take a slot, best score first. */
function SlotPicker({ role, candidates, taken, onPick }: SlotPickerProps) {
  const { t } = useTranslation()
  const { language } = useTeamLanguage()
  const available = (candidates ?? [])
    .filter((candidate) => candidate.eligible && !taken.some((member) => member.personId === candidate.personId && member.role === role))
    .sort((a, b) => b.score - a.score)
  const roleName = ROLE_LABELS[role][language]

  return (
    <SearchableSelect
      value=""
      disabled={!candidates || available.length === 0}
      placeholder={
        candidates
          ? available.length > 0
            ? t('cab.auditPlanning.team.flow.addToSlot', 'Add {{role}}', { role: roleName })
            : t('cab.auditPlanning.team.flow.noneEligible', 'No eligible person')
          : t('cab.auditPlanning.team.recommended.loading', 'Ranking the competence register...')
      }
      searchPlaceholder={t('cab.auditPlanning.team.recommended.search', 'Search by name')}
      options={available.map((candidate) => ({
        value: candidate.personId,
        label: `${candidate.name} · ${t('cab.auditPlanning.team.flow.score', 'Score {{score}}', { score: candidate.score })}${
          candidate.jobTitle ? ` · ${competenceRoleLabel(candidate.competenceRole, language)}` : ''
        }`,
      }))}
      onChange={(personId) => {
        const picked = available.find((candidate) => candidate.personId === personId)
        if (picked) onPick(picked)
      }}
    />
  )
}

interface TeamSlotsProps {
  roles: TeamRole[]
  value: PlanAssignment[]
  readOnly: boolean
  activeRole: TeamRole
  onActivate: (role: TeamRole) => void
  statusOf: (member: PlanAssignment) => MemberStatus | undefined
  slotCandidates: Partial<Record<TeamRole, RecommendedCandidate[]>>
  onAdd: (member: PlanAssignment) => void
  onRemove: (member: PlanAssignment) => void
  /** The form that adds an external observer by name. */
  observerForm: ReactNode
}

/**
 * The team as an org chart: the team leader on top and a branch for each other role.
 * Members can be dragged to another role; + opens a list of qualified people.
 */
export function TeamSlots({
  roles,
  value,
  readOnly,
  activeRole,
  onActivate,
  statusOf,
  slotCandidates,
  onAdd,
  onRemove,
  observerForm,
}: TeamSlotsProps) {
  const { t } = useTranslation()
  const [dragging, setDragging] = useState<PlanAssignment | null>(null)
  const [dropTarget, setDropTarget] = useState<TeamRole | null>(null)
  const [openPicker, setOpenPicker] = useState<TeamRole | null>(null)

  const branchRoles = roles.filter((role) => role !== 'TEAM_LEADER')
  const shownBranches = branchRoles.filter((role) => value.some((member) => member.role === role) || openPicker === role)
  const hiddenBranches = branchRoles.filter((role) => !shownBranches.includes(role))
  const hasLeaderSlot = roles.includes('TEAM_LEADER')
  const columns = Math.max(shownBranches.length, 1)

  const canDropOn = (role: TeamRole): boolean =>
    Boolean(dragging) && dragging!.role !== role && (dragging!.personId !== null || role === 'OBSERVER')

  const dropHandlers = (role: TeamRole) =>
    readOnly
      ? {}
      : {
          onDragOver: (event: DragEvent<HTMLElement>) => {
            if (!canDropOn(role)) return
            event.preventDefault()
            event.dataTransfer.dropEffect = 'move'
            if (dropTarget !== role) setDropTarget(role)
          },
          onDragLeave: (event: DragEvent<HTMLElement>) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setDropTarget((current) => (current === role ? null : current))
            }
          },
          onDrop: (event: DragEvent<HTMLElement>) => {
            event.preventDefault()
            if (dragging && canDropOn(role)) onAdd({ ...dragging, role })
            setDragging(null)
            setDropTarget(null)
          },
        }

  const renderSlot = (role: TeamRole, centered = false) => {
    const members = value.filter((member) => member.role === role)
    const title = t(`cab.auditPlanning.team.slots.${ROLE_KEY[role]}`, SLOT_DEFAULTS[role].title)
    const pickerOpen = openPicker === role
    const addLabel = t('cab.auditPlanning.team.flow.addToSlot', 'Add {{role}}', {
      role: t(`cab.auditPlanning.team.roles.${ROLE_KEY[role]}`, ROLE_LABELS[role].en),
    })

    return (
      <section
        key={role}
        aria-label={title}
        {...dropHandlers(role)}
        className={cn(
          'flex min-w-0 flex-col gap-3 rounded-[12px] border bg-white p-3 shadow-sm transition-colors',
          centered && 'w-full max-w-sm',
          dropTarget === role ? 'border-[#1236a3] bg-[#f3f6fd]' : activeRole === role ? 'border-[#b9c8ea]' : 'border-neutral-100',
          dragging && canDropOn(role) && dropTarget !== role && 'border-dashed border-[#93a9e0]',
        )}
      >
        <header className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onActivate(role)}
            aria-pressed={activeRole === role}
            className="flex min-w-0 flex-col items-start text-start"
          >
            <span className="flex items-center gap-2 text-[14px] font-semibold text-neutral-900">
              {title}
              <span className="rounded-full bg-neutral-50 px-2 text-[12px] font-medium text-neutral-700">{members.length}</span>
            </span>
            <span className="truncate text-[12px] text-neutral-600">
              {t(`cab.auditPlanning.team.slotHints.${ROLE_KEY[role]}`, SLOT_DEFAULTS[role].hint)}
            </span>
          </button>
          {!readOnly && (
            <button
              type="button"
              onClick={() => setOpenPicker(pickerOpen ? null : role)}
              aria-expanded={pickerOpen}
              aria-label={addLabel}
              title={addLabel}
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-[8px] border text-[20px] leading-none transition-colors',
                pickerOpen
                  ? 'border-[#1236a3] bg-[#1236a3] text-white'
                  : 'border-neutral-200 bg-white text-[#1236a3] hover:border-[#1236a3] hover:bg-[#f3f6fd]',
              )}
            >
              <span aria-hidden>{pickerOpen ? '−' : '+'}</span>
            </button>
          )}
        </header>

        {!readOnly && pickerOpen && (
          <div className="flex flex-col gap-2">
            {role === 'OBSERVER' ? (
              observerForm
            ) : (
              <SlotPicker
                role={role}
                candidates={slotCandidates[role]}
                taken={value}
                onPick={(candidate) => {
                  onAdd({ personId: candidate.personId, name: candidate.name, role })
                  if (role === 'TEAM_LEADER') setOpenPicker(null)
                }}
              />
            )}
          </div>
        )}

        {members.length === 0 ? (
          <p className="rounded-[8px] border border-dashed border-neutral-200 px-3 py-4 text-center text-[12px] text-neutral-600">
            {readOnly
              ? t('cab.auditPlanning.team.slots.empty', 'Nobody yet')
              : t('cab.auditPlanning.team.flow.emptyBranch', 'Drag a member here or press +')}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {members.map((member) => {
              const status = statusOf(member)
              const draggable = !readOnly && member.personId !== null
              return (
                <li
                  key={memberKey(member)}
                  draggable={draggable}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'move'
                    event.dataTransfer.setData('text/plain', memberKey(member))
                    setDragging(member)
                  }}
                  onDragEnd={() => {
                    setDragging(null)
                    setDropTarget(null)
                  }}
                  className={cn(
                    'flex min-w-0 items-center gap-2 rounded-[8px] border border-neutral-100 bg-white p-2',
                    draggable && 'cursor-grab hover:border-[#b9c8ea] active:cursor-grabbing',
                    dragging && memberKey(dragging) === memberKey(member) && 'opacity-50',
                  )}
                >
                  {draggable && (
                    <span aria-hidden className="shrink-0 text-neutral-400" title={t('cab.auditPlanning.team.flow.dragHint', 'Drag to move to another role')}>
                      <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
                        <circle cx="3" cy="3" r="1.5" />
                        <circle cx="9" cy="3" r="1.5" />
                        <circle cx="3" cy="8" r="1.5" />
                        <circle cx="9" cy="8" r="1.5" />
                        <circle cx="3" cy="13" r="1.5" />
                        <circle cx="9" cy="13" r="1.5" />
                      </svg>
                    </span>
                  )}
                  <span className="relative shrink-0">
                    <PersonAvatar name={member.name} tone={member.personId ? 'primary' : 'muted'} />
                    <span
                      aria-hidden
                      className={cn('absolute -bottom-0.5 -end-0.5 size-3 rounded-full border-2 border-white', status ? STATUS_DOT[status] : 'bg-neutral-300')}
                    />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[14px] font-medium text-neutral-900">{member.name}</span>
                    <span className="truncate text-[12px] text-neutral-600">
                      {status
                        ? t(`cab.auditPlanning.team.memberStatus.${status}`, STATUS_DEFAULT[status])
                        : t(`cab.auditPlanning.team.roles.${ROLE_KEY[role]}`, ROLE_LABELS[role].en)}
                    </span>
                  </span>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => onRemove(member)}
                      aria-label={t('cab.auditPlanning.team.slots.remove', 'Remove {{name}}', { name: member.name })}
                      title={t('cab.auditPlanning.team.slots.remove', 'Remove {{name}}', { name: member.name })}
                      className="flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-neutral-100 text-neutral-500 hover:border-[#fecaca] hover:text-[#b91c1c]"
                    >
                      <span aria-hidden>−</span>
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    )
  }

  return (
    <div className="flex min-w-0 flex-col rounded-[12px] border border-neutral-100 bg-neutral-50 p-3 sm:p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[16px] font-semibold text-neutral-900">
          {t('cab.auditPlanning.team.flow.chartTitle', 'Team structure')}
        </h3>
      </div>

      {hasLeaderSlot && (
        <>
          <div className="flex justify-center">{renderSlot('TEAM_LEADER', true)}</div>
          {shownBranches.length > 0 && <span aria-hidden className="mx-auto h-6 w-px bg-neutral-300" />}
        </>
      )}

      {shownBranches.length > 0 && (
        <div
          className="relative grid gap-4 md:grid-cols-2 xl:[grid-template-columns:var(--cols)]"
          style={{ '--cols': `repeat(${columns}, minmax(0, 1fr))` } as React.CSSProperties}
        >
          {hasLeaderSlot && (
            <span
              aria-hidden
              className="absolute top-0 hidden h-px bg-neutral-300 xl:block"
              style={{ insetInline: `calc((100% - ${(columns - 1) * 16}px) / ${columns * 2})` }}
            />
          )}
          {shownBranches.map((role) => (
            <div key={role} className="flex min-w-0 flex-col">
              {hasLeaderSlot && <span aria-hidden className="mx-auto hidden h-5 w-px bg-neutral-300 xl:block" />}
              {renderSlot(role)}
            </div>
          ))}
        </div>
      )}

      {!readOnly && hiddenBranches.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
          {hiddenBranches.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => {
                setOpenPicker(role)
                onActivate(role)
              }}
              className="rounded-full border border-dashed border-[#b9c8ea] bg-white px-4 py-1.5 text-[12px] font-semibold text-[#1236a3] transition hover:bg-[#f3f6fd]"
            >
              + {t(`cab.auditPlanning.team.roles.${ROLE_KEY[role]}`, ROLE_LABELS[role].en)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
