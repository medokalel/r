import { useTranslation } from 'react-i18next'
import {
  FormField,
  fieldInputClassName,
  fieldHeightClassName,
} from '@/components/dashboard/FormField'
import { AppIcon, ExternalLinkOutlineIcon, FileTextIcon, CalendarIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { countryDisplayName } from './mappers'
import { CardHeader } from './Primitives'
import { useProfileForm } from './ProfileFormContext'

export function NationalAddressToggleCard({
  value,
  onChange,
}: {
  value: 'yes' | 'no'
  onChange: (v: 'yes' | 'no') => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-6 rounded-[12px] border border-[#ececec] bg-white p-8">
      <CardHeader title={t('companyProfile.nationalAddress.hasAddressTitle')} />
      <div className="flex items-center gap-4">
        {(['yes', 'no'] as const).map((option) => {
          const active = value === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                'flex h-[58px] items-center gap-3 rounded-[50px] px-6 py-4 transition-colors',
                active
                  ? 'border border-primary bg-[#f3f6fd]'
                  : 'border border-[#f4f4f4] bg-[#fcfcfc] hover:border-primary/40'
              )}
            >
              <span className={cn('text-[18px] font-light leading-[1.6]', active ? 'text-primary' : 'text-[#666]')}>
                {t(`companyProfile.nationalAddress.${option}`)}
              </span>
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  active ? 'border-primary bg-primary' : 'border-[#dcdcdc] bg-white'
                )}
              >
                {active && <span className="size-2 rounded-full bg-white" />}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const readonlyInputCls = cn(
  fieldInputClassName,
  fieldHeightClassName,
  'cursor-default bg-[#f9fafc] border-[#f2f2f2] text-[#666]'
)

export function NationalAddressFormCard() {
  const { t, i18n } = useTranslation()
  const { form } = useProfileForm()
  const countryName = form.country ? countryDisplayName(form.country, i18n.language) : ''
  return (
    <div className="flex flex-col gap-6 rounded-[12px] border border-[#ececec] bg-white p-8">
      <CardHeader title={t('companyProfile.nationalAddress.formTitle')} />
      <div className="flex gap-6">
        {/* Document preview sidebar — start side */}
        <div className="hidden w-[260px] shrink-0 flex-col gap-3 lg:flex">
          <span className="text-[14px] font-medium leading-[1.6] text-[#666]">
            {t('companyProfile.nationalAddress.previewLabel')}
          </span>
          <div className="flex h-[372px] items-center justify-center rounded-[8px] border border-[#ececec] bg-[#f9fafc]">
            <AppIcon icon={FileTextIcon} size={40} className="text-neutral-300" />
          </div>
          <button
            type="button"
            className="flex items-center justify-center gap-2 text-[14px] font-medium text-primary underline"
          >
            <AppIcon icon={ExternalLinkOutlineIcon} size={14} />
            {t('companyProfile.nationalAddress.viewLarger')}
          </button>
        </div>

        {/* Form grid */}
        <div className="flex flex-1 flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <FormField label={t('companyProfile.nationalAddress.expiryDate')}>
              <div className="relative flex items-center">
                <input readOnly value="" className={cn(readonlyInputCls, 'pe-10')} />
                <CalendarIcon className="pointer-events-none absolute end-3 size-5 text-neutral-400" />
              </div>
            </FormField>
            <FormField label={t('companyProfile.nationalAddress.issueDate')}>
              <div className="relative flex items-center">
                <input readOnly value="" className={cn(readonlyInputCls, 'pe-10')} />
                <CalendarIcon className="pointer-events-none absolute end-3 size-5 text-neutral-400" />
              </div>
            </FormField>
            <FormField label={t('companyProfile.nationalAddress.addressId')}>
              <input readOnly value={form.additionalNumber} className={readonlyInputCls} />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <FormField label={t('companyProfile.nationalAddress.street')}>
              <input readOnly value={form.street} className={readonlyInputCls} />
            </FormField>
            <FormField label={t('companyProfile.nationalAddress.buildingNo')}>
              <input readOnly value={form.buildingNumber} className={readonlyInputCls} />
            </FormField>
            <FormField label={t('companyProfile.nationalAddress.shortAddress')}>
              <input readOnly value="" className={readonlyInputCls} />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <FormField label={t('companyProfile.nationalAddress.postalCode')}>
              <input readOnly value={form.postalCode} className={readonlyInputCls} />
            </FormField>
            <FormField label={t('companyProfile.nationalAddress.subNumber')}>
              <input readOnly value={form.additionalNumber} className={readonlyInputCls} />
            </FormField>
            <FormField label={t('companyProfile.nationalAddress.neighborhood')}>
              <input readOnly value={form.district} className={readonlyInputCls} />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField label={t('companyProfile.nationalAddress.city')}>
              <input readOnly value={form.city} className={readonlyInputCls} />
            </FormField>
            <FormField label={t('companyProfile.nationalAddress.country')}>
              <input readOnly value={countryName} className={readonlyInputCls} />
            </FormField>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ConnectionNotesCard() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-6 rounded-[12px] border border-[#ececec] bg-white p-8">
      <CardHeader title={t('companyProfile.nationalAddress.notesTitle')} />
      <div className="rounded-[8px] bg-[#f3f6fd] p-4">
        <ul className="list-disc ps-6 text-[16px] font-light leading-[1.8] text-[#666]">
          <li>{t('companyProfile.nationalAddress.note1')}</li>
          <li>{t('companyProfile.nationalAddress.note2')}</li>
        </ul>
      </div>
    </div>
  )
}
