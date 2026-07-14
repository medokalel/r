import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GeocodeResult, LatLng } from '@/components/maps/LocationPicker'
import { AddBranchForm } from './AddBranchForm'
import { AddressCard } from './AddressCard'
import { EditBranchModal } from './EditBranchModal'
import { BasicDataCard } from './BasicDataCard'
import { BranchesListCard } from './BranchesListCard'
import { CompanySummaryBanner } from './CompanySummaryBanner'
import { FileOperationsCard } from './FileOperationsCard'
import { MapCard } from './MapCard'
import {
  ConnectionNotesCard,
  NationalAddressFormCard,
  NationalAddressToggleCard,
} from './NationalAddressSection'
import { OfficialDocsCard } from './OfficialDocsCard'
import { CompletedStepRow } from './Primitives'
import { ProfileHeaderCard } from './ProfileHeaderCard'
import { useProfileForm } from './ProfileFormContext'
import { addressFieldsFromGeocode, googleMapsUrlFor } from './mappers'

export function BasicDataStep() {
  // Company location preview — independent from the official address on step 2
  const [companyLocation, setCompanyLocation] = useState<LatLng | null>(null)
  return (
    <>
      <ProfileHeaderCard />
      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <div className="w-full lg:w-[42%] lg:shrink-0">
          <MapCard location={companyLocation} onLocationChange={setCompanyLocation} />
        </div>
        <div className="min-w-0 flex-1">
          <BasicDataCard />
        </div>
      </div>
    </>
  )
}

export function AddressStep() {
  const { t } = useTranslation()
  const { form, update } = useProfileForm()
  const [hasNationalAddress, setHasNationalAddress] = useState<'yes' | 'no'>('yes')
  // Only fill the form from geocoding after the user picks on the map,
  // never when the saved location is restored on load
  const fillFormFromGeocodeRef = useRef(false)

  const handleLocationChange = (location: LatLng | null) => {
    fillFormFromGeocodeRef.current = location != null
    update('location', location)
    update('googleMapUrl', location ? googleMapsUrlFor(location) : '')
  }

  const handleGeocodeResult = (result: GeocodeResult) => {
    if (!fillFormFromGeocodeRef.current) return
    fillFormFromGeocodeRef.current = false
    const fields = addressFieldsFromGeocode(result)
    if (fields.country) update('country', fields.country)
    if (fields.city) update('city', fields.city)
    if (fields.district) update('district', fields.district)
    if (fields.street) update('street', fields.street)
    if (fields.buildingNumber) update('buildingNumber', fields.buildingNumber)
    if (fields.postalCode) update('postalCode', fields.postalCode)
  }

  return (
    <>
      <CompletedStepRow label={t('companyProfile.completedSteps.basicData')} />
      <CompanySummaryBanner incompleteKey="incompleteAddress" />
      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <div className="w-full lg:w-[42%] lg:shrink-0">
          <MapCard
            location={form.location}
            onLocationChange={handleLocationChange}
            onGeocodeResult={handleGeocodeResult}
          />
        </div>
        <div className="min-w-0 flex-1">
          <AddressCard />
        </div>
      </div>
      <NationalAddressToggleCard value={hasNationalAddress} onChange={setHasNationalAddress} />
      {hasNationalAddress === 'yes' && <NationalAddressFormCard />}
      <ConnectionNotesCard />
    </>
  )
}

export function BranchesStep() {
  const { t } = useTranslation()
  return (
    <>
      <CompletedStepRow label={t('companyProfile.completedSteps.basicData')} />
      <CompletedStepRow label={t('companyProfile.completedSteps.address')} />
      <CompanySummaryBanner />
      <div className="flex flex-col items-start gap-5 lg:flex-row">
        <div className="min-w-0 flex-1">
          <AddBranchForm />
        </div>
        <div className="w-full lg:w-[42%] lg:shrink-0">
          <div className="flex flex-col gap-5">
            <BranchesListCard />
            <FileOperationsCard />
          </div>
        </div>
      </div>
      <EditBranchModal />
    </>
  )
}

export function OfficialDocsStep() {
  const { t } = useTranslation()
  return (
    <>
      <CompletedStepRow label={t('companyProfile.completedSteps.basicData')} />
      <CompletedStepRow label={t('companyProfile.completedSteps.address')} />
      <CompletedStepRow label={t('companyProfile.completedSteps.branches')} />
      <CompanySummaryBanner incompleteKey="incompleteDocs" />
      <OfficialDocsCard />
    </>
  )
}
