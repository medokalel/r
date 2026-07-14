import {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from 'libphonenumber-js'

export type { CountryCode }

export interface CountryOption {
  code: CountryCode
  dial: string
  flag: string
  name: string
}

export function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
}

export function getCountryOptions(locale: string): CountryOption[] {
  const regionNames = new Intl.DisplayNames([locale], { type: 'region' })

  return getCountries()
    .map((code) => ({
      code,
      dial: `+${getCountryCallingCode(code)}`,
      flag: countryFlag(code),
      name: regionNames.of(code) ?? code,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale))
}

export const DEFAULT_COUNTRY_CODE: CountryCode = 'EG'
