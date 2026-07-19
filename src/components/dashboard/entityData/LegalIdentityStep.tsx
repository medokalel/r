import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AppIcon,
  MailIcon,
  PhoneIcon,
  UploadTrayIcon,
  DownloadTrayIcon,
  EyeIcon,
  EditIcon,
  ExternalLinkArrowIcon,
} from '@/components/icons'
import { PhoneInputRow } from '@/components/auth/CountryCodeSelect'
import { useFieldValidation } from '@/hooks/useFieldValidation'
import { isValidEmail, isValidWebsite, isValidPhoneNumber } from '@/lib/validators'
import type { CountryCode } from '@/lib/countries'
import {
  FormField,
  FormSection,
  RadioGroup,
  MultiSelect,
  TextField,
  Textarea,
  fieldHeightClassName,
  fieldTextClassName,
} from '@/components/ui'
import { CountrySelectField } from '@/components/dashboard/CountrySelectField'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { useApplicationForm } from '@/components/dashboard/entityData/ApplicationFormContext'
import {
  standards as allStandards,
  type StandardKey,
} from '@/components/dashboard/entityData/fieldTypes'
import { cn } from '@/lib/utils'

interface LegalIdentityStepProps {
  selectedStandards?: StandardKey[]
  onSelectedStandardsChange?: (standards: StandardKey[]) => void
}

