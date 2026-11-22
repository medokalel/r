import { TRAVEL_CITIES_MOCK } from '@/lib/api/travelPolicyMockData'
import type { TravelPlace } from '@/lib/travelCostEstimate'
import type { TravelCity } from '@/lib/travelPolicyTypes'

export interface TravelCityOption {
  value: string
  label: string
}

/**
 * Every city in the `country-state-city` dataset as a searchable option, loaded on demand
 * (it is ~150k rows). Keys are lowercase `country:state:name` so they survive the API's
 * lowercasing. Curated cities keep their own short keys and are not repeated here.
 */
export async function fetchAllTravelCityOptions(
  curated: { name: string; country: string }[]
): Promise<TravelCityOption[]> {
  const { City } = await import('country-state-city')
  const curatedNames = new Set(curated.map((city) => `${city.country}:${city.name}`.toLowerCase()))
  const seen = new Set<string>()
  const options: TravelCityOption[] = []

  for (const city of City.getAllCities()) {
    const key = `${city.countryCode}:${city.stateCode}:${city.name}`.toLowerCase()
    if (seen.has(key) || curatedNames.has(`${city.countryCode}:${city.name}`.toLowerCase())) continue
    seen.add(key)
    options.push({ value: key, label: `${city.name} (${city.countryCode})` })
  }
  return options.sort((a, b) => (a.label < b.label ? -1 : a.label > b.label ? 1 : 0))
}

const toPlace = (city: { name: string; countryCode: string; stateCode: string; latitude?: string | null; longitude?: string | null }): TravelPlace => ({
  key: `${city.countryCode}:${city.stateCode}:${city.name}`.toLowerCase(),
  name: city.name,
  country: city.countryCode,
  latitude: Number(city.latitude),
  longitude: Number(city.longitude),
})

const curatedPlace = (city: TravelCity): TravelPlace => ({
  key: city.key,
  name: city.name,
  country: city.country,
  latitude: city.latitude,
  longitude: city.longitude,
})

/** A city with its country and coordinates, from a key the travel policy page uses (curated or `country:state:name`). */
export async function resolveTravelCity(key: string): Promise<TravelPlace | null> {
  const curated = TRAVEL_CITIES_MOCK.find((city) => city.key === key)
  if (curated) return curatedPlace(curated)
  const country = key.split(':')[0]?.toUpperCase()
  if (!country) return null
  const { City } = await import('country-state-city')
  const found = City.getCitiesOfCountry(country)?.find((city) => toPlace(city).key === key)
  return found ? toPlace(found) : null
}

/** First city called `name`, preferring the curated list; `country` (ISO code) narrows the dataset search. */
export async function findTravelCityByName(name: string, country?: string): Promise<TravelPlace | null> {
  const wanted = name.trim().toLowerCase()
  if (!wanted) return null
  const curated = TRAVEL_CITIES_MOCK.find(
    (city) => (city.name.toLowerCase() === wanted || city.nameAr === name.trim()) && (!country || city.country === country.toUpperCase()),
  )
  if (curated) return curatedPlace(curated)
  if (!country) return null
  const { City } = await import('country-state-city')
  const found = City.getCitiesOfCountry(country.toUpperCase())?.find((city) => city.name.toLowerCase() === wanted)
  return found ? toPlace(found) : null
}
