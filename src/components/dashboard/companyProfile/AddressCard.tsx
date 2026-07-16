import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { CountrySelectField } from '@/components/dashboard/CountrySelectField'
import { FormField, SelectField, TextField } from '@/components/ui'
import { fetchGovernorateOptions, type GovernorateOption } from '@/lib/governorates'
import type { CountryCode } from '@/lib/countries'
import { GoogleMapUrlField } from './GoogleMapUrlField'
import { parseLatLngFromGoogleMapsUrl } from './mappers'
import { CardHeader } from './Primitives'
import { useProfileForm } from './ProfileFormContext'

export function AddressCard() {
  const { t } = useTranslation()
  const { form, update, saveDraft, saving } = useProfileForm()
  const [loadedGovernorates, setLoadedGovernorates] = useState<{
    country: CountryCode
    options: GovernorateOption[]
  } | null>(null)

  // City options follow the selected country
  useEffect(() => {
    const country = form.country
    if (!country) return
    let cancelled = false
    fetchGovernorateOptions(country)
      .then((options) => {
        if (!cancelled) setLoadedGovernorates({ country, options })
      })
      .catch(() => {
        if (!cancelled) setLoadedGovernorates({ country, options: [] })
      })
    return () => {
      cancelled = true
    }
  }, [form.country])

  const governorates = useMemo(
    () =>
      form.country && loadedGovernorates?.country === form.country
        ? loadedGovernorates.options
        : [],
    [form.country, loadedGovernorates]
  )

  const onCountryChange = (code: CountryCode) => {
    if (code === form.country) return
    update('country', code)
    update('city', '')
  }

  const cityOptions = useMemo(() => {
    const names = governorates.map((governorate) => governorate.name)
    return form.city && !names.includes(form.city) ? [form.city, ...names] : names
  }, [governorates, form.city])

  const onGoogleMapUrlChange = (value: string) => {
    update('googleMapUrl', value)
    // Reflect a pasted Google Maps link on the map
    const location = parseLatLngFromGoogleMapsUrl(value)
    if (location && (form.location?.lat !== location.lat || form.location?.lng !== location.lng)) {
      update('location', location)
    }
  }

  return (
    <div className="flex flex-col gap-6 rounded-[12px] border border-[#ececec] bg-white p-8">
      <CardHeader title={t('companyProfile.addressCard.title')} />

      <div className="flex flex-col gap-5">
        {/* Row 1: Country | City */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label={t('companyProfile.addressCard.countryLabel')} required>
            <CountrySelectField value={form.country} onChange={onCountryChange} />
          </FormField>
          <FormField label={t('companyProfile.addressCard.cityLabel')} required>
            {cityOptions.length > 0 ? (
              <SelectField
                value={form.city}
                options={cityOptions}
                onChange={(value) => update('city', value)}
              />
            ) : (
              <TextField
                type="text"
                placeholder={t('companyProfile.addressCard.cityPlaceholder')}
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
              />
            )}
          </FormField>
        </div>

        {/* Row 2: Neighborhood | Street */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label={t('companyProfile.addressCard.neighborhoodLabel')} required>
            <TextField
              type="text"
              placeholder={t('companyProfile.addressCard.neighborhoodPlaceholder')}
              value={form.district}
              onChange={(e) => update('district', e.target.value)}
            />
          </FormField>
          <FormField label={t('companyProfile.addressCard.streetLabel')} required>
            <TextField
              type="text"
              placeholder={t('companyProfile.addressCard.streetPlaceholder')}
              value={form.street}
              onChange={(e) => update('street', e.target.value)}
            />
          </FormField>
        </div>

        {/* Row 3: Building | Sub Number | Postal Code */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <FormField label={t('companyProfile.addressCard.buildingLabel')} required>
            <TextField
              type="text"
              placeholder={t('companyProfile.addressCard.buildingPlaceholder')}
              value={form.buildingNumber}
              onChange={(e) => update('buildingNumber', e.target.value)}
            />
          </FormField>
          <FormField label={t('companyProfile.addressCard.subNumberLabel')}>
            <TextField
              type="text"
              placeholder={t('companyProfile.addressCard.subNumberPlaceholder')}
              value={form.additionalNumber}
              onChange={(e) => update('additionalNumber', e.target.value)}
            />
          </FormField>
          <FormField label={t('companyProfile.addressCard.postalCodeLabel')} required>
            <TextField
              type="text"
              dir="ltr"
              placeholder={t('companyProfile.addressCard.postalCodePlaceholder')}
              value={form.postalCode}
              onChange={(e) => update('postalCode', e.target.value)}
            />
          </FormField>
        </div>

        {/* Row 4: Google Map link */}
        <GoogleMapUrlField
          label={t('companyProfile.addressCard.googleMapLabel')}
          placeholder={t('companyProfile.addressCard.googleMapPlaceholder')}
          value={form.googleMapUrl}
          onChange={onGoogleMapUrlChange}
        />

        <Button variant="primary" size="lg" className="w-full" onClick={saveDraft} disabled={saving}>
          {saving ? t('common.loading') : t('companyProfile.addressCard.saveButton')}
        </Button>
      </div>
    </div>
  )
}
