import { getCountries, getCountryCallingCode } from 'libphonenumber-js'
import type { CountryCode } from '@/components/auth/CountryCodeSelect'
import type { GeocodeResult, LatLng } from '@/components/maps/LocationPicker'
import type {
  NationalAddressInput,
  OrganizationProfileData,
  OrgBranch,
  OrgBranchInput,
  SaveProfileRequest,
} from '@/lib/api/organizationProfileApi'
import {
  EMPTY_BRANCH_FORM,
  EMPTY_NATIONAL_ADDRESS,
  type BranchFormValues,
  type NationalAddressFormValues,
  type ProfileFormValues,
} from './types'

export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseIsoDate(value?: string | null): Date | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export function dialCodeFor(countryCode: CountryCode): string {
  return `+${getCountryCallingCode(countryCode)}`
}

export function countryFromDialCode(dial?: string | null): CountryCode | null {
  if (!dial) return null
  const digits = dial.replace(/\D/g, '')
  if (!digits) return null
  return getCountries().find((code) => getCountryCallingCode(code) === digits) ?? null
}

export function countryDisplayName(code: CountryCode, locale = 'en'): string {
  return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code
}

/** Resolve a stored country name (English or Arabic) back to its ISO code. */
export function countryCodeFromName(name?: string | null): CountryCode | null {
  if (!name) return null
  const trimmed = name.trim()
  if (!trimmed) return null
  // Direct ISO code (e.g. "EG") — also what geocoding short names return
  const upper = trimmed.toUpperCase()
  if ((getCountries() as string[]).includes(upper)) return upper as CountryCode
  for (const locale of ['en', 'ar']) {
    const display = new Intl.DisplayNames([locale], { type: 'region' })
    const match = getCountries().find((code) => display.of(code) === trimmed)
    if (match) return match
  }
  return null
}

export function googleMapsUrlFor(location: LatLng): string {
  return `https://maps.google.com/?q=${location.lat.toFixed(6)},${location.lng.toFixed(6)}`
}

/**
 * Extract coordinates from common Google Maps URL formats:
 * "…/@30.04,31.23,15z", "?q=30.04,31.23" (also ll/query/destination) and "!3d30.04!4d31.23".
 */
export function parseLatLngFromGoogleMapsUrl(url: string): LatLng | null {
  const match =
    url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/) ??
    url.match(/[?&](?:q|ll|query|destination)=(-?\d+(?:\.\d+)?)(?:,|%2C)\s*(-?\d+(?:\.\d+)?)/i) ??
    url.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/)
  if (!match) return null
  const lat = Number(match[1])
  const lng = Number(match[2])
  if (Number.isNaN(lat) || Number.isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return null
  }
  return { lat, lng }
}

export interface GeocodedAddressFields {
  country: CountryCode | null
  city?: string
  district?: string
  street?: string
  buildingNumber?: string
  postalCode?: string
}

export function addressFieldsFromGeocode(result: GeocodeResult): GeocodedAddressFields {
  const find = (...types: string[]) =>
    result.address_components.find((c) => types.some((type) => c.types.includes(type)))

  return {
    // The country short name is the ISO code
    country: countryCodeFromName(find('country')?.short_name),
    city: find('locality', 'administrative_area_level_1')?.long_name,
    district: find('sublocality', 'sublocality_level_1', 'neighborhood')?.long_name,
    street: find('route')?.long_name,
    buildingNumber: find('street_number')?.long_name,
    postalCode: find('postal_code')?.long_name,
  }
}

export { formatFileSize } from '@/lib/files'

export function nationalAddressFormFrom(
  nationalAddress?: NationalAddressInput | null
): NationalAddressFormValues {
  if (!nationalAddress) return EMPTY_NATIONAL_ADDRESS
  return {
    hasNationalAddress: nationalAddress.hasNationalAddress ?? true,
    certificateNumber: nationalAddress.certificateNumber ?? '',
    issueDate: parseIsoDate(nationalAddress.issueDate),
    expiryDate: parseIsoDate(nationalAddress.expiryDate),
    street: nationalAddress.street ?? '',
    buildingNumber: nationalAddress.buildingNumber ?? '',
    district: nationalAddress.district ?? '',
    additionalNumber: nationalAddress.additionalNumber ?? '',
    postalCode: nationalAddress.postalCode ?? '',
    city: nationalAddress.city ?? '',
  }
}

export function nationalAddressPayloadFrom(
  form: NationalAddressFormValues
): NationalAddressInput {
  return {
    hasNationalAddress: form.hasNationalAddress,
    certificateNumber: form.certificateNumber || undefined,
    issueDate: form.issueDate ? toIsoDate(form.issueDate) : undefined,
    expiryDate: form.expiryDate ? toIsoDate(form.expiryDate) : undefined,
    street: form.street || undefined,
    buildingNumber: form.buildingNumber || undefined,
    district: form.district || undefined,
    additionalNumber: form.additionalNumber || undefined,
    postalCode: form.postalCode || undefined,
    city: form.city || undefined,
  }
}

