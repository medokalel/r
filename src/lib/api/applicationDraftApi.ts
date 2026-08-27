/**
 * Mock option catalogs + client lookup for the CAB "Application Draft" form.
 * The backend doesn't expose lookup endpoints for these yet — same approach
 * as clientRegistrationApi.ts / cabRegisterApi.ts. Swap for real API calls
 * once the backend ships them.
 */

// TODO: replace with a real lookup once the backend defines application types
export const APPLICATION_TYPE_OPTIONS: string[] = [
  'Initial Certification',
  'Recertification',
  'Scope Extension',
  'Transfer Certification',
]

// TODO: replace with a real lookup once the backend defines the standards catalog
export const STANDARD_OPTIONS: string[] = [
  'ISO 9001:2015 - Quality Management',
  'ISO 14001:2015 - Environmental Management',
  'ISO 45001:2018 - Occupational Health & Safety',
  'ISO 27001:2022 - Information Security',
  'ISO 22000:2018 - Food Safety Management',
]

// TODO: replace with a real lookup once the backend defines applicable schemes/programs
export const APPLICABLE_SCHEME_OPTIONS: string[] = ['IAF MD 22:2023', 'IAF MD 1:2018', 'IAF MD 5:2019']

// TODO: replace with GET /organizations?type=ACCREDITATION_BODY (or similar)
// once the backend exposes a way to search registered accreditation bodies
export const ACCREDITATION_BODY_OPTIONS: string[] = [
  'Emirates International',
  'Elsafa Company',
  'Gulf Accreditation Center',
  'National Accreditation Body',
]

// TODO: replace with a real lookup once the backend defines supported audit languages
export const AUDIT_LANGUAGE_OPTIONS: string[] = ['English', 'Arabic', 'French']

// TODO: replace with the ID returned once the backend assigns one on draft
// creation — matches the APP-xxxx reference already shown in the breadcrumb
// this page is reached from (see MOCK_CLIENT below).
export const MOCK_DRAFT_APPLICATION_ID = 'APP-2025-0086'

export interface DraftClientSummary {
  clientId: string
  legalEntityName: string
  tradingName: string
  organizationType: string
  country: string
  registrationNumber: string
  isRegistered: boolean
}

// TODO: replace with GET /clients/:id once the backend exposes client lookup —
// this mocks the client the application draft is being created for (reached
// via Home > Applications > APP-xxxx > Application Draft).
const MOCK_CLIENT: DraftClientSummary = {
  clientId: 'CLI-2025-0148',
  legalEntityName: 'GreenLeaf Pvt. Ltd.',
  tradingName: 'GreenLeaf',
  organizationType: 'Private Limited Company',
  country: 'Cairo',
  registrationNumber: 'U131200UP2015PTC018148',
  isRegistered: true,
}

export function getDraftClientSummary(): Promise<DraftClientSummary> {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_CLIENT), 300))
}

export interface StandardSchemaOption {
  value: string
  name: string
  /** e.g. "Quality Management System" — auto-filled once a standard is picked. */
  certificationType: string
}

// TODO: replace with a real lookup once the backend exposes the standards/schemas catalog
export const STANDARD_SCHEMA_OPTIONS: StandardSchemaOption[] = [
  { value: 'ISO_9001_2015', name: 'ISO 9001:2015', certificationType: 'Quality Management System' },
  { value: 'ISO_14001_2015', name: 'ISO 14001:2015', certificationType: 'Environmental Management System' },
  {
    value: 'ISO_45001_2018',
    name: 'ISO 45001:2018',
    certificationType: 'Occupational Health & Safety Management System',
  },
  { value: 'ISO_27001_2022', name: 'ISO 27001:2022', certificationType: 'Information Security Management System' },
  { value: 'ISO_22000_2018', name: 'ISO 22000:2018', certificationType: 'Food Safety Management System' },
]

export interface IhfCodeOption {
  value: string
  /** e.g. "Engineering", "Other Services", "Construction" */
  category: string
}

// TODO: replace with a real lookup once the backend exposes the IHF (IAF/EA) code catalog
export const IHF_CODE_OPTIONS: IhfCodeOption[] = [
  { value: 'GP 34', category: 'Engineering' },
  { value: 'GP 19', category: 'Other Services' },
  { value: 'GP 24', category: 'Construction' },
  { value: 'GP 28', category: 'Health & Social Work' },
  { value: 'GP 33', category: 'Manufacturing' },
]

// TODO: replace with a real lookup once the backend defines site types
export const SITE_TYPE_OPTIONS: string[] = [
  'Head Office',
  'Manufacturing Site',
  'Warehouse',
  'Branch Office',
  'Laboratory',
]

// TODO: replace with a real lookup once the backend defines the activity catalog
export const SITE_ACTIVITY_OPTIONS: string[] = [
  'Management',
  'Sales & Marketing',
  'Design & Development',
  'Packing',
  'Manufacturing',
  'Assembly',
  'Quality Control',
  'Machining',
  'Welding',
  'Human Resources',
  'Testing',
]

// TODO: replace with a real lookup once the backend defines multi-site sampling roles
export const SITE_MULTI_SITE_ROLE_OPTIONS: string[] = [
  'Central Office',
  'Site',
  'Temporary Site',
]

// Fixed set — mirrors the "Site Indicators" legend, so keep the two lists in sync.
export const TRAVEL_REQUIREMENT_OPTIONS: string[] = [
  'Airplane Required',
  'Train Required',
  'Airplane & Train Required',
]

// TODO: replace with a real lookup once the backend defines permit/access types
export const PERMIT_ACCESS_OPTIONS: string[] = [
  'Not Required',
  'Visitor Permit',
  'Security Clearance',
  'Escort Required',
]

// TODO: replace with a real lookup once the backend defines travel time bands
export const ESTIMATED_TRAVEL_TIME_OPTIONS: string[] = [
  'Less than 1 hour',
  '1 - 3 hours',
  '3 - 6 hours',
  'More than 6 hours',
]

// TODO: replace with a real lookup once the backend defines audit types
export const TYPE_OF_AUDIT_OPTIONS: string[] = ['Stage 1', 'Stage 2', 'Surveillance', 'Recertification']

// TODO: replace with a real lookup once the backend defines surveillance cycles
export const SURVEILLANCE_CYCLE_OPTIONS: string[] = ['Annual', 'Semi-Annual', 'Biennial']