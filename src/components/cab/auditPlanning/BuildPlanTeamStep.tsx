import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AVAILABLE_AUDITORS_POOL,
  type AuditTeamMember,
  type TeamException,
  type TeamIssueCode,
} from '@/lib/api/cabAuditPlanningApi'
import {
  findException,
  summarizeTeam,
  type MemberEvaluation,
  type TeamCheckContext,
  type TeamIssue,
} from '@/lib/auditTeamEligibility'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SelectField } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/TextField'
import { Badge } from '@/components/dashboard/cab/ReviewPrimitives'

/** Minimum length of the justification that backs an exception request. */
const MIN_JUSTIFICATION_LENGTH = 10

interface BuildPlanTeamStepProps {
  leadAuditor: string
  leadMember: AuditTeamMember
  teamMembers: AuditTeamMember[]
  otherAuditors: AuditTeamMember[]
  showRecommendations: boolean
  auditTrailNote: string
  checkContext: TeamCheckContext
  exceptions: TeamException[]
  /** Number of team-related entries in the plan history. */
  teamHistoryCount: number
  onChangeLeadAuditor: (name: string) => void
  onAddMember: (personId: string, role?: AuditTeamMember['role']) => void
  onRemoveMember: (id: string) => void
  onToggleRecommendations: () => void
  onChangeAuditTrailNote: (value: string) => void
  onRequestException: (personId: string, issueCode: TeamIssueCode, justification: string) => Promise<void>
  onConfirmTeam: () => void
}

interface ExceptionTarget {
  member: AuditTeamMember
  issue: TeamIssue
}

