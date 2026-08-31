import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox, FormLabel, TextField } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import {
  SetupChipGroup,
  SetupRecordCard,
  SetupSection,
} from '@/components/auth/cab/setup/CabSetupPrimitives'
import {
  SERVICE_MARKET_OPTIONS,
  SERVICE_OPTIONS,
  getSchemeOptions,
} from '@/lib/api/cabSetupApi'
import { createCustomScheme, type CabCustomScheme } from '@/lib/cabSetupForm'
import type { CabSetupStepProps } from '@/components/auth/cab/setup/types'

export function CabSchemesServicesStep({ form, onPatchSetup }: CabSetupStepProps) {
  const { t } = useTranslation()
  const { schemes, services, customSchemes, primaryServiceMarket, schemeOwner } = form.cabSetup

  const schemeOptions = useMemo(
    () => getSchemeOptions(form.cabSetup.activities),
    [form.cabSetup.activities]
  )
  const serviceOptions = useMemo(
    () => SERVICE_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    [t]
  )
  const marketOptions = useMemo(
    () => SERVICE_MARKET_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    [t]
  )

  const toggleScheme = (value: string) => {
    onPatchSetup({
      schemes: schemes.includes(value)
        ? schemes.filter((scheme) => scheme !== value)
        : [...schemes, value],
    })
  }

  const toggleService = (value: string) => {
    onPatchSetup({
      services: services.includes(value)
        ? services.filter((service) => service !== value)
        : [...services, value],
    })
  }

  const updateCustomScheme = (id: string, fields: Partial<CabCustomScheme>) => {
    onPatchSetup({
      customSchemes: customSchemes.map((scheme) =>
        scheme.id === id ? { ...scheme, ...fields } : scheme
      ),
    })
  }

  return (
    <div className="w-full space-y-6">

      <SetupSection title={t('cab.setup.schemes.schemesLabel')}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {schemeOptions.map((scheme) => (
            <label
              key={scheme.value}
              className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] border border-neutral-200 px-3 py-2.5 hover:border-neutral-300"
            >
              <Checkbox
                checked={schemes.includes(scheme.value)}
                onChange={() => toggleScheme(scheme.value)}
                aria-label={scheme.label}
              />
              <span className="text-[13px] font-bold text-[var(--cab-ink)]">{scheme.label}</span>
            </label>
          ))}
        </div>
      </SetupSection>

      <SetupSection
        title={t('cab.setup.schemes.customSchemesLabel')}
        action={
          <button
            type="button"
            onClick={() => onPatchSetup({ customSchemes: [...customSchemes, createCustomScheme()] })}
            className="text-[12px] font-bold text-[var(--cab-primary)] hover:underline"
          >
            {t('cab.setup.schemes.addCustomScheme')}
          </button>
        }
      >
        {customSchemes.length === 0 ? (
          <p className="text-[12px] text-[var(--cab-muted)]">{t('cab.setup.schemes.customSchemesEmpty')}</p>
        ) : (
          <div className="space-y-4">
            {customSchemes.map((scheme, index) => (
              <SetupRecordCard
                key={scheme.id}
                title={t('cab.setup.schemes.customSchemeTitle', { index: index + 1 })}
                removeLabel={t('common.delete')}
                onRemove={() =>
                  onPatchSetup({
                    customSchemes: customSchemes.filter((item) => item.id !== scheme.id),
                  })
                }
              >
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                  <TextField
                    id={`cab-setup-custom-scheme-name-${scheme.id}`}
                    label={t('cab.setup.schemes.customSchemeName')}
                    required
                    type="text"
                    value={scheme.name}
                    placeholder={t('cab.setup.schemes.customSchemeNamePlaceholder')}
                    onChange={(event) => updateCustomScheme(scheme.id, { name: event.target.value })}
                  />
                  <TextField
                    id={`cab-setup-custom-scheme-owner-${scheme.id}`}
                    label={t('cab.setup.schemes.customSchemeOwner')}
                    type="text"
                    value={scheme.owner}
                    placeholder={t('cab.setup.schemes.customSchemeOwnerPlaceholder')}
                    onChange={(event) => updateCustomScheme(scheme.id, { owner: event.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                  <TextField
                    id={`cab-setup-custom-scheme-doc-${scheme.id}`}
                    label={t('cab.setup.schemes.customSchemeDocument')}
                    type="text"
                    value={scheme.normativeDocument}
                    placeholder={t('cab.setup.schemes.customSchemeDocumentPlaceholder')}
                    onChange={(event) =>
                      updateCustomScheme(scheme.id, { normativeDocument: event.target.value })
                    }
                  />
                  <TextField
                    id={`cab-setup-custom-scheme-version-${scheme.id}`}
                    label={t('cab.setup.schemes.customSchemeVersion')}
                    type="text"
                    value={scheme.version}
                    placeholder={t('cab.setup.schemes.customSchemeVersionPlaceholder')}
                    onChange={(event) => updateCustomScheme(scheme.id, { version: event.target.value })}
                  />
                </div>
              </SetupRecordCard>
            ))}
          </div>
        )}
      </SetupSection>

      <SetupSection title={t('cab.setup.schemes.servicesLabel')}>
        <SetupChipGroup options={serviceOptions} selected={services} onToggle={toggleService} />
      </SetupSection>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <SearchableSelect
          id="cab-setup-service-market"
          label={t('cab.setup.schemes.primaryMarket')}
          value={primaryServiceMarket}
          onChange={(value) => onPatchSetup({ primaryServiceMarket: value })}
          options={marketOptions}
          placeholder={t('cab.setup.schemes.primaryMarketPlaceholder')}
          searchPlaceholder={t('common.search')}
        />

        <div className="space-y-2">
          <FormLabel htmlFor="cab-setup-scheme-owner">
            {t('cab.setup.schemes.schemeOwner')}
          </FormLabel>
          <TextField
            id="cab-setup-scheme-owner"
            type="text"
            value={schemeOwner}
            placeholder={t('cab.setup.schemes.schemeOwnerPlaceholder')}
            onChange={(event) => onPatchSetup({ schemeOwner: event.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
