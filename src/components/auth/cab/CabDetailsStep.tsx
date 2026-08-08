import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneInputRow } from '@/components/auth/CountryCodeSelect'
import { AppIcon, MailIcon, PhoneIcon } from '@/components/icons'
import { FormLabel, SelectField, TextField, fieldHeightClassName, fieldInputClassName } from '@/components/ui'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { getCountryOptions, type CountryCode } from '@/lib/countries'
import { MOCK_ACCREDITATION_BODIES } from '@/lib/api/cabRegisterApi'
import { englishDigitsClassName, toEnglishDigits } from '@/lib/englishDigits'
import { isValidEmailFormat, isValidPhoneNumber } from '@/lib/validators'
import { cn } from '@/lib/utils'
import { type CabDetailsForm } from '@/lib/cabDetailsForm'

export type { CabDetailsForm }

interface CabDetailsStepProps {
  form: CabDetailsForm
  onPatch: (f: Partial<CabDetailsForm>) => void
}

export function CabDetailsStep({ form, onPatch }: CabDetailsStepProps) {
  const { t, i18n } = useTranslation()
  const countries = useMemo(() => getCountryOptions(i18n.language), [i18n.language])
  const mobileError =
    form.mobile.trim().length > 0 &&
    !isValidPhoneNumber(form.mobile, form.mobileCountryCode)
      ? t('validation.invalidMobile')
      : undefined
  const emailError =
    form.email.trim().length > 0 && !isValidEmailFormat(form.email)
      ? t('validation.invalidEmail')
      : undefined

  return (
    <div className="space-y-6 w-full">
      <TextField
        id="cab-name"
        label={t('register.cab.cabName')}
        required
        type="text"
        value={form.cabName}
        placeholder={t('register.cab.cabNamePlaceholder')}
        onChange={(e) => onPatch({ cabName: e.target.value })}
      />
      
      <div className="space-y-3">
        <FormLabel required>{t('register.cab.accreditationBodyName')}</FormLabel>
        <MultiSelect
          tags={form.accreditationBodies}
          options={MOCK_ACCREDITATION_BODIES}
          onChange={(tags) => onPatch({ accreditationBodies: tags })}
          placeholder={t('register.cab.accreditationBodyNamePlaceholder')}
        />
      </div>

      <TextField
        id="cab-email"
        label={t('register.cab.officialEmail')}
        icon={MailIcon}
        required
        type="email"
        lang="en"
        placeholder="ex: info@foods.com"
        value={form.email}
        onChange={(e) => onPatch({ email: toEnglishDigits(e.target.value) })}
        error={emailError}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          <FormLabel>{t('register.cab.mobileNumber')}</FormLabel>
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
                id="cab-mobile"
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
          id="cab-country"
          label={t('register.cab.cabCountry')}
          required
          value={form.country}
          placeholder={t('register.cab.cabCountryPlaceholder')}
          onChange={(value) => onPatch({ country: value as CountryCode })}
          options={countries.map((country) => ({
            value: country.code,
            label: `${country.flag} ${country.name}`,
          }))}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <TextField
          id="cab-contact-person"
          label={t('register.cab.contactPerson')}
          required
          placeholder={t('register.cab.contactPersonPlaceholder')}
          value={form.contactPerson}
          onChange={(e) => onPatch({ contactPerson: e.target.value })}
        />
        <TextField
          id="cab-role"
          label={t('register.cab.role')}
          disabled
          value={t('register.cab.roles.owner')}
        />
      </div>
    </div>
  )
}