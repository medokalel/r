/**
 * Sample data for the travel policy page, used directly as the page's initial
 * state (same approach as `walletMockData`) until a backend endpoint exists.
 */
import type { TravelCity, TravelPolicyInput } from '@/lib/travelPolicyTypes'

export const TRAVEL_CITIES_MOCK: TravelCity[] = [
  { key: 'riyadh', name: 'Riyadh', nameAr: 'الرياض', country: 'SA', iata: 'RUH', latitude: 24.7136, longitude: 46.6753 },
  { key: 'jeddah', name: 'Jeddah', nameAr: 'جدة', country: 'SA', iata: 'JED', latitude: 21.5433, longitude: 39.1728 },
  { key: 'makkah', name: 'Makkah', nameAr: 'مكة المكرمة', country: 'SA', iata: 'JED', latitude: 21.3891, longitude: 39.8579 },
  { key: 'madinah', name: 'Madinah', nameAr: 'المدينة المنورة', country: 'SA', iata: 'MED', latitude: 24.5247, longitude: 39.5692 },
  { key: 'dammam', name: 'Dammam', nameAr: 'الدمام', country: 'SA', iata: 'DMM', latitude: 26.4207, longitude: 50.0888 },
  { key: 'dubai', name: 'Dubai', nameAr: 'دبي', country: 'AE', iata: 'DXB', latitude: 25.2048, longitude: 55.2708 },
  { key: 'cairo', name: 'Cairo', nameAr: 'القاهرة', country: 'EG', iata: 'CAI', latitude: 30.0444, longitude: 31.2357 },
  { key: 'alexandria', name: 'Alexandria', nameAr: 'الإسكندرية', country: 'EG', iata: 'HBE', latitude: 31.2001, longitude: 29.9187 },
  { key: 'istanbul', name: 'Istanbul', nameAr: 'إسطنبول', country: 'TR', iata: 'IST', latitude: 41.0082, longitude: 28.9784 },
]

export const TRAVEL_POLICY_MOCK: TravelPolicyInput = {
  currency: 'SAR',
  settings: {
    economyMaxFlightHours: 6,
    longFlightCabin: 'BUSINESS',
    carVsFlightKm: 450,
    maxGroundHours: 5,
    groundSpeedKmh: 90,
    roadFactor: 1.25,
    carRentalPerDay: 220,
    fuelPerKm: 0.3,
    passengersPerCar: 3,
    localTransportPerDay: 150,
    airportTransferDefault: 150,
    airportOverheadHours: 2.5,
    travelBufferDays: 1,
    earlyArrivalThresholdHours: 3,
    lateReturnThresholdHours: 6,
    localRadiusKm: 60,
    combineSitesKm: 150,
    contingencyPct: 10,
    insurancePct: 2,
    insuranceDomestic: false,
    perDiemOnLocalAudits: false,
    defaultHotelRate: 450,
    defaultPerDiem: 250,
    flightBaseFare: 250,
    flightPerKm: 0.45,
    premiumEconomyMultiplier: 1.6,
    businessMultiplier: 2.8,
    liveWindowDays: 60,
    bookingHorizonDays: 330,
    benchmarkAnnualIncreasePct: 5,
    quoteValidityDays: 14,
    adjustmentApprovalThreshold: 1000,
    bookingLeadDays: 21,
    maxExtraHoursForSaving: 2,
  },
  countries: [
    { country: 'SA', perDiem: 300, hotelCap: 650, visaFee: 535, note: 'Visit e-visa incl. medical insurance (sample)', sample: true },
    { country: 'AE', perDiem: 350, hotelCap: 750, visaFee: 350, note: '30-day visit visa (sample)', sample: true },
    { country: 'EG', perDiem: 220, hotelCap: 500, visaFee: 95, note: 'Visa on arrival / e-visa (sample)', sample: true },
  ],
  cities: [
    { cityKey: 'riyadh', hotelCap: 700, sample: true },
    { cityKey: 'jeddah', hotelCap: 650, sample: true },
  ],
  railRoutes: [
    { from: 'jeddah', to: 'makkah', fare: 60, hours: 0.6, operator: 'Haramain High Speed Railway', sample: true },
    { from: 'riyadh', to: 'dammam', fare: 140, hours: 4.3, operator: 'Saudi Arabia Railways (SAR)', sample: true },
    { from: 'cairo', to: 'alexandria', fare: 25, hours: 2.5, operator: 'Egyptian National Railways', sample: true },
  ],
}
