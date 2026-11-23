// Run: node --experimental-strip-types scripts/check-travel-estimate.mjs
import assert from 'node:assert/strict'
import { distanceKm, estimateAuditTravel, estimateTravelCost } from '../src/lib/travelCostEstimate.ts'

const place = (key, country, latitude, longitude) => ({ key, name: key, country, latitude, longitude })
const riyadh = place('riyadh', 'SA', 24.7136, 46.6753)
const dammam = place('dammam', 'SA', 26.4207, 50.0888)
const jeddah = place('jeddah', 'SA', 21.5433, 39.1728)
const makkah = place('makkah', 'SA', 21.3891, 39.8579)
const cairo = place('cairo', 'EG', 30.0444, 31.2357)
const nearRiyadh = place('near', 'SA', 24.9, 46.7) // about 20 km from Riyadh

const policy = {
  currency: 'SAR',
  settings: {
    economyMaxFlightHours: 6, longFlightCabin: 'BUSINESS', carVsFlightKm: 450, maxGroundHours: 5, groundSpeedKmh: 90, roadFactor: 1.25,
    carRentalPerDay: 220, fuelPerKm: 0.3, passengersPerCar: 3, localTransportPerDay: 150, airportTransferDefault: 150, airportOverheadHours: 2.5,
    travelBufferDays: 1, earlyArrivalThresholdHours: 3, lateReturnThresholdHours: 6, localRadiusKm: 60, combineSitesKm: 150, contingencyPct: 10,
    insurancePct: 2, insuranceDomestic: false, perDiemOnLocalAudits: false, defaultHotelRate: 450, defaultPerDiem: 250, flightBaseFare: 250,
    flightPerKm: 0.45, premiumEconomyMultiplier: 1.6, businessMultiplier: 2.8, liveWindowDays: 60, bookingHorizonDays: 330,
    benchmarkAnnualIncreasePct: 5, quoteValidityDays: 14, adjustmentApprovalThreshold: 1000, bookingLeadDays: 21, maxExtraHoursForSaving: 2,
  },
  countries: [
    { country: 'SA', perDiem: 300, hotelCap: 650, visaFee: 535, note: '', sample: false },
    { country: 'EG', perDiem: 220, hotelCap: 500, visaFee: 95, note: '', sample: false },
  ],
  cities: [{ cityKey: 'dammam', hotelCap: 700, sample: false }],
  railRoutes: [{ from: 'riyadh', to: 'dammam', fare: 140, hours: 4.3, operator: 'SAR', sample: false }],
}
const line = (estimate, key) => estimate.lines.find((l) => l.key === key)?.amount ?? 0

// great-circle distance sanity: Riyadh-Dammam is roughly 390 km in a straight line
assert.ok(Math.abs(distanceKm(riyadh, dammam) - 390) < 15)

// same area: no trip, no hotel, no per diem (policy default), only local transport
const local = estimateTravelCost({ policy, from: riyadh, to: nearRiyadh, auditors: 2, auditDays: 3 })
assert.equal(local.mode, 'local')
assert.equal(line(local, 'accommodation'), 0)
assert.equal(line(local, 'localTransport'), 150 * 3 * 1)

// 65 km apart: past the local radius, short enough to drive, so the car rental is priced
const drive = estimateTravelCost({ policy, from: jeddah, to: makkah, auditors: 2, auditDays: 3 })
assert.equal(drive.mode, 'drive')
assert.ok(Math.abs(line(drive, 'transport') - (220 * 4 + 0.3 * drive.distanceKm * 1.25 * 2)) < 1, 'one car for 2 people, 4 trip days')

// a rail route in the policy is used when it is the cheapest option; city hotel cap beats country cap
const rail = estimateTravelCost({ policy, from: riyadh, to: dammam, auditors: 2, auditDays: 3 })
assert.equal(rail.mode, 'train')
assert.equal(line(rail, 'transport'), 140 * 2 * 2)
assert.equal(rail.nights, 2 + 1, '2 audit nights + night before (4.3h > 3h)')
assert.equal(line(rail, 'accommodation'), 700 * 3 * 2, 'Dammam city cap (700) over the SA country cap (650)')
assert.equal(line(rail, 'perDiem'), 300 * 4 * 2)
assert.equal(line(rail, 'visa'), 0, 'domestic: no visa')
assert.equal(line(rail, 'insurance'), 0, 'domestic insurance is off in this policy')
assert.equal(line(rail, 'contingency'), Math.round(rail.subtotal * 10) / 100)

// international: flight, visa for each auditor, insurance applies, totals add up
const abroad = estimateTravelCost({ policy, from: riyadh, to: cairo, auditors: 2, auditDays: 2 })
assert.equal(abroad.mode, 'flight')
assert.equal(line(abroad, 'visa'), 95 * 2)
assert.ok(line(abroad, 'insurance') > 0)
assert.equal(abroad.total, Math.round(abroad.lines.reduce((sum, l) => sum + l.amount, 0) * 100) / 100)

// turning the policy's domestic insurance on adds it to the domestic trip
const insured = estimateTravelCost({ policy: { ...policy, settings: { ...policy.settings, insuranceDomestic: true } }, from: riyadh, to: dammam, auditors: 2, auditDays: 3 })
assert.ok(line(insured, 'insurance') > 0)

// whole audit: two sites, auditors from two cities; totals are the sum of the parts
const site = (name, place, onsite = true) => ({ name, place, onsite })
const team = [{ base: riyadh }, { base: riyadh }, { base: jeddah }]
const audit = estimateAuditTravel({ policy, mode: 'ON_SITE', auditDays: 4, sites: [site('A', dammam), site('B', cairo)], team })
assert.deepEqual(audit.bySite.map((s) => s.name), ['A', 'B'])
assert.equal(audit.total, Math.round(audit.bySite.reduce((sum, s) => sum + s.total, 0) * 100) / 100)
assert.equal(audit.total, Math.round(audit.lines.reduce((sum, l) => sum + l.amount, 0) * 100) / 100)
const alone = estimateTravelCost({ policy, from: riyadh, to: dammam, auditors: 2, auditDays: 2 })
const onlyRiyadh = estimateAuditTravel({ policy, mode: 'ON_SITE', auditDays: 2, sites: [site('A', dammam)], team: [{ base: riyadh }, { base: riyadh }] })
assert.equal(onlyRiyadh.total, alone.total, 'one group, one site equals the single estimate')
// hybrid only counts the sites marked on site; remote costs nothing
const hybrid = estimateAuditTravel({ policy, mode: 'HYBRID', auditDays: 2, sites: [site('A', dammam), site('B', cairo, false)], team })
assert.deepEqual(hybrid.bySite.map((s) => s.name), ['A'])
const remote = estimateAuditTravel({ policy, mode: 'REMOTE', auditDays: 2, sites: [site('A', dammam)], team })
assert.equal(remote.total, 0)
assert.deepEqual(remote.bySite, [])

console.log('travel estimate: all checks passed')
