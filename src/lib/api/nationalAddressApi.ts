import { ApiError } from '@/lib/api/client'
import { authorizedRequest } from '@/lib/api/authorizedClient'

/** A short address is 4 letters followed by 4 digits, e.g. RRRD2929. */
export const NATIONAL_ADDRESS_SHORT_CODE_PATTERN = /^[A-Za-z]{4}\d{4}$/

export interface NationalAddress {
  shortAddress?: string
  buildingNumber: string
  street: string
  district: string
  city: string
  postalCode: string
  additionalNumber: string
  region?: string
  unitNumber?: string
  country?: string
  latitude?: number
  longitude?: number
}

export const NATIONAL_ADDRESS_ERROR_CODES = [
  'NATIONAL_ADDRESS_NOT_FOUND',
  'NATIONAL_ADDRESS_UNAVAILABLE',
  'NATIONAL_ADDRESS_PROVIDER_ERROR',
] as const

export type NationalAddressErrorCode = (typeof NATIONAL_ADDRESS_ERROR_CODES)[number]

/** Thrown when the backend answers with one of the known National Address error codes. */
export class NationalAddressLookupError extends Error {
  readonly code: NationalAddressErrorCode

  constructor(code: NationalAddressErrorCode) {
    super(code)
    this.name = 'NationalAddressLookupError'
    this.code = code
  }
}

/** Looks the address up at Saudi Post through the backend, by its short address. */
export async function lookupNationalAddress(
  shortCode: string,
  language: 'en' | 'ar'
): Promise<NationalAddress> {
  const query = new URLSearchParams({ lang: language, shortCode: shortCode.trim().toUpperCase() })

  try {
    return await authorizedRequest<NationalAddress>(`/lookup/national-address?${query.toString()}`)
  } catch (error) {
    if (error instanceof ApiError) {
      const code = NATIONAL_ADDRESS_ERROR_CODES.find((candidate) => error.message.startsWith(candidate))
      if (code) throw new NationalAddressLookupError(code)
    }
    throw error
  }
}
