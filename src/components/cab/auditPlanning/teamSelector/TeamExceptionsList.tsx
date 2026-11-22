import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Textarea } from '@/components/ui/TextField'
import type { TeamSelectionException } from '@/lib/api/teamSelectionApi'
import type { ExceptionStatus } from '@/lib/teamSelection/types'
import { cn } from '@/lib/utils'
import { useTeamLanguage } from './teamSelectorUtils'

const STATUS_STYLE: Record<ExceptionStatus, string> = {
  PENDING: 'bg-[#fffbeb] text-[#92400e]',
  APPROVED: 'bg-[#f0fdf4] text-[#15803d]',
  REJECTED: 'bg-[#fef2f2] text-[#b91c1c]',
}
const STATUS_DEFAULT: Record<ExceptionStatus, string> = { PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected' }

interface TeamExceptionsListProps {
  exceptions: TeamSelectionException[]
  personName: (personId: string) => string
  /** Resolves to `true` when the decision was saved; the dialog stays open otherwise. */
  onDecide: (exceptionId: string, decision: 'approve' | 'reject', notes?: string) => Promise<boolean>
}

/** Exception requests of the plan, with the CAB admin decision (approve or reject with notes). */
export function TeamExceptionsList({ exceptions, personName, onDecide }: TeamExceptionsListProps) {
  const { t, i18n } = useTranslation()
  const { text } = useTeamLanguage()
  const [pending, setPending] = useState<{ row: TeamSelectionException; decision: 'approve' | 'reject' } | null>(null)
  const [notes, setNotes] = useState('')

  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(i18n.language.startsWith('ar') ? 'ar-EG' : 'en-GB', { dateStyle: 'medium' }) : ''
  const close = () => {
    setPending(null)
    setNotes('')
  }

  if (exceptions.length === 0) {
    return <p className="text-[12px] text-neutral-600">{t('cab.auditPlanning.team.exceptions.empty', 'No exceptions.')}</p>
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {exceptions.map((row) => (
          <li key={row.id} className="flex flex-col gap-2 rounded-[12px] border border-neutral-100 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold', STATUS_STYLE[row.status])}>
                {t(`cab.auditPlanning.team.exceptions.status.${row.status}`, STATUS_DEFAULT[row.status])}
              </span>
              <p className="text-[14px] font-semibold text-neutral-900">{text(row.issueText)}</p>
            </div>
            {row.personId && <p className="text-[12px] text-neutral-700">{personName(row.personId)}</p>}
            <p className="text-[12px] text-neutral-700">“{row.justification}”</p>
            <p className="text-[11px] text-neutral-500">
              {t('cab.auditPlanning.team.exceptions.requestedBy', 'Requested by {{name}} on {{date}}', {
                name: row.requestedBy,
                date: formatDate(row.requestedAt),
              })}
              {row.decidedBy &&
                ` · ${t('cab.auditPlanning.team.exceptions.decidedBy', 'decided by {{name}} on {{date}}', {
                  name: row.decidedBy,
                  date: formatDate(row.decidedAt),
                })}`}
            </p>
            {row.decisionNotes && <p className="text-[12px] text-neutral-700">{row.decisionNotes}</p>}
            {row.status === 'PENDING' && (
              <div className="flex flex-wrap gap-2">
                <Button type="button" className="h-9 px-3 text-[12px]" onClick={() => setPending({ row, decision: 'approve' })}>
                  {t('cab.auditPlanning.team.exceptions.approve', 'Approve')}
                </Button>
                <Button type="button" variant="outline" className="h-9 px-3 text-[12px]" onClick={() => setPending({ row, decision: 'reject' })}>
                  {t('cab.auditPlanning.team.exceptions.reject', 'Reject')}
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={pending !== null}
        title={
          pending?.decision === 'approve'
            ? t('cab.auditPlanning.team.exceptions.approveTitle', 'Approve the exception')
            : t('cab.auditPlanning.team.exceptions.rejectTitle', 'Reject the exception')
        }
        description={pending ? text(pending.row.issueText) : undefined}
        confirmLabel={
          pending?.decision === 'approve'
            ? t('cab.auditPlanning.team.exceptions.approve', 'Approve')
            : t('cab.auditPlanning.team.exceptions.reject', 'Reject')
        }
        destructive={pending?.decision === 'reject'}
        confirmDisabled={pending?.decision === 'reject' && !notes.trim()}
        onConfirm={async () => {
          if (!pending) return
          if (await onDecide(pending.row.id, pending.decision, notes.trim() || undefined)) close()
        }}
        onClose={close}
      >
        <label htmlFor="team-exception-notes" className="mb-1.5 block text-[13px] font-semibold text-neutral-800">
          {t('cab.auditPlanning.team.exceptions.notes', 'Notes (required to reject)')}
        </label>
        <Textarea id="team-exception-notes" value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-[80px]" />
      </ConfirmDialog>
    </>
  )
}
