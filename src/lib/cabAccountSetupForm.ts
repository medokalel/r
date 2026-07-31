import { isValidPassword, passwordsMatch } from '@/lib/authValidation'

export interface CabAccountSetupForm {
  adminName: string
  adminRole: string
  adminEmail: string
  password: string
  confirmPassword: string
  agreePrivacy: boolean
}

export const emptyCabAccountSetupForm: CabAccountSetupForm = {
  adminName: '',
  adminRole: '',
  adminEmail: '',
  password: '',
  confirmPassword: '',
  agreePrivacy: false,
}

export function isCabAccountSetupComplete(form: CabAccountSetupForm): boolean {
  return Boolean(
    form.adminName.trim() &&
      form.adminRole &&
      form.adminEmail.trim() &&
      isValidPassword(form.password) &&
      passwordsMatch(form.password, form.confirmPassword) &&
      form.agreePrivacy
  )
}