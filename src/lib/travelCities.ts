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
