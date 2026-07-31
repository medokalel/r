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
  { value: 'INSPECTION_BODY', labelKey: 'register.cab.cabTypes.inspectionBody' },
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

export interface ScopeStandardOption {
  value: string
  name: string
  description: string
}

/** Schemes like Management System Certification: standards shown directly. */
export interface FlatSchemeCatalog {
  kind: 'flat'
  sectionTitle: string
  standards: ScopeStandardOption[]
  defaultSelected: string[]
}

/** Schemes like Product Certification: pick a scheme owner first (e.g. SASO), then its standards. */
export interface SchemeOwnerOption {
  value: string
  label: string
  sectionTitle: string
  standards: ScopeStandardOption[]
  defaultSelected: string[]
}

export interface OwnerBasedSchemeCatalog {
  kind: 'byOwner'
  owners: SchemeOwnerOption[]
}

export type SchemeStandardsCatalog = FlatSchemeCatalog | OwnerBasedSchemeCatalog

// TODO: replace with a real lookup once the backend exposes the applicable
// standards catalog per scheme (Step 2, "Scope & Modules"). Only Management
// System Certification and Product Certification have real catalogs for
// now, matching the design — other scheme types (Personnel Certification,
// Inspection Body) fall back to an empty-state message until their
// catalogs are defined. Standard/owner names are kept as published, not
// translated (same convention as MOCK_CAB_NAMES above).
export const SCOPE_STANDARDS_BY_TYPE: Record<string, SchemeStandardsCatalog> = {
  MANAGEMENT_SYSTEM_CERTIFICATION: {
    kind: 'flat',
    sectionTitle: 'Applicable ISO/IEC 17021 family standards',
    standards: [
      {
        value: 'ISO_IEC_17021_1',
        name: 'ISO/IEC 17021-1',
        description: 'Requirements for bodies providing audit and certification of management systems',
      },
      {
        value: 'ISO_IEC_17021_2',
        name: 'ISO/IEC 17021-2',
        description: 'Environmental management systems competence requirements',
      },
      {
        value: 'ISO_IEC_17021_3',
        name: 'ISO/IEC 17021-3',
        description: 'Quality management systems competence requirements',
      },
      {
        value: 'ISO_IEC_17021_10',
        name: 'ISO/IEC 17021-10',
        description: 'Occupational health and safety management systems',
      },
    ],
    defaultSelected: ['ISO_IEC_17021_1', 'ISO_IEC_17021_3'],
  },
  PRODUCT_CERTIFICATION: {
    kind: 'byOwner',
    owners: [
      {
        value: 'SASO',
        label: 'SASO',
        sectionTitle: 'SASO sub-standards / categories',
        standards: [
          { value: 'SASO_QUALITY_MARK', name: 'SASO Quality Mark', description: 'Product quality mark certification' },
          { value: 'SABER_PRODUCT_COC', name: 'SABER / Product CoC', description: 'Product conformity workflow' },
          { value: 'IECEE_RECOGNITION', name: 'IECEE Recognition', description: 'Electrical products recognition' },
          { value: 'ENERGY_EFFICIENCY', name: 'Energy Efficiency', description: 'Energy performance and labeling' },
        ],
        defaultSelected: ['SASO_QUALITY_MARK', 'SABER_PRODUCT_COC', 'IECEE_RECOGNITION'],
      },
    ],
  },
}

export interface ModuleOption {
  value: string
  title: string
  description: string
}

// TODO: replace with a real lookup once the backend exposes the module
// catalog. Unlike the standards catalog above, this list is fixed — it
// doesn't change based on which schemes were chosen earlier.
export const MODULE_OPTIONS: ModuleOption[] = [
  {
    value: 'APPLICATIONS',
    title: 'Applications',
    description: 'Capture, validate, and route certification requests with a complete audit trail',
  },
  {
    value: 'AUDIT_PLANNING',
    title: 'Audit Planning',
    description: 'Plan, assign, and track audits with real-time visibility and control',
  },
  {
    value: 'CERTIFICATES',
    title: 'Certificates',
    description: 'Manage certificate lifecycles with issuance, renewal, suspension, and full control.',
  },
  {
    value: 'NONCONFORMITIES',
    title: 'Nonconformities',
    description: 'Record findings, manage corrective actions, and verify effective resolution.',
  },
  {
    value: 'REPORTS_ANALYTICS',
    title: 'Reports & Analytics',
    description: 'Drive smarter decisions with live dashboards and operational reporting tools.',
  },
  {
    value: 'CERTIFICATION',
    title: 'Certification',
    description: 'Manage certification scopes and ongoing surveillance across conformity bodies.',
  },
  {
    value: 'CLIENT_PORTAL',
    title: 'Client Portal',
    description: 'Give clients secure portals to apply, track, and download certificates.',
  },
  {
    value: 'COMPETENCE',
    title: 'Competence',
    description: 'Manage auditor and assessor competence with qualifications, training, and witnessing.',
  },
]

export const DEFAULT_SELECTED_MODULES = ['AUDIT_PLANNING', 'CERTIFICATES', 'REPORTS_ANALYTICS', 'COMPETENCE']