import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/lib/routes'
import type { TeamEvent, TeamSelectionException, TeamValidationResult } from '@/lib/api/teamSelectionApi'
import type { PlanAssignment } from '@/lib/teamSelection/personnel'
import { PERSONNEL_SEED } from '@/lib/teamSelection/personnelSeed'
import type { TeamIssue } from '@/lib/teamSelection/types'
import { TeamExceptionsList } from './teamSelector/TeamExceptionsList'
import { TeamSelector } from './teamSelector/TeamSelector'

const HISTORY_DEFAULTS: Record<string, string> = {
  TEAM_CONFIRMED: 'Team confirmed',
  CONFIRM_BLOCKED: 'Confirmation refused (blocking issues)',
  MEMBER_ADDED: 'Member added',
  MEMBER_REMOVED: 'Member removed',
  MEMBER_ROLE_CHANGED: 'Role changed',
  EXCEPTION_REQUESTED: 'Exception requested',
  EXCEPTION_APPROVED: 'Exception approved',
  EXCEPTION_REJECTED: 'Exception rejected',
  SETTINGS_UPDATED: 'Rules updated',
}

interface BuildPlanTeamStepProps {
  planId: string
  startDate: string
  endDate: string
  team: PlanAssignment[]
  onChangeTeam: (team: PlanAssignment[]) => void
  /** Result of the last check of this team; `null` until the first check finishes. */
  validation: TeamValidationResult | null
  /** The last check could not run. */
  validationFailed: boolean
  isValidating: boolean
  /** The saved team was confirmed and has not been changed since. */
  confirmed: boolean
  /** The team on screen differs from the confirmed one. */
  unsaved: boolean
  confirmation: { by: string; at: string } | null
  /** Completed audits cannot change their team. */
  readOnly: boolean
  auditTrailNote: string
  events: TeamEvent[]
  /** Changes when exceptions change, so rankings are loaded again. */
  refreshKey: number
  onChangeAuditTrailNote: (value: string) => void
  onRequestException: (issue: TeamIssue, justification: string) => Promise<boolean>
  onDecideException: (exceptionId: string, decision: 'approve' | 'reject', notes?: string) => Promise<boolean>
  onConfirmTeam: () => void
}

