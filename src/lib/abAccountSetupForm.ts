import { isValidPassword, passwordsMatch } from '@/lib/authValidation'

export interface AbAccountSetupForm {
  adminEmail: string
  password: string
  confirmPassword: string
  agreePrivacy: boolean
}

export const emptyAbAccountSetupForm: AbAccountSetupForm = {
  adminEmail: '',
  password: '',
  confirmPassword: '',
  agreePrivacy: false,
}

export function isAbAccountSetupComplete(form: AbAccountSetupForm): boolean {
  return Boolean(
    form.adminEmail.trim() &&
      isValidPassword(form.password) &&
      passwordsMatch(form.password, form.confirmPassword) &&
      form.agreePrivacy
  )
}