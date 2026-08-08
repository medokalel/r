import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormField, SelectField, TextField, Textarea } from '@/components/ui'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { CountrySelectField } from '@/components/dashboard/CountrySelectField'
import { DatePicker } from '@/components/ui/DatePicker'
import { PhoneInputRow } from '@/components/auth/CountryCodeSelect'
import { AppIcon, MailIcon, PhoneIcon, UploadOutlineIcon } from '@/components/icons'
import { Button } from '@/components/ui/Button'
import { useFieldValidation } from '@/hooks/useFieldValidation'
import { isValidEmailFormat, isValidPhoneNumber, isValidWebsite } from '@/lib/validators'
import type { CountryCode } from '@/lib/countries'
import { fetchGovernorateOptions, type GovernorateOption } from '@/lib/governorates'
import {
  ORGANIZATION_TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
  EMPLOYEE_COUNT_OPTIONS,
  ANNUAL_TURNOVER_OPTIONS,
} from '@/lib/api/clientRegistrationApi'
import type { ClientRegistrationForm as ClientRegistrationFormData } from '@/lib/clientRegistrationForm'

interface ClientRegistrationFormProps {
  form: ClientRegistrationFormData
  onPatch: (f: Partial<ClientRegistrationFormData>) => void
  attachedFile: File | null
  onAttachFile: (file: File | null) => void
}

/** Loads State/Province options for a given country, mirroring LegalIdentityStep's governorate pattern. */
function useStateOptions(country: CountryCode | '') {
  const [loaded, setLoaded] = useState<{ country: CountryCode; options: GovernorateOption[] } | null>(null)

  useEffect(() => {
    if (!country) return
    let cancelled = false
    fetchGovernorateOptions(country)
      .then((options) => {
        if (!cancelled) setLoaded({ country, options })
      })
      .catch(() => {
        if (!cancelled) setLoaded({ country, options: [] })
      })
    return () => {
      cancelled = true
    }
  }, [country])

  return useMemo(
    () => (country && loaded?.country === country ? loaded.options.map((o) => o.name) : []),
    [country, loaded]
  )
}

