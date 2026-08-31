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
import { AB_COOPERATION_BODY_OPTIONS, AB_PERMITTED_USE_OPTIONS } from '@/lib/api/abSetupApi'
import type { AbSetupStepProps } from '@/components/auth/ab/setup/types'

export function AbSymbolsStep({ form, onPatch, onPatchSetup }: AbSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.abSetup

  const permittedUseOptions = useMemo(
    () => AB_PERMITTED_USE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  /** The recognition mark is governed by an active arrangement — surface which. */
  const recognitionCaption = useMemo(() => {
    const record = setup.recognitionRecords.find((item) => item.cooperationBody)
    if (!record) return t('ab.setup.symbols.recognitionMarkUnlinked')
    const body = AB_COOPERATION_BODY_OPTIONS.find(
      (option) => option.value === record.cooperationBody
    )
    return t('ab.setup.symbols.linkedTo', { target: body?.value ?? record.cooperationBody })
  }, [setup.recognitionRecords, t])

  return (
    <div className="w-full space-y-6">
      <SetupSection title={t('ab.setup.symbols.abLogo')}>
        <p className="mb-3 text-[12px] text-[var(--cab-muted)]">{t('ab.setup.symbols.abLogoCaption')}</p>
        <OnboardingLogoUpload logoUrl={form.logoUrl} onLogoUrlChange={(logoUrl) => onPatch({ logoUrl })} />
      </SetupSection>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <SetupMarkUpload
          id="ab-setup-accreditation-symbol"
          label={t('ab.setup.symbols.accreditationSymbol')}
          caption={t('ab.setup.symbols.accreditationSymbolCaption')}
          imageUrl={setup.accreditationSymbolUrl}
          onImageUrlChange={(accreditationSymbolUrl) => onPatchSetup({ accreditationSymbolUrl })}
          uploadLabel={t('ab.setup.symbols.upload')}
          removeLabel={t('common.delete')}
        />
        <SetupMarkUpload
          id="ab-setup-recognition-mark"
          label={t('ab.setup.symbols.recognitionMark')}
          caption={recognitionCaption}
          imageUrl={setup.recognitionMarkUrl}
          onImageUrlChange={(recognitionMarkUrl) => onPatchSetup({ recognitionMarkUrl })}
          uploadLabel={t('ab.setup.symbols.upload')}
          removeLabel={t('common.delete')}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        <TextField
          id="ab-setup-symbol-reference"
          label={t('ab.setup.symbols.symbolReference')}
          type="text"
          value={setup.symbolReference}
          placeholder={t('ab.setup.symbols.symbolReferencePlaceholder')}
          onChange={(event) => onPatchSetup({ symbolReference: event.target.value })}
        />
        <TextField
          id="ab-setup-symbol-from"
          label={t('ab.setup.symbols.validFrom')}
          type="date"
          lang="en"
          dir="ltr"
          value={setup.symbolValidFrom}
          onChange={(event) => onPatchSetup({ symbolValidFrom: event.target.value })}
        />
        <TextField
          id="ab-setup-symbol-until"
          label={t('ab.setup.symbols.validUntil')}
          type="date"
          lang="en"
          dir="ltr"
          value={setup.symbolValidUntil}
          onChange={(event) => onPatchSetup({ symbolValidUntil: event.target.value })}
        />
      </div>

      <div className="space-y-2">
        <FormLabel required>{t('ab.setup.symbols.permittedUse')}</FormLabel>
        <MultiSelect
          tags={setup.permittedUse}
          options={permittedUseOptions}
          onChange={(permittedUse) => onPatchSetup({ permittedUse })}
          searchable
          placeholder={t('ab.setup.symbols.permittedUsePlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      <SetupSection title={t('ab.setup.symbols.usageRules')}>
        <SetupToggleRow
          label={t('ab.setup.symbols.issueOnlyForGranted')}
          checked={setup.issueOnlyForGrantedScopes}
          onChange={(issueOnlyForGrantedScopes) => onPatchSetup({ issueOnlyForGrantedScopes })}
        />
        <SetupToggleRow
          label={t('ab.setup.symbols.blockAfterSuspension')}
          checked={setup.blockAfterSuspension}
          onChange={(blockAfterSuspension) => onPatchSetup({ blockAfterSuspension })}
        />
        <SetupToggleRow
          label={t('ab.setup.symbols.keepAuditTrail')}
          checked={setup.keepSymbolAuditTrail}
          onChange={(keepSymbolAuditTrail) => onPatchSetup({ keepSymbolAuditTrail })}
        />
      </SetupSection>
    </div>
  )
}
