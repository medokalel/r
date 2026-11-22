import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TeamValidationResult } from '@/lib/api/teamSelectionApi'
import { ROLE_LABELS } from '@/lib/teamSelection/catalog'
import type { Alternative, TeamIssue } from '@/lib/teamSelection/types'
import { SeverityChip } from './teamSelectorParts'
import { useTeamLanguage } from './teamSelectorUtils'

interface TeamValidationPanelProps {
  validation: TeamValidationResult
  readOnly: boolean
  onUseAlternative: (issue: TeamIssue, alternative: Alternative) => void
  onRequestException: (issue: TeamIssue) => void
}

const issueKey = (issue: TeamIssue, index: number) => `${issue.code}-${issue.personId ?? ''}-${index}`

/** What stops the team (or what to note), with qualified alternatives and exception requests. */
export function TeamValidationPanel({
  validation,
  readOnly,
  onUseAlternative,
  onRequestException,
}: TeamValidationPanelProps) {
  const { t } = useTranslation()
  const { language, text } = useTeamLanguage()
  const [showNotes, setShowNotes] = useState(false)

  const all = [...validation.teamIssues, ...validation.members.flatMap((member) => member.issues)]
  const blocking = all.filter((issue) => issue.severity === 'block' && !issue.excepted)
  const warnings = all.filter((issue) => issue.severity === 'warn' || (issue.severity === 'block' && issue.excepted))
  const notes = all.filter((issue) => issue.severity === 'info')

  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      {blocking.length > 0 ? (
        <section role="alert" className="relative rounded-[12px] border border-[#fecaca] bg-[#fef2f2] p-4 ps-6">
          <span aria-hidden className="absolute inset-y-4 start-3 w-1 rounded-[4px] bg-[#ef4444]" />
          <p className="text-[14px] font-semibold text-[#b91c1c]">
            {t('cab.auditPlanning.team.validation.blockedTitle', 'The team cannot be confirmed yet: {{count}} blocking issue(s)', {
              count: blocking.length,
            })}
          </p>
          <p className="mt-0.5 text-[12px] text-neutral-700">
            {validation.mandatoryBlockingCount > 0
              ? t(
                  'cab.auditPlanning.team.validation.blockedMandatory',
                  'Mandatory competence, scheduling and impartiality requirements cannot be overridden. Choose another person or change the team.',
                )
              : t(
                  'cab.auditPlanning.team.validation.blockedOverridable',
                  'These issues can be accepted only through an exception approved by a CAB admin, with a justification.',
                )}
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            {blocking.map((issue, index) => (
              <li key={issueKey(issue, index)} className="flex flex-col gap-2 rounded-[8px] bg-white p-3">
                <div className="flex items-start gap-2">
                  <SeverityChip issue={issue} />
                  <p className="text-[14px] text-neutral-900">{text(issue.message)}</p>
                </div>
                {!readOnly && (issue.alternatives.length > 0 || issue.overridable) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {issue.alternatives.length > 0 && (
                      <span className="text-[12px] text-neutral-600">
                        {t('cab.auditPlanning.team.validation.alternatives', 'Qualified alternatives:')}
                      </span>
                    )}
                    {issue.alternatives.map((alternative) => (
                      <button
                        key={alternative.personId}
                        type="button"
                        onClick={() => onUseAlternative(issue, alternative)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#b9c8ea] bg-[#f3f6fd] px-3 py-1 text-[12px] font-semibold text-[#1236a3] hover:bg-[#e8edfc]"
                      >
                        {t('cab.auditPlanning.team.validation.use', 'Use {{name}} ({{role}})', {
                          name: alternative.name,
                          role: ROLE_LABELS[alternative.role][language],
                        })}
                        <span className="font-normal text-neutral-600" dir="ltr">
                          {alternative.score}
                        </span>
                      </button>
                    ))}
                    {issue.overridable && (
                      <button
                        type="button"
                        onClick={() => onRequestException(issue)}
                        className="text-[12px] font-semibold text-[#1236a3] underline underline-offset-4"
                      >
                        {t('cab.auditPlanning.team.validation.requestException', 'Request an exception')}
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section role="status" className="relative rounded-[12px] border border-[#bbf7d0] bg-[#f7fef9] p-4 ps-6">
          <span aria-hidden className="absolute inset-y-4 start-3 w-1 rounded-[4px] bg-[#22c55e]" />
          <p className="text-[14px] font-semibold text-[#15803d]">
            {t('cab.auditPlanning.team.validation.readyTitle', 'The team passes the competence, availability and impartiality checks')}
          </p>
          <p className="mt-0.5 text-[12px] text-neutral-700">
            {t('cab.auditPlanning.team.validation.readyHint', 'Warnings to note: {{count}}.', { count: warnings.length })}
          </p>
        </section>
      )}

      {warnings.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {warnings.map((issue, index) => (
            <li key={issueKey(issue, index)} className="flex items-start gap-2 text-[12px] text-neutral-800">
              <SeverityChip issue={issue} />
              <span>{text(issue.message)}</span>
            </li>
          ))}
        </ul>
      )}

      {notes.length > 0 && (
        <div>
          <button
            type="button"
            className="text-[12px] font-semibold text-[#1236a3] underline-offset-4 hover:underline"
            aria-expanded={showNotes}
            onClick={() => setShowNotes((open) => !open)}
          >
            {showNotes
              ? t('cab.auditPlanning.team.validation.hideNotes', 'Hide notes')
              : t('cab.auditPlanning.team.validation.showNotes', 'Show notes ({{count}})', { count: notes.length })}
          </button>
          {showNotes && (
            <ul className="mt-2 flex flex-col gap-1.5">
              {notes.map((issue, index) => (
                <li key={issueKey(issue, index)} className="flex items-start gap-2 text-[12px] text-neutral-700">
                  <SeverityChip issue={issue} />
                  <span>{text(issue.message)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
