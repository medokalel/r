/**
 * Estimates the travel cost of an audit from the CAB's saved travel policy.
 *
 * Pure function: policy + route + team size + audit days in, cost lines out. The policy comes from
 * GET /cab/travel-policy; nothing is stored. Each rule below uses a field of that policy.
 */
import type { TravelPolicyInput } from './travelPolicyTypes.ts'

export interface TravelPlace {
  key: string
  name: string
  /** ISO 3166-1 alpha-2 country code. */
  country: string
  latitude: number
  longitude: number
}

export type TravelMode = 'local' | 'train' | 'drive' | 'flight'

export type TravelLineKey =
  | 'transport'
  | 'airportTransfers'
  | 'localTransport'
  | 'accommodation'
  | 'perDiem'
  | 'visa'
  | 'contingency'
  | 'insurance'

export interface TravelEstimateLine {
  key: TravelLineKey
  amount: number
}

export interface TravelEstimate {
  currency: string
  mode: TravelMode
  distanceKm: number
  /** One-way door-to-door travel time for the chosen mode. */
  travelHours: number
  nights: number
  lines: TravelEstimateLine[]
  subtotal: number
  total: number
}

// ponytail: straight-line distance and a fixed cruise speed; swap in a routing/flight-time API if estimates drift.
const EARTH_RADIUS_KM = 6371
const FLIGHT_SPEED_KMH = 800