function IssueList({
  evaluation,
  exceptions,
  onRequest,
}: {
  evaluation: MemberEvaluation
  exceptions: TeamException[]
  onRequest: (target: ExceptionTarget) => void
}) {
  const { t } = useTranslation()

  if (evaluation.issues.length === 0) {
    return (
      <p className="text-[12px] text-[#15803d]">
        {t('cab.auditPlanning.team.passes', 'Passes the checks')}
      </p>
    )
  }

  return (
    <ul className="space-y-1">
      {evaluation.issues.map((issue) => {
        const exception = findException(exceptions, evaluation.member.id, issue.code)
        return (
          <li key={issue.code} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
            <span className={exception ? 'text-[#a05a00]' : 'text-[#dc2626]'}>
              {t(`cab.auditPlanning.team.issues.${issue.code}`, {
                ...issue.params,
                defaultValue: issue.code,
              })}
            </span>
            {exception ? (
              <Badge tone="amber">
                {exception.status === 'Approved'
                  ? t('cab.auditPlanning.team.exceptionApproved', 'Exception approved')
                  : t('cab.auditPlanning.team.exceptionPending', 'Exception pending approval')}
              </Badge>
            ) : (
              <Button
                type="button"
                variant="link"
                className="text-[12px]"
                onClick={() => onRequest({ member: evaluation.member, issue })}
              >
                {t('cab.auditPlanning.team.requestException', 'Request exception')}
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function MemberStatusDot({ evaluation, exceptions }: { evaluation: MemberEvaluation; exceptions: TeamException[] }) {
  const unresolved = evaluation.issues.some((i) => !findException(exceptions, evaluation.member.id, i.code))
  const covered = evaluation.issues.length > 0 && !unresolved
  const color = unresolved ? 'bg-[#dc2626]' : covered ? 'bg-[#d97706]' : 'bg-[#16a34a]'
  return <span className={`absolute -bottom-0.5 -end-0.5 size-2.5 rounded-full border-2 border-white ${color}`} />
}

export function BuildPlanTeamStep({
  leadAuditor,
  leadMember,
  teamMembers,
  otherAuditors,
  showRecommendations,
  auditTrailNote,
  checkContext,
  exceptions,
  teamHistoryCount,
  onChangeLeadAuditor,
  onAddMember,
  onRemoveMember,
  onToggleRecommendations,
  onChangeAuditTrailNote,
  onRequestException,
  onConfirmTeam,
}: BuildPlanTeamStepProps) {
  const { t } = useTranslation()
  const [target, setTarget] = useState<ExceptionTarget | null>(null)
  const [justification, setJustification] = useState('')

  const summary = useMemo(
    () => summarizeTeam(teamMembers, checkContext, exceptions),
    [teamMembers, checkContext, exceptions],
  )
  const evaluationFor = (member: AuditTeamMember) =>
    summary.evaluations.find((e) => e.member.id === member.id) ?? { member, issues: [] }

  const pendingExceptions = exceptions.filter((e) => e.status === 'Pending').length
  const approvedExceptions = exceptions.filter((e) => e.status === 'Approved').length
  const canConfirm = summary.unresolvedCount === 0

  const closeDialog = () => {
    setTarget(null)
    setJustification('')
  }

  const submitException = async () => {
    if (!target) return
    await onRequestException(target.member.id, target.issue.code, justification.trim())
    closeDialog()
  }

  const renderMemberRow = (member: AuditTeamMember, opts: { removable: boolean }) => {
    const evaluation = evaluationFor(member)
    return (
      <div
        key={member.id}
        className="flex items-start justify-between gap-3 rounded-[8px] border border-[#f0f0f0] bg-white px-3.5 py-2.5"
      >
        <div className="flex items-start gap-3">
          <span className="select-none pt-2 text-neutral-300">⋮⋮</span>
          <div className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e8edfc] text-[12px] font-bold text-[#1236a3]">
            {member.initials}
            <MemberStatusDot evaluation={evaluation} exceptions={exceptions} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-semibold text-neutral-900">{member.name}</p>
              {member.role !== 'Auditor' && member.role !== 'Lead Auditor' && (
                <span className="rounded-[4px] bg-[#f3f6fd] px-2 py-0.5 text-[11px] font-medium text-[#1236a3]">
                  {member.role}
                </span>
              )}
            </div>
            <IssueList evaluation={evaluation} exceptions={exceptions} onRequest={setTarget} />
          </div>
        </div>

        {opts.removable ? (
          <button
            type="button"
            onClick={() => onRemoveMember(member.id)}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-[6px] border border-[#ececec] text-neutral-500 hover:bg-neutral-50 hover:text-error-600"
            title={t('cab.auditPlanning.team.remove', 'Remove from team')}
            aria-label={t('cab.auditPlanning.team.remove', 'Remove from team')}
          >
            −
          </button>
        ) : (
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-[6px] border border-[#ececec] text-neutral-400">
            −
          </span>
        )}
      </div>
    )
  }

  return (
    <section className="space-y-6 rounded-[12px] border border-[#ececec] bg-white p-6 shadow-none">
      <div>
        <h2 className="text-[16px] font-bold text-neutral-900">Audit team hierarchy</h2>
        <p className="mt-0.5 text-[13px] text-neutral-500">
          Assign a qualified Lead Auditor and build the audit team. Competence, availability, and impartiality checks run automatically.
        </p>
      </div>

      <div className="flex flex-col items-center">
        {/* Top Node: Lead Auditor */}
        <div className="w-full max-w-md rounded-[12px] border border-[#e2e2e2] bg-white p-4 shadow-xs">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[12px] font-bold uppercase tracking-wide text-neutral-400">
              Lead Auditor
            </span>
            <div className="w-52">
              <SelectField
                value={leadAuditor}
                onChange={onChangeLeadAuditor}
                options={AVAILABLE_AUDITORS_POOL.filter((a) => a.role === 'Lead Auditor').map((a) => ({
                  value: a.name,
                  label: a.name,
                }))}
                className="h-9 text-[12px]"
              />
            </div>
          </div>

          {renderMemberRow(leadMember, { removable: false })}
        </div>

        <div className="h-7 w-px bg-[#d4d8e2]" />

        {/* Auditors Box */}
        <div className="w-full max-w-3xl space-y-3.5 rounded-[12px] border border-[#d6e0f5] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-bold text-neutral-900">Auditors</h3>
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-semibold text-neutral-700">
                  {otherAuditors.length}
                </span>
              </div>
              <p className="text-[12px] text-neutral-400">Approved auditors</p>
            </div>
            <span className="inline-flex size-8 items-center justify-center rounded-[6px] bg-[#1236a3] font-bold text-white">
              −
            </span>
          </div>

          <SelectField
            value=""
            placeholder="Add Auditor"
            onChange={(val) => {
              if (val) onAddMember(val, 'Auditor')
            }}
            options={AVAILABLE_AUDITORS_POOL.filter(
              (a) => !teamMembers.some((m) => m.id === a.id),
            ).map((a) => ({
              value: a.id,
              label: `${a.name} — ${a.role} (${a.schemes.join(', ')})`,
            }))}
            className="h-11"
          />

          <div className="space-y-2">
            {otherAuditors.map((member) => renderMemberRow(member, { removable: true }))}
          </div>
        </div>

        {/* Role Quick-Add Pills */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
          {[
            { id: 'aud-tarek', role: 'Technical Expert' as const, label: '+ Technical expert' },
            { id: 'aud-nadia', role: 'Trainee Auditor' as const, label: '+ Trainee auditor' },
            { id: 'aud-karim', role: 'Observer' as const, label: '+ Observer' },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => onAddMember(btn.id, btn.role)}
              className="rounded-full border border-dashed border-[#b9c8ea] bg-white px-4 py-1.5 text-[12px] font-semibold text-[#1236a3] transition hover:bg-[#f3f6fd]"
            >
              {btn.label}
            </button>
          ))}
        </div>

        {summary.uncovered.length > 0 && (
          <p className="mt-4 max-w-3xl rounded-[8px] bg-[#fef2f2] px-3.5 py-2.5 text-[13px] text-[#b91c1c]" role="alert">
            {t(
              'cab.auditPlanning.team.coverageGap',
              'No team member is competent for: {{standards}}. Add a qualified auditor or technical expert.',
              { standards: summary.uncovered.join(', ') },
            )}
          </p>
        )}
      </div>

      {/* Recommendations and reasons */}
      <div>
        <button
          type="button"
          onClick={onToggleRecommendations}
          className="text-[13px] font-semibold text-[#1236a3] hover:underline"
        >
          {showRecommendations ? 'Hide recommendations and reasons' : 'Show recommendations and reasons'}
        </button>

        {showRecommendations && (
          <div className="mt-3 grid grid-cols-1 gap-3 rounded-[10px] border border-[#e2e8f5] bg-[#f8faff] p-4 sm:grid-cols-2">
            {teamMembers.map((m) => {
              const evaluation = evaluationFor(m)
              const eligible = evaluation.issues.length === 0
              return (
                <div key={m.id} className="rounded-[8px] border border-white bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-neutral-900">
                      {m.name} ({m.role})
                    </span>
                    <Badge tone={eligible ? 'green' : 'red'}>
                      {eligible
                        ? t('cab.auditPlanning.team.eligible', 'Eligible')
                        : t('cab.auditPlanning.team.hasIssues', 'Needs attention')}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[12px] text-neutral-600">
                    {m.reason ||
                      `Authorized for ${m.schemes.join(', ')} (${m.iafCodes.join(', ')}). Available and conflict-free.`}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Audit trail note + Confirm */}
      <div className="space-y-3 border-t border-[#f0f0f0] pt-4">
        <label className="block text-[13px] font-semibold text-neutral-800">
          Note for the audit trail (optional)
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={auditTrailNote}
            onChange={(e) => onChangeAuditTrailNote(e.target.value)}
            placeholder="For example: agreed with the technical manager"
            className="h-11 flex-1 rounded-[8px] border border-[#e2e2e2] bg-white px-3.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-[#1236a3] focus:outline-none"
          />
          <Button
            type="button"
            className="h-11 shrink-0 px-5 text-[14px]"
            disabled={!canConfirm}
            onClick={onConfirmTeam}
          >
            {canConfirm
              ? t('cab.auditPlanning.team.confirm', 'Confirm team')
              : t('cab.auditPlanning.team.resolveIssues', 'Resolve {{count}} team issue(s)', {
                  count: summary.unresolvedCount,
                })}
          </Button>
        </div>

        <div className="flex items-center gap-3 pt-1 text-[12px] font-semibold text-[#1236a3]">
          <span>
            {t('cab.auditPlanning.team.exceptionsSummary', 'Exceptions ({{approved}} approved, {{pending}} pending)', {
              approved: approvedExceptions,
              pending: pendingExceptions,
            })}
          </span>
          <span className="text-neutral-300">|</span>
          <span>
            {t('cab.auditPlanning.team.history', 'Team history ({{count}})', { count: teamHistoryCount })}
          </span>
        </div>
      </div>

      <ConfirmDialog
        open={target !== null}
        title={t('cab.auditPlanning.team.exceptionTitle', 'Request an exception')}
        description={
          target
            ? t(`cab.auditPlanning.team.issues.${target.issue.code}`, {
                ...target.issue.params,
                defaultValue: target.issue.code,
              })
            : undefined
        }
        confirmLabel={t('cab.auditPlanning.team.exceptionSubmit', 'Submit request')}
        confirmDisabled={justification.trim().length < MIN_JUSTIFICATION_LENGTH}
        onConfirm={submitException}
        onClose={closeDialog}
      >
        <label htmlFor="team-exception-justification" className="mb-1.5 block text-[13px] font-semibold text-neutral-800">
          {t('cab.auditPlanning.team.justification', 'Justification')}
        </label>
        <Textarea
          id="team-exception-justification"
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          placeholder={t(
            'cab.auditPlanning.team.justificationHint',
            'Explain why this team member can still be used (at least {{min}} characters).',
            { min: MIN_JUSTIFICATION_LENGTH },
          )}
          className="min-h-[96px]"
        />
      </ConfirmDialog>
    </section>
  )
}
