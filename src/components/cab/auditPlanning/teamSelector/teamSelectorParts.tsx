import { useTranslation } from 'react-i18next'
import type { CriterionStatus, TeamIssue } from '@/lib/teamSelection/types'
import { cn } from '@/lib/utils'
import { initialsOf } from './teamSelectorUtils'

const SEVERITY_STYLE = {
  block: 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]',
  warn: 'border-[#fde68a] bg-[#fffbeb] text-[#92400e]',
  info: 'border-[#e5e7eb] bg-[#f9fafb] text-neutral-700',
} as const

/** Mandatory / Blocking / Warning / Note, or "Exception approved" when an exception covers the issue. */
export function SeverityChip({ issue }: { issue: TeamIssue }) {
  const { t } = useTranslation()
  const label = issue.excepted
    ? t('cab.auditPlanning.team.severity.excepted', 'Exception approved')
    : issue.severity === 'block'
      ? issue.mandatory
        ? t('cab.auditPlanning.team.severity.mandatory', 'Mandatory')
        : t('cab.auditPlanning.team.severity.overridable', 'Blocking')
      : t(`cab.auditPlanning.team.severity.${issue.severity}`, issue.severity === 'warn' ? 'Warning' : 'Note')
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-[4px] border px-1.5 py-0.5 text-[11px] font-semibold',
        issue.excepted ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]' : SEVERITY_STYLE[issue.severity],
      )}
    >
      {label}
    </span>
  )
}

const CRITERION_MARK: Record<CriterionStatus, { mark: string; style: string }> = {
  pass: { mark: '✓', style: 'bg-[#f0fdf4] text-[#15803d]' },
  partial: { mark: '◐', style: 'bg-[#eff6ff] text-[#1d4ed8]' },
  warn: { mark: '!', style: 'bg-[#fffbeb] text-[#92400e]' },
  fail: { mark: '✗', style: 'bg-[#fef2f2] text-[#b91c1c]' },
  na: { mark: '·', style: 'bg-[#f9fafb] text-neutral-500' },
}

const CRITERION_DEFAULTS: Record<CriterionStatus, string> = {
  pass: 'Met',
  partial: 'Partly met',
  warn: 'Warning',
  fail: 'Not met',
  na: 'Not checked',
}

export function CriterionMark({ status }: { status: CriterionStatus }) {
  const { t } = useTranslation()
  const { mark, style } = CRITERION_MARK[status]
  return (
    <span
      role="img"
      aria-label={t(`cab.auditPlanning.team.criterion.${status}`, CRITERION_DEFAULTS[status])}
      className={cn('inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold', style)}
    >
      {mark}
    </span>
  )
}

export function ScoreBar({ score, eligible }: { score: number; eligible: boolean }) {
  const { t } = useTranslation()
  return (
    <div
      className="flex min-w-[96px] items-center gap-2"
      title={t('cab.auditPlanning.team.score', 'Suitability score {{score}} of 100', { score })}
    >
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100" aria-hidden>
        <div
          className={cn('h-full rounded-full', eligible ? 'bg-[#1236a3]' : 'bg-neutral-400')}
          style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
        />
      </div>
      <span
        className={cn('w-8 text-end text-[12px] font-semibold', eligible ? 'text-[#1236a3]' : 'text-neutral-500')}
        dir="ltr"
      >
        {score}
      </span>
    </div>
  )
}

export function PersonAvatar({ name, tone = 'primary' }: { name: string; tone?: 'primary' | 'muted' | 'error' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold',
        tone === 'primary' && 'bg-[#e8edfc] text-[#1236a3]',
        tone === 'muted' && 'bg-neutral-100 text-neutral-600',
        tone === 'error' && 'bg-[#fef2f2] text-[#b91c1c]',
      )}
    >
      {initialsOf(name) || '?'}
    </span>
  )
}
