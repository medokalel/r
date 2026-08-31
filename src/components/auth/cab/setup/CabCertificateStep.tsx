import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FormLabel, TextField } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import {
  SetupNote,
  SetupSection,
  SetupToggleRow,
} from '@/components/auth/cab/setup/CabSetupPrimitives'
import {
  CERTIFICATE_LANGUAGE_OPTIONS,
  CERTIFICATE_NUMBER_TOKENS,
  CERTIFICATE_TEMPLATE_OPTIONS,
  CERTIFICATE_VALIDITY_OPTIONS,
  getSchemeOptions,
} from '@/lib/api/cabSetupApi'
import { buildCertificateNumberExample } from '@/lib/cabSetupForm'
import type { CabSetupStepProps } from '@/components/auth/cab/setup/types'

export function CabCertificateStep({ form, onPatchSetup }: CabSetupStepProps) {
  const { t } = useTranslation()
  const setup = form.cabSetup

  const validityOptions = useMemo(
    () => CERTIFICATE_VALIDITY_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const languageOptions = useMemo(
    () => CERTIFICATE_LANGUAGE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )
  const templateOptions = useMemo(
    () => CERTIFICATE_TEMPLATE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t]
  )

  /** Preview the number using the CAB's first selected scheme for realism. */
  const exampleNumber = useMemo(() => {
    const firstScheme = getSchemeOptions(setup.activities).find((scheme) =>
      setup.schemes.includes(scheme.value)
    )
    const schemeToken = firstScheme?.label.split('—')[1]?.trim() ?? firstScheme?.label ?? 'QMS'
    return buildCertificateNumberExample(
      setup.certificateNumberFormat,
      form.tradingName || form.legalEntityName,
      schemeToken
    )
  }, [
    form.legalEntityName,
    form.tradingName,
    setup.activities,
    setup.certificateNumberFormat,
    setup.schemes,
  ])

  const missingSeq = !setup.certificateNumberFormat.includes('{SEQ}')

  return (
    <div className="w-full space-y-6">

      <div className="space-y-2">
        <TextField
          id="cab-setup-cert-format"
          label={t('cab.setup.certificate.numberFormat')}
          required
          type="text"
          lang="en"
          dir="ltr"
          value={setup.certificateNumberFormat}
          placeholder="{CAB}-{SCHEME}-{YEAR}-{SEQ}"
          onChange={(event) => onPatchSetup({ certificateNumberFormat: event.target.value })}
          error={missingSeq ? t('cab.setup.certificate.seqRequired') : undefined}
        />

        <p className="text-[12px] text-[var(--cab-muted)]" lang="en" dir="ltr">
          {t('cab.setup.certificate.example')}: <span className="text-neutral-900">{exampleNumber}</span>
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {CERTIFICATE_NUMBER_TOKENS.map((token) => (
            <button
              key={token}
              type="button"
              onClick={() =>
                onPatchSetup({ certificateNumberFormat: `${setup.certificateNumberFormat}${token}` })
              }
              className="rounded-full border border-neutral-200 bg-white px-3 py-1 font-mono text-[12px] text-primary hover:border-primary hover:bg-primary-subtle"
              lang="en"
              dir="ltr"
            >
              {token}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <SearchableSelect
          id="cab-setup-cert-validity"
          label={t('cab.setup.certificate.validity')}
          required
          value={setup.certificateValidity}
          onChange={(certificateValidity) => onPatchSetup({ certificateValidity })}
          options={validityOptions}
          placeholder={t('cab.setup.certificate.validityPlaceholder')}
          searchPlaceholder={t('common.search')}
        />
        <SearchableSelect
          id="cab-setup-cert-language"
          label={t('cab.setup.certificate.language')}
          required
          value={setup.certificateLanguage}
          onChange={(certificateLanguage) => onPatchSetup({ certificateLanguage })}
          options={languageOptions}
          placeholder={t('cab.setup.certificate.languagePlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div className="space-y-2">
          <FormLabel htmlFor="cab-setup-cert-signatory">
            {t('cab.setup.certificate.signatory')}
          </FormLabel>
          <TextField
            id="cab-setup-cert-signatory"
            type="text"
            value={setup.authorisedSignatory}
            placeholder={t('cab.setup.certificate.signatoryPlaceholder')}
            onChange={(event) => onPatchSetup({ authorisedSignatory: event.target.value })}
          />
        </div>
        <SearchableSelect
          id="cab-setup-cert-template"
          label={t('cab.setup.certificate.template')}
          required
          value={setup.certificateTemplate}
          onChange={(certificateTemplate) => onPatchSetup({ certificateTemplate })}
          options={templateOptions}
          placeholder={t('cab.setup.certificate.templatePlaceholder')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      <SetupSection title={t('cab.setup.certificate.displayRules')}>
        <SetupToggleRow
          label={t('cab.setup.certificate.showCabLogo')}
          checked={setup.showCabLogo}
          onChange={(showCabLogo) => onPatchSetup({ showCabLogo })}
        />
        <SetupToggleRow
          label={t('cab.setup.certificate.showAccreditationMark')}
          checked={setup.showAccreditationMark}
          onChange={(showAccreditationMark) => onPatchSetup({ showAccreditationMark })}
        />
        <SetupToggleRow
          label={t('cab.setup.certificate.showQrCode')}
          checked={setup.showQrCode}
          onChange={(showQrCode) => onPatchSetup({ showQrCode })}
        />
      </SetupSection>

      <SetupNote>{t('cab.setup.certificate.validationNote')}</SetupNote>
    </div>
  )
}
