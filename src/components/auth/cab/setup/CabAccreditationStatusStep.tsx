import { useTranslation } from 'react-i18next'
import { TextField } from '@/components/ui'
import { SetupNote, SetupOptionCard, SetupSection } from '@/components/auth/cab/setup/CabSetupPrimitives'
import { ACCREDITATION_STATUS_OPTIONS } from '@/lib/api/cabSetupApi'
import { createAccreditationRecord, requiresAccreditationRecords } from '@/lib/cabSetupForm'
import type { CabSetupStepProps } from '@/components/auth/cab/setup/types'

export function CabAccreditationStatusStep({ form, onPatchSetup }: CabSetupStepProps) {
  const { t } = useTranslation()
  const { accreditationStatuses, accreditationRecordCount, accreditationRecords } = form.cabSetup

  const toggleStatus = (value: string) => {
    const next = accreditationStatuses.includes(value)
      ? accreditationStatuses.filter((status) => status !== value)
      : [...accreditationStatuses, value]

    onPatchSetup({ accreditationStatuses: next })
  }

  const showRecordCount = requiresAccreditationRecords(form.cabSetup)

  /** Keep the record list in step with the requested count so screen 4 opens ready. */
  const setRecordCount = (rawValue: string) => {
    const parsed = Number(rawValue.replace(/\D/g, ''))
    const count = Math.min(Math.max(Number.isNaN(parsed) ? 1 : parsed, 1), 20)

    const records = [...accreditationRecords]
    while (records.length < count) records.push(createAccreditationRecord())
    records.length = count

    onPatchSetup({ accreditationRecordCount: count, accreditationRecords: records })
  }

  return (
    <div className="w-full space-y-6">

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {ACCREDITATION_STATUS_OPTIONS.map((option) => (
          <SetupOptionCard
            key={option.value}
            title={t(option.labelKey)}
            description={t(`cab.setup.accreditationStatus.descriptions.${option.value}`)}
            selected={accreditationStatuses.includes(option.value)}
            onSelect={() => toggleStatus(option.value)}
          />
        ))}
      </div>

      {showRecordCount && (
        <div className="space-y-2">
          <TextField
            id="cab-setup-record-count"
            label={t('cab.setup.accreditationStatus.recordCount')}
            required
            type="text"
            lang="en"
            dir="ltr"
            inputMode="numeric"
            value={String(accreditationRecordCount)}
            onChange={(event) => setRecordCount(event.target.value)}
          />
          <p className="text-[12px] text-[var(--cab-muted)]">
            {t('cab.setup.accreditationStatus.recordCountHint')}
          </p>
        </div>
      )}

      <SetupSection title={t('cab.setup.accreditationStatus.whySeparateTitle')}>
        <p className="text-[12px] text-[var(--cab-muted)]">
          {t('cab.setup.accreditationStatus.whySeparateBody')}
        </p>
      </SetupSection>

      {accreditationStatuses.length > 1 && (
        <SetupNote tone="warning">{t('cab.setup.accreditationStatus.multiStatusNote')}</SetupNote>
      )}
    </div>
  )
}