export function LegalIdentityStep({
  selectedStandards,
  onSelectedStandardsChange,
}: LegalIdentityStepProps) {
  const { t } = useTranslation()
  const { form, update, uploadCommercialRegister, uploading } = useApplicationForm()
  
const { fieldProps } = useFieldValidation(form, {
    email: (value) => (!isValidEmail(value) ? t('validation.invalidEmail') : undefined),
    website: (value) => (!isValidWebsite(value) ? t('validation.invalidWebsite') : undefined),
    mobileNumber: (value) =>
      !isValidPhoneNumber(value, form.mobileCountryCode) ? t('validation.invalidMobile') : undefined,
  })

  const commercialRegisterInputRef = useRef<HTMLInputElement>(null)

  const standardKeys = selectedStandards ?? form.selectedStandards
  const setStandardKeys =
    onSelectedStandardsChange ??
    ((standards: StandardKey[]) => update('selectedStandards', standards))

  // Standards covered by IAF MD 17:2023 (sections 5, 6 and 7)
  const standardLabel = (key: StandardKey) =>
    t(`accreditation.entityData.field.standardsFull.${key}`)
  const standardOptions = allStandards.map(standardLabel)
  const standardTags = standardKeys.map(standardLabel)

  const onStandardTagsChange = (labels: string[]) => {
    setStandardKeys(allStandards.filter((key) => labels.includes(standardLabel(key))))
  }

  const yesNoOptions = [
    { value: 'yes', label: t('accreditation.form.yes') },
    { value: 'no', label: t('accreditation.form.no') },
  ]

  const orgTypeOptions = [
    { value: 'government', label: t('accreditation.form.governmentSector') },
    { value: 'private', label: t('accreditation.form.privateSector') },
    { value: 'thirdParty', label: t('accreditation.form.thirdParty') },
  ]

  const onSelectCommercialRegisterFile = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (file) void uploadCommercialRegister(file)
    event.target.value = ''
  }

  return (
    <div className="flex-1 space-y-5">
      <SectionHeading title={t('accreditation.form.mainData')} accordion>
        <div className="space-y-5">
        <FormField label={t('accreditation.form.requiredStandard')} required>
          <MultiSelect
            tags={standardTags}
            options={standardOptions}
            onChange={onStandardTagsChange}
            placeholder={t('accreditation.form.requiredStandardPlaceholder')}
          />
        </FormField>

        <FormField label={t('accreditation.form.otherStandard')}>
          <TextField
            type="text"
            value={form.otherStandard}
            onChange={(e) => update('otherStandard', e.target.value)}
            placeholder={t('accreditation.form.otherStandardPlaceholder')}
          />
        </FormField>

        <div className="grid gap-5 lg:grid-cols-2">
          <FormField label={t('accreditation.form.organizationName')} required>
            <TextField
              type="text"
              value={form.organizationName}
              placeholder={t('accreditation.form.organizationNamePlaceholder')}
              onChange={(e) => update('organizationName', e.target.value)}
            />
          </FormField>

          <FormField label={t('accreditation.form.website')}>
            <div className="relative">
              <TextField
                type="url"
                value={form.website}
                onChange={(e) => update('website', e.target.value)}
                placeholder={t('accreditation.form.websitePlaceholder')}
                className="pe-10"
                {...fieldProps('website')}
              />
              <span className="absolute end-3 top-1/2 -translate-y-1/2 text-primary" aria-hidden>
                <ExternalLinkArrowIcon size={16} />
              </span>
            </div>
          </FormField>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <FormField label={t('accreditation.form.headOfficeAddress')} required>
            <Textarea
              value={form.headOfficeAddress}
              onChange={(e) => update('headOfficeAddress', e.target.value)}
              placeholder={t('accreditation.form.headOfficeAddressPlaceholder')}
              rows={3}
              className="min-h-[60px]"
            />
          </FormField>

          <FormField label={t('accreditation.form.auditPlaceAddress')} required>
            <Textarea
              value={form.auditSiteAddress}
              onChange={(e) => update('auditSiteAddress', e.target.value)}
              placeholder={t('accreditation.form.auditPlaceAddressPlaceholder')}
              rows={3}
              className="min-h-[60px]"
            />
          </FormField>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <FormField label={t('accreditation.form.commercialRegistrationNo')} required>
            <TextField
              type="text"
              inputMode="numeric"
              value={form.commercialRegisterNumber}
              onChange={(e) => update('commercialRegisterNumber', e.target.value)}
              placeholder={t('accreditation.form.commercialRegistrationNoPlaceholder')}
            />
          </FormField>

          <FormField label={t('accreditation.form.commercialRegistryFile')} required>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => commercialRegisterInputRef.current?.click()}
                disabled={uploading}
                className={cn(
                  'flex min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-sm)]',
                  'border border-dashed border-blue-300 bg-[#f3f6fd] px-3 text-start',
                  'disabled:cursor-not-allowed disabled:opacity-60',
                  fieldHeightClassName
                )}
              >
                <AppIcon icon={UploadTrayIcon} size={24} className="shrink-0 text-primary" />
                <span className={cn(fieldTextClassName, 'truncate text-neutral-600')}>
                  {form.commercialRegisterFile
                    ? form.commercialRegisterFile.split('/').pop()
                    : t('accreditation.form.uploadCommercialRegister')}
                </span>
              </button>
              <input
                ref={commercialRegisterInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={onSelectCommercialRegisterFile}
              />
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
                  onClick={() =>
                    form.commercialRegisterFile &&
                    window.open(form.commercialRegisterFile, '_blank', 'noopener')
                  }
                  className="flex size-12 items-center justify-center rounded-[var(--radius-sm)] border border-[#ececec] bg-white hover:bg-neutral-50"
                  aria-label={t('accreditation.form.view')}
                >
                  <AppIcon icon={EyeIcon} size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => commercialRegisterInputRef.current?.click()}
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
              value={form.allProductionLinesIncluded}
              onChange={(v) => {
                update('allProductionLinesIncluded', v as '' | 'yes' | 'no')
                // The reason only applies when the answer is "no"
                if (v === 'yes') update('excludedReason', '')
              }}
              options={yesNoOptions}
            />
          </FormField>

          <FormField label={t('accreditation.form.ifNoStateWhy')}>
            <TextField
              type="text"
              value={form.excludedReason}
              onChange={(e) => update('excludedReason', e.target.value)}
              placeholder={t('accreditation.form.stateReasonPlaceholder')}
              disabled={form.allProductionLinesIncluded !== 'no'}
              className="disabled:cursor-not-allowed disabled:bg-[#efefef]"
            />
          </FormField>
        </div>
        </div>
      </SectionHeading>

      <SectionHeading title={t('accreditation.form.regulatoryData')} accordion>
        <FormSection>
          <div className="grid gap-5 lg:grid-cols-2">
            <FormField label={t('accreditation.form.email')}>
              <TextField
                type="email"
                icon={MailIcon}
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="info@example.com"
                {...fieldProps('email')}
              />
            </FormField>

            <FormField label={t('accreditation.form.country')} required>
              <CountrySelectField
                value={form.country}
                onChange={(country) => update('country', country)}
              />
            </FormField>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <FormField label={t('accreditation.form.representativeName')}>
              <TextField
                type="text"
                value={form.representativeName}
                onChange={(e) => update('representativeName', e.target.value)}
                placeholder={t('accreditation.form.representativeNamePlaceholder')}
              />
            </FormField>

            <FormField label={t('accreditation.form.representativeTitle')}>
              <TextField
                type="text"
                value={form.jobTitle}
                onChange={(e) => update('jobTitle', e.target.value)}
                placeholder={t('accreditation.form.representativeTitlePlaceholder')}
              />
            </FormField>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <FormField label={t('accreditation.form.mobileNumber')}>
              <PhoneInputRow
                rowClassName="gap-3"
                value={form.mobileCountryCode}
                onChange={(code: CountryCode) => update('mobileCountryCode', code)}
                aria-label={t('accreditation.form.mobileNumber')}
              >
                <div className="min-w-0 flex-1">
                  <TextField
                    type="tel"
                    icon={PhoneIcon}
                    value={form.mobileNumber}
                    onChange={(e) => update('mobileNumber', e.target.value)}
                    placeholder="567XXXXXXXX"
                    {...fieldProps('mobileNumber')}
                  />
                </div>
              </PhoneInputRow>
            </FormField>

            <FormField label={t('accreditation.form.organizationType')}>
              <RadioGroup
                name="orgType"
                value={form.organizationNature}
                onChange={(v) => update('organizationNature', v)}
                options={orgTypeOptions}
              />
            </FormField>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <FormField label={t('accreditation.form.mainActivity')} required>
              <TextField
                type="text"
                value={form.mainActivity}
                onChange={(e) => update('mainActivity', e.target.value)}
                placeholder={t('accreditation.form.mainActivityPlaceholder')}
              />
            </FormField>

            <FormField label={t('accreditation.form.requestType')} required>
              <TextField
                type="text"
                readOnly
                value={t('accreditation.form.newGranted')}
                className="cursor-not-allowed bg-[#efefef] text-neutral-900"
              />
            </FormField>
          </div>
        </FormSection>
      </SectionHeading>
    </div>
  )
}