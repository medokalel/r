import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneInputRow } from '@/components/auth/CountryCodeSelect'
import { AppIcon, MailIcon, PhoneIcon } from '@/components/icons'
import { FormLabel, SelectField, TextField, fieldHeightClassName, fieldInputClassName } from '@/components/ui'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { getCountryOptions, type CountryCode } from '@/lib/countries'
import {
  AB_ROLE_OPTIONS,
  MOCK_ACCREDITATION_BODIES,
} from '@/lib/api/abRegisterApi'
import { englishDigitsClassName, toEnglishDigits } from '@/lib/englishDigits'
import { isValidPhoneNumber } from '@/lib/validators'
import { cn } from '@/lib/utils'
import { type AbDetailsForm } from '@/lib/abDetailsForm'

export type { AbDetailsForm }

interface AbDetailsStepProps {
  form: AbDetailsForm
  onPatch: (f: Partial<AbDetailsForm>) => void
}

export function AbDetailsStep({ form, onPatch }: AbDetailsStepProps) {
  const { t, i18n } = useTranslation()
  const countries = useMemo(() => getCountryOptions(i18n.language), [i18n.language])
  const abRoleOptions = useMemo(
    () => AB_ROLE_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    [t]
  )
  const mobileError =
    form.mobile.trim().length > 0 &&
    !isValidPhoneNumber(form.mobile, form.mobileCountryCode)
      ? t('validation.invalidMobile')
      : undefined

  return (
    <div className="space-y-6 w-full">
      <TextField
        id="ab-name"
        label={t('register.ab.abName')}
        required
        type="text"
        value={form.abName}
        placeholder={t('register.ab.abNamePlaceholder')}
        onChange={(e) => onPatch({ abName: e.target.value })}
      />
      
      <div className="space-y-3">
        <FormLabel required>{t('register.ab.accreditationBodyName')}</FormLabel>
        <MultiSelect
          tags={form.accreditationBodies}
          options={MOCK_ACCREDITATION_BODIES}
          onChange={(tags) => onPatch({ accreditationBodies: tags })}
          placeholder={t('register.ab.accreditationBodyNamePlaceholder')}
        />
      </div>

      <TextField
        id="ab-email"
        label={t('register.ab.officialEmail')}
        icon={MailIcon}
        required
        type="email"
        lang="en"
        placeholder="ex: info@foods.com"
        value={form.email}
        onChange={(e) => onPatch({ email: toEnglishDigits(e.target.value) })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          <FormLabel>{t('register.ab.mobileNumber')}</FormLabel>
          <PhoneInputRow
            rowClassName="gap-3"
            value={form.mobileCountryCode}
            onChange={(code) => onPatch({ mobileCountryCode: code })}
            aria-label={t('register.countryCode')}
            className="border border-neutral-200"
          >
            <div className="relative flex-1">
              <span className="absolute inset-y-0 start-3 flex items-center text-blue-500 pointer-events-none">
                <AppIcon icon={PhoneIcon} size={20} />
              </span>
              <input
                id="ab-mobile"
                type="tel"
                lang="en"
                dir="ltr"
                placeholder="ex: 567XXXXXXXX"
                value={form.mobile}
                onChange={(e) => onPatch({ mobile: toEnglishDigits(e.target.value) })}
                className={cn(
                fieldInputClassName,
                fieldHeightClassName,
                englishDigitsClassName,
                'ps-12',
                mobileError && 'border-error-400 focus:ring-error-400 focus:border-error-400'
              )}
              />
            </div>
          </PhoneInputRow>
          {mobileError && <p className="text-small-light text-error-500">{mobileError}</p>}
        </div>

        <SelectField
          id="ab-country"
          label={t('register.ab.abCountry')}
          required
          value={form.country}
          placeholder={t('register.ab.abCountryPlaceholder')}
          onChange={(value) => onPatch({ country: value as CountryCode })}
          options={countries.map((country) => ({
            value: country.code,
            label: `${country.flag} ${country.name}`,
          }))}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <TextField
          id="ab-contact-person"
          label={t('register.ab.contactPerson')}
          required
          placeholder={t('register.ab.contactPersonPlaceholder')}
          value={form.contactPerson}
          onChange={(e) => onPatch({ contactPerson: e.target.value })}
        />
        <SelectField
          id="ab-role"
          label={t('register.ab.role')}
          required
          value={form.role}
          placeholder={t('register.ab.rolePlaceholder')}
          onChange={(value) => onPatch({ role: value })}
          options={abRoleOptions}
        />
      </div>
    </div>
  )
}