export function ClientRegistrationForm({
  form,
  onPatch,
  attachedFile,
  onAttachFile,
}: ClientRegistrationFormProps) {
  const { t } = useTranslation()

  const stateOptions = useStateOptions(form.country)
  const addressStateOptions = useStateOptions(form.addressCountry)

  const { fieldProps } = useFieldValidation(form, {
    contactEmail: (value) => (!isValidEmailFormat(value) ? t('validation.invalidEmail') : undefined),
    phoneNumber: (value) =>
      !isValidPhoneNumber(value, form.phoneCountryCode) ? t('validation.invalidMobile') : undefined,
    mobileNumber: (value) =>
      value && !isValidPhoneNumber(value, form.mobileCountryCode) ? t('validation.invalidMobile') : undefined,
    website: (value) => (!isValidWebsite(value) ? t('validation.invalidWebsite') : undefined),
  })

  return (
    <div className="flex-1 space-y-5">
      <SectionHeading title={t('cab.clientRegistration.sections.clientInformation')} accordion>
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <FormField label={t('cab.clientRegistration.fields.legalEntityName')} required>
              <TextField
                type="text"
                value={form.legalEntityName}
                onChange={(e) => onPatch({ legalEntityName: e.target.value })}
                placeholder={t('cab.clientRegistration.fields.legalEntityNamePlaceholder')}
              />
            </FormField>
            <FormField label={t('cab.clientRegistration.fields.tradingName')}>
              <TextField
                type="text"
                value={form.tradingName}
                onChange={(e) => onPatch({ tradingName: e.target.value })}
                placeholder={t('cab.clientRegistration.fields.tradingNamePlaceholder')}
              />
            </FormField>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <FormField label={t('cab.clientRegistration.fields.organizationType')} required>
              <SelectField
                value={form.organizationType}
                options={ORGANIZATION_TYPE_OPTIONS}
                onChange={(value) => onPatch({ organizationType: value })}
              />
            </FormField>
            <FormField label={t('cab.clientRegistration.fields.registrationNumber')} required>
              <TextField
                type="text"
                value={form.registrationNumber}
                onChange={(e) => onPatch({ registrationNumber: e.target.value })}
                placeholder={t('cab.clientRegistration.fields.registrationNumberPlaceholder')}
              />
            </FormField>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <FormField label={t('cab.clientRegistration.fields.incorporationDate')} required>
              <DatePicker
                value={form.incorporationDate ?? undefined}
                onChange={(date) => onPatch({ incorporationDate: date })}
              />
            </FormField>
            <FormField label={t('cab.clientRegistration.fields.country')} required>
              <CountrySelectField
                value={form.country || null}
                onChange={(code) => onPatch({ country: code, state: '' })}
              />
            </FormField>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <FormField label={t('cab.clientRegistration.fields.state')} required>
              {stateOptions.length > 0 ? (
                <SelectField
                  value={form.state}
                  options={stateOptions}
                  onChange={(value) => onPatch({ state: value })}
                />
              ) : (
                <TextField
                  type="text"
                  value={form.state}
                  onChange={(e) => onPatch({ state: e.target.value })}
                  placeholder={t('cab.clientRegistration.fields.statePlaceholder')}
                />
              )}
            </FormField>
            <FormField label={t('cab.clientRegistration.fields.city')} required>
              <TextField
                type="text"
                value={form.city}
                onChange={(e) => onPatch({ city: e.target.value })}
                placeholder={t('cab.clientRegistration.fields.cityPlaceholder')}
              />
            </FormField>
          </div>
        </div>
      </SectionHeading>

      <SectionHeading title={t('cab.clientRegistration.sections.registeredAddress')} accordion>
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <FormField label={t('cab.clientRegistration.fields.addressLine1')} required>
              <TextField
                type="text"
                value={form.addressLine1}
                onChange={(e) => onPatch({ addressLine1: e.target.value })}
                placeholder={t('cab.clientRegistration.fields.addressLine1Placeholder')}
              />
            </FormField>
            <FormField label={t('cab.clientRegistration.fields.addressLine2')}>
              <TextField
                type="text"
                value={form.addressLine2}
                onChange={(e) => onPatch({ addressLine2: e.target.value })}
                placeholder={t('cab.clientRegistration.fields.addressLine2Placeholder')}
              />
            </FormField>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <FormField label={t('cab.clientRegistration.fields.landmark')}>
              <TextField
                type="text"
                value={form.landmark}
                onChange={(e) => onPatch({ landmark: e.target.value })}
                placeholder={t('cab.clientRegistration.fields.landmarkPlaceholder')}
              />
            </FormField>
            <FormField label={t('cab.clientRegistration.fields.postalCode')} required>
              <TextField
                type="text"
                inputMode="numeric"
                value={form.postalCode}
                onChange={(e) => onPatch({ postalCode: e.target.value })}
                placeholder={t('cab.clientRegistration.fields.postalCodePlaceholder')}
              />
            </FormField>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <FormField label={t('cab.clientRegistration.fields.country')} required>
              <CountrySelectField
                value={form.addressCountry || null}
                onChange={(code) => onPatch({ addressCountry: code, addressState: '' })}
              />
            </FormField>
            <FormField label={t('cab.clientRegistration.fields.state')} required>
              {addressStateOptions.length > 0 ? (
                <SelectField
                  value={form.addressState}
                  options={addressStateOptions}
                  onChange={(value) => onPatch({ addressState: value })}
                />
              ) : (
                <TextField
                  type="text"
                  value={form.addressState}
                  onChange={(e) => onPatch({ addressState: e.target.value })}
                  placeholder={t('cab.clientRegistration.fields.statePlaceholder')}
                />
              )}
            </FormField>
            <FormField label={t('cab.clientRegistration.fields.city')} required>
              <TextField
                type="text"
                value={form.addressCity}
                onChange={(e) => onPatch({ addressCity: e.target.value })}
                placeholder={t('cab.clientRegistration.fields.cityPlaceholder')}
              />
            </FormField>
          </div>
        </div>
      </SectionHeading>

      <SectionHeading title={t('cab.clientRegistration.sections.primaryContact')} accordion>
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-3">
            <FormField label={t('cab.clientRegistration.fields.fullName')} required>
              <TextField
                type="text"
                value={form.contactFullName}
                onChange={(e) => onPatch({ contactFullName: e.target.value })}
                placeholder={t('cab.clientRegistration.fields.fullNamePlaceholder')}
              />
            </FormField>
            <FormField label={t('cab.clientRegistration.fields.designation')} required>
              <TextField
                type="text"
                value={form.contactDesignation}
                onChange={(e) => onPatch({ contactDesignation: e.target.value })}
                placeholder={t('cab.clientRegistration.fields.designationPlaceholder')}
              />
            </FormField>
            <FormField label={t('cab.clientRegistration.fields.email')} required>
              <TextField
                type="email"
                icon={MailIcon}
                value={form.contactEmail}
                onChange={(e) => onPatch({ contactEmail: e.target.value })}
                placeholder="alaatarek@gmail.com"
                {...fieldProps('contactEmail')}
              />
            </FormField>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <FormField label={t('cab.clientRegistration.fields.phoneNumber')} required>
              <PhoneInputRow
                rowClassName="gap-3"
                value={form.phoneCountryCode}
                onChange={(code: CountryCode) => onPatch({ phoneCountryCode: code })}
                aria-label={t('cab.clientRegistration.fields.phoneNumber')}
              >
                <div className="min-w-0 flex-1">
                  <TextField
                    type="tel"
                    icon={PhoneIcon}
                    value={form.phoneNumber}
                    onChange={(e) => onPatch({ phoneNumber: e.target.value })}
                    placeholder="1XXXXXXXXX"
                    {...fieldProps('phoneNumber')}
                  />
                </div>
              </PhoneInputRow>
            </FormField>
            <FormField label={t('cab.clientRegistration.fields.mobileNumber')}>
              <PhoneInputRow
                rowClassName="gap-3"
                value={form.mobileCountryCode}
                onChange={(code: CountryCode) => onPatch({ mobileCountryCode: code })}
                aria-label={t('cab.clientRegistration.fields.mobileNumber')}
              >
                <div className="min-w-0 flex-1">
                  <TextField
                    type="tel"
                    icon={PhoneIcon}
                    value={form.mobileNumber}
                    onChange={(e) => onPatch({ mobileNumber: e.target.value })}
                    placeholder="1XXXXXXXXX"
                    {...fieldProps('mobileNumber')}
                  />
                </div>
              </PhoneInputRow>
            </FormField>
          </div>
        </div>
      </SectionHeading>

      <SectionHeading title={t('cab.clientRegistration.sections.additionalInformation')} accordion>
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-4">
            <FormField label={t('cab.clientRegistration.fields.industry')} required>
              <SelectField
                value={form.industry}
                options={INDUSTRY_OPTIONS}
                onChange={(value) => onPatch({ industry: value })}
              />
            </FormField>
            <FormField label={t('cab.clientRegistration.fields.employeeCount')} required>
              <SelectField
                value={form.employeeCount}
                options={EMPLOYEE_COUNT_OPTIONS}
                onChange={(value) => onPatch({ employeeCount: value })}
              />
            </FormField>
            <FormField label={t('cab.clientRegistration.fields.annualTurnover')} required>
              <SelectField
                value={form.annualTurnover}
                options={ANNUAL_TURNOVER_OPTIONS}
                onChange={(value) => onPatch({ annualTurnover: value })}
              />
            </FormField>
            <FormField label={t('cab.clientRegistration.fields.website')}>
              <TextField
                type="url"
                value={form.website}
                onChange={(e) => onPatch({ website: e.target.value })}
                placeholder="www.website.com"
                {...fieldProps('website')}
              />
            </FormField>
          </div>

          <FormField label={t('cab.clientRegistration.fields.activitiesDescription')} required>
            <Textarea
              value={form.activitiesDescription}
              onChange={(e) => onPatch({ activitiesDescription: e.target.value })}
              placeholder={t('cab.clientRegistration.fields.activitiesDescriptionPlaceholder')}
              rows={3}
              className="min-h-[80px]"
            />
          </FormField>

          {/* Simple optional single-file dashed dropzone — DocumentUploadField's
              row layout with a file history list is more than this optional
              attachment needs, so this stays a lightweight standalone control. */}
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-[var(--radius-md)] border border-dashed border-primary/40 bg-[#f9fafc] px-6 py-8 text-center">
            <AppIcon icon={UploadOutlineIcon} size={40} className="text-primary" />
            <span className="text-[14px] text-neutral-600">
              {attachedFile ? attachedFile.name : t('cab.clientRegistration.fields.attachDocument')}
            </span>
            <Button
              type="button"
              variant="tertiary"
              className="pointer-events-none h-10 min-w-[140px] rounded-[8px] bg-white"
            >
              {t('documentUpload.selectFile')}
            </Button>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => onAttachFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </SectionHeading>
    </div>
  )
}