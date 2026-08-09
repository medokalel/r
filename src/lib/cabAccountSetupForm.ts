import { isValidPassword, passwordsMatch } from '@/lib/authValidation'

export interface CabAccountSetupForm {
  password: string
  confirmPassword: string
  agreePrivacy: boolean
}

export const emptyCabAccountSetupForm: CabAccountSetupForm = {
  password: '',
  confirmPassword: '',
  agreePrivacy: false,
}

export function isCabAccountSetupComplete(form: CabAccountSetupForm): boolean {
  return Boolean(
    isValidPassword(form.password) &&
      passwordsMatch(form.password, form.confirmPassword) &&
      form.agreePrivacy
  )
}