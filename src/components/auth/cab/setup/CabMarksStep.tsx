import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FormLabel, TextField } from '@/components/ui'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { OnboardingLogoUpload } from '@/components/auth/OnboardingLogoUpload'
import {
  SetupMarkUpload,
  SetupSection,
  SetupToggleRow,
} from '@/components/auth/cab/setup/CabSetupPrimitives'
import { ALLOWED_DOCUMENT_USE_OPTIONS } from '@/lib/api/cabSetupApi'
import type { CabSetupStepProps } from '@/components/auth/cab/setup/types'

export function CabMarksStep({ form, onPatch, onPatchSetup }: CabSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.cabSetup

  const documentUseOptions = useMemo(
    () =>
      ALLOWED_DOCUMENT_USE_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t]
  )

  /** Marks inherit the record they are governed by, so surface that link as a caption. */
  const accreditationCaption = useMemo(() => {
    const record = setup.accreditationRecords.find((item) => item.body)
    if (!record) return t('cab.setup.marks.accreditationMarkUnlinked')
    return t('cab.setup.marks.linkedTo', {
      target: record.number.trim() ? `${record.body} / ${record.number}` : record.body,
    })
  }, [setup.accreditationRecords, t])

  return (
    <div className="w-full space-y-6">

      <SetupSection title={t('cab.setup.marks.cabLogo')}>
        <p className="mb-3 text-[12px] text-[var(--cab-muted)]">{t('cab.setup.marks.cabLogoCaption')}</p>
        <OnboardingLogoUpload
          logoUrl={form.logoUrl}
          onLogoUrlChange={(logoUrl) => onPatch({ logoUrl })}
        />
      </SetupSection>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <SetupMarkUpload
          id="cab-setup-accreditation-mark"
          label={t('cab.setup.marks.accreditationMark')}
          caption={accreditationCaption}
          imageUrl={setup.accreditationMarkUrl}
          onImageUrlChange={(accreditationMarkUrl) => onPatchSetup({ accreditationMarkUrl })}
          uploadLabel={t('cab.setup.marks.upload')}
          removeLabel={t('common.delete')}
        />
        <SetupMarkUpload
          id="cab-setup-scheme-mark"
          label={t('cab.setup.marks.schemeMark')}
          caption={t('cab.setup.marks.schemeMarkCaption')}
          imageUrl={setup.schemeMarkUrl}
          onImageUrlChange={(schemeMarkUrl) => onPatchSetup({ schemeMarkUrl })}
          uploadLabel={t('cab.setup.marks.upload')}
          removeLabel={t('common.delete')}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <TextField
          id="cab-setup-mark-reference"
          label={t('cab.setup.marks.markReference')}
          type="text"
          value={setup.markReference}
          placeholder={t('cab.setup.marks.markReferencePlaceholder')}
          onChange={(event) => onPatchSetup({ markReference: event.target.value })}
        />
        <TextField
          id="cab-setup-mark-valid-from"
          label={t('cab.setup.marks.validFrom')}
          type="date"
          lang="en"
          dir="ltr"
          value={setup.markValidFrom}
          onChange={(event) => onPatchSetup({ markValidFrom: event.target.value })}
        />
        <TextField
          id="cab-setup-mark-valid-until"
          label={t('cab.setup.marks.validUntil')}
          type="date"
          lang="en"
          dir="ltr"
          value={setup.markValidUntil}
          onChange={(event) => onPatchSetup({ markValidUntil: event.target.value })}
        />
      </div>

      <div className="space-y-2">
        <FormLabel required>{t('cab.setup.marks.allowedUse')}</FormLabel>
        <MultiSelect
          tags={setup.allowedDocumentUse}
          options={documentUseOptions}
          onChange={(allowedDocumentUse) => onPatchSetup({ allowedDocumentUse })}
          searchable
          placeholder={t('cab.setup.marks.allowedUsePlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      <SetupSection title={t('cab.setup.marks.usageRules')}>
        <SetupToggleRow
          label={t('cab.setup.marks.applyOnlyToAccredited')}
          checked={setup.applyMarkOnlyToAccredited}
          onChange={(applyMarkOnlyToAccredited) => onPatchSetup({ applyMarkOnlyToAccredited })}
        />
        <SetupToggleRow
          label={t('cab.setup.marks.blockAfterExpiry')}
          checked={setup.blockMarkAfterExpiry}
          onChange={(blockMarkAfterExpiry) => onPatchSetup({ blockMarkAfterExpiry })}
        />
        <SetupToggleRow
          label={t('cab.setup.marks.keepAuditTrail')}
          checked={setup.keepMarkAuditTrail}
          onChange={(keepMarkAuditTrail) => onPatchSetup({ keepMarkAuditTrail })}
        />
      </SetupSection>
    </div>
  )
}