export function distanceKm(a: TravelPlace, b: TravelPlace): number {
  const rad = (degrees: number) => (degrees * Math.PI) / 180
  const dLat = rad(b.latitude - a.latitude)
  const dLon = rad(b.longitude - a.longitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

const round2 = (value: number) => Math.round(value * 100) / 100

export function estimateTravelCost(input: {
  policy: TravelPolicyInput
  from: TravelPlace
  to: TravelPlace
  /** People travelling. */
  auditors: number
  /** Audit days on site. */
  auditDays: number
}): TravelEstimate {
  const { policy, from, to } = input
  const s = policy.settings
  const auditors = Math.max(Math.floor(input.auditors), 0)
  const auditDays = Math.max(input.auditDays, 0)
  const km = distanceKm(from, to)
  const roadKm = km * s.roadFactor
  const cars = Math.ceil(auditors / s.passengersPerCar)
  const international = from.country !== to.country
  const country = policy.countries.find((row) => row.country === to.country)
  const lines: TravelEstimateLine[] = []
  const add = (key: TravelLineKey, amount: number) => amount > 0 && lines.push({ key, amount: round2(amount) })

  // Same-area audits: no trip, no hotel.
  if (km <= s.localRadiusKm) {
    add('localTransport', s.localTransportPerDay * auditDays * cars)
    if (s.perDiemOnLocalAudits) add('perDiem', (country?.perDiem ?? s.defaultPerDiem) * auditDays * auditors)
    return finish(policy, 'local', km, 0, 0, lines, international)
  }

  // Candidate ways to get there: the cheapest one the policy allows wins.
  const driveHours = roadKm / s.groundSpeedKmh
  const flightHours = km / FLIGHT_SPEED_KMH + s.airportOverheadHours
  const rail = policy.railRoutes.find((r) => (r.from === from.key && r.to === to.key) || (r.from === to.key && r.to === from.key))
  const options: { mode: TravelMode; cost: number; hours: number; transfers: number }[] = []
  if (rail) options.push({ mode: 'train', cost: rail.fare * 2 * auditors, hours: rail.hours, transfers: 0 })
  if (roadKm < s.carVsFlightKm && driveHours <= s.maxGroundHours) {
    const tripDays = auditDays + 1
    options.push({ mode: 'drive', cost: cars * (s.carRentalPerDay * tripDays + s.fuelPerKm * roadKm * 2), hours: driveHours, transfers: 0 })
  }
  const cabinMultiplier =
    flightHours <= s.economyMaxFlightHours ? 1 : s.longFlightCabin === 'BUSINESS' ? s.businessMultiplier : s.longFlightCabin === 'PREMIUM_ECONOMY' ? s.premiumEconomyMultiplier : 1
  options.push({
    mode: 'flight',
    cost: (s.flightBaseFare + s.flightPerKm * km) * cabinMultiplier * 2 * auditors,
    hours: flightHours,
    transfers: s.airportTransferDefault * cars * 4,
  })
  const best = options.reduce((a, b) => (b.cost + b.transfers < a.cost + a.transfers ? b : a))

  add('transport', best.cost)
  add('airportTransfers', best.transfers)
  add('localTransport', best.mode === 'drive' ? 0 : s.localTransportPerDay * auditDays * cars)

  // Hotel: the audit nights, plus a night before / after when the trip is long enough to need one.
  const nights = Math.max(auditDays - 1, 0) + (best.hours > s.earlyArrivalThresholdHours ? 1 : 0) + (best.hours > s.lateReturnThresholdHours ? 1 : 0)
  const cityCap = policy.cities.find((row) => row.cityKey === to.key)
  const hotelRate = cityCap?.hotelCap ?? country?.hotelCap ?? s.defaultHotelRate // city cap beats country cap beats the default
  add('accommodation', hotelRate * nights * auditors)
  add('perDiem', (country?.perDiem ?? s.defaultPerDiem) * (nights + 1) * auditors)
  if (international) add('visa', (country?.visaFee ?? 0) * auditors)

  return finish(policy, best.mode, km, best.hours, nights, lines, international)
}

function finish(
  policy: TravelPolicyInput,
  mode: TravelMode,
  km: number,
  travelHours: number,
  nights: number,
  lines: TravelEstimateLine[],
  international: boolean,
): TravelEstimate {
  const s = policy.settings
  const subtotal = round2(lines.reduce((sum, line) => sum + line.amount, 0))
  const extras: TravelEstimateLine[] = []
  if (s.contingencyPct > 0 && subtotal > 0) extras.push({ key: 'contingency', amount: round2((subtotal * s.contingencyPct) / 100) })
  if (s.insurancePct > 0 && subtotal > 0 && (international || s.insuranceDomestic)) extras.push({ key: 'insurance', amount: round2((subtotal * s.insurancePct) / 100) })
  const all = [...lines, ...extras]
  return {
    currency: policy.currency,
    mode,
    distanceKm: Math.round(km),
    travelHours: Math.round(travelHours * 10) / 10,
    nights,
    lines: all,
    subtotal,
    total: round2(all.reduce((sum, line) => sum + line.amount, 0)),
  }
}

export type AuditTravelMode = 'ON_SITE' | 'HYBRID' | 'REMOTE'

export interface AuditTravelResult {
  currency: string
  lines: TravelEstimateLine[]
  total: number
  bySite: { name: string; total: number }[]
}

/**
 * Travel cost of a whole audit: every site that has on-site work, for every group of auditors that
 * travel from the same city. Remote audits cost nothing. The audit days are shared equally by the
 * on-site sites; auditors from one city share cars and transfers.
 * ponytail: equal split of days per site; use the agenda's days per site if sites differ a lot.
 */
export function estimateAuditTravel(input: {
  policy: TravelPolicyInput
  mode: AuditTravelMode
  auditDays: number
  sites: { name: string; place: TravelPlace; onsite: boolean }[]
  team: { base: TravelPlace }[]
}): AuditTravelResult {
  const { policy, mode } = input
  const visited = mode === 'REMOTE' ? [] : input.sites.filter((site) => mode === 'ON_SITE' || site.onsite)
  const groups = new Map<string, { base: TravelPlace; count: number }>()
  for (const member of input.team) {
    const group = groups.get(member.base.key)
    if (group) group.count += 1
    else groups.set(member.base.key, { base: member.base, count: 1 })
  }

  const byLine = new Map<TravelLineKey, number>()
  const bySite: AuditTravelResult['bySite'] = []
  const daysPerSite = visited.length ? input.auditDays / visited.length : 0
  for (const site of visited) {
    let siteTotal = 0
    for (const { base, count } of groups.values()) {
      const estimate = estimateTravelCost({ policy, from: base, to: site.place, auditors: count, auditDays: daysPerSite })
      siteTotal += estimate.total
      for (const line of estimate.lines) byLine.set(line.key, (byLine.get(line.key) ?? 0) + line.amount)
    }
    bySite.push({ name: site.name, total: round2(siteTotal) })
  }
  const lines = [...byLine].map(([key, amount]) => ({ key, amount: round2(amount) }))
  return { currency: policy.currency, lines, total: round2(lines.reduce((sum, line) => sum + line.amount, 0)), bySite }
}
