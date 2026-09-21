import { useTranslation } from 'react-i18next'
import { FormField, SelectField, TextField, Textarea } from '@/components/ui'
import { SectionHeading } from '@/components/dashboard/SectionHeading'
import { PhoneInputRow } from '@/components/auth/CountryCodeSelect'
import { MailIcon, PhoneIcon } from '@/components/icons'
import { DashboardTourStep } from '@/components/dashboard/DashboardTourStep'
import { useFieldValidation } from '@/hooks/useFieldValidation'
import { isValidEmailFormat, isValidPhoneNumber } from '@/lib/validators'
import type { CountryCode } from '@/lib/countries'
import { LEGAL_CAPACITY_OPTIONS } from '@/lib/api/clientRegistrationApi'
import type { ClientRegistrationForm as ClientRegistrationFormData } from '@/lib/clientRegistrationForm'

interface ClientRegistrationFormProps {
  form: ClientRegistrationFormData
  onPatch: (f: Partial<ClientRegistrationFormData>) => void
}

export function ClientRegistrationForm({ form, onPatch }: ClientRegistrationFormProps) {
  const { t } = useTranslation()
  const { fieldProps } = useFieldValidation(form, {
    email: (value) => (!isValidEmailFormat(value) ? t('validation.invalidEmail') : undefined),
    phoneNumber: (value) =>
      !isValidPhoneNumber(value, form.phoneCountryCode) ? t('validation.invalidMobile') : undefined,
  })

  return (
    <div className="flex-1 space-y-5">
      <DashboardTourStep stepId="client-information">
        <SectionHeading title={t('cab.clientRegistration.sections.clientInformation')} accordion>
          <div className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <FormField label={t('cab.clientRegistration.fields.organizationName')} required>
                <TextField
                  type="text"
                  value={form.organizationName}
                  onChange={(e) => onPatch({ organizationName: e.target.value })}
                  placeholder={t('cab.clientRegistration.fields.organizationNamePlaceholder')}
                />
              </FormField>
              <FormField label={t('cab.clientRegistration.fields.legalCapacity')} required>
                <SelectField
                  value={form.legalCapacity}
                  options={LEGAL_CAPACITY_OPTIONS}
                  onChange={(value) => onPatch({ legalCapacity: value })}
                />
              </FormField>
            </div>

            <FormField label={t('cab.clientRegistration.fields.administrationName')} required>
              <TextField
                type="text"
                value={form.administrationName}
                onChange={(e) => onPatch({ administrationName: e.target.value })}
                placeholder={t('cab.clientRegistration.fields.administrationNamePlaceholder')}
              />
            </FormField>

            <div className="grid gap-5 lg:grid-cols-2">
              <FormField label={t('cab.clientRegistration.fields.city')} required>
                <TextField
                  type="text"
                  value={form.city}
                  onChange={(e) => onPatch({ city: e.target.value })}
                  placeholder={t('cab.clientRegistration.fields.cityPlaceholder')}
                />
              </FormField>
              <FormField label={t('cab.clientRegistration.fields.activity')} required>
                <Textarea
                  value={form.activity}
                  onChange={(e) => onPatch({ activity: e.target.value })}
                  placeholder={t('cab.clientRegistration.fields.activityPlaceholder')}
                  rows={3}
                  className="min-h-[80px]"
                />
              </FormField>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <FormField label={t('cab.clientRegistration.fields.facilityOwnerManager')} required>
                <TextField
                  type="text"
                  value={form.facilityOwnerManager}
                  onChange={(e) => onPatch({ facilityOwnerManager: e.target.value })}
                  placeholder={t('cab.clientRegistration.fields.facilityOwnerManagerPlaceholder')}
                />
              </FormField>
              <FormField label={t('cab.clientRegistration.fields.email')} required>
                <TextField
                  type="email"
                  icon={MailIcon}
                  value={form.email}
                  onChange={(e) => onPatch({ email: e.target.value })}
                  placeholder="client@example.com"
                  {...fieldProps('email')}
                />
              </FormField>
            </div>

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
          </div>
        </SectionHeading>
      </DashboardTourStep>
    </div>
  )
}
