import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PhoneInputRow } from '@/components/auth/CountryCodeSelect'
import { DatePicker } from '@/components/ui/DatePicker'
import { FormField, SelectField, TextField } from '@/components/ui'
import { AppIcon, MailIcon, UserIcon } from '@/components/icons'
import { profileCardClassName, STATUS_OPTIONS } from './constants'
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
    <div className={profileCardClassName}>
      <CardHeader title={t('companyProfile.basicDataCard.title')} />

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label={t('companyProfile.basicDataCard.companyNameLabel')} required>
            <TextField
              type="text"
              placeholder={t('companyProfile.basicDataCard.companyNamePlaceholder')}
              value={form.organizationName}
              onChange={(e) => update('organizationName', e.target.value)}
            />
          </FormField>
          <FormField label={t('companyProfile.basicDataCard.tradingNameLabel')} required>
            <TextField
              type="text"
              placeholder={t('companyProfile.basicDataCard.tradingNamePlaceholder')}
              value={form.tradeName}
              onChange={(e) => update('tradeName', e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label={t('companyProfile.basicDataCard.commercialRegistryLabel')} required>
            <TextField
              type="text"
              placeholder={t('companyProfile.basicDataCard.commercialRegistryPlaceholder')}
              value={form.commercialRegisterNumber}
              onChange={(e) => update('commercialRegisterNumber', e.target.value)}
            />
          </FormField>
          <FormField label={t('companyProfile.basicDataCard.serialNumberLabel')}>
            <TextField
              type="text"
              placeholder={t('companyProfile.basicDataCard.serialNumberPlaceholder')}
              readOnly
              value={form.unifiedNumber}
              className="cursor-not-allowed border-[#f2f2f2] bg-[#f9fafc] text-neutral-400"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label={t('companyProfile.basicDataCard.authorizedPersonLabel')} required>
            <div className="relative flex items-center">
              <TextField
                type="text"
                readOnly
                placeholder={t('companyProfile.basicDataCard.authorizedPersonPlaceholder')}
                className="cursor-not-allowed border-[#f2f2f2] bg-[#f9fafc] ps-10 text-neutral-400"
                value={form.authorizedPersonName}
              />
              <span className="pointer-events-none absolute start-3 text-primary">
                <AppIcon icon={UserIcon} size={18} />
              </span>
            </div>
          </FormField>
          <FormField label={t('companyProfile.basicDataCard.emailLabel')} required>
            <div className="relative flex items-center">
              <TextField
                type="email"
                dir="ltr"
                readOnly
                placeholder={t('companyProfile.basicDataCard.emailPlaceholder')}
                className="cursor-not-allowed border-[#f2f2f2] bg-[#f9fafc] pl-10 text-neutral-400"
                value={form.email}
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
              onChange={() => undefined}
              disabled
              aria-label={t('companyProfile.basicDataCard.phoneLabel')}
              className="h-12 cursor-not-allowed rounded-[var(--radius-sm)] border border-[#f2f2f2] bg-[#f9fafc] opacity-100"
            >
              <TextField
                type="tel"
                dir="ltr"
                readOnly
                placeholder={t('companyProfile.basicDataCard.phonePlaceholder')}
                className="flex-1 cursor-not-allowed border-[#f2f2f2] bg-[#f9fafc] text-neutral-400"
                value={form.phoneNumber}
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
            <TextField
              type="number"
              min={0}
              placeholder={t('companyProfile.basicDataCard.totalEmployeesPlaceholder')}
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
