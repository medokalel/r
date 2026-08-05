import { isValidPassword, passwordsMatch } from '@/lib/authValidation'

export interface AuditeeAccountSetupForm {
  password: string
  confirmPassword: string
  agreePrivacy: boolean
}

export const emptyAuditeeAccountSetupForm: AuditeeAccountSetupForm = {
  password: '',
  confirmPassword: '',
  agreePrivacy: false,
}

export function isAuditeeAccountSetupComplete(form: AuditeeAccountSetupForm): boolean {
  return Boolean(
    isValidPassword(form.password) &&
      passwordsMatch(form.password, form.confirmPassword) &&
      form.agreePrivacy
  )
}