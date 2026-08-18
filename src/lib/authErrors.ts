import type { TFunction } from 'i18next'
import { ApiError } from '@/lib/api/client'

export interface RegistrationAuthError {
  message: string
  emailAlreadyRegistered: boolean
}

export function getRegistrationAuthError(error: unknown, t: TFunction): RegistrationAuthError {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return {
        message: t('register.emailAlreadyRegistered'),
        emailAlreadyRegistered: true,
      }
    }

    if (error.status === 429) {
      return {
        message: error.message || t('errors.rateLimit.description'),
        emailAlreadyRegistered: false,
      }
    }

    return {
      message: error.message,
      emailAlreadyRegistered: false,
    }
  }

  return {
    message: t('errors.generic'),
    emailAlreadyRegistered: false,
  }
}
