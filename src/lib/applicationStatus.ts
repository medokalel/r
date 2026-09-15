import type { ApplicationRegisterStatus } from '@/lib/api/cabApplicationRegisterApi'

export type { ApplicationRegisterStatus }

/** Single source of truth for application-status badge colors — shared by
 *  every table that shows an application status (register, client register). */
export const APPLICATION_STATUS_STYLES: Record<ApplicationRegisterStatus, string> = {
  DRAFT: 'bg-[#f3f4f6] text-[#4b5563]',
  UNDER_REVIEW: 'bg-[#e0e7ff] text-[#1236a3]',
  ASSESSMENT: 'bg-[#dbeafe] text-[#1447e6]',
  APPROVED: 'bg-[#d0fae5] text-[#007a55]',
  IN_PROGRESS: 'bg-[#fef3c6] text-[#a58401]',
}

/** Maps a status to its i18n key under `cab.applicationRegister.status.*`. */
export const APPLICATION_STATUS_LABEL_KEYS: Record<ApplicationRegisterStatus, string> = {
  DRAFT: 'draft',
  UNDER_REVIEW: 'underReview',
  ASSESSMENT: 'assessment',
  APPROVED: 'approved',
  IN_PROGRESS: 'inProgress',
}