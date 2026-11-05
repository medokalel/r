/**
 * Form model for the CAB travel policy page.
 *
 * Numbers are edited as strings so an empty or half-typed field is never
 * silently turned into 0; they are parsed once, when the draft is validated and
 * sent. Rows carry a client-side `id` (stable React keys) and a `confirmed`
 * flag, the inverse of the API's `sample`. Everything here is pure so it can be
 * unit-tested without a browser.
 */
import type {
  TravelCabin,
  TravelPolicyInput,
  TravelPolicySettings,
} from '@/lib/travelPolicyTypes'

export type TravelNumericSetting = Exclude<
  keyof TravelPolicySettings,
  'longFlightCabin' | 'insuranceDomestic' | 'perDiemOnLocalAudits'
>

export type TravelSettingGroupKey = 'transport' | 'trip' | 'costs' | 'pricing'

export const TRAVEL_SETTING_GROUPS: ReadonlyArray<{
  key: TravelSettingGroupKey
  settings: readonly TravelNumericSetting[]
}> = [
  {
    key: 'transport',
    settings: [
      'economyMaxFlightHours',
      'carVsFlightKm',
      'maxGroundHours',
      'airportTransferDefault',
      'carRentalPerDay',
      'fuelPerKm',
      'localTransportPerDay',
      'passengersPerCar',
    ],
  },
  {
    key: 'trip',
    settings: [
      'travelBufferDays',
      'earlyArrivalThresholdHours',
      'lateReturnThresholdHours',
      'combineSitesKm',
      'localRadiusKm',
      'maxExtraHoursForSaving',
    ],
  },
  {
    key: 'costs',
    settings: [
      'contingencyPct',
      'insurancePct',
      'defaultHotelRate',
      'defaultPerDiem',
      'flightBaseFare',
      'flightPerKm',
      'premiumEconomyMultiplier',
      'businessMultiplier',
    ],
  },
  {
    key: 'pricing',
    settings: [
      'liveWindowDays',
      'bookingHorizonDays',
      'benchmarkAnnualIncreasePct',
      'quoteValidityDays',
      'bookingLeadDays',
      'adjustmentApprovalThreshold',
      'groundSpeedKmh',
      'roadFactor',
      'airportOverheadHours',
    ],
  },
]

export const TRAVEL_NUMERIC_SETTINGS: readonly TravelNumericSetting[] = TRAVEL_SETTING_GROUPS.flatMap(
  (group) => group.settings
)

export interface TravelCountryRow {
  id: string
  country: string
  perDiem: string
  hotelCap: string
  visaFee: string
  note: string
  confirmed: boolean
}

export interface TravelCityRow {
  id: string
  cityKey: string
  hotelCap: string
  confirmed: boolean
}

export interface TravelRailRow {
  id: string
  from: string
  to: string
  fare: string
  hours: string
  operator: string
  confirmed: boolean
}

export interface TravelPolicyDraft {
  currency: string
  longFlightCabin: TravelCabin
  insuranceDomestic: boolean
  perDiemOnLocalAudits: boolean
  settings: Record<TravelNumericSetting, string>
  countries: TravelCountryRow[]
  cities: TravelCityRow[]
  railRoutes: TravelRailRow[]
}

export type TravelPolicySection = 'countries' | 'cities' | 'railRoutes'

/** i18n key suffix under `cab.travelPolicy.validation.*`. */
export type TravelPolicyErrorCode =
  | 'required'
  | 'number'
  | 'currency'
  | 'country'
  | 'duplicateCountry'
  | 'duplicateCity'
  | 'sameCities'

export type TravelPolicyErrors = Record<string, TravelPolicyErrorCode>

export const TRAVEL_CURRENCY_LENGTH = 3
export const TRAVEL_COUNTRY_LENGTH = 2
export const TRAVEL_NOTE_MAX_LENGTH = 300
export const TRAVEL_OPERATOR_MAX_LENGTH = 120

