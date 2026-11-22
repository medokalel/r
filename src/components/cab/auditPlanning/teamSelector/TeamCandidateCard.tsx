import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { RecommendedCandidate } from '@/lib/api/teamSelectionApi'
import type { TeamRole } from '@/lib/teamSelection/catalog'
import { cn } from '@/lib/utils'
import { CriterionMark, PersonAvatar, ScoreBar, SeverityChip } from './teamSelectorParts'
import { competenceRoleLabel, ROLE_KEY, useTeamLanguage } from './teamSelectorUtils'

const ADD_DEFAULTS: Record<TeamRole, string> = {
  TEAM_LEADER: 'Set as team leader',
  AUDITOR: 'Add as auditor',
  TECHNICAL_EXPERT: 'Add as expert',
  TRAINEE: 'Add as trainee',
  OBSERVER: 'Add as observer',
}

const COMPONENT_DEFAULTS: Record<string, string> = {
  competence: 'Competence fit',
  availability: 'Availability',
  workload: 'Workload balance',
  experience: 'Sector experience',
  location: 'Location',
  language: 'Language',
}

interface TeamCandidateCardProps {
  candidate: RecommendedCandidate
  role: TeamRole
  selected: boolean
  disabled: boolean
  onAdd: () => void
}

/** One recommended person: rank, score, the reason in one line, and the full criteria on demand. */
export function TeamCandidateCard({ candidate, role, selected, disabled, onAdd }: TeamCandidateCardProps) {
  const { t } = useTranslation()
  const { language, text } = useTeamLanguage()
  const [open, setOpen] = useState(false)

  const blocking = candidate.issues.filter((issue) => issue.severity === 'block' && !issue.excepted)
  const strongest = [...candidate.components].sort((a, b) => b.score / b.max - a.score / a.max).slice(0, 2)
  const panelId = `cand-${role}-${candidate.personId}`
  const shownIssues = candidate.issues.filter((issue) => issue.severity !== 'info')

  return (
    <li className={cn('rounded-[12px] border bg-white', selected ? 'border-[#1236a3]' : 'border-neutral-100')}>
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <PersonAvatar name={candidate.name} tone={candidate.eligible ? 'primary' : 'error'} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-semibold text-neutral-500" dir="ltr">
                #{candidate.rank}
              </span>
              <p className="truncate text-[14px] font-semibold text-neutral-900">{candidate.name}</p>
              <span
                className={cn(
                  'rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold',
                  candidate.eligible ? 'bg-[#f0fdf4] text-[#15803d]' : 'bg-[#fef2f2] text-[#b91c1c]',
                )}
              >
                {candidate.eligible
                  ? t('cab.auditPlanning.team.candidate.eligible', 'Eligible')
                  : t('cab.auditPlanning.team.candidate.ineligible', 'Not eligible')}
              </span>
            </div>
            <p className="truncate text-[12px] text-neutral-600">
              {competenceRoleLabel(candidate.competenceRole, language)}
              {candidate.coveredIafCodes.length > 0 && <span dir="ltr"> · IAF {candidate.coveredIafCodes.join(', ')}</span>}
            </p>
            {blocking.length > 0 ? (
              <p className="mt-1 text-[12px] text-[#b91c1c]">{text(blocking[0].message)}</p>
            ) : (
              <p className="mt-1 text-[12px] text-neutral-600">{strongest.map((component) => text(component.explanation)).join(' · ')}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:w-[300px] sm:justify-end">
          <div className="flex-1 sm:w-28 sm:flex-none">
            <ScoreBar score={candidate.score} eligible={candidate.eligible} />
          </div>
          <button
            type="button"
            className="text-[12px] font-semibold text-[#1236a3] underline-offset-4 hover:underline"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? t('cab.auditPlanning.team.candidate.hide', 'Hide') : t('cab.auditPlanning.team.candidate.why', 'Why')}
          </button>
          <button
            type="button"
            disabled={selected || disabled}
            onClick={onAdd}
            className={cn(
              'h-9 shrink-0 rounded-[8px] px-3 text-[12px] font-semibold transition-colors',
              selected
                ? 'bg-neutral-50 text-neutral-500'
                : 'bg-[#1236a3] text-white hover:bg-[#0f2d8c] disabled:opacity-50',
            )}
          >
            {selected
              ? t('cab.auditPlanning.team.candidate.added', 'In the team')
              : t(`cab.auditPlanning.team.candidate.add.${ROLE_KEY[role]}`, ADD_DEFAULTS[role])}
          </button>
        </div>
      </div>

      {open && (
        <div id={panelId} className="grid gap-4 border-t border-neutral-100 p-3 lg:grid-cols-2">
          <ul className="flex flex-col gap-2" aria-label={t('cab.auditPlanning.team.candidate.criteria', 'Criteria')}>
            {candidate.criteria.map((criterion) => (
              <li key={criterion.key} className="flex items-start gap-2">
                <CriterionMark status={criterion.status} />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-neutral-800">{text(criterion.label)}</p>
                  <p className="text-[12px] text-neutral-600">{text(criterion.message)}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3">
            <table className="w-full text-[12px]">
              <caption className="pb-1 text-start font-semibold text-neutral-800">
                {t('cab.auditPlanning.team.candidate.scoreTitle', 'Score {{score}} of 100', { score: candidate.score })}
              </caption>
              <tbody>
                {candidate.components.map((component) => (
                  <tr key={component.key} className="border-t border-neutral-50 align-top">
                    <th scope="row" className="py-1.5 pe-2 text-start font-medium text-neutral-700">
                      {t(`cab.auditPlanning.team.components.${component.key}`, COMPONENT_DEFAULTS[component.key])}
                    </th>
                    <td className="py-1.5 pe-2 text-neutral-600">{text(component.explanation)}</td>
                    <td className="whitespace-nowrap py-1.5 text-end font-semibold text-neutral-900" dir="ltr">
                      {component.score} / {component.max}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {shownIssues.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {shownIssues.map((issue, index) => (
                  <li key={`${issue.code}-${index}`} className="flex items-start gap-2 text-[12px] text-neutral-700">
                    <SeverityChip issue={issue} />
                    <span>{text(issue.message)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </li>
  )
}
