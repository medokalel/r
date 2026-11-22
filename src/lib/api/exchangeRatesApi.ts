export interface UsdRate {
  rate: number
  /** When the provider last refreshed its daily rates (ISO date). */
  date: string
}

/**
 * Free, keyless daily rates from open.er-api.com (about 166 currencies).
 * ponytail: single provider and no cache; add Frankfurter as a fallback if its uptime becomes a problem.
 */
export async function fetchUsdRate(currency: string): Promise<UsdRate> {
  const code = currency.trim().toUpperCase()
  const response = await fetch('https://open.er-api.com/v6/latest/USD')
  if (!response.ok) throw new Error(`Exchange rates unavailable (${response.status})`)
  const body = (await response.json()) as { result?: string; time_last_update_utc?: string; rates?: Record<string, number> }
  const rate = body.rates?.[code]
  if (body.result !== 'success' || typeof rate !== 'number') throw new Error(`No rate for ${code}`)
  return { rate, date: new Date(body.time_last_update_utc ?? Date.now()).toISOString().slice(0, 10) }
}
