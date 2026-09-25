import type { ApplicationRegisterStatus } from '@/lib/api/cabApplicationRegisterApi'

export type { ApplicationRegisterStatus }

/** Single source of truth for application-status badge colors — shared by
 *  every table that shows an application status (register, client register). */
export const APPLICATION_STATUS_STYLES: Record<ApplicationRegisterStatus, string> = {
  DRAFT: 'bg-[#f3f4f6] text-[#4b5563]',
  SUBMITTED: 'bg-[#e0e7ff] text-[#1236a3]',
  UNDER_REVIEW: 'bg-[#e0e7ff] text-[#1236a3]',
  APPROVED: 'bg-[#d0fae5] text-[#007a55]',
  REJECTED: 'bg-[#fee2e2] text-[#b42318]',
}

/** Maps a status to its i18n key under `cab.applicationRegister.status.*`. */
export const APPLICATION_STATUS_LABEL_KEYS: Record<ApplicationRegisterStatus, string> = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'underReview',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}