import { useTranslation } from 'react-i18next'
import { CalloutCard } from '@/components/dashboard/cab/ReviewPrimitives'
import { AppIcon, InfoIcon } from '@/components/icons'
import { RadioGroup } from '@/components/ui/RadioGroup'
import type { DuplicateMode, ImportMode, ImportPreview } from '@/lib/dataMigrationTypes'

interface ImportOptionsStepProps {
  preview: ImportPreview
  mode: ImportMode
  duplicates: DuplicateMode
  onModeChange: (mode: ImportMode) => void
  onDuplicatesChange: (duplicates: DuplicateMode) => void
  /** How many records the current choice imports. */
  recordCount: number
  error: string
}

export function ImportOptionsStep({
  preview,
  mode,
  duplicates,
  onModeChange,
  onDuplicatesChange,
  recordCount,
  error,
}: ImportOptionsStepProps) {
  const { t } = useTranslation()
  const { totals } = preview

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h3 className="text-[16px] font-bold text-neutral-900">{t('cab.dataMigration.wizard.options.title')}</h3>

      <fieldset className="space-y-2">
        <RadioGroup
          name="import-mode"
          value={mode}
          onChange={(value) => onModeChange(value as ImportMode)}
          options={[
            { value: 'ready_only', label: t('cab.dataMigration.wizard.options.readyOnly') },
            { value: 'include_partial', label: t('cab.dataMigration.wizard.options.includePartial') },
          ]}
        />
        <p className="text-[13px] text-neutral-600">
          {mode === 'ready_only'
            ? t('cab.dataMigration.wizard.options.readyOnlyHint', { count: totals.ready })
            : t('cab.dataMigration.wizard.options.includePartialHint', { count: totals.ready + totals.partial })}
        </p>
      </fieldset>

      {totals.duplicates > 0 && (
        <fieldset className="space-y-2">
          <legend className="text-[14px] font-semibold text-neutral-900">
            {t('cab.dataMigration.wizard.options.duplicates', { count: totals.duplicates })}
          </legend>
          <RadioGroup
            name="import-duplicates"
            value={duplicates}
            onChange={(value) => onDuplicatesChange(value as DuplicateMode)}
            options={[
              { value: 'skip', label: t('cab.dataMigration.wizard.options.skip') },
              { value: 'update', label: t('cab.dataMigration.wizard.options.update') },
            ]}
          />
          <p className="text-[13px] text-neutral-600">
            {duplicates === 'skip'
              ? t('cab.dataMigration.wizard.options.skipHint')
              : t('cab.dataMigration.wizard.options.updateHint')}
          </p>
        </fieldset>
      )}

      <div className="rounded-[var(--radius-md)] border border-[#ececec] bg-[#fafbfd] p-4">
        <p className="text-[15px] font-bold text-neutral-900">
          {t('cab.dataMigration.wizard.options.summary', { count: recordCount })}
        </p>
        {recordCount === 0 && <p className="mt-1 text-[13px] text-[#a05a00]">{t('cab.dataMigration.wizard.options.nothing')}</p>}
        {totals.invalid > 0 && (
          <p className="mt-1 text-[13px] text-neutral-600">
            {t('cab.dataMigration.wizard.options.invalidNote', { count: totals.invalid })}
          </p>
        )}
      </div>

      {error && (
        <div role="alert">
          <CalloutCard tone="red" icon={<AppIcon icon={InfoIcon} size={20} />} title={error}>
            {t('cab.dataMigration.wizard.options.errorHint')}
          </CalloutCard>
        </div>
      )}
    </div>
  )
}