import { isValidPassword, passwordsMatch } from '@/lib/authValidation'

export interface AbAccountSetupForm {
  adminName: string
  adminRole: string
  adminEmail: string
  password: string
  confirmPassword: string
  agreePrivacy: boolean
}

export const emptyAbAccountSetupForm: AbAccountSetupForm = {
  adminName: '',
  adminRole: '',
  adminEmail: '',
  password: '',
  confirmPassword: '',
  agreePrivacy: false,
}

export function isAbAccountSetupComplete(form: AbAccountSetupForm): boolean {
  return Boolean(
    form.adminName.trim() &&
      form.adminRole &&
      form.adminEmail.trim() &&
      isValidPassword(form.password) &&
      passwordsMatch(form.password, form.confirmPassword) &&
      form.agreePrivacy
  )
}