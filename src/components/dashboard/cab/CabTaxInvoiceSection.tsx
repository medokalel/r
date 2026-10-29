import { useTranslation } from 'react-i18next'
import { SetupNote, SetupSection } from '@/components/auth/cab/setup/CabSetupPrimitives'
import { TextField } from '@/components/ui'
import { NationalAddressLookup } from '@/components/dashboard/cab/NationalAddressLookup'
import {
  CAB_TAX_FIELD_IDS,
  type CabTaxField,
  type CabTaxForm,
} from '@/lib/cabTaxProfile'

interface CabTaxInvoiceSectionProps {
  value: CabTaxForm
  onChange: (next: CabTaxForm) => void
  errors: Partial<Record<CabTaxField, string>>
  /** The VAT number is needed before invoices can be issued in Saudi Arabia. */
  vatRequired: boolean
}

/** Tax invoice (ZATCA) details printed on the CAB's invoices. */
export function CabTaxInvoiceSection({ value, onChange, errors, vatRequired }: CabTaxInvoiceSectionProps) {
  const { t } = useTranslation()

  const setField = (field: CabTaxField, next: string) => onChange({ ...value, [field]: next })
  const setDigits = (field: CabTaxField, maxLength: number) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setField(field, event.target.value.replace(/\D/g, '').slice(0, maxLength))

  return (
    <SetupSection title={t('cab.companyProfile.tax.title')}>
      <div className="space-y-6">
        <SetupNote>
          {vatRequired ? t('cab.companyProfile.tax.hintRequired') : t('cab.companyProfile.tax.hint')}
        </SetupNote>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <TextField
            id={CAB_TAX_FIELD_IDS.vatNumber}
            label={t('cab.companyProfile.tax.vatNumber')}
            dir="ltr"
            inputMode="numeric"
            placeholder="3XXXXXXXXXXXXX3"
            value={value.vatNumber}
            onChange={setDigits('vatNumber', 15)}
            error={errors.vatNumber}
          />
        </div>

        <NationalAddressLookup
          onFound={(address) =>
            onChange({
              ...value,
              addressStreet: address.street || value.addressStreet,
              addressBuildingNumber: address.buildingNumber || value.addressBuildingNumber,
              addressAdditionalNumber: address.additionalNumber || value.addressAdditionalNumber,
              addressDistrict: address.district || value.addressDistrict,
              addressPostalCode: address.postalCode || value.addressPostalCode,
            })
          }
        />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          <TextField
            id={CAB_TAX_FIELD_IDS.addressStreet}
            label={t('cab.companyProfile.tax.street')}
            maxLength={200}
            value={value.addressStreet}
            onChange={(event) => setField('addressStreet', event.target.value)}
            error={errors.addressStreet}
          />
          <TextField
            id={CAB_TAX_FIELD_IDS.addressBuildingNumber}
            label={t('cab.companyProfile.tax.buildingNumber')}
            dir="ltr"
            inputMode="numeric"
            placeholder="2322"
            value={value.addressBuildingNumber}
            onChange={setDigits('addressBuildingNumber', 4)}
            error={errors.addressBuildingNumber}
          />
          <TextField
            id={CAB_TAX_FIELD_IDS.addressAdditionalNumber}
            label={t('cab.companyProfile.tax.additionalNumber')}
            dir="ltr"
            inputMode="numeric"
            placeholder="8040"
            value={value.addressAdditionalNumber}
            onChange={setDigits('addressAdditionalNumber', 4)}
            error={errors.addressAdditionalNumber}
          />
          <TextField
            id={CAB_TAX_FIELD_IDS.addressDistrict}
            label={t('cab.companyProfile.tax.district')}
            maxLength={120}
            value={value.addressDistrict}
            onChange={(event) => setField('addressDistrict', event.target.value)}
            error={errors.addressDistrict}
          />
          <TextField
            id={CAB_TAX_FIELD_IDS.addressPostalCode}
            label={t('cab.companyProfile.tax.postalCode')}
            dir="ltr"
            inputMode="numeric"
            placeholder="23425"
            value={value.addressPostalCode}
            onChange={setDigits('addressPostalCode', 5)}
            error={errors.addressPostalCode}
          />
        </div>

        <p className="text-[12px] text-[var(--cab-muted)]">{t('cab.companyProfile.tax.cityNote')}</p>
      </div>
    </SetupSection>
  )
}
