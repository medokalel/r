const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MOBILE_REGEX = /^\d{8,15}$/

export const MIN_PASSWORD_LENGTH = 8

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length > 0 && EMAIL_REGEX.test(trimmed)
}

export function isValidPassword(value: string): boolean {
  return value.length >= MIN_PASSWORD_LENGTH
}

export function isValidMobile(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length > 0 && MOBILE_REGEX.test(trimmed)
}

export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password.length > 0 && password === confirmPassword
}
