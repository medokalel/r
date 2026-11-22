import { authorizedRequest } from '@/lib/api/authorizedClient'
import type { TravelPolicyInput } from '@/lib/travelPolicyTypes'

/** The CAB's saved travel policy, or null when it has not saved one yet. */
export function getTravelPolicy(): Promise<TravelPolicyInput | null> {
  return authorizedRequest('/cab/travel-policy')
}

/** Creates or replaces the whole policy. */
export function saveTravelPolicy(policy: TravelPolicyInput): Promise<TravelPolicyInput> {
  return authorizedRequest('/cab/travel-policy', { method: 'PUT', body: JSON.stringify(policy) })
}
