import { isValidPassword, passwordsMatch } from '@/lib/authValidation'

export interface CabAccountSetupForm {
  adminEmail: string
  password: string
  confirmPassword: string
  agreePrivacy: boolean
}

export const emptyCabAccountSetupForm: CabAccountSetupForm = {
  adminEmail: '',
  password: '',
  confirmPassword: '',
  agreePrivacy: false,
}

export function isCabAccountSetupComplete(form: CabAccountSetupForm): boolean {
  return Boolean(
    form.adminEmail.trim() &&
      isValidPassword(form.password) &&
      passwordsMatch(form.password, form.confirmPassword) &&
      form.agreePrivacy
  )
}