let rowSequence = 0
const nextRowId = () => `travel-row-${++rowSequence}`

export const TRAVEL_CURRENCY_FIELD_ID = 'travel-currency'

export function settingFieldId(setting: TravelNumericSetting): string {
  return `travel-setting-${setting}`
}

export function rowFieldId(section: TravelPolicySection, id: string, field: string): string {
  return `travel-${section}-${field}-${id}`
}

export function settingErrorKey(setting: TravelNumericSetting): string {
  return `settings.${setting}`
}

export function rowErrorKey(section: TravelPolicySection, id: string, field: string): string {
  return `${section}.${id}.${field}`
}

export function createCountryRow(): TravelCountryRow {
  return { id: nextRowId(), country: '', perDiem: '0', hotelCap: '0', visaFee: '0', note: '', confirmed: true }
}

export function createCityRow(cityKey: string): TravelCityRow {
  return { id: nextRowId(), cityKey, hotelCap: '0', confirmed: true }
}

export function createRailRow(from: string, to: string): TravelRailRow {
  return { id: nextRowId(), from, to, fare: '0', hours: '1', operator: '', confirmed: true }
}

export function updateRow<T extends { id: string }>(rows: readonly T[], id: string, patch: Partial<T>): T[] {
  return rows.map((row) => (row.id === id ? { ...row, ...patch } : row))
}

export function removeRow<T extends { id: string }>(rows: readonly T[], id: string): T[] {
  return rows.filter((row) => row.id !== id)
}

export function policyToDraft(policy: TravelPolicyInput): TravelPolicyDraft {
  const settings = {} as Record<TravelNumericSetting, string>
  for (const key of TRAVEL_NUMERIC_SETTINGS) settings[key] = String(policy.settings[key])

  return {
    currency: policy.currency,
    longFlightCabin: policy.settings.longFlightCabin,
    insuranceDomestic: policy.settings.insuranceDomestic,
    perDiemOnLocalAudits: policy.settings.perDiemOnLocalAudits,
    settings,
    countries: policy.countries.map((row) => ({
      id: nextRowId(),
      country: row.country,
      perDiem: String(row.perDiem),
      hotelCap: String(row.hotelCap),
      visaFee: String(row.visaFee),
      note: row.note ?? '',
      confirmed: !row.sample,
    })),
    cities: policy.cities.map((row) => ({
      id: nextRowId(),
      cityKey: row.cityKey,
      hotelCap: String(row.hotelCap),
      confirmed: !row.sample,
    })),
    railRoutes: policy.railRoutes.map((row) => ({
      id: nextRowId(),
      from: row.from,
      to: row.to,
      fare: String(row.fare),
      hours: String(row.hours),
      operator: row.operator,
      confirmed: !row.sample,
    })),
  }
}

const toNumber = (value: string) => Number(value.trim())

/** Builds the API payload. Call it only after `validateDraft` returned no errors. */
export function draftToInput(draft: TravelPolicyDraft): TravelPolicyInput {
  const settings = {
    longFlightCabin: draft.longFlightCabin,
    insuranceDomestic: draft.insuranceDomestic,
    perDiemOnLocalAudits: draft.perDiemOnLocalAudits,
  } as TravelPolicySettings
  for (const key of TRAVEL_NUMERIC_SETTINGS) settings[key] = toNumber(draft.settings[key])

  return {
    currency: draft.currency.trim().toUpperCase(),
    settings,
    countries: draft.countries.map((row) => ({
      country: row.country.trim().toUpperCase(),
      perDiem: toNumber(row.perDiem),
      hotelCap: toNumber(row.hotelCap),
      visaFee: toNumber(row.visaFee),
      note: row.note.trim(),
      sample: !row.confirmed,
    })),
    cities: draft.cities.map((row) => ({
      cityKey: row.cityKey,
      hotelCap: toNumber(row.hotelCap),
      sample: !row.confirmed,
    })),
    railRoutes: draft.railRoutes.map((row) => ({
      from: row.from,
      to: row.to,
      fare: toNumber(row.fare),
      hours: toNumber(row.hours),
      operator: row.operator.trim(),
      sample: !row.confirmed,
    })),
  }
}

