import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionCard } from '@/components/dashboard/cab/ReviewPrimitives'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import {
  CHECKLIST_NAME_MAX_LENGTH,
  CHECKLIST_STANDARD_CODE_MAX_LENGTH,
  normalizeStandardCode,
} from '@/lib/auditChecklistForm'

interface NewChecklistSectionProps {
  onCreate: (input: { name: string; standardCode: string }) => void
}

/** Creates an empty custom checklist for a scheme the library does not cover. */
export function NewChecklistSection({ onCreate }: NewChecklistSectionProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [standardCode, setStandardCode] = useState('')
  const canCreate = Boolean(name.trim() && standardCode.trim())

  const handleCreate = () => {
    if (!canCreate) return
    onCreate({ name: name.trim(), standardCode: standardCode.trim() })
    setName('')
    setStandardCode('')
  }

  return (
    <SectionCard title={t('cab.auditChecklists.newTitle')}>
      <p className="mb-3 text-[13px] text-[var(--cab-muted)]">{t('cab.auditChecklists.newHint')}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:items-end">
        <TextField
          id="new-checklist-name"
          label={t('cab.auditChecklists.name')}
          required
          maxLength={CHECKLIST_NAME_MAX_LENGTH}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <TextField
          id="new-checklist-standard-code"
          label={t('cab.auditChecklists.standardCode')}
          required
          dir="ltr"
          placeholder="HALAL"
          maxLength={CHECKLIST_STANDARD_CODE_MAX_LENGTH}
          value={standardCode}
          onChange={(event) => setStandardCode(normalizeStandardCode(event.target.value))}
        />
        <Button type="button" className="h-12" disabled={!canCreate} onClick={handleCreate}>
          {t('cab.auditChecklists.create')}
        </Button>
      </div>
    </SectionCard>
  )
}
