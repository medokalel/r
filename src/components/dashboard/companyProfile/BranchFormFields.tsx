import { useTranslation } from 'react-i18next'
import { PhoneInputRow, type CountryCode } from '@/components/auth/CountryCodeSelect'
import {
  FormField,
  RadioGroup,
  TagInput,
  fieldInputClassName,
  fieldHeightClassName,
} from '@/components/dashboard/FormField'
import { LocationPicker, type LatLng } from '@/components/maps/LocationPicker'
import { cn } from '@/lib/utils'
import { BRANCH_SECTOR_OPTIONS } from './constants'
import { GoogleMapUrlField } from './GoogleMapUrlField'
import { googleMapsUrlFor, parseLatLngFromGoogleMapsUrl } from './mappers'
import type { BranchFormValues } from './types'

interface BranchFormFieldsProps {
  form: BranchFormValues
  set: <K extends keyof BranchFormValues>(key: K, value: BranchFormValues[K]) => void
  countryCode: CountryCode
  mapClassName?: string
  /** 'radio' matches the inline add form, 'pills' matches the edit dialog design */
  branchTypeVariant?: 'radio' | 'pills'
}

function BranchTypePills({
  value,
  onChange,
}: {
  value: BranchFormValues['branchType']
  onChange: (value: BranchFormValues['branchType']) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-4">
      {(['permanent', 'temporary'] as const).map((option) => {
        const active = value === option
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              'flex h-[52px] items-center gap-3 rounded-[50px] px-6 py-3 transition-colors',
              active
                ? 'border border-primary bg-[#f3f6fd]'
                : 'border border-[#f4f4f4] bg-[#fcfcfc] hover:border-primary/40'
            )}
          >
            <span className={cn('text-[16px] leading-[1.6]', active ? 'text-primary' : 'text-[#666]')}>
              {t(`companyProfile.addBranch.${option}`)}
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
  )
}

export function BranchFormFields({
  form,
  set,
  countryCode,
  mapClassName = 'h-[200px] w-full',
  branchTypeVariant = 'radio',
}: BranchFormFieldsProps) {
  const { t } = useTranslation()

  const onGoogleMapUrlChange = (value: string) => {
    set('googleMapUrl', value)
    // Reflect a pasted Google Maps link on the branch map
    const location = parseLatLngFromGoogleMapsUrl(value)
    if (location) set('location', location)
  }

  const onLocationChange = (location: LatLng | null) => {
    set('location', location)
    if (location) set('googleMapUrl', googleMapsUrlFor(location))
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormField label={t('companyProfile.addBranch.branchNameLabel')} required>
          <input
            type="text"
            placeholder={t('companyProfile.addBranch.branchNamePlaceholder')}
            className={cn(fieldInputClassName, fieldHeightClassName)}
            value={form.branchName}
            onChange={(e) => set('branchName', e.target.value)}
          />
        </FormField>
        <FormField label={t('companyProfile.addBranch.registryLabel')} required>
          <input
            type="text"
            dir="ltr"
            placeholder={t('companyProfile.addBranch.registryPlaceholder')}
            className={cn(fieldInputClassName, fieldHeightClassName)}
            value={form.commercialRegisterNumber}
            onChange={(e) => set('commercialRegisterNumber', e.target.value)}
          />
        </FormField>
      </div>

      <FormField label={t('companyProfile.addBranch.addressLabel')} required>
        <input
          type="text"
          placeholder={t('companyProfile.addBranch.addressPlaceholder')}
          className={cn(fieldInputClassName, fieldHeightClassName)}
          value={form.address}
          onChange={(e) => set('address', e.target.value)}
        />
      </FormField>

      <GoogleMapUrlField
        label={t('companyProfile.addBranch.googleMapLabel')}
        placeholder={t('companyProfile.addBranch.googleMapPlaceholder')}
        value={form.googleMapUrl}
        onChange={onGoogleMapUrlChange}
        required
      />

      <LocationPicker
        value={form.location}
        onChange={onLocationChange}
        className={mapClassName}
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormField label={t('companyProfile.addBranch.managerLabel')} required>
          <input
            type="text"
            placeholder={t('companyProfile.addBranch.managerPlaceholder')}
            className={cn(fieldInputClassName, fieldHeightClassName)}
            value={form.branchManagerName}
            onChange={(e) => set('branchManagerName', e.target.value)}
          />
        </FormField>
        <FormField label={t('companyProfile.addBranch.phoneLabel')} required>
          <PhoneInputRow
            rowClassName="items-center gap-2"
            value={countryCode}
            onChange={(code) => set('countryCode', code)}
            aria-label={t('companyProfile.addBranch.phoneLabel')}
            className="h-12 rounded-[var(--radius-sm)] border border-neutral-200"
          >
            <input
              type="tel"
              dir="ltr"
              placeholder={t('companyProfile.basicDataCard.phonePlaceholder')}
              className={cn(fieldInputClassName, fieldHeightClassName, 'flex-1')}
              value={form.phoneNumber}
              onChange={(e) => set('phoneNumber', e.target.value)}
            />
          </PhoneInputRow>
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormField label={t('companyProfile.addBranch.sectorLabel')} required>
          <TagInput
            tags={form.sectors}
            options={BRANCH_SECTOR_OPTIONS}
            onChange={(tags) => set('sectors', tags)}
          />
        </FormField>
        <FormField label={t('companyProfile.addBranch.employeesLabel')} required>
          <input
            type="number"
            dir="ltr"
            min={0}
            placeholder={t('companyProfile.addBranch.employeesPlaceholder')}
            className={cn(fieldInputClassName, fieldHeightClassName)}
            value={form.employeeCount}
            onChange={(e) => set('employeeCount', e.target.value)}
          />
        </FormField>
      </div>

      <FormField label={t('companyProfile.addBranch.branchTypeLabel')} required>
        {branchTypeVariant === 'pills' ? (
          <BranchTypePills
            value={form.branchType}
            onChange={(value) => set('branchType', value)}
          />
        ) : (
          <RadioGroup
            name="branchType"
            value={form.branchType}
            onChange={(value) => set('branchType', value as 'permanent' | 'temporary')}
            options={[
              { value: 'permanent', label: t('companyProfile.addBranch.permanent') },
              { value: 'temporary', label: t('companyProfile.addBranch.temporary') },
            ]}
          />
        )}
      </FormField>
    </>
  )
}