/** The audit team step: choose the team, see what blocks it, then confirm it. */
export function BuildPlanTeamStep({
  planId,
  startDate,
  endDate,
  team,
  onChangeTeam,
  validation,
  validationFailed,
  isValidating,
  confirmed,
  unsaved,
  confirmation,
  readOnly,
  auditTrailNote,
  events,
  refreshKey,
  onChangeAuditTrailNote,
  onRequestException,
  onDecideException,
  onConfirmTeam,
}: BuildPlanTeamStepProps) {
  const { t, i18n } = useTranslation()
  const exceptions: TeamSelectionException[] = validation?.exceptions ?? []
  const pendingExceptions = exceptions.filter((exception) => exception.status === 'PENDING').length
  const blocking = validation?.blockingCount ?? 0
  const hasLeader = team.some((member) => member.role === 'TEAM_LEADER')
  const canConfirm = Boolean(validation?.canConfirm) && hasLeader && !isValidating && !readOnly

  const personName = (personId: string): string => PERSONNEL_SEED.find((person) => person.id === personId)?.name ?? ''
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language.startsWith('ar') ? 'ar-EG' : 'en-GB', { dateStyle: 'medium' })

  const confirmHint = !hasLeader
    ? t('cab.auditPlanning.team.flow.needLeader', 'Choose a team leader to confirm the team.')
    : blocking > 0
      ? t(
          'cab.auditPlanning.team.flow.confirmBlocked',
          'The team cannot be confirmed while {{count}} blocking issue(s) remain. Choose another person or change the dates.',
          { count: blocking },
        )
      : !canConfirm && !readOnly
        ? t(
            'cab.auditPlanning.team.panel.confirmDisabled',
            'Confirm becomes available when there is a team leader and no blocking issue is left.',
          )
        : null

  return (
    <section className="space-y-5 rounded-[12px] border border-[#ececec] bg-white p-6 shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-bold text-neutral-900">{t('cab.auditPlanning.team.panel.title', 'Audit team')}</h2>
          <p className="mt-0.5 text-[13px] text-neutral-500">
            {t(
              'cab.auditPlanning.team.panel.subtitle',
              'Recommended from the competence register; checked for competence, availability and impartiality. The plan is sent and started only with a confirmed team.',
            )}
          </p>
          <Link
            to={`${ROUTES.cabTeamAvailability}${startDate ? `?month=${startDate.slice(0, 7)}` : ''}`}
            className="mt-1 inline-block text-[13px] font-semibold text-primary hover:underline"
          >
            {t('cab.auditPlanning.team.panel.availabilityLink', 'View team availability calendar')}
          </Link>
        </div>
        <span
          className={`rounded-[4px] px-2 py-1 text-[12px] font-semibold ${
            confirmed ? 'bg-[#f0fdf4] text-[#15803d]' : unsaved ? 'bg-[#fffbeb] text-[#92400e]' : 'bg-neutral-100 text-neutral-600'
          }`}
        >
          {confirmed && confirmation
            ? t('cab.auditPlanning.team.panel.confirmedBadge', 'Confirmed by {{name}} on {{date}}', {
                name: confirmation.by,
                date: formatDate(confirmation.at),
              })
            : unsaved
              ? t('cab.auditPlanning.team.panel.unsaved', 'Changes not confirmed')
              : t('cab.auditPlanning.team.panel.notConfirmed', 'Not confirmed')}
        </span>
      </div>

      {validationFailed && (
        <p role="alert" className="text-[13px] text-[#b91c1c]">
          {t('cab.auditPlanning.team.panel.checkFailed', 'The team could not be checked. Change the team or try again.')}
        </p>
      )}

      <TeamSelector
        planId={planId}
        startDate={startDate}
        endDate={endDate}
        team={team}
        onChange={onChangeTeam}
        validation={validation}
        isValidating={isValidating}
        readOnly={readOnly}
        refreshKey={refreshKey}
        onRequestException={onRequestException}
      />

      <div className="space-y-3 border-t border-[#f0f0f0] pt-4">
        <label className="block text-[13px] font-semibold text-neutral-800" htmlFor="team-audit-trail-note">
          {t('cab.auditPlanning.team.panel.note', 'Note for the audit trail (optional)')}
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            id="team-audit-trail-note"
            type="text"
            value={auditTrailNote}
            onChange={(event) => onChangeAuditTrailNote(event.target.value)}
            placeholder={t('cab.auditPlanning.team.panel.notePlaceholder', 'For example: agreed with the technical manager')}
            className="h-11 flex-1 rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-[#1236a3] focus:outline-none"
          />
          <Button type="button" className="h-11 shrink-0 px-5 text-[14px]" disabled={!canConfirm} onClick={onConfirmTeam}>
            {t('cab.auditPlanning.team.panel.confirm', 'Confirm team')}
          </Button>
        </div>
        {confirmHint && <p className="text-[12px] text-neutral-600">{confirmHint}</p>}
      </div>

      <details className="text-[13px]" open={pendingExceptions > 0}>
        <summary className="cursor-pointer text-[13px] font-semibold text-[#1236a3]">
          {t('cab.auditPlanning.team.panel.exceptions', 'Exceptions ({{count}}, pending {{pending}})', {
            count: exceptions.length,
            pending: pendingExceptions,
          })}
        </summary>
        <div className="mt-2 space-y-2">
          <p className="text-[12px] text-neutral-500">
            {t(
              'cab.auditPlanning.team.exceptions.hint',
              'Exceptions accept a non-mandatory blocking issue (travel buffer, missing declaration) for one person and one audit.',
            )}
          </p>
          <TeamExceptionsList exceptions={exceptions} personName={personName} onDecide={onDecideException} />
        </div>
      </details>

      <details className="text-[13px]">
        <summary className="cursor-pointer text-[13px] font-semibold text-[#1236a3]">
          {t('cab.auditPlanning.team.panel.history', 'Team history ({{count}})', { count: events.length })}
        </summary>
        <ul className="mt-2 space-y-1.5">
          {events.length === 0 && (
            <li className="text-[12px] text-neutral-500">{t('cab.auditPlanning.team.history.empty', 'No team decisions recorded yet.')}</li>
          )}
          {events.map((event) => (
            <li key={event.id} className="flex flex-wrap gap-x-3 text-[12px] text-neutral-600">
              <span className="font-medium text-neutral-800">
                {t(`cab.auditPlanning.team.history.actions.${event.action}`, HISTORY_DEFAULTS[event.action] ?? event.action)}
              </span>
              {typeof event.details.name === 'string' && <span>{event.details.name}</span>}
              <span className="text-neutral-400" dir="ltr">
                {new Date(event.createdAt).toLocaleString(i18n.language.startsWith('ar') ? 'ar-EG' : 'en-GB', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  )
}
