import { useEffect, useState } from 'react'

export interface IpLocation {
  countryCode: string
  lat: number
  lng: number
}

// Module-level cache — fetch runs once for the whole app lifetime
let cached: Promise<IpLocation | null> | null = null

function fetchIpLocation(): Promise<IpLocation | null> {
  if (!cached) {
    cached = fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((d) =>
        d.latitude && d.longitude && d.country_code
          ? { countryCode: d.country_code as string, lat: d.latitude as number, lng: d.longitude as number }
          : null
      )
      .catch(() => null)
  }
  return cached
}

export function useIpLocation(): IpLocation | null {
  const [location, setLocation] = useState<IpLocation | null>(null)

  useEffect(() => {
    fetchIpLocation().then(setLocation)
  }, [])

  return location
}
