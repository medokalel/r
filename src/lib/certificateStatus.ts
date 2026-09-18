import type { CertificateStatus } from '@/lib/api/cabCertificatesApi'

/** Single source of truth for certificate-status badge colors — mirrors
 *  APPLICATION_STATUS_STYLES so every register table in the app looks consistent. */
export const CERTIFICATE_STATUS_STYLES: Record<CertificateStatus, string> = {
  DRAFT: 'bg-[#f3f4f6] text-[#4b5563]',
  ISSUED: 'bg-[#d0fae5] text-[#007a55]',
  SUSPENDED: 'bg-[#fef3c6] text-[#a58401]',
  WITHDRAWN: 'bg-[#fee2e2] text-[#dc2626]',
}

/** Maps a status to its i18n key under `cab.certificateRegister.status.*`. */
export const CERTIFICATE_STATUS_LABEL_KEYS: Record<CertificateStatus, string> = {
  DRAFT: 'draft',
  ISSUED: 'issued',
  SUSPENDED: 'suspended',
  WITHDRAWN: 'withdrawn',
}