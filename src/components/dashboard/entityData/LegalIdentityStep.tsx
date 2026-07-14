import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AppIcon,
  DownloadTrayIcon,
  EditIcon,
  UploadTrayIcon,
  EyeIcon,
  MailIcon,
  PhoneIcon,
} from '@/components/icons'
import { PhoneInputRow } from '@/components/auth/CountryCodeSelect'
import type { CountryCode } from '@/lib/countries'
import {
  FormField,
  FormSection,
  RadioGroup,
  SelectField,
  TagInput,
  fieldHeightClassName,
  fieldInputClassName,
  fieldTextClassName,
} from '@/components/dashboard/FormField'
import { CountrySelectField } from '@/components/dashboard/CountrySelectField'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import {
  standards as allStandards,
  type StandardKey,
} from '@/components/dashboard/entityData/fieldTypes'
import { cn } from '@/lib/utils'

const defaultAddress =
  '9000 Prince Miteb, Al Aziziyah District - Jeddah 23342 - 3041, Unit No. 7, Kingdom of Saudi Arabia.'

interface LegalIdentityStepProps {
  selectedStandards?: StandardKey[]
  onSelectedStandardsChange?: (standards: StandardKey[]) => void
}

export function LegalIdentityStep({
  selectedStandards,
  onSelectedStandardsChange,
}: LegalIdentityStepProps) {
  const { t } = useTranslation()
  const [localStandards, setLocalStandards] = useState<StandardKey[]>([])
  const [country, setCountry] = useState<CountryCode | null>('EG')
  const standardKeys = selectedStandards ?? localStandards
  const setStandardKeys = onSelectedStandardsChange ?? setLocalStandards

  // Standards covered by IAF MD 17:2023 (sections 5, 6 and 7)
  const standardLabel = (key: StandardKey) =>
    t(`accreditation.entityData.field.standardsFull.${key}`)
  const standardOptions = allStandards.map(standardLabel)
  const standardTags = standardKeys.map(standardLabel)

  const onStandardTagsChange = (labels: string[]) => {
    setStandardKeys(allStandards.filter((key) => labels.includes(standardLabel(key))))
  }
  const [productionActive, setProductionActive] = useState('yes')
  const [orgType, setOrgType] = useState('government')
  const [countryCode, setCountryCode] = useState<CountryCode>('EG')

  const yesNoOptions = [
    { value: 'yes', label: t('accreditation.form.yes') },
    { value: 'no', label: t('accreditation.form.no') },
  ]

  const orgTypeOptions = [
    { value: 'government', label: t('accreditation.form.governmentSector') },
    { value: 'private', label: t('accreditation.form.privateSector') },
    { value: 'thirdParty', label: t('accreditation.form.thirdParty') },
  ]

  return (
    <div className="flex-1 space-y-5">
      <SectionHeading title={t('accreditation.form.mainData')} accordion>
        <div className="space-y-5">
        <FormField label={t('accreditation.form.requiredStandard')} required>
          <TagInput tags={standardTags} options={standardOptions} onChange={onStandardTagsChange} />
        </FormField>

        <FormField label={t('accreditation.form.otherStandard')}>
          <input
            type="text"
            placeholder={t('accreditation.form.otherStandardPlaceholder')}
            className={cn(fieldInputClassName, fieldHeightClassName)}
          />
        </FormField>

        <div className="grid gap-5 lg:grid-cols-2">
          <FormField label={t('accreditation.form.organizationName')} required>
            <input
              type="text"
              defaultValue="Example: Standard Arabia Company for Commercial Services"
              className={cn(fieldInputClassName, fieldHeightClassName)}
            />
          </FormField>

          <FormField label={t('accreditation.form.website')}>
            <div className="relative">
              <input
                type="url"
                defaultValue="www.mac-cs.sa"
                className={cn(fieldInputClassName, fieldHeightClassName, 'pe-10')}
              />
              <span className="absolute end-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden>
                ↗
              </span>
            </div>
          </FormField>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <FormField label={t('accreditation.form.headOfficeAddress')} required>
            <textarea
              defaultValue={defaultAddress}
              rows={3}
              className={cn(fieldInputClassName, 'min-h-[60px] resize-none py-2.5')}
            />
          </FormField>

          <FormField label={t('accreditation.form.auditPlaceAddress')} required>
            <textarea
              defaultValue={defaultAddress}
              rows={3}
              className={cn(fieldInputClassName, 'min-h-[60px] resize-none py-2.5')}
            />
          </FormField>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <FormField label={t('accreditation.form.commercialRegistrationNo')} required>
            <SelectField value="7028618044" options={['7028618044']} />
          </FormField>

          <FormField label={t('accreditation.form.commercialRegistryFile')} required>
            <div className="flex flex-wrap gap-2">
              <div
                className={cn(
                  'flex min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-sm)]',
                  'border border-dashed border-blue-300 bg-[#f3f6fd] px-3',
                  fieldHeightClassName
                )}
              >
                <AppIcon icon={UploadTrayIcon} size={24} className="shrink-0 text-primary" />
                <span className={cn(fieldTextClassName, 'truncate text-neutral-600')}>
                  {t('accreditation.form.uploadCommercialRegister')}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex size-12 items-center justify-center rounded-[var(--radius-sm)] border border-[#ececec] bg-white hover:bg-neutral-50"
                  aria-label={t('accreditation.form.download')}
                >
                  <AppIcon icon={DownloadTrayIcon} size={20} />
                </button>
                <button
                  type="button"
                  className="flex size-12 items-center justify-center rounded-[var(--radius-sm)] border border-[#ececec] bg-white hover:bg-neutral-50"
                  aria-label={t('accreditation.form.view')}
                >
                  <AppIcon icon={EyeIcon} size={20} />
                </button>
                <button
                  type="button"
                  className="flex size-12 items-center justify-center rounded-[var(--radius-sm)] border border-[#ececec] bg-white hover:bg-neutral-50"
                  aria-label={t('accreditation.form.edit')}
                >
                  <AppIcon icon={EditIcon} size={20} />
                </button>
              </div>
            </div>
          </FormField>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <FormField label={t('accreditation.form.productionLinesActive')} required variant="question">
            <RadioGroup
              name="productionActive"
              value={productionActive}
              onChange={setProductionActive}
              options={yesNoOptions}
            />
          </FormField>

          <FormField label={t('accreditation.form.ifNoStateWhy')}>
            <input
              type="text"
              placeholder={t('accreditation.form.stateReasonPlaceholder')}
              className={cn(fieldInputClassName, fieldHeightClassName)}
            />
          </FormField>
        </div>
        </div>
      </SectionHeading>

      <SectionHeading title={t('accreditation.form.regulatoryData')} />
      <FormSection>
        <div className="grid gap-5 lg:grid-cols-2">
          <FormField label={t('accreditation.form.email')}>
            <div
              className={cn(
                'flex items-center overflow-hidden rounded-[var(--radius-sm)]',
                'border border-neutral-200 bg-white',
                fieldHeightClassName
              )}
            >
              <span className="flex size-12 shrink-0 items-center justify-center text-neutral-400">
                <AppIcon icon={MailIcon} size={20} />
              </span>
              <input
                type="email"
                defaultValue="ex: info@foods.com"
                className={cn(
                  fieldTextClassName,
                  'min-w-0 flex-1 bg-transparent px-3 text-neutral-900 focus:outline-none'
                )}
              />
            </div>
          </FormField>

          <FormField label={t('accreditation.form.country')} required>
            <CountrySelectField value={country} onChange={setCountry} />
          </FormField>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <FormField label={t('accreditation.form.representativeName')}>
            <input
              type="text"
              placeholder={t('accreditation.form.representativeNamePlaceholder')}
              className={cn(fieldInputClassName, fieldHeightClassName)}
            />
          </FormField>

          <FormField label={t('accreditation.form.representativeTitle')}>
            <input
              type="text"
              placeholder={t('accreditation.form.representativeTitlePlaceholder')}
              className={cn(fieldInputClassName, fieldHeightClassName)}
            />
          </FormField>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <FormField label={t('accreditation.form.mobileNumber')}>
            <PhoneInputRow
              rowClassName="gap-3"
              value={countryCode}
              onChange={setCountryCode}
              aria-label={t('accreditation.form.mobileNumber')}
            >
              <div
                className={cn(
                  'flex flex-1 items-center overflow-hidden rounded-[var(--radius-sm)]',
                  'border border-neutral-200 bg-white',
                  fieldHeightClassName
                )}
              >
                <span className="flex size-12 shrink-0 items-center justify-center text-neutral-400">
                  <AppIcon icon={PhoneIcon} size={20} />
                </span>
                <input
                  type="tel"
                  defaultValue="ex: 567XXXXXXXX"
                  dir="ltr"
                  className={cn(
                    fieldTextClassName,
                    'min-w-0 flex-1 bg-transparent px-3 text-neutral-900 focus:outline-none'
                  )}
                />
              </div>
            </PhoneInputRow>
          </FormField>

          <FormField label={t('accreditation.form.organizationType')}>
            <RadioGroup
              name="orgType"
              value={orgType}
              onChange={setOrgType}
              options={orgTypeOptions}
            />
          </FormField>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <FormField label={t('accreditation.form.mainActivity')} required>
            <input
              type="text"
              placeholder={t('accreditation.form.mainActivityPlaceholder')}
              className={cn(fieldInputClassName, fieldHeightClassName)}
            />
          </FormField>

          <FormField label={t('accreditation.form.requestType')} required>
            <input
              type="text"
              readOnly
              value={t('accreditation.form.newGranted')}
              className={cn(
                fieldInputClassName,
                fieldHeightClassName,
                'cursor-not-allowed bg-[#efefef] text-neutral-900'
              )}
            />
          </FormField>
        </div>
      </FormSection>
    </div>
  )
}