function numberError(value: string): TravelPolicyErrorCode | null {
  if (value.trim() === '') return 'required'
  const parsed = toNumber(value)
  return Number.isFinite(parsed) && parsed >= 0 ? null : 'number'
}

export function validateDraft(draft: TravelPolicyDraft): TravelPolicyErrors {
  const errors: TravelPolicyErrors = {}

  if (!/^[A-Za-z]{3}$/.test(draft.currency.trim())) errors.currency = 'currency'

  for (const key of TRAVEL_NUMERIC_SETTINGS) {
    const error = numberError(draft.settings[key])
    if (error) errors[settingErrorKey(key)] = error
  }

  const countryCounts = new Map<string, number>()
  for (const row of draft.countries) {
    const code = row.country.trim().toUpperCase()
    countryCounts.set(code, (countryCounts.get(code) ?? 0) + 1)
  }
  for (const row of draft.countries) {
    const code = row.country.trim().toUpperCase()
    if (!/^[A-Z]{2}$/.test(code)) errors[rowErrorKey('countries', row.id, 'country')] = 'country'
    else if ((countryCounts.get(code) ?? 0) > 1) errors[rowErrorKey('countries', row.id, 'country')] = 'duplicateCountry'
    for (const field of ['perDiem', 'hotelCap', 'visaFee'] as const) {
      const error = numberError(row[field])
      if (error) errors[rowErrorKey('countries', row.id, field)] = error
    }
  }

  const cityCounts = new Map<string, number>()
  for (const row of draft.cities) cityCounts.set(row.cityKey, (cityCounts.get(row.cityKey) ?? 0) + 1)
  for (const row of draft.cities) {
    if ((cityCounts.get(row.cityKey) ?? 0) > 1) errors[rowErrorKey('cities', row.id, 'cityKey')] = 'duplicateCity'
    const error = numberError(row.hotelCap)
    if (error) errors[rowErrorKey('cities', row.id, 'hotelCap')] = error
  }

  for (const row of draft.railRoutes) {
    if (row.from === row.to) errors[rowErrorKey('railRoutes', row.id, 'to')] = 'sameCities'
    for (const field of ['fare', 'hours'] as const) {
      const error = numberError(row[field])
      if (error) errors[rowErrorKey('railRoutes', row.id, field)] = error
    }
  }

  return errors
}

/** Number of rows still marked as unconfirmed sample values. */
export function countSampleRows(draft: TravelPolicyDraft): number {
  return [...draft.countries, ...draft.cities, ...draft.railRoutes].filter((row) => !row.confirmed).length
}

const withoutId = <T extends { id: string }>(rows: readonly T[]) =>
  rows.map((row) => {
    const copy: Partial<T> = { ...row }
    delete copy.id
    return copy
  })

/** Stable snapshot of the editable content (row ids ignored), used to detect unsaved changes. */
export function serializeDraft(draft: TravelPolicyDraft): string {
  return JSON.stringify({
    ...draft,
    countries: withoutId(draft.countries),
    cities: withoutId(draft.cities),
    railRoutes: withoutId(draft.railRoutes),
  })
}

/** DOM id of the input an error key belongs to, so the page can focus the first invalid field. */
export function fieldIdForError(errorKey: string): string {
  if (errorKey === 'currency') return TRAVEL_CURRENCY_FIELD_ID
  if (errorKey.startsWith('settings.')) {
    return settingFieldId(errorKey.slice('settings.'.length) as TravelNumericSetting)
  }
  const [section, id, field] = errorKey.split('.')
  return rowFieldId(section as TravelPolicySection, id, field)
}

/** "Last saved" timestamp in the active UI language; falls back to the raw value if it is not a date. */
export function formatPolicyTimestamp(value: string, language: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
