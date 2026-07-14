import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneInputRow } from '@/components/auth/CountryCodeSelect'
import { DatePicker } from '@/components/ui/DatePicker'
import {
  FormField,
  SelectField,
  fieldInputClassName,
  fieldHeightClassName,
} from '@/components/dashboard/FormField'
import { AppIcon, MailIcon, UserIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { STATUS_OPTIONS } from './constants'
import { CardHeader } from './Primitives'
import { useProfileForm } from './ProfileFormContext'

export function BasicDataCard() {
  const { t } = useTranslation()
  const { form, update } = useProfileForm()

  const statusLabels = useMemo(() => {
    const labels = STATUS_OPTIONS.map((opt) =>
      t(`companyProfile.basicDataCard.statusOptions.${opt.key}`)
    )
    // Preserve values coming from the API that are not in the predefined list
    if (
      form.organizationStatus &&
      !STATUS_OPTIONS.some((opt) => opt.value === form.organizationStatus)
    ) {
      labels.push(form.organizationStatus)
    }
    return labels
  }, [t, form.organizationStatus])

  const statusLabelFor = (value: string) => {
    const option = STATUS_OPTIONS.find((opt) => opt.value === value)
    return option ? t(`companyProfile.basicDataCard.statusOptions.${option.key}`) : value
  }

  const statusValueFor = (label: string) => {
    const option = STATUS_OPTIONS.find(
      (opt) => t(`companyProfile.basicDataCard.statusOptions.${opt.key}`) === label
    )
    return option ? option.value : label
  }

  return (
    <div className="flex flex-col gap-6 rounded-[12px] border border-[#ececec] bg-white p-8">
      <CardHeader title={t('companyProfile.basicDataCard.title')} />

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label={t('companyProfile.basicDataCard.companyNameLabel')} required>
            <input
              type="text"
              placeholder={t('companyProfile.basicDataCard.companyNamePlaceholder')}
              className={cn(fieldInputClassName, fieldHeightClassName)}
              value={form.organizationName}
              onChange={(e) => update('organizationName', e.target.value)}
            />
          </FormField>
          <FormField label={t('companyProfile.basicDataCard.tradingNameLabel')} required>
            <input
              type="text"
              placeholder={t('companyProfile.basicDataCard.tradingNamePlaceholder')}
              className={cn(fieldInputClassName, fieldHeightClassName)}
              value={form.tradeName}
              onChange={(e) => update('tradeName', e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label={t('companyProfile.basicDataCard.commercialRegistryLabel')} required>
            <input
              type="text"
              placeholder={t('companyProfile.basicDataCard.commercialRegistryPlaceholder')}
              className={cn(fieldInputClassName, fieldHeightClassName)}
              value={form.commercialRegisterNumber}
              onChange={(e) => update('commercialRegisterNumber', e.target.value)}
            />
          </FormField>
          <FormField label={t('companyProfile.basicDataCard.serialNumberLabel')}>
            <input
              type="text"
              placeholder={t('companyProfile.basicDataCard.serialNumberPlaceholder')}
              readOnly
              value={form.unifiedNumber}
              className={cn(
                fieldInputClassName,
                fieldHeightClassName,
                'cursor-not-allowed border-[#f2f2f2] bg-[#f9fafc] text-neutral-400'
              )}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label={t('companyProfile.basicDataCard.authorizedPersonLabel')} required>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder={t('companyProfile.basicDataCard.authorizedPersonPlaceholder')}
                className={cn(fieldInputClassName, fieldHeightClassName, 'ps-10')}
                value={form.authorizedPersonName}
                onChange={(e) => update('authorizedPersonName', e.target.value)}
              />
              <span className="pointer-events-none absolute start-3 text-primary">
                <AppIcon icon={UserIcon} size={18} />
              </span>
            </div>
          </FormField>
          <FormField label={t('companyProfile.basicDataCard.emailLabel')} required>
            <div className="relative flex items-center">
              <input
                type="email"
                dir="ltr"
                placeholder={t('companyProfile.basicDataCard.emailPlaceholder')}
                className={cn(fieldInputClassName, fieldHeightClassName, 'pl-10')}
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
              <span className="pointer-events-none absolute left-3 text-primary">
                <AppIcon icon={MailIcon} size={18} />
              </span>
            </div>
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label={t('companyProfile.basicDataCard.phoneLabel')} required>
            <PhoneInputRow
              rowClassName="items-center gap-2"
              value={form.countryCode}
              onChange={(code) => update('countryCode', code)}
              aria-label={t('companyProfile.basicDataCard.phoneLabel')}
              className="h-12 rounded-[var(--radius-sm)] border border-neutral-200"
            >
              <input
                type="tel"
                dir="ltr"
                placeholder={t('companyProfile.basicDataCard.phonePlaceholder')}
                className={cn(fieldInputClassName, fieldHeightClassName, 'flex-1')}
                value={form.phoneNumber}
                onChange={(e) => update('phoneNumber', e.target.value)}
              />
            </PhoneInputRow>
          </FormField>
          <FormField label={t('companyProfile.basicDataCard.companyStatusLabel')} required>
            <SelectField
              value={form.organizationStatus ? statusLabelFor(form.organizationStatus) : ''}
              options={statusLabels}
              onChange={(label) => update('organizationStatus', statusValueFor(label))}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label={t('companyProfile.basicDataCard.totalEmployeesLabel')} required>
            <input
              type="number"
              min={0}
              placeholder={t('companyProfile.basicDataCard.totalEmployeesPlaceholder')}
              className={cn(fieldInputClassName, fieldHeightClassName)}
              value={form.employeeCount}
              onChange={(e) => update('employeeCount', e.target.value)}
            />
          </FormField>
          <FormField label={t('companyProfile.basicDataCard.registrationDateLabel')} required>
            <DatePicker
              value={form.registrationDate}
              onChange={(date) => update('registrationDate', date)}
              placeholder={t('companyProfile.basicDataCard.registrationDatePlaceholder')}
            />
          </FormField>
        </div>
      </div>
    </div>
  )
}
