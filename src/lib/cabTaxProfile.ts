import type { TFunction } from 'i18next'
import type { CabProfile, CabProfileUpdatePayload } from '@/lib/api/cabApi'

/** Tax invoice (ZATCA) details of the CAB. They are saved with PATCH /cab-profile. */
export interface CabTaxForm {
  vatNumber: string
  addressStreet: string
  addressBuildingNumber: string
  addressAdditionalNumber: string
  addressDistrict: string
  addressPostalCode: string
}

export type CabTaxField = keyof CabTaxForm

export const emptyCabTaxForm: CabTaxForm = {
  vatNumber: '',
  addressStreet: '',
  addressBuildingNumber: '',
  addressAdditionalNumber: '',
  addressDistrict: '',
  addressPostalCode: '',
}

export const CAB_TAX_FIELDS = Object.keys(emptyCabTaxForm) as CabTaxField[]

/** DOM ids of the tax inputs, used to focus a field from an error toast. */
export const CAB_TAX_FIELD_IDS: Record<CabTaxField, string> = {
  vatNumber: 'cab-tax-vat',
  addressStreet: 'cab-tax-street',
  addressBuildingNumber: 'cab-tax-building',
  addressAdditionalNumber: 'cab-tax-additional',
  addressDistrict: 'cab-tax-district',
  addressPostalCode: 'cab-tax-postal',
}

export function mapCabProfileToTaxForm(cab: CabProfile | null): CabTaxForm {
  return {
    vatNumber: cab?.vatNumber ?? '',
    addressStreet: cab?.addressStreet ?? '',
    addressBuildingNumber: cab?.addressBuildingNumber ?? '',
    addressAdditionalNumber: cab?.addressAdditionalNumber ?? '',
    addressDistrict: cab?.addressDistrict ?? '',
    addressPostalCode: cab?.addressPostalCode ?? '',
  }
}

export function mapTaxFormToPayload(form: CabTaxForm): CabProfileUpdatePayload {
  const orNull = (value: string) => value.trim() || null
  return {
    vatNumber: orNull(form.vatNumber),
    addressStreet: orNull(form.addressStreet),
    addressBuildingNumber: orNull(form.addressBuildingNumber),
    addressAdditionalNumber: orNull(form.addressAdditionalNumber),
    addressDistrict: orNull(form.addressDistrict),
    addressPostalCode: orNull(form.addressPostalCode),
  }
}

export function isCabTaxFormChanged(current: CabTaxForm, saved: CabTaxForm): boolean {
  return CAB_TAX_FIELDS.some((field) => current[field].trim() !== saved[field].trim())
}

/** Saudi VAT numbers have 15 digits and start and end with 3. */
const VAT_PATTERN = /^3\d{13}3$/
const SAUDI_COUNTRY_PATTERN = /^(sa|ksa|saudi arabia|kingdom of saudi arabia)$|السعود/i

/** The VAT number is required before invoices can be issued when the CAB is in Saudi Arabia. */
export function isSaudiArabia(country: string | null | undefined): boolean {
  return SAUDI_COUNTRY_PATTERN.test(country?.trim() ?? '')
}

/** Only filled values are checked; every field is optional. */
export function validateCabTaxForm(
  form: CabTaxForm,
  t: TFunction
): Partial<Record<CabTaxField, string>> {
  const errors: Partial<Record<CabTaxField, string>> = {}
  const check = (field: CabTaxField, isValid: boolean, message: string) => {
    if (form[field].trim() && !isValid) errors[field] = message
  }

  check('vatNumber', VAT_PATTERN.test(form.vatNumber.trim()), t('cab.companyProfile.tax.errors.vat'))
  check(
    'addressBuildingNumber',
    /^\d{4}$/.test(form.addressBuildingNumber.trim()),
    t('cab.companyProfile.tax.errors.building')
  )
  check(
    'addressAdditionalNumber',
    /^\d{4}$/.test(form.addressAdditionalNumber.trim()),
    t('cab.companyProfile.tax.errors.additional')
  )
  check(
    'addressPostalCode',
    /^\d{5}$/.test(form.addressPostalCode.trim()),
    t('cab.companyProfile.tax.errors.postal')
  )
  check('addressStreet', form.addressStreet.trim().length <= 200, t('cab.companyProfile.tax.errors.tooLong'))
  check('addressDistrict', form.addressDistrict.trim().length <= 120, t('cab.companyProfile.tax.errors.tooLong'))

  return errors
}
