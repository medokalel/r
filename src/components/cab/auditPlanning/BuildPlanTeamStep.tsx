import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SelectField } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/TextField'
import { Badge, type BadgeTone } from '@/components/dashboard/cab/ReviewPrimitives'
import type { TeamEvent, TeamSelectionException, TeamValidationResult } from '@/lib/api/teamSelectionApi'
import { ROLE_LABELS, type IssueCode, type LocalizedText, type TeamRole } from '@/lib/teamSelection/catalog'
import type { PlanAssignment } from '@/lib/teamSelection/personnel'
import { PERSONNEL_SEED } from '@/lib/teamSelection/personnelSeed'
import type { Alternative, CriterionStatus, MemberResult, TeamIssue } from '@/lib/teamSelection/types'

/** Minimum length of the justification behind an exception request. */
const MIN_JUSTIFICATION_LENGTH = 10

const ROLE_ORDER: TeamRole[] = ['TEAM_LEADER', 'AUDITOR', 'TECHNICAL_EXPERT', 'TRAINEE', 'OBSERVER']

const memberKey = (member: { personId: string | null; name: string }): string => member.personId ?? member.name

interface BuildPlanTeamStepProps {
  team: PlanAssignment[]
  /** Result of the last check of this team; `null` until the first check finishes. */
  validation: TeamValidationResult | null
  /** The last check could not run. */
  validationFailed: boolean
  isValidating: boolean
  /** The team was confirmed and has not been changed since. */
  confirmed: boolean
  /** Completed audits cannot change their team. */
  readOnly: boolean
  auditTrailNote: string
  events: TeamEvent[]
  onAddMember: (personId: string, role: TeamRole) => void
  onRemoveMember: (key: string) => void
  onChangeRole: (key: string, role: TeamRole) => void
  onReplaceMember: (key: string, alternative: Alternative) => void
  onChangeAuditTrailNote: (value: string) => void
  onRequestException: (
    personId: string | null,
    issueCode: IssueCode,
    justification: string,
    issueText: LocalizedText,
  ) => Promise<void>
  onDecideException: (exceptionId: string, decision: 'approve' | 'reject', notes?: string) => Promise<void>
  onConfirmTeam: () => void
}

type ExceptionTarget = { personId: string | null; issue: TeamIssue }

const STATUS_TONE: Record<MemberResult['status'], BadgeTone> = { ok: 'green', warn: 'amber', block: 'red' }
const CRITERION_MARK: Record<CriterionStatus, { symbol: string; className: string }> = {
  pass: { symbol: '✓', className: 'text-[#16a34a]' },
  partial: { symbol: '◐', className: 'text-[#d97706]' },
  warn: { symbol: '!', className: 'text-[#d97706]' },
  fail: { symbol: '✕', className: 'text-[#dc2626]' },
  na: { symbol: '–', className: 'text-neutral-300' },
}

