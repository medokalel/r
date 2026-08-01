import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectField } from '@/components/ui'
import { FormLabel } from '@/components/ui/FormField'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { getCountryOptions, type CountryCode } from '@/lib/countries'
import { CAB_TYPE_OPTIONS, MOCK_ACCREDITATION_BODIES } from '@/lib/api/cabRegisterApi'
import type { CabDetailsForm } from '@/lib/cabDetailsForm'

interface CabAccreditationScopesStepProps {
  form: CabDetailsForm
  onPatch: (f: Partial<CabDetailsForm>) => void
}

/** Continuation screen of CAB Details (still step 1): scopes + per-scope accreditation details. */
export function CabAccreditationScopesStep({ form, onPatch }: CabAccreditationScopesStepProps) {
  const { t, i18n } = useTranslation()
  const countries = useMemo(() => getCountryOptions(i18n.language), [i18n.language])
  const scopeOptions = useMemo(
    () => CAB_TYPE_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    [t]
  )
  const countryOptions = useMemo(
    () => countries.map((country) => ({ value: country.code, label: `${country.flag} ${country.name}` })),
    [countries]
  )

  const handleScopesChange = (nextScopes: string[]) => {
    const nextDetails = Object.fromEntries(
      Object.entries(form.accreditationDetails).filter(([scope]) => nextScopes.includes(scope))
    )
    onPatch({ accreditationScopes: nextScopes, accreditationDetails: nextDetails })
  }

  const setScopeDetail = (
    scope: string,
    patch: Partial<{ accreditationBody: string; country: CountryCode }>
  ) => {
    const current = form.accreditationDetails[scope] ?? { accreditationBody: '', country: '' as CountryCode }
    onPatch({
      accreditationDetails: {
        ...form.accreditationDetails,
        [scope]: { ...current, ...patch },
      },
    })
  }

  return (
    <div className="w-full space-y-6">
      <div className="space-y-3">
        <FormLabel required>{t('register.cab.cabType')}</FormLabel>
        <MultiSelect
          tags={form.accreditationScopes}
          options={scopeOptions}
          onChange={handleScopesChange}
          placeholder={t('register.cab.cabTypePlaceholder')}
          layout="stacked"
        />
      </div>

      {form.accreditationScopes.map((scope) => {
        const detail = form.accreditationDetails[scope] ?? { accreditationBody: '', country: '' as CountryCode }
        const scopeLabel = scopeOptions.find((option) => option.value === scope)?.label ?? scope

        return (
          <div key={scope} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
              <span className="text-[15px] font-semibold text-primary">{scopeLabel}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <SelectField
                label={t('register.cab.accreditationBodyName')}
                required
                value={detail.accreditationBody}
                placeholder={t('register.cab.accreditationBodyPlaceholder')}
                onChange={(value) => setScopeDetail(scope, { accreditationBody: value })}
                options={MOCK_ACCREDITATION_BODIES}
              />
              <SelectField
                label={t('register.cab.cabCountry')}
                required
                value={detail.country}
                placeholder={t('register.cab.cabCountryPlaceholder')}
                onChange={(value) => setScopeDetail(scope, { country: value as CountryCode })}
                options={countryOptions}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}