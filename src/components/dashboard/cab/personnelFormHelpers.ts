import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js'
import type { CountryCode } from '@/components/auth/CountryCodeSelect'
import type { UploadedDocumentFile } from '@/components/dashboard/DocumentUploadField'
import type { CabEmployeeQualification } from '@/lib/api/cabEmployeesApi'
import { resolvePublicAssetUrl } from '@/lib/publicAssetUrl'
import type {
  StagedOrSavedDeclaration,
  StagedOrSavedRelationship,
} from '@/components/dashboard/cab/PersonnelImpartialitySection'
import type { StagedOrSavedAvailabilityPeriod } from '@/components/dashboard/cab/PersonnelAvailabilitySection'

export const QUALIFICATION_ACCEPT = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx'
export const MAX_QUALIFICATION_BYTES = 20 * 1024 * 1024
export const STAGED_QUALS_STORAGE_KEY = 'icasco_cab_new_person_staged_quals_v1'
export const STAGED_IMPARTIALITY_STORAGE_KEY = 'icasco_cab_new_person_staged_impartiality_v1'
export const STAGED_AVAILABILITY_STORAGE_KEY = 'icasco_cab_new_person_staged_availability_v1'

export const SUGGESTED_CATEGORIES = [
  'Auditor Certificates',
  'Academic Degrees',
  'Training Certificates',
  'CV & Experience Records',
] as const

export const AUDIT_LANGUAGE_OPTIONS = [
  { value: 'Arabic', key: 'arabic', defaultLabel: 'Arabic' },
  { value: 'English', key: 'english', defaultLabel: 'English' },
  { value: 'French', key: 'french', defaultLabel: 'French' },
  { value: 'Spanish', key: 'spanish', defaultLabel: 'Spanish' },
  { value: 'German', key: 'german', defaultLabel: 'German' },
  { value: 'Turkish', key: 'turkish', defaultLabel: 'Turkish' },
  { value: 'Chinese', key: 'chinese', defaultLabel: 'Chinese' },
  { value: 'Urdu', key: 'urdu', defaultLabel: 'Urdu' },
  { value: 'Hindi', key: 'hindi', defaultLabel: 'Hindi' },
  { value: 'Russian', key: 'russian', defaultLabel: 'Russian' },
  { value: 'Italian', key: 'italian', defaultLabel: 'Italian' },
  { value: 'Portuguese', key: 'portuguese', defaultLabel: 'Portuguese' },
] as const

export interface QualificationCategoryItem {
  /** Local or backend UUID */
  id: string
  /** True when the category exists on the backend for an existing employee */
  isPersisted: boolean
  /** True when explicitly created by the user (so even empty categories are submitted on employee creation) */
  isExplicit: boolean
  name: string
  documents: Array<
    UploadedDocumentFile & {
      /** Present when uploaded to staging via POST /cab-employees/qualifications/upload */
      uploadId?: string
    }
  >
}

export const DEFAULT_QUAL_CATEGORIES: QualificationCategoryItem[] = [
  {
    id: 'default-auditor-certificates',
    isPersisted: false,
    isExplicit: false,
    name: 'Auditor Certificates',
    documents: [],
  },
]

export interface PersonnelFormState {
  name: string
  role: string
  email: string
  phoneCountryCode: CountryCode
  phone: string
  avatarUrl: string
  baseCountry: string
  baseCity: string
  employmentStartDate: string
  employmentEndDate: string
  currentlyWorksHere: boolean
  iafCodes: string[]
  auditLanguages: string[]
  qualifications: string
  country: string
  schemes: string[]
  authorizedScope: string
  expiryDate: string
}

export interface StagedImpartialityState {
  declarations: StagedOrSavedDeclaration[]
  relationships: StagedOrSavedRelationship[]
}

export function loadStagedImpartialityFromStorage(): StagedImpartialityState {
  try {
    const raw = localStorage.getItem(STAGED_IMPARTIALITY_STORAGE_KEY)
    if (!raw) return { declarations: [], relationships: [] }
    const parsed = JSON.parse(raw)
    return {
      declarations: Array.isArray(parsed?.declarations) ? parsed.declarations : [],
      relationships: Array.isArray(parsed?.relationships) ? parsed.relationships : [],
    }
  } catch {
    return { declarations: [], relationships: [] }
  }
}

export function loadStagedAvailabilityFromStorage(): StagedOrSavedAvailabilityPeriod[] {
  try {
    const raw = localStorage.getItem(STAGED_AVAILABILITY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function loadStagedCategoriesFromStorage(): QualificationCategoryItem[] {
  try {
    const raw = localStorage.getItem(STAGED_QUALS_STORAGE_KEY)
    if (!raw) return DEFAULT_QUAL_CATEGORIES
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((cat: QualificationCategoryItem) => ({
        ...cat,
        documents: Array.isArray(cat.documents)
          ? cat.documents.map((doc) => ({
              ...doc,
              url: doc.url ? resolvePublicAssetUrl(doc.url) : doc.url,
            }))
          : [],
      }))
    }
  } catch {
    // Ignore storage errors
  }
  return DEFAULT_QUAL_CATEGORIES
}

export function normalizeCategoryName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function fromIsoDate(value?: string | null): Date | undefined {
  if (!value) return undefined
  const datePart = value.split('T')[0]
  const parsed = new Date(`${datePart}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

export function includeSavedOptions(
  options: { value: string; label: string }[],
  saved: string[],
) {
  return [
    ...options,
    ...[...new Set(saved)]
      .filter((value) => value && !options.some((option) => option.value === value))
      .map((value) => ({ value, label: value })),
  ]
}

export function parsePersonPhone(raw?: string | null): {
  countryCode: CountryCode
  phone: string
} {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return { countryCode: 'SA', phone: '' }

  const parsed = parsePhoneNumberFromString(trimmed)
  if (parsed?.country) {
    return {
      countryCode: parsed.country as CountryCode,
      phone: parsed.nationalNumber,
    }
  }

  const parts = trimmed.split(/\s+/)
  if (parts.length > 1 && parts[0].startsWith('+')) {
    const dialDigits = parts[0].replace(/\D/g, '')
    const match = getCountries().find((c) => getCountryCallingCode(c) === dialDigits)
    if (match) {
      return {
        countryCode: match as CountryCode,
        phone: parts.slice(1).join('').replace(/\D/g, ''),
      }
    }
  }

  if (trimmed.startsWith('+')) {
    for (const c of getCountries()) {
      const dial = `+${getCountryCallingCode(c)}`
      if (trimmed.startsWith(dial)) {
        return {
          countryCode: c as CountryCode,
          phone: trimmed.slice(dial.length).replace(/\D/g, ''),
        }
      }
    }
  }

  return { countryCode: 'SA', phone: trimmed.replace(/\D/g, '') }
}

export function mapBackendQualificationToFile(
  q: CabEmployeeQualification,
  locale: string,
): UploadedDocumentFile {
  return {
    id: q.id,
    name: q.originalName || q.fileName || q.documentType || 'qualification.pdf',
    sizeLabel: formatFileSize(q.fileSize),
    dateLabel: q.uploadedAt
      ? new Intl.DateTimeFormat(locale, {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        }).format(new Date(q.uploadedAt))
      : undefined,
    url: resolvePublicAssetUrl(q.fileUrl),
  }
}
