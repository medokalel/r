import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Textarea } from '@/components/ui/TextField'
import type { TeamIssue } from '@/lib/teamSelection/types'
import { useTeamLanguage } from './teamSelectorUtils'

/** Minimum length of the justification behind an exception request. */
const MIN_JUSTIFICATION_LENGTH = 10

interface TeamExceptionDialogProps {
  issue: TeamIssue | null
  /** Resolves to `true` when the request was saved; the dialog stays open otherwise. */
  onSubmit: (issue: TeamIssue, justification: string) => Promise<boolean>
  onClose: () => void
}

export function TeamExceptionDialog({ issue, onSubmit, onClose }: TeamExceptionDialogProps) {
  const { t } = useTranslation()
  const { text } = useTeamLanguage()
  const [justification, setJustification] = useState('')

  const close = () => {
    setJustification('')
    onClose()
  }

  return (
    <ConfirmDialog
      open={issue !== null}
      title={t('cab.auditPlanning.team.exception.title', 'Request an exception')}
      description={issue ? text(issue.message) : undefined}
      confirmLabel={t('cab.auditPlanning.team.exception.submit', 'Send request')}
      confirmDisabled={justification.trim().length < MIN_JUSTIFICATION_LENGTH}
      onConfirm={async () => {
        if (!issue) return
        if (await onSubmit(issue, justification.trim())) close()
      }}
      onClose={close}
    >
      <p className="mb-3 text-[12px] text-neutral-600">
        {t(
          'cab.auditPlanning.team.exception.hint',
          'Only non-mandatory issues can be accepted. A CAB admin reviews the request in the work queue; it is kept in the audit trail.',
        )}
      </p>
      <label htmlFor="team-exception-justification" className="mb-1.5 block text-[13px] font-semibold text-neutral-800">
        {t('cab.auditPlanning.team.exception.justification', 'Justification (at least 10 characters)')}
      </label>
      <Textarea
        id="team-exception-justification"
        value={justification}
        onChange={(event) => setJustification(event.target.value)}
        className="min-h-[96px]"
      />
    </ConfirmDialog>
  )
}
