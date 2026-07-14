import { cn } from '@/lib/utils'

const EASTERN_ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹'

/** Force Western (0-9) numerals for display in Arabic UI. */
export const englishDigitsClassName = 'english-digits'

export const englishDigitsLtrClassName = 'english-digits english-digits-ltr'

export function toEnglishDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (char) => {
      const index = EASTERN_ARABIC_DIGITS.indexOf(char)
      return index >= 0 ? String(index) : char
    })
    .replace(/[۰-۹]/g, (char) => {
      const index = PERSIAN_DIGITS.indexOf(char)
      return index >= 0 ? String(index) : char
    })
}

export function englishDigitsCn(...classes: Array<string | undefined | false>) {
  return cn(englishDigitsClassName, ...classes)
}
