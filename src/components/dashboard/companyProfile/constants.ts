import type { OrgDocumentType } from '@/lib/api/organizationProfileApi'

export const SECTOR_OPTIONS = [
  'الخدمات اللوجستية',
  'إنشاءات',
  'صناعة غذائية',
  'تجارة عامة',
  'تقنية المعلومات',
  'الرعاية الصحية',
]

export const BRANCH_SECTOR_OPTIONS = [
  'تجارة عامة',
  'خدمات لوجستية',
  'إنشاءات',
  'صناعة غذائية',
  'تقنية المعلومات',
]

// Canonical API values with their translation keys
export const STATUS_OPTIONS = [
  { value: 'Active', key: 'active' },
  { value: 'Suspended', key: 'suspended' },
  { value: 'Under Establishment', key: 'underEstablishment' },
  { value: 'Liquidated', key: 'liquidated' },
] as const

export const LOGO_MAX_BYTES = 5 * 1024 * 1024
export const LOGO_ACCEPT = '.png,.jpg,.jpeg,.webp,.svg'

export const DOC_MAX_BYTES = 10 * 1024 * 1024
export const DOC_ACCEPT = '.pdf,.png,.jpg,.jpeg'

export const DOC_TYPE_BY_KEY: Record<string, OrgDocumentType> = {
  nationalAddress: 'NATIONAL_ADDRESS_CERTIFICATE',
  activityLicense: 'ACTIVITY_LICENSE',
  taxCard: 'TAX_CARD',
  commercialRegistry: 'COMMERCIAL_REGISTER',
}

export const REQUIRED_DOC_TYPES: OrgDocumentType[] = Object.values(DOC_TYPE_BY_KEY)