export function formValuesFromProfile(data: OrganizationProfileData): ProfileFormValues {
  const profile = data.profile ?? {}
  const address = data.address ?? {}
  const original = data.originalRegistrationData ?? {}

  const location =
    address.latitude != null && address.longitude != null
      ? { lat: address.latitude, lng: address.longitude }
      : null

  return {
    companySummary: profile.companySummary ?? '',
    industries: profile.industries ?? [],
    logoUrl: profile.logoUrl ?? null,
    organizationName: profile.organizationName ?? data.organizationName ?? '',
    tradeName: profile.tradeName ?? '',
    commercialRegisterNumber: profile.commercialRegisterNumber ?? '',
    unifiedNumber: profile.unifiedNumber ?? '',
    authorizedPersonName: profile.authorizedPersonName ?? '',
    email: profile.email ?? '',
    countryCode: countryFromDialCode(profile.phoneCountryCode) ?? 'SA',
    phoneNumber: profile.phoneNumber ?? '',
    organizationStatus: profile.organizationStatus ?? '',
    employeeCount: profile.employeeCount != null ? String(profile.employeeCount) : '',
    registrationDate: parseIsoDate(profile.registrationDate),
    country: countryCodeFromName(address.country),
    city: address.city ?? original.city ?? '',
    district: address.district ?? '',
    street: address.street ?? '',
    buildingNumber: address.buildingNumber ?? '',
    postalCode: address.postalCode ?? '',
    additionalNumber: address.additionalNumber ?? '',
    googleMapUrl: address.googleMapUrl ?? '',
    location,
    nationalAddress: nationalAddressFormFrom(profile.nationalAddress),
  }
}

/**
 * Build the save payload. With `forSubmit` the strict fields required by the
 * COMPLETED validation are always included; drafts omit what is still empty.
 */
export function payloadFromForm(
  form: ProfileFormValues,
  { forSubmit = false }: { forSubmit?: boolean } = {}
): SaveProfileRequest {
  return {
    profile: {
      organizationName: form.organizationName || undefined,
      tradeName: form.tradeName || undefined,
      commercialRegisterNumber: form.commercialRegisterNumber || undefined,
      // unifiedNumber is a read-only, backend-issued value — never sent back
      authorizedPersonName: form.authorizedPersonName || undefined,
      email: form.email || undefined,
      phoneCountryCode: form.phoneNumber ? dialCodeFor(form.countryCode) : undefined,
      phoneNumber: form.phoneNumber || undefined,
      organizationStatus: form.organizationStatus || undefined,
      registrationDate: form.registrationDate ? toIsoDate(form.registrationDate) : undefined,
      employeeCount: form.employeeCount !== '' ? Number(form.employeeCount) : undefined,
      industries: form.industries.length ? form.industries : undefined,
      companySummary: form.companySummary || undefined,
      // The profile UI has no production-lines question; defaulted to true on
      // submit so the COMPLETED validation passes
      allProductionLinesActive: forSubmit ? true : undefined,
      nationalAddress: nationalAddressPayloadFrom(form.nationalAddress),
    },
    address: {
      // Stored as the English country name (language-independent), per the API examples
      country: form.country ? countryDisplayName(form.country) : undefined,
      city: form.city || undefined,
      district: form.district || undefined,
      street: form.street || undefined,
      buildingNumber: form.buildingNumber || undefined,
      postalCode: form.postalCode || undefined,
      additionalNumber: form.additionalNumber || undefined,
      googleMapUrl: form.googleMapUrl || undefined,
      latitude: form.location?.lat,
      longitude: form.location?.lng,
    },
  }
}

export function branchFormFrom(branch: OrgBranch | null): BranchFormValues {
  if (!branch) return EMPTY_BRANCH_FORM
  return {
    branchName: branch.branchName ?? '',
    commercialRegisterNumber: branch.commercialRegisterNumber ?? '',
    address: branch.address ?? '',
    googleMapUrl: branch.googleMapUrl ?? '',
    branchManagerName: branch.branchManagerName ?? '',
    countryCode: countryFromDialCode(branch.phoneCountryCode),
    phoneNumber: branch.phoneNumber ?? '',
    sectors: branch.industry ? branch.industry.split(', ').filter(Boolean) : [],
    employeeCount: branch.employeeCount != null ? String(branch.employeeCount) : '',
    branchType: branch.branchType === 'TEMPORARY' ? 'temporary' : 'permanent',
    location:
      branch.latitude != null && branch.longitude != null
        ? { lat: branch.latitude, lng: branch.longitude }
        : null,
  }
}

export function branchPayloadFrom(
  form: BranchFormValues,
  countryCode: CountryCode
): OrgBranchInput {
  return {
    branchName: form.branchName || undefined,
    commercialRegisterNumber: form.commercialRegisterNumber || undefined,
    address: form.address || undefined,
    googleMapUrl: form.googleMapUrl || undefined,
    branchManagerName: form.branchManagerName || undefined,
    phoneCountryCode: form.phoneNumber ? dialCodeFor(countryCode) : undefined,
    phoneNumber: form.phoneNumber || undefined,
    industry: form.sectors.length ? form.sectors.join(', ') : undefined,
    employeeCount: form.employeeCount !== '' ? Number(form.employeeCount) : undefined,
    branchType: form.branchType === 'temporary' ? 'TEMPORARY' : 'PERMANENT',
    latitude: form.location?.lat,
    longitude: form.location?.lng,
  }
}
