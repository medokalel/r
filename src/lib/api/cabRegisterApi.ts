/**
 * Data for the "Create New CAB Account" (Certification Body) registration
 * flow. The backend doesn't expose lookup endpoints for these yet, so
 * everything here is mocked — same approach as dashboardApi.ts / usersApi.ts.
 * Swap the bodies for real API calls once the backend ships them; the step
 * components themselves need no changes.
 */

export interface CabOption {
  value: string
  labelKey: string
}

// TODO: replace with a real lookup once the backend defines the CAB type taxonomy
export const CAB_TYPE_OPTIONS: CabOption[] = [
  { value: 'PRODUCT_CERTIFICATION', labelKey: 'register.cab.cabTypes.product' },
  { value: 'MANAGEMENT_SYSTEM_CERTIFICATION', labelKey: 'register.cab.cabTypes.managementSystem' },
  { value: 'PERSONNEL_CERTIFICATION', labelKey: 'register.cab.cabTypes.personnel' },
]

// TODO: replace with a real lookup once the backend defines contact roles
export const CAB_ROLE_OPTIONS: CabOption[] = [
  { value: 'OWNER', labelKey: 'register.cab.roles.owner' },
  { value: 'MANAGER', labelKey: 'register.cab.roles.manager' },
  { value: 'AUTHORIZED_REPRESENTATIVE', labelKey: 'register.cab.roles.authorizedRepresentative' },
]

// TODO: replace with GET /organizations?type=ACCREDITATION_BODY (or similar)
// once the backend exposes a way to search registered accreditation bodies —
// this is what the "Accreditation Body Name" multi-select should really query
export const MOCK_ACCREDITATION_BODIES: string[] = [
  'Elsafa Company',
  'Gulf Accreditation Center',
  'National Accreditation Body',
]

// TODO: replace with a real search endpoint once the backend can look up
// registered CAB legal names (this mock just seeds the "CAB Name" field) —
// legal/company names are kept as registered and not translated
export const MOCK_CAB_NAMES: { value: string; label: string }[] = [
  { value: 'international-food-industries', label: 'International Food Industries' },
  { value: 'big-chips', label: 'Big Chips' },
  { value: 'foods-egypt', label: 'Foods Egypt' },
]