import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormLabel, TextField } from '@/components/ui'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { fieldHeightClassName, fieldInputClassName } from '@/components/ui/fieldStyles'
import { getCountryOptions, type CountryCode } from '@/lib/countries'
import { fetchGovernorateOptions, type GovernorateOption } from '@/lib/governorates'
import { getTimezoneForCountry, OPERATING_LANGUAGE_OPTIONS } from '@/lib/api/auditeeOnboardingApi'
import type { AuditeeOnboardingForm } from '@/lib/auditeeOnboardingForm'
import { cn } from '@/lib/utils'

interface AuditeeLocationStepProps {
  form: AuditeeOnboardingForm
  onPatch: (f: Partial<AuditeeOnboardingForm>) => void
}

export function AuditeeLocationStep({ form, onPatch }: AuditeeLocationStepProps) {
  const { t, i18n } = useTranslation()
  const countries = useMemo(() => getCountryOptions(i18n.language), [i18n.language])
  const [governorates, setGovernorates] = useState<GovernorateOption[]>([])

  useEffect(() => {
    if (!form.country) {
      setGovernorates([])
      return
    }
    let cancelled = false
    fetchGovernorateOptions(form.country).then((options) => {
      if (!cancelled) setGovernorates(options)
    })
    return () => {
      cancelled = true
    }
  }, [form.country])

  const timezoneLabel = form.country
    ? `${getTimezoneForCountry(form.country)} (${t('auditee.onboarding.location.autoDetected')})`
    : ''

  return (
    <div className="w-full space-y-6">
      <div>
        <p className="mb-2 text-body-2-medium text-primary">
          {t('auditee.onboarding.location.hint', { name: form.legalEntityName || form.tradingName })}
        </p>
        <h1 className="text-h1 text-neutral-900">{t('auditee.onboarding.location.title')}</h1>
        <p className="mt-2 text-body-2 text-neutral-500">{t('auditee.onboarding.location.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <SearchableSelect
          id="auditee-onboarding-country"
          label={t('auditee.onboarding.location.country')}
          required
          value={form.country}
          onChange={(value) => onPatch({ country: value as CountryCode, city: '' })}
          options={countries.map((country) => ({ value: country.code, label: `${country.flag} ${country.name}` }))}
          placeholder={t('register.countryPlaceholder')}
          searchPlaceholder={t('common.search')}
        />

        <SearchableSelect
          id="auditee-onboarding-city"
          label={t('auditee.onboarding.location.city')}
          required
          value={form.city}
          onChange={(value) => onPatch({ city: value })}
          options={governorates.map((g) => ({ value: g.id, label: g.name }))}
          placeholder={form.country ? t('register.governoratePlaceholder') : t('register.selectCountryFirst')}
          searchPlaceholder={t('common.search')}
        />
      </div>

      <TextField
        id="auditee-onboarding-address"
        label={t('auditee.onboarding.location.address')}
        required
        type="text"
        value={form.address}
        placeholder={t('auditee.onboarding.location.addressPlaceholder')}
        onChange={(e) => onPatch({ address: e.target.value })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <FormLabel>{t('auditee.onboarding.location.timeZone')}</FormLabel>
          <div className={cn(fieldInputClassName, fieldHeightClassName, 'flex items-center bg-neutral-50 text-neutral-500')}>
            {timezoneLabel || t('auditee.onboarding.location.timeZonePlaceholder')}
          </div>
        </div>

        <div className="space-y-2">
          <FormLabel>{t('auditee.onboarding.location.languages')}</FormLabel>
          <MultiSelect
            tags={form.languages}
            options={OPERATING_LANGUAGE_OPTIONS}
            onChange={(tags) => onPatch({ languages: tags })}
            placeholder={t('auditee.onboarding.location.languagesPlaceholder')}
            searchable
            searchPlaceholder={t('common.search')}
          />
        </div>
      </div>
    </div>
  )
}
