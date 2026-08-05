import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneInputRow } from '@/components/auth/CountryCodeSelect'
import { AppIcon, PhoneIcon } from '@/components/icons'
import { FormLabel, SelectField, TextField, fieldHeightClassName, fieldInputClassName } from '@/components/ui'
import { getCountryOptions, type CountryCode } from '@/lib/countries'
import { englishDigitsClassName, toEnglishDigits } from '@/lib/englishDigits'
import { isValidPhoneNumber } from '@/lib/validators'
import { cn } from '@/lib/utils'
import { type AuditeeDetailsForm } from '@/lib/auditeeDetailsForm'

export type { AuditeeDetailsForm }

interface AuditeeDetailsStepProps {
  form: AuditeeDetailsForm
  onPatch: (f: Partial<AuditeeDetailsForm>) => void
}

export function AuditeeDetailsStep({ form, onPatch }: AuditeeDetailsStepProps) {
  const { t, i18n } = useTranslation()
  const countries = useMemo(() => getCountryOptions(i18n.language), [i18n.language])
  const mobileError =
    form.mobile.trim().length > 0 && !isValidPhoneNumber(form.mobile, form.mobileCountryCode)
      ? t('validation.invalidMobile')
      : undefined

  return (
    <div className="space-y-6 w-full">
      <TextField
        id="auditee-company-name"
        label={t('register.auditee.companyName')}
        required
        type="text"
        value={form.companyName}
        placeholder={t('register.auditee.companyNamePlaceholder')}
        onChange={(e) => onPatch({ companyName: e.target.value })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <SelectField
          id="auditee-country"
          label={t('register.auditee.country')}
          required
          value={form.country}
          placeholder={t('register.auditee.countryPlaceholder')}
          onChange={(value) => onPatch({ country: value as CountryCode })}
          options={countries.map((country) => ({
            value: country.code,
            label: `${country.flag} ${country.name}`,
          }))}
        />

        <TextField
          id="auditee-city"
          label={t('register.auditee.city')}
          required
          type="text"
          value={form.city}
          placeholder={t('register.auditee.cityPlaceholder')}
          onChange={(e) => onPatch({ city: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <TextField
          id="auditee-contact-person"
          label={t('register.auditee.contactPerson')}
          required
          placeholder={t('register.auditee.contactPersonPlaceholder')}
          value={form.contactPerson}
          onChange={(e) => onPatch({ contactPerson: e.target.value })}
        />

        <div className="space-y-3">
          <FormLabel>{t('register.auditee.role')}</FormLabel>
          <input
            type="text"
            value={form.role}
            disabled
            readOnly
            className={cn(fieldInputClassName, fieldHeightClassName, 'cursor-not-allowed bg-neutral-50 text-neutral-500')}
          />
        </div>
      </div>

      <TextField
        id="auditee-email"
        label={t('register.auditee.email')}
        required
        type="email"
        lang="en"
        placeholder="ex: info@foods.com"
        value={form.email}
        onChange={(e) => onPatch({ email: toEnglishDigits(e.target.value) })}
      />

      <div className="space-y-3">
        <FormLabel required>{t('register.auditee.mobileNumber')}</FormLabel>
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
              id="auditee-mobile"
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
    </div>
  )
}