export function BuildPlanTeamStep({
  team,
  validation,
  validationFailed,
  isValidating,
  confirmed,
  readOnly,
  auditTrailNote,
  events,
  onAddMember,
  onRemoveMember,
  onChangeRole,
  onReplaceMember,
  onChangeAuditTrailNote,
  onRequestException,
  onDecideException,
  onConfirmTeam,
}: BuildPlanTeamStepProps) {
  const { t, i18n } = useTranslation()
  const language: 'en' | 'ar' = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const text = (value: LocalizedText): string => value[language]

  const [newPersonId, setNewPersonId] = useState('')
  const [newRole, setNewRole] = useState<TeamRole>('AUDITOR')
  const [openChecks, setOpenChecks] = useState<string | null>(null)
  const [exceptionTarget, setExceptionTarget] = useState<ExceptionTarget | null>(null)
  const [justification, setJustification] = useState('')
  const [rejecting, setRejecting] = useState<TeamSelectionException | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')

  const roleLabel = (role: TeamRole): string => ROLE_LABELS[role][language]
  const personName = (personId: string | null): string =>
    PERSONNEL_SEED.find((person) => person.id === personId)?.name ?? ''
  const exceptions = validation?.exceptions ?? []
  const activeException = (personId: string | null, code: IssueCode) =>
    exceptions.find(
      (exception) => exception.personId === personId && exception.issueCode === code && exception.status !== 'REJECTED',
    )
  const rejectedException = (personId: string | null, code: IssueCode) =>
    exceptions.find(
      (exception) => exception.personId === personId && exception.issueCode === code && exception.status === 'REJECTED',
    )

  const sortedTeam = [...team].sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role))
  const addablePeople = PERSONNEL_SEED.filter((person) => !team.some((member) => member.personId === person.id))
  const resultFor = (member: PlanAssignment): MemberResult | undefined =>
    validation?.members.find((result) => memberKey(result) === memberKey(member))

  const closeExceptionDialog = () => {
    setExceptionTarget(null)
    setJustification('')
  }
  const closeRejectDialog = () => {
    setRejecting(null)
    setRejectNotes('')
  }

  const renderAlternatives = (alternatives: Alternative[], onPick: (alternative: Alternative) => void) =>
    alternatives.length > 0 && (
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px]">
        <span className="text-neutral-500">{t('cab.auditPlanning.team.alternatives', 'Qualified alternatives:')}</span>
        {alternatives.map((alternative) => (
          <Button
            key={alternative.personId}
            type="button"
            variant="link"
            className="text-[12px]"
            disabled={readOnly}
            onClick={() => onPick(alternative)}
          >
            {t('cab.auditPlanning.team.useAlternative', 'Use {{name}} ({{role}})', {
              name: alternative.name,
              role: roleLabel(alternative.role),
            })}
          </Button>
        ))}
      </div>
    )

  const renderIssue = (issue: TeamIssue, personId: string | null, onPickAlternative: (alt: Alternative) => void) => {
    const requested = activeException(personId, issue.code)
    const rejected = rejectedException(personId, issue.code)
    const blocking = issue.severity === 'block' && !issue.excepted
    const tone = issue.excepted
      ? 'text-[#a05a00]'
      : issue.severity === 'block'
        ? 'text-[#dc2626]'
        : issue.severity === 'warn'
          ? 'text-[#a05a00]'
          : 'text-neutral-500'
    return (
      <li key={`${issue.code}-${issue.personId ?? ''}-${issue.message.en}`} className="space-y-0.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
          <span className={tone}>{text(issue.message)}</span>
          {issue.excepted && <Badge tone="amber">{t('cab.auditPlanning.team.exceptionApproved', 'Exception approved')}</Badge>}
          {!issue.excepted && requested && (
            <Badge tone="amber">{t('cab.auditPlanning.team.exceptionPending', 'Exception pending approval')}</Badge>
          )}
          {blocking && !requested && issue.overridable && (
            <>
              {rejected && <Badge tone="red">{t('cab.auditPlanning.team.exceptionRejected', 'Exception rejected')}</Badge>}
              <Button
                type="button"
                variant="link"
                className="text-[12px]"
                disabled={readOnly}
                onClick={() => setExceptionTarget({ personId, issue })}
              >
                {t('cab.auditPlanning.team.requestException', 'Request exception')}
              </Button>
            </>
          )}
          {blocking && issue.mandatory && (
            <span className="text-neutral-400">
              {t('cab.auditPlanning.team.mandatory', 'Mandatory: cannot be overridden')}
            </span>
          )}
        </div>
        {blocking && renderAlternatives(issue.alternatives, onPickAlternative)}
      </li>
    )
  }

  const renderMember = (member: PlanAssignment) => {
    const key = memberKey(member)
    const result = resultFor(member)
    const shownIssues = (result?.issues ?? []).filter((issue) => issue.severity !== 'info')
    return (
      <div key={key} className="space-y-2 rounded-[8px] border border-[#f0f0f0] bg-white px-3.5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e8edfc] text-[12px] font-bold text-[#1236a3]">
              {member.name
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join('')}
            </div>
            <div>
              <p className="text-[14px] font-semibold text-neutral-900">{member.name}</p>
              <p className="text-[12px] text-neutral-500" dir="ltr">
                {PERSONNEL_SEED.find((person) => person.id === member.personId)?.standards.join(', ') ?? ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {result && (
              <Badge tone={STATUS_TONE[result.status]}>
                {result.status === 'ok'
                  ? t('cab.auditPlanning.team.status.ok', 'Passes the checks')
                  : result.status === 'warn'
                    ? t('cab.auditPlanning.team.status.warn', 'Passes with warnings')
                    : t('cab.auditPlanning.team.status.block', 'Blocked')}
              </Badge>
            )}
            <div className="w-44">
              <SelectField
                value={member.role}
                disabled={readOnly}
                onChange={(value) => onChangeRole(key, value as TeamRole)}
                options={ROLE_ORDER.map((role) => ({ value: role, label: roleLabel(role) }))}
                className="h-9 text-[12px]"
              />
            </div>
            <Button
              type="button"
              variant="link"
              className="text-[12px]"
              onClick={() => setOpenChecks((current) => (current === key ? null : key))}
            >
              {openChecks === key
                ? t('cab.auditPlanning.team.hideChecks', 'Hide checks')
                : t('cab.auditPlanning.team.showChecks', 'Show checks')}
            </Button>
            <button
              type="button"
              disabled={readOnly}
              onClick={() => onRemoveMember(key)}
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-[6px] border border-[#ececec] text-neutral-500 hover:bg-neutral-50 hover:text-error-600 disabled:opacity-40"
              title={t('cab.auditPlanning.team.remove', 'Remove from team')}
              aria-label={t('cab.auditPlanning.team.remove', 'Remove from team')}
            >
              −
            </button>
          </div>
        </div>

        {shownIssues.length > 0 && (
          <ul className="space-y-1.5">
            {shownIssues.map((issue) =>
              renderIssue(issue, member.personId, (alternative) => onReplaceMember(key, alternative)),
            )}
          </ul>
        )}

        {openChecks === key && result && (
          <ul className="grid grid-cols-1 gap-x-6 gap-y-1 border-t border-[#f5f5f5] pt-2 sm:grid-cols-2">
            {result.criteria.map((criterion) => (
              <li key={criterion.key} className="flex items-start gap-2 text-[12px]">
                <span className={`mt-0.5 w-3 text-center font-bold ${CRITERION_MARK[criterion.status].className}`}>
                  {CRITERION_MARK[criterion.status].symbol}
                </span>
                <span>
                  <span className="font-medium text-neutral-800">{text(criterion.label)}</span>
                  <span className="block text-neutral-500">{text(criterion.message)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  const teamIssues = (validation?.teamIssues ?? []).filter((issue) => issue.severity !== 'info' || issue.alternatives.length > 0)
  const blocking = validation?.blockingCount ?? 0
  const canConfirm = Boolean(validation?.canConfirm) && !isValidating && !readOnly

  return (
    <section className="space-y-5 rounded-[12px] border border-[#ececec] bg-white p-6 shadow-none">
      <div>
        <h2 className="text-[16px] font-bold text-neutral-900">{t('cab.auditPlanning.team.title', 'Audit team')}</h2>
        <p className="mt-0.5 text-[13px] text-neutral-500">
          {t(
            'cab.auditPlanning.team.subtitle',
            'Choose the team. Competence, availability and impartiality are checked automatically against the audit.',
          )}
        </p>
      </div>

      {validation && (
        <div
          role="status"
          className={`rounded-[8px] px-3.5 py-2.5 text-[13px] ${
            blocking > 0
              ? 'bg-[#fef2f2] text-[#b91c1c]'
              : validation.warningCount > 0
                ? 'bg-[#fef8ee] text-[#a05a00]'
                : 'bg-[#f0fdf4] text-[#15803d]'
          }`}
        >
          {blocking > 0
            ? t(
                'cab.auditPlanning.team.banner.blocked',
                'The team cannot be confirmed yet: {{count}} blocking issue(s) ({{mandatory}} mandatory, {{overridable}} can be accepted by an exception).',
                { count: blocking, mandatory: validation.mandatoryBlockingCount, overridable: validation.overridableBlockingCount },
              )
            : validation.warningCount > 0
              ? t('cab.auditPlanning.team.banner.warnings', 'The team can be confirmed with {{count}} warning(s).', {
                  count: validation.warningCount,
                })
              : t('cab.auditPlanning.team.banner.ok', 'All checks pass. The team can be confirmed.')}
        </div>
      )}
      {!validation && !validationFailed && (
        <p className="text-[13px] text-neutral-400">{t('cab.auditPlanning.team.checking', 'Checking the team…')}</p>
      )}
      {validationFailed && (
        <p role="alert" className="text-[13px] text-[#b91c1c]">
          {t('cab.auditPlanning.team.checkFailed', 'The team could not be checked. Change the team or try again.')}
        </p>
      )}

      <div className="space-y-2.5">
        {sortedTeam.length === 0 && (
          <p className="rounded-[8px] border border-dashed border-[#d9d9d9] px-4 py-6 text-center text-[13px] text-neutral-500">
            {t('cab.auditPlanning.team.empty', 'No team members yet. Add a team leader first.')}
          </p>
        )}
        {sortedTeam.map(renderMember)}
      </div>

      {teamIssues.length > 0 && (
        <div className="space-y-1.5 rounded-[8px] border border-[#f0f0f0] bg-[#fafafa] px-3.5 py-3">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">
            {t('cab.auditPlanning.team.teamIssues', 'Team-level checks')}
          </p>
          <ul className="space-y-1.5">
            {teamIssues.map((issue) =>
              renderIssue(issue, issue.personId, (alternative) => onAddMember(alternative.personId, alternative.role)),
            )}
          </ul>
        </div>
      )}

      {!readOnly && (
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
          <div className="flex-1">
            <SelectField
              value={newPersonId}
              placeholder={t('cab.auditPlanning.team.addPerson', 'Add a team member')}
              onChange={setNewPersonId}
              options={addablePeople.map((person) => ({
                value: person.id,
                label: `${person.name} — ${person.competenceRole}`,
              }))}
              className="h-11"
            />
          </div>
          <div className="w-full sm:w-52">
            <SelectField
              value={newRole}
              onChange={(value) => setNewRole(value as TeamRole)}
              options={ROLE_ORDER.map((role) => ({ value: role, label: roleLabel(role) }))}
              className="h-11"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="h-11 px-5 text-[14px]"
            disabled={!newPersonId}
            onClick={() => {
              onAddMember(newPersonId, newRole)
              setNewPersonId('')
            }}
          >
            {t('cab.auditPlanning.team.add', 'Add')}
          </Button>
        </div>
      )}

      {exceptions.length > 0 && (
        <div className="space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">
            {t('cab.auditPlanning.team.exceptions', 'Exceptions')}
          </p>
          <ul className="space-y-2">
            {exceptions.map((exception) => (
              <li key={exception.id} className="rounded-[8px] border border-[#f0f0f0] px-3.5 py-2.5 text-[12px]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-neutral-800">
                    {personName(exception.personId)} · {text(exception.issueText)}
                  </span>
                  <Badge tone={exception.status === 'APPROVED' ? 'green' : exception.status === 'REJECTED' ? 'red' : 'amber'}>
                    {t(`cab.auditPlanning.team.exceptionStatus.${exception.status}`, exception.status)}
                  </Badge>
                </div>
                <p className="mt-1 text-neutral-500">{exception.justification}</p>
                {exception.decisionNotes && <p className="mt-1 text-neutral-500">{exception.decisionNotes}</p>}
                {exception.status === 'PENDING' && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-neutral-400">{t('cab.auditPlanning.team.adminAction', 'CAB admin decision (demo)')}</span>
                    <Button type="button" variant="link" className="text-[12px]" onClick={() => void onDecideException(exception.id, 'approve')}>
                      {t('cab.auditPlanning.team.approve', 'Approve')}
                    </Button>
                    <Button type="button" variant="link" className="text-[12px]" onClick={() => setRejecting(exception)}>
                      {t('cab.auditPlanning.team.reject', 'Reject')}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3 border-t border-[#f0f0f0] pt-4">
        <label className="block text-[13px] font-semibold text-neutral-800" htmlFor="team-audit-trail-note">
          {t('cab.auditPlanning.team.noteLabel', 'Note for the audit trail (optional)')}
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            id="team-audit-trail-note"
            type="text"
            value={auditTrailNote}
            onChange={(event) => onChangeAuditTrailNote(event.target.value)}
            placeholder={t('cab.auditPlanning.team.notePlaceholder', 'For example: agreed with the technical manager')}
            className="h-11 flex-1 rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-[#1236a3] focus:outline-none"
          />
          <Button type="button" className="h-11 shrink-0 px-5 text-[14px]" disabled={!canConfirm} onClick={onConfirmTeam}>
            {isValidating
              ? t('cab.auditPlanning.team.checking', 'Checking the team…')
              : blocking > 0
                ? t('cab.auditPlanning.team.resolveIssues', 'Resolve {{count}} blocking issue(s)', { count: blocking })
                : confirmed
                  ? t('cab.auditPlanning.team.confirmedContinue', 'Team confirmed: continue')
                  : t('cab.auditPlanning.team.confirm', 'Confirm team')}
          </Button>
        </div>

        <details className="text-[12px]">
          <summary className="cursor-pointer font-semibold text-[#1236a3]">
            {t('cab.auditPlanning.team.history', 'Team history ({{count}})', { count: events.length })}
          </summary>
          <ul className="mt-2 space-y-1">
            {events.length === 0 && <li className="text-neutral-400">{t('cab.auditPlanning.team.noHistory', 'No team changes yet.')}</li>}
            {events.map((event) => (
              <li key={event.id} className="flex flex-wrap gap-x-3 text-neutral-600">
                <span className="font-medium text-neutral-800">
                  {t(`cab.auditPlanning.team.events.${event.action}`, event.action)}
                </span>
                {typeof event.details.name === 'string' && <span>{event.details.name}</span>}
                <span className="text-neutral-400" dir="ltr">
                  {new Date(event.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-GB', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </li>
            ))}
          </ul>
        </details>
      </div>

      <ConfirmDialog
        open={exceptionTarget !== null}
        title={t('cab.auditPlanning.team.exceptionTitle', 'Request an exception')}
        description={exceptionTarget ? text(exceptionTarget.issue.message) : undefined}
        confirmLabel={t('cab.auditPlanning.team.exceptionSubmit', 'Submit request')}
        confirmDisabled={justification.trim().length < MIN_JUSTIFICATION_LENGTH}
        onConfirm={async () => {
          if (!exceptionTarget) return
          await onRequestException(
            exceptionTarget.personId,
            exceptionTarget.issue.code,
            justification.trim(),
            exceptionTarget.issue.message,
          )
          closeExceptionDialog()
        }}
        onClose={closeExceptionDialog}
      >
        <label htmlFor="team-exception-justification" className="mb-1.5 block text-[13px] font-semibold text-neutral-800">
          {t('cab.auditPlanning.team.justification', 'Justification')}
        </label>
        <Textarea
          id="team-exception-justification"
          value={justification}
          onChange={(event) => setJustification(event.target.value)}
          placeholder={t(
            'cab.auditPlanning.team.justificationHint',
            'Explain why this team member can still be used (at least {{min}} characters).',
            { min: MIN_JUSTIFICATION_LENGTH },
          )}
          className="min-h-[96px]"
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={rejecting !== null}
        title={t('cab.auditPlanning.team.rejectTitle', 'Reject the exception')}
        confirmLabel={t('cab.auditPlanning.team.reject', 'Reject')}
        destructive
        confirmDisabled={!rejectNotes.trim()}
        onConfirm={async () => {
          if (!rejecting) return
          await onDecideException(rejecting.id, 'reject', rejectNotes.trim())
          closeRejectDialog()
        }}
        onClose={closeRejectDialog}
      >
        <label htmlFor="team-exception-reject" className="mb-1.5 block text-[13px] font-semibold text-neutral-800">
          {t('cab.auditPlanning.team.rejectReason', 'Reason')}
        </label>
        <Textarea
          id="team-exception-reject"
          value={rejectNotes}
          onChange={(event) => setRejectNotes(event.target.value)}
          className="min-h-[80px]"
        />
      </ConfirmDialog>
    </section>
  )
}
