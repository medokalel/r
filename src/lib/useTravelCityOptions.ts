import { useEffect, useMemo, useState } from 'react'
import { TRAVEL_CITIES_MOCK } from '@/lib/api/travelPolicyMockData'
import { fetchAllTravelCityOptions, type TravelCityOption } from '@/lib/travelCities'

/** Searchable city options: the curated cities first, then every city of the dataset once it has loaded. */
export function useTravelCityOptions(isArabic: boolean): TravelCityOption[] {
  const [moreCities, setMoreCities] = useState<TravelCityOption[]>([])
  useEffect(() => {
    let active = true
    fetchAllTravelCityOptions(TRAVEL_CITIES_MOCK).then((options) => active && setMoreCities(options))
    return () => {
      active = false
    }
  }, [])
  return useMemo(
    () => [
      ...TRAVEL_CITIES_MOCK.map((city) => ({
        value: city.key,
        label: `${isArabic ? city.nameAr : city.name} (${city.country})`,
      })),
      ...moreCities,
    ],
    [isArabic, moreCities]
  )
}
