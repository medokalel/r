import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormLabel, TextField } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { DatePicker } from '@/components/ui/DatePicker'
import {
  SetupFileInput,
  SetupNote,
  SetupSection,
  SetupToggleRow,
} from '@/components/auth/cab/setup/CabSetupPrimitives'
import {
  ACCREDITATION_BODY_OPTIONS,
  ACCREDITATION_RECORD_STATUS_OPTIONS,
  getAccreditationStandardOptions,
} from '@/lib/api/cabSetupApi'
import {
  createAccreditationRecord,
  isApplicantRecord,
  type CabAccreditationRecord,
} from '@/lib/cabSetupForm'
import { cn } from '@/lib/utils'
import type { CabSetupStepProps } from '@/components/auth/cab/setup/types'

/** ISO `yyyy-mm-dd` <-> Date, so the draft stays JSON-safe. */
function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function fromIsoDate(value: string): Date | undefined {
  if (!value) return undefined
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function RecordDateField({
  id,
  label,
  required,
  value,
  onChange,
}: {
  id: string
  label: string
  required?: boolean
  value: string
  onChange: (isoDate: string) => void
}) {
  return (
    <div className="space-y-2">
      <FormLabel htmlFor={id} required={required}>
        {label}
      </FormLabel>
      <DatePicker
        value={fromIsoDate(value)}
        onChange={(date) => onChange(toIsoDate(date))}
      />
    </div>
  )
}

export function CabAccreditationRecordsStep({ form, onPatchSetup }: CabSetupStepProps) {
  const { t } = useTranslation()
  const records = form.cabSetup.accreditationRecords
  const [activeIndex, setActiveIndex] = useState(0)

  const standardOptions = useMemo(
    () => getAccreditationStandardOptions(form.cabSetup.activities),
    [form.cabSetup.activities]
  )
  const statusOptions = useMemo(
    () =>
      ACCREDITATION_RECORD_STATUS_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t]
  )

  // The status screen seeds the list; guard against an empty array anyway.
  const activeRecord = records[Math.min(activeIndex, Math.max(records.length - 1, 0))]

  const updateRecord = (id: string, fields: Partial<CabAccreditationRecord>) => {
    onPatchSetup({
      accreditationRecords: records.map((record) =>
        record.id === id ? { ...record, ...fields } : record
      ),
    })
  }

  const addRecord = () => {
    onPatchSetup({
      accreditationRecords: [...records, createAccreditationRecord()],
      accreditationRecordCount: records.length + 1,
    })
    setActiveIndex(records.length)
  }

  const removeRecord = (id: string) => {
    const next = records.filter((record) => record.id !== id)
    onPatchSetup({
      accreditationRecords: next,
      accreditationRecordCount: Math.max(next.length, 1),
    })
    setActiveIndex(0)
  }

  if (!activeRecord) {
    return (
      <div className="w-full space-y-6">
        <button
          type="button"
          onClick={addRecord}
          className="text-[12px] font-bold text-[var(--cab-primary)] hover:underline"
        >
          {t('cab.setup.accreditationRecords.addAnother')}
        </button>
      </div>
    )
  }

  const isApplicant = isApplicantRecord(activeRecord)
  const datesInvalid =
    Boolean(activeRecord.issueDate && activeRecord.expiryDate) &&
    activeRecord.expiryDate <= activeRecord.issueDate

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {records.map((record, index) => (
          <button
            key={record.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={cn(
              'rounded-full border px-4 py-2 text-body-3-medium transition-colors',
              index === activeIndex
                ? 'border-primary bg-primary-subtle text-primary'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
            )}
          >
            {t('cab.setup.accreditationRecords.recordTab', { index: index + 1 })}
          </button>
        ))}
        <button
          type="button"
          onClick={addRecord}
          className="text-[12px] font-bold text-[var(--cab-primary)] hover:underline"
        >
          {t('cab.setup.accreditationRecords.addAnother')}
        </button>
      </div>

      <SetupSection
        title={t('cab.setup.accreditationRecords.recordTab', { index: activeIndex + 1 })}
        action={
          records.length > 1 ? (
            <button
              type="button"
              onClick={() => removeRecord(activeRecord.id)}
              className="rounded-[var(--radius-sm)] px-2 py-1 text-body-3-medium text-error-500 hover:bg-[#fef2f2]"
            >
              {t('common.delete')}
            </button>
          ) : null
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <SearchableSelect
              id={`cab-setup-acc-body-${activeRecord.id}`}
              label={t('cab.setup.accreditationRecords.body')}
              required
              value={activeRecord.body}
              onChange={(body) => updateRecord(activeRecord.id, { body })}
              options={ACCREDITATION_BODY_OPTIONS}
              placeholder={t('cab.setup.accreditationRecords.bodyPlaceholder')}
              searchPlaceholder={t('common.search')}
            />
            <SearchableSelect
              id={`cab-setup-acc-standard-${activeRecord.id}`}
              label={t('cab.setup.accreditationRecords.standard')}
              required
              value={activeRecord.standard}
              onChange={(standard) => updateRecord(activeRecord.id, { standard })}
              options={standardOptions}
              placeholder={t('cab.setup.accreditationRecords.standardPlaceholder')}
              searchPlaceholder={t('common.search')}
            />
          </div>

          {activeRecord.body === 'OTHER' && (
            <TextField
              id={`cab-setup-acc-body-other-${activeRecord.id}`}
              label={t('cab.setup.accreditationRecords.bodyOther')}
              required
              type="text"
              value={activeRecord.bodyOther}
              placeholder={t('cab.setup.accreditationRecords.bodyOtherPlaceholder')}
              onChange={(event) => updateRecord(activeRecord.id, { bodyOther: event.target.value })}
            />
          )}

          <SearchableSelect
            id={`cab-setup-acc-status-${activeRecord.id}`}
            label={t('cab.setup.accreditationRecords.status')}
            required
            value={activeRecord.status}
            onChange={(status) => updateRecord(activeRecord.id, { status })}
            options={statusOptions}
            placeholder={t('cab.setup.accreditationRecords.statusPlaceholder')}
            searchPlaceholder={t('common.search')}
          />

          {isApplicant ? (
            <TextField
              id={`cab-setup-acc-application-${activeRecord.id}`}
              label={t('cab.setup.accreditationRecords.applicationReference')}
              required
              type="text"
              value={activeRecord.applicationReference}
              placeholder={t('cab.setup.accreditationRecords.applicationReferencePlaceholder')}
              onChange={(event) =>
                updateRecord(activeRecord.id, { applicationReference: event.target.value })
              }
            />
          ) : (
            <>
              <TextField
                id={`cab-setup-acc-number-${activeRecord.id}`}
                label={t('cab.setup.accreditationRecords.number')}
                required
                type="text"
                value={activeRecord.number}
                placeholder={t('cab.setup.accreditationRecords.numberPlaceholder')}
                onChange={(event) => updateRecord(activeRecord.id, { number: event.target.value })}
              />

              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <RecordDateField
                  id={`cab-setup-acc-issue-${activeRecord.id}`}
                  label={t('cab.setup.accreditationRecords.issueDate')}
                  required
                  value={activeRecord.issueDate}
                  onChange={(issueDate) => updateRecord(activeRecord.id, { issueDate })}
                />
                <RecordDateField
                  id={`cab-setup-acc-expiry-${activeRecord.id}`}
                  label={t('cab.setup.accreditationRecords.expiryDate')}
                  required
                  value={activeRecord.expiryDate}
                  onChange={(expiryDate) => updateRecord(activeRecord.id, { expiryDate })}
                />
              </div>

              {datesInvalid && (
                <p className="text-small-light text-error-500">
                  {t('cab.setup.accreditationRecords.expiryAfterIssue')}
                </p>
              )}
            </>
          )}

          <div className="space-y-2">
            <FormLabel>{t('cab.setup.accreditationRecords.certificateFile')}</FormLabel>
            <SetupFileInput
              id={`cab-setup-acc-file-${activeRecord.id}`}
              fileName={activeRecord.fileName}
              onFileNameChange={(fileName) => updateRecord(activeRecord.id, { fileName })}
              selectLabel={t('cab.setup.accreditationRecords.uploadPdf')}
              changeLabel={t('companyProfile.profileHeader.changeFile')}
              removeLabel={t('common.delete')}
            />
          </div>

          <div className="border-t border-neutral-200 pt-2">
            <SetupToggleRow
              label={t('cab.setup.accreditationRecords.coveredByMla')}
              checked={activeRecord.coveredByMla}
              onChange={(coveredByMla) => updateRecord(activeRecord.id, { coveredByMla })}
            />
            <SetupToggleRow
              label={t('cab.setup.accreditationRecords.expiryReminders')}
              checked={activeRecord.expiryReminders}
              onChange={(expiryReminders) => updateRecord(activeRecord.id, { expiryReminders })}
            />
          </div>
        </div>
      </SetupSection>

      <SetupNote>{t('cab.setup.accreditationRecords.applicantNote')}</SetupNote>
    </div>
  )
}
