/**
 * Types for the CAB travel policy: the rules and rates the travel cost
 * calculator uses when no live price is available. The page currently runs on
 * `lib/api/travelPolicyMockData.ts`; there is no backend endpoint yet.
 */
export type TravelCabin = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS'

export const TRAVEL_CABINS: readonly TravelCabin[] = ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS']

export interface TravelPolicySettings {
  economyMaxFlightHours: number
  longFlightCabin: TravelCabin
  carVsFlightKm: number
  maxGroundHours: number
  groundSpeedKmh: number
  roadFactor: number
  carRentalPerDay: number
  fuelPerKm: number
  passengersPerCar: number
  localTransportPerDay: number
  airportTransferDefault: number
  airportOverheadHours: number
  travelBufferDays: number
  earlyArrivalThresholdHours: number
  lateReturnThresholdHours: number
  localRadiusKm: number
  combineSitesKm: number
  contingencyPct: number
  insurancePct: number
  insuranceDomestic: boolean
  perDiemOnLocalAudits: boolean
  defaultHotelRate: number
  defaultPerDiem: number
  flightBaseFare: number
  flightPerKm: number
  premiumEconomyMultiplier: number
  businessMultiplier: number
  liveWindowDays: number
  bookingHorizonDays: number
  benchmarkAnnualIncreasePct: number
  quoteValidityDays: number
  adjustmentApprovalThreshold: number
  bookingLeadDays: number
  maxExtraHoursForSaving: number
}

export interface TravelCountryRate {
  country: string
  perDiem: number
  hotelCap: number
  visaFee: number
  note?: string
  /** `true` while the value is an unconfirmed sample figure. */
  sample: boolean
}

export interface TravelCityCap {
  cityKey: string
  hotelCap: number
  sample: boolean
}

export interface TravelRailRoute {
  from: string
  to: string
  fare: number
  hours: number
  operator: string
  sample: boolean
}

export interface TravelPolicyInput {
  currency: string
  settings: TravelPolicySettings
  countries: TravelCountryRate[]
  cities: TravelCityCap[]
  railRoutes: TravelRailRoute[]
}

export interface TravelCity {
  key: string
  name: string
  nameAr: string
  country: string
  iata: string | null
  latitude: number
  longitude: number
}
